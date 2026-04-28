import { useState } from "react";
import { Activity, Brain, Wind, Heart, FlaskConical, Utensils, Droplets, Bug, BarChart3, ClipboardCheck, Pill, RefreshCw } from "lucide-react";
import { PatientProvider } from "@/contexts/PatientContext";
import { EventLogProvider } from "@/contexts/EventLogContext";
import { useTheme } from "@/hooks/useTheme";
import ThemeSelector from "@/components/ThemeSelector";
import PCRModal from "@/components/PCRModal";
import EventLogViewer from "@/components/EventLogViewer";

import GeralTab from "@/components/tabs/GeralTab";
import NeurologicoTab from "@/components/tabs/NeurologicoTab";
import VentilatorioTab from "@/components/tabs/VentilatorioTab";
import CardiovascularTab from "@/components/tabs/CardiovascularTab";
import RenalTab from "@/components/tabs/RenalTab";
import DigestivoTab from "@/components/tabs/DigestivoTab";
import HematologicoTab from "@/components/tabs/HematologicoTab";
import InfecaoTab from "@/components/tabs/InfecaoTab";
import PrognosticoTab from "@/components/tabs/PrognosticoTab";
import FarmacosTab from "@/components/tabs/FarmacosTab";
import FinalizacaoTab from "@/components/tabs/FinalizacaoTab";

const tabs = [
  { id: "geral", label: "Geral", icon: Activity },
  { id: "neuro", label: "Neuro", icon: Brain },
  { id: "vent", label: "Vent", icon: Wind },
  { id: "cardio", label: "Cardio", icon: Heart },
  { id: "renal", label: "Renal", icon: FlaskConical },
  { id: "digest", label: "Digest", icon: Utensils },
  { id: "hemato", label: "Hemato", icon: Droplets },
  { id: "infecao", label: "Infeção", icon: Bug },
  { id: "farmacos", label: "Fármacos", icon: Pill },
  { id: "prognostico", label: "Prognóstico", icon: BarChart3 },
  { id: "final", label: "Final", icon: ClipboardCheck },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState("geral");
  const { theme, setTheme } = useTheme();

  return (
    <EventLogProvider>
      <PatientProvider>
        <div className="min-h-screen bg-background relative">
          <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl pb-2">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center pulse-glow">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-sm font-bold gradient-text">ICU Manager</h1>
                  <p className="text-[10px] text-muted-foreground">Gestão do Doente Crítico</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <PCRModal />
                <button
                  onClick={() => {
                    if(confirm("Tem a certeza que deseja limpar todos os dados do paciente?")) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive/70 hover:text-destructive border border-transparent hover:border-destructive/20 transition-all font-medium text-xs flex items-center gap-1"
                  title="Limpar todos os dados"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset
                </button>
                <ThemeSelector theme={theme} setTheme={setTheme} />
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 overflow-hidden">
              <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? "bg-primary/15 text-primary border border-primary/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
                    }`}>
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-5 w-full">
          <div className={activeTab === "geral" ? "" : "hidden"}><GeralTab setActiveTab={setActiveTab} /></div>
          <div className={activeTab === "neuro" ? "" : "hidden"}><NeurologicoTab /></div>
          <div className={activeTab === "vent" ? "" : "hidden"}><VentilatorioTab /></div>
          <div className={activeTab === "cardio" ? "" : "hidden"}><CardiovascularTab /></div>
          <div className={activeTab === "renal" ? "" : "hidden"}><RenalTab /></div>
          <div className={activeTab === "digest" ? "" : "hidden"}><DigestivoTab /></div>
          <div className={activeTab === "hemato" ? "" : "hidden"}><HematologicoTab /></div>
          <div className={activeTab === "infecao" ? "" : "hidden"}><InfecaoTab /></div>
          <div className={activeTab === "farmacos" ? "" : "hidden"}><FarmacosTab /></div>
          <div className={activeTab === "prognostico" ? "" : "hidden"}><PrognosticoTab /></div>
          <div className={activeTab === "final" ? "" : "hidden"}><FinalizacaoTab /></div>

          <footer className="mt-8 pb-6 text-center border-t border-border pt-4">
            <p className="text-[10px] text-muted-foreground">
              ⚠️ Esta aplicação é uma ferramenta de apoio à decisão clínica. Valide todos os cálculos. Não substitui o julgamento clínico.
            </p>
          </footer>
        </main>
        
        <EventLogViewer />
      </div>
    </PatientProvider>
    </EventLogProvider>
  );
};

export default Index;
