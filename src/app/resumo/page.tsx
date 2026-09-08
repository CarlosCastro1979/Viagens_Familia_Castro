"use client";

import { CardBlock } from "@/components/field";
import { CATEGORIES } from "@/lib/categories";
import { formatEUR } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function SummaryPage() {
  const { trip } = useStore();
  const expenses = trip?.expenses ?? [];
  const paid = expenses
    .filter((item) => item.status === "paid")
    .reduce((sum, item) => sum + item.eur, 0);
  const forecast = expenses
    .filter((item) => item.status === "forecast")
    .reduce((sum, item) => sum + item.eur, 0);
  const total = paid + forecast;
  const percent = total > 0 ? Math.round((paid / total) * 100) : 0;

  const splitExpenses = expenses.filter((item) => item.split);
  const personTotals: Record<string, { eur: number; count: number }> = {};
  splitExpenses.forEach((expense) => {
    expense.split?.persons.forEach((person) => {
      if (!personTotals[person]) personTotals[person] = { eur: 0, count: 0 };
      personTotals[person].eur += expense.split?.shareEUR ?? 0;
      personTotals[person].count += 1;
    });
  });

  const byCategory: Record<string, { paid: number; forecast: number; count: number }> = {};
  expenses.forEach((expense) => {
    if (!byCategory[expense.cat]) {
      byCategory[expense.cat] = { paid: 0, forecast: 0, count: 0 };
    }
    byCategory[expense.cat][expense.status] += expense.eur;
    byCategory[expense.cat].count += 1;
  });
  const sorted = Object.entries(byCategory).sort(
    (a, b) => b[1].paid + b[1].forecast - (a[1].paid + a[1].forecast),
  );

  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-2.5">
        <div className="rounded-[14px] bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] p-3.5 text-center">
          <p className="text-[10px] font-bold tracking-[0.08em] text-[#555] uppercase">Pago</p>
          <p className="mt-1 text-xl font-extrabold text-primary">{formatEUR(paid)}</p>
        </div>
        <div className="rounded-[14px] bg-gradient-to-br from-[#fff3e0] to-[#ffe0b2] p-3.5 text-center">
          <p className="text-[10px] font-bold tracking-[0.08em] text-[#555] uppercase">Previsto</p>
          <p className="mt-1 text-xl font-extrabold text-[#e67e22]">{formatEUR(forecast)}</p>
        </div>
      </div>

      {splitExpenses.length > 0 ? (
        <CardBlock title="Resumo de Divisões">
          {Object.entries(personTotals).map(([person, totals]) => (
            <div
              key={person}
              className="flex items-center justify-between border-b border-[#f0f0f0] py-1.5 last:border-0"
            >
              <span className="text-[13px] font-medium">👤 {person}</span>
              <span className="text-[13px] font-bold text-[#1565c0]">
                {formatEUR(totals.eur)} ({totals.count} desp.)
              </span>
            </div>
          ))}
          <p className="mt-2 text-[11px] text-muted-foreground">
            Total em despesas divididas:{" "}
            {formatEUR(splitExpenses.reduce((sum, item) => sum + item.eur, 0))}
          </p>
        </CardBlock>
      ) : null}

      <CardBlock>
        <div className="mb-1.5 flex justify-between text-[11px] text-muted-foreground">
          <span>Orçamento executado</span>
          <span>{percent}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded bg-[#e0e0e0]">
          <div
            className="h-full rounded bg-gradient-to-r from-[#2d9e6e] to-[#f0c040] transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-1 text-center text-[11px] text-muted-foreground">
          Pago ÷ (Pago + Previsto)
        </p>
      </CardBlock>

      <CardBlock title="Por Categoria">
        {sorted.length === 0 ? (
          <div className="py-5 text-center text-muted-foreground">
            <div className="mb-2 text-4xl">📊</div>
            <p className="text-sm">Sem despesas ainda</p>
          </div>
        ) : (
          sorted.map(([id, values]) => {
            const cat = CATEGORIES[id as keyof typeof CATEGORIES] ?? CATEGORIES.outros;
            const catTotal = values.paid + values.forecast;
            const share = total > 0 ? Math.round((catTotal / total) * 100) : 0;
            return (
              <div key={id} className="flex items-center gap-2.5 border-b border-[#f0f0f0] py-2 last:border-0">
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-[11px] text-[17px]"
                  style={{ background: cat.color }}
                >
                  {cat.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold">{cat.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {values.count} lançamento{values.count > 1 ? "s" : ""} · {share}% do total
                  </p>
                  <div className="mt-1 h-1 overflow-hidden rounded bg-[#e0e0e0]">
                    <div
                      className="h-full rounded bg-gradient-to-r from-[#2d9e6e] to-[#f0c040]"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-primary">{formatEUR(catTotal)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {values.paid > 0 ? (
                      <span className="text-[#1a6b4a]">✓{formatEUR(values.paid)}</span>
                    ) : null}{" "}
                    {values.forecast > 0 ? (
                      <span className="text-[#e67e22]">⏳{formatEUR(values.forecast)}</span>
                    ) : null}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </CardBlock>
    </div>
  );
}
