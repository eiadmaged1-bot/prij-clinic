"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";

export type SelectedBasketItem = {
  key: string;
  stableId: string;
  kind: string;
  label: string;
  subtitle?: string;
  duplicateScope?: string;
};

type RemovedBatch<T> = { items: T[]; index: number };

export function addUniqueBasketItem<T extends SelectedBasketItem>(items: T[], item: T) {
  const duplicateKey = `${item.kind}:${item.stableId}:${item.duplicateScope ?? ""}`;
  return items.some((entry) => `${entry.kind}:${entry.stableId}:${entry.duplicateScope ?? ""}` === duplicateKey) ? items : [...items, item];
}

export function SelectedBasket<T extends SelectedBasketItem>({
  title = "Selected basket",
  items,
  onChange,
  onSave,
  renderDetails,
  saving = false,
  signed = false,
  amendmentReason = "",
  onAmendmentReasonChange,
  emptyMessage = "No items selected.",
  saveLabel = "Save selected"
}: {
  title?: string;
  items: T[];
  onChange: (items: T[]) => void;
  onSave: (items: T[]) => Promise<void>;
  renderDetails?: (item: T, index: number) => ReactNode;
  saving?: boolean;
  signed?: boolean;
  amendmentReason?: string;
  onAmendmentReasonChange?: (reason: string) => void;
  emptyMessage?: string;
  saveLabel?: string;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [removed, setRemoved] = useState<RemovedBatch<T> | null>(null);
  const [status, setStatus] = useState("");
  const [localSaving, setLocalSaving] = useState(false);
  const busy = saving || localSaving;
  const canSave = items.length > 0 && !busy && (!signed || amendmentReason.trim().length > 0);
  const itemKeys = useMemo(() => new Set(items.map((item) => item.key)), [items]);
  useEffect(() => {
    if (openKey && !itemKeys.has(openKey)) setOpenKey(null);
  }, [itemKeys, openKey]);

  function remove(index: number) {
    const item = items[index];
    if (!item) return;
    setRemoved({ items: [item], index });
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  function clearAll() {
    if (!items.length) return;
    setRemoved({ items: [...items], index: 0 });
    setOpenKey(null);
    onChange([]);
  }

  function undo() {
    if (!removed) return;
    const next = [...items];
    next.splice(Math.min(removed.index, next.length), 0, ...removed.items);
    onChange(next);
    setRemoved(null);
  }

  function move(index: number, offset: -1 | 1) {
    const destination = index + offset;
    if (destination < 0 || destination >= items.length) return;
    const next = [...items];
    [next[index], next[destination]] = [next[destination]!, next[index]!];
    onChange(next);
  }

  async function save() {
    setLocalSaving(true);
    setStatus("Saving selected items…");
    try {
      await onSave(items);
      setRemoved(null);
      setStatus("Saved. Changes will survive refresh.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed. Every selected item was preserved for retry.");
    } finally {
      setLocalSaving(false);
    }
  }

  return (
    <section className="selected-basket" aria-label={title}>
      <div className="section-heading compact-section-heading">
        <div><h3>{title}</h3><p className="muted">Review the basket, then save once.</p></div>
        <span className="badge">{items.length} selected</span>
      </div>
      <div className="selected-basket-list">
        {items.map((item, index) => {
          const open = openKey === item.key;
          return <article className={`selected-basket-row ${open ? "open" : ""}`} key={item.key}>
            <button className="selected-basket-row-summary" type="button" aria-expanded={open} onClick={() => setOpenKey(open ? null : item.key)}>
              <span><strong>{item.label}</strong>{item.subtitle ? <small>{item.subtitle}</small> : null}</span>
              <span>{open ? "Collapse" : "Edit details"}</span>
            </button>
            {open && renderDetails ? <div className="selected-basket-details">{renderDetails(item, index)}</div> : null}
            <div className="selected-basket-row-actions">
              <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move ${item.label} up`}>↑</button>
              <button type="button" disabled={index === items.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${item.label} down`}>↓</button>
              <button type="button" onClick={() => remove(index)}>Remove</button>
            </div>
          </article>;
        })}
        {!items.length ? <p className="empty-state compact smart-empty-state">{emptyMessage}</p> : null}
      </div>
      {signed ? <label className="wide">Amendment reason<input value={amendmentReason} onChange={(event) => onAmendmentReasonChange?.(event.target.value)} required /></label> : null}
      <div className="selected-basket-sticky-actions">
        <span>{items.length} selected</span>
        {removed ? <button className="button secondary compact" type="button" onClick={undo}>Undo</button> : null}
        <button className="button secondary compact" type="button" disabled={!items.length || busy} onClick={clearAll}>Clear all</button>
        <button className="button secondary compact" type="button" disabled={!openKey} onClick={() => setOpenKey(null)}>Collapse all</button>
        <button className="button compact" type="button" disabled={!canSave} onClick={() => void save()}>{busy ? "Saving…" : saveLabel}</button>
      </div>
      {status ? <p className={status.includes("failed") ? "warning-text" : "muted"} role={status.includes("failed") ? "alert" : "status"}>{status}</p> : null}
    </section>
  );
}
