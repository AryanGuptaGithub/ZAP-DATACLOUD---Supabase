// src/pages/Dashboard/Home.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlarmClock,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  Plus,
  Shield,
  Users,
  Wallet2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { getDashboardStats } from "@/lib/dashboard";
import { toast } from "sonner";

/* ------------ helpers ------------ */
const daysLeft = (dateStr) => {
  const today = new Date();
  const d = new Date(dateStr);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
};

const badgeFor = (d) => {
  if (d < 0)
    return (
      <Badge className="bg-rose-100 text-rose-700 border-rose-200">
        Expired {Math.abs(d)}d
      </Badge>
    );
  if (d <= 7)
    return (
      <Badge className="bg-rose-100 text-rose-700 border-rose-200">
        Due in {d}d
      </Badge>
    );
  if (d <= 30)
    return (
      <Badge className="bg-amber-100 text-amber-800 border-amber-200">
        Due in {d}d
      </Badge>
    );
  return (
    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
      Due in {d}d
    </Badge>
  );
};

/* ------------ placeholder charts data (keeps visuals) ------------ */
const monthly = [
  { month: "June", Projects: 40, Completed: 28, Pending: 12 },
  { month: "July", Projects: 55, Completed: 42, Pending: 13 },
  { month: "August", Projects: 70, Completed: 50, Pending: 20 },
];

export default function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const expiringSoon = useMemo(() => {
    if (!stats?.renewals?.length) return [];
    return stats.renewals
      .map((item) => ({ ...item, left: daysLeft(item.expiry) }))
      .sort((a, b) => a.left - b.left);
  }, [stats]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-56px)] rounded-2xl p-3 sm:p-4 lg:p-6
                 bg-gradient-to-b from-indigo-50 via-white to-violet-50
                 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 
                 space-y-4 sm:space-y-6 text-white">
        <div className="text-slate-700 dark:text-slate-200">Loading dashboard...</div>
      </div>
    );
  }

  // fallback to 0s if stats missing
  const s = stats ?? {
    totalProjects: 0,
    completed: 0,
    pending: 0,
    totalClients: 0,
    totalVendors: 0,
    totalIncome: 0,
    totalExpenses: 0,
    pendingIncome: 0,
    upcomingExpenses: 0,
    renewals: [],
  };

  const minDays = expiringSoon.length ? Math.min(...expiringSoon.map((i) => i.left)) : null;
  const net = (s.totalIncome || 0) - (s.totalExpenses || 0);

  const pieData = [
    { name: "Completed", value: s.completed || 0 },
    { name: "Pending", value: s.pending || 0 },
    { name: "Total", value: s.totalProjects || 0 },
  ];
  const PIE = ["#16a34a", "#f59e0b", "#6366f1"];

  return (
    <div
      className="min-h-[calc(100vh-56px)] rounded-2xl p-3 sm:p-4 lg:p-6
                 bg-gradient-to-b from-indigo-50 via-white to-violet-50
                 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 
                 space-y-4 sm:space-y-6 text-white"
    >
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[clamp(22px,2.5vw,32px)] font-bold text-slate-900 dark:text-slate-100">
            Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
            Agency overview & upcoming deadlines
          </p>
        </div>

        {/* Actions wrap on small screens */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 shrink-0"
          >
            🔔 {expiringSoon.length} renewals upcoming
          </Badge>

          <Link to="/customers" className="shrink-0">
            <Button
              size="sm"
              className="shrink-0 gap-2 bg-white/90  text-slate-900 hover:bg-indigo-700 hover:text-white rounded-md"
            >
              <Plus className="h-4 w-4" /> Add Client
            </Button>
          </Link>
          <Link
            to="/projects"
            className="shrink-0 gap-2 bg-white/90  text-slate-900 hover:bg-indigo-700 hover:text-white rounded-md"
          >
            <Button variant="secondary" size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> New Project
            </Button>
          </Link>
          <Link to="/credentials" className="shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-white/90  text-slate-900 hover:bg-indigo-700 hover:text-white"
            >
              <Plus className="h-4 w-4 " /> Add Credential
            </Button>
          </Link>
        </div>
      </div>

      {/* Next expiry highlight */}
      {minDays !== null && (
        <div
          className="mb-4 sm:mb-6 rounded-xl border border-rose-200/60
                     bg-gradient-to-r from-rose-50 to-amber-50
                     dark:from-rose-900/20 dark:to-amber-900/10
                     p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div className="text-sm">
            <span className="font-medium text-rose-700 dark:text-rose-300">
              Heads up:
            </span>{" "}
            Next renewal in{" "}
            <span className="font-semibold">{minDays} days</span>.
          </div>
          <Link to="/credentials" className="shrink-0">
            <Button size="sm" variant="outline">
              View Renewals
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 ">
        <StatCard
          icon={<Briefcase />}
          label="Total Projects"
          value={s.totalProjects}
        />
        <StatCard
          icon={<CheckCircle2 />}
          label="Completed"
          value={s.completed}
        />
        <StatCard icon={<Clock3 />} label="Pending" value={s.pending} />
        <StatCard icon={<Users />} label="Clients" value={s.totalClients} />
        <StatCard
          icon={<Shield />}
          label="Vendors"
          value={s.totalVendors}
        />
        <StatCard
          icon={<DollarSign />}
          label="Income (₹)"
          value={(s.totalIncome || 0).toLocaleString("en-IN")}
        />
      </div>

      {/* Finance + Renewals */}
      <div className="mt-4 grid gap-3 sm:gap-4 md:grid-cols-2">
        <Card className="rounded-xl border border-slate-200/70 bg-white/70 dark:bg-slate-900/60 backdrop-blur shadow-sm hover:shadow-md transition min-w-0">
          <CardHeader className="px-3 sm:px-4">
            <CardTitle className="text-slate-800 dark:text-slate-100">
              Finance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
            <MiniKpi
              icon={<Wallet2 className="text-indigo-600" />}
              label="Total Expenses"
              value={`₹${(s.totalExpenses || 0).toLocaleString("en-IN")}`}
            />
            <MiniKpi
              icon={<DollarSign className="text-emerald-600" />}
              label="Pending Income"
              value={`₹${(s.pendingIncome || 0).toLocaleString("en-IN")}`}
            />
            <MiniKpi
              icon={<CalendarDays className="text-violet-600" />}
              label="Upcoming Expenses"
              value={`₹${(s.upcomingExpenses || 0).toLocaleString("en-IN")}`}
            />
            <div className="rounded-lg p-3 border bg-white/60 dark:bg-slate-900/40">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Net
              </div>
              <div
                className={`text-xl font-semibold ${
                  net >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                ₹{net.toLocaleString("en-IN")}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-200/70 bg-white/70 dark:bg-slate-900/60 backdrop-blur shadow-sm hover:shadow-md transition min-w-0">
          <CardHeader className="px-3 sm:px-4">
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <AlarmClock className="h-5 w-5 text-rose-600" /> Upcoming Renewals
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 space-y-3">
            {expiringSoon.map((item, i) => (
              <div
                key={i}
                className="flex items-start sm:items-center justify-between gap-2 rounded-lg border p-3 bg-white/60 dark:bg-slate-900/40"
              >
                <div className="min-w-0">
                  <div className="font-medium text-slate-800 dark:text-slate-100 truncate">
                    {item.client_name ?? item.client} · {item.type}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {item.provider ?? ""} • Expires{" "}
                    {new Date(item.expiry).toLocaleDateString()}
                  </div>
                </div>
                <div className="shrink-0">{badgeFor(item.left)}</div>
              </div>
            ))}
            {expiringSoon.length === 0 && (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                No upcoming expiries 🎉
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="mt-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        <Card className="rounded-xl border border-slate-200/70 bg-white/70 dark:bg-slate-900/60 backdrop-blur shadow-sm hover:shadow-md transition min-w-0">
          <CardHeader className="px-3 sm:px-4">
            <CardTitle className="text-slate-800 dark:text-slate-100">
              Statistics Overview (Last 3 Months)
            </CardTitle>
          </CardHeader>
          <div className="px-1 sm:px-2">
            <div className="w-full overflow-x-auto">
              <div className="min-w-[460px]">
                <CardContent
                  style={{ width: "100%", height: 320 }}
                  className="px-2 sm:px-4"
                >
                  <ResponsiveContainer>
                    <BarChart data={monthly} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="Projects"
                        fill="#6366f1"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="Completed"
                        fill="#16a34a"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="Pending"
                        fill="#f59e0b"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/70 bg-white/70 dark:bg-slate-900/60 backdrop-blur shadow-sm hover:shadow-md transition min-w-0">
          <CardHeader className="px-3 sm:px-4">
            <CardTitle className="text-slate-800 dark:text-slate-100">
              Projects Breakdown
            </CardTitle>
          </CardHeader>
          <div className="px-1 sm:px-2">
            <div className="w-full overflow-x-auto">
              <div className="min-w-[420px]">
                <CardContent
                  style={{ width: "100%", height: 320 }}
                  className="px-2 sm:px-4"
                >
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={110}
                        label
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE[i % PIE.length]} />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" height={30} />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ------------ sub components ------------ */
function StatCard({ icon, label, value }) {
  return (
    <Card
      className="rounded-xl border border-slate-200/70 bg-white/70 dark:bg-slate-900/60 backdrop-blur
                     shadow-sm hover:shadow-md hover:-translate-y-0.5 transition min-w-0"
    >
      <CardHeader className="pb-2 px-3 sm:px-4">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span className="grid place-items-center h-7 w-7 rounded-md border bg-white/70 dark:bg-slate-800/60">
            {icon}
          </span>
          <span className="truncate">{label}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-3 sm:px-4">
        <div className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-slate-100">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function MiniKpi({ icon, label, value }) {
  return (
    <div className="rounded-lg p-3 border bg-white/60 dark:bg-slate-900/40 min-w-0">
      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2">
        <span className="grid place-items-center h-5 w-5 rounded border bg-white/70 dark:bg-slate-800/60">
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </div>
      <div className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
        {value}
      </div>
    </div>
  );
}
