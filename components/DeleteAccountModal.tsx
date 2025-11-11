"use client";

import { useState } from "react";
import { deleteAccount } from "@/app/actions/profile";
import { showToast } from "./Toast";
import { useRouter } from "next/navigation";

export default function DeleteAccountModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const router = useRouter();

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      showToast("Please type DELETE to confirm", "error");
      return;
    }

    setLoading(true);
    try {
      const result = await deleteAccount();
      
      if (result.ok) {
        showToast("Account deleted successfully", "success");
        // Small delay to show toast before redirect
        setTimeout(() => {
          router.push("/login");
        }, 1000);
      } else {
        showToast(result.message || "Failed to delete account", "error");
        setLoading(false);
      }
    } catch (error) {
      showToast("An unexpected error occurred", "error");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-[60]"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold mb-2">Delete Account</h3>
          <p className="text-sm text-neutral-400 mb-4">
            This action cannot be undone. This will permanently delete your account and all associated data.
          </p>
          
          <div className="mb-4">
            <label className="label mb-2">
              Type <span className="font-mono text-red-400">DELETE</span> to confirm:
            </label>
            <input
              className="input"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || confirmText !== "DELETE"}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

