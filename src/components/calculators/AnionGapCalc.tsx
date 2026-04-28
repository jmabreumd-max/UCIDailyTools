import { calcFieldValidator } from "@/utils/validation";
import {  useMemo  } from "react";
import { z } from "zod";
import { useCalculatorForm } from "@/hooks/useCalculatorForm";
import { usePatient } from "@/contexts/PatientContext";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { Zap } from "lucide-react";

export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

const AnionGapCalc = ({ schema, defaultValues }: CalculatorProps = {}) => {
  const p = usePatient();

  const calcSchema = z.object({
    na: calcFieldValidator(100, 180),
  cl: calcFieldValidator(60, 140),
  hco3: calcFieldValidator(2, 60),
  albumina: calcFieldValidator(0.5, 8.0),
  });
  const form = useCalculatorForm(calcSchema, {
    na: { global: p.sodio, setGlobal: p.setSodio },
    cl: { global: p.cloro, setGlobal: p.setCloro },
    hco3: { global: p.hco3, setGlobal: p.setHco3 },
    albumina: { global: p.albumina, setGlobal: p.setAlbumina }
  });
  const { register, formState: { errors } } = form;
  const na = form.watch("na");
  const cl = form.watch("cl");
  const hco3 = form.watch("hco3");
  const albumina = form.watch("albumina");
  
  
  
  
  

  const ag = useMemo(() => {
    const n = parseFloat(na);
    const c = parseFloat(cl);
    const h = parseFloat(hco3);
    if (!n || !c || !h) return null;
    return (n - (c + h)).toFixed(1);
  }, [na, cl, hco3]);

  const agCorrigido = useMemo(() => {
    if (!ag) return null;
    const alb = parseFloat(albumina);
    if (!alb) return null;
    return (parseFloat(ag) + 2.5 * (4 - alb)).toFixed(1);
  }, [ag, albumina]);

  const agStatus = useMemo(() => {
    if (!ag) return undefined;
    return parseFloat(ag) > 12 ? "warning" as const : "normal" as const;
  }, [ag]);

  const agCorrStatus = useMemo(() => {
    if (!agCorrigido) return undefined;
    return parseFloat(agCorrigido) > 12 ? "warning" as const : "normal" as const;
  }, [agCorrigido]);

  const interpretation = useMemo(() => {
    const val = agCorrigido ? parseFloat(agCorrigido) : ag ? parseFloat(ag) : null;
    if (val === null) return null;
    if (val > 12) return "AG elevado (> 12) — acidose metabólica com AG aumentado. Pensar em: MUDPILES (Metanol, Uremia, Diabética/cetoacidose, Propilenoglicol, Isoniazida/Ferro, Lactato, Etilenoglicol, Salicilatos).";
    return "AG normal (≤ 12) — acidose metabólica hiperclorêmica (AG normal). Causas: diarreia, acidose tubular renal, infusão excessiva de SF 0,9%.";
  }, [ag, agCorrigido]);

  return (
    <CalculatorCard
      title="Ânion Gap"
      icon={<Zap className="w-4 h-4" />}
      formula="Na⁺ - (Cl⁻ + HCO₃⁻)"
      definition="O Ânion Gap estima os ânions não medidos no plasma. Diferencia etiologias de acidose metabólica entre AG elevado e AG normal."
      rationale="Fundamental na abordagem da acidose metabólica. AG corrigido pela albumina evita subestimação em hipoalbuminemia (comum na UTI)."
    >
      <div className="grid grid-cols-3 gap-2">
        <CalcField label="Na⁺" {...register("na")} error={errors.na?.message as string} unit="mEq/L" min={100} max={180} />
        <CalcField label="Cl⁻" {...register("cl")} error={errors.cl?.message as string} unit="mEq/L" min={60} max={140} />
        <CalcField label="HCO₃⁻" {...register("hco3")} error={errors.hco3?.message as string} unit="mEq/L" min={2} max={60} />
      </div>
      <CalcField label="Albumina (opcional)" {...register("albumina")} error={errors.albumina?.message as string} unit="g/dL" min={0.5} max={8.0} />
      <div className="grid grid-cols-2 gap-3">
        <CalcResult label="Ânion Gap" value={ag} unit="mEq/L" status={agStatus} />
        <CalcResult label="AG Corrigido" value={agCorrigido} unit="mEq/L" status={agCorrStatus} />
      </div>
      {interpretation && <Interpretation text={interpretation} status={agCorrStatus || agStatus} />}
    </CalculatorCard>
  );
};

export default AnionGapCalc;
