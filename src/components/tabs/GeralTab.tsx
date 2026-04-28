import { usePersistedState } from "@/hooks/usePersistedState";
import { usePatient } from "@/contexts/PatientContext";
import { Activity, Brain, Wind, Heart, FlaskConical, Utensils, Droplets, Bug, Pill, BarChart3, ClipboardCheck } from "lucide-react";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import InfoTooltip from "../InfoTooltip";
import CollapsibleSection from "../CollapsibleSection";
import ClinicalTimers from "../ClinicalTimers";

const CFS_LEVELS = [
  { score: 1, label: "Very Fit", desc: "Robusto, ativo, energético e motivado. Exercício regular." },
  { score: 2, label: "Well", desc: "Sem doença ativa mas menos fit que 1. Exercício ocasional." },
  { score: 3, label: "Managing Well", desc: "Problemas médicos bem controlados. Sem atividade regular." },
  { score: 4, label: "Vulnerable", desc: "Não dependente mas queixa-se de lentidão. Atividades limitadas." },
  { score: 5, label: "Mildly Frail", desc: "Necessita ajuda em AIVD (finanças, transporte, medicação)." },
  { score: 6, label: "Moderately Frail", desc: "Necessita ajuda em AVD (banho, vestir). Escadas com dificuldade." },
  { score: 7, label: "Severely Frail", desc: "Totalmente dependente nas AVD. Estável mas não terminal." },
  { score: 8, label: "Very Severely Frail", desc: "Totalmente dependente. Próximo do fim de vida." },
  { score: 9, label: "Terminally Ill", desc: "Em fim de vida. Expectativa < 6 meses." },
];

const quickNav = [
  { id: "neuro", label: "Neurologia", desc: "GCS, FOUR, Sedação, PIC", icon: Brain, color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: "vent", label: "Ventilatório", desc: "P/F, ROX, Complacência, Drive", icon: Wind, color: "text-sky-500", bg: "bg-sky-500/10" },
  { id: "cardio", label: "Cardíaco", desc: "PAM, Índice Cardíaco, Choque", icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10" },
  { id: "renal", label: "Renal", desc: "Cl. Cr, Bicarbonato, Balança", icon: FlaskConical, color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "digest", label: "Digestivo", desc: "Nutrição, Fígado, Trânsito", icon: Utensils, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "hemato", label: "Hematológico", desc: "ROTEM, Sangramento, Agentes", icon: Droplets, color: "text-red-500", bg: "bg-red-500/10" },
  { id: "infecao", label: "Infeção", desc: "Sepsis, Antibióticos", icon: Bug, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { id: "farmacos", label: "Fármacos", desc: "Doses, Perfusões, DIL", icon: Pill, color: "text-fuchsia-500", bg: "bg-fuchsia-500/10" },
  { id: "prognostico", label: "Prognóstico", desc: "APACHE II, SOFA", icon: BarChart3, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "final", label: "Finalização", desc: "Checklist de Alta", icon: ClipboardCheck, color: "text-green-500", bg: "bg-green-500/10" },
];

const GeralTab = ({ setActiveTab }: { setActiveTab: (id: string) => void }) => {
  const {
    pesoAtual, setPesoAtual, altura, setAltura, idade, setIdade,
    sexo, setSexo,
    weightReference, setWeightReference,
    pesoIdeal, pesoAjustado, pesoReferencia, imc,
    clearPatient,
  } = usePatient();

  const [cfs, setCfs] = usePersistedState<number | null>("geral-cfs", null);

  return (
    <div className="space-y-4">
      {/* Patient Data */}
      <CollapsibleSection title="Acesso Rápido" defaultOpen
        info={<InfoTooltip interpretation="Navegação rápida para os sistemas e ferramentas clínicas calculadoras." />}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickNav.map((nav) => {
            const Icon = nav.icon;
            return (
              <button key={nav.id} onClick={() => setActiveTab(nav.id)}
                className="flex items-start text-left gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all group">
                <div className={`p-2 rounded-lg shrink-0 transition-colors ${nav.bg}`}>
                  <Icon className={`w-5 h-5 ${nav.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-[13px] text-foreground group-hover:text-primary transition-colors">{nav.label}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-tight">{nav.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Dados do Doente" defaultOpen
        info={<InfoTooltip interpretation="Dados antropométricos e demográficos. Persistem até clicar 'Limpar / Novo Turno'." />}>

        <div className="flex items-center justify-end mb-3">
          <button onClick={clearPatient}
            className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-all">
            Limpar / Novo Turno
          </button>
        </div>

        <div className="flex gap-2 mb-3">
          <button onClick={() => setSexo("M")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${sexo === "M" ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"}`}>
            ♂ Masculino
          </button>
          <button onClick={() => setSexo("F")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${sexo === "F" ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"}`}>
            ♀ Feminino
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <CalcField label="Idade" value={idade} onChange={setIdade} unit="anos" />
          <CalcField label="Altura" value={altura} onChange={setAltura} unit="cm" />
          <CalcField label="Peso Atual" value={pesoAtual} onChange={setPesoAtual} unit="kg" />
        </div>

        {/* Weight Reference */}
        <div className="mb-3">
          <div className="flex items-center mb-1.5">
            <span className="calc-label mb-0">Peso de Referência</span>
            <InfoTooltip interpretation="Usado em doses, nutrição e ventilação em toda a app." />
          </div>
          <div className="flex gap-1.5">
            {(["ideal", "ajustado", "atual"] as const).map((opt) => {
              const val = opt === "ideal" ? pesoIdeal : opt === "ajustado" ? pesoAjustado : (parseFloat(pesoAtual) || null);
              return (
                <button key={opt} onClick={() => setWeightReference(opt)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    weightReference === opt ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"
                  }`}>
                  {opt === "ideal" ? "Ideal" : opt === "ajustado" ? "Ajustado" : "Atual"}
                  {val ? ` (${val.toFixed(1)})` : ""}
                </button>
              );
            })}
          </div>
        </div>

        {/* Computed values */}
        {(pesoIdeal || imc) && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 border border-border">
            {imc && (
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground flex items-center">IMC <InfoTooltip formula="Peso / (Altura/100)²" reference="18.5–24.9 kg/m²" /></span>
                <span className={`font-mono font-medium ${imc < 18.5 || imc >= 30 ? "text-warning" : "text-foreground"}`}>{imc.toFixed(1)} kg/m²</span>
              </div>
            )}
            {pesoIdeal && (
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground flex items-center">Peso Ideal (PBW) <InfoTooltip formula={sexo === "M" ? "50 + 0.91×(Alt−152.4)" : "45.5 + 0.91×(Alt−152.4)"} /></span>
                <span className="font-mono text-foreground">{pesoIdeal.toFixed(1)} kg</span>
              </div>
            )}
            {pesoAjustado && imc && imc >= 30 && (
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground flex items-center">Peso Ajustado <InfoTooltip formula="PBW + 0.4×(PA − PBW)" /></span>
                <span className="font-mono text-foreground">{pesoAjustado.toFixed(1)} kg</span>
              </div>
            )}
            {pesoReferencia && (
              <div className="flex justify-between text-[11px] border-t border-border pt-1.5 mt-1.5">
                <span className="text-muted-foreground font-semibold">Peso de Referência</span>
                <span className="font-mono text-primary font-semibold">{pesoReferencia.toFixed(1)} kg</span>
              </div>
            )}
          </div>
        )}

        {imc && (
          <Interpretation
            text={imc < 18.5 ? `IMC ${imc.toFixed(1)} — Baixo peso. Atenção à síndrome de realimentação.`
              : imc < 25 ? `IMC ${imc.toFixed(1)} — Peso normal.`
              : imc < 30 ? `IMC ${imc.toFixed(1)} — Excesso de peso.`
              : `IMC ${imc.toFixed(1)} — Obesidade. Usar peso ajustado para nutrição.`}
            status={imc < 18.5 || imc >= 30 ? "warning" : "normal"}
          />
        )}
      </CollapsibleSection>

      {/* Rockwood Clinical Frailty Scale */}
      <CollapsibleSection title="Clinical Frailty Scale (Rockwood)" badge={cfs !== null ? `${cfs}/9` : undefined}
        info={<InfoTooltip reference="Rockwood et al. CMAJ 2005" interpretation="Avaliação da fragilidade pré-admissão. Score ≥ 5 associado a maior mortalidade e pior outcome funcional na UCI." />}>

        <div className="space-y-1.5">
          {CFS_LEVELS.map(level => (
            <button key={level.score} onClick={() => setCfs(level.score)}
              className={`w-full text-left p-2 rounded-lg border transition-all ${
                cfs === level.score
                  ? level.score <= 3 ? "bg-primary/15 border-primary/30"
                    : level.score <= 5 ? "bg-warning/15 border-warning/30"
                    : "bg-destructive/15 border-destructive/30"
                  : "bg-muted/30 border-border hover:border-primary/20"
              }`}>
              <div className="flex items-baseline gap-2">
                <span className={`text-[11px] font-mono font-bold ${
                  cfs === level.score
                    ? level.score <= 3 ? "text-primary" : level.score <= 5 ? "text-warning" : "text-destructive"
                    : "text-muted-foreground"
                }`}>{level.score}</span>
                <div>
                  <span className="text-[11px] font-semibold text-foreground">{level.label}</span>
                  <p className="text-[9px] text-muted-foreground">{level.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {cfs !== null && (
          <div className="mt-3">
            <CalcResult label="CFS" value={cfs.toString()} unit="/ 9"
              status={cfs >= 7 ? "danger" : cfs >= 5 ? "warning" : "normal"} />
            <Interpretation
              status={cfs >= 7 ? "danger" : cfs >= 5 ? "warning" : "normal"}
              text={cfs <= 3 ? `CFS ${cfs} — Fit. Sem fragilidade.`
                : cfs === 4 ? `CFS 4 — Vulnerável. Monitorizar funcionalidade.`
                : cfs <= 6 ? `CFS ${cfs} — Frágil. Considerar objetivos terapêuticos e teto de cuidados.`
                : `CFS ${cfs} — Fragilidade severa. Discussão de proporcionalidade terapêutica recomendada.`}
            />
          </div>
        )}
      </CollapsibleSection>
      {/* Clinical Timers */}
      <ClinicalTimers />
    </div>
  );
};

export default GeralTab;
