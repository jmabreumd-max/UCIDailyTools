import { Sun, Moon, Eye } from "lucide-react";
import { Theme } from "@/hooks/useTheme";

const themes: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "high-contrast", label: "Alto Contraste", icon: Eye },
  { id: "dark", label: "Escuro", icon: Moon },
  { id: "light", label: "Claro", icon: Sun },
];

interface ThemeSelectorProps {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

export default function ThemeSelector({ theme, setTheme }: ThemeSelectorProps) {
  return (
    <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
      {themes.map((t) => {
        const Icon = t.icon;
        const active = theme === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            title={t.label}
            className={`p-1.5 rounded-md transition-all ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        );
      })}
    </div>
  );
}
