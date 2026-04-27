import { usePersistedState } from "@/hooks/usePersistedState";
import CollapsibleSection from "./CollapsibleSection";
import InfoTooltip from "./InfoTooltip";

export interface ExamCategory {
  category: string;
  items: string[];
}

interface Props {
  storageKey: string;
  title?: string;
  categories: ExamCategory[];
}

const ExamChecklist = ({ storageKey, title = "Exame Físico", categories }: Props) => {
  const [checked, setChecked] = usePersistedState<Record<string, boolean>>(`exam-${storageKey}`, {});
  const [notes, setNotes] = usePersistedState<string>(`exam-${storageKey}-notes`, "");

  const toggle = (item: string) => setChecked(prev => ({ ...prev, [item]: !prev[item] }));

  const allItems = categories.flatMap(c => c.items);
  const total = allItems.length;
  const done = allItems.filter(i => checked[i]).length;

  return (
    <CollapsibleSection
      title={title}
      badge={done > 0 ? `${done}/${total}` : undefined}
      info={<InfoTooltip interpretation="Checklist de sinais e sintomas para exame físico sistematizado. Selecione os achados positivos e adicione notas." />}
    >
      <div className="space-y-3">
        {categories.map(cat => (
          <div key={cat.category}>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{cat.category}</p>
            <div className="flex flex-wrap gap-1.5">
              {cat.items.map(item => (
                <button
                  key={item}
                  onClick={() => toggle(item)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium border transition-all ${
                    checked[item]
                      ? "bg-warning/15 border-warning/30 text-warning"
                      : "bg-muted/30 border-border text-muted-foreground hover:border-primary/20"
                  }`}
                >
                  {checked[item] && "✓ "}{item}
                </button>
              ))}
            </div>
          </div>
        ))}

        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notas do exame físico..."
          className="w-full mt-2 p-2 rounded-lg border border-border bg-muted/30 text-[11px] text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
          rows={2}
        />
      </div>
    </CollapsibleSection>
  );
};

export default ExamChecklist;
