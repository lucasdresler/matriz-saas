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
  CalendarCheck2,
  Menu,
  X,
  ArrowLeft,
  Copy,
  CheckCheck,
  Layers,
  MapPin,
  Loader2,
  Trash2,
  Download,
  Pencil
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
  const [activeOrgId, setActiveOrgId] = useState<string>('org-alllogic');
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);

  // Navegação Principal (Inicia direto no Funil CRM para o trabalho diário)
  const [activeTab, setActiveTab] = useState<'overview' | 'kanban' | 'livechat' | 'agenda' | 'ai_brain' | 'whatsapp' | 'saas'>('kanban');

  // Estados dos Dados com Persistência em localStorage
  const [leads, setLeads] = useState<Lead[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agillex_hub_leads_prod');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
    }
    return initialLeads;
  });

  // Salva automaticamente qualquer alteração nos leads no navegador
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('agillex_hub_leads_prod', JSON.stringify(leads));
    }
  }, [leads]);

  // Sincronização em tempo real com o backend do Hub (/api/leads)
  useEffect(() => {
    let isMounted = true;
    let initialSyncDone = false;

    const syncLeads = async () => {
      try {
        const res = await fetch('/api/leads');
        if (!res.ok) return;
        const data = await res.json();
        if (data?.success && isMounted) {
          if (Array.isArray(data.leads)) {
            // Se o backend ainda estiver vazio e o usuário tiver leads minerados no navegador, sincronizar para o banco
            if (data.leads.length === 0 && !initialSyncDone) {
              const localSaved = typeof window !== 'undefined' ? localStorage.getItem('agillex_hub_leads_prod') : null;
              if (localSaved) {
                try {
                  const parsed = JSON.parse(localSaved);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    fetch('/api/leads', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ syncAll: parsed }),
                    }).catch(() => {});
                  }
                } catch (e) {}
              }
              initialSyncDone = true;
            } else if (data.leads.length > 0) {
              setLeads((prevLeads) => {
                const backendMap = new Map<string, Lead>();
                data.leads.forEach((l: Lead) => {
                  const phoneDigits = l.phone.replace(/\D/g, '').slice(-8);
                  backendMap.set(l.id, l);
                  if (phoneDigits) backendMap.set(phoneDigits, l);
                });

                // Preserva leads locais não sincronizados ainda
                const merged: Lead[] = [...data.leads];
                prevLeads.forEach((localLead) => {
                  const phoneDigits = localLead.phone.replace(/\D/g, '').slice(-8);
                  if (!backendMap.has(localLead.id) && (!phoneDigits || !backendMap.has(phoneDigits))) {
                    merged.push(localLead);
                  }
                });
                return merged;
              });
            }
          }

          if (data.messages && typeof data.messages === 'object') {
            setMessages((prev) => ({
              ...prev,
              ...data.messages,
            }));
          }
        }
      } catch (err) {
        console.warn('Falha na sincronização de leads:', err);
      }
    };

    syncLeads();
    const interval = setInterval(syncLeads, 8000); // Polling a cada 8s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [editLeadName, setEditLeadName] = useState('');
  const [editLeadPhone, setEditLeadPhone] = useState('');
  const [editLeadEmail, setEditLeadEmail] = useState('');
  const [editLeadService, setEditLeadService] = useState('');
  const [editLeadValue, setEditLeadValue] = useState<string>('');
  const [editLeadMessage, setEditLeadMessage] = useState('');
  const [kanbanSearch, setKanbanSearch] = useState('');
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);
  const [qrCodeRefreshing, setQrCodeRefreshing] = useState(false);
  const [qrCounter, setQrCounter] = useState(1);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileChatView, setMobileChatView] = useState<'list' | 'chat'>('list');
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleTime, setRescheduleTime] = useState<string>('');
  const [rescheduleSuccess, setRescheduleSuccess] = useState<boolean>(false);
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);

  // Estados do Prospector Google Maps
  const [prospectorModalOpen, setProspectorModalOpen] = useState(false);
  const [prospectorNiche, setProspectorNiche] = useState('');
  const [prospectorCity, setProspectorCity] = useState('');
  const [prospectorLimit, setProspectorLimit] = useState(15);
  const [prospectorOnlyNoSite, setProspectorOnlyNoSite] = useState(false);
  const [isProspecting, setIsProspecting] = useState(false);
  const [prospectorError, setProspectorError] = useState('');
  const [prospectorSuccessMsg, setProspectorSuccessMsg] = useState('');

  // Handler de Prospecção no Google Maps
  const handleRunProspector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prospectorNiche.trim() || !prospectorCity.trim()) {
      setProspectorError('Por favor, informe o nicho e a cidade desejada.');
      return;
    }

    setIsProspecting(true);
    setProspectorError('');
    setProspectorSuccessMsg('');

    try {
      const res = await fetch('/api/prospector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nicho: prospectorNiche,
          cidade: prospectorCity,
          limite: prospectorLimit,
          semSite: prospectorOnlyNoSite,
          orgId: activeOrgId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao executar a prospecção no Google Maps.');
      }

      if (data.leads && data.leads.length > 0) {
        setLeads((prev) => [...data.leads, ...prev]);
        setProspectorSuccessMsg(`✓ ${data.leads.length} leads minerados e adicionados ao Kanban com sucesso!`);
        setTimeout(() => {
          setProspectorModalOpen(false);
          setProspectorSuccessMsg('');
          setProspectorNiche('');
          setProspectorCity('');
        }, 2200);
      } else {
        setProspectorError('Nenhum resultado foi encontrado para os critérios informados.');
      }
    } catch (err: any) {
      setProspectorError(err.message || 'Falha na comunicação com o robô de prospecção.');
    } finally {
      setIsProspecting(false);
    }
  };

  // Importador de Planilhas (CSV / JSON gerados pelo Prospector)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        // Se for JSON
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          const rawList = Array.isArray(parsed) ? parsed : (parsed.leads || []);
          const importedLeads: Lead[] = rawList.map((item: any, idx: number) => ({
            id: `lead-import-${Date.now()}-${idx}`,
            orgId: activeOrgId,
            name: item.Nome || item.name || 'Empresa Importada',
            phone: item.Telefone || item.phone || 'N/A',
            email: item.Email || item.email || '',
            status: 'novo',
            tags: ['Planilha', item.Categoria_Google || item.Nicho_Buscado || 'Google Maps'],
            serviceInterest: item.Oferta_Recomendada || item.serviceInterest || 'Hospedagem cPanel + Domínio',
            lastMessage: item.Mensagem_Abordagem_WhatsApp || item.lastMessage || 'Lead importado via planilha.',
            lastMessageTime: 'Agora',
            aiPaused: false,
            unreadCount: 0,
            estimatedValue: 197,
            createdAt: 'Hoje',
            avatar: '',
          }));
          setLeads((prev) => [...importedLeads, ...prev]);
          alert(`✓ ${importedLeads.length} leads importados do arquivo com sucesso!`);
          return;
        }

        // Se for CSV
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length <= 1) return;

        const sep = lines[0].includes(';') ? ';' : ',';
        const headers = lines[0].split(sep).map((h) => h.trim().replace(/^"|"$/g, ''));

        const importedLeads: Lead[] = [];
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(sep).map((cell) => cell.trim().replace(/^"|"$/g, ''));
          if (row.length < 2) continue;

          const rowData: Record<string, string> = {};
          headers.forEach((h, idx) => {
            rowData[h] = row[idx] || '';
          });

          const name = rowData['Nome'] || rowData['name'] || row[0] || 'Empresa';
          const phone = rowData['Telefone'] || rowData['phone'] || row[1] || '';
          const copy = rowData['Mensagem_Abordagem_WhatsApp'] || rowData['copy'] || 'Lead importado do Google Maps.';
          const offer = rowData['Oferta_Recomendada'] || rowData['service'] || 'Hospedagem cPanel + Domínio';
          const cat = rowData['Categoria_Google'] || rowData['Nicho_Buscado'] || 'Google Maps';

          importedLeads.push({
            id: `lead-csv-${Date.now()}-${i}`,
            orgId: activeOrgId,
            name,
            phone,
            email: '',
            status: 'novo',
            tags: ['Google Maps', cat, 'Importado'],
            serviceInterest: offer,
            lastMessage: copy,
            lastMessageTime: 'Agora',
            aiPaused: false,
            unreadCount: 0,
            estimatedValue: 197,
            createdAt: 'Hoje',
            avatar: '',
          });
        }

        if (importedLeads.length > 0) {
          setLeads((prev) => [...importedLeads, ...prev]);
          alert(`✓ ${importedLeads.length} leads importados com sucesso para o seu CRM!`);
        }
      } catch (err: any) {
        alert('Erro ao importar planilha: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Organização Atual
  const handleTabChange = (tab: 'overview' | 'kanban' | 'livechat' | 'agenda' | 'ai_brain' | 'whatsapp' | 'saas') => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
  };

  const currentOrg = organizations.find((o) => o.id === activeOrgId) || organizations[0];
  const orgLeads = leads.filter((l) => l.orgId === activeOrgId);
  const orgAppointments = appointments.filter((a) => a.orgId === activeOrgId);
  const orgServices = services.filter((s) => s.orgId === activeOrgId);
  const orgDocs = knowledgeDocs.filter((d) => d.orgId === activeOrgId);

  // Filtro de Busca em Tempo Real no Funil Kanban
  const filteredLeads = orgLeads.filter((l) => {
    if (!kanbanSearch.trim()) return true;
    const q = kanbanSearch.toLowerCase();
    return (
      (l.name && l.name.toLowerCase().includes(q)) ||
      (l.phone && l.phone.toLowerCase().includes(q)) ||
      (l.email && l.email.toLowerCase().includes(q)) ||
      (l.serviceInterest && l.serviceInterest.toLowerCase().includes(q)) ||
      (l.tags && l.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });

  // Excluir Lead Individual
  const handleDeleteLead = (leadId: string, leadName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(`Deseja realmente excluir o lead "${leadName}" do funil?`)) {
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      if (selectedLeadDetails?.id === leadId) {
        setSelectedLeadDetails(null);
      }
      if (selectedLeadId === leadId) {
        setSelectedLeadId('');
      }
    }
  };

  // Limpar Funil Completo (Zerar para começar do zero)
  const handleClearFunnel = () => {
    if (orgLeads.length === 0) return;
    if (confirm(`Atenção: Deseja realmente excluir todos os ${orgLeads.length} leads do funil para recomeçar do zero?`)) {
      setLeads((prev) => prev.filter((l) => l.orgId !== activeOrgId));
      setSelectedLeadDetails(null);
      setSelectedLeadId('');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('agillex_hub_leads_prod');
      }
    }
  };

  // Exportar Leads para CSV
  const handleExportCSV = () => {
    if (orgLeads.length === 0) {
      alert('Nenhum lead no funil para exportar.');
      return;
    }
    const headers = ['ID', 'Nome', 'Telefone', 'Email', 'Serviço de Interesse', 'Status', 'Valor Estimado', 'Criado Em', 'Tags'];
    const rows = orgLeads.map((l) => [
      l.id,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${l.phone || ''}"`,
      `"${l.email || ''}"`,
      `"${(l.serviceInterest || '').replace(/"/g, '""')}"`,
      `"${l.status || ''}"`,
      l.estimatedValue || 0,
      `"${l.createdAt || ''}"`,
      `"${(l.tags || []).join(', ')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_alllogic_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Abrir Detalhes do Lead preparando modo edição
  const handleOpenLeadDetails = (lead: Lead) => {
    setSelectedLeadDetails(lead);
    setIsEditingLead(false);
    setEditLeadName(lead.name || '');
    setEditLeadPhone(lead.phone || '');
    setEditLeadEmail(lead.email || '');
    setEditLeadService(lead.serviceInterest || '');
    setEditLeadValue(lead.estimatedValue ? String(lead.estimatedValue) : '');
    setEditLeadMessage(lead.lastMessage || '');
  };

  // Salvar Edição do Lead
  const handleSaveLeadEdit = () => {
    if (!selectedLeadDetails) return;
    const parsedValue = editLeadValue.trim() ? parseFloat(editLeadValue.replace(/[^\d.,]/g, '').replace(',', '.')) : undefined;
    const updated: Lead = {
      ...selectedLeadDetails,
      name: editLeadName.trim() || selectedLeadDetails.name,
      phone: editLeadPhone.trim() || selectedLeadDetails.phone,
      email: editLeadEmail.trim() || undefined,
      serviceInterest: editLeadService.trim() || selectedLeadDetails.serviceInterest,
      estimatedValue: !isNaN(Number(parsedValue)) ? Number(parsedValue) : selectedLeadDetails.estimatedValue,
      lastMessage: editLeadMessage.trim() ? editLeadMessage : selectedLeadDetails.lastMessage,
    };
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setSelectedLeadDetails(updated);
    setIsEditingLead(false);
  };

  // Ativação / Desativação de Módulos (Simulação de Upgrade e Contratação Modular)
  const handleToggleModule = (moduleId: 'agenda' | 'atendimento' | 'crm') => {
    setOrganizations((prev) =>
      prev.map((org) => {
        if (org.id === activeOrgId) {
          const updatedModules = {
            ...org.modules,
            [moduleId]: !org.modules[moduleId],
          };
          return { ...org, modules: updatedModules };
        }
        return org;
      })
    );
  };

  // Ajustar aba ativa automaticamente caso a organização atual não possua o módulo contratado
  useEffect(() => {
    const isTabSupported = (tab: string, org: Organization) => {
      if (tab === 'saas') return true;
      if (tab === 'agenda') return org.modules?.agenda;
      if (tab === 'livechat' || tab === 'ai_brain' || tab === 'whatsapp') return org.modules?.atendimento;
      if (tab === 'overview' || tab === 'kanban') return org.modules?.crm;
      return true;
    };

    if (!isTabSupported(activeTab, currentOrg)) {
      if (currentOrg.modules?.agenda && !currentOrg.modules?.crm && !currentOrg.modules?.atendimento) {
        setActiveTab('agenda');
      } else if (currentOrg.modules?.atendimento && !currentOrg.modules?.crm) {
        setActiveTab('livechat');
      } else if (currentOrg.modules?.crm) {
        setActiveTab('overview');
      } else if (currentOrg.modules?.agenda) {
        setActiveTab('agenda');
      }
    }
  }, [activeOrgId, currentOrg, activeTab]);

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
    <div className="app-layout">
      {/* Backdrop overlay para fechar sidebar no mobile */}
      {mobileSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* 1. SIDEBAR LATERAL NAVEGAÇÃO */}
      <aside className={`app-sidebar ${mobileSidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Logo & Marca da Plataforma */}
        <div style={{ padding: '20px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(37, 99, 235, 0.4)',
              }}
            >
              <Bot size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Agillex Hub <span style={{ fontSize: '0.62rem', background: 'rgba(37, 99, 235, 0.15)', color: '#60A5FA', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(37, 99, 235, 0.3)' }}>PRO</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Engenharia de Soluções Digitais</div>
            </div>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => setMobileSidebarOpen(false)}
            title="Fechar menu"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
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
                        modules: {
                          agenda: true,
                          atendimento: false,
                          crm: false,
                        },
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

        {/* Links de Navegação Modular */}
        <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {/* MÓDULO 1: AGILLEX AGENDA (Quando Contratado) */}
          {currentOrg.modules?.agenda && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', marginBottom: '2px' }}>
                <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: '#60A5FA', fontWeight: 700, letterSpacing: '0.05em' }}>
                  Agillex Agenda
                </span>
                <span style={{ fontSize: '0.6rem', color: '#60A5FA', fontWeight: 600 }}>ATIVO</span>
              </div>

              <button
                onClick={() => handleTabChange('agenda')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  backgroundColor: activeTab === 'agenda' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: activeTab === 'agenda' ? '#60A5FA' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'agenda' ? 600 : 400,
                  border: activeTab === 'agenda' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={18} />
                  <span style={{ fontSize: '0.86rem' }}>Agendamentos & Catálogo</span>
                </div>
                <span style={{ fontSize: '0.72rem', background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', padding: '1px 6px', borderRadius: '99px', fontWeight: 600 }}>
                  {orgAppointments.length}
                </span>
              </button>
            </div>
          )}

          {/* MÓDULO 2: AGILLEX ATENDIMENTO (Quando Contratado) */}
          {currentOrg.modules?.atendimento && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', marginBottom: '2px' }}>
                <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: '#34D399', fontWeight: 700, letterSpacing: '0.05em' }}>
                  Agillex Atendimento
                </span>
                <span style={{ fontSize: '0.6rem', color: '#10B981', fontWeight: 600 }}>IA ONLINE</span>
              </div>

              <button
                onClick={() => handleTabChange('livechat')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  backgroundColor: activeTab === 'livechat' ? 'rgba(31, 111, 255, 0.15)' : 'transparent',
                  color: activeTab === 'livechat' ? '#60A5FA' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'livechat' ? 600 : 400,
                  border: activeTab === 'livechat' ? '1px solid rgba(31, 111, 255, 0.35)' : '1px solid transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MessageSquare size={18} />
                  <span style={{ fontSize: '0.86rem' }}>Live Chat WhatsApp</span>
                </div>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
              </button>

              <button
                onClick={() => handleTabChange('ai_brain')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  backgroundColor: activeTab === 'ai_brain' ? 'rgba(31, 111, 255, 0.15)' : 'transparent',
                  color: activeTab === 'ai_brain' ? '#60A5FA' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'ai_brain' ? 600 : 400,
                  border: activeTab === 'ai_brain' ? '1px solid rgba(31, 111, 255, 0.35)' : '1px solid transparent',
                }}
              >
                <Bot size={18} />
                <span style={{ fontSize: '0.86rem' }}>Cérebro IA & RAG</span>
              </button>

              <button
                onClick={() => handleTabChange('whatsapp')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  backgroundColor: activeTab === 'whatsapp' ? 'rgba(31, 111, 255, 0.15)' : 'transparent',
                  color: activeTab === 'whatsapp' ? '#60A5FA' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'whatsapp' ? 600 : 400,
                  border: activeTab === 'whatsapp' ? '1px solid rgba(31, 111, 255, 0.35)' : '1px solid transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <QrCode size={18} />
                  <span style={{ fontSize: '0.86rem' }}>WhatsApp (Instância)</span>
                </div>
                <span style={{ fontSize: '0.62rem', color: '#10B981', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>CONECTADO</span>
              </button>
            </div>
          )}

          {/* MÓDULO 3: AGILLEX CRM (Quando Contratado) */}
          {currentOrg.modules?.crm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', marginBottom: '2px' }}>
                <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: '#C9A227', fontWeight: 700, letterSpacing: '0.05em' }}>
                  Agillex CRM
                </span>
                <span style={{ fontSize: '0.6rem', color: '#C9A227', fontWeight: 600 }}>ATIVO</span>
              </div>

              <button
                onClick={() => handleTabChange('overview')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  backgroundColor: activeTab === 'overview' ? 'rgba(31, 111, 255, 0.15)' : 'transparent',
                  color: activeTab === 'overview' ? '#60A5FA' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'overview' ? 600 : 400,
                  border: activeTab === 'overview' ? '1px solid rgba(31, 111, 255, 0.35)' : '1px solid transparent',
                }}
              >
                <LayoutDashboard size={18} />
                <span style={{ fontSize: '0.86rem' }}>Visão Geral</span>
              </button>

              <button
                onClick={() => handleTabChange('kanban')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  backgroundColor: activeTab === 'kanban' ? 'rgba(31, 111, 255, 0.15)' : 'transparent',
                  color: activeTab === 'kanban' ? '#60A5FA' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'kanban' ? 600 : 400,
                  border: activeTab === 'kanban' ? '1px solid rgba(31, 111, 255, 0.35)' : '1px solid transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Kanban size={18} />
                  <span style={{ fontSize: '0.86rem' }}>Funil CRM Kanban</span>
                </div>
                <span style={{ fontSize: '0.72rem', background: 'rgba(31, 111, 255, 0.25)', color: '#93C5FD', padding: '1px 6px', borderRadius: '99px', fontWeight: 600 }}>
                  {orgLeads.length}
                </span>
              </button>
            </div>
          )}

          {/* ADMIN MASTER */}
          <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, padding: '0 8px', marginBottom: '4px', letterSpacing: '0.05em' }}>
              Gestão Master
            </div>
            <button
              onClick={() => handleTabChange('saas')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '8px',
                backgroundColor: activeTab === 'saas' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                color: activeTab === 'saas' ? '#A78BFA' : 'var(--text-secondary)',
                fontWeight: activeTab === 'saas' ? 600 : 400,
                border: activeTab === 'saas' ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={18} />
                <span style={{ fontSize: '0.86rem' }}>Painel SaaS & MRR</span>
              </div>
              <span style={{ fontSize: '0.65rem', background: '#8B5CF6', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                ADMIN
              </span>
            </button>
          </div>
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
          <button
            onClick={() => setIsSettingsOpen(true)}
            style={{
              color: 'var(--text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Configurações da Empresa e Workspace"
          >
            <Settings size={16} />
          </button>
        </div>
      </aside>

      {/* 2. ÁREA CENTRAL DE CONTEÚDO */}
      <main className="main-wrapper">
        {/* Topbar Superior com Status do Sistema */}
        <header className="topbar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <button
              className="mobile-only"
              onClick={() => setMobileSidebarOpen(true)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                cursor: 'pointer',
              }}
              title="Abrir menu"
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>

            <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="topbar-title" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                {activeTab === 'overview' && 'Visão Geral'}
                {activeTab === 'kanban' && 'Funil CRM'}
                {activeTab === 'livechat' && 'Live Chat WhatsApp'}
                {activeTab === 'agenda' && 'Agillex Agenda'}
                {activeTab === 'ai_brain' && 'Cérebro IA & RAG'}
                {activeTab === 'whatsapp' && 'Conexão WhatsApp'}
                {activeTab === 'saas' && 'Painel SaaS & MRR'}
              </h1>
              <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '10px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Workspace: <strong style={{ color: '#fff' }}>{currentOrg.name}</strong>
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Status Conexão WhatsApp (Se módulo Atendimento contratado) */}
            {currentOrg.modules?.atendimento && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '99px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                <span className="desktop-only" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34D399' }}>WhatsApp Conectado</span>
              </div>
            )}

            {/* Status Google Calendar (Se módulo Agenda contratado) */}
            {currentOrg.modules?.agenda && !currentOrg.modules?.atendimento && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '99px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                <CalendarCheck2 size={13} color="#60A5FA" />
                <span className="desktop-only" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#60A5FA' }}>Google Calendar Sincronizado</span>
              </div>
            )}

            {/* Status Agente de IA (Se módulo Atendimento contratado) */}
            {currentOrg.modules?.atendimento && (
              <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '99px', backgroundColor: 'rgba(31, 111, 255, 0.1)', border: '1px solid rgba(31, 111, 255, 0.25)' }}>
                <Sparkles size={13} color="#60A5FA" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#60A5FA' }}>Agente IA Ativo</span>
              </div>
            )}

            {/* Botão Novo Lead (Se módulo CRM contratado) */}
            {currentOrg.modules?.crm && (
              <button
                onClick={() => setNewLeadModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #1F6FFF, #1754C7)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  boxShadow: '0 2px 10px rgba(31, 111, 255, 0.35)',
                  whiteSpace: 'nowrap',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Plus size={15} /> <span className="desktop-only">Novo Lead</span><span className="mobile-only">Lead</span>
              </button>
            )}

            {/* Botão Prospectar no Maps (Se módulo CRM contratado) */}
            {currentOrg.modules?.crm && (
              <button
                onClick={() => {
                  setProspectorModalOpen(true);
                  setProspectorError('');
                  setProspectorSuccessMsg('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #C9A227, #9B7B1B)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  boxShadow: '0 2px 12px rgba(201, 162, 39, 0.35)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: 'none',
                }}
                title="Minere novas empresas no Google Maps com copy pronta e adicione diretamente ao Funil CRM"
              >
                <MapPin size={15} color="#fff" />
                <span className="desktop-only">Prospectar no Maps</span>
                <span className="mobile-only">Prospectar</span>
              </button>
            )}
          </div>
        </header>

        {/* CORPO PRINCIPAL COM CONTEÚDO DA ABA SELECIONADA */}
        <div className="content-scroll">
          {/* ======================================================== */}
          {/* ABA 1: VISÃO GERAL (DASHBOARD & KPIS)                    */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Banner de Destaque da Operação */}
              <div className="hero-banner">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#60A5FA', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      Automação em Execução
                    </span>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(31, 111, 255, 0.2)', color: '#93C5FD', padding: '2px 8px', borderRadius: '99px' }}>
                      AllLogic Online
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
                    onClick={() => handleTabChange('livechat')}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #1F6FFF, #1754C7)',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      border: 'none',
                      boxShadow: '0 2px 10px rgba(31, 111, 255, 0.35)',
                      cursor: 'pointer',
                    }}
                  >
                    <MessageSquare size={16} /> Ver Chat Ao Vivo
                  </button>
                  <button
                    onClick={() => handleTabChange('kanban')}
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
              <div className="metrics-grid">
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
              <div className="split-grid-2col">
                {/* Coluna 1: Leads Recentes */}
                <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>Últimas Oportunidades do WhatsApp</h3>
                    <button onClick={() => handleTabChange('kanban')} style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 600 }}>
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
          {activeTab === 'kanban' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    Gerencie o fluxo de atendimento da <strong>{currentOrg.name}</strong>. Os leads avançam sozinhos conforme interagem com o agente de IA.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Busca Rápida de Leads */}
                  <div style={{ position: 'relative', minWidth: '180px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Buscar lead ou telefone..."
                      value={kanbanSearch}
                      onChange={(e) => setKanbanSearch(e.target.value)}
                      style={{
                        padding: '7px 10px 7px 30px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: '#fff',
                        fontSize: '0.78rem',
                        width: '100%',
                      }}
                    />
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportFile}
                    accept=".csv, .json"
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                    }}
                    title="Importar lista de leads de um arquivo CSV ou JSON"
                  >
                    <UploadCloud size={14} color="#38BDF8" /> Importar
                  </button>

                  <button
                    onClick={handleExportCSV}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                    }}
                    title="Exportar todos os leads do funil para planilha CSV"
                  >
                    <Download size={14} color="#C9A227" /> Exportar CSV
                  </button>

                  {orgLeads.length > 0 && (
                    <button
                      onClick={handleClearFunnel}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#F87171',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: 'pointer',
                      }}
                      title="Limpar todos os leads do funil e começar do zero"
                    >
                      <Trash2 size={13} /> Limpar Funil
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setProspectorModalOpen(true);
                      setProspectorError('');
                      setProspectorSuccessMsg('');
                    }}
                    style={{
                      padding: '7px 13px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #C9A227, #9B7B1B)',
                      color: '#fff',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: '0 2px 10px rgba(201, 162, 39, 0.35)',
                    }}
                  >
                    <MapPin size={14} color="#fff" /> Prospectar no Maps
                  </button>

                  <button
                    onClick={() => setNewLeadModalOpen(true)}
                    style={{
                      padding: '7px 13px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #1F6FFF, #1754C7)',
                      color: '#fff',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: 'none',
                      boxShadow: '0 2px 10px rgba(31, 111, 255, 0.35)',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={14} /> Novo Lead
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
                  { id: 'novo', title: 'Novo Lead', color: '#1F6FFF', desc: 'Chegou ou Prospectado' },
                  { id: 'em_atendimento', title: 'Em Atendimento IA', color: '#818CF8', desc: 'Agente conversando' },
                  { id: 'aguardando_followup', title: 'Follow-up Automático', color: '#C9A227', desc: 'Contato parou de falar' },
                  { id: 'agendado', title: 'Agendado / Fechado', color: '#10B981', desc: 'Horário ou Negócio confirmado' },
                ].map((col) => {
                  const colLeads = filteredLeads.filter((l) => l.status === col.id);
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
                            onClick={() => handleOpenLeadDetails(lead)}
                            style={{
                              padding: '12px',
                              borderRadius: '10px',
                              backgroundColor: 'var(--bg-surface-elevated)',
                              border: '1px solid var(--border-subtle)',
                              boxShadow: 'var(--shadow-sm)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              cursor: 'pointer',
                              transition: 'transform 0.15s ease, border-color 0.15s ease',
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
                                    backgroundColor: 'rgba(31, 111, 255, 0.12)',
                                    color: '#93C5FD',
                                    border: '1px solid rgba(31, 111, 255, 0.2)',
                                  }}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>

                            {/* Ações Rápidas no Card */}
                            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedLeadId(lead.id);
                                    setActiveTab('livechat');
                                  }}
                                  style={{
                                    fontSize: '0.74rem',
                                    color: '#60A5FA',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <MessageSquare size={13} /> Chat
                                </button>
                                <a
                                  href={`https://wa.me/${(lead.phone || '').replace(/\D/g, '').startsWith('55') ? (lead.phone || '').replace(/\D/g, '') : '55' + (lead.phone || '').replace(/\D/g, '')}${lead.lastMessage ? `?text=${encodeURIComponent(lead.lastMessage)}` : ''}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    fontSize: '0.74rem',
                                    color: '#25D366',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    textDecoration: 'none',
                                  }}
                                  title="Chamar no WhatsApp"
                                >
                                  <Phone size={12} /> WhatsApp
                                </a>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {/* Botão Excluir Lead */}
                                <button
                                  onClick={(e) => handleDeleteLead(lead.id, lead.name, e)}
                                  style={{
                                    fontSize: '0.72rem',
                                    color: 'var(--text-muted)',
                                    padding: '3px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: 'transparent',
                                    cursor: 'pointer',
                                  }}
                                  title="Excluir este lead"
                                >
                                  <Trash2 size={13} color="#94A3B8" />
                                </button>

                                {/* Mover para próximo estágio */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
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
                                    cursor: 'pointer',
                                  }}
                                  title="Avançar etapa no funil"
                                >
                                  Mover &rarr;
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {colLeads.length === 0 && (
                          <div
                            style={{
                              textAlign: 'center',
                              padding: '32px 14px',
                              color: 'var(--text-muted)',
                              fontSize: '0.8rem',
                              border: '1px dashed var(--border-subtle)',
                              borderRadius: '10px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '8px',
                              backgroundColor: 'rgba(255, 255, 255, 0.01)',
                            }}
                          >
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Users size={16} color="var(--text-muted)" />
                            </div>
                            <span>Nenhum lead nesta etapa</span>
                            {col.id === 'novo' && (
                              <button
                                onClick={() => setNewLeadModalOpen(true)}
                                style={{
                                  fontSize: '0.72rem',
                                  color: '#60A5FA',
                                  fontWeight: 600,
                                  marginTop: '4px',
                                  padding: '4px 10px',
                                  borderRadius: '5px',
                                  backgroundColor: 'rgba(31, 111, 255, 0.1)',
                                  border: '1px solid rgba(31, 111, 255, 0.25)',
                                  cursor: 'pointer',
                                }}
                              >
                                + Adicionar Lead
                              </button>
                            )}
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
            <div className={`livechat-grid ${mobileChatView === 'chat' ? 'livechat-chat-active' : 'livechat-list-active'}`}>
              {/* Coluna Esquerda: Lista de Conversas do WhatsApp */}
              <div className="livechat-sidebar" style={{ borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
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
                <div className="livechat-main" style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#0B141A' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        className="mobile-only"
                        onClick={() => setMobileChatView('list')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#fff',
                          fontSize: '0.8rem',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          cursor: 'pointer',
                        }}
                      >
                        <ArrowLeft size={16} /> Voltar
                      </button>
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
          {/* ======================================================== */}
          {/* ABA 4: AGILLEX AGENDA & CATÁLOGO DE SERVIÇOS            */}
          {/* ======================================================== */}
          {activeTab === 'agenda' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Header do Módulo Agillex Agenda */}
              <div
                style={{
                  padding: '20px 24px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#60A5FA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Módulo Agillex Agenda
                    </span>
                    <span style={{ fontSize: '0.65rem', background: 'rgba(59, 130, 246, 0.2)', color: '#93C5FD', padding: '1px 8px', borderRadius: '99px', fontWeight: 600 }}>
                      Plano Standalone ou Integrado
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff', margin: '2px 0 6px' }}>
                    Agendamentos & Catálogo · {currentOrg.name}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '600px' }}>
                    Página pública de autoatendimento, sincronização com Google Calendar e gestão de horários da sua equipe.
                  </p>
                </div>

                {/* Ações da Página Pública de Agendamento */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      const url = `https://agenda.alllogiconline.com.br/${currentOrg.slug}`;
                      window.open(url, '_blank');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '9px 15px',
                      borderRadius: '8px',
                      backgroundColor: '#2563EB',
                      color: '#fff',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 2px 10px rgba(37, 99, 235, 0.3)',
                    }}
                  >
                    <ExternalLink size={15} /> Abrir Página Pública
                  </button>

                  <button
                    onClick={() => {
                      const url = `https://agenda.alllogiconline.com.br/${currentOrg.slug}`;
                      navigator.clipboard.writeText(url);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--border-hover)',
                      color: copiedLink ? '#34D399' : '#fff',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {copiedLink ? <CheckCheck size={15} color="#34D399" /> : <Copy size={15} />}
                    {copiedLink ? 'Link Copiado!' : 'Copiar Link'}
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60A5FA', fontSize: '0.78rem', fontWeight: 600 }}>
                    <CalendarCheck2 size={15} /> Google Calendar: Conectado
                  </div>
                </div>
              </div>

              {/* 4 Cards de Métricas do Agillex Agenda */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Total de Agendamentos</div>
                  <div style={{ fontSize: '1.7rem', fontWeight: 700, color: '#fff' }}>{orgAppointments.length}</div>
                  <div style={{ fontSize: '0.72rem', color: '#60A5FA', marginTop: '4px' }}>Registrados na plataforma</div>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Status das Reservas</div>
                  <div style={{ fontSize: '1.7rem', fontWeight: 700, color: '#34D399' }}>
                    {orgAppointments.filter((a) => a.status === 'confirmed').length}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>100% Confirmados</div>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Serviços no Catálogo</div>
                  <div style={{ fontSize: '1.7rem', fontWeight: 700, color: '#A78BFA' }}>{orgServices.length}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Disponíveis para agendar</div>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Agillex Pay (Intermediação)</div>
                  <div style={{ fontSize: '1.7rem', fontWeight: 700, color: '#10B981' }}>R$ 1,99</div>
                  <div style={{ fontSize: '0.72rem', color: '#34D399', marginTop: '4px', fontWeight: 600 }}>● Taxa fixa por agendamento pago</div>
                </div>
              </div>

              {/* Seção 1: Catálogo de Serviços */}
              <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-subtle)', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Catálogo de Serviços da Empresa</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                      Serviços que seus clientes encontram ao agendar pelo link web ou pelo WhatsApp.
                    </p>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#60A5FA', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
                    {orgServices.length} serviços cadastrados
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                  {orgServices.map((srv) => (
                    <div
                      key={srv.id}
                      style={{
                        padding: '16px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff' }}>{srv.name}</h4>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34D399' }}>
                            R$ {srv.price.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '12px' }}>
                          {srv.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          <Clock size={13} color="#60A5FA" /> {srv.durationMinutes} minutos
                        </div>
                        <span style={{ fontSize: '0.66rem', color: '#34D399', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          Online
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seção 2: Tabela de Agendamentos */}
              <div className="table-wrapper" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Próximos Agendamentos</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                      Sincronizados com o Google Calendar e notificados via WhatsApp.
                    </p>
                  </div>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                    {orgAppointments.length} agendados
                  </span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 16px' }}>Cliente</th>
                      <th style={{ padding: '12px 16px' }}>Serviço</th>
                      <th style={{ padding: '12px 16px' }}>Data & Horário</th>
                      <th style={{ padding: '12px 16px' }}>Local / Profissional</th>
                      <th style={{ padding: '12px 16px' }}>Duração</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 16px' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgAppointments.length > 0 ? (
                      orgAppointments.map((apt) => (
                        <tr key={apt.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>{apt.leadName}</td>
                          <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{apt.serviceName}</td>
                          <td style={{ padding: '14px 16px', color: '#34D399', fontWeight: 600 }}>{apt.date} às {apt.time}</td>
                          <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{apt.location || 'Consultório Principal'}</td>
                          <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{apt.durationMinutes} min</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>
                              Confirmado (Online)
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <button
                              onClick={() => {
                                setRescheduleApt(apt);
                                setRescheduleDate(apt.date);
                                setRescheduleTime(apt.time);
                                setRescheduleSuccess(false);
                              }}
                              style={{
                                color: '#38BDF8',
                                background: 'none',
                                border: 'none',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                              }}
                            >
                              Remarcar
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          Nenhum agendamento registrado ainda para esta empresa. Compartilhe o link da página pública para receber agendamentos!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 5: CÉREBRO DA IA & RAG (BASE DE CONHECIMENTO)        */}
          {/* ======================================================== */}
          {activeTab === 'ai_brain' && (
            <div className="split-grid-2col">
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
              <div className="table-wrapper" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
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

      {/* MODAL PROSPECTAR LEADS GOOGLE MAPS */}
      {prospectorModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 115,
            padding: '16px',
          }}
          onClick={() => {
            if (!isProspecting) setProspectorModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                  }}
                >
                  <MapPin size={20} color="#FBBF24" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Prospectar no Google Maps
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                    Minere empresas reais com WhatsApp e copy pronta para o CRM
                  </p>
                </div>
              </div>
              {!isProspecting && (
                <button
                  onClick={() => setProspectorModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    padding: '2px',
                  }}
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Alertas de Erro / Sucesso */}
            {prospectorError && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '0.78rem',
                  color: '#FCA5A5',
                }}
              >
                ⚠️ {prospectorError}
              </div>
            )}

            {prospectorSuccessMsg && (
              <div
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '0.8rem',
                  color: '#6EE7B7',
                  fontWeight: 600,
                }}
              >
                {prospectorSuccessMsg}
              </div>
            )}

            {/* Estado de Carregamento Ativo (Radar / Mineração) */}
            {isProspecting ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '28px 16px',
                  gap: '16px',
                  textAlign: 'center',
                }}
              >
                <div style={{ position: 'relative', width: '56px', height: '56px' }}>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      border: '3px solid rgba(99, 102, 241, 0.2)',
                      borderTopColor: '#6366F1',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sparkles size={22} color="#FBBF24" />
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                    Minerando Empresas no Google Maps...
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '340px', margin: 0, lineHeight: '1.4' }}>
                    Extraindo contatos, checando presença de site e gerando diagnósticos para <strong>{prospectorNiche}</strong> em <strong>{prospectorCity}</strong>.
                  </p>
                </div>

                <div
                  style={{
                    fontSize: '0.72rem',
                    color: '#818CF8',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    padding: '6px 14px',
                    borderRadius: '99px',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                  }}
                >
                  ⏳ Aguarde alguns instantes (executando em segundo plano)
                </div>
              </div>
            ) : (
              <form onSubmit={handleRunProspector} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                    1. Nicho ou Perfil de Empresa
                  </label>
                  <input
                    required
                    value={prospectorNiche}
                    onChange={(e) => setProspectorNiche(e.target.value)}
                    placeholder="Ex: Clínicas Odontológicas, Salões de Beleza, Contabilidade..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                    2. Cidade e Estado
                  </label>
                  <input
                    required
                    value={prospectorCity}
                    onChange={(e) => setProspectorCity(e.target.value)}
                    placeholder="Ex: Campinas SP, Sorocaba SP, São Paulo SP..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                      Quantidade de Leads
                    </label>
                    <select
                      value={prospectorLimit}
                      onChange={(e) => setProspectorLimit(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: '#fff',
                        fontSize: '0.85rem',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value={10}>10 empresas</option>
                      <option value={15}>15 empresas (Recomendado)</option>
                      <option value={20}>20 empresas</option>
                      <option value={30}>30 empresas</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                      Destino dos Leads
                    </label>
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        color: '#34D399',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                      }}
                    >
                      Kanban ({currentOrg.name})
                    </div>
                  </div>
                </div>

                {/* Filtro Sem Site */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: prospectorOnlyNoSite ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    border: prospectorOnlyNoSite ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={prospectorOnlyNoSite}
                    onChange={(e) => setProspectorOnlyNoSite(e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#F59E0B' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
                      Apenas empresas SEM site próprio
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Ideal para ofertar Hospedagem cPanel + Registro de Domínio
                    </div>
                  </div>
                </label>

                {/* Ações */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setProspectorModalOpen(false)}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary)',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      border: 'none',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '9px 18px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                      color: '#fff',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)',
                    }}
                  >
                    <Sparkles size={15} color="#FBBF24" /> Iniciar Mineração no Maps
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL GERENCIAMENTO DE MÓDULOS DO WORKSPACE */}
      {moduleModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
          onClick={() => setModuleModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-hover)',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                  Módulos Contratados · {currentOrg.name}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Ative ou desative módulos individuais para simular assinaturas customizadas.
                </p>
              </div>
              <button
                onClick={() => setModuleModalOpen(false)}
                style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', background: 'transparent', border: 'none' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Módulo Agillex Agenda */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: currentOrg.modules?.agenda ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: currentOrg.modules?.agenda ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#60A5FA',
                    }}
                  >
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>Agillex Agenda</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Página pública, catálogo de serviços e Google Calendar (R$ 89/mês)
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleModule('agenda')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    backgroundColor: currentOrg.modules?.agenda ? '#2563EB' : 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {currentOrg.modules?.agenda ? 'Ativo' : 'Ativar'}
                </button>
              </div>

              {/* Módulo Agillex Atendimento */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: currentOrg.modules?.atendimento ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: currentOrg.modules?.atendimento ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#34D399',
                    }}
                  >
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>Agillex Atendimento (IA)</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      WhatsApp 24/7 com IA generativa, RAG e Live Chat (R$ 149/mês)
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleModule('atendimento')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    backgroundColor: currentOrg.modules?.atendimento ? '#10B981' : 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {currentOrg.modules?.atendimento ? 'Ativo' : 'Ativar'}
                </button>
              </div>

              {/* Módulo Agillex CRM */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: currentOrg.modules?.crm ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: currentOrg.modules?.crm ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FBBF24',
                    }}
                  >
                    <Kanban size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>Agillex CRM</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Pipeline Kanban, qualificação de leads e métricas (R$ 99/mês)
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleModule('crm')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    backgroundColor: currentOrg.modules?.crm ? '#F59E0B' : 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {currentOrg.modules?.crm ? 'Ativo' : 'Ativar'}
                </button>
              </div>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModuleModalOpen(false)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALHES DO LEAD & CRM */}
      {selectedLeadDetails && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '16px',
          }}
          onClick={() => setSelectedLeadDetails(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-hover)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#1F6FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                >
                  {selectedLeadDetails.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    {selectedLeadDetails.name}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Cadastrado {selectedLeadDetails.createdAt}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setIsEditingLead(!isEditingLead)}
                  style={{
                    background: isEditingLead ? 'rgba(239, 68, 68, 0.15)' : 'rgba(31, 111, 255, 0.15)',
                    border: isEditingLead ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(31, 111, 255, 0.3)',
                    color: isEditingLead ? '#F87171' : '#60A5FA',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Pencil size={12} /> {isEditingLead ? 'Cancelar' : 'Editar'}
                </button>
                <button
                  onClick={() => setSelectedLeadDetails(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Ações Diretas: WhatsApp */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
              <a
                href={`https://wa.me/${(selectedLeadDetails.phone || '').replace(/\D/g, '').startsWith('55') ? (selectedLeadDetails.phone || '').replace(/\D/g, '') : '55' + (selectedLeadDetails.phone || '').replace(/\D/g, '')}${selectedLeadDetails.lastMessage ? `?text=${encodeURIComponent(selectedLeadDetails.lastMessage)}` : ''}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  backgroundColor: '#25D366',
                  color: '#fff',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                <Phone size={14} /> Abrir no WhatsApp
              </a>
              <button
                onClick={() => {
                  setActiveTab('livechat');
                  setSelectedLeadId(selectedLeadDetails.id);
                  setSelectedLeadDetails(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(31, 111, 255, 0.15)',
                  color: '#60A5FA',
                  border: '1px solid rgba(31, 111, 255, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                <MessageSquare size={14} /> Abrir no Chat Interno
              </button>
            </div>

            {/* Informações de Contato / Modo de Edição */}
            {isEditingLead ? (
              <div
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '16px',
                  border: '1px solid var(--border-hover)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Editar Informações do Lead
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Nome / Razão Social:</label>
                  <input
                    type="text"
                    value={editLeadName}
                    onChange={(e) => setEditLeadName(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Telefone WhatsApp:</label>
                  <input
                    type="text"
                    value={editLeadPhone}
                    onChange={(e) => setEditLeadPhone(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>E-mail (opcional):</label>
                  <input
                    type="email"
                    value={editLeadEmail}
                    onChange={(e) => setEditLeadEmail(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Serviço de Interesse:</label>
                  <input
                    type="text"
                    value={editLeadService}
                    onChange={(e) => setEditLeadService(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Valor Estimado (R$):</label>
                  <input
                    type="text"
                    value={editLeadValue}
                    onChange={(e) => setEditLeadValue(e.target.value)}
                    placeholder="Ex: 1500"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Mensagem / Copy de Abordagem:</label>
                  <textarea
                    rows={4}
                    value={editLeadMessage}
                    onChange={(e) => setEditLeadMessage(e.target.value)}
                    placeholder="Mensagem personalizada de abordagem..."
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.78rem', lineHeight: '1.4', resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                  <button
                    onClick={() => setIsEditingLead(false)}
                    style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveLeadEdit}
                    style={{ padding: '6px 14px', borderRadius: '6px', background: 'linear-gradient(135deg, #1F6FFF, #1754C7)', color: '#fff', fontSize: '0.78rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '16px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Telefone:</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{selectedLeadDetails.phone}</span>
                </div>
                {selectedLeadDetails.email && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>E-mail:</span>
                    <span style={{ color: '#fff' }}>{selectedLeadDetails.email}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Serviço de Interesse:</span>
                  <span style={{ color: '#C9A227', fontWeight: 600 }}>{selectedLeadDetails.serviceInterest}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Valor Estimado:</span>
                  <span style={{ color: '#10B981', fontWeight: 600 }}>
                    {selectedLeadDetails.estimatedValue
                      ? `R$ ${selectedLeadDetails.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : 'A definir'}
                  </span>
                </div>
              </div>
            )}

            {/* Controle da IA para este Lead */}
            <div
              style={{
                backgroundColor: selectedLeadDetails.aiPaused ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: selectedLeadDetails.aiPaused ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#fff' }}>
                  {selectedLeadDetails.aiPaused ? 'Atendimento Manual (IA Pausada)' : 'Atendimento IA Ativo 24/7'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {selectedLeadDetails.aiPaused ? 'O robô não responderá automaticamente este lead.' : 'O assistente responde em segundos no WhatsApp.'}
                </div>
              </div>
              <button
                onClick={() => {
                  const updatedAi = !selectedLeadDetails.aiPaused;
                  setLeads((prev) =>
                    prev.map((l) => (l.id === selectedLeadDetails.id ? { ...l, aiPaused: updatedAi } : l))
                  );
                  setSelectedLeadDetails((prev) => (prev ? { ...prev, aiPaused: updatedAi } : null));
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: selectedLeadDetails.aiPaused ? '#10B981' : '#EF4444',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {selectedLeadDetails.aiPaused ? <Play size={12} /> : <Pause size={12} />}
                {selectedLeadDetails.aiPaused ? 'Reativar IA' : 'Pausar IA'}
              </button>
            </div>

            {/* Estágio do Funil (Pipeline CRM) */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Estágio no Funil CRM:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {(
                  [
                    { id: 'novo', label: 'Novo Lead' },
                    { id: 'em_atendimento', label: 'Em Atendimento' },
                    { id: 'aguardando_followup', label: 'Follow-up' },
                    { id: 'agendado', label: 'Agendado' },
                    { id: 'concluido', label: 'Concluído' },
                    { id: 'perdido', label: 'Perdido' },
                  ] as { id: LeadStatus; label: string }[]
                ).map((stage) => {
                  const isSelected = selectedLeadDetails.status === stage.id;
                  return (
                    <button
                      key={stage.id}
                      onClick={() => {
                        setLeads((prev) =>
                          prev.map((l) => (l.id === selectedLeadDetails.id ? { ...l, status: stage.id } : l))
                        );
                        setSelectedLeadDetails((prev) => (prev ? { ...prev, status: stage.id } : null));
                      }}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        backgroundColor: isSelected ? '#2563EB' : 'var(--bg-surface-elevated)',
                        color: isSelected ? '#fff' : 'var(--text-muted)',
                        border: isSelected ? '1px solid #3B82F6' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {stage.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Copy / Mensagem de Abordagem Sugerida */}
            {selectedLeadDetails.lastMessage && (
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Copy de Abordagem Sugerida:
                  </label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedLeadDetails.lastMessage);
                      setCopiedMessage(true);
                      setTimeout(() => setCopiedMessage(false), 2000);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copiedMessage ? '#10B981' : '#38BDF8',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0,
                    }}
                  >
                    {copiedMessage ? <CheckCheck size={13} /> : <Copy size={13} />}
                    {copiedMessage ? 'Copiado!' : 'Copiar Copy'}
                  </button>
                </div>
                <div
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '0.78rem',
                    color: '#E2E8F0',
                    lineHeight: '1.45',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '130px',
                    overflowY: 'auto',
                  }}
                >
                  {selectedLeadDetails.lastMessage}
                </div>
              </div>
            )}

            {/* Tags do Lead */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Tags e Marcadores:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedLeadDetails.tags?.map((t, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.72rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => handleDeleteLead(selectedLeadDetails.id, selectedLeadDetails.name)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#F87171',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Trash2 size={14} /> Excluir Lead
              </button>
              <button
                onClick={() => setSelectedLeadDetails(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAÇÕES DO WORKSPACE & EMPRESA */}
      {isSettingsOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '16px',
          }}
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-hover)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(37, 99, 235, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3B82F6',
                  }}
                >
                  <Settings size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Configurações do Workspace
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {currentOrg.name} · AllLogic Online
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Informações da Empresa */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid var(--border-subtle)',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Nome da Empresa / Tenant:</span>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#fff' }}>{currentOrg.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Segmento:</span>
                <span style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>{currentOrg.category}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Plano Ativo:</span>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '99px',
                    backgroundColor: 'rgba(37, 99, 235, 0.2)',
                    color: '#60A5FA',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                  }}
                >
                  {currentOrg.plan}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>WhatsApp Conectado:</span>
                <span style={{ fontSize: '0.84rem', color: '#10B981', fontWeight: 600 }}>{currentOrg.whatsappPhone}</span>
              </div>
            </div>

            {/* Acesso à Agenda Pública */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid var(--border-subtle)',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>
                Link da Agenda Pública dos Clientes:
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: '#38BDF8',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  {`https://agenda.alllogiconline.com.br/${currentOrg.slug}`}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://agenda.alllogiconline.com.br/${currentOrg.slug}`);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    backgroundColor: copiedLink ? '#10B981' : 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                  {copiedLink ? 'Copiado!' : 'Copiar'}
                </button>
                <a
                  href={`https://agenda.alllogiconline.com.br/${currentOrg.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Abrir em nova aba"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Atalhos Rápidos para Módulos e Painel da Agenda */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <a
                href="https://agenda.alllogiconline.com.br/admin"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  color: '#fff',
                  textDecoration: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={18} style={{ color: '#38BDF8' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Acessar Painel da Agenda (Admin)</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Gerenciar profissionais, serviços e horários</div>
                  </div>
                </div>
                <ExternalLink size={14} style={{ color: '#38BDF8' }} />
              </a>

              <a
                href="https://hub.alllogiconline.com.br/checkout?modulo=combo"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  color: '#fff',
                  textDecoration: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <DollarSign size={18} style={{ color: '#10B981' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Assinatura & Faturamento Asaas</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Gerenciar plano, faturas e métodos de pagamento</div>
                  </div>
                </div>
                <ExternalLink size={14} style={{ color: '#10B981' }} />
              </a>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setIsSettingsOpen(false)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REMARCAR AGENDAMENTO */}
      {rescheduleApt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '16px',
          }}
          onClick={() => setRescheduleApt(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-hover)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38BDF8',
                  }}
                >
                  <CalendarCheck2 size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Remarcar Agendamento
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {rescheduleApt.leadName}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setRescheduleApt(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Dados do Agendamento Atual */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '16px',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cliente:</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{rescheduleApt.leadName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Serviço:</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{rescheduleApt.serviceName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Local / Canal:</span>
                <span style={{ color: '#fff' }}>{rescheduleApt.location || 'Online / WhatsApp'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Horário Atual:</span>
                <span style={{ color: '#FBBF24', fontWeight: 600 }}>{rescheduleApt.date} às {rescheduleApt.time}</span>
              </div>
            </div>

            {rescheduleSuccess ? (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34D399',
                  textAlign: 'center',
                  marginBottom: '16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={24} style={{ margin: '0 auto 8px auto', display: 'block' }} />
                Agendamento remarcado com sucesso para {rescheduleDate} às {rescheduleTime}!
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (rescheduleDate && rescheduleTime) {
                    setAppointments((prev) =>
                      prev.map((a) =>
                        a.id === rescheduleApt.id
                          ? { ...a, date: rescheduleDate, time: rescheduleTime }
                          : a
                      )
                    );
                    setRescheduleSuccess(true);
                    setTimeout(() => {
                      setRescheduleApt(null);
                      setRescheduleSuccess(false);
                    }, 1800);
                  }
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}
              >
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Nova Data
                  </label>
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Novo Horário
                  </label>
                  <input
                    type="time"
                    required
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setRescheduleApt(null)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary)',
                      fontSize: '0.82rem',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      backgroundColor: '#2563EB',
                      color: '#fff',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Confirmar Remarcação
                  </button>
                </div>
              </form>
            )}

            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <a
                href="https://agenda.alllogiconline.com.br/admin"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.74rem',
                  color: '#38BDF8',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Gerenciar disponibilidade avançada no painel da Agenda <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
