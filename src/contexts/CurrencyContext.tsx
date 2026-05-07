import { createContext, useContext, useState, ReactNode } from "react";

type Currency = "BDT" | "USD";

const EXCHANGE_RATE = 110; // 1 USD = 110 BDT

function formatCurrency(amount: number, currency: Currency): string {
  if (currency === "USD") {
    return "$" + (amount / EXCHANGE_RATE).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return "৳" + amount.toLocaleString("en-BD", { maximumFractionDigits: 0 });
}

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatCurrency: (amount: number) => string;
  EXCHANGE_RATE: number;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(
    () => (localStorage.getItem("pharmazine_currency") as Currency) || "BDT"
  );

  const setCurrency = (c: Currency) => {
    localStorage.setItem("pharmazine_currency", c);
    setCurrencyState(c);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency: (a) => formatCurrency(a, currency), EXCHANGE_RATE }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}

export { formatCurrency, EXCHANGE_RATE };
export type { Currency };
