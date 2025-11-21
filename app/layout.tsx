import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Lato } from 'next/font/google';
import './globals.css';

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-lato',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Vestalia | Costeo inteligente de recetas',
  description:
    'Aplicación web que centraliza el costeo y la administración de recetas de Vestalia Pastelería.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${lato.variable} app-body`}>{children}</body>
    </html>
  );
}

