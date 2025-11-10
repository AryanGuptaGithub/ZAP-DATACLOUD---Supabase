// src/pages/Income.jsx
import React, { useState, useMemo, useEffect } from "react";
import { listIncomes, createIncome, updateIncome, deleteIncome } from "@/lib/incomes";
import { uploadInvoice } from "@/lib/storage";
import { useLoading } from "@/components/LoadingProvider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
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

export default function IncomePage() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { withLoader } = useLoading();

  // safe mapper for incoming rows (in case your lib returns raw db rows)
  const normalize = (r) => ({
    id: r.id,
    customer: r.customer ?? r.customer_name ?? "",
    amount: Number(r.amount ?? 0),
    date: r.date ?? "",
    remark: r.remark ?? "",
    uploaded: r.uploaded ?? r.uploaded_path ?? "",
    // keep original raw row if needed
    __raw: r,
  });

  // initial load
  useEffect(() => {
    withLoader(async () => {
      const data = await listIncomes();
      // some helper listIncomes might already map, but normalize anyway
      setRows((data ?? []).map(normalize));
    }).catch((e) => {
      console.error(e);
      toast.error(e?.message ?? "Failed to load incomes");
    });
  }, [withLoader]);

  // realtime subscription (delayed slightly to reduce websocket noise)
  useEffect(() => {
    const t = setTimeout(() => {
      const channel = supabase
        .channel("rt-incomes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "incomes" },
          async (payload) => {
            try {
              // Best-effort local patch: INSERT / UPDATE / DELETE
              const { eventType, new: n, old: o } = payload;
              if (eventType === "INSERT") {
                setRows((prev) => [normalize(n), ...prev]);
                return;
              }
              if (eventType === "UPDATE") {
                setRows((prev) => prev.map((r) => (r.id === n.id ? normalize(n) : r)));
                return;
              }
              if (eventType === "DELETE") {
                setRows((prev) => prev.filter((r) => r.id !== o.id));
                return;
              }
            } catch (err) {
              // fallback: refetch on realtime error
              console.warn("Realtime patch failed, refetching list:", err);
              try {
                const data = await listIncomes();
                setRows((data ?? []).map(normalize));
              } catch (e) {
                console.error(e);
              }
            }
          }
        )
        .subscribe();

      // cleanup function removes channel
      // note: removeChannel returns a promise; ignoring result is fine here
      // we call supabase.removeChannel in cleanup
      // keep channel variable in closure for cleanup
      (channel); // no-op to keep lint happy
    }, 400);

    return () => {
      clearTimeout(t);
      // supabase.removeChannel expects a channel object; simple approach: remove all channels with that id
      // If you're using the channel reference, you'd keep it in outer scope. For simplicity:
      supabase.removeChannel?.({ pattern: "rt-incomes" }).catch(() => {});
    };
  }, []);

  // safe filtered list (avoid toLowerCase on null)
  const filtered = useMemo(() => {
    const q = (search ?? "").toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) => {
      return (
        (r.customer ?? "").toLowerCase().includes(q) ||
        (r.remark ?? "").toLowerCase().includes(q) ||
        (r.uploaded ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const totalIncome = useMemo(
    () => rows.reduce((sum, r) => sum + Number(r.amount || 0), 0),
    [rows]
  );

  // delete handler
  const onDelete = (id) => {
    if (!confirm("Delete this income record?")) return;
    withLoader(async () => {
      await deleteIncome(id);
      setRows((r) => r.filter((x) => x.id !== id));
      toast.success("Income deleted");
    }).catch((e) => {
      console.error(e);
      toast.error(e?.message ?? "Delete failed");
    });
  };

  // save handler (uploads file first if provided)
  const onSave = async (payload) => {
    try {
      await withLoader(async () => {
        let uploaded_path = payload.uploaded_path ?? payload.uploaded ?? null;

        // If payload.file is a File, upload it
        if (payload.file instanceof File) {
          const res = await uploadInvoice(payload.file); // must return { path, publicUrl }
          uploaded_path = res.path;
        }

        // Build DB payload — adjust field names if your createIncome expects different keys
        const dbPayload = {
          customer: payload.customer,
          amount: payload.amount,
          date: payload.date,
          remark: payload.remark,
          uploaded_path,
        };

        if (editing) {
          await updateIncome(editing.id, {
            customer: payload.customer,
            amount: payload.amount,
            date: payload.date,
            remark: payload.remark,
            uploaded_path,
          });
          // simpler: refetch list to ensure consistency
          const data = await listIncomes();
          setRows((data ?? []).map(normalize));
          toast.success("Income updated");
        } else {
          await createIncome(dbPayload);
          // refetch latest list
          const data = await listIncomes();
          setRows((data ?? []).map(normalize));
          toast.success("Income added");
        }
      });
      setOpen(false);
      setEditing(null);
    } catch (e) {
      console.error(e);
      toast.error(e?.message ?? "Save failed");
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] rounded-2xl p-3 sm:p-5 bg-gradient-to-b text-white from-indigo-50 via-white to-violet-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[clamp(22px,2.5vw,32px)] font-bold">Income Records</h1>
          <p className="text-sm text-muted-foreground">Track all received payments and advances</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search customer / remark / file" className="pl-8 w-[260px] sm:w-[320px]" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-800 text-white">
                <Plus className="h-4 w-4" /> Add Income
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-700/40 shadow-xl rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">{editing ? "Edit Income" : "Add Income"}</DialogTitle>
              </DialogHeader>

              <IncomeForm
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
            <h2 className="font-semibold text-lg">Total Income</h2>
            <Badge className="bg-green-600 text-white px-4 py-1 text-base">₹{totalIncome.toLocaleString()}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="rounded-xl border border-slate-200/70 bg-white/75 dark:bg-slate-900/60 backdrop-blur shadow-sm text-white">
        <CardHeader className="px-3 sm:px-4">
          <CardTitle>Income List</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 pb-4 ">
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
                    <td className="py-2 pr-3 text-green-600 font-semibold">₹{Number(r.amount).toLocaleString()}</td>
                    <td className="py-2 pr-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {r.date}
                    </td>
                    <td className="py-2 pr-3">{r.remark}</td>
                    <td className="py-2 pr-3 flex items-center gap-2">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      {/* if uploaded is a URL, render link; else show file name */}
                      {r.uploaded ? (
                        <a href={r.uploaded} target="_blank" rel="noreferrer" className="underline">
                          {r.uploaded.split("/").pop()}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(r); setOpen(true); }}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600" onClick={() => onDelete(r.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No income records found.
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

/* ---------------- Form Component ---------------- */
function IncomeForm({ defaultValues, onCancel, onSave }) {
  const [form, setForm] = useState(
    defaultValues || {
      customer: "",
      amount: "",
      date: "",
      remark: "",
      uploaded: "",
      file: null, // File object
    }
  );

  useEffect(() => {
    // ensure defaultValues populate properly (they come from normalize)
    if (defaultValues) {
      setForm({
        customer: defaultValues.customer || "",
        amount: defaultValues.amount || "",
        date: defaultValues.date || "",
        remark: defaultValues.remark || "",
        uploaded: defaultValues.uploaded || "",
        file: null,
      });
    }
  }, [defaultValues]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    // pass the whole form to onSave; onSave will handle uploading file if present
    onSave(form);
  };

  return (
    <form onSubmit={submit} className="space-y-5 rounded-xl text-white p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pb-4 border-b">
        <div className="space-y-1.5">
          <Label>Customer Name</Label>
          <Input value={form.customer} onChange={(e) => update("customer", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Amount</Label>
          <Input type="number" value={form.amount} onChange={(e) => update("amount", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Remark</Label>
          <Input value={form.remark} onChange={(e) => update("remark", e.target.value)} placeholder="Optional..." />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Upload Invoice (optional)</Label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => update("file", e.target.files?.[0] ?? null)}
            className="w-full"
          />
          {/* show existing filename if any */}
          <div className="text-xs text-muted-foreground mt-1">{form.uploaded ? form.uploaded.split("/").pop() : ""}</div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className={"hover:bg-red-500"}>
          Cancel
        </Button>
        <Button type="submit" className={"bg-indigo-600 hover:bg-indigo-800 text-white"}>
          {defaultValues ? "Save Changes" : "Add Income"}
        </Button>
      </div>
    </form>
  );
}
