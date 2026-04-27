import { useMemo } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import AlertBanner from "./AlertBanner";

interface Interaction {
  drugs: string[];
  severity: "danger" | "warning";
  effect: string;
  recommendation: string;
}

const INTERACTIONS: Interaction[] = [
  // QT prolongation
  { drugs: ["Amiodarona", "Levofloxacina"], severity: "danger", effect: "↑↑ Prolongamento QT → Torsades de Pointes", recommendation: "Monitorizar QTc. Evitar associação se QTc > 500 ms." },
  { drugs: ["Amiodarona", "Ciprofloxacina"], severity: "warning", effect: "↑ Prolongamento QT", recommendation: "Monitorizar QTc. Considerar alternativa." },
  { drugs: ["Amiodarona", "Azitromicina"], severity: "danger", effect: "↑↑ Prolongamento QT", recommendation: "Evitar. Usar alternativa ao macrólido." },
  { drugs: ["Amiodarona", "Fluconazol"], severity: "danger", effect: "↑↑ Prolongamento QT", recommendation: "Monitorizar QTc rigorosamente." },
  
  // Nefrotoxicidade
  { drugs: ["Vancomicina", "Gentamicina"], severity: "danger", effect: "↑↑ Nefrotoxicidade sinérgica", recommendation: "Evitar associação. Se necessário, monitorizar Cr e níveis séricos q12h." },
  { drugs: ["Vancomicina", "Amicacina"], severity: "danger", effect: "↑↑ Nefrotoxicidade sinérgica", recommendation: "Monitorizar creatinina diariamente. Níveis de vancomicina e aminoglicosídeo." },
  { drugs: ["Vancomicina", "Piperacilina/Tazobactam"], severity: "warning", effect: "↑ Nefrotoxicidade (controverso)", recommendation: "Monitorizar creatinina. Considerar Cefepime como alternativa ao Pip/Tazo." },
  { drugs: ["Anfotericina B", "Vancomicina"], severity: "danger", effect: "↑↑ Nefrotoxicidade aditiva", recommendation: "Evitar. Usar formulação lipídica de Anfotericina. Monitorizar Cr q12h." },
  
  // Hipercalemia
  { drugs: ["Espironolactona", "Suplemento K⁺"], severity: "warning", effect: "↑ Risco de hipercalemia", recommendation: "Monitorizar K⁺ diariamente." },
  
  // Serotonina
  { drugs: ["Fentanil", "Linezolida"], severity: "warning", effect: "Risco de síndrome serotoninérgico", recommendation: "Monitorizar tremor, agitação, hipertermia. Considerar alternativa ao Linezolida." },
  { drugs: ["Tramadol", "Linezolida"], severity: "danger", effect: "↑↑ Síndrome serotoninérgico", recommendation: "EVITAR associação. Linezolida é IMAO." },
  
  // Sedação / Respiração
  { drugs: ["Midazolam", "Fentanil"], severity: "warning", effect: "Depressão respiratória e sedação aditiva", recommendation: "Titular cuidadosamente. Monitorizar BIS e FR." },
  { drugs: ["Propofol", "Dexmedetomidina"], severity: "warning", effect: "↑ Bradicardia e hipotensão", recommendation: "Titular doses. Evitar bólus. Monitorizar FC e PA." },
  
  // Hepática
  { drugs: ["Metronidazol", "Álcool/Etanol"], severity: "danger", effect: "Efeito dissulfiram-like", recommendation: "Evitar álcool durante e até 48h após Metronidazol." },
  
  // Neurotoxicidade
  { drugs: ["Imipenem", "Ác. Valpróico"], severity: "danger", effect: "↓↓ Níveis de valproato (até 80%)", recommendation: "CONTRAINDICADO. Usar Meropenem se necessário carbapenemo." },
  
  // Coagulação
  { drugs: ["Enoxaparina", "Clopidogrel"], severity: "warning", effect: "↑ Risco hemorrágico", recommendation: "Monitorizar sinais de hemorragia. Avaliar benefício/risco." },
  
  // Antagonismo
  { drugs: ["Flucloxacilina", "Metformina"], severity: "warning", effect: "↑ Risco de acidose láctica", recommendation: "Monitorizar lactato e pH." },
];

// Normalize drug name for matching
const normalize = (name: string) => name.toLowerCase().replace(/[^a-záàâãéèêíïóôõúç]/g, "");

const DrugInteractions = () => {
  // Read active drugs from persisted state
  const [sedationRates] = usePersistedState<string[]>("neuro-sedationRates", []);
  const [vasoRates] = usePersistedState<string[]>("cardio-vasoRates", []);

  const SEDATION_NAMES = ["Fentanil", "Remifentanil", "Midazolam", "Propofol", "Dexmedetomidina", "Cetamina", "Rocurónio", "Cisatracúrio"];
  const VASO_NAMES = ["Noradrenalina", "Vasopressina", "Dobutamina", "Adrenalina", "Milrinona", "Labetalol"];

  const activeDrugs = useMemo(() => {
    const drugs: string[] = [];
    sedationRates.forEach((r, i) => {
      if (parseFloat(r) > 0 && SEDATION_NAMES[i]) drugs.push(SEDATION_NAMES[i]);
    });
    vasoRates.forEach((r, i) => {
      if (parseFloat(r) > 0 && VASO_NAMES[i]) drugs.push(VASO_NAMES[i]);
    });
    return drugs;
  }, [sedationRates, vasoRates]);

  const alerts = useMemo(() => {
    if (activeDrugs.length < 2) return [];
    const activeNorm = activeDrugs.map(normalize);
    return INTERACTIONS.filter(ix => {
      const ixNorm = ix.drugs.map(normalize);
      return ixNorm.every(d => activeNorm.some(a => a.includes(d) || d.includes(a)));
    });
  }, [activeDrugs]);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {alerts.map((alert, i) => (
        <AlertBanner
          key={i}
          level={alert.severity}
          text={`⚠️ ${alert.drugs.join(" + ")}: ${alert.effect}. ${alert.recommendation}`}
        />
      ))}
    </div>
  );
};

export default DrugInteractions;
