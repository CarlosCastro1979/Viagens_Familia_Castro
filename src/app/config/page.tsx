"use client";

import { useState } from "react";
import { CardBlock } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, formatEUR } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function ConfigPage() {
  const {
    data,
    trip,
    saveRates,
    addPerson,
    removePerson,
    exportJson,
    importJson,
    deleteTrip,
    clearAll,
    showToast,
    cloud,
    sync,
    syncError,
    saveCloud,
    syncNow,
  } = useStore();
  const [aud, setAud] = useState(String(data.rates.AUD));
  const [brl, setBrl] = useState(String(data.rates.BRL));
  const [usd, setUsd] = useState(String(data.rates.USD));
  const [personName, setPersonName] = useState("");
  const [saved, setSaved] = useState(false);
  const [sbUrl, setSbUrl] = useState(cloud.url);
  const [sbKey, setSbKey] = useState(cloud.key);
  const [sbRow, setSbRow] = useState(cloud.rowId);

  function handleSaveRates() {
    saveRates({
      AUD: parseFloat(aud) || 0.6,
      BRL: parseFloat(brl) || 0.16,
      USD: parseFloat(usd) || 0.92,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  function handleImport() {
    const json = prompt("Cola o JSON de backup aqui:");
    if (!json) return;
    importJson(json);
  }

  const tripTotal = trip?.expenses.reduce((sum, expense) => sum + expense.eur, 0) ?? 0;

  return (
    <div>
      <CardBlock title="Taxas de Câmbio → EUR">
        <p className="mb-3 rounded-lg bg-[#f5f5f5] px-2.5 py-2 text-[11px] text-muted-foreground">
          Actualiza conforme o câmbio do dia. Ao guardar, todos os valores são recalculados.
        </p>
        <RateRow
          flag="🇦🇺"
          title="AUD → EUR"
          subtitle="Dólar australiano"
          value={aud}
          onChange={setAud}
        />
        <RateRow
          flag="🇧🇷"
          title="BRL → EUR"
          subtitle="Real brasileiro"
          value={brl}
          onChange={setBrl}
        />
        <RateRow
          flag="🇺🇸"
          title="USD → EUR"
          subtitle="Dólar americano"
          value={usd}
          onChange={setUsd}
        />
        <Button className="mt-3.5 h-12 w-full rounded-xl" onClick={handleSaveRates}>
          Guardar Câmbios
        </Button>
        {saved ? (
          <p className="mt-2 text-center text-[13px] text-[#1a6b4a]">✓ Câmbios guardados!</p>
        ) : null}
      </CardBlock>

      <CardBlock title="Referência (100 unidades → EUR)">
        {(
          [
            ["AUD", "🇦🇺", "A$"],
            ["BRL", "🇧🇷", "R$"],
            ["USD", "🇺🇸", "$"],
          ] as const
        ).map(([code, flag, symbol]) => (
          <div
            key={code}
            className="flex items-center justify-between border-b border-[#f0f0f0] py-2 last:border-0"
          >
            <span className="text-[13px]">
              {flag} 100 {symbol} {code}
            </span>
            <span className="font-bold text-primary">
              {formatEUR(100 * data.rates[code])}
            </span>
          </div>
        ))}
      </CardBlock>

      <CardBlock title="Supabase">
        <p className="mb-3 rounded-lg bg-[#f5f5f5] px-2.5 py-2 text-[11px] text-muted-foreground">
          A app grava no mesmo sítio que o HTML: tabela <strong>fct_trips</strong>,
          linha <strong>{sbRow || "carlos_castro_trips"}</strong>. A chave anon do
          ficheiro antigo já não é aceite — cola a chave nova em Project Settings
          → API.
        </p>
        <p className="mb-3 text-[13px]">
          Estado:{" "}
          <strong>
            {sync === "cloud"
              ? "ligado à nuvem"
              : sync === "saving"
                ? "a guardar…"
                : sync === "error"
                  ? "erro na nuvem (a usar cópia local)"
                  : "só neste telemóvel"}
          </strong>
        </p>
        {syncError ? (
          <p className="mb-3 text-[12px] text-[#e67e22]">{syncError}</p>
        ) : null}
        <div className="space-y-2.5">
          <label className="block space-y-1">
            <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Project URL
            </span>
            <Input
              value={sbUrl}
              onChange={(event) => setSbUrl(event.target.value)}
              placeholder="https://xxxx.supabase.co"
              className="h-10 bg-[#fafafa]"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Anon key
            </span>
            <Input
              type="password"
              value={sbKey}
              onChange={(event) => setSbKey(event.target.value)}
              placeholder="eyJhbGciOi..."
              className="h-10 bg-[#fafafa]"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Row id
            </span>
            <Input
              value={sbRow}
              onChange={(event) => setSbRow(event.target.value)}
              className="h-10 bg-[#fafafa]"
            />
          </label>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            className="h-11"
            onClick={() =>
              void saveCloud({ url: sbUrl.trim(), key: sbKey.trim(), rowId: sbRow.trim() })
            }
          >
            Ligar nuvem
          </Button>
          <Button variant="secondary" className="h-11" onClick={() => void syncNow()}>
            Sincronizar agora
          </Button>
        </div>
      </CardBlock>

      <CardBlock title="Pessoas da viagem actual">
        {(trip?.persons ?? []).length === 0 ? (
          <p className="text-[13px] text-muted-foreground">Nenhuma pessoa adicionada</p>
        ) : (
          (trip?.persons ?? []).map((person) => (
            <div
              key={person}
              className="flex items-center justify-between border-b border-[#f0f0f0] py-1.5 last:border-0"
            >
              <span className="text-sm font-medium">👤 {person}</span>
              <button
                type="button"
                className="text-lg text-[#ccc]"
                onClick={() => {
                  if (confirm(`Remover ${person}?`)) removePerson(person);
                }}
              >
                ×
              </button>
            </div>
          ))
        )}
        <div className="mt-2.5 flex gap-2">
          <Input
            value={personName}
            onChange={(event) => setPersonName(event.target.value)}
            placeholder="Nome da pessoa..."
            className="h-10 flex-1 bg-[#fafafa]"
          />
          <Button
            className="h-10 w-11 text-xl"
            onClick={() => {
              if (!trip) {
                showToast("Selecciona uma viagem");
                return;
              }
              if (addPerson(personName)) setPersonName("");
            }}
          >
            +
          </Button>
        </div>
      </CardBlock>

      <CardBlock title="Dados da Viagem Activa">
        {trip ? (
          <div className="text-[13px] leading-8 text-muted-foreground">
            ✈️ Viagem: <strong className="text-foreground">{trip.name}</strong>
            <br />
            📅 Datas:{" "}
            <strong className="text-foreground">
              {trip.start ? `${formatDate(trip.start)} → ${formatDate(trip.end)}` : "Sem datas"}
            </strong>
            <br />
            💶 Total: <strong className="text-foreground">{formatEUR(tripTotal)}</strong>
            <br />
            📝 Despesas: <strong className="text-foreground">{trip.expenses.length}</strong>
          </div>
        ) : (
          <p className="text-[13px] text-muted-foreground">Nenhuma viagem activa</p>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="secondary" className="h-11" onClick={exportJson}>
            📤 Exportar JSON
          </Button>
          <Button
            variant="outline"
            className="h-11 bg-[#fff3e0] text-[#e67e22]"
            onClick={handleImport}
          >
            📥 Importar JSON
          </Button>
          <Button
            variant="destructive"
            className="h-11"
            onClick={() => {
              if (!trip) return;
              if (confirm(`Apagar "${trip.name}" e todas as suas despesas?`)) {
                deleteTrip(trip.id);
              }
            }}
          >
            🗑️ Apagar viagem
          </Button>
          <Button
            variant="destructive"
            className="h-11"
            onClick={() => {
              if (confirm("Apagar TODOS os dados de TODAS as viagens? Irreversível.")) {
                clearAll();
              }
            }}
          >
            ⚠️ Apagar tudo
          </Button>
        </div>
      </CardBlock>
    </div>
  );
}

function RateRow({
  flag,
  title,
  subtitle,
  value,
  onChange,
}: {
  flag: string;
  title: string;
  subtitle: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#f0f0f0] py-2 last:border-0">
      <div>
        <p className="font-semibold">
          {flag} {title}
        </p>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
      <Input
        type="number"
        step="0.0001"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-[100px] bg-[#fafafa] text-right"
      />
    </div>
  );
}
