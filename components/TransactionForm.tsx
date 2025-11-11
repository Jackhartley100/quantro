"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import DateInput from "@/components/ui/DateInput";

export default function TransactionForm({ onCreated, currencySymbol = "£" }: { onCreated: () => void; currencySymbol?: string }) {
  const [amount, setAmount] = useState<number | "">("");
  const [type, setType] = useState<"income" | "expense">("income");
  const [category, setCategory] = useState("");
  const [hoursSpent, setHoursSpent] = useState<number | "">("");
  const [transactionDate, setTransactionDate] = useState(() => {
    // Default to today's date in YYYY-MM-DD format
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(false);
  const canSubmit = amount !== "" && Number(amount) > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (!user) { setLoading(false); return; }
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      amount: Number(amount),
      type,
      category: category || null,
      hours_spent: hoursSpent !== "" ? Number(hoursSpent) : null,
      transaction_date: transactionDate || new Date().toISOString().split('T')[0],
    });
    setLoading(false);
    if (!error) {
      setAmount("");
      setCategory("");
      setHoursSpent("");
      setType("income");
      // Reset date to today
      const today = new Date();
      setTransactionDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
      onCreated();
    } else {
      console.error(error);
      alert("Failed to add transaction");
    }
  };

  const categories = ["Sales", "Shipping", "Supplies", "Fuel", "Fees", "Other"];

  return (
    <form onSubmit={submit} className="w-full min-w-0">
      <div className="grid gap-4 md:gap-5 md:grid-cols-2">
        {/* Type Row */}
        <div className="flex flex-col space-y-2 md:col-span-2 w-full min-w-0">
          <label className="label">Type</label>
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={() => setType("income")}
              className={`flex-1 px-4 py-3 rounded-lg border transition-all flex items-center justify-center ${
                type === "income"
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-medium"
                  : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300"
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex-1 px-4 py-3 rounded-lg border transition-all flex items-center justify-center ${
                type === "expense"
                  ? "bg-red-500/20 border-red-500 text-red-400 font-medium"
                  : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300"
              }`}
            >
              Expense
            </button>
          </div>
        </div>

        {/* Amount */}
        <div className="flex flex-col space-y-2 min-w-0 md:col-span-1 w-full">
          <label className="label">Amount</label>
          <input
            className="input py-3 w-full"
            type="number"
            step="0.01"
            value={amount as any}
            onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder={`${currencySymbol}0.00`}
            required
          />
        </div>

        {/* Date */}
        <div className="flex flex-col space-y-2 min-w-0 md:col-span-1 w-full">
          <label className="label">Date</label>
          <DateInput
            className="py-3 w-full"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            required
          />
        </div>

        {/* Category */}
        <div className="space-y-2 md:col-span-2 w-full min-w-0">
          <label className="label">Category <span className="text-neutral-500 font-normal">(optional)</span></label>
          <input
            className="input w-full"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Enter category or select below"
          />
          <div className="flex flex-wrap gap-2 mt-2 md:col-span-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  category === cat
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                    : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Hours Spent */}
        <div className="space-y-2 md:col-span-2 w-full min-w-0">
          <label className="label">Hours spent <span className="text-neutral-500 font-normal">(optional)</span></label>
          <input
            className="input w-full"
            type="number"
            step="0.25"
            value={hoursSpent as any}
            onChange={(e) => setHoursSpent(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="0.00"
          />
          <p className="text-xs text-neutral-500 mt-1">Used to calculate your effective hourly rate</p>
        </div>

        {/* Submit Button */}
        <div className="pt-2 md:col-span-2 w-full min-w-0">
          <button
            className="btn w-full py-2.5 sm:py-3 text-sm sm:text-base"
            disabled={!canSubmit || loading}
            type="submit"
          >
            {loading ? "Adding..." : "Add Transaction"}
          </button>
        </div>
      </div>
    </form>
  );
}
