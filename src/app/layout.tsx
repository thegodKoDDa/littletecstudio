import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LittleTec — Seu espaço de controle",
  description:
    "Um novo espaço para configurar suas teclas, giratórios e iluminação. LittleTec Studio Web.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
