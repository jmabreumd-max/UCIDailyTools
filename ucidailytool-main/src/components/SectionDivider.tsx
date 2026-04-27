interface SectionDividerProps {
  title: string;
}

const SectionDivider = ({ title }: SectionDividerProps) => (
  <div className="flex items-center gap-2 pt-2 pb-1">
    <div className="h-px flex-1 bg-border" />
    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em] whitespace-nowrap">
      {title}
    </span>
    <div className="h-px flex-1 bg-border" />
  </div>
);

export default SectionDivider;
