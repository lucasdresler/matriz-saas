export type ModuleType = 'atendimento' | 'agenda' | 'combo';
export type BillingCycle = 'monthly' | 'yearly';
export type BillingMethod = 'CREDIT_CARD' | 'PIX' | 'BOLETO';

export interface PlanConfig {
  id: string;
  name: string;
  module: ModuleType;
  badge?: string;
  tagline: string;
  priceMonthly: number;
  priceYearlyMonthly: number; // Valor mensal no ciclo anual
  annualTotal: number;
  features: string[];
  conversationsLimit?: number;
  professionalsLimit?: number;
}

export const SAAS_PLANS: Record<string, PlanConfig> = {
  // --- Agillex Atendimento ---
  'starter': {
    id: 'starter',
    name: 'Atendimento Starter',
    module: 'atendimento',
    badge: 'Autônomos e Pequenos Negócios',
    tagline: 'Ideal para profissionais autônomos, estúdios e consultórios.',
    priceMonthly: 99.90,
    priceYearlyMonthly: 79.90,
    annualTotal: 958.80,
    conversationsLimit: 500,
    features: [
      'Até 500 conversas/mês no WhatsApp',
      'Atendimento inteligente 24 horas por dia',
      'Compreensão de áudios de voz e mensagens de texto',
      'Transbordo automático para atendente humano',
      'Sem taxa de setup ou custos ocultos',
    ],
  },
  'pro': {
    id: 'pro',
    name: 'Atendimento Pro',
    module: 'atendimento',
    badge: 'Mais Escolhido',
    tagline: 'Para clínicas, escritórios e empresas com equipe e maior fluxo.',
    priceMonthly: 179.90,
    priceYearlyMonthly: 149.90,
    annualTotal: 1798.80,
    conversationsLimit: 2000,
    features: [
      'Até 2.000 conversas/mês no WhatsApp',
      'Atendimento inteligente 24 horas por dia',
      'Compreensão de áudios de voz e mensagens de texto',
      'Transbordo automático para atendente humano',
      'Prioridade de suporte e configuração guiada',
    ],
  },

  // --- Agillex Agenda ---
  'agenda_inicial': {
    id: 'agenda_inicial',
    name: 'Agenda 1 Profissional',
    module: 'agenda',
    badge: 'Autônomos',
    tagline: 'Ideal para profissionais autônomos e estúdios individuais.',
    priceMonthly: 49.90,
    priceYearlyMonthly: 39.90,
    annualTotal: 478.80,
    professionalsLimit: 1,
    features: [
      '1 Profissional com agenda própria',
      'Clientes, serviços e agendamentos ilimitados',
      'Página pública exclusiva aberta 24/7',
      'Confirmações e lembretes automáticos no WhatsApp',
      'Visão diária, semanal e mensal de horários',
    ],
  },
  'agenda_intermediario': {
    id: 'agenda_intermediario',
    name: 'Agenda Até 5 Profissionais',
    module: 'agenda',
    badge: 'Mais Escolhido',
    tagline: 'Para barbearias, clínicas, salões e consultórios com equipe.',
    priceMonthly: 99.90,
    priceYearlyMonthly: 79.90,
    annualTotal: 958.80,
    professionalsLimit: 5,
    features: [
      'Até 5 Profissionais com agendas independentes',
      'Clientes, serviços e agendamentos ilimitados',
      'Página pública exclusiva aberta 24/7',
      'Confirmações e lembretes automáticos no WhatsApp',
      'Gestão de escalas, horários e intervalos',
    ],
  },
  'agenda_avancado': {
    id: 'agenda_avancado',
    name: 'Agenda Até 10 Profissionais',
    module: 'agenda',
    badge: 'Grandes Equipes',
    tagline: 'Para clínicas e estabelecimentos com múltiplos atendimentos.',
    priceMonthly: 169.90,
    priceYearlyMonthly: 139.90,
    annualTotal: 1678.80,
    professionalsLimit: 10,
    features: [
      'Até 10 Profissionais com agendas independentes',
      'Clientes, serviços e agendamentos ilimitados',
      'Página pública exclusiva aberta 24/7',
      'Confirmações e lembretes automáticos no WhatsApp',
      'Painel avançado e relatórios operacionais',
    ],
  },

  // --- Combo Agillex ---
  'combo': {
    id: 'combo',
    name: 'Combo Agillex Hub Pro',
    module: 'combo',
    badge: 'Solução Completa',
    tagline: 'Ecossistema completo: Atendimento IA no WhatsApp, Agenda para equipe, CRM Kanban e Agillex Pay integrado.',
    priceMonthly: 249.90,
    priceYearlyMonthly: 199.90,
    annualTotal: 2398.80,
    conversationsLimit: 2000,
    professionalsLimit: 5,
    features: [
      'Atendimento Inteligente com IA no WhatsApp (até 2.000 conversas/mês)',
      'Agillex Agenda Pro para equipe de até 5 profissionais',
      'Agendamento automático no WhatsApp com confirmações e lembretes',
      'Sincronização bidirecional em tempo real com Google Calendar',
      'Agillex CRM Kanban com leads e estágios ilimitados',
      'Agillex Pay integrado com taxa fixa de apenas R$ 1,99 por transação',
      'Transbordo humano em 1 clique com histórico preservado',
      'Base de conhecimento personalizada para o seu negócio',
      'Suporte prioritário e onboarding guiado pela AllLogic Online',
    ],
  },
};
