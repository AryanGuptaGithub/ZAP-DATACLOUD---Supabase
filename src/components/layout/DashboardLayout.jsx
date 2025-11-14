// DashboardLayout.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, Wallet, Receipt, KeyRound } from "lucide-react";

const nav = [
  { to: ".", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "customers", label: "Customers", icon: Users },
  { to: "income", label: "Income", icon: Wallet },
  { to: "expenses", label: "Expenses", icon: Receipt },
  { to: "credentials", label: "Credentials", icon: KeyRound },
];

export default function DashboardLayout() {
  return (
    <div className="flex">
      {/* Sidebar (desktop) */}
      <aside
        className="
          hidden sm:flex fixed left-0 top-14 bottom-0 w-64 z-30
          bg-white/70 dark:bg-slate-900/80 border-r border-slate-200/20 backdrop-blur 
          p-4
        "
      >
        <nav className="w-full flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 sm:ml-64">
        <main className="min-h-[calc(100vh-56px)] p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
