export function Progress({ value, label, className = '' }: { value: number; label: string; className?: string }) {
  const normalized = Math.min(100, Math.max(0, value));
  return <div className={`progress ${className}`} role="progressbar" aria-label={label}
    aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(normalized)}>
    <span style={{ width: `${normalized}%` }} />
  </div>;
}
