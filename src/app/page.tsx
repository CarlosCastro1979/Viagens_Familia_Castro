"use client";

import { useState } from "react";
import { CardBlock, Field, SelectField } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TRIP_ICONS } from "@/lib/categories";
import { formatEUR, tripDateRange } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function TripsPage() {
  const { data, createTrip, selectTrip, deleteTrip, showToast } = useStore();
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [icon, setIcon] = useState<string>(TRIP_ICONS[0].value);

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast("Dá um nome à viagem");
      return;
    }
    createTrip({ name: trimmed, start, end, icon });
    setName("");
    setStart("");
    setEnd("");
    setIcon(TRIP_ICONS[0].value);
  }

  return (
    <div>
      <CardBlock title="Nova Viagem">
        <div className="space-y-2.5">
          <Field label="Nome da viagem">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="ex: Australia 2026, Paris 2027..."
              className="h-10 bg-[#fafafa] text-[15px]"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Data início">
              <Input
                type="date"
                value={start}
                onChange={(event) => setStart(event.target.value)}
                className="h-10 bg-[#fafafa] text-[15px]"
              />
            </Field>
            <Field label="Data fim">
              <Input
                type="date"
                value={end}
                onChange={(event) => setEnd(event.target.value)}
                className="h-10 bg-[#fafafa] text-[15px]"
              />
            </Field>
          </div>
          <Field label="Ícone">
            <SelectField value={icon} onChange={(event) => setIcon(event.target.value)}>
              {TRIP_ICONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.value} {item.label}
                </option>
              ))}
            </SelectField>
          </Field>
        </div>
      </CardBlock>

      <Button className="mb-3.5 h-12 w-full rounded-xl text-[15px]" onClick={handleCreate}>
        Criar Viagem
      </Button>

      <p className="mb-2 text-[11px] font-bold tracking-[0.07em] text-muted-foreground uppercase">
        As minhas viagens
      </p>

      {data.trips.length === 0 ? (
        <div className="px-5 py-9 text-center text-muted-foreground">
          <div className="mb-2.5 text-4xl">🗺️</div>
          <p className="text-sm">
            Sem viagens ainda.
            <br />
            Cria a primeira acima!
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {data.trips.map((trip) => {
            const total = trip.expenses.reduce((sum, expense) => sum + expense.eur, 0);
            const paid = trip.expenses
              .filter((expense) => expense.status === "paid")
              .reduce((sum, expense) => sum + expense.eur, 0);
            const active = trip.id === data.activeTrip;
            const people = trip.persons?.length ?? 0;

            return (
              <button
                key={trip.id}
                type="button"
                onClick={() => selectTrip(trip.id)}
                className={`flex w-full items-center gap-3 rounded-[14px] bg-card p-3.5 text-left shadow-[0_2px_12px_rgba(0,0,0,0.10)] ${
                  active ? "ring-2 ring-[#2d9e6e]" : ""
                }`}
              >
                <span className="text-[28px]">{trip.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold">{trip.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {tripDateRange(trip.start, trip.end)} · {trip.expenses.length} despesa
                    {trip.expenses.length !== 1 ? "s" : ""} · {people} pessoa
                    {people !== 1 ? "s" : ""}
                  </p>
                  {active ? (
                    <span className="mt-1 inline-block rounded-lg bg-[#e8f5e9] px-1.5 py-0.5 text-[10px] font-bold text-[#1a6b4a]">
                      ✓ Activa
                    </span>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-[#1a6b4a]">{formatEUR(total)}</p>
                  <p className="text-[11px] text-muted-foreground">pago: {formatEUR(paid)}</p>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  className="px-1 text-lg text-[#ccc]"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (
                      confirm(
                        `Apagar a viagem "${trip.name}" e todas as suas despesas?`,
                      )
                    ) {
                      deleteTrip(trip.id);
                    }
                  }}
                >
                  🗑
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
