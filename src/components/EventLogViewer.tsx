import { useEventLog, EventLogType } from "@/contexts/EventLogContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Activity, AlertTriangle, Calculator, ClipboardList, Info, Trash2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const getTypeConfig = (type: EventLogType) => {
  switch (type) {
    case "INFO":
      return { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" };
    case "WARNING":
      return { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" };
    case "ACTION":
      return { icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" };
    case "CALCULATION":
      return { icon: Calculator, color: "text-purple-500", bg: "bg-purple-500/10" };
    case "PCR":
      return { icon: Zap, color: "text-destructive", bg: "bg-destructive/10" };
    default:
      return { icon: Info, color: "text-muted-foreground", bg: "bg-muted" };
  }
};

export default function EventLogViewer() {
  const { logs, clearLogs } = useEventLog();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button 
          className="relative flex items-center justify-center p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
          title="Registo de Eventos"
        >
          <ClipboardList className="w-5 h-5" />
          {logs.length > 0 && (
            <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
          )}
        </button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full border-l border-border bg-card">
        <SheetHeader className="mb-4 text-left">
          <SheetTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" /> Registo de Eventos
          </SheetTitle>
          <SheetDescription>
            Histórico das ações, eventos e cálculos realizados.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground italic text-sm">
              <ClipboardList className="w-12 h-12 mb-3 opacity-20" />
              Nenhum evento registado.
            </div>
          ) : (
            logs.map((log) => {
              const { icon: Icon, color, bg } = getTypeConfig(log.type);
              
              return (
                <div key={log.id} className="p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex gap-3">
                    <div className={cn("p-2 rounded-md h-fit", bg)}>
                      <Icon className={cn("w-4 h-4", color)} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm leading-tight text-foreground">
                          {log.message}
                        </h4>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap font-mono">
                          {format(log.timestamp, "HH:mm:ss", { locale: ptBR })}
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {logs.length > 0 && (
          <div className="pt-4 pb-2 border-t border-border mt-4">
            <button
              onClick={clearLogs}
              className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Registo
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
