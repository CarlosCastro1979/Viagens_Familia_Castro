import type { Currency } from "@/lib/types";

export const CATEGORIES = {
  motorhome: { icon: "🚐", name: "Motorhome", color: "#e8f5e9" },
  combustivel: { icon: "⛽", name: "Combustível", color: "#fff8e1" },
  parques: { icon: "🏕️", name: "Parques campismo", color: "#e8f5e9" },
  hoteis: { icon: "🏨", name: "Hotéis", color: "#e3f2fd" },
  voos: { icon: "✈️", name: "Voos", color: "#ede7f6" },
  restaurantes: { icon: "🍽️", name: "Restaurantes", color: "#fce4ec" },
  supermercados: { icon: "🛒", name: "Supermercados", color: "#f3e5f5" },
  entradas: { icon: "🎫", name: "Entradas / Tours", color: "#fff3e0" },
  transporte: { icon: "🚕", name: "Transporte local", color: "#e0f7fa" },
  saude: { icon: "💊", name: "Saúde / Farmácia", color: "#fbe9e7" },
  souvenirs: { icon: "🎁", name: "Souvenirs", color: "#f9fbe7" },
  seguro: { icon: "🛡️", name: "Seguro viagem", color: "#e8eaf6" },
  outros: { icon: "📦", name: "Outros", color: "#f5f5f5" },
} as const;

export type CategoryId = keyof typeof CATEGORIES;

export const TRIP_ICONS = [
  { value: "✈️", label: "Avião" },
  { value: "🚐", label: "Motorhome" },
  { value: "🏖️", label: "Praia" },
  { value: "🏔️", label: "Montanha" },
  { value: "🏙️", label: "Cidade" },
  { value: "🛳️", label: "Cruzeiro" },
  { value: "🦘", label: "Austrália" },
  { value: "🗺️", label: "Aventura" },
] as const;

export const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "EUR", label: "€ EUR" },
  { value: "BRL", label: "R$ BRL" },
  { value: "AUD", label: "A$ AUD" },
  { value: "USD", label: "$ USD" },
];

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  EUR: "€",
  BRL: "R$",
  AUD: "A$",
  USD: "$",
};
