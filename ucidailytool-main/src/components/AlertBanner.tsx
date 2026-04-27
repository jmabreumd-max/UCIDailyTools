import { AlertTriangle } from "lucide-react";

interface AlertBannerProps {
  text: string;
  level?: "warning" | "danger";
}

const AlertBanner = ({ text, level = "warning" }: AlertBannerProps) => (
  <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-[11px] font-medium border ${
    level === "danger"
      ? "bg-destructive/10 border-destructive/30 text-destructive"
      : "bg-warning/10 border-warning/30 text-warning"
  }`}>
    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
    <span>{text}</span>
  </div>
);

export default AlertBanner;
