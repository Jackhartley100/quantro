"use client";

import React, { useEffect } from "react";

export type ToastType = "success" | "error" | "info";

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notify() {
  toastListeners.forEach((listener) => listener([...toasts]));
}

export function showToast(message: string, type: ToastType = "info") {
  const id = Math.random().toString(36).substring(2, 9);
  toasts.push({ id, message, type });
  notify();

  // Auto-remove after 5 seconds
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 5000);
}

export function useToasts() {
  const [toastList, setToastList] = React.useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setToastList(newToasts);
    };
    toastListeners.push(listener);
    listener(toasts);

    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  return toastList;
}

export default function ToastContainer() {
  const toasts = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            min-w-[300px] max-w-md rounded-lg border px-4 py-3 shadow-lg
            ${
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                : toast.type === "error"
                ? "bg-red-500/10 border-red-500/50 text-red-400"
                : "bg-blue-500/10 border-blue-500/50 text-blue-400"
            }
          `}
        >
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      ))}
    </div>
  );
}


