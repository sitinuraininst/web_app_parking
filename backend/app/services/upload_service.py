"""
Smart Parking UMSU — File Upload Service

Business logic for uploading STNK and vehicle photos to Supabase Storage.
"""

import logging
import uuid
from datetime import datetime
from typing import Optional

from fastapi import UploadFile
from supabase import Client

from app.config import settings
from app.core.constants import DocumentType, LogAction, STORAGE_BUCKET_VEHICLES
from app.core.exceptions import (
    AuthorizationError,
    NotFoundError,
    StorageError,
    ValidationError,
)
from app.utils.validators import validate_upload_file

logger = logging.getLogger(__name__)


class UploadService:
    """Handles file uploads to Supabase Storage."""

    def __init__(self, db: Client):
        self.db = db

    async def upload_stnk(
        self,
        vehicle_id: str,
        user_id: str,
        file: UploadFile,
    ) -> dict:
        """Upload STNK photo for a registered vehicle."""
        return await self._upload_document(
            vehicle_id=vehicle_id,
            user_id=user_id,
            file=file,
            doc_type=DocumentType.STNK,
            url_field="stnk_url",
            log_action=LogAction.UPLOAD_STNK,
        )

    async def upload_vehicle_photo(
        self,
        vehicle_id: str,
        user_id: str,
        file: UploadFile,
    ) -> dict:
        """Upload vehicle photo."""
        return await self._upload_document(
            vehicle_id=vehicle_id,
            user_id=user_id,
            file=file,
            doc_type=DocumentType.FOTO_KENDARAAN,
            url_field="foto_url",
            log_action=LogAction.UPLOAD_FOTO,
        )

    async def _upload_document(
        self,
        vehicle_id: str,
        user_id: str,
        file: UploadFile,
        doc_type: DocumentType,
        url_field: str,
        log_action: LogAction,
    ) -> dict:
        """Shared upload logic for STNK and vehicle photos."""
        # Validate file
        is_valid, error_msg = validate_upload_file(file)
        if not is_valid:
            raise ValidationError(error_msg)

        # Verify vehicle ownership
        try:
            vehicle_result = (
                self.db.table("vehicles")
                .select("id, user_id, plat_nomor")
                .eq("id", vehicle_id)
                .single()
                .execute()
            )
            vehicle = vehicle_result.data
        except Exception:
            raise NotFoundError("Kendaraan tidak ditemukan.")

        if not vehicle:
            raise NotFoundError("Kendaraan tidak ditemukan.")

        if vehicle["user_id"] != user_id:
            raise AuthorizationError("Anda tidak memiliki akses ke kendaraan ini.")

        # Read file content
        try:
            file_content = await file.read()
        except Exception as e:
            logger.error(f"Failed to read file: {e}")
            raise StorageError("Gagal membaca file.")

        # Check size after reading
        if len(file_content) > settings.max_upload_size_bytes:
            raise ValidationError(
                f"Ukuran file melebihi batas maksimum {settings.max_upload_size_mb}MB."
            )

        # Determine file extension
        ext = "jpg"
        if file.content_type == "image/png":
            ext = "png"
        elif file.content_type == "image/webp":
            ext = "webp"

        # Generate storage path
        storage_path = self._generate_file_path(user_id, vehicle_id, doc_type, ext)

        # Upload to Supabase Storage
        try:
            upload_result = (
                self.db.storage
                .from_(STORAGE_BUCKET_VEHICLES)
                .upload(
                    path=storage_path,
                    file=file_content,
                    file_options={
                        "content-type": file.content_type,
                        "upsert": "true",
                    },
                )
            )
        except Exception as e:
            logger.error(f"Supabase Storage upload failed: {e}")
            raise StorageError(f"Gagal mengupload file: {e}")

        # Get public URL
        try:
            public_url_data = (
                self.db.storage
                .from_(STORAGE_BUCKET_VEHICLES)
                .get_public_url(storage_path)
            )
            public_url = public_url_data
        except Exception as e:
            logger.warning(f"Failed to get public URL: {e}")
            public_url = f"{settings.supabase_url}/storage/v1/object/public/{STORAGE_BUCKET_VEHICLES}/{storage_path}"

        # Update vehicle record with file URL
        try:
            self.db.table("vehicles").update({
                url_field: public_url,
            }).eq("id", vehicle_id).execute()
        except Exception as e:
            logger.warning(f"Failed to update vehicle {url_field}: {e}")

        # Create uploaded_documents record
        doc_record = {
            "vehicle_id": vehicle_id,
            "user_id": user_id,
            "doc_type": doc_type.value,
            "file_name": file.filename or f"{doc_type.value}.{ext}",
            "file_path": storage_path,
            "file_size": len(file_content),
            "mime_type": file.content_type,
            "bucket_name": STORAGE_BUCKET_VEHICLES,
            "public_url": public_url,
        }

        try:
            self.db.table("uploaded_documents").insert(doc_record).execute()
        except Exception as e:
            logger.warning(f"Failed to create document record: {e}")

        # Log activity
        try:
            self.db.table("activity_logs").insert({
                "user_id": user_id,
                "vehicle_id": vehicle_id,
                "action": log_action.value,
                "detail": {
                    "file_name": file.filename,
                    "file_size": len(file_content),
                    "plat_nomor": vehicle["plat_nomor"],
                },
            }).execute()
        except Exception as e:
            logger.error(f"Failed to log upload activity: {e}")

        logger.info(
            f"{doc_type.value} uploaded for vehicle {vehicle['plat_nomor']} "
            f"by user {user_id}"
        )

        return {
            "file_url": public_url,
            "file_name": file.filename,
            "file_size": len(file_content),
            "doc_type": doc_type.value,
            "vehicle_id": vehicle_id,
            "message": f"{doc_type.value.replace('_', ' ').title()} berhasil diupload.",
        }

    async def get_vehicle_documents(
        self, vehicle_id: str, user_id: str
    ) -> list[dict]:
        """Get all uploaded documents for a vehicle."""
        # Verify vehicle ownership
        try:
            vehicle_result = (
                self.db.table("vehicles")
                .select("id, user_id")
                .eq("id", vehicle_id)
                .single()
                .execute()
            )
            vehicle = vehicle_result.data
        except Exception:
            raise NotFoundError("Kendaraan tidak ditemukan.")

        if not vehicle:
            raise NotFoundError("Kendaraan tidak ditemukan.")

        if vehicle["user_id"] != user_id:
            raise AuthorizationError("Anda tidak memiliki akses ke kendaraan ini.")

        try:
            result = (
                self.db.table("uploaded_documents")
                .select("*")
                .eq("vehicle_id", vehicle_id)
                .order("created_at", desc=True)
                .execute()
            )
            return result.data or []
        except Exception as e:
            logger.error(f"Error fetching documents: {e}")
            return []

    @staticmethod
    def _generate_file_path(
        user_id: str,
        vehicle_id: str,
        doc_type: DocumentType,
        file_extension: str,
    ) -> str:
        """Generate a unique storage path for an uploaded file."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        return f"{user_id}/{vehicle_id}/{doc_type.value}_{timestamp}_{unique_id}.{file_extension}"
