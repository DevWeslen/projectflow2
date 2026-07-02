import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'



export const metadata: Metadata = {
  title: 'ProjectFlow - Princesa dos Campos',
  description: 'Sistema de gestão de projetos com metodologias ágeis - Princesa dos Campos',
  generator: 'v0.app',
  icons: {
    icon: '/icon.svg',
  },
}


import { Toaster } from 'sonner'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        {children}
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  )
}
