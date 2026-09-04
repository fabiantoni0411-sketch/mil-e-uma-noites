import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mil e Uma Noites — Shawarma e Lanches',
  description: 'Cardápio digital e pedidos online do Mil e Uma Noites Shawarma e Lanches',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Jost:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
