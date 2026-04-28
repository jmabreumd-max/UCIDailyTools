import { useState, useMemo } from "react";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { FlaskConical } from "lucide-react";
import { z } from "zod";

export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

const GASACalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const [albSoro, setAlbSoro] = useState(defaultValues?.albSoro || "");
  const [albAscite, setAlbAscite] = useState(defaultValues?.albAscite || "");

  const resultado = useMemo(() => {
    const s = parseFloat(albSoro);
    const a = parseFloat(albAscite);
    if (!s || isNaN(a)) return null;
    return (s - a).toFixed(1);
  }, [albSoro, albAscite]);

  const status = useMemo(() => {
    if (!resultado) return undefined;
    const r = parseFloat(resultado);
    if (r >= 1.1) return "normal" as const;
    return "warning" as const;
  }, [resultado]);

  const interpretation = useMemo(() => {
    if (!resultado) return null;
    const r = parseFloat(resultado);
    if (r >= 1.1) return "GASA ≥ 1.1 — hipertensão portal (acurácia ~97%). Causas: cirrose hepática, IC congestiva, Budd-Chiari, trombose portal. Se proteína ascítica > 2.5: IC ou Budd-Chiari.";
    return "GASA < 1.1 — causa não-portal. Pensar em: carcinomatose peritoneal, tuberculose peritoneal, síndrome nefrótica, pancreatite, serosite lúpica.";
  }, [resultado]);

  return (
    <CalculatorCard
      title="GASA"
      icon={<FlaskConical className="w-4 h-4" />}
      formula="Albumina Sérica − Albumina Ascítica"
      definition="O Gradiente de Albumina Soro-Ascite (GASA) diferencia ascite por hipertensão portal de causas não-portais com alta acurácia."
      rationale="Substituiu a classificação transudato/exsudato. GASA ≥ 1.1 indica hipertensão portal com ~97% de acurácia."
    >
      <div className="grid grid-cols-2 gap-3">
        <CalcField label="Albumina Sérica" value={albSoro} onChange={setAlbSoro} unit="g/dL" />
        <CalcField label="Albumina Ascítica" value={albAscite} onChange={setAlbAscite} unit="g/dL" />
      </div>
      <CalcResult label="GASA" value={resultado} unit="g/dL" status={status} />
      {interpretation && <Interpretation text={interpretation} status={status} />}
    </CalculatorCard>
  );
};

export default GASACalc;
