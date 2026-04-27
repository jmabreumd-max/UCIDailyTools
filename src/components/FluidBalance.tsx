import { useMemo } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { usePatient } from "@/contexts/PatientContext";
import CalcField from "./CalcField";
import CalcResult from "./CalcResult";
import Interpretation from "./Interpretation";
import InfoTooltip from "./InfoTooltip";
import CollapsibleSection from "./CollapsibleSection";

const FluidBalance = () => {
  const { pesoAtual } = usePatient();
  const peso = parseFloat(pesoAtual) || 0;

  // Entradas
  const [cristaloides, setCristaloides] = usePersistedState("fluid-cristaloides", "");
  const [coloides, setColoides] = usePersistedState("fluid-coloides", "");
  const [hemoderivados, setHemoderivados] = usePersistedState("fluid-hemoderivados", "");
  const [nutricao, setNutricao] = usePersistedState("fluid-nutricao", "");
  const [medicacao, setMedicacao] = usePersistedState("fluid-medicacao", "");
  const [outrasEntradas, setOutrasEntradas] = usePersistedState("fluid-outrasEntradas", "");

  // Saídas
  const [diurese, setDiurese] = usePersistedState("fluid-diurese", "");
  const [drenos, setDrenos] = usePersistedState("fluid-drenos", "");
  const [perdasGI, setPerdasGI] = usePersistedState("fluid-perdasGI", "");
  const [uf, setUf] = usePersistedState("fluid-uf", "");
  const [outrasSaidas, setOutrasSaidas] = usePersistedState("fluid-outrasSaidas", "");

  const [metaDiaria, setMetaDiaria] = usePersistedState("fluid-meta", "");
  const [perdasInsensiveis, setPerdasInsensiveis] = usePersistedState("fluid-insensiveis", "");

  const totalEntradas = useMemo(() => {
    return [cristaloides, coloides, hemoderivados, nutricao, medicacao, outrasEntradas]
      .reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  }, [cristaloides, coloides, hemoderivados, nutricao, medicacao, outrasEntradas]);

  const totalSaidas = useMemo(() => {
    return [diurese, drenos, perdasGI, uf, outrasSaidas, perdasInsensiveis]
      .reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  }, [diurese, drenos, perdasGI, uf, outrasSaidas, perdasInsensiveis]);

  const balanco = totalEntradas - totalSaidas;
  const hasData = totalEntradas > 0 || totalSaidas > 0;
  const meta = parseFloat(metaDiaria) || 0;

  return (
    <CollapsibleSection title="Balanço Hídrico"
      badge={hasData ? `${balanco >= 0 ? "+" : ""}${balanco.toFixed(0)} mL` : undefined}
      info={<InfoTooltip interpretation="Balanço hídrico das 24h. Positivo = retenção. Negativo = perda líquida. Meta negativa em doentes congestivos." />}
    >
      <div className="grid grid-cols-2 gap-4">
        {/* Entradas */}
        <div>
          <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-2">Entradas</p>
          <div className="space-y-2">
            <CalcField label="Cristalóides" value={cristaloides} onChange={setCristaloides} unit="mL" />
            <CalcField label="Colóides" value={coloides} onChange={setColoides} unit="mL" />
            <CalcField label="Hemoderivados" value={hemoderivados} onChange={setHemoderivados} unit="mL" />
            <CalcField label="Nutrição" value={nutricao} onChange={setNutricao} unit="mL" />
            <CalcField label="Medicação IV" value={medicacao} onChange={setMedicacao} unit="mL" />
            <CalcField label="Outras" value={outrasEntradas} onChange={setOutrasEntradas} unit="mL" />
          </div>
          {totalEntradas > 0 && (
            <div className="mt-2 text-[11px] font-mono font-semibold text-primary text-right">
              Total: {totalEntradas.toFixed(0)} mL
            </div>
          )}
        </div>

        {/* Saídas */}
        <div>
          <p className="text-[10px] font-semibold text-destructive uppercase tracking-wide mb-2">Saídas</p>
          <div className="space-y-2">
            <CalcField label="Diurese" value={diurese} onChange={setDiurese} unit="mL" />
            <CalcField label="Drenos" value={drenos} onChange={setDrenos} unit="mL" />
            <CalcField label="Perdas GI" value={perdasGI} onChange={setPerdasGI} unit="mL" />
            <CalcField label="UF (TSFR)" value={uf} onChange={setUf} unit="mL" />
            <CalcField label="P. Insensíveis" value={perdasInsensiveis} onChange={setPerdasInsensiveis} unit="mL" />
            <CalcField label="Outras" value={outrasSaidas} onChange={setOutrasSaidas} unit="mL" />
          </div>
          {totalSaidas > 0 && (
            <div className="mt-2 text-[11px] font-mono font-semibold text-destructive text-right">
              Total: {totalSaidas.toFixed(0)} mL
            </div>
          )}
        </div>
      </div>

      {hasData && (
        <div className="mt-3 space-y-2">
          <CalcResult
            label="Balanço 24h"
            value={`${balanco >= 0 ? "+" : ""}${balanco.toFixed(0)}`}
            unit="mL"
            status={Math.abs(balanco) > 2000 ? "danger" : Math.abs(balanco) > 1000 ? "warning" : "normal"}
          />
          {peso > 0 && (
            <div className="text-[10px] text-muted-foreground font-mono text-center">
              {(balanco / peso).toFixed(1)} mL/kg
            </div>
          )}
          <Interpretation
            status={balanco > 2000 ? "danger" : balanco > 1000 ? "warning" : balanco < -1500 ? "warning" : "normal"}
            text={balanco > 2000 ? `Balanço +${balanco.toFixed(0)} mL — Muito positivo. Risco de edema pulmonar e congestão.`
              : balanco > 1000 ? `Balanço +${balanco.toFixed(0)} mL — Positivo. Reavaliar necessidade de fluidos.`
              : balanco < -1500 ? `Balanço ${balanco.toFixed(0)} mL — Muito negativo. Monitorizar perfusão.`
              : `Balanço ${balanco >= 0 ? "+" : ""}${balanco.toFixed(0)} mL — Controlado.`}
          />
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border">
        <CalcField label="Meta Diária" value={metaDiaria} onChange={setMetaDiaria} unit="mL" placeholder="ex: -500" />
        {meta !== 0 && hasData && (
          <div className="mt-2">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Restante para meta</span>
              <span className={`font-mono font-semibold ${Math.abs(balanco - meta) < 500 ? "text-primary" : "text-warning"}`}>
                {(meta - balanco) >= 0 ? "+" : ""}{(meta - balanco).toFixed(0)} mL
              </span>
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};

export default FluidBalance;
