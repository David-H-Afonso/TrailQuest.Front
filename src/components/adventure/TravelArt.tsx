export function TravelArt({ kind }: { kind: string }) {
  return <svg viewBox="0 0 400 180" aria-hidden="true" className="travel-art"><rect width="400" height="180" fill={kind === 'fantasy' ? '#e5eadc' : '#e5f0ef'} /><circle cx="300" cy="55" r="24" fill="#dfb38b" /><path d="M0 160L100 60l95 100 95-70 110 70" fill="#a2b9ae" /><path d="M0 180Q100 120 200 170T400 150" fill="none" stroke="#557d76" strokeWidth="4" strokeDasharray="5 7" /></svg>;
}
