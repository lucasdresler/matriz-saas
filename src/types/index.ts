export type LeadStatus = 
  | 'novo'
  | 'em_atendimento'
  | 'aguardando_followup'
  | 'agendado'
  | 'concluido'
  | 'perdido';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  category: string;
  plan: 'Starter' | 'Pro' | 'Agência VIP' | 'Enterprise';
  logoColor: string;
  whatsappPhone: string;
  whatsappStatus: 'connected' | 'qr_ready' | 'disconnected';
  aiActive: boolean;
  totalLeads: number;
}

export interface Lead {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  email?: string;
  avatar: string;
  status: LeadStatus;
  tags: string[];
  serviceInterest: string;
  lastMessage: string;
  lastMessageTime: string;
  aiPaused: boolean;
  unreadCount: number;
  estimatedValue?: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  leadId: string;
  sender: 'lead' | 'ai' | 'human';
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'audio' | 'appointment_booked';
  audioDuration?: string;
}

export interface Appointment {
  id: string;
  orgId: string;
  leadId: string;
  leadName: string;
  serviceName: string;
  date: string;
  time: string;
  durationMinutes: number;
  status: 'confirmed' | 'pending' | 'canceled';
  googleSynced: boolean;
  location?: string;
}

export interface ServiceItem {
  id: string;
  orgId: string;
  name: string;
  price: number;
  durationMinutes: number;
  description: string;
}

export interface KnowledgeDoc {
  id: string;
  orgId: string;
  title: string;
  fileName: string;
  fileSize: string;
  chunks: number;
  uploadedAt: string;
  status: 'indexed' | 'processing';
}

export interface WhatsappInstance {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  status: 'connected' | 'qr_ready' | 'disconnected';
  battery: number;
  provider: 'Evolution API (Docker)' | 'Meta Cloud API';
  lastPing: string;
}

export interface SaaSClient {
  id: string;
  name: string;
  company: string;
  email: string;
  plan: 'Starter' | 'Pro' | 'Agência VIP';
  mrr: number;
  status: 'active' | 'trial' | 'overdue';
  instancesCount: number;
  leadsThisMonth: number;
  createdAt: string;
}
