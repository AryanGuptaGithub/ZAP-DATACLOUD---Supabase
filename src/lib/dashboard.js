// src/lib/dashboard.js
import { supabase } from "@/lib/supabaseClient";

export async function getDashboardStats() {
  try {
    // fetch everything in parallel
    const [
      clientsRes,
      vendorsRes,
      projectsRes,
      incomesRes,
      expensesRes,
      renewalsRes,
    ] = await Promise.all([
      // use head:true to get only count (no rows)
      supabase.from("clients").select("*", { count: "exact", head: true }),
      supabase.from("vendors").select("*", { count: "exact", head: true }),
      // we want rows for projects so don't use head:true here
      supabase.from("projects").select("id, status", { count: "exact" }),
      // select amount and remark for incomes (and ensure amount/date availability)
      supabase.from("incomes").select("amount, remark, date"),
      // select amount, remark, date for expenses (you need date for upcoming calculation)
      supabase.from("expenses").select("amount, remark, date"),
      supabase.from("upcoming_renewals").select("*"),
    ]);

    // check for Supabase errors and surface them early
    const errors = [clientsRes, vendorsRes, projectsRes, incomesRes, expensesRes, renewalsRes]
      .map((r) => r?.error)
      .filter(Boolean);
    if (errors.length) {
      // throw the first error (you can aggregate if you prefer)
      throw errors[0];
    }

    const totalClients = clientsRes.count ?? 0;
    const totalVendors = vendorsRes.count ?? 0;

    // prefer count if available for projects, otherwise fallback to data length
    const totalProjects = projectsRes.count ?? (projectsRes.data?.length ?? 0);

    const completed =
      (projectsRes.data?.filter((p) => (p.status ?? "").toString().toLowerCase() === "completed").length) ?? 0;
    const pending = Math.max(0, totalProjects - completed);

    // helper to safely parse amounts (handles string / null / undefined)
    const parseAmount = (v) => {
      if (v == null) return 0;
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const totalIncome =
      (incomesRes.data?.reduce((sum, r) => sum + parseAmount(r.amount), 0)) ?? 0;

    const totalExpenses =
      (expensesRes.data?.reduce((sum, r) => sum + parseAmount(r.amount), 0)) ?? 0;

    const pendingIncome =
      (incomesRes.data
        ?.filter((p) => (p.remark ?? "").toString().toLowerCase().includes("pending"))
        .reduce((sum, r) => sum + parseAmount(r.amount), 0)) ?? 0;

    const upcomingExpenses =
      (expensesRes.data
        ?.filter((p) => {
          // ensure there's a valid date to compare
          if (!p?.date) return false;
          const d = new Date(p.date);
          if (isNaN(d.getTime())) return false;
          return d > new Date();
        })
        .reduce((sum, r) => sum + parseAmount(r.amount), 0)) ?? 0;

    return {
      totalClients,
      totalVendors,
      totalProjects,
      completed,
      pending,
      totalIncome,
      totalExpenses,
      pendingIncome,
      upcomingExpenses,
      renewals: renewalsRes.data ?? [],
    };
  } catch (e) {
    console.error("Dashboard stats error:", e);
    throw e;
  }
}
