import { Organization, Lead, ChatMessage, Appointment, ServiceItem, KnowledgeDoc, SaaSClient, WhatsappInstance, CobrancaRule, CobrancaNotificationLog, ReputacaoFeedback, ReputacaoConfig } from '@/types';

// Organização Oficial de Trabalho da AllLogic Online
export const initialOrganizations: Organization[] = [
  {
    id: 'org-alllogic',
    name: 'AllLogic Online',
    slug: 'alllogic',
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
      cobranca: true,
      reputacao: true,
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
    name: 'Agillex Hub Pro (Combo Completo)',
    price: 249.9,
    durationMinutes: 30,
    description: 'Plataforma unificada completa: Atendimento IA 24/7 no WhatsApp (até 2.000 conversas/mês), Agillex Agenda para até 5 profissionais com Google Calendar, Funil CRM Kanban e Agillex Pay integrado com taxa fixa de R$ 1,99 por transação.',
  },
  {
    id: 'srv-2',
    orgId: 'org-alllogic',
    name: 'Agillex Atende Starter',
    price: 99.9,
    durationMinutes: 30,
    description: 'Atendente inteligente com IA humanizada no WhatsApp Oficial para até 500 atendimentos/mês, compreensão de áudio e texto, base de conhecimento RAG exclusiva e transbordo humano em 1 clique.',
  },
  {
    id: 'srv-3',
    orgId: 'org-alllogic',
    name: 'Agillex Atende Pro',
    price: 179.9,
    durationMinutes: 30,
    description: 'Atendente inteligente com IA humanizada no WhatsApp Oficial para até 2.000 conversas/mês, respostas contextuais avançadas, áudio de voz, base RAG e transbordo humano em 1 clique.',
  },
  {
    id: 'srv-4',
    orgId: 'org-alllogic',
    name: 'Agillex Agenda — 1 Profissional',
    price: 49.9,
    durationMinutes: 30,
    description: 'Sistema de agendamento online 24/7 com página pública exclusiva, sincronização bidirecional em tempo real com Google Calendar e confirmações/lembretes automáticos no WhatsApp.',
  },
  {
    id: 'srv-5',
    orgId: 'org-alllogic',
    name: 'Agillex Agenda — Até 5 Profissionais',
    price: 99.9,
    durationMinutes: 30,
    description: 'Agendamento online sincronizado para clínicas, salões e estúdios com equipe de até 5 profissionais, escalas individuais, Google Calendar e redução de até 85% em faltas/no-shows.',
  },
  {
    id: 'srv-6',
    orgId: 'org-alllogic',
    name: 'Agillex Agenda — Até 10 Profissionais',
    price: 169.9,
    durationMinutes: 30,
    description: 'Agendamento online para estabelecimentos de maior porte com múltiplos atendimentos simultâneos e gestão de escalas de até 10 colaboradores com lembretes automáticos no WhatsApp.',
  },
  {
    id: 'srv-cobranca',
    orgId: 'org-alllogic',
    name: 'Agillex Cobrança Inteligente Pix',
    price: 89.9,
    durationMinutes: 30,
    description: 'Régua inteligente de cobrança e notificação ativa no WhatsApp com Pix Copia e Cola integrado ao Asaas. Reduz até 78% da inadimplência com lembrete preventivo, alerta no vencimento e recuperação amigável.',
  },
  {
    id: 'srv-reputacao',
    orgId: 'org-alllogic',
    name: 'Agillex Reputação 5 Estrelas',
    price: 79.9,
    durationMinutes: 30,
    description: 'Acelerador de avaliações 5 estrelas no Google Meu Negócio pós-atendimento. Filtro inteligente de satisfação (NPS 4-5 vai pro Google Maps, 1-3 é protegido e tratado internamente) e respostas com IA para SEO local.',
  },
  {
    id: 'srv-7',
    orgId: 'org-alllogic',
    name: 'Hospedagem cPanel Essencial',
    price: 29.9,
    durationMinutes: 30,
    description: 'Hospedagem gerenciada com cPanel para 1 site, 5 GB de armazenamento SSD, 5 contas de e-mail corporativo, tráfego de 50 GB/mês, certificado SSL grátis e suporte técnico especializado.',
  },
  {
    id: 'srv-8',
    orgId: 'org-alllogic',
    name: 'Hospedagem cPanel Profissional',
    price: 49.9,
    durationMinutes: 30,
    description: 'Hospedagem com cPanel para 2 sites, 10 GB de armazenamento, 10 contas de e-mail corporativo, SSL grátis, suporte técnico e 1º ano de domínio grátis na contratação anual.',
  },
  {
    id: 'srv-9',
    orgId: 'org-alllogic',
    name: 'Hospedagem cPanel Avançado',
    price: 89.9,
    durationMinutes: 30,
    description: 'Hospedagem de alta capacidade para até 5 sites, 25 GB de armazenamento, 20 contas de e-mail corporativo, SSL grátis e 1º ano de domínio grátis na contratação anual.',
  },
  {
    id: 'srv-10',
    orgId: 'org-alllogic',
    name: 'Hospedagem cPanel Empresarial',
    price: 149.9,
    durationMinutes: 30,
    description: 'Hospedagem robusta para até 10 sites, 50 GB de armazenamento, 30 contas de e-mail corporativo, SSL grátis, alta performance e 1º ano de domínio grátis na contratação anual.',
  },
  {
    id: 'srv-11',
    orgId: 'org-alllogic',
    name: 'Registro de Domínio .com.br',
    price: 59.9,
    durationMinutes: 15,
    description: 'Registro oficial de domínio nacional .com.br no Registro.br, configuração completa de zonas de DNS, proteção, segurança e apontamentos para site e e-mails corporativos.',
  },
  {
    id: 'srv-12',
    orgId: 'org-alllogic',
    name: 'Registro de Domínio .com',
    price: 89.9,
    durationMinutes: 15,
    description: 'Registro oficial de domínio internacional .com, gestão técnica de DNS e apontamentos para site e e-mails corporativos.',
  },
  {
    id: 'srv-13',
    orgId: 'org-alllogic',
    name: 'Desenvolvimento de Site Profissional',
    price: 1800.0,
    durationMinutes: 60,
    description: 'Criação de site institucional moderno, ultra-rápido, responsivo para celular, com botão direto para WhatsApp, página de serviços e otimização para o Google (SEO local).',
  },
  {
    id: 'srv-14',
    orgId: 'org-alllogic',
    name: 'Engenharia e Implantação de Agentes de IA',
    price: 3500.0,
    durationMinutes: 60,
    description: 'Desenvolvimento de agente inteligente corporativo sob medida com base RAG, fluxos de automação n8n/Python e integração ao WhatsApp Oficial e CRM.',
  },
  {
    id: 'srv-15',
    orgId: 'org-alllogic',
    name: 'Consultoria & Gestão Contínua de IA',
    price: 950.0,
    durationMinutes: 45,
    description: 'Auditoria de conversas, calibração periódica de prompts, atualização contínua da base de conhecimento e relatórios mensais de métricas de atendimento.',
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
  {
    id: 'doc-alllogic-2',
    orgId: 'org-alllogic',
    title: 'FAQ Oficial & Matriz de Quebra de Objeções - AllLogic Online.md',
    fileName: 'FAQ-E-OBJECOES-COMERCIAIS.md',
    fileSize: '1.2 MB',
    chunks: 48,
    uploadedAt: '18/10/2026',
    status: 'indexed',
  },
  {
    id: 'doc-alllogic-3',
    orgId: 'org-alllogic',
    title: 'Programa Oficial de Parceiros & Afiliados - AllLogic Online.md',
    fileName: 'PROGRAMA-DE-PARCEIROS-E-AFILIADOS.md',
    fileSize: '4.8 KB',
    chunks: 12,
    uploadedAt: 'Hoje',
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

// Regras padrão da Régua Inteligente Agillex Cobrança
export const initialCobrancaRules: CobrancaRule[] = [
  {
    id: 'rule-preventivo',
    stage: 'preventivo',
    title: 'Aviso Preventivo (D-2)',
    timingLabel: '2 dias antes do vencimento',
    active: true,
    template: 'Olá, *{nome}*! Tudo bem? Passando para lembrar que sua fatura de *{descricao}* no valor de *R$ {valor}* vence em *{vencimento}*.\n\nPara facilitar seu pagamento, aqui está a chave Pix Copia e Cola:\n`{pixCopiaECola}`\n\nQualquer dúvida, conte conosco! ✨',
  },
  {
    id: 'rule-vencimento',
    stage: 'vencimento',
    title: 'Dia do Vencimento (D0)',
    timingLabel: 'No dia do vencimento às 09:00',
    active: true,
    template: 'Olá, *{nome}*! Hoje é o dia do vencimento da sua fatura *{descricao}* no valor de *R$ {valor}*.\n\nPague via Pix de forma instantânea sem juros:\n`{pixCopiaECola}`\n\nCaso já tenha realizado o pagamento, por favor desconsidere este aviso. Obrigado!',
  },
  {
    id: 'rule-recuperacao',
    stage: 'recuperacao',
    title: 'Recuperação Amigável (D+2)',
    timingLabel: '2 dias após o vencimento',
    active: true,
    template: 'Olá, *{nome}*! Notamos que sua fatura de *{descricao}* (vencida em {vencimento}) ainda consta em aberto.\n\nSabemos que a correria do dia a dia acontece! Para regularizar agora sem complicação, utilize o Pix abaixo:\n`{pixCopiaECola}`\n\nSe já realizou ou precisa de alguma ajuda, nos dê um alô por aqui.',
  },
  {
    id: 'rule-confirmado',
    stage: 'confirmado',
    title: 'Confirmação Instantânea (D0 pós-pago)',
    timingLabel: 'Imediato após liquidação do Pix',
    active: true,
    template: 'Obrigado, *{nome}*! 🟢 Recebemos com sucesso a confirmação do seu pagamento de *R$ {valor}* referente a *{descricao}*.\n\nSeu serviço continua ativo e garantido. Tenha um excelente dia!',
  },
];

// Histórico de notificações disparadas pela régua
export const initialCobrancaLogs: CobrancaNotificationLog[] = [
  {
    id: 'log-1',
    orgId: 'org-alllogic',
    customerName: 'Studio Bella Vita',
    customerPhone: '5511999887766',
    paymentId: 'pay_9823412',
    value: 99.9,
    stage: 'confirmado',
    channel: 'whatsapp',
    status: 'sent',
    sentAt: 'Hoje às 14:32',
    description: 'Agillex Agenda Pro — Mensalidade',
  },
  {
    id: 'log-2',
    orgId: 'org-alllogic',
    customerName: 'Dr. Roberto Cardoso',
    customerPhone: '5511988776655',
    paymentId: 'pay_7621453',
    value: 249.9,
    stage: 'preventivo',
    channel: 'whatsapp',
    status: 'sent',
    sentAt: 'Hoje às 09:15',
    description: 'Agillex Hub Pro (Atendimento + CRM)',
  },
];

// Configuração padrão do Agillex Reputação
export const initialReputacaoConfig: ReputacaoConfig = {
  businessName: 'AllLogic Online',
  city: 'São Paulo e Região Metropolitana',
  googleReviewUrl: 'https://g.page/r/alllogiconline/review',
  delayHours: 2,
  autoAiReply: true,
};

// Feedbacks e avaliações recebidas via pesquisa NPS
export const initialReputacaoFeedbacks: ReputacaoFeedback[] = [
  {
    id: 'rep-1',
    orgId: 'org-alllogic',
    customerName: 'Dra. Mariana Vasconcelos',
    customerPhone: '5511991223344',
    rating: 5,
    category: 'promotor',
    googleReviewClicked: true,
    comment: 'Atendimento impecável! O assistente de IA respondeu meus clientes em segundos.',
    createdAt: 'Hoje às 11:40',
    status: 'publicado',
    serviceName: 'Agillex Atende Pro',
    aiResponseDraft: 'Olá, Dra. Mariana! Muito obrigado pela avaliação de 5 estrelas e pelo carinho. É uma honra apoiar sua clínica com tecnologia humanizada!',
  },
  {
    id: 'rep-2',
    orgId: 'org-alllogic',
    customerName: 'Carlos Eduardo Mendes',
    customerPhone: '5511982334455',
    rating: 5,
    category: 'promotor',
    googleReviewClicked: true,
    comment: 'O agendamento integrado com o Google Calendar eliminou todos os conflitos de horário na barbearia.',
    createdAt: 'Ontem às 17:15',
    status: 'publicado',
    serviceName: 'Agillex Agenda',
    aiResponseDraft: 'Grande Carlos, agradecemos demais pelas 5 estrelas! Sucesso total na barbearia.',
  },
  {
    id: 'rep-3',
    orgId: 'org-alllogic',
    customerName: 'Fernanda Rocha',
    customerPhone: '5511973445566',
    rating: 3,
    category: 'neutro',
    googleReviewClicked: false,
    comment: 'Tive uma dúvida na configuração do DNS e demorou um pouco para eu entender.',
    createdAt: 'Ontem às 14:05',
    status: 'resolvido',
    serviceName: 'Hospedagem cPanel',
    aiResponseDraft: 'Cliente acolhida pela equipe técnica no WhatsApp com suporte assistido direto.',
  },
];
