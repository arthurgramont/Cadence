import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cadence — Triathlon Dashboard",
  description: "Performance et suivi de matériel pour triathlètes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.variable} h-full antialiased`}>
      {/* text-slate-200 : blanc doux (pas de blanc pur #fff agressif) */}
      <body className="min-h-full bg-slate-950 text-slate-200 font-[family-name:var(--font-geist-sans)]">
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
          <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            {/* Logo : slate-100 — légèrement en retrait du blanc pur */}
            <Link href="/" className="font-bold text-lg tracking-tight text-slate-100">
              Cadence
            </Link>
            <div className="flex gap-1">
              <NavLink href="/">Dashboard</NavLink>
              <NavLink href="/sessions">Sessions</NavLink>
              <NavLink href="/gear">Matériel</NavLink>
              <NavLink href="/tools">Outils</NavLink>
            </div>
          </nav>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-md text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
    >
      {children}
    </Link>
  );
}
