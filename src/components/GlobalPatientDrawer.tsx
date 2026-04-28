import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { User, Activity } from "lucide-react";
import { usePatient } from "@/contexts/PatientContext";

export default function GlobalPatientDrawer() {
  const [open, setOpen] = useState(false);
  const p = usePatient();

  const Field = ({ label, value, onChange, unit }: any) => (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50">
      <span className="text-[11px] font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-1.5 w-1/2">
        <input
          type="number"
          className="w-full bg-background border border-border rounded-md px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {unit && <span className="text-[10px] text-muted-foreground w-8">{unit}</span>}
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-xs font-medium border border-primary/20">
          <User className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Perfil & Labs Globais</span>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px] sm:w-[400px] overflow-y-auto p-4 border-l border-border bg-background/95 backdrop-blur-xl">
        <SheetHeader className="mb-4 text-left">
          <SheetTitle className="text-sm font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Perfil Clínico Global
          </SheetTitle>
          <SheetDescription className="text-[10px]">
             Os valores definidos aqui são partilhados por todas as calculadoras (interconectividade).
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Antropometria */}
          <section>
            <h3 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Antropometria</h3>
            <div className="bg-card border border-border rounded-lg p-2">
              <Field label="Idade" value={p.idade} onChange={p.setIdade} unit="anos" />
              <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50">
                <span className="text-[11px] font-medium text-foreground">Sexo</span>
                <div className="flex gap-2">
                  <button onClick={() => p.setSexo("M")} className={`px-2 py-1 text-[10px] rounded ${p.sexo === "M" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Masc</button>
                  <button onClick={() => p.setSexo("F")} className={`px-2 py-1 text-[10px] rounded ${p.sexo === "F" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Fem</button>
                </div>
              </div>
              <Field label="Peso Atual" value={p.pesoAtual} onChange={p.setPesoAtual} unit="kg" />
              <Field label="Altura" value={p.altura} onChange={p.setAltura} unit="cm" />
              {p.imc && (
                <div className="flex justify-between py-1.5 text-[11px]">
                  <span className="text-muted-foreground">IMC:</span>
                  <span className="font-semibold">{p.imc.toFixed(1)}</span>
                </div>
              )}
              {p.pesoIdeal && (
                <div className="flex justify-between py-1.5 text-[11px]">
                  <span className="text-muted-foreground">Peso Ideal:</span>
                  <span className="font-semibold">{p.pesoIdeal.toFixed(1)} kg</span>
                </div>
              )}
            </div>
          </section>

          {/* Sinais Vitais / Hemodinâmica */}
          <section>
            <h3 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Neurologia & Hemodinâmica</h3>
            <div className="bg-card border border-border rounded-lg p-2">
              <Field label="Glasgow (GCS)" value={p.gcsTotal} onChange={(v: string) => p.setGcsTotal(Number(v))} unit="/15" />
              <Field label="PAM" value={p.pamCardio} onChange={p.setPamCardio} unit="mmHg" />
            </div>
          </section>

          {/* Gasimetria */}
          <section>
            <h3 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Gasimetria Arterial</h3>
            <div className="bg-card border border-border rounded-lg p-2">
              <Field label="pH" value={p.ph} onChange={p.setPh} unit="" />
              <Field label="pCO₂" value={p.pco2} onChange={p.setPco2} unit="mmHg" />
              <Field label="pO₂" value={p.pao2} onChange={p.setPao2} unit="mmHg" />
              <Field label="FiO₂" value={p.fio2} onChange={p.setFio2} unit="%" />
              <Field label="HCO₃⁻" value={p.hco3} onChange={p.setHco3} unit="mEq/L" />
              <Field label="Lactato" value={p.lactato} onChange={p.setLactato} unit="mmol/L" />
            </div>
          </section>

          {/* Bioquímica */}
          <section>
            <h3 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Bioquímica Analítica</h3>
            <div className="bg-card border border-border rounded-lg p-2">
              <Field label="Glicemia" value={p.glicemia} onChange={p.setGlicemia} unit="mg/dL" />
              <Field label="Sódio (Na⁺)" value={p.sodio} onChange={p.setSodio} unit="mEq/L" />
              <Field label="Potássio (K⁺)" value={p.potassio} onChange={p.setPotassio} unit="mEq/L" />
              <Field label="Cloro (Cl⁻)" value={p.cloro} onChange={p.setCloro} unit="mEq/L" />
              <Field label="Cálcio Total" value={p.calcioTotal} onChange={p.setCalcioTotal} unit="mg/dL" />
              <Field label="Magnésio (Mg²⁺)" value={p.magnesio} onChange={p.setMagnesio} unit="mg/dL" />
              <Field label="Fósforo" value={p.fosforo} onChange={p.setFosforo} unit="mg/dL" />
              <Field label="Creatinina" value={p.creatinina} onChange={p.setCreatinina} unit="mg/dL" />
              <Field label="Creat. Basal" value={p.creatininaBasal} onChange={p.setCreatininaBasal} unit="mg/dL" />
              <Field label="Ureia" value={p.ureia} onChange={p.setUreia} unit="mg/dL" />
              <Field label="Albumina" value={p.albumina} onChange={p.setAlbumina} unit="g/dL" />
              <Field label="Bilirrubina" value={p.bilirrubina} onChange={p.setBilirrubina} unit="mg/dL" />
            </div>
          </section>
          
          {/* Hematologia */}
          <section>
            <h3 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Hematologia</h3>
            <div className="bg-card border border-border rounded-lg p-2">
               <Field label="Hemoglobina" value={p.hemoglobina} onChange={p.setHemoglobina} unit="g/dL" />
               <Field label="Plaquetas" value={p.plaquetas} onChange={p.setPlaquetas} unit="x10³/μL" />
               <Field label="INR" value={p.inr} onChange={p.setInr} unit="" />
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
