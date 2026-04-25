"use client";

import React from "react";
import { Icon } from "@iconify/react";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  isLoading?: boolean;
}

export default function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete this item?",
  description = "This action cannot be undone.",
  confirmText = "Delete",
  isLoading = false,
}: DeleteConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
          <Icon icon="hugeicons:delete-02" className="text-3xl text-red-500" />
        </div>

        <h3 className="text-xl font-semibold text-center text-slate-800 mb-2">
          {title}
        </h3>
        <p className="text-slate-600 text-center mb-8">{description}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 text-sm font-medium border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3.5 text-sm font-medium bg-red-600 text-white rounded-2xl hover:bg-red-700 disabled:opacity-70 transition-colors"
          >
            {isLoading ? "Deleting..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
