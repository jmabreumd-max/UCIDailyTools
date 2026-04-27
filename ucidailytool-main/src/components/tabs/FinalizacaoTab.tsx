import { usePersistedState } from "@/hooks/usePersistedState";
import InfoTooltip from "../InfoTooltip";
import PatientSummaryExport from "../PatientSummaryExport";
import CollapsibleSection from "../CollapsibleSection";

interface CheckItem {
  key: string;
  label: string;
  description: string;
  actions: string[];
}

const FAST_HUGS_BID: CheckItem[] = [
  { key: "F", label: "Feeding", description: "Nutrição enteral iniciada? Via e meta calórica definidas?", actions: [
    "Iniciar NE nas primeiras 24–48h se hemodinâmica estável",
    "Meta calórica: 25–30 kcal/kg/dia (usar peso de referência)",
    "Meta proteica: 1.2–2.0 g/kg/dia",
    "Monitorizar resíduo gástrico (suspender se > 500 mL)",
    "Considerar NE pós-pilórica se intolerância gástrica",
    "Avaliar necessidade de NPT se NE impossível > 7 dias",
  ]},
  { key: "A", label: "Analgesia", description: "Dor avaliada (BPS/NRS)? Analgesia adequada?", actions: [
    "Avaliar dor a cada 4h com BPS (intubados) ou NRS (conscientes)",
    "Alvo: BPS ≤ 5 ou NRS ≤ 3",
    "1ª linha: Paracetamol 1g 6/6h EV",
    "2ª linha: Morfina/Fentanilo em perfusão ou bólus",
    "Considerar analgesia multimodal (Ketamina low-dose se refractário)",
    "Tratar dor ANTES de sedar (analgesia-first)",
  ]},
  { key: "S", label: "Sedation", description: "Nível de sedação adequado (RASS alvo)? Possível reduzir?", actions: [
    "Definir RASS alvo (geralmente 0 a −1)",
    "Avaliar RASS a cada 4h",
    "Preferir Propofol ou Dexmedetomidina (evitar benzodiazepinas)",
    "Pausa diária de sedação (SAT) se elegível",
    "Titular para mínimo necessário — over-sedation ↑ mortalidade",
    "Documentar razão se RASS alvo < −2",
  ]},
  { key: "T", label: "Thrombo-prophylaxis", description: "Profilaxia de TVP prescrita? Enoxaparina/meias?", actions: [
    "Enoxaparina 40 mg SC 1x/dia (ou 30 mg 12/12h se alto risco)",
    "Se ClCr < 30: HNF 5000 UI SC 8/8h ou 12/12h",
    "Se contraindicação farmacológica: meias de compressão + CPI",
    "Avaliar anti-Xa se obesidade, IR ou hemorragia",
    "Considerar dose terapêutica em COVID-19 grave (conforme protocolo)",
    "Suspender 12h antes de procedimentos invasivos",
  ]},
  { key: "H", label: "Head-of-bed elevation", description: "Cabeceira elevada 30–45°? Prevenção de PAV.", actions: [
    "Manter cabeceira a 30–45° (medir com goniómetro se disponível)",
    "Baixar apenas para procedimentos (e re-elevar imediatamente)",
    "Higiene oral com clorexidina 0.12% de 6/6h",
    "Verificar pressão do cuff do TET (25–30 cmH₂O)",
    "Aspiração de secreções subglóticas (se TET com lúmen dedicado)",
  ]},
  { key: "U", label: "Ulcer prophylaxis", description: "Profilaxia de úlcera de stress prescrita (IBP/anti-H2)?", actions: [
    "Indicações: VM > 48h, coagulopatia, história de úlcera/HDA, shock",
    "1ª linha: Pantoprazol 40 mg EV 1x/dia",
    "Alternativa: Ranitidina 50 mg EV 8/8h",
    "Suspender se tolerar NE plena (NE é protectora)",
    "Reavaliar necessidade diariamente — IBP ↑ risco C. difficile e pneumonia",
  ]},
  { key: "G", label: "Glucose control", description: "Glicemia controlada (140–180 mg/dL)? Protocolo de insulina?", actions: [
    "Alvo glicémico: 140–180 mg/dL (7.8–10 mmol/L)",
    "Iniciar perfusão de insulina se glicemia > 180 mg/dL persistente",
    "Monitorizar glicemia capilar 1–4h conforme protocolo",
    "Evitar hipoglicemia (< 70 mg/dL) — associada a ↑ mortalidade",
    "Atenção a corticóides, NE e NPT como causas de hiperglicemia",
  ]},
  { key: "S2", label: "Spontaneous breathing trial", description: "Doente elegível para prova de respiração espontânea?", actions: [
    "Critérios de elegibilidade: FiO₂ ≤ 40%, PEEP ≤ 8, sem vasopressores altos",
    "SAT (pausa de sedação) antes do SBT",
    "SBT com tubo-T ou PSV 5–8 cmH₂O durante 30–120 min",
    "Sucesso: FR < 35, SpO₂ > 90%, sem distress, FC/PA estáveis",
    "Avaliar cuff-leak test antes da extubação se alto risco de estridor",
    "Índice de Tobin (FR/Vt) < 105 = bom preditor de sucesso",
  ]},
  { key: "B", label: "Bowel care", description: "Trânsito intestinal avaliado? Laxantes se necessário?", actions: [
    "Registar data da última dejeção",
    "Se > 3 dias sem dejeção: lactulose 15–30 mL 8/8h",
    "Considerar bisacodilo ou enema se refractário",
    "Avaliar causas: opióides, imobilidade, hipocaliemia",
    "Monitorizar distensão abdominal e PCR se suspeita de íleo",
    "Naloxegol/Metilnaltrexona se íleo induzido por opióides",
  ]},
  { key: "I", label: "Indwelling catheters", description: "Necessidade de CVC, linha arterial, algália reavaliada?", actions: [
    "Reavaliar DIARIAMENTE necessidade de cada dispositivo",
    "CVC: remover se não necessário para vasopressores/NPT/acessos",
    "Algália: remover se DU não é critério de ressuscitação ativo",
    "Linha arterial: remover se PAI não é necessária e sem colheitas frequentes",
    "Drenos: remover quando débito < 100–200 mL/24h (conforme contexto)",
    "Cada dia adicional com CVC = +3–5% risco de infeção",
  ]},
  { key: "D", label: "De-escalation of antibiotics", description: "Antibióticos reavaliados? Possível de-escalar ou suspender?", actions: [
    "Reavaliar antibióticos às 48–72h com resultados microbiológicos",
    "De-escalar para espectro mais estreito conforme TSA",
    "Duração: seguir guidelines (maioria 5–7 dias)",
    "Monitorizar PCT seriada para guiar suspensão (↓ 80% ou < 0.5)",
    "Ajustar doses à função renal e TSFR",
    "Documentar indicação, agente, duração prevista",
  ]},
];

const ABCDEF: CheckItem[] = [
  { key: "A", label: "Assess, prevent & manage pain", description: "Avaliar dor com BPS ou NRS. Tratar antes de sedar.", actions: [
    "Usar BPS (intubados) ou CPOT como ferramenta de avaliação",
    "Avaliar dor antes e após intervenções (posicionamento, aspiração)",
    "Analgesia preventiva antes de procedimentos dolorosos",
    "Titular opióides para BPS ≤ 5",
    "Considerar analgesia regional se disponível",
  ]},
  { key: "B", label: "Both SAT & SBT", description: "Prova de despertar (SAT) + Prova de respiração espontânea (SBT) diárias.", actions: [
    "SAT primeiro: suspender sedação e avaliar após 30 min",
    "Se SAT positiva → prosseguir com SBT",
    "SAT + SBT coordenados ↓ duração de VM em 3 dias (média)",
    "Critérios de falha SAT: agitação, SpO₂ < 88%, FR > 35",
    "Se falha: reiniciar sedação a 50% da dose anterior",
  ]},
  { key: "C", label: "Choice of sedation", description: "Sedação ligeira preferida (RASS 0 a −1). Evitar benzodiazepinas se possível.", actions: [
    "Propofol ou Dexmedetomidina como 1ª linha",
    "Benzodiazepinas apenas se convulsões, abstinência alcoólica ou paralisia",
    "Benzodiazepinas ↑ risco de delirium em 2–4x",
    "Se Dexmedetomidina: monitorizar bradicardia e hipotensão",
    "Propofol: monitorizar TG e PRIS se > 48h a doses altas",
  ]},
  { key: "D", label: "Delirium: assess & manage", description: "Rastrear delirium com CAM-ICU. Tratar causas reversíveis.", actions: [
    "Rastrear com CAM-ICU ou ICDSC a cada turno (mín. 2x/dia)",
    "Identificar e tratar causas reversíveis: dor, retenção urinária, hipóxia, sépsis",
    "Medidas não farmacológicas: orientação, ciclo sono-vigília, óculos/próteses auditivas",
    "Haloperidol NÃO reduz duração (MIND-USA trial) — usar criteriosamente",
    "Dexmedetomidina pode ↓ delirium vs benzodiazepinas",
  ]},
  { key: "E", label: "Early mobility & exercise", description: "Mobilização precoce. Fisioterapia desde D1 se estável.", actions: [
    "Avaliação fisioterapia nas primeiras 24h",
    "Progressão: exercícios passivos → sentado → ortostatismo → marcha",
    "Critérios de segurança: PAM > 65, FiO₂ < 60%, sem ↑ vasopressores",
    "Mobilização precoce ↓ fraqueza adquirida na UCI e ↓ duração de VM",
    "Mesmo intubados podem ser mobilizados (evidência crescente)",
  ]},
  { key: "F", label: "Family engagement", description: "Envolver família nas decisões. Comunicação diária estruturada.", actions: [
    "Reunião familiar estruturada nas primeiras 72h",
    "Atualização diária (presencial ou telefónica) pelo médico responsável",
    "Discutir objetivos terapêuticos e expectativas",
    "Facilitar visitas (horário alargado quando possível)",
    "Identificar decisor substituto e diretivas antecipadas de vontade",
    "Rastrear burnout/PTSD dos familiares",
  ]},
];

const VAP_BUNDLE: CheckItem[] = [
  { key: "hob", label: "Cabeceira elevada 30–45°", description: "Reduz aspiração de conteúdo gástrico.", actions: [
    "Verificar ângulo a cada turno com goniómetro",
    "Documentar desvios e justificação",
  ]},
  { key: "oral", label: "Higiene oral com clorexidina", description: "Clorexidina 0.12% de 6/6h.", actions: [
    "Escovagem dentária 12/12h + clorexidina 6/6h",
    "Aspirar secreções orofaríngeas antes de mobilizar",
  ]},
  { key: "cuff", label: "Pressão do cuff 25–30 cmH₂O", description: "Previne micro-aspiração.", actions: [
    "Verificar pressão do cuff de 8/8h com cufómetro",
    "Manter entre 25–30 cmH₂O",
  ]},
  { key: "subg", label: "Aspiração subglótica", description: "TET com lúmen subglótico se disponível.", actions: [
    "Aspiração contínua ou intermitente de secreções subglóticas",
    "Reduz incidência de PAV em ~50% (meta-análises)",
  ]},
  { key: "sbt_vap", label: "Avaliação diária de extubação", description: "Minimizar dias de VM.", actions: [
    "Protocolo de desmame protocolizado",
    "Cada dia adicional de VM ↑ risco de PAV em 1–3%",
  ]},
  { key: "circuit", label: "Circuito ventilatório intacto", description: "Não trocar circuito rotineiramente.", actions: [
    "Trocar apenas se visivelmente sujo ou com avaria",
    "Manter circuito fechado durante aspiração (sistema fechado)",
  ]},
];

const CLABSI_BUNDLE: CheckItem[] = [
  { key: "hand", label: "Higiene das mãos", description: "Antes e após manipulação do CVC.", actions: [
    "Solução alcoólica antes de qualquer manipulação do cateter",
    "Verificar integridade do penso diariamente",
  ]},
  { key: "barrier", label: "Precauções de barreira máxima", description: "Na inserção: gorro, máscara, bata estéril, luvas, campo largo.", actions: [
    "Campo estéril de corpo inteiro",
    "Todos os presentes na sala com proteção adequada",
  ]},
  { key: "chx_skin", label: "Antissepsia com clorexidina", description: "Clorexidina 2% em álcool na inserção.", actions: [
    "Deixar secar completamente antes de puncionar",
    "Penso transparente com clorexidina (disco Biopatch® se disponível)",
  ]},
  { key: "site", label: "Local de inserção óptimo", description: "Preferir subclávia (menor taxa de infeção).", actions: [
    "Subclávia > Jugular > Femoral para risco de CLABSI",
    "Usar ecografia para guiar punção",
  ]},
  { key: "review", label: "Reavaliação diária da necessidade", description: "Remover CVC assim que possível.", actions: [
    "Perguntar DIARIAMENTE: 'Este cateter ainda é necessário?'",
    "Documentar indicação activa no processo clínico",
  ]},
];

const CAUTI_BUNDLE: CheckItem[] = [
  { key: "ind", label: "Indicação válida para algália", description: "Inserir apenas com indicação clara.", actions: [
    "Indicações: retenção urinária, monitorização de DU em instabilidade, cirurgia prolongada",
    "NÃO inserir por conveniência ou incontinência isolada",
  ]},
  { key: "aseptic", label: "Inserção asséptica", description: "Técnica asséptica na inserção.", actions: [
    "Kit estéril, luvas estéreis, antissepsia com clorexidina",
    "Calibre menor possível",
  ]},
  { key: "closed", label: "Sistema fechado", description: "Manter sistema de drenagem fechado.", actions: [
    "Não desconectar a ligação cateter-saco",
    "Saco de drenagem abaixo do nível da bexiga, sem tocar no chão",
  ]},
  { key: "remove_cau", label: "Remoção precoce", description: "Remover assim que possível.", actions: [
    "Reavaliar necessidade diariamente",
    "Cada dia adicional = ↑ 3–7% risco de ITU",
    "Considerar alternatives: condom, cateterismo intermitente",
  ]},
];

const SEPSIS_HOUR1: CheckItem[] = [
  { key: "lactate", label: "Doseamento de lactato", description: "Colher lactato sérico.", actions: [
    "Se lactato > 2 mmol/L: repetir em 2–4h",
    "Alvo: normalização ou ↓ > 10%/h",
  ]},
  { key: "cultures", label: "Hemoculturas antes de ATB", description: "Colher 2 sets de hemoculturas antes de iniciar antibióticos.", actions: [
    "2 sets (4 frascos) de locais diferentes",
    "Não atrasar ATB se colheita demorar > 45 min",
  ]},
  { key: "abx", label: "Antibióticos de largo espectro", description: "Iniciar nas primeiras 1–3h.", actions: [
    "Cada hora de atraso ↑ mortalidade em ~4%",
    "Cobertura empírica conforme foco presumido e flora local",
    "Dose de carga adequada (não reduzir na 1ª dose mesmo em IR)",
  ]},
  { key: "fluids", label: "Cristalóides 30 mL/kg", description: "Ressuscitação volêmica se hipotensão ou lactato ≥ 4.", actions: [
    "Iniciar LR ou SF 0.9% em bólus de 500 mL",
    "Reavaliar resposta após cada 500 mL (DU, PAM, lactato)",
    "Não atrasar vasopressores se sem resposta a fluidos",
  ]},
  { key: "vaso", label: "Vasopressores se PAM < 65", description: "Noradrenalina se hipotensão persiste após fluidos.", actions: [
    "Noradrenalina como 1ª linha",
    "Iniciar precocemente (mesmo durante ressuscitação com fluidos)",
    "Alvo PAM ≥ 65 mmHg",
    "Se dose alta: adicionar vasopressina 0.03 U/min",
  ]},
];

const ChecklistSection = ({ title, tooltip, items, storageKey, reference }: { 
  title: string; tooltip: string; items: CheckItem[]; storageKey: string; reference?: string 
}) => {
  const [checked, setChecked] = usePersistedState<Record<string, boolean>>(`final-${storageKey}`, {});
  const [expanded, setExpanded] = usePersistedState<Record<string, boolean>>(`final-${storageKey}-exp`, {});
  const toggle = (key: string) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleExpand = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  const total = items.length;
  const done = items.filter(i => checked[i.key]).length;

  return (
    <CollapsibleSection title={title} badge={`${done}/${total}`}
      info={<InfoTooltip interpretation={tooltip} reference={reference} />}>
      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.key}>
            <button onClick={() => toggle(item.key)}
              className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                checked[item.key]
                  ? "bg-primary/10 border-primary/25"
                  : "bg-muted/30 border-border hover:border-primary/20"
              }`}>
              <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  checked[item.key] ? "bg-primary border-primary" : "border-muted-foreground/40"
                }`}>
                  {checked[item.key] && (
                    <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground">
                      <span className="text-primary font-bold mr-1">{item.key.replace("S2", "S")}</span>
                      {item.label}
                    </span>
                    {item.actions.length > 0 && (
                      <button onClick={(e) => { e.stopPropagation(); toggleExpand(item.key); }}
                        className="text-[9px] text-muted-foreground hover:text-primary transition-colors px-1">
                        {expanded[item.key] ? "▲" : "▼"} Ações
                      </button>
                    )}
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              </div>
            </button>
            {expanded[item.key] && item.actions.length > 0 && (
              <div className="ml-7 mt-1 mb-1 p-2 rounded-md bg-muted/40 border border-border/50 space-y-1">
                {item.actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-primary text-[8px] mt-0.5">●</span>
                    <span className="text-[9px] text-muted-foreground leading-tight">{action}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {done === total && total > 0 && (
        <div className="mt-2 p-2 rounded-lg bg-primary/10 border border-primary/20 text-center">
          <span className="text-[10px] font-semibold text-primary">✓ Bundle completa</span>
        </div>
      )}
    </CollapsibleSection>
  );
};

const FinalizacaoTab = () => (
  <div className="space-y-4">
    <PatientSummaryExport />
    
    <ChecklistSection
      title="FAST HUGS BID"
      storageKey="fasthugsbid"
      tooltip="Mnemónica expandida para gestão diária do doente crítico. Cobre: nutrição, analgesia, sedação, profilaxias, desmame ventilatório, trânsito intestinal, dispositivos e antibióticos."
      reference="Vincent JL. Crit Care 2005; Papadimos et al. JCCM 2015"
      items={FAST_HUGS_BID}
    />
    <ChecklistSection
      title="ABCDEF Bundle"
      storageKey="abcdef"
      tooltip="ICU Liberation Bundle (SCCM). Associado a ↓ mortalidade, ↓ dias de VM, ↓ delirium e ↓ readmissão. Cada elemento adicional cumprido reduz mortalidade em 7%."
      reference="Pun et al. Lancet Respir Med 2019"
      items={ABCDEF}
    />
    <ChecklistSection
      title="Bundle Prevenção PAV"
      storageKey="vap"
      tooltip="Pneumonia Associada ao Ventilador. Incidência 5–40% dos doentes ventilados. Bundle reduz PAV em 60–70%. Mortalidade atribuível ~13%."
      reference="Klompas et al. NEJM 2014; IHI VAP Bundle"
      items={VAP_BUNDLE}
    />
    <ChecklistSection
      title="Bundle Prevenção CLABSI"
      storageKey="clabsi"
      tooltip="Infeção da Corrente Sanguínea Associada a CVC. Taxa: 1–5/1000 dias-cateter. Bundle reduz em > 50%. Mortalidade atribuível 12–25%."
      reference="Pronovost et al. NEJM 2006; CDC Guidelines"
      items={CLABSI_BUNDLE}
    />
    <ChecklistSection
      title="Bundle Prevenção CAUTI"
      storageKey="cauti"
      tooltip="Infeção do Trato Urinário Associada a Algália. Causa mais comum de infeção nosocomial. 80% associadas a cateter urinário."
      reference="CDC/HICPAC Guidelines 2009"
      items={CAUTI_BUNDLE}
    />
    <ChecklistSection
      title="Sepsis Hour-1 Bundle"
      storageKey="sepsis1h"
      tooltip="Surviving Sepsis Campaign Hour-1 Bundle. Iniciar TODOS os elementos dentro da 1ª hora de reconhecimento de sépsis. Cada hora de atraso em ATB ↑ mortalidade ~4%."
      reference="Evans et al. Crit Care Med 2021 (SSC Guidelines)"
      items={SEPSIS_HOUR1}
    />
  </div>
);

export default FinalizacaoTab;
