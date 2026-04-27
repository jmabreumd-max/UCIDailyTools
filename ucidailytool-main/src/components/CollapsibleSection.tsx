import { useState, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface Props {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
  badge?: string;
  info?: ReactNode;
}

const CollapsibleSection = ({ title, defaultOpen = false, children, badge, info }: Props) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="calc-card">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-left">
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {info}
          {badge && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-primary/15 text-primary shrink-0">{badge}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-2 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
};

export default CollapsibleSection;
