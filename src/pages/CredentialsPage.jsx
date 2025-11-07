// src/pages/Credentials.jsx

import React, { useEffect, useMemo, useState } from "react";
import {
  listCredentials,
  createCredential,
  updateCredential,
  deleteCredential,
  listUpcomingRenewals,
} from "@/lib/credentials";
import { useLoading } from "@/components/LoadingProvider";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Search,
  Shield,
  Globe,
  Server,
  CalendarClock,
  Copy,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Link2,
} from "lucide-react";

/* ---------------- helpers ---------------- */
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

/* ---------------- page ---------------- */
export default function CredentialsPage() {
  // seed (replace with API later)
  const [rows, setRows] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [showPwd, setShowPwd] = useState(null); // id that is showing password
  const [editing, setEditing] = useState(null); // row being edited (or null)
  const [open, setOpen] = useState(false); // dialog
  const { withLoader } = useLoading();

  useEffect(() => {
    withLoader(async () => {
      const data = await listCredentials({});
      setRows(
        data.map((r) => ({
          id: r.id,
          client: r.client_name,
          type: r.type, // "Domain" / "Hosting"
          provider: r.provider,
          url: r.portal_url,
          login: r.login,
          password: r.password ?? "", // (if you add this column later)
          serviceName: r.service_name,
          expiry: r.expiry,
          notes: r.notes || "",
        }))
      );
      setRenewals(await listUpcomingRenewals());
    }).catch((e) => toast.error(e.message));
  }, [withLoader]);

  useEffect(() => {
  const channel = supabase
    .channel('rt-credentials')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
      listExpenses().then(setRows); // your existing fetcher
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);


  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows
      .filter((r) => (filterType === "All" ? true : r.type === filterType))
      .filter(
        (r) =>
          r.client.toLowerCase().includes(q) ||
          r.provider.toLowerCase().includes(q) ||
          r.serviceName.toLowerCase().includes(q)
      )
      .map((r) => ({ ...r, left: daysLeft(r.expiry) }))
      .sort((a, b) => a.left - b.left);
  }, [rows, search, filterType]);

  const onCopy = async (val, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(val);
      toast.success(label);
    } catch {
      toast.error("Unable to copy");
    }
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this credential?")) return;
    await withLoader(() => deleteCredential(id));
    setRows((r) => r.filter((x) => x.id !== id));
    toast.success("Credential deleted");
  };

  const toDb = (f) => ({
    client_name: f.client,
    type: f.type,
    provider: f.provider,
    portal_url: f.url,
    login: f.login,
    service_name: f.serviceName,
    expiry: f.expiry,
    notes: f.notes,
  });
  const fromDb = (r) => ({
    id: r.id,
    client: r.client_name,
    type: r.type,
    provider: r.provider,
    url: r.portal_url,
    login: r.login,
    password: r.password ?? "",
    serviceName: r.service_name,
    expiry: r.expiry,
    notes: r.notes || "",
  });
  const onSave = async (payload) => {
    if (editing) {
      const updated = await withLoader(() =>
        updateCredential(editing.id, toDb(payload))
      );
      setRows((prev) =>
        prev.map((r) => (r.id === editing.id ? fromDb(updated) : r))
      );
      toast.success("Credential updated");
    } else {
      const created = await withLoader(() => createCredential(toDb(payload)));
      setRows((prev) => [fromDb(created), ...prev]);
      toast.success("Credential added");
    }
    setOpen(false);
    setEditing(null);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] rounded-2xl p-3 sm:p-5 bg-gradient-to-b from-indigo-50 via-white to-violet-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-white">
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[clamp(22px,2.5vw,32px)] font-bold">
            Credentials
          </h1>
          <p className="text-sm text-muted-foreground">
            Domains, hosting & access in one place
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            defaultValue="All"
            value={filterType}
            onValueChange={(v) => setFilterType(v)}
            className="shrink-0"
          >
            <TabsList>
              <TabsTrigger className={"hover:text-yellow-300"} value="All">
                All
              </TabsTrigger>
              <TabsTrigger className={"hover:text-yellow-300"} value="Domain">
                Domain
              </TabsTrigger>
              <TabsTrigger className={"hover:text-yellow-300"} value="Hosting">
                Hosting
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search client / provider / service"
              className="pl-8 w-64"
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
              <Button className="gap-2 bg-white/70  text-slate-900 hover:bg-blue-500 hover:text-white ">
                <Plus className="h-4 w-4" />
                Add Credential
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border shadow-xl rounded-2xl text-white border-slate-200/70">
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Edit Credential" : "Add Credential"}
                </DialogTitle>
              </DialogHeader>
              <CredentialForm
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

      {/* Table */}
      <Card className="rounded-xl border-slate-200/70 bg-white/75 dark:bg-slate-900/60 backdrop-blur shadow-sm">
        <CardHeader className="px-3 sm:px-4">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-600" />
            Saved Credentials
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 pb-4">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="text-left text-sm text-muted-foreground border-b">
                  <th className="py-2 pr-3">Client</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Provider</th>
                  <th className="py-2 pr-3">Service</th>
                  <th className="py-2 pr-3">Expiry</th>
                  <th className="py-2 pr-3">Login</th>
                  <th className="py-2 pr-3">Password</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-muted/30">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{r.client}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.notes || "\u00A0"}
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      {r.type === "Domain" ? (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          <Globe className="h-3 w-3 mr-1" />
                          Domain
                        </Badge>
                      ) : (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                          <Server className="h-3 w-3 mr-1" />
                          Hosting
                        </Badge>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <span>{r.provider}</span>
                        {r.url && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => window.open(r.url, "_blank")}
                            title="Open portal"
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-3">{r.serviceName}</td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {new Date(r.expiry).toLocaleDateString()}
                        </span>
                        <span className="hidden sm:inline-flex">
                          {badgeFor(r.left)}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-1">
                        <span className="truncate max-w-[150px]">
                          {r.login}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => onCopy(r.login, "Login copied")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-1">
                        <span className="truncate max-w-[120px]">
                          {showPwd === r.id
                            ? r.password
                            : "•".repeat(Math.min(8, r.password.length))}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() =>
                            setShowPwd((s) => (s === r.id ? null : r.id))
                          }
                          title={showPwd === r.id ? "Hide" : "Show"}
                        >
                          {showPwd === r.id ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => onCopy(r.password, "Password copied")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
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
                          <Pencil className="h-4 w-4" />
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
                      colSpan={8}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No credentials found.
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

/* ---------------- form (inline) ---------------- */
function CredentialForm({ defaultValues, onCancel, onSave }) {
  const [form, setForm] = React.useState(
    defaultValues || {
      client: "",
      type: "Domain",
      provider: "",
      url: "",
      login: "",
      password: "",
      serviceName: "",
      expiry: "",
      notes: "",
    }
  );

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.client || !form.provider || !form.serviceName || !form.expiry)
      return;
    onSave(form);
  };

  // small helper for inline feedback
  const daysLeft = React.useMemo(() => {
    if (!form.expiry) return null;
    const now = new Date();
    const d = new Date(form.expiry);
    return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  }, [form.expiry]);

  // badge-like color for expiry hint
  const expiryHintClass =
    daysLeft == null
      ? "text-muted-foreground"
      : daysLeft < 0
      ? "text-rose-600"
      : daysLeft <= 7
      ? "text-rose-600"
      : daysLeft <= 30
      ? "text-amber-700"
      : "text-emerald-700";

  return (
    <form
      onSubmit={submit}
      className="space-y-5  bg-white/70 dark:bg-slate-900/60  backdrop-blur p-4 sm:p-6 text-white"
    >
      {/* Two-column section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pb-4 border-b">
        {/* Client */}
        <div className="space-y-1.5">
          <Label className="text-sm text-slate-700 dark:text-slate-200">
            Client
          </Label>
          <Input
            value={form.client}
            onChange={(e) => update("client", e.target.value)}
            required
            placeholder="e.g., Acme Corp"
            className="bg-background"
          />
        </div>

        {/* Type segmented buttons */}
        <div className="space-y-1.5">
          <Label className="text-sm text-slate-700 dark:text-slate-200">
            Type
          </Label>
          <div className="flex w-full rounded-md border overflow-hidden">
            <button
              type="button"
              onClick={() => update("type", "Domain")}
              className={`flex-1 px-3 py-2 text-sm transition ${
                form.type === "Domain"
                  ? "bg-indigo-600 text-white"
                  : "bg-background hover:bg-muted"
              }`}
            >
              Domain
            </button>
            <button
              type="button"
              onClick={() => update("type", "Hosting")}
              className={`flex-1 px-3 py-2 text-sm transition border-l ${
                form.type === "Hosting"
                  ? "bg-indigo-600 text-white"
                  : "bg-background hover:bg-muted"
              }`}
            >
              Hosting
            </button>
          </div>
        </div>

        {/* Provider */}
        <div className="space-y-1.5">
          <Label className="text-sm text-slate-700 dark:text-slate-200">
            Provider
          </Label>
          <Input
            value={form.provider}
            onChange={(e) => update("provider", e.target.value)}
            required
            placeholder="GoDaddy, AWS, Namecheap…"
            className="bg-background"
          />
        </div>

        {/* Portal URL */}
        <div className="space-y-1.5">
          <Label className="text-sm text-slate-700 dark:text-slate-200">
            Portal URL (optional)
          </Label>
          <Input
            value={form.url}
            onChange={(e) => update("url", e.target.value)}
            placeholder="https://account.provider.com"
            className="bg-background"
          />
        </div>

        {/* Login */}
        <div className="space-y-1.5">
          <Label className="text-sm text-slate-700 dark:text-slate-200">
            Login
          </Label>
          <Input
            value={form.login}
            onChange={(e) => update("login", e.target.value)}
            placeholder="username / email"
            className="bg-background"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label className="text-sm text-slate-700 dark:text-slate-200">
            Password
          </Label>
          <Input
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            placeholder="••••••••"
            className="bg-background"
          />
        </div>

        {/* Service Name */}
        <div className="space-y-1.5">
          <Label className="text-sm text-slate-700 dark:text-slate-200">
            {form.type === "Domain" ? "Domain Name" : "Hosting Name"}
          </Label>
          <Input
            value={form.serviceName}
            onChange={(e) => update("serviceName", e.target.value)}
            required
            placeholder={
              form.type === "Domain"
                ? "example.com"
                : "EC2 / cPanel / Server name"
            }
            className="bg-background"
          />
        </div>

        {/* Expiry */}
        <div className="space-y-1.5">
          <Label className="text-sm text-slate-700 dark:text-slate-200">
            Expiry Date
          </Label>
          <Input
            type="date"
            value={form.expiry}
            onChange={(e) => update("expiry", e.target.value)}
            required
            className="bg-background"
          />
          <div className={`text-xs ${expiryHintClass}`}>
            {daysLeft == null
              ? "Select a date"
              : daysLeft < 0
              ? `Expired ${Math.abs(daysLeft)} day(s) ago`
              : `Due in ${daysLeft} day(s)`}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5 mb-2 border-b pb-4">
        <Label className="text-sm text-slate-700 dark:text-slate-200">
          Notes
        </Label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Optional notes…"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className={"hover:bg-red-500"}
        >
          Cancel
        </Button>
        <Button type="submit" className={"hover:bg-blue-500"}>
          {defaultValues ? "Save Changes" : "Add Credential"}
        </Button>
      </div>
    </form>
  );
}
