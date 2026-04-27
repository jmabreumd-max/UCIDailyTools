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
  headerAction?: ReactNode;
}

const CalculatorCard = ({ title, icon, formula, definition, rationale, children, headerAction }: CalculatorCardProps) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="calc-card">
      <div className="flex items-center justify-between w-full">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex flex-1 items-center gap-2.5 text-left"
        >
          <span className="text-primary">{icon}</span>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </button>
        {headerAction && <div className="mx-2 flex-shrink-0">{headerAction}</div>}
        <button onClick={() => setExpanded(!expanded)}>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>
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
