import { Organization, Lead, ChatMessage, Appointment, ServiceItem, KnowledgeDoc, SaaSClient, WhatsappInstance } from '@/types';

// Organização Oficial de Trabalho da AllLogic Online
export const initialOrganizations: Organization[] = [
  {
    id: 'org-alllogic',
    name: 'AllLogic Online',
    slug: 'alllogic-online',
    category: 'Engenharia de Soluções Digitais',
    plan: 'Enterprise',
    logoColor: '#1F6FFF',
    whatsappPhone: '+55 11 96638-1915',
    whatsappStatus: 'connected',
    aiActive: true,
    totalLeads: 0,
    modules: {
      agenda: true,
      atendimento: true,
      crm: true,
    },
  },
];

// Lista de Leads de Trabalho (Inicia limpa para a operação real da empresa)
export const initialLeads: Lead[] = [];

// Histórico de Mensagens de Chat (Inicia limpo para conversas reais)
export const initialMessages: Record<string, ChatMessage[]> = {};

// Agendamentos de Trabalho (Inicia limpo para compromissos reais)
export const initialAppointments: Appointment[] = [];

// Catálogo de Soluções Oficiais da AllLogic Online
export const initialServices: ServiceItem[] = [
  {
    id: 'srv-1',
    orgId: 'org-alllogic',
    name: 'Engenharia e Implantação de Agentes de IA',
    price: 3500,
    durationMinutes: 60,
    description: 'Desenvolvimento e integração de agente inteligente humanizado com RAG, WhatsApp Oficial e CRM.',
  },
  {
    id: 'srv-2',
    orgId: 'org-alllogic',
    name: 'Consultoria & Gestão Contínua de IA',
    price: 950,
    durationMinutes: 30,
    description: 'Otimização contínua de prompts, auditoria de conversas, monitoramento e relatórios periódicos.',
  },
  {
    id: 'srv-3',
    orgId: 'org-alllogic',
    name: 'Hospedagem cPanel & Registro de Domínio',
    price: 180,
    durationMinutes: 30,
    description: 'Infraestrutura com cPanel, contas de e-mail corporativo ilimitadas, SSL grátis e suporte técnico especializado.',
  },
  {
    id: 'srv-4',
    orgId: 'org-alllogic',
    name: 'Agillex Agenda & Atendimento WhatsApp',
    price: 297,
    durationMinutes: 45,
    description: 'Agendamento online 24/7 integrado ao Google Calendar e lembretes automáticos com IA no WhatsApp.',
  },
];

// Base de Conhecimento RAG da AllLogic Online
export const initialKnowledgeDocs: KnowledgeDoc[] = [
  {
    id: 'doc-alllogic-1',
    orgId: 'org-alllogic',
    title: 'Apresentação Institucional & Catálogo de Soluções - AllLogic Online.pdf',
    fileName: 'alllogic_solucoes_digitais_2026.pdf',
    fileSize: '2.8 MB',
    chunks: 65,
    uploadedAt: '18/10/2026',
    status: 'indexed',
  },
];

// Clientes SaaS Ativos da Plataforma (Inicia limpo para a gestão real de assinantes)
export const initialSaaSClients: SaaSClient[] = [];

// Instância Oficial do WhatsApp Conectada via Docker na VPS
export const initialWhatsappInstance: WhatsappInstance = {
  id: 'inst-1',
  orgId: 'org-alllogic',
  name: 'WhatsApp AllLogic Oficial',
  phone: '+55 11 96638-1915',
  status: 'connected',
  battery: 98,
  provider: 'Evolution API (Docker)',
  lastPing: 'Agora mesmo',
};
