// Expense.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/lib/expenses";
import { useLoading } from "@/components/LoadingProvider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Plus, Edit2, Trash2, Upload, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function ExpensePage() {
  const [rows, setRows] = useState([]);
  const { withLoader } = useLoading();

  useEffect(() => {
    const t = setTimeout(() => {
      const channel = supabase
        .channel("rt-expenses")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "expenses" },
          () => {
            listExpenses().then(setRows).catch(console.error);
          }
        )
        .subscribe();

      // store channel ref in outer scope if you want to remove it precisely in cleanup
      // window.__expenseChannel = channel;
    }, 400);
    return () => {
      clearTimeout(t);
      // supabase.removeChannel(window.__expenseChannel) if stored
      supabase.removeChannel?.({ pattern: "rt-expenses" }).catch(() => {});
    };
  }, []);

  useEffect(() => {
    withLoader(async () => setRows(await listExpenses())).catch((e) =>
      toast.error(e.message)
    );
  }, [withLoader]);

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    const q = (search ?? "").toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) => {
      // ensure each field is a string before toLowerCase
      const customer = (r.customer ?? r.name ?? "").toString().toLowerCase();
      const remark = (r.remark ?? "").toString().toLowerCase();
      const uploaded = (r.uploaded ?? r.uploaded_path ?? "")
        .toString()
        .toLowerCase();
      const amount = String(r.amount ?? "").toLowerCase();

      return (
        customer.includes(q) ||
        remark.includes(q) ||
        uploaded.includes(q) ||
        amount.includes(q)
      );
    });
  }, [rows, search]);

  const totalExpense = useMemo(
    () => rows.reduce((sum, r) => sum + Number(r.amount || 0), 0),
    [rows]
  );

  const onDelete = (id) => {
    if (!confirm("Delete this expense record?")) return;
    withLoader(async () => {
      await deleteExpense(id);
      setRows((r) => r.filter((x) => x.id !== id));
      toast.success("Expense deleted");
    }).catch((e) => toast.error(e.message));
  };

  // Helper function to normalize expense object shape
  function normalizeExpense(expense) {
    return {
      id: expense.id,
      owner_id: expense.owner_id,
      customer: expense.customer_name || "",
      amount: Number(expense.amount) || 0,
      date: expense.date
        ? new Date(expense.date).toISOString().slice(0, 10)
        : "",
      category: expense.category || "",
      remark: expense.remark || "",
      uploaded: expense.uploaded_path || "",
      client_id: expense.client_id || null,
    };
  }

  const onSave = async (payload) => {
    try {
      await withLoader(async () => {
        const { data: { session } = {} } = await supabase.auth.getSession();
        const owner_id = session?.user?.id ?? null;

        const row = {
          customer_name: payload.customer ?? null,
          amount: Number(payload.amount) || 0,
          date: payload.date ?? null,
          category: payload.category ?? null,
          remark: payload.remark ?? null,
          uploaded_path: payload.uploaded ?? null,
          owner_id,
          client_id: null,
        };

        const { data, error } = await supabase
          .from("expenses")
          .insert([row])
          .select()
          .single();

        if (error) throw error;

        // normalize the new row before adding to state
        // console.log("Inserted Expenses:", data);
        setRows((prev) => [normalizeExpense(data), ...prev]);
        toast.success("Expense added");
      });
      setOpen(false);
      setEditing(null);
    } catch (e) {
      toast.error(e.message || "Save failed");
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] rounded-2xl p-3 sm:p-5 bg-gradient-to-b text-slate-900 dark:text-white from-rose-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[clamp(22px,2.5vw,32px)] font-bold">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Track all outgoing payments and costs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customer / remark / file"
              className="pl-8 w-[260px] sm:w-[320px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) setEditing(null);
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 bg-amber-300 hover:bg-amber-400">
                <Plus className="h-4 w-4" /> Add Expense
              </Button>
            </DialogTrigger>

            {/* Opaque background so title stays visible */}
            <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-700/40 shadow-xl rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {editing ? "Edit Expense" : "Add Expense"}
                </DialogTitle>
              </DialogHeader>
              <ExpenseForm
                defaultValues={editing || undefined}
                onCancel={() => {
                  setOpen(false);
                  setEditing(null);
                }}
                onSave={onSave}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Total Summary */}
      <div className="mb-6">
        <Card className="rounded-xl border border-slate-200/70 bg-white/75 dark:bg-slate-900/60 backdrop-blur shadow-sm">
          <CardContent className="flex justify-between items-center py-3 px-4">
            <h2 className="font-semibold text-lg">Total Expenses</h2>
            <Badge className="bg-rose-600 text-white px-4 py-1 text-base">
              ₹{totalExpense.toLocaleString()}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="rounded-xl border border-slate-200/70 bg-white/75 dark:bg-slate-900/60 backdrop-blur shadow-sm ">
        <CardHeader className="">
          <CardTitle>Expense List</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 pb-4">
          <div className="w-full overflow-x-auto rounded-lg text-center">
            <table className="w-full min-w-[850px] border-collapse ">
              <thead>
                <tr className=" text-muted-foreground">
                  <th className="py-2 pr-3  bg-amber-300">Customer</th>
                  <th className="py-2 pr-3  bg-amber-300">Amount</th>
                  <th className="py-2 pr-3  bg-amber-300">Date</th>
                  <th className="py-2 pr-3  bg-amber-300">Remark</th>
                  <th className="py-2 pr-3  bg-amber-300">Uploaded</th>
                  <th className="py-2 pr-3  bg-amber-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-muted/30">
                    <td className="py-2 pr-3 font-medium">{r.customer}</td>
                    <td className="py-2 pr-3 text-rose-600 font-semibold">
                      ₹{Number(r.amount).toLocaleString()}
                    </td>
                    <td className="py-2 pr-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {r.date}
                    </td>
                    <td className="py-2 pr-3">{r.remark}</td>
                    <td className="py-2 pr-3 flex items-center gap-2">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      {r.uploaded}
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditing(r);
                            setOpen(true);
                          }}
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-rose-600"
                          onClick={() => onDelete(r.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No expense records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Form ---------------- */
function ExpenseForm({ defaultValues, onCancel, onSave }) {
  const [form, setForm] = useState(
    defaultValues || {
      customer: "",
      amount: "",
      date: "",
      remark: "",
      uploaded: "",
    }
  );

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-xl text-slate-900 dark:text-white p-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pb-4 border-b">
        <div className="space-y-1.5">
          <Label>Customer Name</Label>
          <Input
            value={form.customer}
            onChange={(e) => update("customer", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Amount</Label>
          <Input
            type="number"
            value={form.amount}
            onChange={(e) => update("amount", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Remark</Label>
          <Input
            value={form.remark}
            onChange={(e) => update("remark", e.target.value)}
            placeholder="Optional..."
          />
        </div>
        <div className="space-y-1.5">
          <Label>Uploaded</Label>
          <Input
            value={form.uploaded}
            onChange={(e) => update("uploaded", e.target.value)}
            placeholder="Invoice.pdf"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className={"hover:bg-red-500"}
        >
          Cancel
        </Button>
        <Button type="submit" className={"bg-violet-700"}>
          {defaultValues ? "Save Changes" : "Add Expense"}
        </Button>
      </div>
    </form>
  );
}
