import { useState } from "react";
import { Info, ChevronRight } from "lucide-react";

interface ClinicalInfoProps {
  definition: string;
  rationale: string;
}

const ClinicalInfo = ({ definition, rationale }: ClinicalInfoProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-1.5 ml-7">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
      >
        <Info className="w-3 h-3" />
        <span>O que é?</span>
        <ChevronRight className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="mt-1.5 space-y-1.5 text-[11px] leading-relaxed bg-muted/40 rounded-md p-2.5 border border-border">
          <p className="text-foreground">{definition}</p>
          <p className="text-muted-foreground">
            <span className="font-semibold text-primary">Por que usar?</span> {rationale}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClinicalInfo;
