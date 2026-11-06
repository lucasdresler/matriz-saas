# AGENTS.md — Agillex Hub

## Contexto do Projeto

Este documento orienta os Agentes de IA que atuam no repositório **Agillex Hub**, subordinado às diretrizes gerais do `~/AllLogic/AGENTS.md` e aos fundamentos de `~/AllLogic/SGA/FOUNDATION.md`.

O **Agillex Hub** é a plataforma multi-tenant unificada de gestão operacional e inteligência comercial da Família Agillex, integrando atendimento conversacional no WhatsApp com Inteligência Artificial, CRM Funil Kanban, Agillex Agenda, catálogo de serviços e checkout integrado (Agillex Pay).

---

## 1. Arquitetura e Tecnologias

- **Domínio de Produção:** `https://hub.agillex.com.br/` (ou `https://hub.alllogiconline.com.br/`)
- **Plataforma Base:** Next.js 16 (App Router), TypeScript e Node.js
- **Frontend:** React 19, Tailwind CSS, componentes acessíveis e tokens visuais Agillex.
- **Banco de Dados:** PostgreSQL 16 multi-tenant (com particionamento lógico por tenant).
- **Integrações Chave:** Evolution API v2.3.7 (WhatsApp), n8n (orquestração), Asaas (Agillex Pay) e Google Calendar API.
- **Hospedagem & Infraestrutura:** VPS Hetzner / EVEO, Docker Compose, Traefik v3 (SSL Let's Encrypt automático).
- **Acesso Remoto:** SSH (chave `~/.ssh/id_rsa`).
- **Diretório Remoto:** `/opt/alllogic/stacks/agillex-hub/`.

---

## 2. Estrutura do Repositório Local

- `src/` — Código-fonte da aplicação:
  - `app/` — Rotas e layouts do Next.js App Router (painel admin, CRM, configurações, autenticação).
  - `components/` — Componentes reutilizáveis de interface (Kanban, tabelas, modais, formulários).
  - `lib/` — Utilitários, clientes de banco e serviços de integração.
  - `types/` — Definições de tipos TypeScript compartilhados.
- `public/` — Ativos estáticos públicos (logos, ícones, fontes).
- `docs/` — Documentação técnica, ADRs de arquitetura e especificações de produto.

---

## 3. Procedimento Operacional de Deploy

1. Realizar alterações e validações no ambiente local de desenvolvimento.
2. Executar checagens de tipos e build local para assegurar ausência de erros:
   ```bash
   npm run build
   ```
3. **Portão Obrigatório de Aprovação:** Apresentar ao fundador um resumo estruturado com os objetivos atendidos, arquivos modificados, novas dependências e evidências do build local. Formular explicitamente a pergunta de autorização e aguardar a resposta do fundador. Fica terminantemente proibido executar `git commit`, `git push` ou comandos remotos sem autorização expressa.
4. **Execução Contínua Pós-Autorização:** Uma vez concedida a autorização pelo fundador, a execução prossegue de forma contínua e autônoma até a entrega completa das etapas aprovadas, sem pausas para confirmações intermediárias:
   - Criar commit semântico e enviar ao repositório remoto (`git push origin main`).
   - Conectar à VPS e executar rotina de backup da stack.
   - Atualizar a aplicação na VPS via `git pull origin main`.
   - Executar rebuild dos containers da stack (`docker compose build && docker compose up -d`).
   - Executar validações pós-deploy (verificação HTTP 200, integridade de rotas e conexão com banco de dados).
