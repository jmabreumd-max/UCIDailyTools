import { useState } from "react";

/**
 * Hook para interconectividade. 
 * Se os props `globalValue` e `setGlobalValue` existirem, usa-os diretamente (Two-way binding real).
 * Caso contrário, cai para local state.
 */
export function useSharedState(localDefault: string, globalValue?: string, setGlobalValue?: (v: string) => void) {
  const [local, setLocal] = useState(localDefault);
  
  const value = globalValue !== undefined ? globalValue : local;
  
  const setValue = (newVal: string) => {
    if (globalValue === undefined) {
      setLocal(newVal);
    }
    if (setGlobalValue) {
      setGlobalValue(newVal);
    }
  };
  
  return [value, setValue] as const;
}