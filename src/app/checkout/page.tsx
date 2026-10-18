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
import './checkout.css';

function CheckoutContent() {
  const searchParams = useSearchParams();

  // Parâmetros iniciais da URL
  const initialModule = (searchParams.get('modulo') as ModuleType) || 'combo';
  const initialPlanId =
    searchParams.get('plano') ||
    (initialModule === 'atendimento'
      ? 'pro'
      : initialModule === 'agenda'
      ? 'agenda_intermediario'
      : 'combo');
  const initialCycle = (searchParams.get('ciclo') as BillingCycle) || 'monthly';
  const initialTrial = searchParams.get('trial') === 'true';
  const initialEmail = searchParams.get('email') || '';

  const [selectedModule, setSelectedModule] = useState<ModuleType>(initialModule);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId);
  const [cycle, setCycle] = useState<BillingCycle>(initialCycle);
  const [isTrial, setIsTrial] = useState<boolean>(initialTrial);
  const [billingMethod, setBillingMethod] = useState<BillingMethod>('CREDIT_CARD');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [footerDropdownOpen, setFooterDropdownOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    const handleDocumentClick = () => {
      setDropdownOpen(false);
      setFooterDropdownOpen(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleDocumentClick);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

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

  const currentPlan: PlanConfig =
    SAAS_PLANS[selectedPlanId] || availablePlans[0] || SAAS_PLANS['combo'] || SAAS_PLANS['pro'];
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
    <div className="checkout-page">
      {/* 2. HEADER E MENU INSTITUCIONAL (Idêntico ao site) */}
      <header className="site-header">
        {/* 1. TOPBAR DE SERVIÇOS (Idêntica ao site) */}
        <div className="header__services">
          <a
            className="header__services-link"
            href="https://alllogiconline.com.br/dominios-e-hospedagem"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Encontre seu domínio</span>
          </a>
          <span className="header__services-sep" aria-hidden="true">|</span>
          <a
            className="header__services-link"
            href="https://alllogiconline.com.br/dominios-e-hospedagem#hospedagem-sites"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Hospede seu site</span>
          </a>
        </div>

        <div className="checkout-container">
          <div className="site-header__inner">
            <div className="site-header__brand">
              <a href="https://alllogiconline.com.br" className="site-header__logo" aria-label="AllLogic Online">
                <img src="/images/logo-alllogic.png" alt="AllLogic Online" />
              </a>

              {/* Botão hambúrguer no mobile */}
              <button
                type="button"
                className="site-navigation__toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-label="Abrir menu de navegação"
              >
                <span className="site-navigation__toggle-icon" aria-hidden="true">
                  <span className="site-navigation__toggle-bar"></span>
                  <span className="site-navigation__toggle-bar"></span>
                  <span className="site-navigation__toggle-bar"></span>
                </span>
              </button>
            </div>

            {/* Menu com os 9 itens oficiais do site */}
            <nav className={`site-navigation ${mobileMenuOpen ? 'is-open' : ''}`} aria-label="Navegação primária">
              <ul className="site-navigation__list">
                <li>
                  <a href="https://alllogiconline.com.br/" className="site-navigation__link">
                    Início
                  </a>
                </li>
                <li>
                  <a href="https://alllogiconline.com.br/#solucoes" className="site-navigation__link">
                    Soluções
                  </a>
                </li>
                <li className={`site-navigation__item--has-dropdown ${dropdownOpen ? 'is-open' : ''}`}>
                  <div className="site-navigation__dropdown">
                    <button
                      type="button"
                      className="site-navigation__link site-navigation__dropdown-toggle"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      aria-expanded={dropdownOpen}
                      aria-haspopup="true"
                    >
                      <span>Família Agillex</span>
                      <svg
                        className="site-navigation__dropdown-icon"
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M4 6L8 10L12 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <ul className="site-navigation__dropdown-menu" role="menu">
                      <li role="none">
                        <a
                          href="https://alllogiconline.com.br/agillex-hub"
                          className="site-navigation__dropdown-link"
                          role="menuitem"
                        >
                          Agillex Hub
                        </a>
                      </li>
                      <li role="none">
                        <a
                          href="https://alllogiconline.com.br/agillex-agenda"
                          className="site-navigation__dropdown-link"
                          role="menuitem"
                        >
                          Agillex Agenda
                        </a>
                      </li>
                      <li role="none">
                        <a
                          href="https://alllogiconline.com.br/agillex-atendimento"
                          className="site-navigation__dropdown-link"
                          role="menuitem"
                        >
                          Agillex Atendimento
                        </a>
                      </li>
                    </ul>
                  </div>
                </li>
                <li>
                  <a href="https://alllogiconline.com.br/#portfolio" className="site-navigation__link">
                    Portfólio
                  </a>
                </li>
                <li>
                  <a href="https://alllogiconline.com.br/#diagnostico" className="site-navigation__link">
                    Diagnóstico
                  </a>
                </li>
                <li>
                  <a href="https://alllogiconline.com.br/sobre" className="site-navigation__link">
                    Sobre
                  </a>
                </li>
                <li>
                  <a href="https://alllogiconline.com.br/contato" className="site-navigation__link">
                    Contato
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      {/* 3. CONTEÚDO PRINCIPAL (Fundo claro e design homologado) */}
      <main className="checkout-body">
        <div className="checkout-container">
          {/* Caso de Sucesso */}
          {successData && (
            <div className="checkout-card card-interactive" style={{ maxWidth: '640px', margin: '40px auto', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(30, 142, 62, 0.12)',
                  color: 'var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <CheckCircle size={36} />
              </div>

              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '8px' }}>
                {isTrial ? 'Período de Teste Ativado com Sucesso!' : 'Assinatura Confirmada!'}
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', maxWidth: '480px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                {successData.message}
              </p>

              <div
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  maxWidth: '420px',
                  margin: '0 auto 24px',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Plano:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{successData.plan}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Status da Conta:</span>
                  <span style={{ color: 'var(--color-success)', fontWeight: 700, textTransform: 'uppercase' }}>
                    {isTrial ? 'Teste Grátis (14 Dias)' : 'Ativo e Liberado'}
                  </span>
                </div>
                {successData.trialEndDate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Válido até:</span>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                      {new Date(successData.trialEndDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              <a
                href="/"
                className="checkout-submit-btn btn-interactive"
                style={{ maxWidth: '300px', margin: '0 auto', textDecoration: 'none' }}
              >
                <span>Acessar Painel do Agillex Hub</span>
                <ArrowRight size={18} />
              </a>
            </div>
          )}

          {/* Modal PIX em exibição */}
          {!successData && pixData && (
            <div className="checkout-card card-interactive" style={{ maxWidth: '640px', margin: '40px auto', textAlign: 'center' }}>
              <span className="checkout-eyebrow">PAGAMENTO INSTANTÂNEO</span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '8px' }}>
                Pague via PIX para ativação imediata
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', maxWidth: '480px', margin: '0 auto 20px' }}>
                Abra o app do seu banco, escolha <strong>PIX</strong> e aponte a câmera para o QR Code ou copie o código Copia e Cola.
              </p>

              {pixData.qrCode && (
                <div
                  style={{
                    background: '#ffffff',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    display: 'inline-block',
                    marginBottom: '20px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <img
                    src={`data:image/png;base64,${pixData.qrCode}`}
                    alt="QR Code PIX"
                    style={{ width: '200px', height: '200px', display: 'block' }}
                  />
                </div>
              )}

              <div style={{ maxWidth: '460px', margin: '0 auto 20px' }}>
                <div
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <input
                    type="text"
                    readOnly
                    value={pixData.copyPaste}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      fontSize: '12px',
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
                      background: copied ? 'var(--color-success)' : 'var(--color-secondary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Copy size={13} />
                    <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--color-success)', fontSize: '14px', fontWeight: 600 }}>
                <ShieldCheck size={16} />
                <span>Aguardando confirmação bancária... (A ativação é automática)</span>
              </div>
            </div>
          )}

          {/* Formulário Normal de Checkout */}
          {!successData && !pixData && (
            <div>
              {/* Título e Módulos */}
              <div className="checkout-header-area">
                <span className="checkout-eyebrow">CHECKOUT OFICIAL ALLLOGIC ONLINE</span>
                <h1 className="checkout-title">Ativação Segura do Agillex Hub</h1>
                <p className="checkout-subtitle">
                  Configure seus dados corporativos e escolha o formato ideal para sua operação.
                </p>

                {/* Seletor de Módulos (Tabs) */}
                <div className="checkout-modules-pills">
                  <button
                    type="button"
                    onClick={() => setSelectedModule('combo')}
                    className={`checkout-module-btn ${selectedModule === 'combo' ? 'checkout-module-btn--active' : ''}`}
                  >
                    <Sparkles size={16} />
                    <span>Combo Agillex Hub Pro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedModule('atendimento')}
                    className={`checkout-module-btn ${selectedModule === 'atendimento' ? 'checkout-module-btn--active' : ''}`}
                  >
                    <MessageSquare size={16} />
                    <span>Agillex Atendimento (IA)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedModule('agenda')}
                    className={`checkout-module-btn ${selectedModule === 'agenda' ? 'checkout-module-btn--active' : ''}`}
                  >
                    <Calendar size={16} />
                    <span>Agillex Agenda</span>
                  </button>
                </div>
              </div>

              {/* Controles de Ciclo e Toggle de 14 Dias Grátis */}
              <div className="checkout-options-bar">
                <div className="checkout-cycle-group">
                  <button
                    type="button"
                    onClick={() => setCycle('monthly')}
                    className={`checkout-cycle-item ${cycle === 'monthly' ? 'checkout-cycle-item--active' : ''}`}
                  >
                    Mensal
                  </button>
                  <button
                    type="button"
                    onClick={() => setCycle('yearly')}
                    className={`checkout-cycle-item ${cycle === 'yearly' ? 'checkout-cycle-item--active' : ''}`}
                  >
                    <span>Anual</span>
                    <span className="checkout-cycle-badge">-20% OFF</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTrial(!isTrial)}
                  className={`checkout-trial-pill ${isTrial ? 'checkout-trial-pill--active' : ''}`}
                >
                  <Zap size={16} color={isTrial ? 'var(--color-accent)' : 'var(--color-secondary)'} />
                  <span>{isTrial ? 'Modo: Teste 14 Dias Grátis Ativo (Risco Zero)' : 'Quero testar 14 dias grátis primeiro'}</span>
                </button>
              </div>

              {/* Grid Principal de 2 Colunas */}
              <div className="checkout-layout-grid">
                {/* Coluna 1: Dados do Negócio e Pagamento */}
                <div className="checkout-card card-interactive">
                  <h2 className="checkout-card-header">
                    <Building2 size={20} className="checkout-card-header-icon" />
                    <span>Dados da Sua Empresa</span>
                  </h2>

                  <form onSubmit={handleSubmit} className="checkout-form-group">
                    <div>
                      <label className="checkout-field-label">
                        Nome do Negócio / Razão Social
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Clínica Vitta ou Consultoria Ribeiro"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="checkout-text-input"
                      />
                    </div>

                    <div className="checkout-row">
                      <div>
                        <label className="checkout-field-label">
                          Seu Nome Completo
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Nome do responsável"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="checkout-text-input"
                        />
                      </div>
                      <div>
                        <label className="checkout-field-label">
                          CPF ou CNPJ
                        </label>
                        <input
                          type="text"
                          required={!isTrial}
                          placeholder="000.000.000-00"
                          value={formData.cpfCnpj}
                          onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                          className="checkout-text-input"
                        />
                      </div>
                    </div>

                    <div className="checkout-row">
                      <div>
                        <label className="checkout-field-label">
                          E-mail de Acesso
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="seu@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="checkout-text-input"
                        />
                      </div>
                      <div>
                        <label className="checkout-field-label">
                          WhatsApp com DDD
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="(11) 90000-0000"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="checkout-text-input"
                        />
                      </div>
                    </div>

                    {/* Aviso de 14 dias de teste com risco zero */}
                    {isTrial ? (
                      <div className="checkout-trial-notice">
                        <CheckCircle size={20} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <strong>14 dias de teste com risco zero ativado.</strong>
                          <br />
                          Experimente o Agillex Hub na rotina da sua empresa, ganhe tempo e organização no atendimento e agendamento dos seus clientes, cancele a qualquer momento sem custos adicionais.
                        </div>
                      </div>
                    ) : (
                      /* Seleção e dados de pagamento */
                      <div style={{ marginTop: '14px' }}>
                        <label className="checkout-field-label" style={{ marginBottom: '10px' }}>
                          Forma de Pagamento
                        </label>

                        <div className="checkout-method-tabs">
                          <button
                            type="button"
                            onClick={() => setBillingMethod('CREDIT_CARD')}
                            className={`checkout-method-choice ${billingMethod === 'CREDIT_CARD' ? 'checkout-method-choice--active-card' : ''}`}
                          >
                            <CreditCard size={18} />
                            <span>Cartão</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setBillingMethod('PIX')}
                            className={`checkout-method-choice ${billingMethod === 'PIX' ? 'checkout-method-choice--active-pix' : ''}`}
                          >
                            <QrCode size={18} />
                            <span>PIX</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setBillingMethod('BOLETO')}
                            className={`checkout-method-choice ${billingMethod === 'BOLETO' ? 'checkout-method-choice--active-boleto' : ''}`}
                          >
                            <FileText size={18} />
                            <span>Boleto</span>
                          </button>
                        </div>

                        {billingMethod === 'CREDIT_CARD' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                              <label className="checkout-field-label">
                                Número do Cartão de Crédito
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="0000 0000 0000 0000"
                                value={cardData.number}
                                onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                                className="checkout-text-input"
                              />
                            </div>

                            <div>
                              <label className="checkout-field-label">
                                Nome impresso no Cartão
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="NOME COMO NO CARTÃO"
                                value={cardData.holderName}
                                onChange={(e) => setCardData({ ...cardData, holderName: e.target.value.toUpperCase() })}
                                className="checkout-text-input"
                              />
                            </div>

                            <div className="checkout-row">
                              <div>
                                <label className="checkout-field-label">
                                  Validade (MM/AA)
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder="12/28"
                                  maxLength={5}
                                  value={cardData.expiry}
                                  onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                                  className="checkout-text-input"
                                />
                              </div>
                              <div>
                                <label className="checkout-field-label">
                                  Código CVV
                                </label>
                                <input
                                  type="password"
                                  required
                                  placeholder="123"
                                  maxLength={4}
                                  value={cardData.ccv}
                                  onChange={(e) => setCardData({ ...cardData, ccv: e.target.value })}
                                  className="checkout-text-input"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {billingMethod === 'PIX' && (
                          <div
                            style={{
                              padding: '14px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'rgba(30, 142, 62, 0.08)',
                              border: '1px solid rgba(30, 142, 62, 0.25)',
                              fontSize: '13px',
                              color: 'var(--color-success)',
                              lineHeight: 1.5,
                            }}
                          >
                            ⚡ <strong>PIX Instantâneo:</strong> O QR Code dinâmico e o código Copia e Cola serão gerados imediatamente para pagamento no app do seu banco.
                          </div>
                        )}

                        {billingMethod === 'BOLETO' && (
                          <div
                            style={{
                              padding: '14px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'rgba(201, 162, 39, 0.08)',
                              border: '1px solid rgba(201, 162, 39, 0.25)',
                              fontSize: '13px',
                              color: '#795700',
                              lineHeight: 1.5,
                            }}
                          >
                            📄 <strong>Boleto Bancário:</strong> O boleto será gerado com vencimento em 3 dias úteis e QR Code PIX no topo para compensação rápida.
                          </div>
                        )}
                      </div>
                    )}

                    {errorMsg && (
                      <div
                        style={{
                          color: 'var(--color-error)',
                          fontSize: '13px',
                          backgroundColor: '#fde8e8',
                          padding: '12px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid #f8b4b4',
                        }}
                      >
                        {errorMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="checkout-submit-btn btn-interactive"
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

                {/* Coluna 2: Planos e Resumo */}
                <div className="checkout-card card-interactive" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 className="checkout-card-header">
                      <Sparkles size={20} className="checkout-card-header-icon" />
                      <span>Resumo do Plano</span>
                    </h3>

                    {/* Lista de Planos do Módulo */}
                    <div style={{ marginBottom: '20px' }}>
                      {availablePlans.map((plan) => {
                        const isSelected = plan.id === selectedPlanId;
                        const planMonthly = isYearly ? plan.priceYearlyMonthly : plan.priceMonthly;

                        return (
                          <div
                            key={plan.id}
                            onClick={() => setSelectedPlanId(plan.id)}
                            className={`checkout-plan-item ${isSelected ? 'checkout-plan-item--selected' : ''}`}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="checkout-plan-title">{plan.name}</span>
                                {plan.badge && (
                                  <span className="checkout-plan-badge-pill">{plan.badge}</span>
                                )}
                              </div>
                              <span className="checkout-plan-tagline">{plan.tagline}</span>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <span className={`checkout-plan-price ${isSelected ? 'checkout-plan-price--active' : ''}`}>
                                R$ {planMonthly.toFixed(2).replace('.', ',')}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>/mês</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Recursos Inclusos */}
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginBottom: '20px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', display: 'block', marginBottom: '12px', letterSpacing: '0.04em' }}>
                        Recursos inclusos neste plano:
                      </span>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {currentPlan.features.map((feat, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                            <CheckCircle size={15} color="var(--color-success)" style={{ flexShrink: 0 }} />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Resumo do Total */}
                  <div className="checkout-summary-container">
                    <div className="checkout-summary-line">
                      <span>Ciclo de Cobrança:</span>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                        {isYearly ? 'Anual (20% de Economia)' : 'Mensal'}
                      </span>
                    </div>

                    <div className="checkout-summary-final">
                      <span className="checkout-summary-final-title">Total:</span>
                      <div style={{ textAlign: 'right' }}>
                        <span className="checkout-summary-final-val">
                          {isTrial ? 'R$ 0,00' : `R$ ${totalPrice.toFixed(2).replace('.', ',')}`}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>
                          {isTrial ? 'durante 14 dias de teste' : isYearly ? 'cobrado anualmente' : 'cobrado mensalmente'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 4. RODAPÉ INSTITUCIONAL (Idêntico ao site alllogiconline.com.br) */}
      <footer className="footer">
        <div className="checkout-container">
          <div className="footer__inner">
            {/* Marca */}
            <div className="footer__brand">
              <a href="https://alllogiconline.com.br" className="footer__logo" aria-label="AllLogic Online">
                <img
                  src="/images/logo-alllogic.png"
                  alt="AllLogic Online — Engenharia de Soluções Digitais"
                />
              </a>
              <p>Tecnologia que trabalha para as pessoas.</p>
            </div>

            {/* Navegação institucional */}
            <div className="footer__nav">
              <h2>Navegação</h2>
              <nav aria-label="Navegação institucional">
                <ul>
                  <li className="footer__nav-item--has-dropdown">
                    <div className={`footer__dropdown ${footerDropdownOpen ? 'is-open' : ''}`}>
                      <button
                        type="button"
                        className="footer__dropdown-toggle"
                        aria-expanded={footerDropdownOpen}
                        aria-haspopup="true"
                        id="footer-dropdown-familia-agillex"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFooterDropdownOpen(!footerDropdownOpen);
                        }}
                      >
                        <span>Família Agillex</span>
                        <svg
                          className="footer__dropdown-icon"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      <ul
                        className="footer__dropdown-menu"
                        role="menu"
                        aria-labelledby="footer-dropdown-familia-agillex"
                      >
                        <li className="footer__dropdown-item" role="none">
                          <a
                            className="footer__dropdown-link"
                            href="https://alllogiconline.com.br/agillex-hub"
                            role="menuitem"
                          >
                            Agillex Hub
                          </a>
                        </li>
                        <li className="footer__dropdown-item" role="none">
                          <a
                            className="footer__dropdown-link"
                            href="https://alllogiconline.com.br/agillex-agenda"
                            role="menuitem"
                          >
                            Agillex Agenda
                          </a>
                        </li>
                        <li className="footer__dropdown-item" role="none">
                          <a
                            className="footer__dropdown-link"
                            href="https://alllogiconline.com.br/agillex-atendimento"
                            role="menuitem"
                          >
                            Agillex Atendimento
                          </a>
                        </li>
                      </ul>
                    </div>
                  </li>
                  <li>
                    <a href="https://alllogiconline.com.br/politica-de-privacidade">Política de Privacidade</a>
                  </li>
                  <li>
                    <a href="https://alllogiconline.com.br/termos-de-uso">Termos de Uso</a>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Informações de contato */}
            <div className="footer__contact">
              <h2>Contato</h2>

              <address>
                <p>
                  <span>E-mail</span>
                  <a href="mailto:contato@alllogiconline.com.br">contato@alllogiconline.com.br</a>
                </p>

                <p>
                  <span>Telefone</span>
                  <a href="tel:+5511966381915">(11) 96638-1915</a>
                </p>

                <p>
                  <span>WhatsApp</span>
                  <a
                    href="https://wa.me/5511966381915"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    (11) 96638-1915
                  </a>
                </p>
              </address>
            </div>
          </div>

          {/* Copyright */}
          <div className="footer__copyright">
            <p>© {new Date().getFullYear()} AllLogic Online. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Botão Voltar ao Topo (Dourado Oficial da Paleta AllLogic com seta branca encorpada) */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`scroll-to-top ${showScrollTop ? 'scroll-to-top--visible' : ''}`}
        aria-label="Voltar ao topo"
        title="Voltar ao topo"
      >
        <svg
          className="scroll-to-top__icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: '#4a5568' }}>Carregando Checkout Seguro AllLogic...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
