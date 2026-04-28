import { useState, useMemo } from "react";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { Droplets } from "lucide-react";
import { z } from "zod";

export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

const GlicoseCorrigidaCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const [glicose, setGlicose] = useState(defaultValues?.glicose || "");
  const [sodio, setSodio] = useState(defaultValues?.sodio || "");

  const naCorrResult = useMemo(() => {
    const gli = parseFloat(glicose);
    const na = parseFloat(sodio);
    if (!gli || !na) return null;
    const naCorr = na + 1.6 * ((gli - 100) / 100);
    return naCorr.toFixed(1);
  }, [glicose, sodio]);

  const deltaOsm = useMemo(() => {
    const gli = parseFloat(glicose);
    if (!gli) return null;
    return (gli / 18).toFixed(1);
  }, [glicose]);

  const status = useMemo(() => {
    if (!naCorrResult) return undefined;
    const r = parseFloat(naCorrResult);
    if (r < 135) return "warning" as const;
    if (r > 145) return "danger" as const;
    return "normal" as const;
  }, [naCorrResult]);

  const interpretation = useMemo(() => {
    const gli = parseFloat(glicose);
    const naCorr = naCorrResult ? parseFloat(naCorrResult) : null;
    if (!gli || !naCorr) return null;
    let text = "";
    if (naCorr < 135) text = `Na⁺ corrigido ${naCorr} — hiponatremia verdadeira (dilucional pela hiperglicemia + déficit real de Na⁺). `;
    else if (naCorr > 145) text = `Na⁺ corrigido ${naCorr} — hipernatremia. Há déficit de água livre mesmo com hiperglicemia. `;
    else text = `Na⁺ corrigido normal (${naCorr}). A hiponatremia é puramente dilucional pela hiperglicemia. `;
    if (gli > 250) text += "⚠️ Hiperglicemia grave — investigar cetoacidose diabética ou EHH. Corrigir glicemia e reavaliar Na⁺.";
    else if (gli > 180) text += "Hiperglicemia — considerar insulina. O Na⁺ tende a normalizar com correção da glicemia.";
    return text;
  }, [glicose, naCorrResult]);

  return (
    <CalculatorCard
      title="Correção Na⁺ pela Glicose"
      icon={<Droplets className="w-4 h-4" />}
      formula="Na + 1.6 × ((Gli - 100) / 100)"
      definition="Corrige o sódio sérico pelo efeito osmótico da hiperglicemia, que puxa água para o espaço extracelular diluindo o Na⁺."
      rationale="Evita diagnóstico errôneo de hiponatremia em cetoacidose/EHH. O Na⁺ verdadeiro pode estar normal ou elevado apesar de Na⁺ medido baixo."
    >
      <div className="grid grid-cols-2 gap-3">
        <CalcField label="Glicemia" value={glicose} onChange={setGlicose} unit="mg/dL" />
        <CalcField label="Na⁺ sérico" value={sodio} onChange={setSodio} unit="mEq/L" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CalcResult label="Na⁺ Corrigido" value={naCorrResult} unit="mEq/L" status={status} />
        <CalcResult label="Contribuição Osm Glicose" value={deltaOsm} unit="mOsm/L" />
      </div>
      {interpretation && <Interpretation text={interpretation} status={status} />}
    </CalculatorCard>
  );
};

export default GlicoseCorrigidaCalc;
