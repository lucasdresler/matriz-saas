# AGENTS.md — AllLogic OS (Atendimento IA + CRM SaaS Multi-Tenant)

## 1. Autoridade Institucional
Este documento é subordinado às diretrizes oficiais da **AllLogic Online**:
- `~/AllLogic/AGENTS.md` (Documento Pai da estrutura)
- `~/AllLogic/SGA/FOUNDATION.md` (Fonte Primária Institucional)
- `~/AllLogic/SGA/11-Inteligencia-Artificial/01-Fundamentos/ALLLOGIC_AI_CONSTITUTION.md` (Manual Operacional do Agente)

## 2. Contexto do Projeto
- **Nome do Projeto:** AllLogic OS
- **Organização:** AllLogic Online — *Engenharia de Soluções Digitais*
- **Slogan Oficial:** *Tecnologia que trabalha para as pessoas.*
- **Domínio Institucional:** `alllogiconline.com.br`
- **Propósito:** Plataforma multi-tenant de gestão e atendimento conversacional, integrando WhatsApp (Evolution API v2.3.7), CRM Funil Kanban, sistema de agendamento e base de conhecimento RAG, servindo tanto ao uso próprio quanto aos clientes da AllLogic Online.

## 3. Governança e Autonomia
As regras de governança e limites de autonomia específicos do assistente estão registradas em:
- `.agents/rules/governance.md`

## 4. Padrões Técnicos
- **Frontend:** Next.js 16 (App Router), TypeScript, Vanilla CSS e tokens de design.
- **Banco de Dados:** PostgreSQL 16 (conforme ADR-001 do SGA).
- **Gateway WhatsApp:** Evolution API v2.3.7 oficial via Docker.
- **Proxy Reverso & SSL:** Traefik com Let's Encrypt.
