import { CURRENCY_SYMBOL } from "@/lib/categories";
import type { Currency, Rates } from "@/lib/types";

export function toEUR(amount: number, currency: Currency, rates: Rates) {
  return currency === "EUR" ? amount : amount * (rates[currency] || 1);
}

export function formatEUR(value: number) {
  return `€ ${value
    .toFixed(2)
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

export function formatOriginal(amount: number, currency: Currency) {
  return `${CURRENCY_SYMBOL[currency]} ${amount.toFixed(2).replace(".", ",")}`;
}

export function formatDate(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function tripDateRange(start: string, end: string) {
  if (start && end) return `${formatDate(start)} → ${formatDate(end)}`;
  if (start) return `${formatDate(start)} →`;
  return "Sem datas";
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
