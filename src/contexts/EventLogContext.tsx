import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";

export type EventLogType = "INFO" | "WARNING" | "ACTION" | "CALCULATION" | "PCR";

export interface AppEvent {
  id: string;
  timestamp: number;
  type: EventLogType;
  message: string;
  details?: string;
}

interface EventLogContextType {
  logs: AppEvent[];
  addLog: (type: EventLogType, message: string, details?: string) => void;
  clearLogs: () => void;
}

const EventLogContext = createContext<EventLogContextType | null>(null);

export const useEventLog = () => {
  const ctx = useContext(EventLogContext);
  if (!ctx) throw new Error("useEventLog must be used within EventLogProvider");
  return ctx;
};

const LS_KEY = "icu-manager-logs";

export const EventLogProvider = ({ children }: { children: ReactNode }) => {
  const [logs, setLogs] = useState<AppEvent[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(logs));
  }, [logs]);

  const addLog = useCallback((type: EventLogType, message: string, details?: string) => {
    const newEvent: AppEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type,
      message,
      details,
    };
    // Keep max 200 logs
    setLogs((prev) => [newEvent, ...prev].slice(0, 200));
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem(LS_KEY);
  }, []);

  return (
    <EventLogContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </EventLogContext.Provider>
  );
};
