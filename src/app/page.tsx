'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Kanban,
  MessageSquare,
  Calendar,
  Bot,
  QrCode,
  Building2,
  Users,
  Settings,
  Plus,
  Send,
  Pause,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  Search,
  ChevronDown,
  Check,
  TrendingUp,
  FileText,
  UploadCloud,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Bell,
  Sliders,
  DollarSign,
  UserCheck,
  Zap,
  ChevronRight,
  MoreVertical,
  CalendarCheck2
} from 'lucide-react';
import {
  initialOrganizations,
  initialLeads,
  initialMessages,
  initialAppointments,
  initialServices,
  initialKnowledgeDocs,
  initialSaaSClients,
  initialWhatsappInstance,
} from '@/lib/mockData';
import { Organization, Lead, LeadStatus, ChatMessage, Appointment, ServiceItem, KnowledgeDoc, SaaSClient } from '@/types';

export default function MatrizDashboard() {
  // Estado Multi-Tenant (Organização Ativa)
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations);
  const [activeOrgId, setActiveOrgId] = useState<string>('org-matriz');
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);

  // Navegação Principal
  const [activeTab, setActiveTab] = useState<'overview' | 'kanban' | 'livechat' | 'agenda' | 'ai_brain' | 'whatsapp' | 'saas'>('overview');

  // Estados dos Dados
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(initialMessages);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>(initialKnowledgeDocs);
  const [saasClients] = useState<SaaSClient[]>(initialSaaSClients);

  // Estados de Interatividade
  const [selectedLeadId, setSelectedLeadId] = useState<string>('lead-v1');
  const [chatInput, setChatInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [selectedLeadDetails, setSelectedLeadDetails] = useState<Lead | null>(null);
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);
  const [qrCodeRefreshing, setQrCodeRefreshing] = useState(false);
  const [qrCounter, setQrCounter] = useState(1);

  // Organização Atual
  const currentOrg = organizations.find((o) => o.id === activeOrgId) || organizations[0];
  const orgLeads = leads.filter((l) => l.orgId === activeOrgId);
  const orgAppointments = appointments.filter((a) => a.orgId === activeOrgId);
  const orgServices = services.filter((s) => s.orgId === activeOrgId);
  const orgDocs = knowledgeDocs.filter((d) => d.orgId === activeOrgId);

  // Atualizar lead selecionado ao mudar de workspace
  useEffect(() => {
    const firstOrgLead = orgLeads[0];
    if (firstOrgLead) {
      setSelectedLeadId(firstOrgLead.id);
    }
  }, [activeOrgId]);

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || orgLeads[0];
  const currentLeadMessages = selectedLead ? (messages[selectedLead.id] || []) : [];

  // Alternar pausa da IA para um lead (Human Handoff)
  const toggleAiForLead = (leadId: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, aiPaused: !l.aiPaused } : l))
    );
  };

  // Mover lead de status no Kanban
  const moveLeadStatus = (leadId: string, newStatus: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
  };

  // Enviar Mensagem no Live Chat
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !selectedLead) return;

    const userText = chatInput.trim();
    const newMsgId = 'msg-' + Date.now();
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: newMsgId,
      leadId: selectedLead.id,
      sender: selectedLead.aiPaused ? 'human' : 'lead',
      content: userText,
      timestamp,
      status: 'sent',
    };

    setMessages((prev) => ({
      ...prev,
      [selectedLead.id]: [...(prev[selectedLead.id] || []), newMsg],
    }));

    setChatInput('');

    // Se a mensagem foi do lead e a IA estiver ativa, simular resposta inteligente da IA
    if (!selectedLead.aiPaused) {
      setIsAiThinking(true);
      setTimeout(() => {
        let aiReplyText = '';
        let shouldBook = false;

        const lower = userText.toLowerCase();
        if (lower.includes('horário') || lower.includes('amanhã') || lower.includes('agendar') || lower.includes('marcar') || lower.includes('quero')) {
          aiReplyText = `Perfeito, ${selectedLead.name.split(' ')[0]}! Reservei o horário para você com sucesso. Nosso time já confirmou e o agendamento foi sincronizado com a agenda! ✅ Te enviamos um lembrete 1h antes.`;
          shouldBook = true;
        } else if (lower.includes('preço') || lower.includes('valor') || lower.includes('quanto')) {
          const sampleService = orgServices[0]?.name || 'Nossos serviços';
          const samplePrice = orgServices[0]?.price || 350;
          aiReplyText = `O investimento para ${sampleService} é a partir de R$ ${samplePrice}. Trabalhamos com atendimento personalizado. Gostaria de verificar os horários livres desta semana?`;
        } else {
          aiReplyText = `Entendido, ${selectedLead.name.split(' ')[0]}! Como posso te ajudar a avançar com isso hoje? Temos opções para hoje à tarde ou amanhã pela manhã.`;
        }

        const aiMsg: ChatMessage = {
          id: 'ai-' + Date.now(),
          leadId: selectedLead.id,
          sender: 'ai',
          content: aiReplyText,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          status: 'read',
          type: shouldBook ? 'appointment_booked' : 'text',
        };

        setMessages((prev) => ({
          ...prev,
          [selectedLead.id]: [...(prev[selectedLead.id] || []), aiMsg],
        }));

        setIsAiThinking(false);

        // Se marcou horário, atualizar o status no Kanban para 'agendado' e criar o agendamento
        if (shouldBook) {
          moveLeadStatus(selectedLead.id, 'agendado');
          const newApt: Appointment = {
            id: 'apt-' + Date.now(),
            orgId: activeOrgId,
            leadId: selectedLead.id,
            leadName: selectedLead.name,
            serviceName: selectedLead.serviceInterest || 'Consulta / Atendimento',
            date: '2026-10-14',
            time: '16:30',
            durationMinutes: 45,
            status: 'confirmed',
            googleSynced: true,
          };
          setAppointments((prev) => [newApt, ...prev]);
        }
      }, 1200);
    }
  };

  // Simular recarregamento de QR Code do WhatsApp
  const handleRefreshQr = () => {
    setQrCodeRefreshing(true);
    setTimeout(() => {
      setQrCounter((c) => c + 1);
      setQrCodeRefreshing(false);
    }, 800);
  };

  // KPIs calculados
  const totalLeadsCount = orgLeads.length;
  const scheduledCount = orgLeads.filter((l) => l.status === 'agendado').length;
  const inAiChatCount = orgLeads.filter((l) => l.status === 'em_atendimento' || l.status === 'novo').length;
  const followupCount = orgLeads.filter((l) => l.status === 'aguardando_followup').length;
  const totalMrr = saasClients.reduce((acc, curr) => acc + curr.mrr, 0);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-main)' }}>
      {/* 1. SIDEBAR LATERAL NAVEGAÇÃO */}
      <aside
        style={{
          width: '260px',
          borderRight: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Logo & Marca da Plataforma */}
        <div style={{ padding: '20px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)',
            }}
          >
            <Bot size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              MATRIZ OS <span style={{ fontSize: '0.62rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>PRO</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Agente IA + CRM SaaS</div>
          </div>
        </div>

        {/* WORKSPACE SWITCHER MULTI-TENANT */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', letterSpacing: '0.05em' }}>
            Empresa / Workspace
          </div>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: currentOrg.logoColor, flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentOrg.name}
                </span>
              </div>
              <ChevronDown size={15} color="var(--text-muted)" />
            </button>

            {/* Menu Dropdown de Workspaces */}
            {orgDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-hover)',
                  borderRadius: '10px',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 50,
                  overflow: 'hidden',
                  padding: '4px',
                }}
              >
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      setActiveOrgId(org.id);
                      setOrgDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: org.id === activeOrgId ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                      color: org.id === activeOrgId ? '#fff' : 'var(--text-secondary)',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: org.logoColor }} />
                      <span>{org.name}</span>
                    </div>
                    {org.id === activeOrgId && <Check size={14} color="#10B981" />}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
                <button
                  onClick={() => {
                    const newName = prompt('Nome da nova empresa/cliente:');
                    if (newName) {
                      const newOrg: Organization = {
                        id: 'org-' + Date.now(),
                        name: newName,
                        slug: newName.toLowerCase().replace(/\s+/g, '-'),
                        category: 'Empresa Cliente',
                        plan: 'Starter',
                        logoColor: '#F59E0B',
                        whatsappPhone: '+55 11 90000-0000',
                        whatsappStatus: 'qr_ready',
                        aiActive: true,
                        totalLeads: 0,
                      };
                      setOrganizations((prev) => [...prev, newOrg]);
                      setActiveOrgId(newOrg.id);
                      setOrgDropdownOpen(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    color: '#34D399',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <Plus size={14} /> Novo Workspace (Cliente)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Links de Navegação */}
        <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, padding: '0 8px', marginBottom: '4px', letterSpacing: '0.05em' }}>
            Operação da Empresa
          </div>

          <button
            onClick={() => setActiveTab('overview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: activeTab === 'overview' ? 'var(--emerald-subtle)' : 'transparent',
              color: activeTab === 'overview' ? '#34D399' : 'var(--text-secondary)',
              fontWeight: activeTab === 'overview' ? 600 : 400,
              border: activeTab === 'overview' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
            }}
          >
            <LayoutDashboard size={18} />
            <span style={{ fontSize: '0.88rem' }}>Visão Geral</span>
          </button>

          <button
            onClick={() => setActiveTab('kanban')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: activeTab === 'kanban' ? 'var(--emerald-subtle)' : 'transparent',
              color: activeTab === 'kanban' ? '#34D399' : 'var(--text-secondary)',
              fontWeight: activeTab === 'kanban' ? 600 : 400,
              border: activeTab === 'kanban' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Kanban size={18} />
              <span style={{ fontSize: '0.88rem' }}>CRM Kanban</span>
            </div>
            <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.1)', padding: '1px 6px', borderRadius: '99px', color: '#fff' }}>
              {orgLeads.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('livechat')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: activeTab === 'livechat' ? 'var(--emerald-subtle)' : 'transparent',
              color: activeTab === 'livechat' ? '#34D399' : 'var(--text-secondary)',
              fontWeight: activeTab === 'livechat' ? 600 : 400,
              border: activeTab === 'livechat' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageSquare size={18} />
              <span style={{ fontSize: '0.88rem' }}>Live Chat WhatsApp</span>
            </div>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
          </button>

          <button
            onClick={() => setActiveTab('agenda')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: activeTab === 'agenda' ? 'var(--emerald-subtle)' : 'transparent',
              color: activeTab === 'agenda' ? '#34D399' : 'var(--text-secondary)',
              fontWeight: activeTab === 'agenda' ? 600 : 400,
              border: activeTab === 'agenda' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={18} />
              <span style={{ fontSize: '0.88rem' }}>Agendamentos</span>
            </div>
            <span style={{ fontSize: '0.72rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', padding: '1px 6px', borderRadius: '99px' }}>
              {orgAppointments.length}
            </span>
          </button>

          <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, padding: '14px 8px 4px', letterSpacing: '0.05em' }}>
            Inteligência & Conexão
          </div>

          <button
            onClick={() => setActiveTab('ai_brain')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: activeTab === 'ai_brain' ? 'var(--emerald-subtle)' : 'transparent',
              color: activeTab === 'ai_brain' ? '#34D399' : 'var(--text-secondary)',
              fontWeight: activeTab === 'ai_brain' ? 600 : 400,
              border: activeTab === 'ai_brain' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
            }}
          >
            <Bot size={18} />
            <span style={{ fontSize: '0.88rem' }}>Cérebro IA & RAG</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: activeTab === 'whatsapp' ? 'var(--emerald-subtle)' : 'transparent',
              color: activeTab === 'whatsapp' ? '#34D399' : 'var(--text-secondary)',
              fontWeight: activeTab === 'whatsapp' ? 600 : 400,
              border: activeTab === 'whatsapp' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <QrCode size={18} />
              <span style={{ fontSize: '0.88rem' }}>WhatsApp (QR Code)</span>
            </div>
            <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 600 }}>ONLINE</span>
          </button>

          <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, padding: '14px 8px 4px', letterSpacing: '0.05em' }}>
            Gestão Master (SaaS & Agência)
          </div>

          <button
            onClick={() => setActiveTab('saas')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: activeTab === 'saas' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              color: activeTab === 'saas' ? '#A78BFA' : 'var(--text-secondary)',
              fontWeight: activeTab === 'saas' ? 600 : 400,
              border: activeTab === 'saas' ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={18} />
              <span style={{ fontSize: '0.88rem' }}>Painel SaaS & MRR</span>
            </div>
            <span style={{ fontSize: '0.65rem', background: '#8B5CF6', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
              ADMIN
            </span>
          </button>
        </nav>

        {/* Rodapé da Sidebar com Status do Usuário */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>
              D
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>Dresler</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Super Admin</div>
            </div>
          </div>
          <button style={{ color: 'var(--text-muted)' }} title="Configurações">
            <Settings size={16} />
          </button>
        </div>
      </aside>

      {/* 2. ÁREA CENTRAL DE CONTEÚDO */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar Superior com Status do Sistema */}
        <header
          style={{
            height: '64px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
              {activeTab === 'overview' && 'Visão Geral & Métricas'}
              {activeTab === 'kanban' && 'Funil de Vendas CRM (Kanban)'}
              {activeTab === 'livechat' && 'Live Chat WhatsApp & Human Handoff'}
              {activeTab === 'agenda' && 'Gestão de Agendamentos & Calendário'}
              {activeTab === 'ai_brain' && 'Cérebro da IA & Base de Conhecimento (RAG)'}
              {activeTab === 'whatsapp' && 'Conexão WhatsApp (Evolution API)'}
              {activeTab === 'saas' && 'Painel SaaS & Gestão de Clientes'}
            </h1>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '12px' }}>
              Empresa: <strong style={{ color: '#fff' }}>{currentOrg.name}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Status Conexão WhatsApp */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '99px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 6px #10B981' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34D399' }}>WhatsApp Conectado</span>
            </div>

            {/* Status Agente de IA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '99px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
              <Sparkles size={13} color="#60A5FA" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#60A5FA' }}>Agente IA Ativo</span>
            </div>

            {/* Botão Novo Lead */}
            <button
              onClick={() => setNewLeadModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 600,
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Plus size={15} /> Novo Lead
            </button>
          </div>
        </header>

        {/* CORPO PRINCIPAL COM CONTEÚDO DA ABA SELECIONADA */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* ======================================================== */}
          {/* ABA 1: VISÃO GERAL (DASHBOARD & KPIS)                    */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Banner de Destaque da Operação */}
              <div
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      Automação em Execução
                    </span>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '2px 8px', borderRadius: '99px' }}>
                      Multi-Tenant Ativo
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                    O Agente de IA está atendendo seus clientes no WhatsApp 24/7
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '640px' }}>
                    Contatos que chegam pelo WhatsApp entram diretamente no CRM, são qualificados sem cardápio de &quot;digite 1&quot;, recebem follow-up automático se esfriarem e concluem agendamentos sozinhos.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setActiveTab('livechat')}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '10px',
                      backgroundColor: '#10B981',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <MessageSquare size={16} /> Ver Chat Ao Vivo
                  </button>
                  <button
                    onClick={() => setActiveTab('kanban')}
                    style={{
                      padding: '12px 18px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--border-hover)',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                    }}
                  >
                    Abrir Funil Kanban
                  </button>
                </div>
              </div>

              {/* Grid de 4 Cards de Métricas Principais */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
                <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Total de Leads no CRM</span>
                    <Users size={18} color="#38BDF8" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>{totalLeadsCount}</div>
                  <div style={{ fontSize: '0.75rem', color: '#34D399', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                    <TrendingUp size={13} /> +18% esta semana
                  </div>
                </div>

                <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Agendamentos Fechados</span>
                    <CalendarCheck2 size={18} color="#34D399" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>{scheduledCount}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    Taxa de conversão: <strong style={{ color: '#fff' }}>{totalLeadsCount ? Math.round((scheduledCount / totalLeadsCount) * 100) : 0}%</strong>
                  </div>
                </div>

                <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Em Atendimento com IA</span>
                    <Bot size={18} color="#A78BFA" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>{inAiChatCount}</div>
                  <div style={{ fontSize: '0.75rem', color: '#A78BFA', marginTop: '6px' }}>
                    Tempo médio de resposta: <strong>1.4 seg</strong>
                  </div>
                </div>

                <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Resgatados por Follow-up</span>
                    <RefreshCw size={18} color="#FBBF24" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>{followupCount + 2}</div>
                  <div style={{ fontSize: '0.75rem', color: '#FBBF24', marginTop: '6px' }}>
                    R$ {(followupCount + 2) * 350} recuperados este mês
                  </div>
                </div>
              </div>

              {/* Divisão em 2 Colunas: Últimos Leads & Agendamentos Próximos */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                {/* Coluna 1: Leads Recentes */}
                <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>Últimas Oportunidades do WhatsApp</h3>
                    <button onClick={() => setActiveTab('kanban')} style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 600 }}>
                      Ver todos no Kanban &rarr;
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {orgLeads.slice(0, 4).map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => {
                          setSelectedLeadId(lead.id);
                          setActiveTab('livechat');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          backgroundColor: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>
                            {lead.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>{lead.name}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{lead.lastMessage.slice(0, 42)}...</div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: '99px',
                              fontWeight: 600,
                              backgroundColor:
                                lead.status === 'agendado' ? 'rgba(16, 185, 129, 0.15)' :
                                lead.status === 'em_atendimento' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color:
                                lead.status === 'agendado' ? '#34D399' :
                                lead.status === 'em_atendimento' ? '#60A5FA' : '#FBBF24',
                            }}
                          >
                            {lead.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{lead.lastMessageTime}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coluna 2: Agendamentos Confirmados */}
                <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>Próximos Agendamentos</h3>
                    <span style={{ fontSize: '0.72rem', color: '#34D399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} /> Sincronizado Google Calendar
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {orgAppointments.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Nenhum agendamento pendente para esta empresa.
                      </div>
                    ) : (
                      orgAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '10px',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>{apt.leadName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{apt.serviceName}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34D399' }}>{apt.time}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{apt.date}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 2: CRM KANBAN (FUNIL DE VENDAS COM DRAG & CLICK)     */}
          {/* ======================================================== */}
          {activeTab === 'kanban' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  Gerencie o fluxo de atendimento da <strong>{currentOrg.name}</strong>. Os leads avançam sozinhos conforme interagem com o agente de IA.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setNewLeadModalOpen(true)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#10B981',
                      color: '#fff',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Plus size={15} /> Adicionar Lead
                  </button>
                </div>
              </div>

              {/* Colunas do Kanban */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, minmax(260px, 1fr))',
                  gap: '16px',
                  alignItems: 'flex-start',
                  overflowX: 'auto',
                  paddingBottom: '16px',
                }}
              >
                {[
                  { id: 'novo', title: 'Novo Lead', color: '#38BDF8', desc: 'Chegou pelo WhatsApp' },
                  { id: 'em_atendimento', title: 'Em Atendimento IA', color: '#A78BFA', desc: 'Agente conversando' },
                  { id: 'aguardando_followup', title: 'Follow-up Automático', color: '#FBBF24', desc: 'Cliente parou de falar' },
                  { id: 'agendado', title: 'Agendado / Fechado', color: '#34D399', desc: 'Horário confirmado' },
                ].map((col) => {
                  const colLeads = orgLeads.filter((l) => l.status === col.id);
                  return (
                    <div
                      key={col.id}
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-subtle)',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: '480px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: col.color }} />
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{col.title}</h4>
                        </div>
                        <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.1)', padding: '2px 7px', borderRadius: '99px', color: '#fff', fontWeight: 600 }}>
                          {colLeads.length}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '14px' }}>{col.desc}</div>

                      {/* Lista de Cards da Coluna */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                        {colLeads.map((lead) => (
                          <div
                            key={lead.id}
                            style={{
                              padding: '12px',
                              borderRadius: '10px',
                              backgroundColor: 'var(--bg-surface-elevated)',
                              border: '1px solid var(--border-subtle)',
                              boxShadow: 'var(--shadow-sm)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>{lead.name}</div>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{lead.lastMessageTime}</span>
                            </div>

                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                              {lead.lastMessage}
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {lead.tags.map((t, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: '0.65rem',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.07)',
                                    color: 'var(--text-secondary)',
                                  }}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>

                            {/* Ações Rápidas no Card */}
                            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <button
                                onClick={() => {
                                  setSelectedLeadId(lead.id);
                                  setActiveTab('livechat');
                                }}
                                style={{
                                  fontSize: '0.74rem',
                                  color: '#34D399',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <MessageSquare size={13} /> Abrir Chat
                              </button>

                              {/* Mover para próximo estágio */}
                              <button
                                onClick={() => {
                                  const stages: LeadStatus[] = ['novo', 'em_atendimento', 'aguardando_followup', 'agendado'];
                                  const currIdx = stages.indexOf(lead.status);
                                  const nextStage = stages[(currIdx + 1) % stages.length];
                                  moveLeadStatus(lead.id, nextStage);
                                }}
                                style={{
                                  fontSize: '0.72rem',
                                  color: 'var(--text-muted)',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                }}
                                title="Avançar etapa no funil"
                              >
                                Mover &rarr;
                              </button>
                            </div>
                          </div>
                        ))}

                        {colLeads.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-muted)', fontSize: '0.78rem', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>
                            Nenhum contato nesta etapa
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 3: LIVE CHAT WHATSAPP COM HUMAN HANDOFF              */}
          {/* ======================================================== */}
          {activeTab === 'livechat' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '320px 1fr',
                height: 'calc(100vh - 120px)',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '14px',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
              }}
            >
              {/* Coluna Esquerda: Lista de Conversas do WhatsApp */}
              <div style={{ borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>Conversas Ativas</span>
                    <span style={{ fontSize: '0.7rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                      Online
                    </span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                    <input
                      type="text"
                      placeholder="Buscar por nome ou telefone..."
                      style={{
                        width: '100%',
                        padding: '8px 10px 8px 32px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-main)',
                        border: '1px solid var(--border-subtle)',
                        color: '#fff',
                        fontSize: '0.8rem',
                      }}
                    />
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {orgLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: lead.id === selectedLeadId ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                        borderLeft: lead.id === selectedLeadId ? '3px solid #10B981' : '3px solid transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {lead.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.86rem', color: '#fff' }}>{lead.name}</span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{lead.lastMessageTime}</span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lead.lastMessage}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coluna Direita: Janela do Chat Ao Vivo */}
              {selectedLead ? (
                <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#0B141A' }}>
                  {/* Header do Chat com o Lead & BOTÃO HUMAN HANDOFF */}
                  <div
                    style={{
                      padding: '10px 18px',
                      backgroundColor: '#202C33',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>
                        {selectedLead.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#fff' }}>{selectedLead.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                          {selectedLead.phone} · <span style={{ color: '#34D399' }}>{selectedLead.serviceInterest}</span>
                        </div>
                      </div>
                    </div>

                    {/* BOTÃO DE CONTROLE: HUMAN HANDOFF (PAUSAR / RETOMAR IA) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        onClick={() => toggleAiForLead(selectedLead.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          backgroundColor: selectedLead.aiPaused ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          border: selectedLead.aiPaused ? '1px solid #F43F5E' : '1px solid #10B981',
                          color: selectedLead.aiPaused ? '#FDA4AF' : '#6EE7B7',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                        }}
                      >
                        {selectedLead.aiPaused ? (
                          <>
                            <Play size={14} /> Atendente Humano no Controle (IA Pausada)
                          </>
                        ) : (
                          <>
                            <Pause size={14} /> IA Atendendo Automaticamente
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setSelectedLeadDetails(selectedLead)}
                        style={{ padding: '6px', borderRadius: '6px', color: 'rgba(255, 255, 255, 0.6)' }}
                        title="Ver detalhes do lead"
                      >
                        <Sliders size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Área das Mensagens (Estilo WhatsApp) */}
                  <div
                    style={{
                      flex: 1,
                      padding: '20px 24px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02) 1px, transparent 1px)`,
                      backgroundSize: '24px 24px',
                    }}
                  >
                    <div style={{ alignSelf: 'center', padding: '4px 12px', borderRadius: '6px', backgroundColor: '#182229', color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.68rem', marginBottom: '8px' }}>
                      Criptografia de ponta a ponta · Conectado via Evolution API
                    </div>

                    {currentLeadMessages.map((m) => {
                      const isMe = m.sender === 'ai' || m.sender === 'human';
                      return (
                        <div
                          key={m.id}
                          style={{
                            maxWidth: '70%',
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            backgroundColor: isMe ? '#005C4B' : '#202C33',
                            color: '#fff',
                            padding: '8px 12px 6px',
                            borderRadius: '8px',
                            borderTopRightRadius: isMe ? '0px' : '8px',
                            borderTopLeftRadius: !isMe ? '0px' : '8px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                          }}
                        >
                          {/* Identificação de quem respondeu */}
                          {isMe && (
                            <div style={{ fontSize: '0.65rem', color: m.sender === 'ai' ? '#34D399' : '#93C5FD', fontWeight: 600, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {m.sender === 'ai' ? <Sparkles size={11} /> : <UserCheck size={11} />}
                              {m.sender === 'ai' ? 'Agente de IA' : 'Atendente Humano'}
                            </div>
                          )}

                          <div style={{ fontSize: '0.86rem', lineHeight: 1.4 }}>{m.content}</div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '0.62rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                            <span>{m.timestamp}</span>
                            {isMe && <Check size={12} color="#34D399" />}
                          </div>
                        </div>
                      );
                    })}

                    {/* Indicador de IA Digitando */}
                    {isAiThinking && (
                      <div style={{ alignSelf: 'flex-end', backgroundColor: '#005C4B', padding: '8px 14px', borderRadius: '8px', color: '#6EE7B7', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={14} className="live-indicator" /> IA processando resposta contextual...
                      </div>
                    )}
                  </div>

                  {/* Input de Envio de Mensagem */}
                  <form
                    onSubmit={handleSendMessage}
                    style={{
                      padding: '12px 18px',
                      backgroundColor: '#202C33',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={selectedLead.aiPaused ? 'Digite como atendente humano...' : 'Simule uma mensagem do cliente no WhatsApp...'}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#2A3942',
                        border: 'none',
                        color: '#fff',
                        fontSize: '0.88rem',
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#00A884',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Selecione uma conversa para visualizar
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 4: AGENDAMENTOS & SINCRONIZAÇÃO GOOGLE CALENDAR      */}
          {/* ======================================================== */}
          {activeTab === 'agenda' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Agenda Integrada</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Consultas e reuniões fechadas pelo agente de IA no WhatsApp são sincronizadas diretamente aqui e no Google Calendar.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60A5FA', fontSize: '0.8rem', fontWeight: 600 }}>
                  <CalendarCheck2 size={16} /> Google Calendar: Conectado
                </div>
              </div>

              {/* Tabela de Agendamentos */}
              <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 16px' }}>Cliente</th>
                      <th style={{ padding: '12px 16px' }}>Serviço Solicitado</th>
                      <th style={{ padding: '12px 16px' }}>Data & Horário</th>
                      <th style={{ padding: '12px 16px' }}>Duração</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 16px' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgAppointments.map((apt) => (
                      <tr key={apt.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>{apt.leadName}</td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{apt.serviceName}</td>
                        <td style={{ padding: '14px 16px', color: '#34D399', fontWeight: 600 }}>{apt.date} às {apt.time}</td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{apt.durationMinutes} min</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>
                            Confirmado (IA)
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button style={{ color: '#38BDF8', fontSize: '0.75rem', fontWeight: 600 }}>Remarcar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 5: CÉREBRO DA IA & RAG (BASE DE CONHECIMENTO)        */}
          {/* ======================================================== */}
          {activeTab === 'ai_brain' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              {/* Lado Esquerdo: Configuração do Agente */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                    Personalidade & Tom de Voz ({currentOrg.name})
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Instruções primárias para o modelo de IA responder aos clientes da sua empresa ou de clientes da sua agência.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                        Prompt de Sistema (System Prompt)
                      </label>
                      <textarea
                        rows={5}
                        defaultValue={`Você é o assistente virtual da ${currentOrg.name}. Seu objetivo é tirar dúvidas sobre serviços, prazos e valores com cordialidade, conduzindo o cliente gentilmente até o agendamento de uma consulta/reunião. Seja objetivo, não use menus tipo 'digite 1' e converse como um humano simpático.`}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          color: '#fff',
                          fontSize: '0.82rem',
                          fontFamily: 'inherit',
                          lineHeight: 1.4,
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                          Tom de Voz
                        </label>
                        <select
                          defaultValue="amigavel"
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-subtle)',
                            color: '#fff',
                            fontSize: '0.82rem',
                          }}
                        >
                          <option value="amigavel">Amigável & Humanizado</option>
                          <option value="formal">Formal & Executivo</option>
                          <option value="vendedor">Comercial & Focado em Fechamento</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                          Tempo de Follow-up se o lead sumir
                        </label>
                        <select
                          defaultValue="120"
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-subtle)',
                            color: '#fff',
                            fontSize: '0.82rem',
                          }}
                        >
                          <option value="30">Após 30 minutos</option>
                          <option value="120">Após 2 horas (Recomendado)</option>
                          <option value="1440">Após 24 horas</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={() => alert('Configurações do agente salvas com sucesso!')}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        backgroundColor: '#10B981',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        alignSelf: 'flex-start',
                      }}
                    >
                      Salvar Instruções da IA
                    </button>
                  </div>
                </div>

                {/* Catálogo de Serviços Cadastrados */}
                <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Serviços & Preços Cadastrados</h3>
                    <button
                      onClick={() => {
                        const sName = prompt('Nome do serviço:');
                        const sPrice = prompt('Valor (R$):');
                        if (sName && sPrice) {
                          setServices((prev) => [
                            ...prev,
                            {
                              id: 's-' + Date.now(),
                              orgId: activeOrgId,
                              name: sName,
                              price: Number(sPrice),
                              durationMinutes: 45,
                              description: 'Cadastrado pelo usuário',
                            },
                          ]);
                        }
                      }}
                      style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 600 }}
                    >
                      + Novo Serviço
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {orgServices.map((srv) => (
                      <div
                        key={srv.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{srv.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{srv.durationMinutes} min de atendimento</div>
                        </div>
                        <div style={{ fontWeight: 700, color: '#34D399', fontSize: '0.9rem' }}>
                          R$ {srv.price}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lado Direito: Base de Conhecimento RAG (Upload de Documentos) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <FileText size={18} color="#38BDF8" />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Base de Conhecimento (RAG)</h3>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Envie PDFs, tabelas de preço, cardápios ou políticas da empresa. A IA consulta esses arquivos em tempo real e não inventa informações.
                  </p>

                  {/* Dropzone Upload */}
                  <div
                    onClick={() => {
                      const fTitle = prompt('Nome do documento PDF para indexar:');
                      if (fTitle) {
                        setKnowledgeDocs((prev) => [
                          ...prev,
                          {
                            id: 'doc-' + Date.now(),
                            orgId: activeOrgId,
                            title: fTitle + '.pdf',
                            fileName: fTitle.toLowerCase().replace(/\s+/g, '_') + '.pdf',
                            fileSize: '1.2 MB',
                            chunks: 35,
                            uploadedAt: 'Hoje',
                            status: 'indexed',
                          },
                        ]);
                      }
                    }}
                    style={{
                      border: '2px dashed rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      padding: '24px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      marginBottom: '16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <UploadCloud size={32} color="#10B981" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Clique para enviar arquivo (PDF, TXT, DOCX)</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Indexação vetorial automática</div>
                  </div>

                  {/* Lista de Documentos Indexados */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {orgDocs.map((doc) => (
                      <div
                        key={doc.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FileText size={16} color="#60A5FA" />
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{doc.title}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{doc.fileSize} · {doc.chunks} fragmentos semânticos</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.68rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>
                          Indexado
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 6: CONEXÃO WHATSAPP (EVOLUTION API / QR CODE)        */}
          {/* ======================================================== */}
          {activeTab === 'whatsapp' && (
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Conexão de WhatsApp (Evolution API)</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Conecte o número de WhatsApp da empresa <strong>{currentOrg.name}</strong> lendo o QR Code abaixo com seu celular.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                    Instância Conectada
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '28px', alignItems: 'center' }}>
                  {/* Bloco do QR Code */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '210px',
                        height: '210px',
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      }}
                    >
                      {qrCodeRefreshing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#090D16' }}>
                          <RefreshCw size={24} className="live-indicator" />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Atualizando QR Code...</span>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center' }}>
                          {/* QR Code SVG Visual Pattern */}
                          <svg viewBox="0 0 100 100" width="170" height="170">
                            <rect width="100" height="100" fill="#fff" />
                            <path d="M10 10h30v30h-30z M50 10h10v10h-10z M70 10h20v20h-20z M20 20h10v10h-10z M80 20h10v10h-10z M10 60h30v30h-30z M20 70h10v10h-10z M50 50h20v10h-20z M80 50h10v20h-10z M50 70h10v20h-10z M70 80h20v10h-20z" fill="#000" />
                          </svg>
                          <div style={{ fontSize: '0.65rem', color: '#555', fontWeight: 600, marginTop: '4px' }}>
                            Código #{qrCounter} · Expira em 45s
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleRefreshQr}
                      style={{
                        fontSize: '0.76rem',
                        color: '#34D399',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <RefreshCw size={14} /> Gerar Novo QR Code
                    </button>
                  </div>

                  {/* Informações da Conexão */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Número Conectado</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{currentOrg.whatsappPhone}</div>
                    </div>

                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Provedor de Conexão</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38BDF8' }}>Evolution API (Self-Hosted / Custo R$ 0 de API)</div>
                    </div>

                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Status dos Webhooks</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#34D399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={14} /> Ativo e recebendo mensagens em tempo real
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 7: GESTÃO SAAS & AGÊNCIA (SUPER ADMIN)               */}
          {/* ======================================================== */}
          {activeTab === 'saas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#A78BFA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Painel do Dono do SaaS & Agência
                  </span>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#fff', margin: '4px 0 6px' }}>
                    Faturamento Recorrente Mensal (MRR)
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    Aqui você gerencia todos os clientes da sua agência e assinantes da plataforma, planos e faturamento integrado.
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>MRR Total Ativo</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#34D399', letterSpacing: '-0.03em' }}>
                    R$ {totalMrr.toLocaleString('pt-BR')}
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mês</span>
                  </div>
                </div>
              </div>

              {/* Tabela de Assinantes SaaS e Clientes de Agência */}
              <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Empresas Cadastradas na Plataforma</h3>
                  <button
                    onClick={() => {
                      const cName = prompt('Nome do novo cliente / empresa:');
                      const cPlan = prompt('Plano (Starter, Pro, Agência VIP):') || 'Starter';
                      if (cName) {
                        alert(`Cliente ${cName} cadastrado com sucesso no plano ${cPlan}!`);
                      }
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#8B5CF6',
                      color: '#fff',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    + Adicionar Assinante
                  </button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 16px' }}>Empresa / Cliente</th>
                      <th style={{ padding: '12px 16px' }}>Plano</th>
                      <th style={{ padding: '12px 16px' }}>Instâncias WhatsApp</th>
                      <th style={{ padding: '12px 16px' }}>Leads este Mês</th>
                      <th style={{ padding: '12px 16px' }}>Mensalidade (MRR)</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {saasClients.map((client) => (
                      <tr key={client.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{client.company}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{client.name} · {client.email}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: 600,
                              backgroundColor:
                                client.plan === 'Agência VIP' ? 'rgba(139, 92, 246, 0.2)' :
                                client.plan === 'Pro' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                              color:
                                client.plan === 'Agência VIP' ? '#C4B5FD' :
                                client.plan === 'Pro' ? '#93C5FD' : '#E2E8F0',
                            }}
                          >
                            {client.plan}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{client.instancesCount} número(s)</td>
                        <td style={{ padding: '14px 16px', color: '#fff', fontWeight: 600 }}>{client.leadsThisMonth}</td>
                        <td style={{ padding: '14px 16px', color: '#34D399', fontWeight: 700 }}>R$ {client.mrr}/mês</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>
                            Ativo
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL ADICIONAR NOVO LEAD */}
      {newLeadModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              width: '420px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-hover)',
              borderRadius: '14px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Adicionar Novo Lead</h3>
              <button onClick={() => setNewLeadModalOpen(false)} style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>&times;</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                const phone = formData.get('phone') as string;
                const service = formData.get('service') as string;

                if (name && phone) {
                  const newLead: Lead = {
                    id: 'lead-' + Date.now(),
                    orgId: activeOrgId,
                    name,
                    phone,
                    avatar: '',
                    status: 'novo',
                    tags: ['Manual', 'WhatsApp'],
                    serviceInterest: service || 'Interesse Geral',
                    lastMessage: 'Lead cadastrado manualmente no CRM.',
                    lastMessageTime: 'Agora',
                    aiPaused: false,
                    unreadCount: 0,
                    createdAt: 'Hoje',
                  };
                  setLeads((prev) => [newLead, ...prev]);
                  setSelectedLeadId(newLead.id);
                  setNewLeadModalOpen(false);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Nome Completo</label>
                <input required name="name" placeholder="Ex: Rodrigo Tavares" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.85rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Telefone WhatsApp</label>
                <input required name="phone" placeholder="+55 11 99999-8888" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.85rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Serviço de Interesse</label>
                <input name="service" placeholder="Ex: Consulta ou Consultoria" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.85rem' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setNewLeadModalOpen(false)} style={{ padding: '8px 14px', borderRadius: '8px', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#10B981', color: '#fff', fontSize: '0.82rem', fontWeight: 600 }}>Salvar Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
