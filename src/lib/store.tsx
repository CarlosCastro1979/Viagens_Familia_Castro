"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { SEED } from "@/data/seed";
import { toEUR } from "@/lib/format";
import {
  readCloudConfig,
  saveToCloud,
  seedCloudIfEmpty,
  writeCloudConfig,
  type CloudConfig,
} from "@/lib/supabase";
import type {
  AppData,
  Currency,
  Expense,
  ExpenseStatus,
  Rates,
  Split,
  Trip,
} from "@/lib/types";

const STORAGE_KEY = "familia_castro_trips";

export type SyncStatus = "loading" | "local" | "saving" | "cloud" | "error";

type ExpenseDraft = {
  desc: string;
  cat: string;
  status: ExpenseStatus;
  amount: number;
  currency: Currency;
  date: string;
  notes: string;
  split: Split | null;
};

type Store = {
  ready: boolean;
  data: AppData;
  trip: Trip | null;
  toast: string | null;
  sync: SyncStatus;
  syncError: string | null;
  cloud: CloudConfig;
  showToast: (message: string) => void;
  selectTrip: (id: number) => void;
  createTrip: (input: { name: string; start: string; end: string; icon: string }) => void;
  deleteTrip: (id: number) => void;
  addPerson: (name: string) => boolean;
  removePerson: (name: string) => void;
  addExpense: (draft: ExpenseDraft) => void;
  updateExpense: (id: number, draft: ExpenseDraft) => void;
  deleteExpense: (id: number) => void;
  saveRates: (rates: Rates) => void;
  exportJson: () => void;
  importJson: (raw: string) => boolean;
  clearAll: () => void;
  saveCloud: (config: CloudConfig) => Promise<void>;
  syncNow: () => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

function cloneSeed() {
  return structuredClone(SEED);
}

function readStored(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneSeed();
    const parsed = JSON.parse(raw) as AppData;
    return parsed?.trips ? parsed : cloneSeed();
  } catch {
    return cloneSeed();
  }
}

let memory: AppData | null = null;
const listeners = new Set<() => void>();
let syncStatus: SyncStatus = "local";
let syncError: string | null = null;
const syncListeners = new Set<() => void>();
let saveTimer: number | null = null;

function emit() {
  for (const listener of listeners) listener();
}

function emitSync() {
  for (const listener of syncListeners) listener();
}

function setSync(status: SyncStatus, error: string | null = null) {
  syncStatus = status;
  syncError = error;
  emitSync();
}

function getSnapshot() {
  if (!memory) memory = readStored();
  return memory;
}

function getServerSnapshot() {
  return SEED;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function writeLocal(next: AppData) {
  memory = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emit();
}

function queueCloudSave(data: AppData) {
  const config = readCloudConfig();
  if (!config.key) {
    setSync("local");
    return;
  }
  if (saveTimer) window.clearTimeout(saveTimer);
  setSync("saving");
  saveTimer = window.setTimeout(() => {
    void saveToCloud(data, config)
      .then(() => setSync("cloud"))
      .catch((error: Error) => setSync("error", error.message));
  }, 400);
}

function write(next: AppData) {
  writeLocal(next);
  queueCloudSave(next);
}

function persist(updater: (current: AppData) => AppData) {
  write(updater(getSnapshot()));
}

function recalcTrip(trip: Trip, rates: Rates): Trip {
  return {
    ...trip,
    expenses: trip.expenses.map((expense) => {
      const eur = toEUR(expense.amount, expense.currency, rates);
      const split = expense.split
        ? {
            ...expense.split,
            shareEUR: toEUR(expense.split.shareOrig, expense.split.shareCurrency, rates),
          }
        : null;
      return { ...expense, eur, split };
    }),
  };
}

async function hydrateFromCloud() {
  const config = readCloudConfig();
  if (!config.key) {
    setSync("local");
    return;
  }
  setSync("loading");
  try {
    const remote = await seedCloudIfEmpty(getSnapshot(), config);
    writeLocal(remote);
    setSync("cloud");
  } catch (error) {
    setSync("error", error instanceof Error ? error.message : "Erro na nuvem");
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const sync = useSyncExternalStore(
    (listener) => {
      syncListeners.add(listener);
      return () => syncListeners.delete(listener);
    },
    () => syncStatus,
    () => "local" as SyncStatus,
  );
  const error = useSyncExternalStore(
    (listener) => {
      syncListeners.add(listener);
      return () => syncListeners.delete(listener);
    },
    () => syncError,
    () => null,
  );

  useEffect(() => {
    void hydrateFromCloud();

    function onVisible() {
      if (document.visibilityState === "visible" && syncStatus !== "saving") {
        void hydrateFromCloud();
      }
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && syncStatus !== "saving") {
        void hydrateFromCloud();
      }
    }, 20000);

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  const toastRef = useRef<number | null>(null);
  const toastSnapshot = useRef<string | null>(null);
  const toastListeners = useRef(new Set<() => void>());

  const subscribeToast = useCallback((listener: () => void) => {
    toastListeners.current.add(listener);
    return () => toastListeners.current.delete(listener);
  }, []);
  const getToast = useCallback(() => toastSnapshot.current, []);
  const toast = useSyncExternalStore(subscribeToast, getToast, getToast);

  const showToast = useCallback((message: string) => {
    toastSnapshot.current = message;
    toastListeners.current.forEach((listener) => listener());
    if (toastRef.current) window.clearTimeout(toastRef.current);
    toastRef.current = window.setTimeout(() => {
      toastSnapshot.current = null;
      toastListeners.current.forEach((listener) => listener());
    }, 2200);
  }, []);

  const trip = data.trips.find((item) => item.id === data.activeTrip) ?? null;

  const value = useMemo<Store>(
    () => ({
      ready: true,
      data,
      trip,
      toast,
      sync,
      syncError: error,
      cloud: readCloudConfig(),
      showToast,
      selectTrip(id) {
        persist((current) => ({ ...current, activeTrip: id }));
        showToast("Viagem seleccionada!");
      },
      createTrip({ name, start, end, icon }) {
        const next: Trip = {
          id: Date.now(),
          name,
          start,
          end,
          icon,
          expenses: [],
          persons: ["Carlos"],
        };
        persist((current) => ({
          ...current,
          trips: [next, ...current.trips],
          activeTrip: next.id,
        }));
        showToast("✓ Viagem criada! Podes começar a lançar despesas.");
      },
      deleteTrip(id) {
        persist((current) => {
          const trips = current.trips.filter((item) => item.id !== id);
          return {
            ...current,
            trips,
            activeTrip:
              current.activeTrip === id ? (trips[0]?.id ?? null) : current.activeTrip,
          };
        });
        showToast("Viagem apagada");
      },
      addPerson(name) {
        const trimmed = name.trim();
        const currentTrip =
          getSnapshot().trips.find((item) => item.id === getSnapshot().activeTrip) ?? null;
        if (!trimmed || !currentTrip) return false;
        if ((currentTrip.persons || []).includes(trimmed)) {
          showToast("Pessoa já existe");
          return false;
        }
        persist((current) => ({
          ...current,
          trips: current.trips.map((item) =>
            item.id === current.activeTrip
              ? { ...item, persons: [...(item.persons || ["Carlos"]), trimmed] }
              : item,
          ),
        }));
        return true;
      },
      addExpense(draft) {
        const current = getSnapshot();
        const currentTrip = current.trips.find((item) => item.id === current.activeTrip);
        if (!currentTrip) return;
        const expense: Expense = {
          id: Date.now(),
          ...draft,
          eur: toEUR(draft.amount, draft.currency, current.rates),
        };
        persist((latest) => ({
          ...latest,
          trips: latest.trips.map((item) =>
            item.id === latest.activeTrip
              ? { ...item, expenses: [expense, ...(item.expenses || [])] }
              : item,
          ),
        }));
        showToast("✓ Despesa adicionada!");
      },
      updateExpense(id, draft) {
        persist((current) => ({
          ...current,
          trips: current.trips.map((item) => {
            if (item.id !== current.activeTrip) return item;
            return {
              ...item,
              expenses: item.expenses.map((expense) =>
                expense.id === id
                  ? {
                      ...expense,
                      ...draft,
                      eur: toEUR(draft.amount, draft.currency, current.rates),
                    }
                  : expense,
              ),
            };
          }),
        }));
        showToast("✓ Despesa actualizada!");
      },
      deleteExpense(id) {
        persist((current) => ({
          ...current,
          trips: current.trips.map((item) =>
            item.id === current.activeTrip
              ? { ...item, expenses: item.expenses.filter((expense) => expense.id !== id) }
              : item,
          ),
        }));
      },
      removePerson(name) {
        persist((current) => ({
          ...current,
          trips: current.trips.map((item) =>
            item.id === current.activeTrip
              ? { ...item, persons: (item.persons || []).filter((person) => person !== name) }
              : item,
          ),
        }));
      },
      saveRates(rates) {
        persist((current) => ({
          ...current,
          rates,
          trips: current.trips.map((item) => recalcTrip(item, rates)),
        }));
        showToast("✓ Câmbios guardados!");
      },
      exportJson() {
        const blob = new Blob([JSON.stringify(getSnapshot(), null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `familia_castro_backup_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
        showToast("✓ Backup exportado!");
      },
      importJson(raw) {
        try {
          const parsed = JSON.parse(raw) as AppData;
          if (!parsed.trips) {
            showToast("JSON inválido");
            return false;
          }
          write(parsed);
          showToast("✓ Dados importados!");
          return true;
        } catch {
          showToast("Erro a ler o JSON");
          return false;
        }
      },
      clearAll() {
        write({ trips: [], rates: { AUD: 0.6, BRL: 0.16, USD: 0.92 }, activeTrip: null });
        showToast("Todos os dados apagados");
      },
      async saveCloud(config) {
        writeCloudConfig(config);
        await hydrateFromCloud();
        showToast(syncStatus === "cloud" ? "✓ Ligado ao Supabase" : "Ligação guardada");
      },
      async syncNow() {
        await hydrateFromCloud();
        if (syncStatus === "cloud") showToast("✓ Sincronizado");
        else if (syncStatus === "error") showToast(syncError || "Erro na nuvem");
      },
    }),
    [data, error, showToast, sync, toast, trip],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useStore deve ser usado dentro de StoreProvider");
  }
  return store;
}
