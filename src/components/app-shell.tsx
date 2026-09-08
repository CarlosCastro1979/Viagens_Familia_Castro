"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatEUR, formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Viagens", tab: "✈ Viagens", icon: "🗺️" },
  { href: "/lancar", label: "Lançar", tab: "+ Lançar", icon: "➕" },
  { href: "/despesas", label: "Despesas", tab: "Despesas", icon: "📋" },
  { href: "/resumo", label: "Resumo", tab: "Resumo", icon: "📊" },
  { href: "/config", label: "Config", tab: "Câmbios", icon: "⚙️" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { trip, toast, ready, sync, syncError } = useStore();
  const total = trip?.expenses.reduce((sum, expense) => sum + expense.eur, 0) ?? 0;
  const subtitle = trip
    ? `${trip.icon} ${trip.name}${trip.start ? ` · ${formatDate(trip.start)}` : ""}`
    : "Selecciona ou cria uma viagem";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-background">
      <header className="sticky top-0 z-40 bg-gradient-to-br from-[#0a3d2e] to-[#1a6b4a] px-4 py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-3">
          <Image
            src="/familia.jpg"
            alt="Família Castro"
            width={48}
            height={48}
            className="size-12 shrink-0 rounded-full border-2 border-accent object-cover"
            priority
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-bold tracking-wide text-accent">
              Familia Castro Trips
            </p>
            <p className="truncate text-[11px] text-white/75">{subtitle}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-primary">
              {formatEUR(total)}
            </div>
            <p className="mt-1 text-[10px] text-white/70">
              {sync === "cloud"
                ? "☁ Supabase"
                : sync === "saving"
                  ? "A guardar…"
                  : sync === "loading"
                    ? "A ler nuvem…"
                    : sync === "error"
                      ? "⚠ Local"
                      : "● Local"}
            </p>
          </div>
        </div>
      </header>

      <nav className="sticky top-[76px] z-30 flex border-b-2 border-[#2d9e6e] bg-primary">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 border-b-[3px] px-0.5 py-2 text-center text-[11px] font-semibold",
                active
                  ? "border-accent text-accent"
                  : "border-transparent text-white/50",
              )}
            >
              {item.tab}
            </Link>
          );
        })}
      </nav>

      <main className="flex-1 px-3.5 py-3.5 pb-24">
        {syncError ? (
          <div className="mb-3 rounded-[14px] bg-[#fff3e0] px-3 py-2 text-[12px] text-[#e67e22] shadow-[0_2px_12px_rgba(0,0,0,0.10)]">
            {syncError} Abre Câmbios para colar a chave nova.
          </div>
        ) : null}
        {!ready ? (
          <div className="rounded-[14px] bg-card p-8 text-center text-sm text-muted-foreground shadow-[0_2px_12px_rgba(0,0,0,0.10)]">
            A carregar o caderno de viagens…
          </div>
        ) : (
          children
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-xl bg-primary px-0 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] shadow-[0_-2px_12px_rgba(0,0,0,0.2)]">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-semibold",
                active ? "text-accent" : "text-white/45",
              )}
            >
              <span className="text-[21px] leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {toast ? (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#222] px-4 py-2.5 text-[13px] font-semibold text-white">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
