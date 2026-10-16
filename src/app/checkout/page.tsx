'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  FileText,
  CheckCircle,
  Copy,
  ArrowRight,
  Sparkles,
  Lock,
  Building2,
  Calendar,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { SAAS_PLANS, PlanConfig, ModuleType, BillingCycle, BillingMethod } from '@/types/pricing';

function CheckoutContent() {
  const searchParams = useSearchParams();

  // Parâmetros iniciais da URL
  const initialModule = (searchParams.get('modulo') as ModuleType) || 'atendimento';
  const initialPlanId = searchParams.get('plano') || (initialModule === 'atendimento' ? 'pro' : initialModule === 'agenda' ? 'agenda_intermediario' : 'combo');
  const initialCycle = (searchParams.get('ciclo') as BillingCycle) || 'monthly';
  const initialTrial = searchParams.get('trial') === 'true';
  const initialEmail = searchParams.get('email') || '';

  const [selectedModule, setSelectedModule] = useState<ModuleType>(initialModule);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId);
  const [cycle, setCycle] = useState<BillingCycle>(initialCycle);
  const [isTrial, setIsTrial] = useState<boolean>(initialTrial);
  const [billingMethod, setBillingMethod] = useState<BillingMethod>('CREDIT_CARD');

  // Formulário
  const [formData, setFormData] = useState({
    name: '',
    email: initialEmail,
    phone: '',
    cpfCnpj: '',
    companyName: '',
  });

  // Cartão de crédito
  const [cardData, setCardData] = useState({
    number: '',
    holderName: '',
    expiry: '',
    ccv: '',
  });

  // Estados de processamento
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  const [pixData, setPixData] = useState<{ qrCode: string; copyPaste: string; paymentId: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Filtrar planos do módulo ativo
  const availablePlans = Object.values(SAAS_PLANS).filter((p) => p.module === selectedModule);

  // Garantir plano selecionado válido ao trocar módulo
  useEffect(() => {
    const plans = Object.values(SAAS_PLANS).filter((p) => p.module === selectedModule);
    if (!plans.some((p) => p.id === selectedPlanId)) {
      if (plans.length > 0) {
        setSelectedPlanId(plans[0].id);
      }
    }
  }, [selectedModule, selectedPlanId]);

  const currentPlan: PlanConfig = SAAS_PLANS[selectedPlanId] || availablePlans[0] || SAAS_PLANS['pro'];
  const isYearly = cycle === 'yearly';
  const displayPrice = isYearly ? currentPlan.priceYearlyMonthly : currentPlan.priceMonthly;
  const totalPrice = isYearly ? currentPlan.annualTotal : currentPlan.priceMonthly;

  // Polling para checagem do PIX
  useEffect(() => {
    let interval: any;
    if (pixData?.paymentId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/checkout/status?paymentId=${pixData.paymentId}`);
          const data = await res.json();
          if (data.isPaid) {
            setSuccessData({
              status: 'active',
              plan: currentPlan.name,
              message: 'Pagamento PIX confirmado com sucesso! Sua conta foi ativada.',
            });
            setPixData(null);
            clearInterval(interval);
          }
        } catch (e) {
          console.error('Erro ao verificar status PIX:', e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [pixData, currentPlan.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // Decompor validade do cartão
      let expiryMonth = '';
      let expiryYear = '';
      if (billingMethod === 'CREDIT_CARD' && !isTrial) {
        const parts = cardData.expiry.split('/');
        if (parts.length === 2) {
          expiryMonth = parts[0].trim();
          expiryYear = parts[1].trim().length === 2 ? `20${parts[1].trim()}` : parts[1].trim();
        }
      }

      const payload = {
        ...formData,
        planId: currentPlan.id,
        cycle,
        billingMethod,
        isTrial,
        creditCard:
          billingMethod === 'CREDIT_CARD' && !isTrial
            ? {
                holderName: cardData.holderName,
                number: cardData.number,
                expiryMonth,
                expiryYear,
                ccv: cardData.ccv,
              }
            : undefined,
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ocorreu um erro ao processar o checkout.');
      }

      if (data.billingMethod === 'PIX' && data.copyPaste) {
        setPixData({
          qrCode: data.qrCodeBase64,
          copyPaste: data.copyPaste,
          paymentId: data.paymentId,
        });
      } else {
        setSuccessData(data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha na conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const copyPixToClipboard = () => {
    if (pixData?.copyPaste) {
      navigator.clipboard.writeText(pixData.copyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#030712', color: '#f3f4f6', fontFamily: 'Inter, sans-serif' }}>
      {/* Header com selo de segurança */}
      <header
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(12px)',
          padding: '16px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#fff',
                fontSize: '18px',
              }}
            >
              A
            </div>
            <div>
              <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>AllLogic</span>
              <span style={{ fontSize: '18px', fontWeight: 400, color: '#94a3b8', marginLeft: '6px' }}>Checkout</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '13px', fontWeight: 600 }}>
            <ShieldCheck size={18} />
            <span>Ambiente Seguro 256-bit SSL</span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 20px 80px' }}>
        {/* Caso de Sucesso */}
        {successData && (
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '16px',
              padding: '48px 32px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <CheckCircle size={40} />
            </div>

            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
              {isTrial ? 'Período de Teste Ativado com Sucesso!' : 'Assinatura Confirmada!'}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '16px', maxWidth: '540px', margin: '0 auto 32px', lineHeight: 1.6 }}>
              {successData.message}
            </p>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '20px',
                maxWidth: '460px',
                margin: '0 auto 32px',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>Plano Contratado:</span>
                <span style={{ fontWeight: 600, color: '#f8fafc' }}>{successData.plan}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>Status da Conta:</span>
                <span style={{ color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>
                  {isTrial ? 'Teste Grátis (14 Dias)' : 'Ativo e Liberado'}
                </span>
              </div>
              {successData.trialEndDate && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#64748b' }}>Válido até:</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                    {new Date(successData.trialEndDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>

            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 32px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                color: '#ffffff',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
              }}
            >
              <span>Acessar Painel do Agillex Hub</span>
              <ArrowRight size={18} />
            </a>
          </div>
        )}

        {/* Modal PIX em exibição */}
        {!successData && pixData && (
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '16px',
              padding: '36px 28px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                padding: '6px 14px',
                borderRadius: '20px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                fontSize: '13px',
                fontWeight: 700,
                marginBottom: '16px',
              }}
            >
              PIX DINÂMICO GERADO
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
              Pague via PIX para ativação imediata
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '15px', maxWidth: '520px', margin: '0 auto 24px' }}>
              Abra o app do seu banco, escolha a opção <strong>PIX</strong> e aponte a câmera para o QR Code ou copie o código Copia e Cola.
            </p>

            {/* Imagem do QR Code */}
            {pixData.qrCode && (
              <div
                style={{
                  background: '#ffffff',
                  padding: '16px',
                  borderRadius: '12px',
                  display: 'inline-block',
                  marginBottom: '24px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                }}
              >
                <img
                  src={`data:image/png;base64,${pixData.qrCode}`}
                  alt="QR Code PIX"
                  style={{ width: '220px', height: '220px', display: 'block' }}
                />
              </div>
            )}

            {/* Campo Copia e Cola */}
            <div style={{ maxWidth: '500px', margin: '0 auto 24px' }}>
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <input
                  type="text"
                  readOnly
                  value={pixData.copyPaste}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    width: '100%',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={copyPixToClipboard}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: copied ? '#10b981' : '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Copy size={14} />
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#10b981', fontSize: '14px', fontWeight: 600 }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  animation: 'pulse 1.5s infinite',
                }}
              />
              <span>Aguardando confirmação do banco... (A ativação é automática)</span>
            </div>
          </div>
        )}

        {/* Formulário de Checkout Normal */}
        {!successData && !pixData && (
          <div>
            {/* Seletor de Módulos (Tabs) */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <span
                style={{
                  display: 'inline-block',
                  color: '#60a5fa',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                ESCOLHA SEU MÓDULO AGILLEX
              </span>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '20px' }}>
                Ativação e Assinatura Segura
              </h1>

              {/* Módulos */}
              <div
                style={{
                  display: 'inline-flex',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '4px',
                  gap: '4px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedModule('atendimento')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: selectedModule === 'atendimento' ? '#2563eb' : 'transparent',
                    color: selectedModule === 'atendimento' ? '#fff' : '#94a3b8',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <MessageSquare size={16} />
                  <span>Agillex Atendimento (IA)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedModule('agenda')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: selectedModule === 'agenda' ? '#2563eb' : 'transparent',
                    color: selectedModule === 'agenda' ? '#fff' : '#94a3b8',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <Calendar size={16} />
                  <span>Agillex Agenda</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedModule('combo')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: selectedModule === 'combo' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <Sparkles size={16} />
                  <span>Combo Agillex</span>
                </button>
              </div>
            </div>

            {/* Alternador de Periodicidade e Trial */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '40px',
                flexWrap: 'wrap',
              }}
            >
              {/* Botão Mensal vs Anual */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '30px',
                  padding: '4px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setCycle('monthly')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '24px',
                    border: 'none',
                    background: cycle === 'monthly' ? '#1e293b' : 'transparent',
                    color: cycle === 'monthly' ? '#ffffff' : '#94a3b8',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setCycle('yearly')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '24px',
                    border: 'none',
                    background: cycle === 'yearly' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>Anual</span>
                  <span style={{ fontSize: '11px', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '10px' }}>
                    -20% OFF
                  </span>
                </button>
              </div>

              {/* Botão de Toggle Trial */}
              <button
                type="button"
                onClick={() => setIsTrial(!isTrial)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '30px',
                  border: isTrial ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.15)',
                  background: isTrial ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: isTrial ? '#34d399' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Zap size={15} color={isTrial ? '#10b981' : '#94a3b8'} />
                <span>{isTrial ? 'Modo: Teste 14 Dias Grátis (Ativo)' : 'Quero testar 14 dias grátis primeiro'}</span>
              </button>
            </div>

            {/* Grid 2 Colunas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
              {/* Coluna 1: Dados do Cliente e Pagamento */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '28px',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={20} color="#3b82f6" />
                  <span>Dados da Sua Empresa</span>
                </h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                      Nome do Negócio / Razão Social
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Clínica Vitta ou Barbearia do Lucas"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        background: 'rgba(0, 0, 0, 0.25)',
                        color: '#f8fafc',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                        Seu Nome Completo
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nome do responsável"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          background: 'rgba(0, 0, 0, 0.25)',
                          color: '#f8fafc',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                        CPF ou CNPJ
                      </label>
                      <input
                        type="text"
                        required={!isTrial}
                        placeholder="000.000.000-00"
                        value={formData.cpfCnpj}
                        onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          background: 'rgba(0, 0, 0, 0.25)',
                          color: '#f8fafc',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                        E-mail de Acesso
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          background: 'rgba(0, 0, 0, 0.25)',
                          color: '#f8fafc',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                        WhatsApp com DDD
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="(11) 90000-0000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          background: 'rgba(0, 0, 0, 0.25)',
                          color: '#f8fafc',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Se for apenas teste grátis, não pede dados de pagamento */}
                  {isTrial ? (
                    <div
                      style={{
                        marginTop: '16px',
                        padding: '16px',
                        borderRadius: '10px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        fontSize: '13px',
                        color: '#a7f3d0',
                        lineHeight: 1.5,
                      }}
                    >
                      ✓ <strong>Você está ativando 14 dias de teste grátis.</strong>
                      <br />
                      Nenhum cartão ou pagamento é exigido agora. Sua conta será provisionada na hora.
                    </div>
                  ) : (
                    /* Seção de Forma de Pagamento */
                    <div style={{ marginTop: '16px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '12px' }}>
                        Forma de Pagamento
                      </label>

                      {/* Botões de Seleção da Forma de Pagamento */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                        <button
                          type="button"
                          onClick={() => setBillingMethod('CREDIT_CARD')}
                          style={{
                            padding: '12px 8px',
                            borderRadius: '8px',
                            border: billingMethod === 'CREDIT_CARD' ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                            background: billingMethod === 'CREDIT_CARD' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0,0,0,0.2)',
                            color: billingMethod === 'CREDIT_CARD' ? '#60a5fa' : '#94a3b8',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <CreditCard size={18} />
                          <span>Cartão</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBillingMethod('PIX')}
                          style={{
                            padding: '12px 8px',
                            borderRadius: '8px',
                            border: billingMethod === 'PIX' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                            background: billingMethod === 'PIX' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0,0,0,0.2)',
                            color: billingMethod === 'PIX' ? '#34d399' : '#94a3b8',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <QrCode size={18} />
                          <span>PIX</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBillingMethod('BOLETO')}
                          style={{
                            padding: '12px 8px',
                            borderRadius: '8px',
                            border: billingMethod === 'BOLETO' ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                            background: billingMethod === 'BOLETO' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0,0,0,0.2)',
                            color: billingMethod === 'BOLETO' ? '#fbbf24' : '#94a3b8',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <FileText size={18} />
                          <span>Boleto</span>
                        </button>
                      </div>

                      {/* Campos do Cartão de Crédito */}
                      {billingMethod === 'CREDIT_CARD' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                              Número do Cartão de Crédito
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="0000 0000 0000 0000"
                              value={cardData.number}
                              onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                background: 'rgba(0, 0, 0, 0.25)',
                                color: '#f8fafc',
                                fontSize: '14px',
                                outline: 'none',
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                              Nome impresso no Cartão
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="NOME COMO NO CARTÃO"
                              value={cardData.holderName}
                              onChange={(e) => setCardData({ ...cardData, holderName: e.target.value.toUpperCase() })}
                              style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                background: 'rgba(0, 0, 0, 0.25)',
                                color: '#f8fafc',
                                fontSize: '14px',
                                outline: 'none',
                              }}
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                                Validade (MM/AA)
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="12/28"
                                maxLength={5}
                                value={cardData.expiry}
                                onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '10px 14px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(255, 255, 255, 0.12)',
                                  background: 'rgba(0, 0, 0, 0.25)',
                                  color: '#f8fafc',
                                  fontSize: '14px',
                                  outline: 'none',
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                                Código CVV
                              </label>
                              <input
                                type="password"
                                required
                                placeholder="123"
                                maxLength={4}
                                value={cardData.ccv}
                                onChange={(e) => setCardData({ ...cardData, ccv: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '10px 14px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(255, 255, 255, 0.12)',
                                  background: 'rgba(0, 0, 0, 0.25)',
                                  color: '#f8fafc',
                                  fontSize: '14px',
                                  outline: 'none',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {billingMethod === 'PIX' && (
                        <div
                          style={{
                            padding: '16px',
                            borderRadius: '8px',
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            fontSize: '13px',
                            color: '#a7f3d0',
                            lineHeight: 1.5,
                          }}
                        >
                          ⚡ <strong>PIX Instantâneo:</strong> Ao clicar no botão abaixo, geraremos o QR Code e o código Copia e Cola para pagamento imediato no app do seu banco.
                        </div>
                      )}

                      {billingMethod === 'BOLETO' && (
                        <div
                          style={{
                            padding: '16px',
                            borderRadius: '8px',
                            background: 'rgba(245, 158, 11, 0.08)',
                            border: '1px solid rgba(245, 158, 11, 0.2)',
                            fontSize: '13px',
                            color: '#fde68a',
                            lineHeight: 1.5,
                          }}
                        >
                          📄 <strong>Boleto Bancário:</strong> O boleto será gerado com vencimento em 3 dias úteis e QR Code PIX no topo para compensação imediata.
                        </div>
                      )}
                    </div>
                  )}

                  {errorMsg && (
                    <div style={{ color: '#ef4444', fontSize: '13px', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '6px' }}>
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      marginTop: '8px',
                      padding: '16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isTrial
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #2563eb, #4f46e5)',
                      color: '#ffffff',
                      fontSize: '15px',
                      fontWeight: 700,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 15px rgba(37, 99, 235, 0.35)',
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    <Lock size={16} />
                    <span>
                      {loading
                        ? 'Processando...'
                        : isTrial
                        ? 'Iniciar Teste de 14 Dias Grátis'
                        : billingMethod === 'PIX'
                        ? `Gerar PIX de R$ ${totalPrice.toFixed(2).replace('.', ',')}`
                        : `Confirmar Assinatura (R$ ${totalPrice.toFixed(2).replace('.', ',')})`}
                    </span>
                  </button>
                </form>
              </div>

              {/* Coluna 2: Resumo do Pedido e Planos */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '16px' }}>
                    Resumo do Plano
                  </h3>

                  {/* Seleção do Plano no Módulo */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                    {availablePlans.map((plan) => {
                      const isSelected = plan.id === selectedPlanId;
                      const planMonthly = isYearly ? plan.priceYearlyMonthly : plan.priceMonthly;

                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          style={{
                            padding: '14px 16px',
                            borderRadius: '10px',
                            border: isSelected ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.06)',
                            background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 700, fontSize: '14px', color: isSelected ? '#ffffff' : '#cbd5e1' }}>
                                {plan.name}
                              </span>
                              {plan.badge && (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    background: isSelected ? '#2563eb' : 'rgba(255,255,255,0.1)',
                                    color: '#ffffff',
                                  }}
                                >
                                  {plan.badge}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                              {plan.tagline}
                            </span>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontWeight: 800, fontSize: '16px', color: isSelected ? '#60a5fa' : '#94a3b8' }}>
                              R$ {planMonthly.toFixed(2).replace('.', ',')}
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>/mês</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Benefícios Inclusos */}
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                      Recursos inclusos neste plano:
                    </span>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {currentPlan.features.map((feat, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                          <CheckCircle size={14} color="#10b981" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Total da Fatura */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#94a3b8' }}>
                    <span>Ciclo de Cobrança:</span>
                    <span style={{ color: '#f8fafc', fontWeight: 600 }}>{isYearly ? 'Anual (20% OFF)' : 'Mensal'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Total:</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '24px', fontWeight: 900, color: '#60a5fa' }}>
                        {isTrial ? 'R$ 0,00' : `R$ ${totalPrice.toFixed(2).replace('.', ',')}`}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>
                        {isTrial ? 'durante 14 dias' : isYearly ? 'cobrado anualmente' : 'cobrado mensalmente'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Carregando Checkout Seguro...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
