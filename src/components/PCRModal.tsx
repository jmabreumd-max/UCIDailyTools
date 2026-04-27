import { useState, useEffect, useCallback, useRef } from "react";
import { usePatient } from "@/contexts/PatientContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Activity, Play, Square, Zap, Syringe, AlertTriangle, RotateCcw, Stethoscope, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEventLog } from "@/contexts/EventLogContext";

// Format seconds into MM:SS
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function PCRModal() {
  const { pesoAtual } = usePatient();
  const peso = parseFloat(pesoAtual) || 0;
  
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [cycleSeconds, setCycleSeconds] = useState(0); // 2 minute cycle
  const [log, setLog] = useState<{ time: number; event: string }[]>([]);
  const { addLog: addGlobalLog } = useEventLog();
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((event: string) => {
    setLog((prev) => [...prev, { time: totalSeconds, event }]);
  }, [totalSeconds]);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  useEffect(() => {
    if (isOpen && totalSeconds === 0 && !isRunning) {
      // Start immediately when modal opens
      setIsRunning(true);
      addLog("Início de RCP");
      addGlobalLog("PCR", "Início de Manobras de RCP");
    }
  }, [isOpen, isRunning, totalSeconds, addLog, addGlobalLog]);

  // Timers
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTotalSeconds((s) => s + 1);
        setCycleSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStartStop = () => {
    if (!isRunning && totalSeconds === 0) {
      addLog("Início de RCP");
      addGlobalLog("PCR", "Início de Manobras de RCP");
    } else if (isRunning) {
      addGlobalLog("PCR", "Pausa nas Manobras de RCP", `Tempo decorrido: ${formatTime(totalSeconds)}`);
    } else {
      addGlobalLog("PCR", "Retoma das Manobras de RCP");
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    if (window.confirm("Deseja parar e limpar todos os dados da PCR atual?")) {
      addGlobalLog("PCR", "Fim da Paragem Cardiorrespiratória", `Duração total: ${formatTime(totalSeconds)}`);
      setIsRunning(false);
      setTotalSeconds(0);
      setCycleSeconds(0);
      setLog([]);
    }
  };

  const handleShock = () => {
    addLog("Choque (150-360J)");
    addGlobalLog("PCR", "Administração de Choque", `Aos ${formatTime(totalSeconds)}`);
  };

  const handleAdrenaline = () => {
    addLog("Adrenalina 1mg");
    addGlobalLog("PCR", "Administração de Adrenalina (1mg)");
  };

  const handleAmiodarone = () => {
    addLog("Amiodarona/Lidocaína");
    addGlobalLog("PCR", "Administração de Antiarrítmico", "Amiodarona ou Lidocaína");
  };

  const handleDrug = (name: string, dose: string) => {
    addLog(`F. ${name} (${dose})`);
    addGlobalLog("PCR", `Administração de ${name}`, dose);
  };

  const handleProcedure = (name: string) => {
    addLog(`Proc: ${name}`);
    addGlobalLog("PCR", "Procedimento Realizado", name);
  };

  const handleCycleReset = () => {
    setCycleSeconds(0);
    addLog("Comprovação de Pulso / Troca CPR");
    addGlobalLog("PCR", "Comprovação de Pulso e Troca de Reanimador");
  };

  const isCycleEnding = cycleSeconds >= 110;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white font-bold bg-destructive hover:bg-destructive/90 shadow-sm transition-colors text-[11px] sm:text-xs">
          <Zap className="w-3.5 h-3.5 fill-current" />
          PCR
        </button>
      </DialogTrigger>
      
      <DialogContent 
        onInteractOutside={(e) => e.preventDefault()} 
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-3 sm:p-4 w-[95vw] gap-3"
      >
        <DialogHeader className="mb-0 border-b border-border pb-1">
          <DialogTitle className="flex items-center gap-1.5 text-destructive text-[11px] font-bold uppercase tracking-wide">
            <Activity className="w-3.5 h-3.5" /> Paragem Cardiorrespiratória
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto grid lg:grid-cols-12 gap-2 pb-1 pr-1 scrollbar-thin">
          
          {/* Timers & Principal Controls */}
          <div className="flex flex-col gap-2 lg:col-span-4 h-full">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center p-2 bg-muted/40 rounded-lg border border-border">
                <span className="text-[9px] font-semibold text-muted-foreground uppercase mb-0.5">Tempo Total</span>
                <span className={cn("text-2xl sm:text-3xl font-mono tracking-tighter tabular-nums", isRunning ? "text-primary" : "text-muted-foreground")}>
                  {formatTime(totalSeconds)}
                </span>
              </div>

              <div className={cn(
                "flex flex-col items-center p-2 rounded-lg border transition-colors",
                isCycleEnding ? "bg-destructive/10 border-destructive/50" : "bg-muted/40 border-border"
              )}>
                <span className="text-[9px] font-semibold text-muted-foreground uppercase mb-0.5">Ciclo 2 min</span>
                <span className={cn("text-2xl sm:text-3xl font-mono tracking-tighter tabular-nums transition-all", isCycleEnding ? "text-destructive animate-pulse" : (isRunning ? "text-foreground" : "text-muted-foreground"))}>
                  {formatTime(cycleSeconds)}
                </span>
              </div>
            </div>

            <button 
              onClick={handleCycleReset}
              className={cn(
                "py-1.5 px-2 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 uppercase transition-all border",
                isCycleEnding ? "bg-destructive text-destructive-foreground border-destructive animate-pulse" : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent"
              )}
            >
              <RotateCcw className="w-3 h-3" />
              Validar Pulso
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleStartStop}
                className={cn(
                  "flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-bold transition-all text-white",
                  isRunning ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600"
                )}
              >
                {isRunning ? <><Square className="w-3 h-3 fill-current" /> Pausar</> : <><Play className="w-3 h-3 fill-current" /> {totalSeconds === 0 ? "START" : "Retomar"}</>}
              </button>
              <button
                onClick={handleReset}
                className="flex items-center justify-center py-2 rounded-lg text-[10px] font-semibold bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                Parar/Zerar
              </button>
            </div>

            {/* Event Log inside col 1 for compact layout */}
            <div className="flex-1 min-h-[100px] max-h-[160px] lg:max-h-none border border-border rounded-lg bg-card flex flex-col overflow-hidden">
              <div className="bg-muted/50 px-2 py-1 text-[9px] font-bold border-b border-border uppercase flex items-center gap-1">
                <Activity className="w-2.5 h-2.5" /> Eventos
              </div>
              <div className="p-1 overflow-y-auto flex-1 space-y-0.5">
                {log.length === 0 && (
                  <div className="text-muted-foreground text-[9px] text-center h-full flex flex-col items-center justify-center italic opacity-60">
                    Aguardando...
                  </div>
                )}
                {log.map((entry, idx) => (
                  <div key={idx} className="flex gap-1.5 text-[9px] py-0.5 border-b border-border/20 last:border-0 hover:bg-muted/40 px-1 rounded transition-colors break-words">
                    <span className="font-mono text-muted-foreground shrink-0">[{formatTime(entry.time)}]</span>
                    <span className="text-foreground">{entry.event}</span>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </div>

          {/* Col 2+3: Actions */}
          <div className="grid sm:grid-cols-2 gap-2 lg:col-span-8">
            
            {/* Rhythm */}
            <div className="space-y-2">
              <div className="p-2 border border-border rounded-lg bg-card/50">
                <h3 className="font-bold text-[10px] flex items-center gap-1 border-b border-border pb-1 mb-1.5">
                  <Zap className="w-3 h-3 text-amber-500 fill-current" /> Ritmo Chocável (FV / TVSP)
                </h3>
                <button onClick={handleShock} disabled={!isRunning} className="w-full py-1.5 bg-amber-500 text-white hover:bg-amber-600 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-50">
                  <Zap className="w-2.5 h-2.5 fill-current" /> CHOQUE (150-360J)
                </button>
              </div>

              <div className="p-2 border border-border rounded-lg bg-card/50">
                <h3 className="font-bold text-[10px] flex items-center gap-1 border-b border-border pb-1 mb-1.5">
                  <Activity className="w-3 h-3 text-destructive" /> Não Chocável (Assistolia/AEA)
                </h3>
                <button onClick={handleAdrenaline} disabled={!isRunning} className="w-full py-1.5 bg-destructive text-white hover:bg-destructive/90 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-50">
                  <Syringe className="w-2.5 h-2.5" /> ADRENALINA 1mg
                </button>
              </div>

              <div className="p-2 border border-border rounded-lg bg-card/50">
                 <h3 className="font-bold text-[10px] mb-1.5 flex items-center gap-1 text-primary">
                    <Droplets className="w-3 h-3" /> Fármacos
                 </h3>
                 <div className="grid gap-1">
                    <button onClick={handleAmiodarone} disabled={!isRunning} className="py-1 px-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 border border-blue-500/20 rounded text-[9px] font-bold text-left flex justify-between items-center transition-colors disabled:opacity-50">
                      <span>Amiodarona / Lido</span>
                      <span className="font-normal opacity-80 font-mono">300mg / {peso ? `${Math.round(peso * 1)}-${Math.round(peso * 1.5)}mg` : '1 mg/kg'}</span>
                    </button>
                    
                    <div className="grid grid-cols-2 gap-1 mt-0.5">
                      <button onClick={() => handleDrug("Magnésio", "2g")} disabled={!isRunning} className="py-0.5 px-1 bg-muted hover:bg-muted-foreground/10 border border-border rounded text-[9px] font-semibold text-foreground flex flex-col disabled:opacity-50 text-left">
                        Magnésio 2g <span className="text-[8px] font-normal text-muted-foreground line-clamp-1">Torsades</span>
                      </button>
                      <button onClick={() => handleDrug("Cálcio", "1 Amp")} disabled={!isRunning} className="py-0.5 px-1 bg-muted hover:bg-muted-foreground/10 border border-border rounded text-[9px] font-semibold text-foreground flex flex-col disabled:opacity-50 text-left">
                        Cálcio Gluconato <span className="text-[8px] font-normal text-muted-foreground line-clamp-1">HiperK+ (10%)</span>
                      </button>
                      <button onClick={() => handleDrug("Bicarbonato", "50mEq")} disabled={!isRunning} className="py-0.5 px-1 bg-muted hover:bg-muted-foreground/10 border border-border rounded text-[9px] font-semibold text-foreground flex flex-col disabled:opacity-50 text-left">
                        Bicarbonato <span className="text-[8px] font-normal text-muted-foreground line-clamp-1">Acidose (8.4%)</span>
                      </button>
                      <button onClick={() => handleDrug("Atropina", "1mg")} disabled={!isRunning} className="py-0.5 px-1 bg-muted hover:bg-muted-foreground/10 border border-border rounded text-[9px] font-semibold text-foreground flex flex-col disabled:opacity-50 text-left">
                        Atropina 1mg <span className="text-[8px] font-normal text-muted-foreground line-clamp-1">Bradicardia</span>
                      </button>
                    </div>
                 </div>
              </div>
            </div>

            {/* Procedures & 4H4T */}
            <div className="space-y-2">
              <div className="p-2 border border-border rounded-lg bg-card/50">
                <h3 className="font-bold text-[10px] mb-1.5 flex items-center gap-1 text-primary">
                  <Stethoscope className="w-3 h-3" /> Procedimentos
                </h3>
                <div className="grid grid-cols-2 gap-1">
                  <button onClick={() => handleProcedure("Via Aérea Avançada (IOT)")} disabled={!isRunning} className="py-1 px-1.5 bg-muted hover:bg-primary/10 border border-border hover:border-primary/30 rounded text-[9px] font-semibold text-foreground transition-colors disabled:opacity-50 text-left">
                    Via Aérea Avançada
                  </button>
                  <button onClick={() => handleProcedure("Acesso Venoso/IO")} disabled={!isRunning} className="py-1 px-1.5 bg-muted hover:bg-primary/10 border border-border hover:border-primary/30 rounded text-[9px] font-semibold text-foreground transition-colors disabled:opacity-50 text-left">
                    Acesso Venoso/IO
                  </button>
                  <button onClick={() => handleProcedure("Capnografia (EtCO2)")} disabled={!isRunning} className="py-1 px-1.5 bg-muted hover:bg-primary/10 border border-border hover:border-primary/30 rounded text-[9px] font-semibold text-foreground transition-colors disabled:opacity-50 text-left">
                    Capnografia (EtCO₂)
                  </button>
                  <button onClick={() => handleProcedure("Ecodesafio (POCUS)")} disabled={!isRunning} className="py-1 px-1.5 bg-muted hover:bg-primary/10 border border-border hover:border-primary/30 rounded text-[9px] font-semibold text-foreground transition-colors disabled:opacity-50 text-left">
                    Ecodesafio (POCUS)
                  </button>
                  <button onClick={() => handleProcedure("Drenagem Torácica")} disabled={!isRunning} className="py-1 px-1.5 bg-muted hover:bg-primary/10 border border-border hover:border-primary/30 rounded text-[9px] font-semibold text-foreground transition-colors disabled:opacity-50 text-left">
                    Drenagem Torácica
                  </button>
                  <button onClick={() => handleProcedure("Pericardiocentese")} disabled={!isRunning} className="py-1 px-1.5 bg-muted hover:bg-primary/10 border border-border hover:border-primary/30 rounded text-[9px] font-semibold text-foreground transition-colors disabled:opacity-50 text-left">
                    Pericardiocentese
                  </button>
                  <button onClick={() => handleProcedure("Massagem Mecânica")} disabled={!isRunning} className="py-1 px-1.5 bg-muted hover:bg-primary/10 border border-border hover:border-primary/30 rounded text-[9px] font-semibold text-foreground transition-colors disabled:opacity-50 text-left">
                    Massagem Mecânica
                  </button>
                  <button onClick={() => handleProcedure("Pacing Transcutâneo")} disabled={!isRunning} className="py-1 px-1.5 bg-muted hover:bg-primary/10 border border-border hover:border-primary/30 rounded text-[9px] font-semibold text-foreground transition-colors disabled:opacity-50 text-left">
                    Pacing Transcutâneo
                  </button>
                </div>
              </div>

              <div className="p-2 border border-border rounded-lg bg-card/50">
                 <h3 className="font-bold text-[10px] mb-1 flex items-center gap-1">
                   <AlertTriangle className="w-3 h-3 text-amber-500" /> Causas Reversíveis (4H, 4T)
                 </h3>
                 <div className="grid grid-cols-2 gap-1.5 text-[8px] sm:text-[9px]">
                   <ul className="text-muted-foreground space-y-0.5 list-none">
                     <li>• <span className="font-bold text-foreground">H</span>ipoxia</li>
                     <li>• <span className="font-bold text-foreground">H</span>ipovolémia</li>
                     <li>• <span className="font-bold text-foreground">H</span>ipo/Hiper K+</li>
                     <li>• <span className="font-bold text-foreground">H</span>ipotermia</li>
                   </ul>
                   <ul className="text-muted-foreground space-y-0.5 list-none">
                     <li>• <span className="font-bold text-foreground">T</span>rombose Cor.</li>
                     <li>• <span className="font-bold text-foreground">T</span>rombose Pulm.</li>
                     <li>• <span className="font-bold text-foreground">T</span>ensão neumot.</li>
                     <li>• <span className="font-bold text-foreground">T</span>amponamento</li>
                   </ul>
                   <div className="col-span-2 pt-1 text-muted-foreground mt-0.5 border-t border-border/50">
                    Também: Tóxicos, Acidose, Hipoglicemia
                   </div>
                 </div>
              </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
