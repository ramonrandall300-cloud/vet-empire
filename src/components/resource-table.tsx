import { useMemo, useState, type ReactNode } from "react";
import { Plus, Search, Pencil, Trash2, Inbox } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useClinicRows, useRowMutations } from "@/lib/data";

export type AnyRow = Record<string, unknown>;

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "textarea" | "date" | "datetime-local" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  colSpan?: 1 | 2;
  /** Convert stored value → form display value */
  toForm?: (raw: unknown) => string;
  /** Convert form display value → stored value */
  fromForm?: (value: string) => unknown;
};

export type ColumnDef = {
  key: string;
  label: string;
  render?: (row: AnyRow) => ReactNode;
  className?: string;
};

type Props = {
  table: string;
  singular: string;
  columns: ColumnDef[];
  fields: FieldDef[];
  orderBy?: string;
  ascending?: boolean;
  searchKeys?: string[];
  toolbar?: ReactNode;
};

function emptyValues(fields: FieldDef[]) {
  return Object.fromEntries(fields.map((f) => [f.name, ""])) as AnyRow;
}

export function ResourceTable({
  table,
  singular,
  columns,
  fields,
  orderBy = "created_at",
  ascending = false,
  searchKeys = [],
  toolbar,
}: Props) {
  const { data, isLoading } = useClinicRows(table, { orderBy, ascending });
  const mutations = useRowMutations(table);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [values, setValues] = useState<AnyRow>(() => emptyValues(fields));
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => {
    const list = data ?? [];
    if (!query.trim() || !searchKeys.length) return list;
    const q = query.toLowerCase();
    return list.filter((row) =>
      searchKeys.some((k) =>
        String(row[k] ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [data, query, searchKeys]);

  function openCreate() {
    setEditing(null);
    setValues(emptyValues(fields));
    setOpen(true);
  }

  function openEdit(row: AnyRow) {
    setEditing(row);
    setValues(
      Object.fromEntries(
        fields.map((f) => {
          const raw = row[f.name];
          if (raw == null) return [f.name, ""];
          if (f.toForm) return [f.name, f.toForm(raw)];
          if (f.type === "datetime-local") return [f.name, String(raw).slice(0, 16)];
          return [f.name, String(raw)];
        }),
      ),
    );
    setOpen(true);
  }

  async function save() {
    const payload: AnyRow = {};
    for (const f of fields) {
      const raw = values[f.name];
      const str = typeof raw === "string" ? raw.trim() : raw;
      if (str === "" || str == null) {
        if (f.required) {
          toast.error(`${f.label} is required`);
          return;
        }
        payload[f.name] = null;
        continue;
      }
      payload[f.name] = f.type === "number" ? Number(str) : str;
    }
    setSaving(true);
    try {
      if (editing) await mutations.update(String(editing["id"]), payload);
      else await mutations.create(payload);
      toast.success(editing ? `${singular} updated` : `${singular} created`);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: AnyRow) {
    if (!window.confirm(`Delete this ${singular.toLowerCase()}? This cannot be undone.`)) return;
    try {
      await mutations.remove(String(row["id"]));
      toast.success(`${singular} deleted`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {searchKeys.length > 0 && (
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${singular.toLowerCase()}s…`}
              className="pl-9"
            />
          </div>
        )}
        {toolbar}
        <Button onClick={openCreate}>
          <Plus className="size-4" /> New {singular}
        </Button>
      </div>

      <div className="surface-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key} className={c.className}>
                  {c.label}
                </TableHead>
              ))}
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={columns.length + 1}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="py-14 text-center">
                  <Inbox className="mx-auto mb-3 size-7 text-muted-foreground" />
                  <p className="text-sm font-medium">No {singular.toLowerCase()}s yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create your first record to get started.
                  </p>
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={String(row["id"])}>
                {columns.map((c) => (
                  <TableCell key={c.key} className={c.className}>
                    {c.render ? c.render(row) : (row[c.key] as ReactNode) || "—"}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(row)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${singular}` : `New ${singular}`}</DialogTitle>
            <DialogDescription>
              Records are stored privately for this clinic only.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div
                key={f.name}
                className={f.colSpan === 2 || f.type === "textarea" ? "sm:col-span-2" : ""}
              >
                <Label className="mb-1.5 block" htmlFor={f.name}>
                  {f.label}
                  {f.required && <span className="text-destructive"> *</span>}
                </Label>
                {f.type === "textarea" ? (
                  <Textarea
                    id={f.name}
                    value={String(values[f.name] ?? "")}
                    placeholder={f.placeholder}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  />
                ) : f.type === "select" ? (
                  <Select
                    value={String(values[f.name] ?? "")}
                    onValueChange={(val) => setValues((v) => ({ ...v, [f.name]: val }))}
                  >
                    <SelectTrigger id={f.name}>
                      <SelectValue placeholder={f.placeholder ?? "Select…"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(f.options ?? []).map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={f.name}
                    type={f.type ?? "text"}
                    value={String(values[f.name] ?? "")}
                    placeholder={f.placeholder}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : `Create ${singular}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
