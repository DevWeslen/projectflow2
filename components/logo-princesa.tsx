export function LogoPrincesa({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Crown-like bars inspired by Princesa dos Campos */}
      <rect x="30" y="70" width="16" height="110" rx="4" fill="#15803d" transform="rotate(-12 38 180)" />
      <rect x="58" y="40" width="16" height="140" rx="4" fill="#16a34a" transform="rotate(-6 66 180)" />
      <rect x="92" y="20" width="16" height="160" rx="4" fill="#22c55e" />
      <rect x="126" y="40" width="16" height="140" rx="4" fill="#16a34a" transform="rotate(6 134 180)" />
      <rect x="154" y="70" width="16" height="110" rx="4" fill="#15803d" transform="rotate(12 162 180)" />
    </svg>
  )
}
