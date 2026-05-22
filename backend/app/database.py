"""
Smart Parking UMSU — Supabase Database Client

Initializes and provides the Supabase client for database operations
and storage access.
"""

import logging

from supabase import create_client, Client

from app.config import settings

logger = logging.getLogger(__name__)

# ── Supabase Client Singleton ──────────────────────────────
_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    """
    Get or create the Supabase client instance.

    Uses the service_role key for full database access (bypasses RLS).
    This client should only be used server-side.
    """
    global _supabase_client

    if _supabase_client is None:
        try:
            _supabase_client = create_client(
                supabase_url=settings.supabase_url,
                supabase_key=settings.supabase_service_key,
            )
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise

    return _supabase_client


async def verify_supabase_connection() -> bool:
    """
    Verify that the Supabase connection is working.

    Returns True if the connection is healthy, False otherwise.
    Called during application startup.
    """
    try:
        client = get_supabase_client()
        # Simple query to verify connectivity
        result = client.table("parking_config").select("key").limit(1).execute()
        logger.info("Supabase connection verified successfully")
        return True
    except Exception as e:
        logger.error(f"Supabase connection verification failed: {e}")
        return False
