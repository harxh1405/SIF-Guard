"use client";

import { createContext, useContext } from "react";
import type Lenis from "lenis";

export interface SmoothScrollContextType {
  lenis: Lenis | null;
  scrollTo: (target: string | HTMLElement | number, options?: { offset?: number; duration?: number; immediate?: boolean }) => void;
}

export const SmoothScrollContext = createContext<SmoothScrollContextType>({
  lenis: null,
  scrollTo: () => {},
});

export function useSmoothScroll(): SmoothScrollContextType {
  return useContext(SmoothScrollContext);
}
