import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Verity',
  description: 'A multiplayer game of lies and truths',
  icons: {
    icon: '/favicon.png',
  }, 
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}