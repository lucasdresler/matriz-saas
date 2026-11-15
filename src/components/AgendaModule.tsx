'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Users,
  Scissors,
  Package,
  ShoppingBag,
  Settings,
  Plus,
  ExternalLink,
  Copy,
  CheckCheck,
  CalendarCheck2,
  Clock,
  Phone,
  Search,
  CheckCircle2,
  Pencil,
  Trash2,
  DollarSign,
  AlertTriangle,
  Receipt,
  QrCode,
  Save,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  Loader2,
  X,
  CreditCard,
  FileCheck,
} from 'lucide-react';
import { Appointment, ServiceItem } from '@/types';

interface AgendaModuleProps {
  currentOrg: any;
  services: ServiceItem[];
  onRefreshServices: () => void;
  appointments: Appointment[];
  onRefreshAppointments: () => void;
  onOpenNewService: () => void;
  onOpenEditService: (srv: ServiceItem) => void;
  onDeleteService: (id: string, name: string) => void;
}

export default function AgendaModule({
  currentOrg,
  services,
  onRefreshServices,
  appointments,
  onRefreshAppointments,
  onOpenNewService,
  onOpenEditService,
  onDeleteService,
}: AgendaModuleProps) {
  // Sub-abas do Módulo Agenda
  const [subTab, setSubTab] = useState<
    'calendar' | 'professionals' | 'services' | 'clients' | 'balcao' | 'settings'
  >('calendar');

  // Estados dos dados do backend
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    brand_color: '#2563EB',
    logo_url: '',
    banner_url: '',
    bio: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    slot_interval_minutes: 30,
    max_advance_days: 30,
    min_cancel_hours: 2,
    require_pix_deposit: false,
    pix_deposit_amount: 20,
    pix_deposit_percent: 50,
  });

  // Filtros de Agendamentos
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'tomorrow' | 'week'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProfFilter, setSelectedProfFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal de Profissional
  const [profModalOpen, setProfModalOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<any | null>(null);
  const [profName, setProfName] = useState('');
  const [profSpecialty, setProfSpecialty] = useState('');
  const [profPhone, setProfPhone] = useState('');
  const [profEmail, setProfEmail] = useState('');
  const [profServiceComm, setProfServiceComm] = useState('30');
  const [profProductComm, setProfProductComm] = useState('10');
  const [profSchedule, setProfSchedule] = useState<any[]>([
    { day_of_week: 1, name: 'Segunda-feira', start_time: '09:00', end_time: '19:00', break_start: '12:00', break_end: '13:00', is_active: true },
    { day_of_week: 2, name: 'Terça-feira', start_time: '09:00', end_time: '19:00', break_start: '12:00', break_end: '13:00', is_active: true },
    { day_of_week: 3, name: 'Quarta-feira', start_time: '09:00', end_time: '19:00', break_start: '12:00', break_end: '13:00', is_active: true },
    { day_of_week: 4, name: 'Quinta-feira', start_time: '09:00', end_time: '19:00', break_start: '12:00', break_end: '13:00', is_active: true },
    { day_of_week: 5, name: 'Sexta-feira', start_time: '09:00', end_time: '19:00', break_start: '12:00', break_end: '13:00', is_active: true },
    { day_of_week: 6, name: 'Sábado', start_time: '09:00', end_time: '18:00', break_start: '12:00', break_end: '13:00', is_active: true },
    { day_of_week: 7, name: 'Domingo', start_time: '09:00', end_time: '14:00', break_start: '12:00', break_end: '13:00', is_active: false },
  ]);
  const [profSaving, setProfSaving] = useState(false);

  // Modal de Pacote
  const [pkgModalOpen, setPkgModalOpen] = useState(false);
  const [pkgName, setPkgName] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgSessions, setPkgSessions] = useState('4');
  const [pkgValidity, setPkgValidity] = useState('30');
  const [pkgDesc, setPkgDesc] = useState('');
  const [pkgSaving, setPkgSaving] = useState(false);

  // Modal de Produto & Venda de Balcão
  const [prodModalOpen, setProdModalOpen] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Geral');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCost, setProdCost] = useState('');
  const [prodStock, setProdStock] = useState('10');
  const [prodAlert, setProdAlert] = useState('3');
  const [prodComm, setProdComm] = useState('10');
  const [prodSaving, setProdSaving] = useState(false);

  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [saleClient, setSaleClient] = useState('');
  const [saleProduct, setSaleProduct] = useState<any | null>(null);
  const [saleQty, setSaleQty] = useState('1');
  const [saleProfId, setSaleProfId] = useState('');
  const [salePayment, setSalePayment] = useState('pix');
  const [saleSaving, setSaleSaving] = useState(false);

  // Modal de Fiado
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [debtClient, setDebtClient] = useState('');
  const [debtPhone, setDebtPhone] = useState('');
  const [debtDesc, setDebtDesc] = useState('');
  const [debtTotal, setDebtTotal] = useState('');
  const [debtSaving, setDebtSaving] = useState(false);

  const [debtPayModalOpen, setDebtPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any | null>(null);
  const [debtPayAmount, setDebtPayAmount] = useState('');
  const [debtPayMethod, setDebtPayMethod] = useState('pix');
  const [debtPaySaving, setDebtPaySaving] = useState(false);

  // Modal de Reagendamento
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleSaving, setRescheduleSaving] = useState(false);

  // Estado de salvamento das configurações
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // Carregar dados completos do Agillex Agenda via API
  const loadAgendaData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/agenda/overview?orgId=${currentOrg.id}`);
      const data = await res.json();
      if (data?.success) {
        if (data.professionals) setProfessionals(data.professionals);
        if (data.packages) setPackages(data.packages);
        if (data.products) setProducts(data.products);
        if (data.sales) setSales(data.sales);
        if (data.debts) setDebts(data.debts);
        if (data.commissions) setCommissions(data.commissions);
        if (data.clients) setClients(data.clients);
        if (data.settings) setSettings((prev: any) => ({ ...prev, ...data.settings }));
      }
    } catch (err) {
      console.error('[AgendaModule] Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrg?.id) {
      loadAgendaData();
    }
  }, [currentOrg?.id]);

  // Salvar Configurações da Página Pública & Sinal Pix
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSettingsSaving(true);
      const res = await fetch('/api/agenda/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrg.id,
          brandColor: settings.brand_color,
          logoUrl: settings.logo_url,
          bannerUrl: settings.banner_url,
          bio: settings.bio,
          address: settings.address,
          city: settings.city,
          state: settings.state,
          zipCode: settings.zip_code,
          slotIntervalMinutes: settings.slot_interval_minutes,
          maxAdvanceDays: settings.max_advance_days,
          minCancelHours: settings.min_cancel_hours,
          requirePixDeposit: settings.require_pix_deposit,
          pixDepositAmount: settings.pix_deposit_amount,
          pixDepositPercent: settings.pix_deposit_percent,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setSettingsSavedToast(true);
        setTimeout(() => setSettingsSavedToast(false), 3000);
      }
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
    } finally {
      setSettingsSaving(false);
    }
  };

  // Abrir modal de novo profissional
  const handleOpenNewProf = () => {
    setEditingProf(null);
    setProfName('');
    setProfSpecialty('Atendimento Geral');
    setProfPhone('');
    setProfEmail('');
    setProfServiceComm('30');
    setProfProductComm('10');
    setProfModalOpen(true);
  };

  // Abrir modal de edição de profissional
  const handleOpenEditProf = (prof: any) => {
    setEditingProf(prof);
    setProfName(prof.name);
    setProfSpecialty(prof.specialty || '');
    setProfPhone(prof.phone || '');
    setProfEmail(prof.email || '');
    setProfServiceComm(String(prof.service_commission_pct || 30));
    setProfProductComm(String(prof.product_commission_pct || 10));

    // Se tiver disponibilidade, atualiza
    if (prof.availability && prof.availability.length > 0) {
      const dayNames = ['', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
      const updated = prof.availability.map((a: any) => ({
        day_of_week: a.day_of_week,
        name: dayNames[a.day_of_week] || `Dia ${a.day_of_week}`,
        start_time: a.start_time?.substring(0, 5) || '09:00',
        end_time: a.end_time?.substring(0, 5) || '19:00',
        break_start: a.break_start?.substring(0, 5) || '12:00',
        break_end: a.break_end?.substring(0, 5) || '13:00',
        is_active: a.is_active !== false,
      }));
      setProfSchedule(updated);
    }
    setProfModalOpen(true);
  };

  // Salvar Profissional
  const handleSaveProf = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfSaving(true);
      const res = await fetch('/api/agenda/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProf?.id,
          organizationId: currentOrg.id,
          name: profName,
          specialty: profSpecialty,
          phone: profPhone,
          email: profEmail,
          serviceCommissionPct: profServiceComm,
          productCommissionPct: profProductComm,
          availability: profSchedule,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setProfModalOpen(false);
        await loadAgendaData();
      }
    } catch (err) {
      console.error('Erro ao salvar profissional:', err);
    } finally {
      setProfSaving(false);
    }
  };

  // Salvar Pacote
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setPkgSaving(true);
      const res = await fetch('/api/agenda/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrg.id,
          name: pkgName,
          price: pkgPrice,
          sessionsCount: pkgSessions,
          validityDays: pkgValidity,
          description: pkgDesc,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setPkgModalOpen(false);
        setPkgName('');
        setPkgPrice('');
        setPkgDesc('');
        await loadAgendaData();
      }
    } catch (err) {
      console.error('Erro ao salvar pacote:', err);
    } finally {
      setPkgSaving(false);
    }
  };

  // Salvar Produto
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProdSaving(true);
      const res = await fetch('/api/agenda/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrg.id,
          name: prodName,
          category: prodCategory,
          price: prodPrice,
          costPrice: prodCost,
          stockQuantity: prodStock,
          minStockAlert: prodAlert,
          commissionPct: prodComm,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setProdModalOpen(false);
        setProdName('');
        setProdPrice('');
        setProdCost('');
        await loadAgendaData();
      }
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
    } finally {
      setProdSaving(false);
    }
  };

  // Registrar Venda de Balcão
  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleProduct) return;
    try {
      setSaleSaving(true);
      const res = await fetch('/api/agenda/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_sale',
          organizationId: currentOrg.id,
          clientName: saleClient || 'Cliente Balcão',
          productId: saleProduct.id,
          productName: saleProduct.name,
          quantity: saleQty,
          unitPrice: saleProduct.price,
          professionalId: saleProfId || null,
          paymentMethod: salePayment,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setSaleModalOpen(false);
        setSaleClient('');
        setSaleProduct(null);
        await loadAgendaData();
      }
    } catch (err) {
      console.error('Erro ao registrar venda:', err);
    } finally {
      setSaleSaving(false);
    }
  };

  // Salvar Fiado
  const handleSaveDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setDebtSaving(true);
      const res = await fetch('/api/agenda/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrg.id,
          clientName: debtClient,
          clientPhone: debtPhone,
          description: debtDesc,
          totalAmount: debtTotal,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setDebtModalOpen(false);
        setDebtClient('');
        setDebtPhone('');
        setDebtDesc('');
        setDebtTotal('');
        await loadAgendaData();
      }
    } catch (err) {
      console.error('Erro ao salvar fiado:', err);
    } finally {
      setDebtSaving(false);
    }
  };

  // Registrar Pagamento de Fiado
  const handlePayDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;
    try {
      setDebtPaySaving(true);
      const res = await fetch('/api/agenda/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pay_debt',
          debtId: selectedDebt.id,
          amount: debtPayAmount,
          paymentMethod: debtPayMethod,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setDebtPayModalOpen(false);
        setSelectedDebt(null);
        setDebtPayAmount('');
        await loadAgendaData();
      }
    } catch (err) {
      console.error('Erro ao quitar fiado:', err);
    } finally {
      setDebtPaySaving(false);
    }
  };

  // Reagendar Agendamento
  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleApt) return;
    try {
      setRescheduleSaving(true);
      const res = await fetch('/api/agenda/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reschedule',
          appointmentId: rescheduleApt.id,
          date: rescheduleDate,
          time: rescheduleTime,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setRescheduleApt(null);
        onRefreshAppointments();
      }
    } catch (err) {
      console.error('Erro ao reagendar:', err);
    } finally {
      setRescheduleSaving(false);
    }
  };

  // Atualizar Status do Agendamento (Confirmar, Concluir, Cancelar)
  const handleUpdateStatus = async (appointmentId: string, status: string) => {
    try {
      await fetch('/api/agenda/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          appointmentId,
          status,
        }),
      });
      onRefreshAppointments();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  // Marcar Comissão como Paga
  const handlePayCommission = async (commissionId: string) => {
    try {
      await fetch('/api/agenda/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_paid',
          commissionId,
          organizationId: currentOrg.id,
        }),
      });
      await loadAgendaData();
    } catch (err) {
      console.error('Erro ao pagar comissão:', err);
    }
  };

  // Filtragem dos Agendamentos
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Filtro de texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = apt.leadName?.toLowerCase().includes(q);
        const matchService = apt.serviceName?.toLowerCase().includes(q);
        if (!matchName && !matchService) return false;
      }
      // Filtro de status
      if (statusFilter !== 'all' && apt.status !== statusFilter) return false;

      // Filtro temporal
      if (timeFilter !== 'all') {
        const todayStr = new Date().toISOString().substring(0, 10);
        if (timeFilter === 'today' && apt.date !== todayStr) return false;
      }
      return true;
    });
  }, [appointments, searchQuery, statusFilter, timeFilter]);

  const publicUrl = `https://agenda.agillex.com.br/${currentOrg?.slug || ''}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* HEADER DO MÓDULO AGILLEX AGENDA UNIFICADO */}
      <div
        style={{
          padding: '22px 26px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
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
              Painel Integrado · Agillex Agenda
            </span>
            <span style={{ fontSize: '0.65rem', background: 'rgba(59, 130, 246, 0.2)', color: '#93C5FD', padding: '1px 8px', borderRadius: '99px', fontWeight: 600 }}>
              Autoatendimento & Gestão Completa
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', margin: '2px 0 6px' }}>
            {currentOrg?.name} · Central de Agendamento
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', maxWidth: '650px' }}>
            Controle de horários, profissionais, catálogo de serviços, produtos de balcão, comissões e sinal Pix anti no-show em um só lugar.
          </p>
        </div>

        {/* Atalhos Rápidos da Página Pública */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.open(publicUrl, '_blank')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '8px',
              backgroundColor: '#2563EB',
              color: '#fff',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 2px 10px rgba(37, 99, 235, 0.35)',
            }}
          >
            <ExternalLink size={15} /> Ver Página Pública
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(publicUrl);
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

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60A5FA',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
          >
            <CalendarCheck2 size={15} /> Google Calendar: Conectado
          </div>
        </div>
      </div>

      {/* 4 CARDS DE MÉTRICAS RÁPIDAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Agendamentos na Plataforma</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#fff' }}>{appointments.length}</div>
          <div style={{ fontSize: '0.72rem', color: '#60A5FA', marginTop: '4px' }}>Sincronizados em tempo real</div>
        </div>

        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Equipe Ativa</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#38BDF8' }}>{professionals.length}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Profissionais com escala ativa</div>
        </div>

        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Serviços no Catálogo</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#A78BFA' }}>{services.length}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Disponíveis para agendamento online</div>
        </div>

        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Agillex Pay (Intermediação)</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#10B981' }}>R$ 1,99</div>
          <div style={{ fontSize: '0.72rem', color: '#34D399', marginTop: '4px', fontWeight: 600 }}>● Taxa fixa Pix/Cartão por transação</div>
        </div>
      </div>

      {/* BARRA DE SUB-ABAS (NAVEGAÇÃO INTERNA DO MÓDULO) */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '8px',
          overflowX: 'auto',
        }}
      >
        <button
          onClick={() => setSubTab('calendar')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor: subTab === 'calendar' ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
            color: subTab === 'calendar' ? '#60A5FA' : 'var(--text-secondary)',
            fontWeight: subTab === 'calendar' ? 700 : 500,
            border: subTab === 'calendar' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
            cursor: 'pointer',
            fontSize: '0.84rem',
            whiteSpace: 'nowrap',
          }}
        >
          <Calendar size={16} /> Agendamentos & Calendário
          <span style={{ fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.25)', color: '#93C5FD', padding: '1px 6px', borderRadius: '99px', fontWeight: 700 }}>
            {appointments.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('professionals')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor: subTab === 'professionals' ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
            color: subTab === 'professionals' ? '#60A5FA' : 'var(--text-secondary)',
            fontWeight: subTab === 'professionals' ? 700 : 500,
            border: subTab === 'professionals' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
            cursor: 'pointer',
            fontSize: '0.84rem',
            whiteSpace: 'nowrap',
          }}
        >
          <Users size={16} /> Equipe & Escalas
          <span style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', padding: '1px 6px', borderRadius: '99px' }}>
            {professionals.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('services')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor: subTab === 'services' ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
            color: subTab === 'services' ? '#60A5FA' : 'var(--text-secondary)',
            fontWeight: subTab === 'services' ? 700 : 500,
            border: subTab === 'services' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
            cursor: 'pointer',
            fontSize: '0.84rem',
            whiteSpace: 'nowrap',
          }}
        >
          <Scissors size={16} /> Serviços & Pacotes
          <span style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', padding: '1px 6px', borderRadius: '99px' }}>
            {services.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('clients')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor: subTab === 'clients' ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
            color: subTab === 'clients' ? '#60A5FA' : 'var(--text-secondary)',
            fontWeight: subTab === 'clients' ? 700 : 500,
            border: subTab === 'clients' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
            cursor: 'pointer',
            fontSize: '0.84rem',
            whiteSpace: 'nowrap',
          }}
        >
          <UserCheck size={16} /> Clientes da Agenda
          <span style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', padding: '1px 6px', borderRadius: '99px' }}>
            {clients.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('balcao')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor: subTab === 'balcao' ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
            color: subTab === 'balcao' ? '#60A5FA' : 'var(--text-secondary)',
            fontWeight: subTab === 'balcao' ? 700 : 500,
            border: subTab === 'balcao' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
            cursor: 'pointer',
            fontSize: '0.84rem',
            whiteSpace: 'nowrap',
          }}
        >
          <ShoppingBag size={16} /> Balcão, Estoque & Comissões
        </button>

        <button
          onClick={() => setSubTab('settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor: subTab === 'settings' ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
            color: subTab === 'settings' ? '#60A5FA' : 'var(--text-secondary)',
            fontWeight: subTab === 'settings' ? 700 : 500,
            border: subTab === 'settings' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
            cursor: 'pointer',
            fontSize: '0.84rem',
            whiteSpace: 'nowrap',
          }}
        >
          <Settings size={16} /> Página Pública & Sinal Pix
        </button>
      </div>

      {/* ======================================================== */}
      {/* SUB-ABA 1: AGENDAMENTOS & CALENDÁRIO                     */}
      {/* ======================================================== */}
      {subTab === 'calendar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Barra de Filtros e Busca */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {/* Filtros Rápidos de Tempo */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'today', label: 'Hoje' },
                { id: 'tomorrow', label: 'Amanhã' },
                { id: 'week', label: 'Esta Semana' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTimeFilter(f.id as any)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: timeFilter === f.id ? '#2563EB' : 'rgba(255, 255, 255, 0.06)',
                    color: '#fff',
                    border: 'none',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Busca por cliente ou serviço */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '5px 10px',
                }}
              >
                <Search size={14} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Buscar cliente ou serviço..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.8rem',
                    outline: 'none',
                    width: '180px',
                  }}
                />
              </div>

              {/* Filtro por Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '0.78rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="all">Todos os Status</option>
                <option value="confirmed">Confirmados</option>
                <option value="pending">Pendentes</option>
                <option value="completed">Concluídos</option>
                <option value="canceled">Cancelados</option>
              </select>
            </div>
          </div>

          {/* Tabela de Agendamentos */}
          <div className="table-wrapper" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Cliente</th>
                  <th style={{ padding: '12px 16px' }}>Serviço</th>
                  <th style={{ padding: '12px 16px' }}>Data & Horário</th>
                  <th style={{ padding: '12px 16px' }}>Profissional</th>
                  <th style={{ padding: '12px 16px' }}>Duração</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((apt) => (
                    <tr key={apt.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>
                        <div>{apt.leadName}</div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{apt.serviceName}</td>
                      <td style={{ padding: '14px 16px', color: '#34D399', fontWeight: 600 }}>
                        {apt.date} às {apt.time}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{apt.location || 'Consultório Principal'}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{apt.durationMinutes} min</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '99px',
                            fontWeight: 600,
                            backgroundColor:
                              apt.status === 'confirmed'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : apt.status === 'canceled'
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(245, 158, 11, 0.15)',
                            color:
                              apt.status === 'confirmed'
                                ? '#34D399'
                                : apt.status === 'canceled'
                                ? '#F87171'
                                : '#FBBF24',
                          }}
                        >
                          {apt.status === 'confirmed' ? 'Confirmado' : apt.status === 'canceled' ? 'Cancelado' : 'Pendente'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setRescheduleApt(apt);
                              setRescheduleDate(apt.date);
                              setRescheduleTime(apt.time);
                            }}
                            style={{
                              color: '#60A5FA',
                              background: 'none',
                              border: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              textDecoration: 'underline',
                            }}
                          >
                            Reagendar
                          </button>

                          {apt.status !== 'confirmed' && (
                            <button
                              onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                color: '#34D399',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                              }}
                            >
                              Confirmar
                            </button>
                          )}

                          {apt.status !== 'canceled' && (
                            <button
                              onClick={() => handleUpdateStatus(apt.id, 'canceled')}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                color: '#F87171',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                              }}
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Nenhum agendamento encontrado com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-ABA 2: EQUIPE & ESCALAS                              */}
      {/* ======================================================== */}
      {subTab === 'professionals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Profissionais & Escalas de Atendimento</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Gerencie os membros da sua equipe, defina comissões (%) e configure a grade semanal de horários de cada um.
              </p>
            </div>
            <button
              onClick={handleOpenNewProf}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: '#2563EB',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Plus size={15} /> Novo Profissional
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {professionals.map((prof) => (
              <div
                key={prof.id}
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        color: '#60A5FA',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                      }}
                    >
                      {prof.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff' }}>{prof.name}</h4>
                      <span style={{ fontSize: '0.76rem', color: '#60A5FA' }}>{prof.specialty || 'Atendimento'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px', padding: '10px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Comissão Serviços</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34D399' }}>{prof.service_commission_pct}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Comissão Produtos</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#A78BFA' }}>{prof.product_commission_pct}%</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <strong>Grade Semanal:</strong> Segunda a Sábado (09:00 - 19:00 com pausa)
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: '12px' }}>
                  <button
                    onClick={() => handleOpenEditProf(prof)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(59, 130, 246, 0.12)',
                      color: '#60A5FA',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Pencil size={13} /> Editar Escala & Dados
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-ABA 3: SERVIÇOS & PACOTES                            */}
      {/* ======================================================== */}
      {subTab === 'services' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Seção 1: Catálogo de Serviços */}
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-subtle)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Catálogo de Serviços da Empresa</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                  Serviços que seus clientes encontram ao agendar pelo link web ou pelo WhatsApp.
                </p>
              </div>
              <button
                onClick={onOpenNewService}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #1F6FFF, #1754C7)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Plus size={14} /> Novo Serviço
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {services.map((srv) => (
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
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34D399' }}>
                        R$ {srv.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '14px' }}>
                      {srv.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>⏱ {srv.durationMinutes} min</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => onOpenEditService(srv)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(31, 111, 255, 0.1)',
                          border: '1px solid rgba(31, 111, 255, 0.25)',
                          color: '#60A5FA',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Pencil size={12} /> Editar
                      </button>
                      <button
                        onClick={() => onDeleteService(srv.id, srv.name)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          color: '#F87171',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seção 2: Pacotes de Serviços & Assinaturas */}
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-subtle)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Pacotes de Serviços & Combos Promocionais</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                  Crie pacotes (ex.: Combo 4 Cortes ou Plano Mensal) para vender antecipadamente com desconto e garantir receita recorrente.
                </p>
              </div>
              <button
                onClick={() => setPkgModalOpen(true)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#2563EB',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Plus size={14} /> Novo Pacote
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {packages.length > 0 ? (
                packages.map((pkg) => (
                  <div
                    key={pkg.id}
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff' }}>{pkg.name}</h4>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#34D399' }}>
                          R$ {Number(pkg.price).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                        {pkg.description || `${pkg.sessions_count} sessões válidas por ${pkg.validity_days} dias.`}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#60A5FA', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                      <span>Sessões: {pkg.sessions_count}</span>
                      <span>Validade: {pkg.validity_days} dias</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                  Nenhum pacote cadastrado ainda. Clique em "Novo Pacote" para criar combos promocionais!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-ABA 4: CLIENTES DA AGENDA                            */}
      {/* ======================================================== */}
      {subTab === 'clients' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Base de Clientes da Agenda</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Histórico consolidado de clientes que agendaram via página pública ou atendimento no WhatsApp.
            </p>
          </div>

          <div className="table-wrapper" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Nome do Cliente</th>
                  <th style={{ padding: '12px 16px' }}>Telefone / WhatsApp</th>
                  <th style={{ padding: '12px 16px' }}>E-mail</th>
                  <th style={{ padding: '12px 16px' }}>Total de Agendamentos</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clients.length > 0 ? (
                  clients.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>{c.name}</td>
                      <td style={{ padding: '14px 16px', color: '#60A5FA' }}>{c.phone || '-'}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{c.email || '-'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '0.74rem', background: 'rgba(59, 130, 246, 0.15)', color: '#93C5FD', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>
                          {c.total_appointments || 0} visitas
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {c.phone && (
                          <button
                            onClick={() => {
                              const cleanPhone = c.phone.replace(/\D/g, '');
                              window.open(`https://wa.me/55${cleanPhone}`, '_blank');
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: '#34D399',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <Phone size={12} /> Abrir WhatsApp
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Nenhum cliente registrado ainda. Clientes são sincronizados automaticamente conforme realizam reservas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-ABA 5: BALCÃO, ESTOQUE & COMISSÕES                   */}
      {/* ======================================================== */}
      {subTab === 'balcao' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Seção 1: Produtos para Revenda no Balcão */}
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-subtle)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Produtos para Venda de Balcão & Estoque</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                  Controle de estoque simples de produtos vendidos no local (pomadas, cosméticos, shampoos, etc.).
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setSaleModalOpen(true)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#10B981',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <DollarSign size={14} /> Registrar Venda de Balcão
                </button>

                <button
                  onClick={() => setProdModalOpen(true)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#2563EB',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Plus size={14} /> Novo Produto
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {products.length > 0 ? (
                products.map((p) => (
                  <div
                    key={p.id}
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff' }}>{p.name}</h4>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34D399' }}>
                          R$ {Number(p.price).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#60A5FA' }}>{p.category}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem' }}>
                      <span style={{ color: p.stock_quantity <= p.min_stock_alert ? '#F87171' : 'var(--text-muted)' }}>
                        Estoque: <strong>{p.stock_quantity} un</strong>
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>Comissão: {p.commission_pct}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                  Nenhum produto cadastrado no estoque ainda. Clique em "Novo Produto" para adicionar itens de revenda.
                </div>
              )}
            </div>
          </div>

          {/* Seção 2: Extrato de Comissões da Equipe */}
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-subtle)', padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Extrato de Comissões da Equipe</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '16px' }}>
              Acompanhamento de comissões geradas por serviços prestados e vendas de balcão.
            </p>

            <div className="table-wrapper">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 14px' }}>Profissional</th>
                    <th style={{ padding: '10px 14px' }}>Tipo & Descrição</th>
                    <th style={{ padding: '10px 14px' }}>Valor Base</th>
                    <th style={{ padding: '10px 14px' }}>Comissão (%)</th>
                    <th style={{ padding: '10px 14px' }}>Valor da Comissão</th>
                    <th style={{ padding: '10px 14px' }}>Status</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.length > 0 ? (
                    commissions.map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#fff' }}>{c.professional_name}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{c.description}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>R$ {Number(c.base_amount).toFixed(2).replace('.', ',')}</td>
                        <td style={{ padding: '12px 14px', color: '#60A5FA' }}>{c.commission_pct}%</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#34D399' }}>R$ {Number(c.commission_amount).toFixed(2).replace('.', ',')}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: '99px',
                              backgroundColor: c.status === 'pago' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: c.status === 'pago' ? '#34D399' : '#FBBF24',
                              fontWeight: 600,
                            }}
                          >
                            {c.status === 'pago' ? 'Pago' : 'Pendente'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          {c.status === 'pendente' && (
                            <button
                              onClick={() => handlePayCommission(c.id)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                color: '#34D399',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                              }}
                            >
                              Marcar Pago
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nenhuma comissão registrada até o momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Seção 3: Controle de Fiados */}
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-subtle)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Caderno de Fiados (Controle de Pendências)</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                  Acompanhe débitos pendentes de clientes habituais e registre acertos parciais ou totais.
                </p>
              </div>
              <button
                onClick={() => setDebtModalOpen(true)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#2563EB',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Plus size={14} /> Novo Registro de Fiado
              </button>
            </div>

            <div className="table-wrapper">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 14px' }}>Cliente</th>
                    <th style={{ padding: '10px 14px' }}>Descrição</th>
                    <th style={{ padding: '10px 14px' }}>Total Devido</th>
                    <th style={{ padding: '10px 14px' }}>Valor Pago</th>
                    <th style={{ padding: '10px 14px' }}>Saldo Restante</th>
                    <th style={{ padding: '10px 14px' }}>Status</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {debts.length > 0 ? (
                    debts.map((d) => {
                      const balance = Number(d.total_amount) - Number(d.paid_amount);
                      return (
                        <tr key={d.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: '#fff' }}>
                            {d.client_name}
                            {d.client_phone && <div style={{ fontSize: '0.72rem', color: '#60A5FA' }}>{d.client_phone}</div>}
                          </td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{d.description}</td>
                          <td style={{ padding: '12px 14px', color: '#fff' }}>R$ {Number(d.total_amount).toFixed(2).replace('.', ',')}</td>
                          <td style={{ padding: '12px 14px', color: '#34D399' }}>R$ {Number(d.paid_amount).toFixed(2).replace('.', ',')}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: balance > 0 ? '#F87171' : '#34D399' }}>
                            R$ {balance.toFixed(2).replace('.', ',')}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                padding: '2px 8px',
                                borderRadius: '99px',
                                backgroundColor: d.status === 'quitado' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: d.status === 'quitado' ? '#34D399' : '#F87171',
                                fontWeight: 600,
                              }}
                            >
                              {d.status === 'quitado' ? 'Quitado' : d.status === 'parcial' ? 'Parcial' : 'Em Aberto'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            {d.status !== 'quitado' && (
                              <button
                                onClick={() => {
                                  setSelectedDebt(d);
                                  setDebtPayAmount(String(balance));
                                  setDebtPayModalOpen(true);
                                }}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                  color: '#60A5FA',
                                  border: '1px solid rgba(59, 130, 246, 0.3)',
                                  fontSize: '0.74rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Receber / Abater
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nenhum registro de fiado no momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-ABA 6: PÁGINA PÚBLICA & SINAL PIX                     */}
      {/* ======================================================== */}
      {subTab === 'settings' && (
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Card 1: Canal de Divulgação Online */}
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-subtle)', padding: '22px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
              Divulgação da Página Pública de Agendamento
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '16px' }}>
              Este é o endereço direto e limpo que seus clientes usam para agendar pelo celular.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', backgroundColor: 'var(--bg-surface-elevated)', padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>URL Pública de Autoatendimento 24/7</div>
                <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#38BDF8', wordBreak: 'break-all' }}>
                  {publicUrl}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => window.open(publicUrl, '_blank')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#2563EB',
                    color: '#fff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  <ExternalLink size={14} /> Abrir Página
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(publicUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: copiedLink ? '#34D399' : '#fff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid var(--border-hover)',
                  }}
                >
                  {copiedLink ? <CheckCheck size={14} color="#34D399" /> : <Copy size={14} />}
                  {copiedLink ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Identidade Visual & Apresentação */}
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-subtle)', padding: '22px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
              Identidade Visual & Cores da Página Pública
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '18px' }}>
              Personalize como seus clientes veem a página de agendamento online no celular.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Cor Primária da Marca (Botões e Destaques)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="color"
                    value={settings.brand_color || '#2563EB'}
                    onChange={(e) => setSettings({ ...settings, brand_color: e.target.value })}
                    style={{ width: '42px', height: '38px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'transparent' }}
                  />
                  <input
                    type="text"
                    value={settings.brand_color || '#2563EB'}
                    onChange={(e) => setSettings({ ...settings, brand_color: e.target.value })}
                    style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  URL do Logotipo da Empresa
                </label>
                <input
                  type="text"
                  placeholder="https://suaempresa.com.br/logo.png"
                  value={settings.logo_url || ''}
                  onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Biografia / Apresentação da Empresa (Visível no Topo da Página)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Especialistas em cuidados pessoais e bem-estar com atendimento personalizado."
                  value={settings.bio || ''}
                  onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Endereço do Local de Atendimento
                </label>
                <input
                  type="text"
                  placeholder="Rua Exemplo, 123"
                  value={settings.address || ''}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Cidade / Estado
                </label>
                <input
                  type="text"
                  placeholder="São Paulo - SP"
                  value={settings.city ? `${settings.city} - ${settings.state || ''}` : ''}
                  onChange={(e) => {
                    const parts = e.target.value.split('-');
                    setSettings({
                      ...settings,
                      city: parts[0]?.trim() || '',
                      state: parts[1]?.trim() || '',
                    });
                  }}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Regras de Agendamento */}
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-subtle)', padding: '22px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
              Regras & Intervalos de Agendamento
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '18px' }}>
              Defina a duração dos slots de horário e com que antecedência os clientes podem agendar.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Intervalo entre Horários (Slots da Agenda)
                </label>
                <select
                  value={settings.slot_interval_minutes || 30}
                  onChange={(e) => setSettings({ ...settings, slot_interval_minutes: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                >
                  <option value={15}>A cada 15 minutos</option>
                  <option value={30}>A cada 30 minutos (Padrão)</option>
                  <option value={45}>A cada 45 minutos</option>
                  <option value={60}>A cada 60 minutos (1 hora)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Antecedência Máxima para Agendar
                </label>
                <select
                  value={settings.max_advance_days || 30}
                  onChange={(e) => setSettings({ ...settings, max_advance_days: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                >
                  <option value={7}>Até 7 dias no futuro</option>
                  <option value={15}>Até 15 dias no futuro</option>
                  <option value={30}>Até 30 dias no futuro (Recomendado)</option>
                  <option value={60}>Até 60 dias no futuro</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Tempo Mínimo para Cancelamento
                </label>
                <select
                  value={settings.min_cancel_hours || 2}
                  onChange={(e) => setSettings({ ...settings, min_cancel_hours: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                >
                  <option value={1}>Até 1 hora antes</option>
                  <option value={2}>Até 2 horas antes (Padrão)</option>
                  <option value={4}>Até 4 horas antes</option>
                  <option value={24}>Até 24 horas antes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 4: Sinal Pix Anti No-Show (Agillex Pay) */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '14px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '22px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(15, 23, 42, 0.95) 100%)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#34D399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Agillex Pay · Redução de Faltas
                  </span>
                  <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.2)', color: '#6EE7B7', padding: '1px 8px', borderRadius: '99px', fontWeight: 600 }}>
                    Taxa Fixa R$ 1,99
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                  Sinal / Adiantamento Pix Anti No-Show
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', maxWidth: '650px' }}>
                  Exija um adiantamento no agendamento para travar a vaga e reduzir no-shows em até 85%. O valor é descontado no atendimento presencial.
                </p>
              </div>

              {/* Toggle de ativação */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.require_pix_deposit === true}
                  onChange={(e) => setSettings({ ...settings, require_pix_deposit: e.target.checked })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: settings.require_pix_deposit ? '#34D399' : 'var(--text-muted)' }}>
                  {settings.require_pix_deposit ? 'Ativado' : 'Desativado'}
                </span>
              </label>
            </div>

            {settings.require_pix_deposit && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Valor Fixo do Sinal (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 30.00"
                    value={settings.pix_deposit_amount || ''}
                    onChange={(e) => setSettings({ ...settings, pix_deposit_amount: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Cobrado imediatamente via Pix Copia e Cola no agendamento.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Botão de Salvar Configurações */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
            {settingsSavedToast && (
              <span style={{ fontSize: '0.82rem', color: '#34D399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckCheck size={16} /> Configurações salvas com sucesso!
              </span>
            )}
            <button
              type="submit"
              disabled={settingsSaving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 24px',
                borderRadius: '8px',
                backgroundColor: '#2563EB',
                color: '#fff',
                fontSize: '0.86rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(37, 99, 235, 0.35)',
              }}
            >
              {settingsSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {settingsSaving ? 'Salvando...' : 'Salvar Todas as Configurações'}
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* MODAL: NOVO / EDITAR PROFISSIONAL                        */}
      {/* ======================================================== */}
      {profModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            padding: '16px',
          }}
          onClick={() => {
            if (!profSaving) setProfModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '640px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                {editingProf ? 'Editar Profissional & Escala' : 'Novo Membro da Equipe'}
              </h3>
              <button
                type="button"
                onClick={() => setProfModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProf} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Nome do Profissional *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Silva"
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Especialidade / Cargo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Barbeiro Master, Cabeleireiro, Dentista"
                    value={profSpecialty}
                    onChange={(e) => setProfSpecialty(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    WhatsApp do Profissional
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={profPhone}
                    onChange={(e) => setProfPhone(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="carlos@exemplo.com"
                    value={profEmail}
                    onChange={(e) => setProfEmail(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Comissão em Serviços (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={profServiceComm}
                    onChange={(e) => setProfServiceComm(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Comissão em Produtos (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={profProductComm}
                    onChange={(e) => setProfProductComm(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              {/* Grade Semanal de Horários */}
              <div>
                <label style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                  Grade Semanal de Horários & Pausa de Almoço
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  {profSchedule.map((item, idx) => (
                    <div key={item.day_of_week} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr', gap: '8px', alignItems: 'center', fontSize: '0.78rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: item.is_active ? '#fff' : 'var(--text-muted)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={item.is_active}
                          onChange={(e) => {
                            const copy = [...profSchedule];
                            copy[idx].is_active = e.target.checked;
                            setProfSchedule(copy);
                          }}
                        />
                        {item.name}
                      </label>

                      <div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Entrada - Saída</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input
                            type="time"
                            disabled={!item.is_active}
                            value={item.start_time}
                            onChange={(e) => {
                              const copy = [...profSchedule];
                              copy[idx].start_time = e.target.value;
                              setProfSchedule(copy);
                            }}
                            style={{ width: '100%', padding: '4px', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.74rem' }}
                          />
                          <input
                            type="time"
                            disabled={!item.is_active}
                            value={item.end_time}
                            onChange={(e) => {
                              const copy = [...profSchedule];
                              copy[idx].end_time = e.target.value;
                              setProfSchedule(copy);
                            }}
                            style={{ width: '100%', padding: '4px', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.74rem' }}
                          />
                        </div>
                      </div>

                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Pausa Almoço (Início - Fim)</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input
                            type="time"
                            disabled={!item.is_active}
                            value={item.break_start}
                            onChange={(e) => {
                              const copy = [...profSchedule];
                              copy[idx].break_start = e.target.value;
                              setProfSchedule(copy);
                            }}
                            style={{ width: '100%', padding: '4px', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.74rem' }}
                          />
                          <input
                            type="time"
                            disabled={!item.is_active}
                            value={item.break_end}
                            onChange={(e) => {
                              const copy = [...profSchedule];
                              copy[idx].break_end = e.target.value;
                              setProfSchedule(copy);
                            }}
                            style={{ width: '100%', padding: '4px', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.74rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setProfModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={profSaving}
                  style={{ padding: '8px 18px', borderRadius: '8px', backgroundColor: '#2563EB', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                >
                  {profSaving ? 'Salvando...' : 'Salvar Profissional'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: NOVO PACOTE                                       */}
      {/* ======================================================== */}
      {pkgModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            padding: '16px',
          }}
          onClick={() => {
            if (!pkgSaving) setPkgModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Novo Pacote de Serviços</h3>
              <button
                type="button"
                onClick={() => setPkgModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePackage} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                  Nome do Pacote *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Combo 4 Cortes Masculinos"
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Preço Total (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="120.00"
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Quantidade de Sessões
                  </label>
                  <input
                    type="number"
                    value={pkgSessions}
                    onChange={(e) => setPkgSessions(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                  Validade do Pacote (Dias)
                </label>
                <input
                  type="number"
                  value={pkgValidity}
                  onChange={(e) => setPkgValidity(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                  Descrição / Detalhes
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: 4 cortes no mês com horário flexível."
                  value={pkgDesc}
                  onChange={(e) => setPkgDesc(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPkgModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pkgSaving}
                  style={{ padding: '8px 18px', borderRadius: '8px', backgroundColor: '#2563EB', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                >
                  {pkgSaving ? 'Salvando...' : 'Criar Pacote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: NOVO PRODUTO                                      */}
      {/* ======================================================== */}
      {prodModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            padding: '16px',
          }}
          onClick={() => {
            if (!prodSaving) setProdModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Novo Produto no Estoque</h3>
              <button
                type="button"
                onClick={() => setProdModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pomada Modeladora Efeito Matte"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="45.00"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Preço de Custo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="20.00"
                    value={prodCost}
                    onChange={(e) => setProdCost(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Quantidade em Estoque
                  </label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Comissão de Venda (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={prodComm}
                    onChange={(e) => setProdComm(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setProdModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={prodSaving}
                  style={{ padding: '8px 18px', borderRadius: '8px', backgroundColor: '#2563EB', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                >
                  {prodSaving ? 'Salvando...' : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REGISTRAR VENDA DE BALCÃO                         */}
      {/* ======================================================== */}
      {saleModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            padding: '16px',
          }}
          onClick={() => {
            if (!saleSaving) setSaleModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Registrar Venda de Balcão</h3>
              <button
                type="button"
                onClick={() => setSaleModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordSale} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                  Selecionar Produto *
                </label>
                <select
                  required
                  value={saleProduct?.id || ''}
                  onChange={(e) => {
                    const found = products.find((p) => p.id === e.target.value);
                    setSaleProduct(found || null);
                  }}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                >
                  <option value="">Selecione um produto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — R$ {Number(p.price).toFixed(2).replace('.', ',')} (Estoque: {p.stock_quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={saleQty}
                    onChange={(e) => setSaleQty(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Forma de Pagamento
                  </label>
                  <select
                    value={salePayment}
                    onChange={(e) => setSalePayment(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                  >
                    <option value="pix">Pix</option>
                    <option value="cartao">Cartão</option>
                    <option value="dinheiro">Dinheiro</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                  Profissional Vendedor (Gera Comissão)
                </label>
                <select
                  value={saleProfId}
                  onChange={(e) => setSaleProfId(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                >
                  <option value="">Nenhum (Venda Direta da Casa)</option>
                  {professionals.map((prof) => (
                    <option key={prof.id} value={prof.id}>
                      {prof.name} ({prof.product_commission_pct}% comissão)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                  Nome do Cliente (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Cliente Balcão"
                  value={saleClient}
                  onChange={(e) => setSaleClient(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                />
              </div>

              {saleProduct && (
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Total da Venda:</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34D399' }}>
                    R$ {(Number(saleProduct.price) * (parseInt(saleQty, 10) || 1)).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSaleModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saleSaving || !saleProduct}
                  style={{ padding: '8px 18px', borderRadius: '8px', backgroundColor: '#10B981', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                >
                  {saleSaving ? 'Registrando...' : 'Confirmar Venda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: NOVO REGISTRO DE FIADO                            */}
      {/* ======================================================== */}
      {debtModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            padding: '16px',
          }}
          onClick={() => {
            if (!debtSaving) setDebtModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Novo Lançamento de Fiado</h3>
              <button
                type="button"
                onClick={() => setDebtModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDebt} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={debtClient}
                  onChange={(e) => setDebtClient(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                  WhatsApp do Cliente
                </label>
                <input
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={debtPhone}
                  onChange={(e) => setDebtPhone(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                  Descrição dos Itens / Serviços *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Corte + Barba + Pomada"
                  value={debtDesc}
                  onChange={(e) => setDebtDesc(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                  Valor Total Devido (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="85.00"
                  value={debtTotal}
                  onChange={(e) => setDebtTotal(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setDebtModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={debtSaving}
                  style={{ padding: '8px 18px', borderRadius: '8px', backgroundColor: '#2563EB', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                >
                  {debtSaving ? 'Salvando...' : 'Lançar Fiado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REGISTRAR PAGAMENTO DE FIADO                      */}
      {/* ======================================================== */}
      {debtPayModalOpen && selectedDebt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            padding: '16px',
          }}
          onClick={() => {
            if (!debtPaySaving) setDebtPayModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Receber / Abater Fiado</h3>
              <button
                type="button"
                onClick={() => setDebtPayModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#fff' }}>{selectedDebt.client_name}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{selectedDebt.description}</div>
            </div>

            <form onSubmit={handlePayDebt} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                  Valor Pago (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={debtPayAmount}
                  onChange={(e) => setDebtPayAmount(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                  Forma de Pagamento
                </label>
                <select
                  value={debtPayMethod}
                  onChange={(e) => setDebtPayMethod(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                >
                  <option value="pix">Pix</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartão</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setDebtPayModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={debtPaySaving}
                  style={{ padding: '8px 18px', borderRadius: '8px', backgroundColor: '#10B981', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                >
                  {debtPaySaving ? 'Registrando...' : 'Confirmar Recebimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REAGENDAMENTO DE HORÁRIO                          */}
      {/* ======================================================== */}
      {rescheduleApt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            padding: '16px',
          }}
          onClick={() => {
            if (!rescheduleSaving) setRescheduleApt(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Reagendar Atendimento</h3>
              <button
                type="button"
                onClick={() => setRescheduleApt(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>{rescheduleApt.leadName}</div>
              <div style={{ fontSize: '0.76rem', color: '#60A5FA' }}>{rescheduleApt.serviceName}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Horário atual: {rescheduleApt.date} às {rescheduleApt.time}
              </div>
            </div>

            <form onSubmit={handleReschedule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                  Nova Data *
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                  Novo Horário *
                </label>
                <input
                  type="time"
                  required
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setRescheduleApt(null)}
                  style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={rescheduleSaving}
                  style={{ padding: '8px 18px', borderRadius: '8px', backgroundColor: '#2563EB', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                >
                  {rescheduleSaving ? 'Salvando...' : 'Confirmar Reagendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
