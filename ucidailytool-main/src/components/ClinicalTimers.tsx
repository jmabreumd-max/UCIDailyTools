import { useState, useEffect, useCallback } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { Timer, Play, Square, RotateCcw, AlertTriangle } from "lucide-react";
import CollapsibleSection from "./CollapsibleSection";
import InfoTooltip from "./InfoTooltip";

interface TimerConfig {
  id: string;
  label: string;
  alertHours: number;
  warningHours: number;
  description: string;
}

const TIMERS: TimerConfig[] = [
  { id: "pronacao", label: "Pronação", alertHours: 16, warningHours: 14, description: "Sessão de pronação (alvo 16h). Supinar e reavaliar." },
  { id: "atb-reav", label: "Reavaliação ATB", alertHours: 72, warningHours: 48, description: "Reavaliar antibioterapia empírica às 48-72h. De-escalar?" },
  { id: "cvc", label: "Troca CVC", alertHours: 168, warningHours: 120, description: "Reavaliar necessidade de CVC (7 dias). Remover se dispensável." },
  { id: "la", label: "Linha Arterial", alertHours: 120, warningHours: 96, description: "Reavaliar necessidade de linha arterial (5 dias)." },
  { id: "algalia", label: "Algália", alertHours: 72, warningHours: 48, description: "Reavaliar necessidade de algália diariamente. Remover precocemente." },
  { id: "sedacao", label: "Despertar Diário", alertHours: 24, warningHours: 20, description: "Prova de despertar diária (SAT). Reavaliar nível de sedação." },
];

interface TimerState {
  startTime: number | null;
  running: boolean;
}

const formatElapsed = (ms: number) => {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const ClinicalTimers = () => {
  const [timers, setTimers] = usePersistedState<Record<string, TimerState>>("clinical-timers", {});
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const hasRunning = Object.values(timers).some(t => t.running);
    if (!hasRunning) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timers]);

  const start = useCallback((id: string) => {
    setTimers(prev => ({ ...prev, [id]: { startTime: Date.now(), running: true } }));
  }, [setTimers]);

  const stop = useCallback((id: string) => {
    setTimers(prev => ({ ...prev, [id]: { ...prev[id], running: false } }));
  }, [setTimers]);

  const reset = useCallback((id: string) => {
    setTimers(prev => ({ ...prev, [id]: { startTime: null, running: false } }));
  }, [setTimers]);

  const activeCount = Object.values(timers).filter(t => t.running).length;

  return (
    <CollapsibleSection
      title="Timers Clínicos"
      badge={activeCount > 0 ? `${activeCount} ativo${activeCount > 1 ? "s" : ""}` : undefined}
      info={<InfoTooltip interpretation="Cronómetros para eventos clínicos com alertas visuais. Verde: dentro do tempo. Amarelo: aproximação do limite. Vermelho: ultrapassado." />}
    >
      <div className="space-y-1.5">
        {TIMERS.map(cfg => {
          const state = timers[cfg.id] || { startTime: null, running: false };
          const elapsed = state.startTime ? (state.running ? now - state.startTime : 0) : 0;
          const elapsedH = elapsed / 3600000;
          const status = !state.startTime ? "idle"
            : elapsedH >= cfg.alertHours ? "alert"
            : elapsedH >= cfg.warningHours ? "warning"
            : "ok";

          return (
            <div key={cfg.id} className={`rounded-lg border px-3 py-2 transition-all ${
              status === "alert" ? "border-destructive/40 bg-destructive/10 animate-pulse"
              : status === "warning" ? "border-warning/30 bg-warning/5"
              : status === "ok" ? "border-primary/20 bg-primary/5"
              : "border-border bg-muted/20"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {status === "alert" && <AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />}
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-foreground">{cfg.label}</span>
                    <p className="text-[8px] text-muted-foreground truncate">{cfg.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {state.startTime && (
                    <span className={`text-[11px] font-mono font-semibold ${
                      status === "alert" ? "text-destructive" : status === "warning" ? "text-warning" : "text-primary"
                    }`}>
                      {formatElapsed(elapsed)}
                    </span>
                  )}
                  {!state.running ? (
                    <button onClick={() => start(cfg.id)}
                      className="p-1.5 rounded-md bg-primary/15 text-primary hover:bg-primary/25 transition-all" title="Iniciar">
                      <Play className="w-3 h-3" />
                    </button>
                  ) : (
                    <button onClick={() => stop(cfg.id)}
                      className="p-1.5 rounded-md bg-warning/15 text-warning hover:bg-warning/25 transition-all" title="Parar">
                      <Square className="w-3 h-3" />
                    </button>
                  )}
                  {state.startTime && (
                    <button onClick={() => reset(cfg.id)}
                      className="p-1.5 rounded-md bg-muted text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-all" title="Reset">
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              {status === "alert" && (
                <p className="text-[9px] text-destructive font-semibold mt-1">⚠️ Tempo limite ultrapassado ({cfg.alertHours}h)! Ação necessária.</p>
              )}
            </div>
          );
        })}
      </div>
    </CollapsibleSection>
  );
};

export default ClinicalTimers;
