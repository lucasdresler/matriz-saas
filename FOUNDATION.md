# FOUNDATION — Agillex Hub

## 1. Identidade

**Projeto:** Agillex Hub  
**Organização:** AllLogic Online — Engenharia de Soluções Digitais  
**Família de Produtos:** Família Agillex  
**Categoria:** Plataforma Unificada de Gestão Operacional, Atendimento IA, CRM Kanban e Cobrança Integrada  

O Agillex Hub é o centro operacional e motor da Família Agillex de Soluções Digitais. Ele integra em uma única plataforma multi-tenant o atendimento humanizado com Inteligência Artificial no WhatsApp, a gestão de agendamentos sincronizados, o funil de vendas em formato Kanban CRM e o módulo financeiro com checkout integrado (Agillex Pay via Asaas).

---

## 2. Propósito

Prover aos donos e gestores de empresas de serviços uma visão 360° do seu negócio em tempo real, eliminando a fragmentação de ferramentas, automatizando o ciclo completo desde a atração e atendimento do cliente até o agendamento, pagamento e retenção.

---

## 3. Público-Alvo

Empresas e profissionais prestadores de serviços que dependem de agilidade no WhatsApp e organização operacional:
- Clínicas de saúde, estética e odontologia;
- Salões de beleza, barbearias e spas;
- Escritórios de contabilidade e advocacia;
- Consultorias e prestadores de serviços B2B;
- Academias, estúdios e centros de treinamento;
- Empresas com equipes de atendimento e múltiplos profissionais.

---

## 4. Arquitetura Homologada

O ecossistema Agillex Hub articula os seguintes componentes:

```
[Cliente no WhatsApp]  <───>  [Evolution API / WhatsApp Cloud API]
                                            │
                                            ▼
                                   [n8n Workflow Engine]
                                            │
                      ┌─────────────────────┼─────────────────────┐
                      ▼                     ▼                     ▼
              [Agillex Atende]       [Agillex Agenda]      [Agillex Cobrança]
              (IA Conversacional)   (Google Calendar)      (Asaas Pix / Boleto)
                      │                     │                     │
                      └─────────────────────┼─────────────────────┘
                                            ▼
                                    [Agillex Hub Core]
                              (Next.js App Router + TypeScript)
                                            │
                                            ▼
                               [PostgreSQL 16 Multi-tenant]
                                  (Isolamento por Tenant)
```

---

## 5. Módulos e Capacidades Homologadas

1. **Gestão Multi-Tenant:**
   - Isolamento lógico rigoroso de dados por organização/empresa.
   - Controle de perfis de acesso, múltiplos usuários e profissionais associados.

2. **Atendimento Inteligente Unificado:**
   - Centralização de conversas originadas pelo Agillex Atende.
   - Transbordo humano em 1 clique com histórico completo preservado.

3. **Agendamento & Capacidade:**
   - Painel integrado com o Agillex Agenda.
   - Sincronização bidirecional em tempo real com Google Calendar.

4. **Funil CRM Kanban:**
   - Visualização clara das etapas da jornada do cliente (Novos Leads, Em Atendimento, Agendados, Concluídos, Pós-Venda).
   - Movimentação ágil de cards e métricas de conversão.

5. **Agillex Pay & Cobrança Integrada:**
   - Emissão de cobranças Pix e Cartão via gateway homologado (Asaas).
   - Taxa fixa homologada de R$ 1,99 por Pix liquidado, sem comissões abusivas.
   - Régua ativa de cobrança automatizada (D-2, D0, D+2).

6. **Reputação & Fidelização:**
   - Disparo automatizado de solicitações de avaliação pós-atendimento integrado ao Agillex Reputação.

---

## 6. Integração com a Família Agillex

O Agillex Hub serve como base integradora para todos os produtos da família:
- **Agillex Atende:** Fornece o motor conversacional e atende leads e clientes 24/7.
- **Agillex Agenda:** Gerencia disponibilidade de agenda e reservas públicas.
- **Agillex Cobrança:** Dispara lembretes e confirmações financeiras automáticas.
- **Agillex Reputação:** Filtra o grau de satisfação e direciona clientes promotores para avaliações 5 estrelas no Google.

---

## 7. Princípios Técnicos e Operacionais

- **Confiabilidade Transacional:** Toda alteração de estado crítico (agendamentos, pagamentos, cadastros) deve ter persistência atômica e logs de auditoria.
- **Privacidade e LGPD:** Dados de clientes e pacientes de diferentes empresas nunca devem se cruzar; chaves de tenant devem ser validadas em cada query.
- **Performance e Disponibilidade:** Arquitetura conteinerizada via Docker, otimizada para resposta imediata e alto throughput de webhooks.
- **Alinhamento Institucional:** Subordinação direta às diretrizes do `~/AllLogic/SGA/FOUNDATION.md` e do `~/AllLogic/AGENTS.md`.
