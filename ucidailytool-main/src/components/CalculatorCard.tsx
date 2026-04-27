import { ReactNode, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import ClinicalInfo from "./ClinicalInfo";

interface CalculatorCardProps {
  title: string;
  icon: ReactNode;
  formula?: string;
  definition?: string;
  rationale?: string;
  children: ReactNode;
}

const CalculatorCard = ({ title, icon, formula, definition, rationale, children }: CalculatorCardProps) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="calc-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-primary">{icon}</span>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {formula && (
        <p className="text-[10px] font-mono text-muted-foreground mt-1.5 ml-7">{formula}</p>
      )}
      {definition && rationale && (
        <ClinicalInfo definition={definition} rationale={rationale} />
      )}
      {expanded && <div className="mt-4 space-y-3">{children}</div>}
    </div>
  );
};

export default CalculatorCard;
