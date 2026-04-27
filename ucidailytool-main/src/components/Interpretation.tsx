interface InterpretationProps {
  text: string;
  status?: "normal" | "warning" | "danger";
}

const Interpretation = ({ text, status }: InterpretationProps) => {
  const borderColor =
    status === "danger"
      ? "border-destructive/40 bg-destructive/5"
      : status === "warning"
      ? "border-warning/40 bg-warning/5"
      : "border-primary/30 bg-primary/5";

  return (
    <div className={`rounded-md border px-3 py-2 text-[11px] leading-relaxed text-foreground ${borderColor}`}>
      {text}
    </div>
  );
};

export default Interpretation;
