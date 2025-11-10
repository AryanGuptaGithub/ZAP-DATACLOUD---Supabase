// src/pages/CustomersPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  listClients,
  createClient,
  updateClient,
  deleteClient,
} from "@/lib/clients";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useLoading } from "@/components/LoadingProvider";
import LoadingButton from "@/components/ui/LoadingButton";
import { supabase } from "@/lib/supabaseClient";

function ClientForm({ initial, onCancel, onSave }) {
  const [saving, setSaving] = useState(false);

  useEffect(() => {
  const channel = supabase
    .channel('rt-clients')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
      listExpenses().then(setRows); // your existing fetcher
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);


  const [form, setForm] = useState(
    initial || {
      clientName: "",
      companyName: "",
      clientDesignation: "",
      companyAddress: "",
      city: "",
      phone: "",
      email: "",
      gstin: "",
    }
  );

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save(e) {
    e.preventDefault();
    try {
      setSaving(true);
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (

    <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-white ">
      {[
        ["clientName", "Client Name"],
        ["companyName", "Company Name"],
        ["clientDesignation", "Designation"],
        ["companyAddress", "Address"],
        ["city", "City"],
        ["phone", "Phone"],
        ["email", "Email"],
        ["gstin", "GSTIN"],
      ].map(([key, label]) => (
        <div key={key} className="">
          <Label>{label}</Label>
          <Input
            value={form[key] || ""}
            onChange={(e) => update(key, e.target.value)}
            required={["clientName", "companyName"].includes(key)}
          />
        </div>
      ))}
      <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>

        <LoadingButton
          loading={saving}
          type="submit"
          onClick={save}
          disabled={saving}
        >
          {initial ? "Save Changes" : "Add Client"}
        </LoadingButton>
      </div>
    </form>
  
  );
}

export default function CustomersPage() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const { withLoader } = useLoading();

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        await withLoader(async () => {
          const data = await listClients();
          if (!ignore) setRows(data);
        });
      } catch (e) {
        toast.error(e.message || "Failed to load clients");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [withLoader]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.clientName,
        r.companyName,
        r.clientDesignation,
        r.email,
        r.phone,
        r.city,
        r.gstin,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rows, search]);

  async function handleSave(form) {
    try {
      await withLoader(async () => {
        if (editing) {
          const updated = await updateClient(editing.id, form);
          setRows((list) =>
            list.map((r) => (r.id === editing.id ? updated : r))
          );
          toast.success("Client updated");
        } else {
          const created = await createClient(form);
          setRows((list) => [created, ...list]);
          toast.success("Client added");
        }
      });
      setEditing(null);
      setOpen(false);
    } catch (e) {
      toast.error(e.message || "Save failed");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this client?")) return;
    try {
      await withLoader(async () => {
        await deleteClient(id);
      });
      setRows((list) => list.filter((r) => r.id !== id));
      toast.success("Client deleted");
    } catch (e) {
      toast.error(e.message || "Delete failed");
    }
  }

  return (
    <div className="space-y-4 text-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 text-white">
        <h1 className="text-2xl font-semibold">Customers</h1>

        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-700/40 shadow-xl rounded-2xl">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Customer" : "Add Customer"}
              </DialogTitle>
            </DialogHeader>
            <ClientForm
              initial={editing || undefined}
              onCancel={() => {
                setOpen(false);
                setEditing(null);
              }}
              onSave={handleSave}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex justify-end text-white">
        <Input
          placeholder="Search customers..."
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200/20 bg-white/60 dark:bg-slate-900/60 text-white">
        <table className="w-full text-sm text-white">
          <thead className="text-left bg-slate-50/60 dark:bg-slate-800/60">
            <tr>
              {[
                "Sr No",
                "Client Name",
                "Company",
                "Designation",
                "Address",
                "Phone",
                "Email",
                "GST",
                "Action",
              ].map((h) => (
                <th key={h} className="px-3 py-2 border-b border-slate-200/20 bg-amber-300 text-black">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-6 text-center text-green-400 " colSpan={9}>
                  Loading customers...
                </td>
              </tr>
            ) : filtered.length ? (
              filtered.map((r, i) => (
                <tr
                  key={r.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-white border-b"
                >
                  <td className="px-3 py-2 ">{i + 1}</td>
                  <td className="px-3 py-2">{r.clientName}</td>
                  <td className="px-3 py-2">{r.companyName}</td>
                  <td className="px-3 py-2">{r.clientDesignation}</td>
                  <td className="px-3 py-2">{r.companyAddress}</td>
                  <td className="px-3 py-2">{r.phone}</td>
                  <td className="px-3 py-2">{r.email}</td>
                  <td className="px-3 py-2">{r.gstin}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setEditing(r);
                          setOpen(true);
                        }}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDelete(r.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-6 text-center" colSpan={9}>
                  No customers yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
