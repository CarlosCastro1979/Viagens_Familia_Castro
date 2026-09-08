"use client";

import { useMemo, useState } from "react";
import { Field, SelectField } from "@/components/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CATEGORIES, CURRENCIES } from "@/lib/categories";
import { formatDate, formatEUR, formatOriginal, toEUR } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Currency, Expense, ExpenseStatus } from "@/lib/types";

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "paid", label: "✓ Pagos" },
  { id: "forecast", label: "⏳ Previsão" },
  { id: "split", label: "👥 Divididos" },
  { id: "voos", label: "✈️ Voos" },
  { id: "motorhome", label: "🚐 Motorhome" },
  { id: "hoteis", label: "🏨 Hotéis" },
  { id: "entradas", label: "🎫 Tours" },
  { id: "restaurantes", label: "🍽️ Rest." },
  { id: "supermercados", label: "🛒 Super" },
  { id: "combustivel", label: "⛽ Gasolina" },
  { id: "parques", label: "🏕️ Parques" },
];

export default function ExpensesPage() {
  const { trip, data, updateExpense, deleteExpense } = useStore();
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<Expense | null>(null);
  const [draft, setDraft] = useState({
    desc: "",
    cat: "outros",
    status: "forecast" as ExpenseStatus,
    amount: "",
    currency: "EUR" as Currency,
    date: "",
    notes: "",
  });

  const filtered = useMemo(() => {
    const expenses = trip?.expenses ?? [];
    if (filter === "paid") return expenses.filter((item) => item.status === "paid");
    if (filter === "forecast") return expenses.filter((item) => item.status === "forecast");
    if (filter === "split") return expenses.filter((item) => item.split);
    if (filter !== "all") return expenses.filter((item) => item.cat === filter);
    return expenses;
  }, [filter, trip]);

  function openEdit(expense: Expense) {
    setEditing(expense);
    setDraft({
      desc: expense.desc,
      cat: expense.cat,
      status: expense.status,
      amount: String(expense.amount),
      currency: expense.currency,
      date: expense.date,
      notes: expense.notes,
    });
  }

  function saveEdit() {
    if (!editing) return;
    const amount = parseFloat(draft.amount);
    if (!draft.desc.trim() || !amount || amount <= 0) return;
    let split = editing.split;
    if (split && (draft.currency !== editing.currency || amount !== editing.amount)) {
      const shareOrig = amount / split.persons.length;
      split = {
        ...split,
        shareOrig,
        shareCurrency: draft.currency,
        shareEUR: toEUR(shareOrig, draft.currency, data.rates),
      };
    }
    updateExpense(editing.id, {
      desc: draft.desc.trim(),
      cat: draft.cat,
      status: draft.status,
      amount,
      currency: draft.currency,
      date: draft.date,
      notes: draft.notes.trim(),
      split,
    });
    setEditing(null);
  }

  return (
    <div>
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`shrink-0 rounded-full border-[1.5px] px-2.5 py-1.5 text-xs font-semibold ${
              filter === item.id
                ? "border-primary bg-primary text-white"
                : "border-[#e0e0e0] bg-white text-muted-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-9 text-center text-muted-foreground">
          <div className="mb-2.5 text-4xl">🦘</div>
          <p className="text-sm">
            Sem despesas aqui.
            <br />
            Adiciona a primeira!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((expense) => {
            const cat = CATEGORIES[expense.cat as keyof typeof CATEGORIES] ?? CATEGORIES.outros;
            const paid = expense.status === "paid";
            return (
              <div
                key={expense.id}
                className="flex cursor-pointer items-start gap-2.5 rounded-[14px] bg-card px-3 py-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.10)]"
                onClick={() => openEdit(expense)}
              >
                <div
                  className="mt-0.5 flex size-[38px] shrink-0 items-center justify-center rounded-[11px] text-[19px]"
                  style={{ background: cat.color }}
                >
                  {cat.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {expense.desc}
                    {expense.split ? (
                      <span className="ml-1 rounded-lg bg-[#e3f2fd] px-1.5 py-0.5 text-[10px] font-semibold text-[#1565c0]">
                        👥 {expense.split.persons.length} pessoas
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {cat.name} · {formatDate(expense.date)}
                  </p>
                  {expense.notes ? (
                    <p className="text-[11px] text-muted-foreground italic">{expense.notes}</p>
                  ) : null}
                  {expense.split ? (
                    <p className="mt-0.5 text-[11px] text-[#1565c0]">
                      Tua parte: {formatOriginal(expense.split.shareOrig, expense.split.shareCurrency)}{" "}
                      = {formatEUR(expense.split.shareEUR)} · {expense.split.persons.join(", ")}
                    </p>
                  ) : null}
                  <span
                    className={`mt-1 inline-block rounded-lg px-1.5 py-0.5 text-[10px] font-bold ${
                      paid ? "bg-[#e8f5e9] text-[#1a6b4a]" : "bg-[#fff3e0] text-[#e67e22]"
                    }`}
                  >
                    {paid ? "✓ Pago" : "⏳ Previsão"}
                  </span>
                  <span className="ml-1.5 text-[10px] text-[#bbb]">✏️ editar</span>
                </div>
                <div className="shrink-0 text-right">
                  {expense.currency !== "EUR" ? (
                    <p className="text-xs text-muted-foreground">
                      {formatOriginal(expense.amount, expense.currency)}
                    </p>
                  ) : null}
                  <p className={`text-sm font-bold ${paid ? "text-[#1a6b4a]" : "text-[#e67e22]"}`}>
                    {formatEUR(expense.eur)}
                  </p>
                </div>
                <button
                  type="button"
                  className="px-1 text-lg text-[#ccc]"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (confirm("Apagar esta despesa?")) deleteExpense(expense.id);
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>✏️ Editar Despesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-2.5">
            <Field label="Descrição">
              <Input
                value={draft.desc}
                onChange={(event) => setDraft({ ...draft, desc: event.target.value })}
                className="h-10 bg-[#fafafa]"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Categoria">
                <SelectField
                  value={draft.cat}
                  onChange={(event) => setDraft({ ...draft, cat: event.target.value })}
                >
                  {Object.entries(CATEGORIES).map(([id, item]) => (
                    <option key={id} value={id}>
                      {item.icon} {item.name}
                    </option>
                  ))}
                </SelectField>
              </Field>
              <Field label="Estado">
                <SelectField
                  value={draft.status}
                  onChange={(event) =>
                    setDraft({ ...draft, status: event.target.value as ExpenseStatus })
                  }
                >
                  <option value="forecast">⏳ Previsão</option>
                  <option value="paid">✓ Pago</option>
                </SelectField>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Valor total">
                <Input
                  type="number"
                  step="0.01"
                  value={draft.amount}
                  onChange={(event) => setDraft({ ...draft, amount: event.target.value })}
                  className="h-10 bg-[#fafafa]"
                />
              </Field>
              <Field label="Moeda">
                <SelectField
                  value={draft.currency}
                  onChange={(event) =>
                    setDraft({ ...draft, currency: event.target.value as Currency })
                  }
                >
                  {CURRENCIES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </SelectField>
              </Field>
              <Field label="Data">
                <Input
                  type="date"
                  value={draft.date}
                  onChange={(event) => setDraft({ ...draft, date: event.target.value })}
                  className="h-10 bg-[#fafafa]"
                />
              </Field>
            </div>
            <Field label="Notas (opcional)">
              <Input
                value={draft.notes}
                onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                className="h-10 bg-[#fafafa]"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Button variant="destructive" className="h-11" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button className="h-11" onClick={saveEdit}>
                ✓ Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
