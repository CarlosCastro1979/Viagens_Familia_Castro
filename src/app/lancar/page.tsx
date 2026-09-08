"use client";

import { useMemo, useState } from "react";
import { CardBlock, Field, SelectField } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES, CURRENCIES } from "@/lib/categories";
import { formatEUR, formatOriginal, toEUR, todayISO } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Currency, ExpenseStatus } from "@/lib/types";

export default function AddExpensePage() {
  const { trip, data, addExpense, addPerson, showToast } = useStore();
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("motorhome");
  const [status, setStatus] = useState<ExpenseStatus>("forecast");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [splitOn, setSplitOn] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [newPerson, setNewPerson] = useState("");

  const persons = trip?.persons ?? [];
  const parsedAmount = parseFloat(amount) || 0;
  const activePeople = persons.filter((person) => selected[person] !== false);

  const rateNote = useMemo(() => {
    if (currency === "EUR") return "Moeda base EUR — sem conversão";
    const rate = data.rates[currency] || 1;
    return `Taxa: 1 ${currency} = € ${rate.toFixed(4)} | 100 ${currency} = ${formatEUR(100 * rate)}`;
  }, [currency, data.rates]);

  function toggleSplit() {
    setSplitOn((current) => {
      if (!current) {
        const next: Record<string, boolean> = {};
        persons.forEach((person) => {
          next[person] = true;
        });
        setSelected(next);
      }
      return !current;
    });
  }

  function handleAddPerson() {
    if (addPerson(newPerson)) {
      setSelected((current) => ({ ...current, [newPerson.trim()]: true }));
      setNewPerson("");
    }
  }

  function handleSubmit() {
    if (!trip) {
      showToast("Selecciona uma viagem");
      return;
    }
    if (!desc.trim()) {
      showToast("Adiciona uma descrição");
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      showToast("Valor inválido");
      return;
    }

    let split = null;
    if (splitOn && activePeople.length > 0) {
      const shareOrig = parsedAmount / activePeople.length;
      split = {
        persons: activePeople,
        shareOrig,
        shareCurrency: currency,
        shareEUR: toEUR(shareOrig, currency, data.rates),
      };
    }

    addExpense({
      desc: desc.trim(),
      cat,
      status,
      amount: parsedAmount,
      currency,
      date,
      notes: notes.trim(),
      split,
    });
    setDesc("");
    setAmount("");
    setNotes("");
    setDate(todayISO());
    setSplitOn(false);
    setSelected({});
  }

  if (!trip) {
    return (
      <CardBlock className="py-6 text-center">
        <div className="mb-2 text-4xl">✈️</div>
        <p className="text-sm text-muted-foreground">
          Selecciona primeiro uma viagem no separador Viagens
        </p>
      </CardBlock>
    );
  }

  return (
    <div>
      <CardBlock title="Nova Despesa">
        <div className="space-y-2.5">
          <Field label="Descrição">
            <Input
              value={desc}
              onChange={(event) => setDesc(event.target.value)}
              placeholder="ex: Motorhome Apollo 6 berth"
              className="h-10 bg-[#fafafa] text-[15px]"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Categoria">
              <SelectField value={cat} onChange={(event) => setCat(event.target.value)}>
                {Object.entries(CATEGORIES).map(([id, item]) => (
                  <option key={id} value={id}>
                    {item.icon} {item.name}
                  </option>
                ))}
              </SelectField>
            </Field>
            <Field label="Estado">
              <SelectField
                value={status}
                onChange={(event) => setStatus(event.target.value as ExpenseStatus)}
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
                min="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="h-10 bg-[#fafafa] text-[15px]"
              />
            </Field>
            <Field label="Moeda">
              <SelectField
                value={currency}
                onChange={(event) => setCurrency(event.target.value as Currency)}
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
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-10 bg-[#fafafa] text-[15px]"
              />
            </Field>
          </div>
          <p className="rounded-lg bg-[#f5f5f5] px-2.5 py-2 text-[11px] text-muted-foreground">
            {rateNote}
          </p>
          <Field label="Notas (opcional)">
            <Input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="ex: Reserva confirmada"
              className="h-10 bg-[#fafafa] text-[15px]"
            />
          </Field>
        </div>
      </CardBlock>

      <CardBlock title="Divisão de Custos">
        <p className="mb-2.5 text-[13px] text-muted-foreground">
          Activa para dividir esta despesa entre várias pessoas. O teu custo
          líquido é calculado automaticamente.
        </p>
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex-1 text-sm font-semibold">Dividir esta despesa?</div>
          <button
            type="button"
            onClick={toggleSplit}
            className="relative h-[26px] w-12 shrink-0 rounded-[13px]"
            style={{ background: splitOn ? "#2d9e6e" : "#ddd" }}
          >
            <span
              className="absolute top-0.5 size-[22px] rounded-full bg-white shadow"
              style={{ left: splitOn ? 24 : 2 }}
            />
          </button>
        </div>

        {splitOn ? (
          <div>
            <p className="mb-2 text-[11px] font-bold tracking-[0.07em] text-muted-foreground uppercase">
              Pessoas que participam
            </p>
            {persons.length === 0 ? (
              <p className="py-2 text-[13px] text-muted-foreground">
                Adiciona pessoas na aba Config para dividir
              </p>
            ) : (
              <div>
                {persons.map((person) => {
                  const on = selected[person] !== false;
                  return (
                    <button
                      key={person}
                      type="button"
                      onClick={() =>
                        setSelected((current) => ({ ...current, [person]: !on }))
                      }
                      className="flex w-full items-center gap-2 border-b border-[#f5f5f5] py-1.5 last:border-0"
                    >
                      <span
                        className={`flex size-[22px] items-center justify-center rounded-md border-2 text-xs text-white ${
                          on ? "border-[#2d9e6e] bg-[#2d9e6e]" : "border-[#e0e0e0]"
                        }`}
                      >
                        {on ? "✓" : ""}
                      </span>
                      <span className="flex-1 text-left text-sm font-medium">{person}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="mt-2.5 flex gap-2">
              <Input
                value={newPerson}
                onChange={(event) => setNewPerson(event.target.value)}
                placeholder="Adicionar pessoa..."
                className="h-10 flex-1 bg-[#fafafa]"
              />
              <Button className="h-10 w-11 text-xl" onClick={handleAddPerson}>
                +
              </Button>
            </div>
            {activePeople.length > 0 && parsedAmount > 0 ? (
              <div className="mt-2.5 rounded-lg bg-[#e3f2fd] px-2.5 py-2 text-xs text-[#1565c0]">
                <strong>
                  Divisão igual entre {activePeople.length} pessoa
                  {activePeople.length > 1 ? "s" : ""}:
                </strong>
                <br />
                {activePeople.map((person) => {
                  const share = parsedAmount / activePeople.length;
                  return (
                    <span key={person}>
                      👤 {person}:{" "}
                      <strong>
                        {formatOriginal(share, currency)} ({formatEUR(toEUR(share, currency, data.rates))})
                      </strong>
                      <br />
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </CardBlock>

      <Button className="h-12 w-full rounded-xl text-[15px]" onClick={handleSubmit}>
        Adicionar Despesa
      </Button>
    </div>
  );
}
