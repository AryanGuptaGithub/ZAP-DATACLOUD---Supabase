import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import useAuthUser from "@/hooks/useAuthUser";
import { Button } from "@/components/ui/button";
import { LogOut, LogIn, UserPlus, LayoutDashboard } from "lucide-react";

export default function NavBar() {
  const { user } = useAuthUser();
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem("active_business_id"); // optional
    navigate("/login");
  }

  const linkBase =
    "px-3 py-2 rounded-md text-sm font-medium transition hover:bg-indigo-50 dark:hover:bg-slate-800";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 h-14 flex items-center justify-between">
       
        <Link to="/" className="flex items-center gap-2">
          <image
            src="../../public/zaplogo.jpg"
            alt="DataCloud Logo"
            className="h-7 w-7"
          />
          <span className="font-semibold hidden sm:block">DataCloud</span>
        </Link>

        {/* Center links (when logged in, show main pages) */}
        <nav className="hidden md:flex items-center gap-1">
          {user ? (
            <>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `${linkBase} ${
                    isActive
                      ? "text-indigo-600"
                      : "text-slate-700 dark:text-slate-300"
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/customers"
                className={({ isActive }) =>
                  `${linkBase} ${
                    isActive
                      ? "text-indigo-600"
                      : "text-slate-700 dark:text-slate-300"
                  }`
                }
              >
                Customers
              </NavLink>
              <NavLink
                to="/credentials"
                className={({ isActive }) =>
                  `${linkBase} ${
                    isActive
                      ? "text-indigo-600"
                      : "text-slate-700 dark:text-slate-300"
                  }`
                }
              >
                Credentials
              </NavLink>
              <NavLink
                to="/income"
                className={({ isActive }) =>
                  `${linkBase} ${
                    isActive
                      ? "text-indigo-600"
                      : "text-slate-700 dark:text-slate-300"
                  }`
                }
              >
                Income
              </NavLink>
              <NavLink
                to="/expenses"
                className={({ isActive }) =>
                  `${linkBase} ${
                    isActive
                      ? "text-indigo-600"
                      : "text-slate-700 dark:text-slate-300"
                  }`
                }
              >
                Expenses
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `${linkBase} ${
                    isActive
                      ? "text-indigo-600"
                      : "text-slate-700 dark:text-slate-300"
                  }`
                }
              >
                Home
              </NavLink>
            </>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button size="sm" variant="outline" onClick={() => navigate("/")}>
                <LayoutDashboard className="h-4 w-4 mr-1" /> Dashboard
              </Button>
              <Button size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/login")}
              >
                <LogIn className="h-4 w-4 mr-1" /> Login
              </Button>
              <Button size="sm" onClick={() => navigate("/register")}>
                <UserPlus className="h-4 w-4 mr-1" /> Register
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
