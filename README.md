# 🚀 Agillex Hub — Plataforma Operacional Unificada (Família Agillex)

Central completa e multi-tenant que unifica:
1. **Atendimento Inteligente com IA** no WhatsApp Oficial 24/7.
2. **CRM Funil Kanban** e gestão de leads.
3. **Agillex Agenda** com sincronização em tempo real com Google Calendar.
4. **Agillex Cobrança** com régua ativa e Pix Copia e Cola.
5. **Agillex Reputação** com filtro protetor de satisfação e IA para Google Maps.
6. **Agillex Pay** com taxa fixa de R$ 1,99 por transação concluída via Asaas.

---

## 📂 Estrutura do Projeto

```
agillex-hub/
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
