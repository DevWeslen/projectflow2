import Image from 'next/image'

export function LogoPrincesa({ className = '' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-md ${className}`}>
      <img
        src="/PrincesadosCampos-positivo2-vertical (2).jpg"
        alt="Logo Princesa dos Campos"
        className="object-contain w-full h-full"
      />
    </div>
  )
}
