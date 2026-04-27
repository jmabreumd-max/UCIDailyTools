import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InfoTooltipProps {
  formula?: string;
  reference?: string;
  interpretation?: string;
}

const InfoTooltip = ({ formula, reference, interpretation }: InfoTooltipProps) => {
  if (!formula && !reference && !interpretation) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-primary/20 transition-colors ml-1">
            <Info className="w-3 h-3 text-muted-foreground hover:text-primary transition-colors" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs space-y-1.5 text-[11px]">
          {formula && (
            <div>
              <span className="font-semibold text-primary">Fórmula: </span>
              <span className="font-mono">{formula}</span>
            </div>
          )}
          {reference && (
            <div>
              <span className="font-semibold text-primary">Referência: </span>
              <span>{reference}</span>
            </div>
          )}
          {interpretation && (
            <div>
              <span className="font-semibold text-primary">Interpretação: </span>
              <span>{interpretation}</span>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default InfoTooltip;
