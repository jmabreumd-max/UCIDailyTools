import { useState, useMemo, useEffect } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { usePatient } from "@/contexts/PatientContext";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import InfoTooltip from "../InfoTooltip";
import AlertBanner from "../AlertBanner";
import CollapsibleSection from "../CollapsibleSection";
import ExamChecklist from "../ExamChecklist";
import SectionDivider from "../SectionDivider";

const RESP_EXAM: { category: string; items: string[] }[] = [
  { category: "Inspeção", items: ["Cianose", "Tiragem", "Adejo nasal", "Taquipneia", "Bradipneia", "Respiração paradoxal", "Uso de acessórios", "Padrão de Kussmaul", "Padrão de Cheyne-Stokes", "Assimetria torácica"] },
  { category: "Auscultação", items: ["MV simétrico", "MV diminuído D", "MV diminuído E", "MV abolido D", "MV abolido E", "Crepitações basais", "Crepitações difusas", "Sibilos", "Roncos", "Estridor", "Atrito pleural", "Broncofonia"] },
  { category: "Percussão", items: ["Macicez D", "Macicez E", "Hipertimpanismo D", "Hipertimpanismo E"] },
  { category: "Secreções", items: ["Secreções claras", "Secreções purulentas", "Secreções hemáticas", "Secreções espessas", "Secreções escassas", "Secreções abundantes"] },
  { category: "Via Aérea", items: ["TOT (tubo orotraqueal)", "Traqueostomia", "Enfisema subcutâneo", "Edema da glote", "Cuff leak +"] },
  { category: "Drenos", items: ["Dreno torácico D", "Dreno torácico E", "Borbulhante", "Oscilante", "Débito hemático", "Débito seroso", "Ar"] },
];

/* ── ABG Interpretation Component ── */
const ABGInterpretation = ({ ph, paco2, hco3, be }: { ph: string; paco2: string; hco3: string; be: string }) => {
  const phV = parseFloat(ph);
  const co2V = parseFloat(paco2);
  const hco3V = parseFloat(hco3);
  const beV = parseFloat(be);

  if (!phV || !co2V || !hco3V) return <Interpretation status="warning" text="Preencha pH, PaCO₂ e HCO₃⁻ para análise." />;

  const results: { label: string; text: string; status: "normal" | "warning" | "danger" }[] = [];

  // Step 1: Primary disorder
  const acidemia = phV < 7.35;
  const alkalemia = phV > 7.45;
  const normalPh = !acidemia && !alkalemia;

  let primary = "";
  if (acidemia) {
    if (co2V > 45 && hco3V < 22) primary = "Acidose mista (respiratória + metabólica)";
    else if (co2V > 45) primary = "Acidose respiratória";
    else if (hco3V < 22) primary = "Acidose metabólica";
    else primary = "Acidemia (origem indeterminada)";
  } else if (alkalemia) {
    if (co2V < 35 && hco3V > 26) primary = "Alcalose mista (respiratória + metabólica)";
    else if (co2V < 35) primary = "Alcalose respiratória";
    else if (hco3V > 26) primary = "Alcalose metabólica";
    else primary = "Alcalemia (origem indeterminada)";
  } else {
    if (co2V > 45 && hco3V > 26) primary = "Distúrbio misto compensado (acidose resp + alcalose met)";
    else if (co2V < 35 && hco3V < 22) primary = "Distúrbio misto compensado (alcalose resp + acidose met)";
    else primary = "Gasimetria normal";
  }

  results.push({
    label: "Distúrbio primário",
    text: primary,
    status: normalPh && co2V >= 35 && co2V <= 45 ? "normal" : acidemia ? "danger" : "warning",
  });

  // Step 2: Winters' formula (expected PaCO₂ for metabolic acidosis)
  if (hco3V < 22 && (acidemia || normalPh)) {
    const wintersLow = 1.5 * hco3V + 8 - 2;
    const wintersHigh = 1.5 * hco3V + 8 + 2;
    const compensated = co2V >= wintersLow && co2V <= wintersHigh;
    const superimposedResp = co2V > wintersHigh;

    results.push({
      label: "Fórmula de Winters",
      text: `PaCO₂ esperada: ${wintersLow.toFixed(0)}–${wintersHigh.toFixed(0)} mmHg (atual: ${co2V}). ${
        compensated ? "Compensação respiratória adequada." 
        : superimposedResp ? "Acidose respiratória sobreposta (PaCO₂ > esperada)."
        : "Alcalose respiratória sobreposta (PaCO₂ < esperada)."
      }`,
      status: compensated ? "normal" : "warning",
    });
  }

  // Expected PaCO₂ for metabolic alkalosis
  if (hco3V > 26 && (alkalemia || normalPh)) {
    const expectedCO2 = 0.7 * hco3V + 21;
    const delta = Math.abs(co2V - expectedCO2);
    const compensated = delta <= 5;

    results.push({
      label: "Compensação respiratória",
      text: `PaCO₂ esperada: ~${expectedCO2.toFixed(0)} mmHg (atual: ${co2V}). ${
        compensated ? "Compensação respiratória adequada."
        : co2V > expectedCO2 + 5 ? "Acidose respiratória sobreposta."
        : "Alcalose respiratória sobreposta."
      }`,
      status: compensated ? "normal" : "warning",
    });
  }

  // Expected HCO3 for respiratory acidosis
  if (co2V > 45 && (acidemia || normalPh)) {
    const deltaCO2 = co2V - 40;
    const acuteHCO3 = 24 + 0.1 * deltaCO2;
    const chronicHCO3 = 24 + 0.35 * deltaCO2;

    results.push({
      label: "Compensação metabólica",
      text: `HCO₃⁻ esperado — Aguda: ~${acuteHCO3.toFixed(1)} | Crónica: ~${chronicHCO3.toFixed(1)} (atual: ${hco3V}). ${
        Math.abs(hco3V - acuteHCO3) <= 2 ? "Compatível com acidose respiratória aguda."
        : Math.abs(hco3V - chronicHCO3) <= 2 ? "Compatível com acidose respiratória crónica."
        : hco3V > chronicHCO3 + 2 ? "Alcalose metabólica sobreposta."
        : "Acidose metabólica sobreposta."
      }`,
      status: "warning",
    });
  }

  // Expected HCO3 for respiratory alkalosis
  if (co2V < 35 && (alkalemia || normalPh)) {
    const deltaCO2 = 40 - co2V;
    const acuteHCO3 = 24 - 0.2 * deltaCO2;
    const chronicHCO3 = 24 - 0.5 * deltaCO2;

    results.push({
      label: "Compensação metabólica",
      text: `HCO₃⁻ esperado — Aguda: ~${acuteHCO3.toFixed(1)} | Crónica: ~${chronicHCO3.toFixed(1)} (atual: ${hco3V}). ${
        Math.abs(hco3V - acuteHCO3) <= 2 ? "Compatível com alcalose respiratória aguda."
        : Math.abs(hco3V - chronicHCO3) <= 2 ? "Compatível com alcalose respiratória crónica."
        : hco3V < chronicHCO3 - 2 ? "Acidose metabólica sobreposta."
        : "Alcalose metabólica sobreposta."
      }`,
      status: "warning",
    });
  }

  // Delta-Delta guidance
  if (hco3V < 22 && (acidemia || normalPh)) {
    const deltaHCO3 = 24 - hco3V;
    results.push({
      label: "Delta-Delta",
      text: `ΔHCO₃⁻ = ${deltaHCO3.toFixed(1)}. Para completar: calcular AG no Renal. ΔAG/ΔHCO₃: >2 = alcalose met. associada | 1–2 = AG puro | <1 = acidose hiperclorémica associada.`,
      status: "warning",
    });
  }

  // BE interpretation
  if (!isNaN(beV)) {
    results.push({
      label: "Base Excess",
      text: beV < -2 ? `BE ${beV} — Défice de base. Componente metabólico ácido.`
        : beV > 2 ? `BE ${beV} — Excesso de base. Componente metabólico alcalino.`
        : `BE ${beV} — Normal. Sem componente metabólico significativo.`,
      status: beV < -5 || beV > 5 ? "danger" : Math.abs(beV) > 2 ? "warning" : "normal",
    });
  }

  return (
    <div className="space-y-2">
      {results.map((r, i) => (
        <div key={i} className="bg-muted/30 rounded-lg p-2.5 border border-border">
          <p className="text-[9px] text-muted-foreground font-semibold mb-0.5">{r.label}</p>
          <Interpretation status={r.status} text={r.text} />
        </div>
      ))}
    </div>
  );
};

/* ── PEEP Titration Section ── */
const ARDSNET_TABLE = [
  { fio2: 0.30, peepLow: 5, peepHigh: 5 },
  { fio2: 0.40, peepLow: 5, peepHigh: 8 },
  { fio2: 0.50, peepLow: 8, peepHigh: 10 },
  { fio2: 0.60, peepLow: 10, peepHigh: 12 },
  { fio2: 0.70, peepLow: 10, peepHigh: 14 },
  { fio2: 0.80, peepLow: 14, peepHigh: 18 },
  { fio2: 0.90, peepLow: 14, peepHigh: 20 },
  { fio2: 1.00, peepLow: 18, peepHigh: 24 },
];

const PEEP_METHODS = [
  { id: "ardsnet", label: "Tabela ARDSNet" },
  { id: "vptool", label: "V/P Tool (Hamilton)" },
  { id: "esophageal", label: "Balão Transesofágico" },
  { id: "eit", label: "EIT" },
  { id: "echo", label: "Ecografia Pulmonar" },
  { id: "dp", label: "Driving Pressure" },
] as const;

interface PeepTitrationProps {
  peep: string;
  pPlat: string;
  drivingPressure: number | null;
  calcCompliance: number | null;
  fio2: string;
  pfRatio: number | null;
}

const PeepTitrationSection = ({ peep, pPlat, drivingPressure, calcCompliance, fio2, pfRatio }: PeepTitrationProps) => {
  const [method, setMethod] = usePersistedState<string>("vent-peep-method", "ardsnet");
  // Esophageal balloon fields
  const [pes, setPes] = usePersistedState("vent-pes-exp", "");
  const [pesInsp, setPesInsp] = usePersistedState("vent-pes-insp", "");

  const fio2Val = parseFloat(fio2);
  const fio2Frac = fio2Val > 1 ? fio2Val / 100 : fio2Val;
  const peepVal = parseFloat(peep);
  const pPlatVal = parseFloat(pPlat);

  // ARDSNet lookup
  const ardsnetRow = useMemo(() => {
    if (!fio2Frac || fio2Frac < 0.3) return null;
    for (let i = ARDSNET_TABLE.length - 1; i >= 0; i--) {
      if (fio2Frac >= ARDSNET_TABLE[i].fio2) return ARDSNET_TABLE[i];
    }
    return ARDSNET_TABLE[0];
  }, [fio2Frac]);

  // Transpulmonary pressure
  const pesVal = parseFloat(pes);
  const pesInspVal = parseFloat(pesInsp);
  const plExp = useMemo(() => {
    if (!peepVal || isNaN(pesVal)) return null;
    return peepVal - pesVal;
  }, [peepVal, pesVal]);
  const plInsp = useMemo(() => {
    if (!pPlatVal || isNaN(pesInspVal)) return null;
    return pPlatVal - pesInspVal;
  }, [pPlatVal, pesInspVal]);

  return (
    <div className="space-y-3">
      {/* Method selector */}
      <div className="flex flex-wrap gap-1.5">
        {PEEP_METHODS.map((m) => (
          <button key={m.id} onClick={() => setMethod(m.id)}
            className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
              method === m.id ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"
            }`}>{m.label}</button>
        ))}
      </div>

      {/* ── ARDSNet Table ── */}
      {method === "ardsnet" && (
        <div className="space-y-2">
          <div className="bg-muted/30 rounded-lg p-2.5 border border-border">
            <p className="text-[10px] font-semibold text-foreground mb-1">Tabela FiO₂/PEEP — ARDSNet (Low & High)</p>
            <p className="text-[9px] text-muted-foreground">Protocolos ARMA/ALVEOLI. Ajustar PEEP conforme FiO₂ para manter SpO₂ 88–95% ou PaO₂ 55–80 mmHg.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-1 px-1.5 text-left text-muted-foreground font-semibold">FiO₂</th>
                  <th className="py-1 px-1.5 text-center text-muted-foreground font-semibold">PEEP Low</th>
                  <th className="py-1 px-1.5 text-center text-muted-foreground font-semibold">PEEP High</th>
                </tr>
              </thead>
              <tbody>
                {ARDSNET_TABLE.map((row) => {
                  const isActive = ardsnetRow && row.fio2 === ardsnetRow.fio2;
                  return (
                    <tr key={row.fio2} className={`border-b border-border/50 ${isActive ? "bg-primary/10" : ""}`}>
                      <td className={`py-1 px-1.5 font-mono ${isActive ? "text-primary font-semibold" : "text-foreground"}`}>{(row.fio2 * 100).toFixed(0)}%</td>
                      <td className={`py-1 px-1.5 text-center font-mono ${isActive ? "text-primary font-semibold" : "text-foreground"}`}>{row.peepLow}</td>
                      <td className={`py-1 px-1.5 text-center font-mono ${isActive ? "text-primary font-semibold" : "text-foreground"}`}>{row.peepHigh}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {ardsnetRow && peepVal ? (
            <Interpretation
              status={peepVal >= ardsnetRow.peepLow && peepVal <= ardsnetRow.peepHigh ? "normal" : peepVal < ardsnetRow.peepLow ? "warning" : "danger"}
              text={peepVal < ardsnetRow.peepLow
                ? `PEEP ${peepVal} abaixo da tabela Low (${ardsnetRow.peepLow}) para FiO₂ ${(ardsnetRow.fio2 * 100).toFixed(0)}%. Considerar ↑ PEEP.`
                : peepVal > ardsnetRow.peepHigh
                ? `PEEP ${peepVal} acima da tabela High (${ardsnetRow.peepHigh}). Risco hemodinâmico.`
                : `PEEP ${peepVal} dentro do intervalo ARDSNet (${ardsnetRow.peepLow}–${ardsnetRow.peepHigh}) para FiO₂ ${(ardsnetRow.fio2 * 100).toFixed(0)}%.`}
            />
          ) : (
            <Interpretation status="warning" text="Preencha FiO₂ e PEEP para comparar com a tabela." />
          )}
        </div>
      )}

      {/* ── V/P Tool (Hamilton) ── */}
      {method === "vptool" && (
        <div className="space-y-2">
          <div className="bg-muted/30 rounded-lg p-2.5 border border-border">
            <p className="text-[10px] font-semibold text-foreground mb-1">V/P Tool — Hamilton Medical</p>
            <p className="text-[9px] text-muted-foreground">Manobra automática de recrutamento com degraus de PEEP (2 cmH₂O). O ventilador constrói a curva P-V dinâmica e identifica a "melhor complacência" (ponto de inflexão inferior).</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-2.5 border border-border space-y-1.5">
            <p className="text-[9px] font-semibold text-foreground">Protocolo:</p>
            <ol className="text-[9px] text-muted-foreground space-y-1 list-decimal ml-3">
              <li>Menu → <span className="font-mono text-primary">Ferramentas → V/P Tool</span></li>
              <li>Iniciar manobra (paciente em VCV, PEEP inicial 5 cmH₂O)</li>
              <li>O ventilador sobe PEEP em degraus de 2 cmH₂O até 40 cmH₂O e depois desce</li>
              <li>Analisar o <span className="text-primary font-semibold">ponto de inflexão inferior</span> no ramo descendente (PEEP óptima)</li>
              <li>Verificar se P. Platô ≤ 28–30 cmH₂O na PEEP selecionada</li>
            </ol>
          </div>
          <div className="bg-muted/40 rounded-lg p-2.5 border border-border">
            <p className="text-[9px] font-semibold text-foreground mb-1">Interpretação da curva:</p>
            <div className="text-[9px] text-muted-foreground space-y-0.5">
              <p>• <span className="text-primary">Histerese ampla</span>: pulmão recrutável → PEEP mais alta beneficia</p>
              <p>• <span className="text-primary">Histerese estreita</span>: pouco recrutamento → PEEP conservadora</p>
              <p>• <span className="text-primary">Complacência máxima</span> no ramo descendente = PEEP ideal</p>
            </div>
          </div>
          {calcCompliance !== null && (
            <Interpretation
              status={calcCompliance < 30 ? "danger" : calcCompliance < 50 ? "warning" : "normal"}
              text={`Complacência atual: ${calcCompliance.toFixed(1)} mL/cmH₂O. ${calcCompliance < 30 ? "Muito baixa — alto potencial de recrutamento. V/P Tool recomendado." : calcCompliance < 50 ? "Moderada — considerar titulação." : "Adequada — verificar se PEEP actual mantém recrutamento."}`}
            />
          )}
        </div>
      )}

      {/* ── Balão Transesofágico ── */}
      {method === "esophageal" && (
        <div className="space-y-2">
          <div className="bg-muted/30 rounded-lg p-2.5 border border-border">
            <p className="text-[10px] font-semibold text-foreground mb-1">Pressão Transesofágica (Pes) — Balão Esofágico</p>
            <p className="text-[9px] text-muted-foreground">Estima a pressão pleural para calcular a pressão transpulmonar (PL). Gold standard para optimização individual da PEEP. Referência: Estudo EPVent-2 (Beitler, JAMA 2019).</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <CalcField label="Pes expiratória" value={pes} onChange={setPes} unit="cmH₂O" />
              <p className="text-[8px] text-muted-foreground mt-0.5">Fim da expiração</p>
            </div>
            <div>
              <CalcField label="Pes inspiratória" value={pesInsp} onChange={setPesInsp} unit="cmH₂O" />
              <p className="text-[8px] text-muted-foreground mt-0.5">Fim da inspiração</p>
            </div>
          </div>
          {plExp !== null && (
            <div className="space-y-1.5">
              <CalcResult label="PL expiratória" value={plExp.toFixed(1)} unit="cmH₂O"
                status={plExp < 0 ? "danger" : plExp > 5 ? "warning" : "normal"} />
              <Interpretation
                status={plExp < 0 ? "danger" : plExp > 5 ? "warning" : "normal"}
                text={plExp < 0
                  ? `PL exp ${plExp.toFixed(1)} — Negativa → colapso alveolar. ↑ PEEP até PL exp 0–2 cmH₂O.`
                  : plExp <= 2
                  ? `PL exp ${plExp.toFixed(1)} — Ideal. Alvéolos abertos sem sobredistensão.`
                  : `PL exp ${plExp.toFixed(1)} — Elevada. Risco de sobredistensão. ↓ PEEP.`}
              />
            </div>
          )}
          {plInsp !== null && (
            <div className="space-y-1.5">
              <CalcResult label="PL inspiratória" value={plInsp.toFixed(1)} unit="cmH₂O"
                status={plInsp > 25 ? "danger" : plInsp > 20 ? "warning" : "normal"} />
              <Interpretation
                status={plInsp > 25 ? "danger" : plInsp > 20 ? "warning" : "normal"}
                text={plInsp <= 20
                  ? `PL insp ${plInsp.toFixed(1)} — Segura. Sem sobredistensão.`
                  : plInsp <= 25
                  ? `PL insp ${plInsp.toFixed(1)} — Limítrofe. Monitorizar.`
                  : `PL insp ${plInsp.toFixed(1)} — Risco VILI. ↓ VC ou ↓ PEEP.`}
              />
            </div>
          )}
          <div className="bg-muted/40 rounded-lg p-2.5 border border-border">
            <p className="text-[9px] font-semibold text-foreground mb-1">Alvos:</p>
            <div className="text-[9px] text-muted-foreground space-y-0.5">
              <p>• <span className="text-primary">PL expiratória</span>: 0 a +2 cmH₂O (evitar colapso)</p>
              <p>• <span className="text-primary">PL inspiratória</span>: ≤ 20 cmH₂O (evitar VILI)</p>
              <p>• Se PL exp negativa → ↑ PEEP em 2 cmH₂O e repetir</p>
            </div>
          </div>
        </div>
      )}

      {/* ── EIT ── */}
      {method === "eit" && (
        <div className="space-y-2">
          <div className="bg-muted/30 rounded-lg p-2.5 border border-border">
            <p className="text-[10px] font-semibold text-foreground mb-1">Tomografia de Impedância Elétrica (EIT)</p>
            <p className="text-[9px] text-muted-foreground">Monitorização contínua e não invasiva da ventilação regional. Identifica em tempo real colapso e sobredistensão para titular PEEP com precisão.</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-2.5 border border-border space-y-1.5">
            <p className="text-[9px] font-semibold text-foreground">Protocolo de titulação decremental:</p>
            <ol className="text-[9px] text-muted-foreground space-y-1 list-decimal ml-3">
              <li>Manobra de recrutamento (CPAP 30–40 cmH₂O × 30–40 seg)</li>
              <li>Iniciar PEEP 20 cmH₂O, ↓ 2 cmH₂O a cada 3–5 min</li>
              <li>Monitorizar no EIT: % colapso e % sobredistensão por ROI</li>
              <li><span className="text-primary font-semibold">PEEP óptima</span> = cruzamento das curvas colapso/sobredistensão (mínimo de ambos)</li>
              <li>Ajustar PEEP +2 cmH₂O acima do ponto de colapso</li>
            </ol>
          </div>
          <div className="bg-muted/40 rounded-lg p-2.5 border border-border">
            <p className="text-[9px] font-semibold text-foreground mb-1">Parâmetros EIT a monitorizar:</p>
            <div className="text-[9px] text-muted-foreground space-y-0.5">
              <p>• <span className="text-primary">Centro de Ventilação (CoV)</span>: ideal 45–55% (ventilação homogénea)</p>
              <p>• <span className="text-primary">% Colapso</span>: alvo &lt; 5% (zonas dependentes)</p>
              <p>• <span className="text-primary">% Sobredistensão</span>: alvo &lt; 5% (zonas não-dependentes)</p>
              <p>• <span className="text-primary">Pendelluft</span>: movimento de gás intra-pulmonar (↑ P-SILI)</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Ecografia Pulmonar ── */}
      {method === "echo" && (
        <div className="space-y-2">
          <div className="bg-muted/30 rounded-lg p-2.5 border border-border">
            <p className="text-[10px] font-semibold text-foreground mb-1">Ecografia Pulmonar — Avaliação de Recrutamento</p>
            <p className="text-[9px] text-muted-foreground">Avaliação semi-quantitativa da aeração pulmonar por regiões. Não substitui EIT, mas é acessível e à cabeceira.</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-2.5 border border-border space-y-1.5">
            <p className="text-[9px] font-semibold text-foreground">LUS Score (0–36 pontos, 12 regiões):</p>
            <div className="text-[9px] text-muted-foreground space-y-0.5">
              <p>• <span className="text-primary font-mono">0</span> — Deslizamento pleural + linhas A (normal)</p>
              <p>• <span className="text-primary font-mono">1</span> — ≥ 3 linhas B espaçadas (edema intersticial)</p>
              <p>• <span className="text-primary font-mono">2</span> — Linhas B confluentes / "pulmão branco" (edema alveolar)</p>
              <p>• <span className="text-primary font-mono">3</span> — Consolidação com broncograma aéreo</p>
            </div>
          </div>
          <div className="bg-muted/40 rounded-lg p-2.5 border border-border">
            <p className="text-[9px] font-semibold text-foreground mb-1">Uso na titulação da PEEP:</p>
            <div className="text-[9px] text-muted-foreground space-y-0.5">
              <p>• Avaliar zonas <span className="text-primary">dependentes</span> (posteriores/inferiores): consolidação → recrutável</p>
              <p>• ↑ PEEP e repetir scan: mudança score 3→1 = recrutamento eficaz</p>
              <p>• Monitorizar zonas <span className="text-primary">não-dependentes</span>: se surgem linhas B → sobredistensão</p>
              <p>• <span className="text-primary">Re-aeração score</span> (ΔLUS): ↓ ≥ 8 pts pós-PEEP = bom recrutamento</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Driving Pressure guided ── */}
      {method === "dp" && (
        <div className="space-y-2">
          <div className="bg-muted/30 rounded-lg p-2.5 border border-border">
            <p className="text-[10px] font-semibold text-foreground mb-1">Titulação por Driving Pressure (DP)</p>
            <p className="text-[9px] text-muted-foreground">Método simples e disponível em qualquer ventilador. Ajustar PEEP para minimizar DP (= P.Platô − PEEP). Referência: Amato et al., NEJM 2015.</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-2.5 border border-border space-y-1.5">
            <p className="text-[9px] font-semibold text-foreground">Protocolo:</p>
            <ol className="text-[9px] text-muted-foreground space-y-1 list-decimal ml-3">
              <li>Manter VC fixo (6 mL/kg PBW)</li>
              <li>↑ PEEP em degraus de 2 cmH₂O (ex: 8 → 10 → 12 → 14)</li>
              <li>Medir P.Platô a cada nível (pausa inspiratória 0.5 s)</li>
              <li>Calcular DP = P.Platô − PEEP a cada nível</li>
              <li><span className="text-primary font-semibold">PEEP óptima</span> = nível com menor DP (melhor complacência)</li>
              <li>Confirmar P.Platô ≤ 30 cmH₂O e estabilidade hemodinâmica</li>
            </ol>
          </div>
          {drivingPressure !== null && (
            <div className="space-y-1.5">
              <CalcResult label="DP actual" value={drivingPressure.toFixed(0)} unit="cmH₂O"
                status={drivingPressure > 15 ? "danger" : drivingPressure > 13 ? "warning" : "normal"} />
              <Interpretation
                status={drivingPressure > 15 ? "danger" : drivingPressure > 13 ? "warning" : "normal"}
                text={drivingPressure <= 13
                  ? `DP ${drivingPressure.toFixed(0)} — Protetor. Manter PEEP actual.`
                  : drivingPressure <= 15
                  ? `DP ${drivingPressure.toFixed(0)} — Limítrofe. Titular PEEP ±2 e reavaliar.`
                  : `DP ${drivingPressure.toFixed(0)} — Elevada. ↑ PEEP ou ↓ VC. Risco de VILI.`}
              />
            </div>
          )}
          <div className="bg-muted/40 rounded-lg p-2.5 border border-border">
            <p className="text-[9px] font-semibold text-foreground mb-1">Alvos:</p>
            <div className="text-[9px] text-muted-foreground space-y-0.5">
              <p>• <span className="text-primary">DP ≤ 13 cmH₂O</span>: protetor (menor mortalidade)</p>
              <p>• <span className="text-primary">DP &gt; 15</span>: associado a ↑ mortalidade independente do VC e PEEP</p>
              <p>• Se DP não ↓ com ↑ PEEP → pulmão não recrutável → ↓ PEEP</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Summary box ── */}
      <div className="bg-muted/30 rounded-lg p-2.5 border border-border mt-2">
        <p className="text-[9px] font-semibold text-foreground mb-1">Quando usar cada método?</p>
        <div className="text-[9px] text-muted-foreground space-y-0.5">
          <p>• <span className="text-primary">Tabela ARDSNet</span>: disponível em qualquer UCI, protocolo standard</p>
          <p>• <span className="text-primary">V/P Tool</span>: ventiladores Hamilton, manobra automática</p>
          <p>• <span className="text-primary">Balão esofágico</span>: gold standard, obesos, hipertensão abdominal</p>
          <p>• <span className="text-primary">EIT</span>: monitorização contínua, titulação personalizada</p>
          <p>• <span className="text-primary">Ecografia</span>: bedside, avaliar recrutabilidade</p>
          <p>• <span className="text-primary">Driving Pressure</span>: simples, qualquer ventilador, orientado por outcome</p>
        </div>
      </div>
    </div>
  );
};

const VentilatorioTab = () => {
  const { pesoIdeal, pao2, setPao2, fio2, setFio2, pfRatio } = usePatient();

  // ABG
  const [ph, setPh] = usePersistedState("vent-ph", "");
  const [paco2, setPaco2] = usePersistedState("vent-paco2", "");
  const [hco3, setHco3] = usePersistedState("vent-hco3", "");
  const [be, setBe] = usePersistedState("vent-be", "");

  // Mode selector
  const [ventMode, setVentMode] = usePersistedState<"invasiva" | "vni" | "onaf" | null>("vent-mode", null);
  const [invasiveSubMode, setInvasiveSubMode] = usePersistedState<"vcv" | "pcv" | "prvc" | "psv" | null>("vent-inv-submode", null);

  // Invasive params
  const [pip, setPip] = usePersistedState("vent-pip", "");
  const [peep, setPeep] = usePersistedState("vent-peep", "");
  const [pPlat, setPPlat] = usePersistedState("vent-pPlat", "");
  const [vt, setVt] = usePersistedState("vent-vt", "");
  const [fr, setFr] = usePersistedState("vent-fr", "");
  const [spo2, setSpo2] = usePersistedState("vent-spo2", "");
  const [p01, setP01] = usePersistedState("vent-p01", "");
  const [ti, setTi] = usePersistedState("vent-ti", "");

  // VNI
  const [vniSubMode, setVniSubMode] = usePersistedState<"cpap" | "bipap">("vent-vniSub", "bipap");
  const [cpapPressure, setCpapPressure] = usePersistedState("vent-cpap", "8");
  const [ipap, setIpap] = usePersistedState("vent-ipap", "14");
  const [epap, setEpap] = usePersistedState("vent-epap", "6");
  const [vniFr, setVniFr] = usePersistedState("vent-vniFr", "");
  const [vniSpo2, setVniSpo2] = usePersistedState("vent-vniSpo2", "");
  const [vniFio2, setVniFio2] = usePersistedState("vent-vniFio2", "");
  const [vniVt, setVniVt] = usePersistedState("vent-vniVt", "");

  // ONAF
  const [onafFlow, setOnafFlow] = usePersistedState("vent-onafFlow", "50");
  const [onafFr, setOnafFr] = usePersistedState("vent-onafFr", "");
  const [onafSpo2, setOnafSpo2] = usePersistedState("vent-onafSpo2", "");

  // HACOR
  const [hacorHR, setHacorHR] = usePersistedState("vent-hacorHR", 0);
  const [hacorPH, setHacorPH] = usePersistedState("vent-hacorPH", 0);
  const [hacorGCS, setHacorGCS] = usePersistedState("vent-hacorGCS", 0);
  const [hacorPF, setHacorPF] = usePersistedState("vent-hacorPF", 0);
  const [hacorRR, setHacorRR] = usePersistedState("vent-hacorRR", 0);

  // Light's criteria
  const [pleuralProt, setPleuralProt] = usePersistedState("vent-pleuralProt", "");
  const [serumProt, setSerumProt] = usePersistedState("vent-serumProt", "");
  const [pleuralLDH, setPleuralLDH] = usePersistedState("vent-pleuralLDH", "");
  const [serumLDH, setSerumLDH] = usePersistedState("vent-serumLDH", "");

  // Computed - invasive
  const drivingPressure = useMemo(() => {
    const pp = parseFloat(pPlat); const pe = parseFloat(peep);
    return pp && pe ? pp - pe : null;
  }, [pPlat, peep]);

  const calcCompliance = useMemo(() => {
    const v = parseFloat(vt);
    if (!v || !drivingPressure || drivingPressure <= 0) return null;
    return v / drivingPressure;
  }, [vt, drivingPressure]);

  const elastance = useMemo(() => calcCompliance ? (1 / calcCompliance) * 1000 : null, [calcCompliance]);

  const timeConstant = useMemo(() => {
    if (!calcCompliance) return null;
    const pipV = parseFloat(pip); const ppV = parseFloat(pPlat);
    const vtV = parseFloat(vt); const frV = parseFloat(fr);
    if (pipV && ppV && vtV && frV) {
      const tiVal = parseFloat(ti) || (60 / (frV * 3));
      const flow = (vtV / 1000) / tiVal;
      const resistance = (pipV - ppV) / flow;
      return (resistance * calcCompliance) / 1000;
    }
    return null;
  }, [calcCompliance, pip, pPlat, vt, fr, ti]);

  const tobinIndex = useMemo(() => {
    const f = parseFloat(fr); const v = parseFloat(vt);
    if (!f || !v) return null;
    return f / (v > 10 ? v / 1000 : v);
  }, [fr, vt]);

  const vtPerKg = useMemo(() => {
    const v = parseFloat(vt);
    return v && pesoIdeal ? v / pesoIdeal : null;
  }, [vt, pesoIdeal]);

  // ROX for invasive (desmame)
  const roxInvasive = useMemo(() => {
    const s = parseFloat(spo2); const f = parseFloat(fio2); const r = parseFloat(fr);
    if (!s || !f || !r) return null;
    return (s / (f > 1 ? f : f * 100)) / r;
  }, [spo2, fio2, fr]);

  // ROX for ONAF - uses shared fio2
  const roxOnaf = useMemo(() => {
    const s = parseFloat(onafSpo2); const f = parseFloat(fio2); const r = parseFloat(onafFr);
    if (!s || !f || !r) return null;
    return (s / (f > 1 ? f : f * 100)) / r;
  }, [onafSpo2, fio2, onafFr]);

  const hacorTotal = hacorHR + hacorPH + hacorGCS + hacorPF + hacorRR;

  // Light's criteria
  const lightsCriteria = useMemo(() => {
    const pp = parseFloat(pleuralProt); const sp = parseFloat(serumProt);
    const pl = parseFloat(pleuralLDH); const sl = parseFloat(serumLDH);
    if (!pp || !sp || !pl || !sl) return null;
    const protRatio = pp / sp;
    const ldhRatio = pl / sl;
    const ldhUpperNormal = sl * 0.67;
    const isExudate = protRatio > 0.5 || ldhRatio > 0.6 || pl > ldhUpperNormal;
    return { protRatio, ldhRatio, pleuralLDHAbsolute: pl, ldhUpperNormal, isExudate };
  }, [pleuralProt, serumProt, pleuralLDH, serumLDH]);

  return (
    <div className="space-y-4">
      <SectionDivider title="Exame Físico" />
      <ExamChecklist storageKey="vent" title="Exame Respiratório" categories={RESP_EXAM} />

      <SectionDivider title="Via Aérea & Suporte" />

      {/* Mode selector */}
      <CollapsibleSection title="Modo Ventilatório">
        <div className="flex gap-1.5">
          {([["invasiva", "VM Invasiva"], ["vni", "VNI (BiPAP/CPAP)"], ["onaf", "ONAF"]] as const).map(([mode, label]) => (
            <button key={mode} onClick={() => setVentMode(ventMode === mode ? null : mode)}
              className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                ventMode === mode ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"
              }`}>{label}</button>
          ))}
        </div>
      </CollapsibleSection>

      <SectionDivider title="Gasimetria & Oxigenação" />

      {/* ═══ GASIMETRIA ARTERIAL (Oxigenação + Ácido-Base) ═══ */}
      <CollapsibleSection title="Gasimetria Arterial"
        badge={ph ? `pH ${ph}${pfRatio ? ` · P/F ${pfRatio.toFixed(0)}` : ""}` : pfRatio ? `P/F ${pfRatio.toFixed(0)}` : undefined}
        info={<InfoTooltip interpretation="Gasimetria completa: oxigenação (P/F para SOFA) e equilíbrio ácido-base (Winters, Delta-Delta)." />}>

        <p className="text-[9px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-wider">Oxigenação</p>
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div>
            <CalcField label="PaO₂" value={pao2} onChange={setPao2} unit="mmHg" />
            <p className="text-[8px] text-muted-foreground mt-0.5">60–100 mmHg</p>
          </div>
          <div>
            <CalcField label="FiO₂" value={fio2} onChange={setFio2} unit="%" />
            <p className="text-[8px] text-muted-foreground mt-0.5">Titular SpO₂ 92-96%</p>
          </div>
        </div>
        {pfRatio !== null && (
          <div className="mb-3">
            <CalcResult label="Relação P/F" value={pfRatio.toFixed(0)} unit=""
              status={pfRatio < 100 ? "danger" : pfRatio < 200 ? "danger" : pfRatio < 300 ? "warning" : "normal"} />
            <Interpretation
              status={pfRatio < 100 ? "danger" : pfRatio < 200 ? "danger" : pfRatio < 300 ? "warning" : "normal"}
              text={pfRatio >= 400 ? `P/F ${pfRatio.toFixed(0)} — Normal.`
                : pfRatio >= 300 ? `P/F ${pfRatio.toFixed(0)} — Ligeiramente reduzida.`
                : pfRatio >= 200 ? `P/F ${pfRatio.toFixed(0)} — SDRA Leve. VC 6 mL/kg, PEEP ≥ 5.`
                : pfRatio >= 100 ? `P/F ${pfRatio.toFixed(0)} — SDRA Moderada. Prona se < 150 às 12-24h.`
                : `P/F ${pfRatio.toFixed(0)} — SDRA Grave. Prona ≥ 16h. BNM 48h. ECMO se refratário.`}
            />
          </div>
        )}

        <div className="border-t border-border pt-3 mt-1">
          <p className="text-[9px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-wider">Equilíbrio Ácido-Base</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <div>
              <CalcField label="pH" value={ph} onChange={setPh} unit="" />
              <p className="text-[8px] text-muted-foreground mt-0.5">7.35–7.45</p>
            </div>
            <div>
              <CalcField label="PaCO₂" value={paco2} onChange={setPaco2} unit="mmHg" />
              <p className="text-[8px] text-muted-foreground mt-0.5">35–45</p>
            </div>
            <div>
              <CalcField label="HCO₃⁻" value={hco3} onChange={setHco3} unit="mEq/L" />
              <p className="text-[8px] text-muted-foreground mt-0.5">22–26</p>
            </div>
            <div>
              <CalcField label="BE" value={be} onChange={setBe} unit="mEq/L" />
              <p className="text-[8px] text-muted-foreground mt-0.5">−2 a +2</p>
            </div>
          </div>
          <ABGInterpretation ph={ph} paco2={paco2} hco3={hco3} be={be} />
        </div>
      </CollapsibleSection>

      {/* ═══ VENTILAÇÃO INVASIVA ═══ */}
      {ventMode === "invasiva" && (
        <>
          <SectionDivider title="Ventilação Mecânica Invasiva" />

          {/* Invasive Sub-Mode Selector */}
          <CollapsibleSection title="Modo Ventilatório Invasivo"
            info={<InfoTooltip interpretation="Selecione o modo programado no ventilador. Os parâmetros de monitorização adaptar-se-ão conforme o modo (controlado por volume, por pressão, duplo controlo ou espontâneo assistido)." />}>
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {([
                ["vcv", "VCV", "Volume Controlado"],
                ["pcv", "PCV", "Pressão Controlada"],
                ["prvc", "PRVC / APV", "Duplo Controlo"],
                ["psv", "PSV", "Pressão de Suporte"],
              ] as const).map(([mode, label, desc]) => (
                <button key={mode} onClick={() => setInvasiveSubMode(invasiveSubMode === mode ? null : mode)}
                  className={`py-2 px-2 rounded-lg text-left transition-all ${
                    invasiveSubMode === mode
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-muted text-muted-foreground border border-border hover:border-primary/20"
                  }`}>
                  <span className="text-[11px] font-semibold block">{label}</span>
                  <span className="text-[9px] opacity-70">{desc}</span>
                </button>
              ))}
            </div>

            {/* Mode-specific info */}
            {invasiveSubMode === "vcv" && (
              <div className="bg-muted/30 rounded-lg p-2.5 border border-border space-y-1">
                <p className="text-[10px] font-semibold text-foreground">VCV — Volume Controlled Ventilation</p>
                <p className="text-[9px] text-muted-foreground">Volume corrente e fluxo fixos. A pressão varia conforme a mecânica pulmonar.</p>
                <p className="text-[9px] text-muted-foreground"><strong>Programar:</strong> VC (6 mL/kg PBW), FR, PEEP, FiO₂, Fluxo/Ti</p>
                <p className="text-[9px] text-muted-foreground"><strong>Monitorizar:</strong> PIP, P. Platô (≤30), Driving Pressure (≤13), Complacência</p>
                <p className="text-[9px] text-muted-foreground"><strong>Alertas:</strong> ↑ PIP = ↑ resistência (broncoespasmo, secreções, tubo). ↑ P.Platô = ↓ complacência (SDRA, pneumotórax, edema).</p>
              </div>
            )}
            {invasiveSubMode === "pcv" && (
              <div className="bg-muted/30 rounded-lg p-2.5 border border-border space-y-1">
                <p className="text-[10px] font-semibold text-foreground">PCV — Pressure Controlled Ventilation</p>
                <p className="text-[9px] text-muted-foreground">Pressão inspiratória fixa. O VC varia conforme complacência e resistência.</p>
                <p className="text-[9px] text-muted-foreground"><strong>Programar:</strong> P. Insp (acima PEEP), FR, PEEP, FiO₂, Ti</p>
                <p className="text-[9px] text-muted-foreground"><strong>Monitorizar:</strong> VC (alvo 6 mL/kg PBW), VM, Fluxo inspiratório</p>
                <p className="text-[9px] text-muted-foreground"><strong>Alertas:</strong> ↓ VC = ↓ complacência (recrutar? ↑ Pinsp?). ↑ VC = melhoria mecânica (considerar ↓ Pinsp).</p>
                <AlertBanner text="Em PCV, o volume corrente NÃO é garantido. Monitorizar VC continuamente." level="warning" />
              </div>
            )}
            {invasiveSubMode === "prvc" && (
              <div className="bg-muted/30 rounded-lg p-2.5 border border-border space-y-1">
                <p className="text-[10px] font-semibold text-foreground">PRVC / APV — Pressure Regulated Volume Control</p>
                <p className="text-[9px] text-muted-foreground">Duplo controlo: garante VC alvo ajustando a pressão ciclo-a-ciclo. Combina vantagens do VCV e PCV.</p>
                <p className="text-[9px] text-muted-foreground"><strong>Programar:</strong> VC alvo (6 mL/kg PBW), FR, PEEP, FiO₂</p>
                <p className="text-[9px] text-muted-foreground"><strong>Monitorizar:</strong> Pressão entregue, VC real, P. Platô, Driving Pressure</p>
                <p className="text-[9px] text-muted-foreground"><strong>Atenção:</strong> Se pressão máxima atingida sem entregar VC → alarme. Pode ↓ pressão se esforço do doente ↑ (auto-weaning involuntário).</p>
              </div>
            )}
            {invasiveSubMode === "psv" && (
              <div className="bg-muted/30 rounded-lg p-2.5 border border-border space-y-1">
                <p className="text-[10px] font-semibold text-foreground">PSV — Pressure Support Ventilation</p>
                <p className="text-[9px] text-muted-foreground">Modo espontâneo assistido. O doente inicia todos os ciclos; o ventilador assiste com pressão de suporte.</p>
                <p className="text-[9px] text-muted-foreground"><strong>Programar:</strong> PS (8–15 cmH₂O), PEEP, FiO₂, trigger (sensibilidade)</p>
                <p className="text-[9px] text-muted-foreground"><strong>Monitorizar:</strong> FR, VC, VM, P0.1 (drive), RSBI (Tobin), padrão respiratório</p>
                <p className="text-[9px] text-muted-foreground"><strong>Desmame:</strong> ↓ PS gradualmente (2 cmH₂O cada 2–4h). TRE quando PS ≤ 7 + PEEP ≤ 5.</p>
                <AlertBanner text="PSV requer drive respiratório. Contraindicado se GCS ≤ 8 ou sedação profunda (RASS < -3)." level="warning" />
              </div>
            )}
          </CollapsibleSection>

          {/* VC Protetor */}
          {pesoIdeal && (
            <CollapsibleSection title="Volume Corrente Protetor"
              info={<InfoTooltip formula="6 × PBW" reference="Alvo: 6 mL/kg PBW (4–8)" interpretation="VC ajustado ao peso ideal para minimizar VILI." />}>
              <p className="text-[10px] text-muted-foreground font-mono">
                PBW: {pesoIdeal.toFixed(1)} kg | VC alvo: <span className="text-primary font-semibold">{(pesoIdeal * 6).toFixed(0)} mL</span> (intervalo: {(pesoIdeal * 4).toFixed(0)}–{(pesoIdeal * 8).toFixed(0)} mL)
              </p>
            </CollapsibleSection>
          )}

          {/* Monitoring Parameters */}
          <CollapsibleSection title={`Monitorização — ${invasiveSubMode ? { vcv: "VCV", pcv: "PCV", prvc: "PRVC", psv: "PSV" }[invasiveSubMode] : "VM Invasiva"}`}
            info={<InfoTooltip interpretation="Parâmetros de mecânica ventilatória e trocas gasosas." />}>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-3">
              <div>
                <CalcField label="PIP" value={pip} onChange={setPip} unit="cmH₂O" />
                <p className="text-[8px] text-muted-foreground mt-0.5">Pressão Inspiratória de Pico</p>
              </div>
              <div>
                <CalcField label="P. Platô" value={pPlat} onChange={setPPlat} unit="cmH₂O" />
                <p className="text-[8px] text-muted-foreground mt-0.5">Alvo ≤ 30</p>
              </div>
              <div>
                <CalcField label="PEEP" value={peep} onChange={setPeep} unit="cmH₂O" />
                <p className="text-[8px] text-muted-foreground mt-0.5">Pressão Final Expiração</p>
              </div>
              <div>
                <CalcField label="VC" value={vt} onChange={setVt} unit="mL" />
                <p className="text-[8px] text-muted-foreground mt-0.5">6 mL/kg PBW</p>
              </div>
              <div>
                <CalcField label="FR" value={fr} onChange={setFr} unit="irpm" />
                <p className="text-[8px] text-muted-foreground mt-0.5">Frequência Respiratória</p>
              </div>
              <div>
                <CalcField label="SpO₂" value={spo2} onChange={setSpo2} unit="%" />
                <p className="text-[8px] text-muted-foreground mt-0.5">Saturação Periférica</p>
              </div>
              <div>
                <CalcField label="P0.1" value={p01} onChange={setP01} unit="cmH₂O" />
                <p className="text-[8px] text-muted-foreground mt-0.5">Normal: 1.5–3.5</p>
              </div>
              <CalcField label="Ti (insp)" value={ti} onChange={setTi} unit="seg" placeholder="auto" />
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {drivingPressure !== null && (
                <div>
                  <div className="flex items-center gap-0.5">
                    <span className="text-[9px] text-muted-foreground">Driving Pressure</span>
                    <InfoTooltip formula="P.Platô − PEEP" reference="≤ 13 protetor | > 15 VILI" />
                  </div>
                  <CalcResult label="" value={drivingPressure.toFixed(0)} unit="cmH₂O"
                    status={drivingPressure > 15 ? "danger" : drivingPressure > 13 ? "warning" : "normal"} />
                </div>
              )}
              {calcCompliance !== null && (
                <div>
                  <div className="flex items-center gap-0.5">
                    <span className="text-[9px] text-muted-foreground">Complacência (Cst)</span>
                    <InfoTooltip formula="VC / DP" reference="> 50 normal | < 30 rígido" />
                  </div>
                  <CalcResult label="" value={calcCompliance.toFixed(1)} unit="mL/cmH₂O"
                    status={calcCompliance < 30 ? "danger" : calcCompliance < 50 ? "warning" : "normal"} />
                </div>
              )}
              {vtPerKg !== null && (
                <div>
                  <div className="flex items-center gap-0.5">
                    <span className="text-[9px] text-muted-foreground">VC/kg PBW</span>
                    <InfoTooltip formula="VC / PBW" reference="Alvo: 6 mL/kg (4–8)" />
                  </div>
                  <CalcResult label="" value={vtPerKg.toFixed(1)} unit="mL/kg"
                    status={vtPerKg > 8 ? "danger" : vtPerKg < 4 ? "warning" : "normal"} />
                </div>
              )}
            </div>

            {/* Interpretations */}
            <div className="space-y-2 mt-3">
              {drivingPressure !== null && drivingPressure > 15 && (
                <Interpretation status="danger" text={`DP ${drivingPressure} — Risco de VILI. ↓ VC, titular PEEP.`} />
              )}
              {p01 && parseFloat(p01) > 3.5 && (
                <Interpretation status="danger" text={`P0.1 = ${p01} — Drive elevado. Risco de P-SILI. ↑ sedação.`} />
              )}
            </div>
          </CollapsibleSection>

          {/* ═══ TITULAÇÃO DA PEEP ═══ */}
          <CollapsibleSection title="Titulação da PEEP"
            info={<InfoTooltip interpretation="Métodos de optimização da PEEP: tabela ARDSNet, V/P Tool (Hamilton), balão transesofágico (Pes), EIT e ecografia pulmonar." />}>

            {/* Method selector */}
            <PeepTitrationSection peep={peep} pPlat={pPlat} drivingPressure={drivingPressure} calcCompliance={calcCompliance} fio2={fio2} pfRatio={pfRatio} />
          </CollapsibleSection>

          {/* Desmame */}
          <CollapsibleSection title="Desmame Ventilatório"
            info={<InfoTooltip interpretation="RSBI (Tobin) e ROX para predizer sucesso de extubação." />}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-0.5 mb-1">
                  <span className="text-[10px] text-muted-foreground font-semibold">RSBI (Tobin)</span>
                  <InfoTooltip formula="FR / VC(L)" reference="< 80 favorável | > 105 falha" />
                </div>
                <CalcResult label="" value={tobinIndex?.toFixed(0) ?? null} unit="irpm/L"
                  status={tobinIndex ? (tobinIndex > 105 ? "danger" : tobinIndex > 80 ? "warning" : "normal") : undefined} />
              </div>
              <div>
                <div className="flex items-center gap-0.5 mb-1">
                  <span className="text-[10px] text-muted-foreground font-semibold">ROX</span>
                  <InfoTooltip formula="(SpO₂/FiO₂) / FR" reference="> 4.88 manter | < 3.85 falha" />
                </div>
                <CalcResult label="" value={roxInvasive?.toFixed(2) ?? null} unit=""
                  status={roxInvasive ? (roxInvasive < 3.85 ? "danger" : roxInvasive < 4.88 ? "warning" : "normal") : undefined} />
              </div>
            </div>
            {tobinIndex !== null && (
              <Interpretation
                status={tobinIndex > 105 ? "danger" : tobinIndex > 80 ? "warning" : "normal"}
                text={tobinIndex <= 80 ? "RSBI < 80 — Favorável. TRE 30-120 min." : tobinIndex <= 105 ? "RSBI 80–105 — Zona cinzenta." : "RSBI > 105 — Falha provável."}
              />
            )}
            <div className="mt-2 bg-muted/30 rounded-lg p-2.5 border border-border">
              <p className="text-[9px] text-muted-foreground"><strong>Critérios pré-TRE:</strong> FiO₂ ≤ 40% · PEEP ≤ 8 · GCS ≥ 8 · Tosse eficaz</p>
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* ═══ VNI ═══ */}
      {ventMode === "vni" && (
        <>
          <SectionDivider title="Ventilação Não Invasiva" />
          <CollapsibleSection title="Programação VNI">
            <div className="flex gap-1.5 mb-3">
              {([["cpap", "CPAP"], ["bipap", "BiPAP"]] as const).map(([mode, label]) => (
                <button key={mode} onClick={() => setVniSubMode(mode)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    vniSubMode === mode ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"
                  }`}>{label}</button>
              ))}
            </div>

            {vniSubMode === "cpap" && (
              <div className="space-y-2">
                <div className="bg-muted/30 rounded-lg p-2.5 border border-border">
                  <p className="text-[10px] font-semibold text-foreground mb-1">CPAP — Continuous Positive Airway Pressure</p>
                  <p className="text-[9px] text-muted-foreground">Pressão contínua. 1ª linha no EAP cardiogénico.</p>
                </div>
                <CalcField label="Pressão (CPAP)" value={cpapPressure} onChange={setCpapPressure} unit="cmH₂O" />
                <p className="text-[9px] text-muted-foreground font-mono">Iniciar: 5–8 cmH₂O · Máx: 12–15</p>
              </div>
            )}

            {vniSubMode === "bipap" && (
              <div className="space-y-2">
                <div className="bg-muted/30 rounded-lg p-2.5 border border-border">
                  <p className="text-[10px] font-semibold text-foreground mb-1">BiPAP — Bilevel Positive Airway Pressure</p>
                  <p className="text-[9px] text-muted-foreground">PS = IPAP - EPAP</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <CalcField label="IPAP" value={ipap} onChange={setIpap} unit="cmH₂O" />
                  <CalcField label="EPAP" value={epap} onChange={setEpap} unit="cmH₂O" />
                </div>
                {parseFloat(ipap) > 0 && parseFloat(epap) > 0 && (
                  <p className="text-[10px] font-mono text-primary">PS: {(parseFloat(ipap) - parseFloat(epap)).toFixed(0)} cmH₂O</p>
                )}
                <p className="text-[9px] text-muted-foreground font-mono">Iniciar: IPAP 10–14, EPAP 4–6</p>
              </div>
            )}
          </CollapsibleSection>

          {/* VNI Monitoring */}
          <CollapsibleSection title="Monitorização — VNI">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <CalcField label="FR" value={vniFr} onChange={setVniFr} unit="irpm" />
              <CalcField label="SpO₂" value={vniSpo2} onChange={setVniSpo2} unit="%" />
              <CalcField label="FiO₂" value={vniFio2} onChange={setVniFio2} unit="%" />
              <CalcField label="VC" value={vniVt} onChange={setVniVt} unit="mL" />
            </div>
            {vniFr && parseFloat(vniFr) > 30 && <AlertBanner text={`FR ${vniFr} — Taquipneia sob VNI.`} level="warning" />}
            {vniSpo2 && parseFloat(vniSpo2) < 92 && <AlertBanner text={`SpO₂ ${vniSpo2}% — Hipoxemia.`} level="danger" />}
          </CollapsibleSection>

          {/* HACOR */}
          <CollapsibleSection title="HACOR Score — Falha de VNI" badge={hacorTotal > 0 ? `${hacorTotal} pts` : undefined}
            info={<InfoTooltip formula="HR + Acidosis + Consciousness + Oxygenation + RR" reference="≤ 5: baixo risco | > 5: alto risco → IOT" />}>
            {[
              { label: "FC", items: [{ s: 0, l: "< 120 bpm" }, { s: 1, l: "≥ 120 bpm" }], val: hacorHR, set: setHacorHR },
              { label: "pH", items: [{ s: 0, l: "≥ 7.35" }, { s: 2, l: "7.30–7.34" }, { s: 3, l: "7.25–7.29" }, { s: 4, l: "< 7.25" }], val: hacorPH, set: setHacorPH },
              { label: "GCS", items: [{ s: 0, l: "15" }, { s: 2, l: "13–14" }, { s: 5, l: "≤ 12" }], val: hacorGCS, set: setHacorGCS },
              { label: "P/F", items: [{ s: 0, l: "≥ 200" }, { s: 2, l: "150–199" }, { s: 3, l: "100–149" }, { s: 4, l: "< 100" }], val: hacorPF, set: setHacorPF },
              { label: "FR", items: [{ s: 0, l: "≤ 30" }, { s: 1, l: "31–35" }, { s: 2, l: "36–40" }, { s: 3, l: "> 40" }], val: hacorRR, set: setHacorRR },
            ].map(({ label, items, val, set }) => (
              <div key={label} className="mb-2">
                <p className="text-[10px] text-muted-foreground font-semibold mb-1">{label}</p>
                <div className="flex flex-wrap gap-1">
                  {items.map((it) => (
                    <button key={it.s + it.l} onClick={() => set(it.s)}
                      className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
                        val === it.s ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"
                      }`}>{it.l} ({it.s})</button>
                  ))}
                </div>
              </div>
            ))}
            {(hacorHR > 0 || hacorPH > 0 || hacorGCS > 0 || hacorPF > 0 || hacorRR > 0) ? (
              <>
                <CalcResult label="HACOR" value={hacorTotal.toString()} unit="pontos" status={hacorTotal > 5 ? "danger" : "normal"} />
                <Interpretation status={hacorTotal > 5 ? "danger" : "normal"}
                  text={hacorTotal <= 5 ? `HACOR ${hacorTotal} — Baixo risco. Manter VNI.` : `HACOR ${hacorTotal} — Alto risco. Considerar IOT.`} />
              </>
            ) : (
              <p className="text-[10px] text-muted-foreground italic mt-2">Selecione os parâmetros para calcular o score.</p>
            )}
          </CollapsibleSection>
        </>
      )}

      {/* ═══ ONAF ═══ */}
      {ventMode === "onaf" && (
        <>
          <SectionDivider title="Oxigenoterapia Nasal de Alto Fluxo" />
          <CollapsibleSection title="Programação ONAF"
            info={<InfoTooltip interpretation="Fluxo aquecido/humidificado até 60 L/min. PEEP ~1 cmH₂O / 10 L/min." />}>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <CalcField label="Fluxo" value={onafFlow} onChange={setOnafFlow} unit="L/min" />
                <p className="text-[8px] text-muted-foreground mt-0.5">Iniciar 30–50. Máx 60.</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">FiO₂ (partilhado)</p>
                <p className="text-[11px] font-mono text-foreground">{fio2 || "—"} %</p>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground font-mono">PEEP ≈ {((parseFloat(onafFlow) || 50) / 10).toFixed(1)} cmH₂O</p>
          </CollapsibleSection>

          {/* ONAF Monitoring */}
          <CollapsibleSection title="Monitorização — ONAF">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <CalcField label="FR" value={onafFr} onChange={setOnafFr} unit="irpm" />
                <p className="text-[8px] text-muted-foreground mt-0.5">Frequência Respiratória</p>
              </div>
              <div>
                <CalcField label="SpO₂" value={onafSpo2} onChange={setOnafSpo2} unit="%" />
                <p className="text-[8px] text-muted-foreground mt-0.5">Saturação sob ONAF</p>
              </div>
            </div>
          </CollapsibleSection>

          {/* ROX Index - ALWAYS visible in ONAF */}
          <CollapsibleSection title="Índice ROX" badge={roxOnaf !== null ? roxOnaf.toFixed(2) : undefined}
            info={<InfoTooltip formula="(SpO₂/FiO₂) / FR" reference="> 4.88: manter | 3.85–4.88: reavaliar | < 3.85: IOT" interpretation="Preditor de falha em ONAF. Avaliar às 2, 6 e 12h." />}>
            {roxOnaf !== null ? (
              <>
                <CalcResult label="ROX" value={roxOnaf.toFixed(2)} unit=""
                  status={roxOnaf < 3.85 ? "danger" : roxOnaf < 4.88 ? "warning" : "normal"} />
                <Interpretation
                  status={roxOnaf < 3.85 ? "danger" : roxOnaf < 4.88 ? "warning" : "normal"}
                  text={roxOnaf < 3.85 ? `ROX ${roxOnaf.toFixed(2)} — Alto risco de falha. IOT.`
                    : roxOnaf < 4.88 ? `ROX ${roxOnaf.toFixed(2)} — Risco intermédio. Reavaliar 2h.`
                    : `ROX ${roxOnaf.toFixed(2)} — Baixo risco. Manter ONAF.`}
                />
              </>
            ) : (
              <Interpretation status="warning" text="Preencha SpO₂, FiO₂ e FR para calcular o ROX." />
            )}
          </CollapsibleSection>
        </>
      )}

      <SectionDivider title="Avaliação Pleural" />

      {/* ═══ CRITÉRIOS DE LIGHT ═══ */}
      <CollapsibleSection title="Critérios de Light — Derrame Pleural"
        info={<InfoTooltip formula="Exsudato se ≥1: Prot pleural/sérica > 0.5 | LDH pleural/sérica > 0.6 | LDH pleural > ⅔ LSN sérico" interpretation="Distingue transudatos de exsudatos." />}>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <CalcField label="Proteínas Pleural" value={pleuralProt} onChange={setPleuralProt} unit="g/dL" />
          <CalcField label="Proteínas Soro" value={serumProt} onChange={setSerumProt} unit="g/dL" />
          <CalcField label="LDH Pleural" value={pleuralLDH} onChange={setPleuralLDH} unit="U/L" />
          <CalcField label="LDH Soro" value={serumLDH} onChange={setSerumLDH} unit="U/L" />
        </div>

        {lightsCriteria && (
          <div className="space-y-2">
            <div className="bg-muted/50 rounded-lg p-3 border border-border space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Prot pleural/sérica</span>
                <span className={`font-mono font-medium ${lightsCriteria.protRatio > 0.5 ? "text-warning" : "text-foreground"}`}>
                  {lightsCriteria.protRatio.toFixed(2)} {lightsCriteria.protRatio > 0.5 ? "✗" : "✓"}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">LDH pleural/sérica</span>
                <span className={`font-mono font-medium ${lightsCriteria.ldhRatio > 0.6 ? "text-warning" : "text-foreground"}`}>
                  {lightsCriteria.ldhRatio.toFixed(2)} {lightsCriteria.ldhRatio > 0.6 ? "✗" : "✓"}
                </span>
              </div>
            </div>
            <CalcResult label="Classificação" value={lightsCriteria.isExudate ? "EXSUDATO" : "TRANSUDATO"} unit=""
              status={lightsCriteria.isExudate ? "warning" : "normal"} />
            <Interpretation status={lightsCriteria.isExudate ? "warning" : "normal"}
              text={lightsCriteria.isExudate ? "Exsudato — Infeção, neoplasia, TB, TEP." : "Transudato — IC, cirrose, síndrome nefrótico."} />
          </div>
        )}
      </CollapsibleSection>

    </div>
  );
};

export default VentilatorioTab;
