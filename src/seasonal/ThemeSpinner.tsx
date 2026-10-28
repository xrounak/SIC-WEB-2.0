/**
 * Small loading mark for buttons, one per theme: a flickering diya (Diwali), a
 * spinning snowflake (Christmas), a turning Ashoka Chakra (Independence Day) and a
 * gear (Regular). All four render; CSS on <html data-theme> shows the active one, so
 * it works in server and client components alike. Styles live in seasonal.css.
 */
export function ThemeSpinner() {
  return (
    <span className="theme-spinner" aria-hidden="true">
      <svg className="spin-diwali" viewBox="0 0 24 24">
        <path className="spin-flame" d="M12 2 C15 6.5 15.6 9.5 12 13 C8.4 9.5 9 6.5 12 2 Z" fill="#FFD166" />
        <path d="M12 6.5 C13.2 8.6 13.2 10.2 12 11.8 C10.8 10.2 10.8 8.6 12 6.5 Z" fill="#FFF6D8" />
        <path d="M3 14 Q12 17 21 14 Q19 22 12 22 Q5 22 3 14 Z" fill="#C8693A" />
      </svg>
      <svg className="spin-christmas" viewBox="-12 -12 24 24">
        <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none">
          {[0, 60, 120].map((deg) => (
            <g key={deg} transform={`rotate(${deg})`}>
              <path d="M0 -10 V10" />
              <path d="M-3 -7 L0 -4 L3 -7 M-3 7 L0 4 L3 7" />
            </g>
          ))}
        </g>
      </svg>
      <svg className="spin-independenceDay" viewBox="-12 -12 24 24">
        <g stroke="currentColor" fill="none">
          <circle r="10.5" strokeWidth="1.6" />
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i * Math.PI) / 12;
            return <line key={i} x1={0} y1={0} x2={(10 * Math.cos(a)).toFixed(2)} y2={(10 * Math.sin(a)).toFixed(2)} strokeWidth="0.7" />;
          })}
        </g>
        <circle r="2.2" fill="currentColor" />
      </svg>
      <svg className="spin-regular" viewBox="-12 -12 24 24">
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M-1.6 -10.5 H1.6 L2.2 -7.6 L4.6 -6.6 L7 -8.4 L8.4 -7 L6.6 -4.6 L7.6 -2.2 L10.5 -1.6 V1.6 L7.6 2.2 L6.6 4.6 L8.4 7 L7 8.4 L4.6 6.6 L2.2 7.6 L1.6 10.5 H-1.6 L-2.2 7.6 L-4.6 6.6 L-7 8.4 L-8.4 7 L-6.6 4.6 L-7.6 2.2 L-10.5 1.6 V-1.6 L-7.6 -2.2 L-6.6 -4.6 L-8.4 -7 L-7 -8.4 L-4.6 -6.6 L-2.2 -7.6 Z" />
          <circle r="3.2" />
        </g>
      </svg>
    </span>
  );
}
