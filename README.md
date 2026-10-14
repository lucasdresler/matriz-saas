# 🚀 MATRIZ OS — Agente IA + CRM + Agendamento SaaS Multi-Tenant

Sistema completo de **Agente de IA para WhatsApp**, **CRM Funil Kanban**, **Sistema de Agendamento**, **Base de Conhecimento RAG** e **Painel SaaS Multi-Empresa**, desenvolvido para atender simultaneamente aos 3 objetivos:
1. **Uso na Própria Empresa** (Dogfooding / Atendimento e vendas 24/7).
2. **Prestação de Serviços / Agência** (Implementação High-Ticket para clientes com gestão centralizada).
3. **Plataforma SaaS** (Assinaturas recorrentes self-service com cobrança mensal).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Lucide Icons.
- **Design System:** Dark Luxury UI inspirado em Linear, Supabase e Raycast, com micro-animações e responsividade total.
- **Banco de Dados & Multi-Tenancy:** PostgreSQL com **Row Level Security (RLS)** via Supabase.
- **WhatsApp Gateway:** Suporte nativo à **Evolution API** (open-source, custo de API R$ 0) e **Meta Cloud API**.
- **Motor de IA:** Orquestração com GPT-4o / Claude / Groq, chamadas de ferramenta (*tool calling*) para agendamento e transcrição de áudios via Whisper.

---

## 📂 Estrutura do Projeto

```
matriz-saas/
├── src/
│   ├── app/
│   │   ├── globals.css      # Design tokens, temas e animações
│   │   ├── layout.tsx       # Root layout com fontes Inter e JetBrains Mono
│   │   └── page.tsx         # Dashboard completo e interativo
│   ├── lib/
│   │   └── mockData.ts      # Dados multi-tenant iniciais e simulador
│   └── types/
│       └── index.ts         # Tipagem TypeScript de todas as entidades
├── supabase/
│   └── schema.sql           # Schema SQL pronto para o Supabase com RLS
└── package.json
```

---

## ⚡ Como Rodar o Projeto

1. Certifique-se de que as dependências estão instaladas:
   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Acesse no navegador:
   ```
   http://localhost:3001
   ```

---

## 🌟 Funcionalidades Implementadas

1. **Workspace Switcher Multi-Tenant:**
   - Alterne instantaneamente entre *Minha Empresa*, *Clínica Médica Vitta*, *Advocacia Silva* ou crie novos clientes com 1 clique.
2. **CRM Kanban Interativo:**
   - Funil com estágios: *Novo Lead*, *Em Atendimento IA*, *Follow-up Automático* e *Agendado/Fechado*.
3. **Live Chat WhatsApp com Human Handoff:**
   - Balões fidedignos ao WhatsApp Web.
   - Botão para pausar a IA e permitir que um atendente humano assuma o chat em tempo real.
   - Simulador interativo: envie mensagens como cliente e veja a IA responder e agendar consultas.
4. **Cérebro da IA & Base de Conhecimento (RAG):**
   - Configuração do System Prompt, tom de voz e tempo de follow-up por empresa.
   - Upload e indexação vetorial de PDFs e tabelas de preços.
5. **Conexão WhatsApp (Evolution API):**
   - Gerador de QR Code com expiração e reconexão automática.
6. **Painel SaaS & MRR (Super Admin):**
   - Controle de receita recorrente mensal (MRR), assinantes, planos e limites de instâncias.
