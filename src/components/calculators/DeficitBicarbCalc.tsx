import { useState, useMemo } from "react";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { Minus } from "lucide-react";
import { z } from "zod";

export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

const DeficitBicarbCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const [peso, setPeso] = useState(defaultValues?.peso || "");
  const [hco3Atual, setHco3Atual] = useState(defaultValues?.hco3Atual || "");
  const [hco3Desejado, setHco3Desejado] = useState("24");

  const resultado = useMemo(() => {
    const p = parseFloat(peso);
    const atual = parseFloat(hco3Atual);
    const desejado = parseFloat(hco3Desejado);
    if (!p || !atual || !desejado) return null;
    return (0.3 * p * (desejado - atual)).toFixed(1);
  }, [peso, hco3Atual, hco3Desejado]);

  const mlBic84 = useMemo(() => {
    if (!resultado) return null;
    return parseFloat(resultado).toFixed(0);
  }, [resultado]);

  const interpretation = useMemo(() => {
    if (!resultado || !mlBic84) return null;
    const mEq = parseFloat(resultado);
    if (mEq <= 0) return "HCO₃ atual ≥ alvo — sem déficit de bicarbonato. Não há indicação de reposição.";
    const ml = parseFloat(mlBic84);
    const metade = (ml / 2).toFixed(0);
    return `Déficit de ${mEq.toFixed(0)} mEq. Repor ${metade} mL de NaHCO₃ 8,4% (1 mEq/mL) em 4–6h (50% do déficit). Reavaliar gasometria antes de completar. Infundir diluído em acesso central. Atenção: risco de hipernatremia e hipocalemia.`;
  }, [resultado, mlBic84]);

  const status = useMemo(() => {
    if (!resultado) return undefined;
    const mEq = parseFloat(resultado);
    if (mEq > 100) return "danger" as const;
    if (mEq > 50) return "warning" as const;
    return "normal" as const;
  }, [resultado]);

  return (
    <CalculatorCard
      title="Déficit de Bicarbonato"
      icon={<Minus className="w-4 h-4" />}
      formula="0.3 × Peso × (HCO₃ desejado - HCO₃ atual)"
      definition="Calcula a quantidade de bicarbonato necessária para corrigir acidose metabólica, estimando o espaço de distribuição do HCO₃⁻."
      rationale="Guia a reposição de NaHCO₃ em acidose metabólica grave (pH < 7.1). Reposição deve ser parcial (50%) com reavaliação gasométrica."
    >
      <div className="grid grid-cols-3 gap-2">
        <CalcField label="Peso" value={peso} onChange={setPeso} unit="kg" />
        <CalcField label="HCO₃ atual" value={hco3Atual} onChange={setHco3Atual} unit="mEq/L" />
        <CalcField label="HCO₃ alvo" value={hco3Desejado} onChange={setHco3Desejado} unit="mEq/L" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CalcResult label="Déficit" value={resultado} unit="mEq" status={status} />
        <CalcResult label="NaHCO₃ 8,4%" value={mlBic84} unit="mL" />
      </div>
      {interpretation && <Interpretation text={interpretation} status={status} />}
    </CalculatorCard>
  );
};

export default DeficitBicarbCalc;
