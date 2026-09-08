export type Currency = "EUR" | "BRL" | "AUD" | "USD";
export type ExpenseStatus = "paid" | "forecast";

export type Split = {
  persons: string[];
  shareOrig: number;
  shareCurrency: Currency;
  shareEUR: number;
};

export type Expense = {
  id: number;
  desc: string;
  cat: string;
  status: ExpenseStatus;
  amount: number;
  currency: Currency;
  date: string;
  notes: string;
  eur: number;
  split: Split | null;
};

export type Trip = {
  id: number;
  name: string;
  start: string;
  end: string;
  icon: string;
  persons: string[];
  expenses: Expense[];
};

export type Rates = {
  AUD: number;
  BRL: number;
  USD: number;
};

export type AppData = {
  rates: Rates;
  trips: Trip[];
  activeTrip: number | null;
};
