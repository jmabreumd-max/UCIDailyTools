import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { useEventLog } from "@/contexts/EventLogContext";

interface AlertBannerProps {
  text: string;
  level?: "warning" | "danger";
}

// Global Set to keep track of shown alerts in current session to prevent spam across tab switches
const shownAlerts = new Set<string>();

const AlertBanner = ({ text, level = "warning" }: AlertBannerProps) => {
  const { addLog } = useEventLog();
  const loggedRef = useRef(false);

  useEffect(() => {
    if (!loggedRef.current && !shownAlerts.has(text)) {
      shownAlerts.add(text);
      loggedRef.current = true;
      // Add a slight delay to ensure context is ready and to prevent strict-mode double firing issues
      const timer = setTimeout(() => {
        addLog(
          level === "danger" ? "WARNING" : "INFO",
          "Alerta Clínico",
          text
        );
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [text, level, addLog]);

  return (
    <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-[11px] font-medium border ${
      level === "danger"
        ? "bg-destructive/10 border-destructive/30 text-destructive"
        : "bg-warning/10 border-warning/30 text-warning"
    }`}>
      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
};

export default AlertBanner;
