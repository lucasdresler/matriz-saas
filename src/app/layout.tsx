import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agillex Hub | Engenharia de Soluções Digitais & Atendimento IA",
  description: "Tecnologia que trabalha para as pessoas. Plataforma multi-tenant com Agentes de Atendimento IA, CRM Kanban e Integração WhatsApp.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Header />
        <main style={{ minHeight: '100vh', paddingTop: '64px' }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
