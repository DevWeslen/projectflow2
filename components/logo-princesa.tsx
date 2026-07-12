export function LogoPrincesa({ className = '' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-md ${className}`}>
      <img
        src="/placeholder-logo.svg"
        alt="Logo"
        className="object-contain w-full h-full"
      />
    </div>
  )
}
