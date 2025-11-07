import React from 'react'

export default function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200/20 bg-white/60 dark:bg-slate-900/60">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/60 dark:bg-slate-800/60">
          <tr>{Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="px-3 py-2 border-b border-slate-200/20">
              <div className="h-3 w-24 bg-slate-200/70 dark:bg-slate-700/60 rounded" />
            </th>
          ))}</tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="animate-pulse">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-3 py-3">
                  <div className="h-3 w-full bg-slate-200/70 dark:bg-slate-700/60 rounded" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
