"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import DateInput from "@/components/ui/DateInput";

type Tx = { id: string; amount: number; type: "income"|"expense"; category: string|null; hours_spent: number|null; created_at: string; transaction_date: string|null };

export default function TransactionList({ items, onReload, onDeleted, currencySymbol = "£" }: { items: Tx[]; onReload: () => void; onDeleted?: (id: string) => void; currencySymbol?: string }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number | "">("");
  const [editType, setEditType] = useState<"income" | "expense">("income");
  const [editCategory, setEditCategory] = useState("");
  const [editHoursSpent, setEditHoursSpent] = useState<number | "">("");
  const [editTransactionDate, setEditTransactionDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Clean up deletedIds - remove IDs that are no longer in items (successfully deleted)
  // Only clean up if we're not currently deleting (to prevent race conditions)
  // IMPORTANT: Never remove an ID if the item still exists in items - that means deletion failed
  useEffect(() => {
    if (deletingId) {
      console.log("Skipping cleanup - deletion in progress for:", deletingId);
      return; // Don't clean up while a deletion is in progress
    }
    
    setDeletedIds(prev => {
      const next = new Set(prev);
      let changed = false;
      prev.forEach(id => {
        // Only remove from deletedIds if the item is confirmed gone from the database
        // If the item still exists, keep it in deletedIds (deletion may have failed)
        const itemStillExists = items.find(item => item.id === id);
        if (!itemStillExists) {
          console.log(`Transaction ${id} confirmed deleted - removing from deletedIds`);
          next.delete(id);
          changed = true;
        } else {
          // Item still exists but is in deletedIds - deletion may have failed or not propagated
          // Keep it hidden by leaving it in deletedIds
          console.warn(`Transaction ${id} still exists in database but is marked as deleted - keeping it hidden. This may indicate a deletion failure.`);
        }
      });
      return changed ? next : prev;
    });
  }, [items, deletingId]);

  // Filter out deleted items optimistically
  const visibleItems = items.filter(item => !deletedIds.has(item.id));

  if (!visibleItems?.length) {
    return (
      <div className="text-center py-8 px-4">
        <p className="text-neutral-500 text-sm mb-4">No transactions yet.</p>
        <button
          onClick={() => {
            // Scroll to form or trigger add transaction
            const formElement = document.querySelector('[data-transaction-form]');
            if (formElement) {
              formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          className="btn text-sm"
        >
          Add Transaction
        </button>
      </div>
    );
  }

  const handleDeleteClick = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleDeleteCancel = () => {
    setConfirmDeleteId(null);
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);
    setDeletingId(id);
    
    // Optimistically remove from UI immediately
    setDeletedIds(prev => new Set(prev).add(id));
    
    try {
      // Get current user to ensure we only delete their transactions
      const { data: userRes, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userRes?.user) {
        // Revert optimistic update
        setDeletedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setDeletingId(null);
        alert("You must be logged in to delete transactions");
        return;
      }
      
      // First verify the transaction exists and belongs to the user
      const { data: verifyData, error: verifyError } = await supabase
        .from("transactions")
        .select("id, user_id")
        .eq("id", id)
        .eq("user_id", userRes.user.id)
        .single();
      
      if (verifyError || !verifyData) {
        console.error("Transaction verification error:", verifyError);
        console.error("User ID:", userRes.user.id, "Transaction ID:", id);
        // Revert optimistic update
        setDeletedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setDeletingId(null);
        alert("Transaction not found or you don't have permission to delete it");
        return;
      }
      
      console.log("Transaction verified, attempting delete. User ID:", userRes.user.id, "Transaction ID:", id);
      console.log("Verify data:", verifyData);
      
      // Try deleting - RLS should ensure only the owner can delete
      // First try with user_id filter, if that fails, try without (RLS should handle it)
      let deleteError = null;
      let deleteResult = null;
      
      // Attempt 1: Delete with explicit user_id filter
      const deleteResponse = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", userRes.user.id)
        .select();
      
      deleteError = deleteResponse.error;
      deleteResult = deleteResponse.data;
      
      // If that didn't work and returned no rows, try without user_id filter
      // RLS policies should still protect it
      if (!deleteError && (!deleteResult || deleteResult.length === 0)) {
        console.log("First delete attempt returned no rows, trying without user_id filter (RLS should handle it)");
        const deleteResponse2 = await supabase
          .from("transactions")
          .delete()
          .eq("id", id)
          .select();
        
        deleteError = deleteResponse2.error;
        deleteResult = deleteResponse2.data;
      }
      
      if (deleteError) {
        console.error("Delete error:", deleteError);
        console.error("Error details:", JSON.stringify(deleteError, null, 2));
        // Revert optimistic update on error
        setDeletedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setDeletingId(null);
        alert(`Failed to delete transaction: ${deleteError.message || "Unknown error"}`);
        return;
      }
      
      // Check if deletion succeeded
      if (deleteResult && deleteResult.length > 0) {
        // Success - we got back the deleted row(s)
        console.log("Transaction deleted successfully, id:", id, "Result:", deleteResult);
      } else {
        // No rows returned - verify by checking if it still exists
        console.log("Delete returned no rows, verifying deletion...");
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const { data: verifyDeleted, error: verifyDeletedError } = await supabase
          .from("transactions")
          .select("id")
          .eq("id", id)
          .maybeSingle();
        
        if (verifyDeletedError) {
          console.error("Error verifying deletion:", verifyDeletedError);
          // If we can't verify, assume it worked (delete didn't error)
          console.log("Cannot verify deletion, but delete returned no error. Assuming success.");
        } else if (verifyDeleted) {
          // Transaction still exists - deletion failed silently
          console.error("Transaction still exists after delete attempt");
          console.error("User ID:", userRes.user.id, "Transaction ID:", id);
          console.error("Transaction data:", verifyDeleted);
          // Revert optimistic update
          setDeletedIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          setDeletingId(null);
          alert("Failed to delete transaction. The deletion was blocked by database policies. Please check your Supabase RLS policies allow DELETE operations.");
          return;
        } else {
          // Transaction is gone - deletion succeeded
          console.log("Transaction verified as deleted, id:", id);
        }
      }
      
      // Immediately notify parent to remove from calculations
      if (onDeleted) {
        onDeleted(id);
      }
      
      // Reload after a delay to ensure database has updated
      // The transaction will stay in deletedIds (hidden) until confirmed gone
      setTimeout(() => {
        onReload();
        // Clear deletingId after reload completes
        // The useEffect will remove it from deletedIds once it's confirmed gone from items
        setTimeout(() => {
          setDeletingId(null);
        }, 500);
      }, 800);
    } catch (err) {
      console.error("Unexpected error deleting transaction:", err);
      // Revert optimistic update on error
      setDeletedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setDeletingId(null);
      alert("An unexpected error occurred while deleting the transaction");
    }
  };

  const handleEdit = (tx: Tx) => {
    setEditingId(tx.id);
    setEditAmount(tx.amount);
    setEditType(tx.type);
    setEditCategory(tx.category || "");
    setEditHoursSpent(tx.hours_spent !== null ? tx.hours_spent : "");
    // Use transaction_date if available, otherwise use created_at date part
    const dateValue = tx.transaction_date || (tx.created_at ? tx.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
    setEditTransactionDate(dateValue);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditAmount("");
    setEditCategory("");
    setEditHoursSpent("");
    setEditTransactionDate("");
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      // Get current user to ensure we only update their transactions
      const { data: userRes, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userRes?.user) {
        alert("You must be logged in to update transactions");
        setSaving(false);
        return;
      }
      
      // First verify the transaction exists and belongs to the user
      const { data: verifyData, error: verifyError } = await supabase
        .from("transactions")
        .select("id, user_id")
        .eq("id", id)
        .eq("user_id", userRes.user.id)
        .single();
      
      if (verifyError || !verifyData) {
        console.error("Transaction verification error:", verifyError);
        alert("Transaction not found or you don't have permission to update it");
        setSaving(false);
        return;
      }
      
      // Build update object - only include fields that should be updated
      const updateData: any = {
        amount: Number(editAmount),
        type: editType,
        category: editCategory || null,
        hours_spent: editHoursSpent !== "" ? Number(editHoursSpent) : null,
      };
      
      // Only include transaction_date if the column exists
      // Check if transaction_date is being used in the form (it is, so include it)
      if (editTransactionDate) {
        updateData.transaction_date = editTransactionDate;
      } else {
        updateData.transaction_date = null;
      }
      
      console.log("Updating transaction with data:", updateData);
      
      const { data: updateResult, error } = await supabase
        .from("transactions")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", userRes.user.id)
        .select();
      
      if (error) {
        console.error("Update error:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        
        // If the error is about a missing column, provide helpful message
        if (error.message?.includes("transaction_date") || error.message?.includes("schema cache")) {
          // Try updating without transaction_date
          const { error: retryError } = await supabase
            .from("transactions")
            .update({
              amount: Number(editAmount),
              type: editType,
              category: editCategory || null,
              hours_spent: editHoursSpent !== "" ? Number(editHoursSpent) : null,
            })
            .eq("id", id)
            .eq("user_id", userRes.user.id);
          
          if (retryError) {
            alert(`Failed to update transaction: ${retryError.message || "Unknown error"}. The 'transaction_date' column may not exist in your database. Please add it or remove it from the update.`);
          } else {
            alert("Transaction updated, but 'transaction_date' column doesn't exist in your database. Please add this column to your transactions table.");
          }
        } else {
          alert(`Failed to update transaction: ${error.message || "Unknown error"}`);
        }
        setSaving(false);
        return;
      }
      
      if (!updateResult || updateResult.length === 0) {
        console.error("Update returned no rows");
        alert("Failed to update transaction. The update was blocked. Please check your Supabase RLS policies allow UPDATE operations.");
        setSaving(false);
        return;
      }
      
      console.log("Transaction updated successfully:", updateResult);
      setEditingId(null);
      setSaving(false);
      // Reload after a short delay to ensure database has updated
      setTimeout(() => {
        onReload();
      }, 300);
    } catch (err) {
      console.error("Error updating transaction:", err);
      alert("Failed to update transaction");
      setSaving(false);
    }
  };

  return (
    <>
    <ul className="space-y-3 md:space-y-4 min-h-0 w-full min-w-0">
      {visibleItems.map(tx => {
        if (editingId === tx.id) {
          return (
            <li key={tx.id} className="card rounded-xl space-y-3 p-4 md:p-5 min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="label text-xs">Amount</label>
                  <input
                    className="input text-sm"
                    type="number"
                    step="0.01"
                    value={editAmount as any}
                    onChange={(e) => setEditAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="label text-xs">Type</label>
                  <select
                    className="select text-sm"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as "income" | "expense")}
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Date</label>
                  <DateInput
                    className="text-sm"
                    value={editTransactionDate}
                    onChange={(e) => setEditTransactionDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label text-xs">Category</label>
                  <input
                    className="input text-sm"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="label text-xs">Hours</label>
                  <input
                    className="input text-sm"
                    type="number"
                    step="0.25"
                    value={editHoursSpent as any}
                    onChange={(e) => setEditHoursSpent(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm rounded-lg border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSave(tx.id)}
                  className="btn px-3 py-1.5 text-sm"
                  disabled={saving || editAmount === "" || Number(editAmount) <= 0}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </li>
          );
        }

        return (
          <li key={tx.id} className="card rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 md:p-5 min-w-0">
            <div className="flex-1 min-w-0 w-full sm:w-auto">
              <div className="text-xs sm:text-sm text-neutral-500 mb-1 sm:mb-1.5 min-w-0">
                {tx.transaction_date 
                  ? new Date(tx.transaction_date + 'T00:00:00').toLocaleDateString()
                  : new Date(tx.created_at).toLocaleDateString()}
              </div>
              <div className="text-sm sm:text-base flex items-center gap-2 flex-wrap min-w-0">
                {tx.category ? <span className="text-neutral-200 min-w-0">{tx.category}</span> : <span className="text-neutral-500 min-w-0">Uncategorized</span>}
                <span className="text-xs px-2 py-0.5 rounded-full border border-neutral-800 whitespace-nowrap">
                  {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0 w-full sm:w-auto">
              <div className={`${tx.type === "income" ? "text-emerald-400" : "text-red-400"} font-semibold text-sm sm:text-base`}>
                {tx.type === "income" ? "+" : "-"}{currencySymbol}{Math.abs(tx.amount).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(tx)}
                  className="px-2 py-1 text-xs rounded border border-neutral-800 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500 transition-all duration-200 hover:scale-105"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClick(tx.id)}
                  disabled={deletingId === tx.id}
                  className="px-2 py-1 text-xs rounded border border-neutral-800 text-neutral-400 hover:text-red-400 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                >
                  {deletingId === tx.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
    {confirmDeleteId && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleDeleteCancel}>
        <div className="card max-w-md w-full" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-semibold text-neutral-100 mb-2">Confirm Deletion</h3>
          <p className="text-sm text-neutral-400 mb-6">
            Are you sure you want to delete this transaction? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleDeleteCancel}
              className="px-4 py-2 text-sm rounded-lg border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(confirmDeleteId)}
              className="px-4 py-2 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
