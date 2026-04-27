import { useState, useMemo } from "react";
import CalculatorCard from "../CalculatorCard";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import { Zap } from "lucide-react";

const AnionGapCalc = () => {
  const [na, setNa] = useState("");
  const [cl, setCl] = useState("");
  const [hco3, setHco3] = useState("");
  const [albumina, setAlbumina] = useState("");

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
        <CalcField label="Na⁺" value={na} onChange={setNa} unit="mEq/L" min={100} max={180} />
        <CalcField label="Cl⁻" value={cl} onChange={setCl} unit="mEq/L" min={60} max={140} />
        <CalcField label="HCO₃⁻" value={hco3} onChange={setHco3} unit="mEq/L" min={2} max={60} />
      </div>
      <CalcField label="Albumina (opcional)" value={albumina} onChange={setAlbumina} unit="g/dL" min={0.5} max={8.0} />
      <div className="grid grid-cols-2 gap-3">
        <CalcResult label="Ânion Gap" value={ag} unit="mEq/L" status={agStatus} />
        <CalcResult label="AG Corrigido" value={agCorrigido} unit="mEq/L" status={agCorrStatus} />
      </div>
      {interpretation && <Interpretation text={interpretation} status={agCorrStatus || agStatus} />}
    </CalculatorCard>
  );
};

export default AnionGapCalc;
