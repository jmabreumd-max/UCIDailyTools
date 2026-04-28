import { useState, useMemo } from "react";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { HeartPulse } from "lucide-react";
import { z } from "zod";

export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

const PAMCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const [pas, setPas] = useState(defaultValues?.pas || "");
  const [pad, setPad] = useState(defaultValues?.pad || "");

  const resultado = useMemo(() => {
    const s = parseFloat(pas);
    const d = parseFloat(pad);
    if (!s || !d) return null;
    return ((s + 2 * d) / 3).toFixed(0);
  }, [pas, pad]);

  const status = useMemo(() => {
    if (!resultado) return undefined;
    const r = parseFloat(resultado);
    if (r < 65) return "danger" as const;
    if (r > 100) return "warning" as const;
    return "normal" as const;
  }, [resultado]);

  const interpretation = useMemo(() => {
    if (!resultado) return null;
    const r = parseFloat(resultado);
    if (r < 65) return "PAM < 65 mmHg — hipoperfusão orgânica. Iniciar ou titular vasopressor. Avaliar volemia e débito cardíaco.";
    if (r <= 100) return "PAM adequada (65–100 mmHg). Perfusão orgânica preservada. Manter vigilância hemodinâmica.";
    return "PAM > 100 mmHg — considerar reduzir vasopressor ou iniciar vasodilatador se pós-carga elevada.";
  }, [resultado]);

  return (
    <CalculatorCard
      title="Pressão Arterial Média"
      icon={<HeartPulse className="w-4 h-4" />}
      formula="(PAS + 2×PAD) / 3"
      definition="A PAM representa a pressão média de perfusão durante o ciclo cardíaco. É o principal determinante do fluxo sanguíneo para os órgãos."
      rationale="Alvo terapêutico em choque (PAM ≥ 65 mmHg). Guia titulação de vasopressores e avaliação da perfusão tecidual."
    >
      <div className="grid grid-cols-2 gap-3">
        <CalcField label="PAS" value={pas} onChange={setPas} unit="mmHg" />
        <CalcField label="PAD" value={pad} onChange={setPad} unit="mmHg" />
      </div>
      <CalcResult label="PAM" value={resultado} unit="mmHg" status={status} />
      {interpretation && <Interpretation text={interpretation} status={status} />}
    </CalculatorCard>
  );
};

export default PAMCalc;
