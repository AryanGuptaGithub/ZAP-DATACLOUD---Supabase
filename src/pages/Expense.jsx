// Expense.jsx
import React, { useMemo, useState, useEffect } from "react";
import { listExpenses, createExpense, updateExpense, deleteExpense } from "@/lib/expenses";
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

export default function ExpensePage() {
 

  const [rows, setRows] = useState([]);
  const { withLoader } = useLoading();

  useEffect(() => {
  const channel = supabase
    .channel('rt-expenses')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
      listExpenses().then(setRows); // your existing fetcher
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);



  useEffect(() => {
    withLoader(async () => setRows(await listExpenses()))
      .catch(e => toast.error(e.message));
  }, [withLoader]);

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.customer.toLowerCase().includes(q) ||
        r.remark.toLowerCase().includes(q) ||
        r.uploaded.toLowerCase().includes(q) ||
        String(r.amount).includes(q)
    );
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
    }).catch(e => toast.error(e.message));

  };

  const onSave = async (payload) => {
    const toDb = (f) => ({
      customer_name: f.customer,
      amount: f.amount,
      date: f.date,
      remark: f.remark,
      uploaded_path: f.uploaded || null,
    });
    if (editing) {
      const updated = await withLoader(() => updateExpense(editing.id, toDb(payload)));
      setRows(prev => prev.map(r => r.id === editing.id ? updated : r));
      toast.success("Expense updated");
    } else {
      const created = await withLoader(() => createExpense(toDb(payload)));
      setRows(prev => [created, ...prev]);
      toast.success("Expense added");
    }
    setOpen(false);
    setEditing(null);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] rounded-2xl p-3 sm:p-5 bg-gradient-to-b text-amber-50 from-rose-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
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
              <Button className="gap-2">
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
      <Card className="rounded-xl border border-slate-200/70 bg-white/75 dark:bg-slate-900/60 backdrop-blur shadow-sm">
        <CardHeader className="px-3 sm:px-4">
          <CardTitle>Expense List</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 pb-4">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse">
              <thead>
                <tr className="text-left text-sm text-muted-foreground border-b">
                  <th className="py-2 pr-3">Customer</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Remark</th>
                  <th className="py-2 pr-3">Uploaded</th>
                  <th className="py-2 pr-3">Actions</th>
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
    <form onSubmit={submit} className="space-y-5 rounded-xl text-white">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pb-4 border-b ">
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
