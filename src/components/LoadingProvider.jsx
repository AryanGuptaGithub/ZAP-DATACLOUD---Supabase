// LoadingProvider.jsx
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import Spinner from "./Spinner";

const LoadingCtx = createContext(null);

export function LoadingProvider({ children }) {
  const [count, setCount] = useState(0); // supports concurrent loads

  const start = useCallback(() => setCount(c => c + 1), []);
  const stop  = useCallback(() => setCount(c => Math.max(0, c - 1)), []);

  // Wrap any async fn: await withLoader(() => apiCall());
  const withLoader = useCallback(async (fn) => {
    start();
    try { return await fn(); }
    finally { stop(); }
  }, [start, stop]);

  const value = useMemo(() => ({ start, stop, withLoader, active: count > 0 }), [count, start, stop, withLoader]);

  return (
    <LoadingCtx.Provider value={value}>
      {children}
      {count > 0 && (
        <div className="fixed inset-0 z-[70] bg-black/25 backdrop-blur-sm flex items-center justify-center">
          <div className="rounded-xl bg-white dark:bg-slate-900 shadow-xl px-5 py-4 flex items-center gap-3 border border-slate-200/30">
            <Spinner className="h-6 w-6 text-indigo-600" />
            <span className="text-sm text-slate-700 dark:text-slate-200">Working…</span>
          </div>
        </div>
      )}
    </LoadingCtx.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingCtx);
  if (!ctx) throw new Error("useLoading must be used within LoadingProvider");
  return ctx;
}
