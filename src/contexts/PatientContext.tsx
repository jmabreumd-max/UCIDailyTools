import { createContext, useContext, useState, useMemo, useEffect, useCallback, ReactNode } from "react";
import { clearAllPersistedState } from "@/hooks/usePersistedState";
import { useEventLog } from "@/contexts/EventLogContext";

interface PatientContextType {
  pesoAtual: string; setPesoAtual: (v: string) => void;
  altura: string; setAltura: (v: string) => void;
  idade: string; setIdade: (v: string) => void;
  sexo: "" | "M" | "F"; setSexo: (v: "" | "M" | "F") => void;
  creatinina: string; setCreatinina: (v: string) => void;
  creatininaBasal: string; setCreatininaBasal: (v: string) => void;
  albumina: string; setAlbumina: (v: string) => void;
  onRRT: boolean; setOnRRT: (v: boolean) => void;
  rrtType: string; setRrtType: (v: string) => void;
  propofolRateMlH: string; setPropofolRateMlH: (v: string) => void;
  weightReference: "atual" | "ideal" | "ajustado"; setWeightReference: (v: "atual" | "ideal" | "ajustado") => void;
  // Hematologia
  hemoglobina: string; setHemoglobina: (v: string) => void;
  plaquetas: string; setPlaquetas: (v: string) => void;
  inr: string; setInr: (v: string) => void;
  
  // Bioquímica
  creatinina: string; setCreatinina: (v: string) => void;
  creatininaBasal: string; setCreatininaBasal: (v: string) => void;
  ureia: string; setUreia: (v: string) => void;
  sodio: string; setSodio: (v: string) => void;
  potassio: string; setPotassio: (v: string) => void;
  cloro: string; setCloro: (v: string) => void;
  calcioTotal: string; setCalcioTotal: (v: string) => void;
  magnesio: string; setMagnesio: (v: string) => void;
  fosforo: string; setFosforo: (v: string) => void;
  glicemia: string; setGlicemia: (v: string) => void;
  albumina: string; setAlbumina: (v: string) => void;
  bilirrubina: string; setBilirrubina: (v: string) => void;
  
  // Gasimetria e Respiratório
  ph: string; setPh: (v: string) => void;
  pco2: string; setPco2: (v: string) => void;
  pao2: string; setPao2: (v: string) => void;
  fio2: string; setFio2: (v: string) => void;
  hco3: string; setHco3: (v: string) => void;
  lactato: string; setLactato: (v: string) => void;
  // ECMO
  ecmoType: "" | "VV" | "VA"; setEcmoType: (v: "" | "VV" | "VA") => void;
  ecmoParams: EcmoParams; setEcmoParams: (v: EcmoParams) => void;
  // Shared derived values synced from tabs
  gcsTotal: number; setGcsTotal: (v: number) => void;
  pamCardio: string; setPamCardio: (v: string) => void;
  // Computed
  pesoIdeal: number | null;
  pesoAjustado: number | null;
  pesoReferencia: number | null;
  imc: number | null;
  clCr: number | null;
  clCrStage: string | null;
  akiStage: string | null;
  pfRatio: number | null;
  clearPatient: () => void;
}

export interface EcmoParams {
  // VV ECMO - RESP/PRESERVE
  diagnosis: string;
  mvDays: string;
  peep: string;
  pip: string;
  immunocompromised: boolean;
  cnsFailure: boolean;
  acuteNonPulm: boolean;
  nmba: boolean;
  no: boolean;
  hco3Infusion: boolean;
  cardiacArrest: boolean;
  paco2: string;
  // VA ECMO - SAVE
  diastolicBP: string;
  pulsePresure: string;
  hco3: string;
  peakInspPressure: string;
  intubationHours: string;
  acuteOrganFailure: number;
  myocarditis: boolean;
  refractoryVT: boolean;
  postTransplant: boolean;
  congenitalHD: boolean;
}

const defaultEcmoParams: EcmoParams = {
  diagnosis: "",
  mvDays: "",
  peep: "",
  pip: "",
  immunocompromised: false,
  cnsFailure: false,
  acuteNonPulm: false,
  nmba: false,
  no: false,
  hco3Infusion: false,
  cardiacArrest: false,
  paco2: "",
  diastolicBP: "",
  pulsePresure: "",
  hco3: "",
  peakInspPressure: "",
  intubationHours: "",
  acuteOrganFailure: 0,
  myocarditis: false,
  refractoryVT: false,
  postTransplant: false,
  congenitalHD: false,
};

const PatientContext = createContext<PatientContextType | null>(null);

export const usePatient = () => {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error("usePatient must be used within PatientProvider");
  return ctx;
};

const LS_KEY = "icu-manager-patient";

function loadFromLS() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  const saved = loadFromLS();
  const { addLog } = useEventLog();

  const [pesoAtual, setPesoAtual] = useState(saved?.pesoAtual ?? "");
  const [altura, setAltura] = useState(saved?.altura ?? "");
  const [idade, setIdade] = useState(saved?.idade ?? "");
  const [sexo, setSexo] = useState<"" | "M" | "F">(saved?.sexo ?? "");
  const [onRRT, setOnRRT] = useState(saved?.onRRT ?? false);
  const [rrtType, setRrtType] = useState(saved?.rrtType ?? "CVVHDF");
  const [propofolRateMlH, setPropofolRateMlH] = useState(saved?.propofolRateMlH ?? "");
  const [weightReference, setWeightReference] = useState<"atual" | "ideal" | "ajustado">(saved?.weightReference ?? "ideal");

  // Hematologia
  const [hemoglobina, setHemoglobina] = useState(saved?.hemoglobina ?? "");
  const [plaquetas, setPlaquetas] = useState(saved?.plaquetas ?? "");
  const [inr, setInr] = useState(saved?.inr ?? "");

  // Bioquímica
  const [creatinina, setCreatinina] = useState(saved?.creatinina ?? "");
  const [creatininaBasal, setCreatininaBasal] = useState(saved?.creatininaBasal ?? "");
  const [ureia, setUreia] = useState(saved?.ureia ?? "");
  const [sodio, setSodio] = useState(saved?.sodio ?? "");
  const [potassio, setPotassio] = useState(saved?.potassio ?? "");
  const [cloro, setCloro] = useState(saved?.cloro ?? "");
  const [calcioTotal, setCalcioTotal] = useState(saved?.calcioTotal ?? "");
  const [magnesio, setMagnesio] = useState(saved?.magnesio ?? "");
  const [fosforo, setFosforo] = useState(saved?.fosforo ?? "");
  const [glicemia, setGlicemia] = useState(saved?.glicemia ?? "");
  const [albumina, setAlbumina] = useState(saved?.albumina ?? "");
  const [bilirrubina, setBilirrubina] = useState(saved?.bilirrubina ?? "");

  // Gasimetria e Respiratório
  const [ph, setPh] = useState(saved?.ph ?? "");
  const [pco2, setPco2] = useState(saved?.pco2 ?? "");
  const [pao2, setPao2] = useState(saved?.pao2 ?? "");
  const [fio2, setFio2] = useState(saved?.fio2 ?? "");
  const [hco3, setHco3] = useState(saved?.hco3 ?? "");
  const [lactato, setLactato] = useState(saved?.lactato ?? "");

  // ECMO
  const [ecmoType, setEcmoType] = useState<"" | "VV" | "VA">(saved?.ecmoType ?? "");
  const [ecmoParams, setEcmoParams] = useState<EcmoParams>(saved?.ecmoParams ?? defaultEcmoParams);

  // Shared derived
  const [gcsTotal, setGcsTotal] = useState(saved?.gcsTotal ?? 0);
  const [pamCardio, setPamCardio] = useState(saved?.pamCardio ?? "");

  const pesoIdeal = useMemo(() => {
    const h = parseFloat(altura);
    if (!h || h < 100 || h > 250 || !sexo) return null;
    return sexo === "M" ? 50 + 0.91 * (h - 152.4) : 45.5 + 0.91 * (h - 152.4);
  }, [altura, sexo]);

  const imc = useMemo(() => {
    const p = parseFloat(pesoAtual);
    const h = parseFloat(altura);
    if (!p || !h) return null;
    return p / ((h / 100) ** 2);
  }, [pesoAtual, altura]);

  const pesoAjustado = useMemo(() => {
    const pa = parseFloat(pesoAtual);
    if (!pesoIdeal || !pa) return null;
    return pesoIdeal + 0.4 * (pa - pesoIdeal);
  }, [pesoIdeal, pesoAtual]);

  const pesoReferencia = useMemo(() => {
    const pa = parseFloat(pesoAtual) || null;
    if (weightReference === "atual") return pa;
    if (weightReference === "ajustado") return pesoAjustado;
    return pesoIdeal;
  }, [weightReference, pesoAtual, pesoIdeal, pesoAjustado]);

  const clCr = useMemo(() => {
    const i = parseFloat(idade);
    const p = parseFloat(pesoAtual);
    const cr = parseFloat(creatinina);
    if (!i || !p || !cr || cr <= 0) return null;
    const base = ((140 - i) * p) / (72 * cr);
    return sexo === "F" ? base * 0.85 : base;
  }, [idade, pesoAtual, creatinina, sexo]);

  const clCrStage = useMemo(() => {
    if (onRRT) return "Em TSFR";
    if (clCr === null) return null;
    if (clCr >= 90) return "G1 (Normal)";
    if (clCr >= 60) return "G2 (Leve)";
    if (clCr >= 30) return "G3 (Moderada)";
    if (clCr >= 15) return "G4 (Grave)";
    return "G5 (Falência)";
  }, [clCr, onRRT]);

  const akiStage = useMemo(() => {
    const crAtual = parseFloat(creatinina);
    const crBasal = parseFloat(creatininaBasal);
    if (!crAtual || !crBasal || crBasal <= 0) return null;
    const ratio = crAtual / crBasal;
    const delta = crAtual - crBasal;
    if (ratio >= 3 || crAtual >= 4.0) return "AKIN 3 — LRA grave. Considerar TSFR.";
    if (ratio >= 2) return "AKIN 2 — LRA moderada. Evitar nefrotóxicos.";
    if (ratio >= 1.5 || delta >= 0.3) return "AKIN 1 — LRA ligeira. Monitorizar.";
    return "Sem critério AKIN — Sem LRA.";
  }, [creatinina, creatininaBasal]);

  const pfRatio = useMemo(() => {
    const p = parseFloat(pao2);
    const f = parseFloat(fio2);
    if (!p || !f) return null;
    return p / (f > 1 ? f / 100 : f);
  }, [pao2, fio2]);

  const clearPatient = useCallback(() => {
    setPesoAtual(""); setAltura(""); setIdade(""); setSexo("");
    setCreatinina(""); setCreatininaBasal(""); setAlbumina(""); setOnRRT(false); setRrtType("CVVHDF");
    setPropofolRateMlH(""); setWeightReference("ideal");
    
    setHemoglobina(""); setPlaquetas(""); setInr("");
    setUreia(""); setSodio(""); setPotassio(""); setCloro("");
    setCalcioTotal(""); setMagnesio(""); setFosforo(""); setGlicemia(""); setBilirrubina("");
    
    setPh(""); setPco2(""); setHco3(""); setPao2(""); setFio2(""); setLactato("");
    
    setEcmoType(""); setEcmoParams(defaultEcmoParams);
    setGcsTotal(0); setPamCardio("");
    localStorage.removeItem(LS_KEY);
    clearAllPersistedState();
    
    // Attempt to log but handle error if context is not yet fully available
    try {
      addLog("ACTION", "Dados do doente apagados", "Iniciado um novo doente.");
    } catch { /* ignore */ }
  }, [addLog]);

  useEffect(() => {
    const data = {
      pesoAtual, altura, idade, sexo, creatinina, creatininaBasal, albumina,
      onRRT, rrtType, propofolRateMlH, weightReference,
      
      hemoglobina, plaquetas, inr,
      ureia, sodio, potassio, cloro, calcioTotal, magnesio, fosforo, glicemia, bilirrubina,
      ph, pco2, pao2, fio2, hco3, lactato,
      
      ecmoType, ecmoParams,
      gcsTotal, pamCardio,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }, [
    pesoAtual, altura, idade, sexo, creatinina, creatininaBasal, albumina,
    onRRT, rrtType, propofolRateMlH, weightReference,
    hemoglobina, plaquetas, inr,
    ureia, sodio, potassio, cloro, calcioTotal, magnesio, fosforo, glicemia, bilirrubina,
    ph, pco2, pao2, fio2, hco3, lactato,
    ecmoType, ecmoParams,
    gcsTotal, pamCardio
  ]);

  return (
    <PatientContext.Provider value={{
      pesoAtual, setPesoAtual, altura, setAltura, idade, setIdade, sexo, setSexo,
      creatinina, setCreatinina, creatininaBasal, setCreatininaBasal,
      albumina, setAlbumina, onRRT, setOnRRT, rrtType, setRrtType,
      propofolRateMlH, setPropofolRateMlH, weightReference, setWeightReference,
      
      hemoglobina, setHemoglobina, plaquetas, setPlaquetas, inr, setInr,
      ureia, setUreia, sodio, setSodio, potassio, setPotassio, cloro, setCloro,
      calcioTotal, setCalcioTotal, magnesio, setMagnesio, fosforo, setFosforo,
      glicemia, setGlicemia, bilirrubina, setBilirrubina,
      ph, setPh, pco2, setPco2, pao2, setPao2, fio2, setFio2, hco3, setHco3, lactato, setLactato,
      
      ecmoType, setEcmoType, ecmoParams, setEcmoParams,
      gcsTotal, setGcsTotal, pamCardio, setPamCardio,
      pesoIdeal, pesoAjustado, pesoReferencia, imc, clCr, clCrStage, akiStage, pfRatio, clearPatient,
    }}>
      {children}
    </PatientContext.Provider>
  );
};
