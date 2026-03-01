"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface SearchCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const SearchContext = createContext<SearchCtx>({ open: false, setOpen: () => {} });

export function useSearch() {
  return useContext(SearchContext);
}

export default function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <SearchContext.Provider value={{ open, setOpen }}>
      {children}
    </SearchContext.Provider>
  );
}
