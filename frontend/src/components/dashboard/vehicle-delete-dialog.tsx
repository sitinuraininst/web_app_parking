"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { vehicleApi } from "@/lib/services/vehicle";
import type { Vehicle } from "@/types";

interface VehicleDeleteDialogProps {
  /** The vehicle to delete (pass null to close) */
  vehicle: Vehicle | null;
  onClose: () => void;
}

export function VehicleDeleteDialog({ vehicle, onClose }: VehicleDeleteDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => vehicleApi.hardDelete(vehicle!.id),
    onSuccess: () => {
      toast.success("Kendaraan berhasil dihapus permanen.");
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] });
      onClose();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Gagal menghapus kendaraan.");
    },
  });

  return (
    <Dialog open={!!vehicle} onOpenChange={onClose}>
      <DialogContent className="bg-[#0c1020] border-red-500/20 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Hapus Permanen Kendaraan
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <p className="text-sm text-slate-400">
            Apakah Anda yakin ingin menghapus permanen kendaraan{" "}
            <span className="text-white font-medium">{vehicle?.plat_nomor}</span>
            {" "}({vehicle?.merek} {vehicle?.model})?
          </p>
          <p className="text-xs text-red-400 mt-2">
            Peringatan: Tindakan ini tidak dapat dibatalkan. Data kendaraan dan QR Code terkait akan dihapus/dinonaktifkan secara permanen.
          </p>
        </div>
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-white/[0.08] text-slate-300 hover:text-white cursor-pointer"
          >
            Batal
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white cursor-pointer"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menghapus...
              </>
            ) : (
              "Hapus Permanen"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
