import { useCallback, useEffect, useState } from "react";
import {
  type CatalogCodeName,
  type CatalogStyle,
  createBrand,
  createColor,
  createEdition,
  createSize,
  createStyle,
  deleteBrand,
  deleteColor,
  deleteEdition,
  deleteSize,
  deleteStyle,
  listBrands,
  listColors,
  listEditions,
  listSizes,
  listStyles,
  renameBrand,
  renameColor,
  renameEdition,
  renameSize,
  renameStyle,
} from "~/lib/api";
import { useNotify } from "~/lib/notifications";

export function meta() {
  return [{ title: "Catalog masters | Dupli1 Admin" }];
}

type Tab = "brands" | "colors" | "sizes" | "editions";

const inputCls =
  "w-full rounded-xl border border-[#E5E3EE] bg-[#F8F7FC] px-3 py-2 text-sm text-[#1C1B1F] outline-none transition placeholder:text-[#B4B0C8] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20";

export default function CatalogMasters() {
  const { notify } = useNotify();
  const [tab, setTab] = useState<Tab>("brands");
  const [brands, setBrands] = useState<CatalogCodeName[]>([]);
  const [colors, setColors] = useState<CatalogCodeName[]>([]);
  const [sizes, setSizes] = useState<CatalogCodeName[]>([]);
  const [editions, setEditions] = useState<CatalogCodeName[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [styles, setStyles] = useState<CatalogStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMasters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, c, s, e] = await Promise.all([
        listBrands(),
        listColors(),
        listSizes(),
        listEditions(),
      ]);
      setBrands(b);
      setColors(c);
      setSizes(s);
      setEditions(e);
      setSelectedBrand((prev) => {
        if (prev && b.some((row) => row.code === prev)) return prev;
        return b[0]?.code ?? "";
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMasters();
  }, [loadMasters]);

  useEffect(() => {
    if (!selectedBrand) {
      setStyles([]);
      return;
    }
    let cancelled = false;
    listStyles(selectedBrand)
      .then((rows) => {
        if (!cancelled) setStyles(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          notify(
            err instanceof Error ? err.message : "Failed to load styles",
            "error"
          );
          setStyles([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedBrand, notify]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#6D4AFF] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1C1B1F] sm:text-2xl">
          Catalog masters
        </h1>
        <p className="mt-0.5 text-sm text-[#6B6480]">
          Code → name dictionaries used to compose human SKUs. Codes are
          immutable; rename updates display labels only.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex w-max max-w-full flex-wrap gap-1 rounded-xl border border-[#E5E3EE] bg-white p-1 shadow-[0_1px_3px_rgba(28,27,31,0.04)]">
        {(
          [
            ["brands", "Brands & styles"],
            ["colors", "Colors"],
            ["sizes", "Sizes"],
            ["editions", "Editions"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={[
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              tab === value
                ? "bg-[#6D4AFF] text-white shadow-sm"
                : "text-[#6B6480] hover:bg-[#F4F3F8] hover:text-[#1C1B1F]",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "brands" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <MasterPanel
            title="Brands"
            description="2–3 letter codes (e.g. BOT)."
            rows={brands}
            onCreate={async (code, name) => {
              await createBrand(code, name);
              notify(`Brand ${code} created`);
              await loadMasters();
            }}
            onRename={async (code, name) => {
              await renameBrand(code, name);
              notify(`Brand ${code} renamed`);
              await loadMasters();
            }}
            onDelete={async (code) => {
              await deleteBrand(code);
              notify(`Brand ${code} deleted`);
              await loadMasters();
            }}
            codePlaceholder="BOT"
            codePattern="^[A-Za-z]{2,3}$"
            codeHint="2–3 letters"
          />

          <div className="space-y-4 rounded-2xl border border-[#E5E3EE] bg-white p-5 shadow-[0_1px_4px_rgba(28,27,31,0.04)]">
            <div>
              <h2 className="text-sm font-semibold text-[#1C1B1F]">Styles</h2>
              <p className="mt-0.5 text-xs text-[#6B6480]">
                Design family under a brand (e.g. CAS001 → Cassette).
              </p>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#6B6480]">
                Brand
              </span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className={inputCls}
                disabled={brands.length === 0}
              >
                {brands.length === 0 ? (
                  <option value="">Create a brand first</option>
                ) : (
                  brands.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.code} — {b.name}
                    </option>
                  ))
                )}
              </select>
            </label>
            {selectedBrand ? (
              <MasterTable
                rows={styles}
                onCreate={async (code, name) => {
                  await createStyle(selectedBrand, code, name);
                  notify(`Style ${code} created`);
                  setStyles(await listStyles(selectedBrand));
                }}
                onRename={async (code, name) => {
                  await renameStyle(selectedBrand, code, name);
                  notify(`Style ${code} renamed`);
                  setStyles(await listStyles(selectedBrand));
                }}
                onDelete={async (code) => {
                  await deleteStyle(selectedBrand, code);
                  notify(`Style ${code} deleted`);
                  setStyles(await listStyles(selectedBrand));
                }}
                codePlaceholder="CAS001"
                codePattern="^[A-Za-z0-9]{1,12}$"
                codeHint="Alphanumeric, max 12"
              />
            ) : (
              <p className="text-sm text-[#6B6480]">Select a brand to manage styles.</p>
            )}
          </div>
        </div>
      )}

      {tab === "colors" && (
        <MasterPanel
          title="Colors"
          description="Global palette codes reused across products (e.g. BLK)."
          rows={colors}
          onCreate={async (code, name) => {
            await createColor(code, name);
            notify(`Color ${code} created`);
            await loadMasters();
          }}
          onRename={async (code, name) => {
            await renameColor(code, name);
            notify(`Color ${code} renamed`);
            await loadMasters();
          }}
          onDelete={async (code) => {
            await deleteColor(code);
            notify(`Color ${code} deleted`);
            await loadMasters();
          }}
          codePlaceholder="BLK"
          codePattern="^[A-Za-z0-9]{1,12}$"
          codeHint="Alphanumeric, max 12"
        />
      )}

      {tab === "sizes" && (
        <MasterPanel
          title="Sizes"
          description="Apparel and bag capacity codes (e.g. MED, OS)."
          rows={sizes}
          onCreate={async (code, name) => {
            await createSize(code, name);
            notify(`Size ${code} created`);
            await loadMasters();
          }}
          onRename={async (code, name) => {
            await renameSize(code, name);
            notify(`Size ${code} renamed`);
            await loadMasters();
          }}
          onDelete={async (code) => {
            await deleteSize(code);
            notify(`Size ${code} deleted`);
            await loadMasters();
          }}
          codePlaceholder="MED"
          codePattern="^[A-Za-z0-9]{1,12}$"
          codeHint="Alphanumeric, max 12"
        />
      )}

      {tab === "editions" && (
        <MasterPanel
          title="Editions"
          description="Optional VariantCode segment (e.g. V = Standard)."
          rows={editions}
          onCreate={async (code, name) => {
            await createEdition(code, name);
            notify(`Edition ${code} created`);
            await loadMasters();
          }}
          onRename={async (code, name) => {
            await renameEdition(code, name);
            notify(`Edition ${code} renamed`);
            await loadMasters();
          }}
          onDelete={async (code) => {
            await deleteEdition(code);
            notify(`Edition ${code} deleted`);
            await loadMasters();
          }}
          codePlaceholder="V"
          codePattern="^[A-Za-z0-9]{1,12}$"
          codeHint="Alphanumeric, max 12"
        />
      )}
    </div>
  );
}

function MasterPanel({
  title,
  description,
  rows,
  onCreate,
  onRename,
  onDelete,
  codePlaceholder,
  codePattern,
  codeHint,
}: {
  title: string;
  description: string;
  rows: CatalogCodeName[];
  onCreate: (code: string, name: string) => Promise<void>;
  onRename: (code: string, name: string) => Promise<void>;
  onDelete: (code: string) => Promise<void>;
  codePlaceholder: string;
  codePattern: string;
  codeHint: string;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-[#E5E3EE] bg-white p-5 shadow-[0_1px_4px_rgba(28,27,31,0.04)]">
      <div>
        <h2 className="text-sm font-semibold text-[#1C1B1F]">{title}</h2>
        <p className="mt-0.5 text-xs text-[#6B6480]">{description}</p>
      </div>
      <MasterTable
        rows={rows}
        onCreate={onCreate}
        onRename={onRename}
        onDelete={onDelete}
        codePlaceholder={codePlaceholder}
        codePattern={codePattern}
        codeHint={codeHint}
      />
    </div>
  );
}

function MasterTable({
  rows,
  onCreate,
  onRename,
  onDelete,
  codePlaceholder,
  codePattern,
  codeHint,
}: {
  rows: CatalogCodeName[];
  onCreate: (code: string, name: string) => Promise<void>;
  onRename: (code: string, name: string) => Promise<void>;
  onDelete: (code: string) => Promise<void>;
  codePlaceholder: string;
  codePattern: string;
  codeHint: string;
}) {
  const { notify } = useNotify();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();
    if (!trimmedCode || !trimmedName) return;
    setSaving(true);
    try {
      await onCreate(trimmedCode, trimmedName);
      setCode("");
      setName("");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Create failed", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className={inputCls}
          placeholder={codePlaceholder}
          pattern={codePattern}
          title={codeHint}
          required
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
          placeholder="Display name"
          required
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#6D4AFF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "…" : "Add"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-[#E5E3EE]">
        <table className="w-full min-w-[320px] text-sm">
          <thead>
            <tr className="border-b border-[#F0EEF8] bg-[#FAFAFA] text-left">
              {["Code", "Name", ""].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#9D98B3]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-[#6B6480]">
                  No entries yet
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.code} className="border-b border-[#F0EEF8] last:border-0">
                  <td className="px-3 py-2 font-mono text-xs text-[#1C1B1F]">
                    {row.code}
                  </td>
                  <td className="px-3 py-2 text-[#1C1B1F]">
                    {editingCode === row.code ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={inputCls}
                        autoFocus
                      />
                    ) : (
                      row.name
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {editingCode === row.code ? (
                        <>
                          <button
                            type="button"
                            className="text-xs font-semibold text-[#6D4AFF] hover:underline"
                            onClick={async () => {
                              try {
                                await onRename(row.code, editName.trim());
                                setEditingCode(null);
                              } catch (err) {
                                notify(
                                  err instanceof Error
                                    ? err.message
                                    : "Rename failed",
                                  "error"
                                );
                              }
                            }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="text-xs font-semibold text-[#9D98B3] hover:underline"
                            onClick={() => setEditingCode(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="text-xs font-semibold text-[#6D4AFF] hover:underline"
                            onClick={() => {
                              setEditingCode(row.code);
                              setEditName(row.name);
                            }}
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            className="text-xs font-semibold text-red-600 hover:underline"
                            onClick={async () => {
                              if (
                                !window.confirm(
                                  `Delete ${row.code}? Only allowed when unused.`
                                )
                              ) {
                                return;
                              }
                              try {
                                await onDelete(row.code);
                              } catch (err) {
                                notify(
                                  err instanceof Error
                                    ? err.message
                                    : "Delete failed",
                                  "error"
                                );
                              }
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
