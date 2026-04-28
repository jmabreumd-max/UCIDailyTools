import { useMemo, useState, useEffect } from "react";
import { usePatient } from "@/contexts/PatientContext";
import { ClipboardCheck, Copy, Check, FileText } from "lucide-react";

const LS_PREFIX = "icu-ts-";

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (raw !== null) return JSON.parse(raw);
  } catch { /* ignore */ }
  return fallback;
}

/* ── MDR organism ID → display name map ── */
const MDR_NAMES: Record<string, string> = {
  mrsa: "MRSA", kpc: "KPC", esbl: "ESBL", vre: "VRE",
  acinetobacter: "Acinetobacter XDR", pseudomonas: "Pseudomonas MDR",
  stenotrophomonas: "S. maltophilia", ndm_mbl: "NDM/MBL",
  oxa48: "OXA-48-like", ampc_plasmidic: "AmpC (plasmídica)",
  mcr_colistin: "MCR (Colistina-R)", crab: "CRAB",
  crpa: "CRPA/DTR-PA", cre_other: "CRE (outros)",
  mrse: "MRSE", enterobacter_ampc: "ESCPM (AmpC)",
};

const RASS_LABELS: Record<number, string> = {
  4: "+4 Combativo", 3: "+3 Muito agitado", 2: "+2 Agitado", 1: "+1 Inquieto",
  0: "0 Alerta e calmo", [-1]: "-1 Sonolento", [-2]: "-2 Sedação leve",
  [-3]: "-3 Sedação moderada", [-4]: "-4 Sedação profunda", [-5]: "-5 Não despertável",
};

const SOFA_CAT_NAMES = ["Resp (P/F)", "Coag (Plaq)", "Hep (Bili)", "CV", "Neuro (GCS)", "Renal (Cr)"];

function getExamFindings(key: string): string[] {
  const checked = readLS<Record<string, boolean>>(`exam-${key}`, {});
  const notes = readLS<string>(`exam-${key}-notes`, "");
  const findings = Object.entries(checked).filter(([, v]) => v).map(([k]) => k);
  const result: string[] = [];
  if (findings.length) result.push(`Achados: ${findings.join(", ")}`);
  if (notes.trim()) result.push(`Obs: ${notes.trim()}`);
  return result;
}

/* ── Helper to add section ── */
function addSection(lines: string[], title: string, items: string[]) {
  if (items.length === 0) return;
  lines.push("");
  lines.push(`【${title}】`);
  items.forEach(i => lines.push(`  ${i}`));
}

const PatientSummaryExport = () => {
  const {
    pesoAtual, altura, idade, sexo, pesoIdeal, pesoAjustado, pesoReferencia, imc,
    weightReference, creatinina, creatininaBasal, albumina, onRRT, rrtType,
    plaquetas, bilirrubina, inr, lactato,
    pao2, fio2, pfRatio,
    gcsTotal, pamCardio,
    clCr, clCrStage, akiStage,
    ecmoType,
  } = usePatient();

  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setRefreshKey(k => k + 1); },
      { threshold: 0.1 }
    );
    const el = document.getElementById("patient-summary-export");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const summary = useMemo(() => {
    const now = new Date();
    const date = now.toLocaleDateString("pt-PT");
    const time = now.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
    const lines: string[] = [];

    lines.push(`══════════════════════════════`);
    lines.push(`   DIÁRIO CLÍNICO — UCI`);
    lines.push(`   ${date} ${time}`);
    lines.push(`══════════════════════════════`);

    // ═══════════════════════════════════════
    // 1. DADOS GERAIS
    // ═══════════════════════════════════════
    const geralItems: string[] = [];
    if (idade) geralItems.push(`Idade: ${idade} anos`);
    if (sexo) geralItems.push(`Sexo: ${sexo === "M" ? "Masculino" : "Feminino"}`);
    if (pesoAtual) geralItems.push(`Peso: ${pesoAtual} kg`);
    if (altura) geralItems.push(`Altura: ${altura} cm`);
    if (imc) geralItems.push(`IMC: ${imc.toFixed(1)} kg/m²`);
    if (pesoIdeal) geralItems.push(`Peso Ideal: ${pesoIdeal.toFixed(1)} kg`);
    if (pesoAjustado && imc && imc >= 30) geralItems.push(`Peso Ajustado: ${pesoAjustado.toFixed(1)} kg`);
    if (pesoReferencia) geralItems.push(`Peso Ref (${weightReference}): ${pesoReferencia.toFixed(1)} kg`);
    const cfs = readLS<number | null>("geral-cfs", null);
    if (cfs !== null) geralItems.push(`CFS (Fragilidade): ${cfs}/9`);
    addSection(lines, "DADOS GERAIS", geralItems);

    // ═══════════════════════════════════════
    // 2. NEUROLÓGICO
    // ═══════════════════════════════════════
    const neuroItems: string[] = [];
    const gcsE = readLS<number | null>("neuro-gcsE", null);
    const gcsV = readLS<number | null>("neuro-gcsV", null);
    const gcsM = readLS<number | null>("neuro-gcsM", null);
    if (gcsE !== null && gcsV !== null && gcsM !== null) {
      const total = gcsE + gcsV + gcsM;
      neuroItems.push(`GCS: ${total} (E${gcsE}V${gcsV}M${gcsM})`);
    }
    const rass = readLS<number | null>("neuro-rass", null);
    if (rass !== null) neuroItems.push(`RASS: ${RASS_LABELS[rass] || rass}`);
    const bpsFace = readLS<number | null>("neuro-bpsFace", null);
    const bpsLimbs = readLS<number | null>("neuro-bpsLimbs", null);
    const bpsVent = readLS<number | null>("neuro-bpsVent", null);
    if (bpsFace !== null && bpsLimbs !== null && bpsVent !== null) {
      neuroItems.push(`BPS: ${bpsFace + bpsLimbs + bpsVent}/12`);
    }
    // CAM-ICU
    const camF1 = readLS<boolean | null>("neuro-camF1", null);
    const camF2 = readLS<boolean | null>("neuro-camF2", null);
    const camF3 = readLS<boolean | null>("neuro-camF3", null);
    const camF4 = readLS<boolean | null>("neuro-camF4", null);
    if (camF1 !== null) {
      let camResult = "Incompleto";
      if (camF1 === false) camResult = "Negativo";
      else if (camF1 && camF2 === false) camResult = "Negativo";
      else if (camF1 && camF2 === true) {
        if (camF3 === true || camF4 === true) camResult = "POSITIVO — Delirium";
        else if (camF3 === false && camF4 === false) camResult = "Negativo";
      }
      neuroItems.push(`CAM-ICU: ${camResult}`);
    }
    // Neuromonitoring
    const pic = readLS("neuro-pic", "");
    const bis = readLS("neuro-bis", "");
    const nirsL = readLS("neuro-nirsL", "");
    const nirsR = readLS("neuro-nirsR", "");
    if (pic) neuroItems.push(`PIC: ${pic} mmHg`);
    if (bis) neuroItems.push(`BIS: ${bis}`);
    if (nirsL || nirsR) neuroItems.push(`NIRS: E ${nirsL || "—"} / D ${nirsR || "—"} %`);
    // PPC
    const pamVal = parseFloat(pamCardio) || 0;
    const picVal = parseFloat(pic);
    if (pamVal && !isNaN(picVal) && picVal >= 0) {
      neuroItems.push(`PPC: ${(pamVal - picVal).toFixed(0)} mmHg`);
    }
    // Lindegaard
    const mcaV = readLS("neuro-mcaV", "");
    const icaV = readLS("neuro-icaV", "");
    if (mcaV && icaV && parseFloat(icaV) > 0) {
      neuroItems.push(`Lindegaard: ${(parseFloat(mcaV) / parseFloat(icaV)).toFixed(1)} (MCA ${mcaV} / ICA ${icaV})`);
    }
    // MRC
    const mrcScores = readLS<(number | null)[]>("neuro-mrc", new Array(12).fill(null));
    if (mrcScores.every(s => s !== null)) {
      const mrcTotal = (mrcScores as number[]).reduce((a, b) => a + b, 0);
      neuroItems.push(`MRC-SS: ${mrcTotal}/60${mrcTotal < 48 ? " — Fraqueza adquirida na UCI" : ""}`);
    }
    neuroItems.push(...getExamFindings("neuro"));

    // Sedation infusions
    const SEDATION_NAMES = ["Fentanil", "Remifentanil", "Midazolam", "Propofol", "Dexmedetomidina", "Cetamina", "Rocurónio", "Cisatracúrio"];
    const sedationRates = readLS<string[]>("neuro-sedationRates", []);
    const activeSedation = SEDATION_NAMES.map((name, i) => ({ name, rate: parseFloat(sedationRates[i] || "") })).filter(s => s.rate > 0);
    if (activeSedation.length) {
      neuroItems.push(`Perfusões sedoanalgesia: ${activeSedation.map(s => `${s.name} ${s.rate} mL/h`).join(" · ")}`);
    }

    addSection(lines, "NEUROLÓGICO", neuroItems);

    // ═══════════════════════════════════════
    // 3. VENTILATÓRIO
    // ═══════════════════════════════════════
    const ventItems: string[] = [];
    const ventMode = readLS<string | null>("vent-mode", null);
    if (ventMode) {
      const modeLabel = ventMode === "invasiva" ? "VM Invasiva" : ventMode === "vni" ? "VNI" : "ONAF";
      ventItems.push(`Suporte: ${modeLabel}`);
    }
    // ABG
    const ph = readLS("vent-ph", "");
    const paco2 = readLS("vent-paco2", "");
    const hco3 = readLS("vent-hco3", "");
    const be = readLS("vent-be", "");
    if (ph || paco2 || hco3) {
      const abgParts: string[] = [];
      if (ph) abgParts.push(`pH ${ph}`);
      if (paco2) abgParts.push(`PaCO₂ ${paco2}`);
      if (hco3) abgParts.push(`HCO₃⁻ ${hco3}`);
      if (be) abgParts.push(`BE ${be}`);
      ventItems.push(`GSA: ${abgParts.join(" · ")}`);
    }
    if (pao2) ventItems.push(`PaO₂: ${pao2} mmHg`);
    if (fio2) ventItems.push(`FiO₂: ${fio2}%`);
    if (pfRatio !== null) {
      const severity = pfRatio >= 400 ? "Normal" : pfRatio >= 300 ? "Leve ↓" : pfRatio >= 200 ? "SDRA Leve" : pfRatio >= 100 ? "SDRA Moderada" : "SDRA Grave";
      ventItems.push(`P/F: ${pfRatio.toFixed(0)} — ${severity}`);
    }
    // Invasive params
    if (ventMode === "invasiva") {
      const peep = readLS("vent-peep", "");
      const pPlat = readLS("vent-pPlat", "");
      const pipV = readLS("vent-pip", "");
      const vt = readLS("vent-vt", "");
      const fr = readLS("vent-fr", "");
      const spo2 = readLS("vent-spo2", "");
      const p01 = readLS("vent-p01", "");
      const paramParts: string[] = [];
      if (peep) paramParts.push(`PEEP ${peep}`);
      if (pPlat) paramParts.push(`Platô ${pPlat}`);
      if (pipV) paramParts.push(`PIP ${pipV}`);
      if (paramParts.length) ventItems.push(`Pressões: ${paramParts.join(" · ")} cmH₂O`);
      if (vt) {
        let vtStr = `Vt: ${vt} mL`;
        if (pesoIdeal) vtStr += ` (${(parseFloat(vt) / pesoIdeal).toFixed(1)} mL/kg PBW)`;
        ventItems.push(vtStr);
      }
      if (fr) ventItems.push(`FR: ${fr} cpm`);
      if (spo2) ventItems.push(`SpO₂: ${spo2}%`);
      if (p01) ventItems.push(`P0.1: ${p01} cmH₂O`);
      // Driving pressure & compliance
      const peepV = parseFloat(peep);
      const pPlatV = parseFloat(pPlat);
      const vtV = parseFloat(vt);
      if (pPlatV && peepV) {
        const dp = pPlatV - peepV;
        ventItems.push(`Driving Pressure: ${dp} cmH₂O${dp > 15 ? " ⚠️" : ""}`);
        if (vtV && dp > 0) ventItems.push(`Complacência: ${(vtV / dp).toFixed(0)} mL/cmH₂O`);
      }
      // Tobin
      const frV = parseFloat(fr);
      if (frV && vtV) {
        const tobin = frV / (vtV / 1000);
        ventItems.push(`RSBI (Tobin): ${tobin.toFixed(0)} irpm/L${tobin > 105 ? " — Falha provável" : tobin <= 80 ? " — Favorável" : ""}`);
      }
      // PEEP method
      const peepMethod = readLS<string>("vent-peep-method", "ardsnet");
      const methodLabels: Record<string, string> = { ardsnet: "Tabela ARDSNet", vptool: "V/P Tool", esophageal: "Balão Transesofágico", eit: "EIT", echo: "Eco Pulmonar", dp: "Driving Pressure" };
      if (peep) ventItems.push(`Titulação PEEP: ${methodLabels[peepMethod] || peepMethod}`);
    }
    // VNI
    if (ventMode === "vni") {
      const vniSub = readLS<string>("vent-vniSub", "bipap");
      if (vniSub === "cpap") {
        const cpap = readLS("vent-cpap", "");
        if (cpap) ventItems.push(`CPAP: ${cpap} cmH₂O`);
      } else {
        const ipap = readLS("vent-ipap", "");
        const epap = readLS("vent-epap", "");
        if (ipap && epap) ventItems.push(`BiPAP: IPAP ${ipap} / EPAP ${epap} cmH₂O (PS ${parseFloat(ipap) - parseFloat(epap)})`);
      }
      const vniFr = readLS("vent-vniFr", "");
      const vniSpo2 = readLS("vent-vniSpo2", "");
      if (vniFr) ventItems.push(`FR: ${vniFr} cpm`);
      if (vniSpo2) ventItems.push(`SpO₂: ${vniSpo2}%`);
    }
    // ONAF
    if (ventMode === "onaf") {
      const onafFlow = readLS("vent-onafFlow", "");
      const onafFr = readLS("vent-onafFr", "");
      const onafSpo2 = readLS("vent-onafSpo2", "");
      if (onafFlow) ventItems.push(`Fluxo ONAF: ${onafFlow} L/min`);
      if (onafFr) ventItems.push(`FR: ${onafFr} cpm`);
      if (onafSpo2) ventItems.push(`SpO₂: ${onafSpo2}%`);
    }
    if (ecmoType) ventItems.push(`ECMO: ${ecmoType}`);
    ventItems.push(...getExamFindings("vent"));
    addSection(lines, "VENTILATÓRIO", ventItems);

    // ═══════════════════════════════════════
    // 4. CARDIOVASCULAR
    // ═══════════════════════════════════════
    const cvItems: string[] = [];
    const fc = readLS("cardio-fc", "");
    const pas = readLS("cardio-pas", "");
    const pad = readLS("cardio-pad", "");
    if (fc) cvItems.push(`FC: ${fc} bpm`);
    if (pas && pad) {
      const pamCalc = (parseFloat(pas) + 2 * parseFloat(pad)) / 3;
      cvItems.push(`PA: ${pas}/${pad} mmHg (PAM ${pamCalc.toFixed(0)})`);
    } else if (pamCardio) {
      cvItems.push(`PAM: ${pamCardio} mmHg`);
    }
    if (lactato) {
      const lac = parseFloat(lactato);
      const lacStatus = lac > 4 ? "↑↑ Grave" : lac > 2 ? "↑ Elevado" : "Normal";
      cvItems.push(`Lactato: ${lactato} mmol/L — ${lacStatus}`);
    }
    const shockType = readLS("cardio-shockType", "");
    if (shockType) {
      const shockLabels: Record<string, string> = { septico: "Séptico", cardiogenico: "Cardiogénico", hipovolemico: "Hipovolémico", obstrutivo: "Obstrutivo" };
      cvItems.push(`Tipo de Choque: ${shockLabels[shockType] || shockType}`);
    }
    const scaiStage = readLS("cardio-scaiStage", "");
    if (scaiStage) cvItems.push(`SCAI: Estádio ${scaiStage}`);
    const hemClass = readLS("cardio-hemClass", "");
    if (hemClass) cvItems.push(`Classe Hemorrágica: ${hemClass}`);
    // Echo LV
    const lvef = readLS("cardio-lvef", "");
    const lvotD = readLS("cardio-lvotD", "");
    const lvotVTI = readLS("cardio-lvotVTI", "");
    if (lvef) cvItems.push(`FEVE: ${lvef}%`);
    if (lvotD && lvotVTI && fc) {
      const area = Math.PI * Math.pow(parseFloat(lvotD) / 2, 2);
      const sv = area * parseFloat(lvotVTI);
      const co = (sv * parseFloat(fc)) / 1000;
      cvItems.push(`DC (eco): ${co.toFixed(1)} L/min · VS: ${sv.toFixed(0)} mL`);
    }
    // Diastolic
    const eWave = readLS("cardio-eWave", "");
    const ePrime = readLS("cardio-ePrime", "");
    if (eWave && ePrime) {
      const eeP = parseFloat(eWave) / parseFloat(ePrime);
      cvItems.push(`E/e': ${eeP.toFixed(1)}${eeP > 14 ? " — ↑ Pressões enchimento" : ""}`);
    }
    // RV
    const tapse = readLS("cardio-tapse", "");
    if (tapse) cvItems.push(`TAPSE: ${tapse} mm${parseFloat(tapse) < 17 ? " — Disfunção VD" : ""}`);
    const sTric = readLS("cardio-sTric", "");
    if (sTric) cvItems.push(`S' Tricúspide: ${sTric} cm/s`);
    // ECMO params
    if (ecmoType) {
      const ecmoParams = readLS<any>("ecmoParams", {});
      if (ecmoType === "VV") {
        const parts: string[] = [];
        if (ecmoParams.diagnosis) parts.push(`Dx: ${ecmoParams.diagnosis}`);
        if (ecmoParams.mvDays) parts.push(`VM pré: ${ecmoParams.mvDays}d`);
        if (parts.length) cvItems.push(`ECMO VV: ${parts.join(" · ")}`);
      }
    }
    cvItems.push(...getExamFindings("cardio"));

    // Vasopressors
    const VASO_NAMES = ["Noradrenalina", "Vasopressina", "Dobutamina", "Adrenalina", "Milrinona", "Labetalol"];
    const vasoRates = readLS<string[]>("cardio-vasoRates", []);
    const activeVaso = VASO_NAMES.map((name, i) => ({ name, rate: parseFloat(vasoRates[i] || "") })).filter(v => v.rate > 0);
    if (activeVaso.length) {
      cvItems.push(`Vasopressores: ${activeVaso.map(v => `${v.name} ${v.rate} mL/h`).join(" · ")}`);
    }

    addSection(lines, "CARDIOVASCULAR", cvItems);

    // ═══════════════════════════════════════
    // 5. RENAL
    // ═══════════════════════════════════════
    const renalItems: string[] = [];
    if (creatinina) renalItems.push(`Creatinina: ${creatinina} mg/dL`);
    if (creatininaBasal) renalItems.push(`Cr Basal: ${creatininaBasal} mg/dL`);
    if (clCr !== null) renalItems.push(`ClCr: ${clCr.toFixed(1)} mL/min — ${clCrStage}`);
    if (akiStage) renalItems.push(`AKI: ${akiStage}`);
    if (onRRT) renalItems.push(`TSFR: ${rrtType}`);
    const urine24h = readLS("renal-urine24h", "");
    if (urine24h) {
      const peso = parseFloat(pesoAtual) || 0;
      const perH = parseFloat(urine24h) / 24;
      let urineStr = `Diurese 24h: ${urine24h} mL (${perH.toFixed(0)} mL/h`;
      if (peso) urineStr += ` · ${(perH / peso).toFixed(2)} mL/kg/h`;
      urineStr += ")";
      renalItems.push(urineStr);
    }
    // RRT params
    if (onRRT) {
      const qb = readLS("renal-qb", "");
      const qd = readLS("renal-qd", "");
      const qpre = readLS("renal-qpre", "");
      const qpost = readLS("renal-qpost", "");
      const uf = readLS("renal-uf", "");
      const parts: string[] = [];
      if (qb) parts.push(`Qb ${qb}`);
      if (qd) parts.push(`Qd ${qd}`);
      if (qpre) parts.push(`Qpre ${qpre}`);
      if (qpost) parts.push(`Qpost ${qpost}`);
      if (uf) parts.push(`UF ${uf}`);
      if (parts.length) renalItems.push(`TSFR params: ${parts.join(" · ")} mL/h`);
      // Effluent dose
      const total = (parseFloat(qd) || 0) + (parseFloat(qpre) || 0) + (parseFloat(qpost) || 0) + (parseFloat(uf) || 0);
      const peso = parseFloat(pesoAtual) || 0;
      if (total && peso) renalItems.push(`Dose efluente: ${(total / peso).toFixed(1)} mL/kg/h`);
      // Citrate
      const caPost = readLS("renal-caPost", "");
      const caTotal = readLS("renal-caTotal", "");
      const caIon = readLS("renal-caIon", "");
      if (caPost) renalItems.push(`Ca²⁺ pós-filtro: ${caPost} mmol/L`);
      if (caTotal && caIon) {
        const ratio = parseFloat(caTotal) / parseFloat(caIon);
        renalItems.push(`Rácio Ca total/ionizado: ${ratio.toFixed(2)}${ratio > 2.5 ? " ⚠️ toxicidade citrato" : ""}`);
      }
    }
    renalItems.push(...getExamFindings("renal"));

    // Fluid balance
    const fluidEntries = ["cristaloides", "coloides", "hemoderivados", "nutricao", "medicacao", "outrasEntradas"];
    const fluidExits = ["diurese", "drenos", "perdasGI", "uf", "insensiveis", "outrasSaidas"];
    const totalIn = fluidEntries.reduce((s, k) => s + (parseFloat(readLS(`fluid-${k}`, "")) || 0), 0);
    const totalOut = fluidExits.reduce((s, k) => s + (parseFloat(readLS(`fluid-${k}`, "")) || 0), 0);
    if (totalIn > 0 || totalOut > 0) {
      const bal = totalIn - totalOut;
      renalItems.push(`Balanço Hídrico: Entradas ${totalIn.toFixed(0)} · Saídas ${totalOut.toFixed(0)} · Balanço ${bal >= 0 ? "+" : ""}${bal.toFixed(0)} mL`);
    }

    addSection(lines, "RENAL", renalItems);

    // ═══════════════════════════════════════
    // 6. DIGESTIVO / HEPÁTICO / NUTRIÇÃO
    // ═══════════════════════════════════════
    const digestItems: string[] = [];
    if (bilirrubina) digestItems.push(`Bilirrubina: ${bilirrubina} mg/dL`);
    if (albumina) digestItems.push(`Albumina: ${albumina} g/dL`);
    // SAAG
    const albSoro = readLS("digest-albSoro", "");
    const albAscite = readLS("digest-albAscite", "");
    if (albSoro && albAscite) {
      const saag = parseFloat(albSoro) - parseFloat(albAscite);
      digestItems.push(`SAAG: ${saag.toFixed(1)} g/dL${saag >= 1.1 ? " (HT Portal)" : " (Não HT Portal)"}`);
    }
    // Nutrition
    const metaCal = readLS("digest-metaCal", "25");
    const metaProt = readLS("digest-metaProt", "1.5");
    const enteralRate = readLS("digest-enteralRate", "");
    const enteralHours = readLS("digest-enteralHours", "24");
    if (enteralRate && parseFloat(enteralRate) > 0) {
      const vol = parseFloat(enteralRate) * (parseFloat(enteralHours) || 24);
      digestItems.push(`Nutrição Enteral: ${enteralRate} mL/h × ${enteralHours}h = ${vol.toFixed(0)} mL/dia`);
      digestItems.push(`Metas: ${metaCal} kcal/kg/dia · ${metaProt} g prot/kg/dia`);
    }
    digestItems.push(...getExamFindings("digest"));
    addSection(lines, "DIGESTIVO / NUTRIÇÃO", digestItems);

    // ═══════════════════════════════════════
    // 7. HEMATOLÓGICO
    // ═══════════════════════════════════════
    const hematoItems: string[] = [];
    if (plaquetas) hematoItems.push(`Plaquetas: ${plaquetas} ×10³/µL`);
    if (inr) hematoItems.push(`INR: ${inr}`);
    const hematoMode = readLS<string>("hemato-mode", "profilatica");
    const antiXa = readLS("hemato-antiXa", "");
    const aptt = readLS("hemato-aptt", "");
    if (hematoMode === "terapeutica") hematoItems.push(`Anticoagulação: Terapêutica`);
    if (antiXa) hematoItems.push(`Anti-Xa: ${antiXa} UI/mL`);
    if (aptt) hematoItems.push(`aPTT: ${aptt} seg`);
    hematoItems.push(...getExamFindings("hemato"));
    addSection(lines, "HEMATOLÓGICO", hematoItems);

    // ═══════════════════════════════════════
    // 8. INFEÇÃO
    // ═══════════════════════════════════════
    const infecItems: string[] = [];
    const activeInfections = readLS<{id:string;agent:string;location:string;type:string;sensitivity:string;antibiotic:string;startDate:string;notes:string}[]>("infecao-activeInfections", []);
    const regInfections = activeInfections.filter(i => i.type === "infection");
    const regColonizations = activeInfections.filter(i => i.type === "colonization");
    if (regInfections.length) {
      infecItems.push("Infeções Ativas:");
      regInfections.forEach(inf => {
        let line = `  • ${inf.agent || "Agente ?"} — ${inf.location || "Local ?"}`;
        if (inf.antibiotic) line += ` | ATB: ${inf.antibiotic}`;
        if (inf.startDate) line += ` (${inf.startDate})`;
        if (inf.sensitivity) line += ` | TSA: ${inf.sensitivity}`;
        infecItems.push(line);
        if (inf.notes) infecItems.push(`    ↳ ${inf.notes}`);
      });
    }
    if (regColonizations.length) {
      infecItems.push("Colonizações Identificadas:");
      regColonizations.forEach(inf => {
        let line = `  • ${inf.agent || "Agente ?"} — ${inf.location || "Local ?"}`;
        if (inf.sensitivity) line += ` | TSA: ${inf.sensitivity}`;
        infecItems.push(line);
        if (inf.notes) infecItems.push(`    ↳ ${inf.notes}`);
      });
    }
    // MDR profiles
    const colonizations = readLS<string[]>("infecao-colonizations", []);
    if (colonizations.length) {
      infecItems.push(`Perfis MDR: ${colonizations.map(id => MDR_NAMES[id] || id).join(", ")}`);
    }
    const infectionSite = readLS<string | null>("infecao-site", null);
    if (infectionSite) infecItems.push(`Foco empírico: ${infectionSite}`);
    infecItems.push(...getExamFindings("infecao"));
    addSection(lines, "INFEÇÃO", infecItems);

    // ═══════════════════════════════════════
    // 9. SCORES PROGNÓSTICOS
    // ═══════════════════════════════════════
    const progItems: string[] = [];
    const sofaScores = readLS<number[]>("prog-sofa", [0, 0, 0, 0, 0, 0]);
    const sofaTotal = sofaScores.reduce((a, b) => a + b, 0);
    if (sofaTotal > 0) {
      const detail = sofaScores.map((s, i) => `${SOFA_CAT_NAMES[i]}:${s}`).join(" · ");
      const mort = sofaTotal <= 1 ? "<5%" : sofaTotal <= 3 ? "~5%" : sofaTotal <= 6 ? "~10%" : sofaTotal <= 9 ? "15–20%" : sofaTotal <= 12 ? "40–50%" : sofaTotal <= 14 ? "50–60%" : ">80%";
      progItems.push(`SOFA: ${sofaTotal} (mort ~${mort}) → ${detail}`);
    }
    // Child-Pugh
    const cpBili = readLS("prog-cpBili", 1);
    const cpAlb = readLS("prog-cpAlb", 1);
    const cpInr = readLS("prog-cpInr", 1);
    const cpAscites = readLS("prog-cpAscites", 1);
    const cpEncef = readLS("prog-cpEncef", 1);
    const cpTotal = cpBili + cpAlb + cpInr + cpAscites + cpEncef;
    if (cpTotal > 5) {
      const cpClass = cpTotal <= 6 ? "A" : cpTotal <= 9 ? "B" : "C";
      progItems.push(`Child-Pugh: ${cpTotal} (Classe ${cpClass})`);
    }
    // MELD
    const biliV = parseFloat(bilirrubina) || 0;
    const crV = parseFloat(creatinina) || 0;
    const inrV = parseFloat(inr) || 0;
    if (biliV || crV || inrV) {
      const b = Math.max(biliV || 1, 1);
      const c = Math.max(crV || 1, 1);
      const i2 = Math.max(inrV || 1, 1);
      const meld = Math.round(Math.min(40, Math.max(6, 3.78 * Math.log(b) + 11.2 * Math.log(i2) + 9.57 * Math.log(c) + 6.43)));
      if (meld > 6) progItems.push(`MELD: ${meld}`);
    }
    addSection(lines, "PROGNÓSTICO", progItems);

    // ═══════════════════════════════════════
    // 10. CHECKLIST
    // ═══════════════════════════════════════
    const checkItems: string[] = [];
    const fastHugs = readLS<Record<string, boolean>>("final-FAST HUGS BID", {});
    const fastDone = Object.values(fastHugs).filter(Boolean).length;
    if (fastDone > 0) {
      const missing = Object.entries(fastHugs).filter(([, v]) => !v).map(([k]) => k);
      checkItems.push(`FAST HUGS BID: ${fastDone}/11${missing.length > 0 && missing.length <= 4 ? ` (falta: ${missing.join(", ")})` : ""}`);
    }
    const abcdef = readLS<Record<string, boolean>>("final-ABCDEF Bundle", {});
    const abcDone = Object.values(abcdef).filter(Boolean).length;
    if (abcDone > 0) {
      const missing = Object.entries(abcdef).filter(([, v]) => !v).map(([k]) => k);
      checkItems.push(`ABCDEF Bundle: ${abcDone}/6${missing.length > 0 && missing.length <= 3 ? ` (falta: ${missing.join(", ")})` : ""}`);
    }
    // ═══════════════════════════════════════
    // TIMERS
    // ═══════════════════════════════════════
    const timerItems: string[] = [];
    const timers = readLS<Record<string, { startTime: number | null; running: boolean }>>("clinical-timers", {});
    const TIMER_LABELS: Record<string, string> = { pronacao: "Pronação", "atb-reav": "Reavaliação ATB", cvc: "CVC", la: "Linha Arterial", algalia: "Algália", sedacao: "Despertar Diário" };
    Object.entries(timers).forEach(([id, state]) => {
      if (state.startTime && state.running) {
        const elapsed = (Date.now() - state.startTime) / 3600000;
        timerItems.push(`${TIMER_LABELS[id] || id}: ${elapsed.toFixed(1)}h em curso`);
      }
    });
    addSection(lines, "TIMERS", timerItems);

    addSection(lines, "CHECKLIST", checkItems);

    lines.push("");
    lines.push(`──────────────────────────────`);
    lines.push(`⚠️ Ferramenta de apoio. Validar todos os valores.`);

    return lines.join("\n");
  }, [
    pesoAtual, altura, idade, sexo, pesoIdeal, pesoAjustado, pesoReferencia, imc,
    weightReference, creatinina, creatininaBasal, albumina, onRRT, rrtType,
    plaquetas, bilirrubina, inr, lactato,
    pao2, fio2, pfRatio, pamCardio,
    clCr, clCrStage, akiStage, ecmoType,
  ]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = summary;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePDF = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Diário Clínico UCI</title>
<style>
  body { font-family: 'Courier New', monospace; font-size: 11px; padding: 20mm; line-height: 1.6; white-space: pre-wrap; color: #000; }
  @media print { body { padding: 10mm; } }
</style></head><body>${summary.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 300);
  };

  return (
    <div id="patient-summary-export" className="calc-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <ClipboardCheck className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Diário Clínico — Passagem de Turno</h3>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={handlePDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all bg-muted text-foreground border border-border hover:bg-muted/80"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF
          </button>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              copied
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
      </div>

      <pre className="bg-muted/50 rounded-lg p-3 border border-border text-[10px] font-mono text-foreground whitespace-pre-wrap overflow-x-auto max-h-[400px] overflow-y-auto leading-relaxed">
        {summary}
      </pre>
    </div>
  );
};

export default PatientSummaryExport;
