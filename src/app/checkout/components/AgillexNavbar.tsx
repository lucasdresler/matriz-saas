'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bot, ChevronDown, Sparkles, ArrowRight, Menu, X, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  onOpenTrial: () => void;
}

export default function AgillexNavbar({ onOpenTrial }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const products = [
    { name: 'Agillex Hub', desc: 'Plataforma Unificada Multi-Tenant & CRM', id: 'hub', color: '#1F6FFF' },
    { name: 'Agilex Atende', desc: 'IA Humanizada no WhatsApp Oficial 24/7', id: 'atende', color: '#00F5D4' },
    { name: 'Agillex Agenda', desc: 'Agendamento Online & Google Calendar', id: 'agenda', color: '#38BDF8' },
    { name: 'Agillex Cobrança', desc: 'Régua Ativa Asaas & Pix Taxa R$ 1,99', id: 'cobranca', color: '#10B981' },
    { name: 'Agillex Reputação', desc: 'Acelerador 5 Estrelas no Google Maps', id: 'reputacao', color: '#F59E0B' },
    { name: 'Agillex GED', desc: 'Gestão de Documentos com OCR & IA', id: 'ged', color: '#8B5CF6' },
  ];

  const scrollToSection = (id: string) => {
    setProductsOpen(false);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = `/#${id}`;
    }
  };

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: scrolled ? 'rgba(6, 11, 24, 0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(56, 189, 248, 0.15)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* LOGO AGILLEX */}
        <Link
          href="https://agillex.com.br/"
          onClick={(e) => {
            if (typeof window !== 'undefined' && window.location.pathname === '/') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1F6FFF 0%, #00F5D4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0, 245, 212, 0.4)',
            }}
          >
            <Bot size={22} color="#060B18" strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: "'Orbitron', 'Inter', sans-serif",
                  fontSize: '1.42rem',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  letterSpacing: '0.04em',
                  background: 'linear-gradient(95deg, #FFFFFF 20%, #00F5D4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 10px rgba(0, 245, 212, 0.4))',
                  transform: 'skewX(-6deg)',
                  display: 'inline-block',
                }}
              >
                AGILLEX
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  background: 'rgba(0, 245, 212, 0.15)',
                  color: '#00F5D4',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(0, 245, 212, 0.3)',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                ECOSSISTEMA
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748B', letterSpacing: '0.04em', marginTop: '1px' }}>
              Por AllLogic Online
            </div>
          </div>
        </Link>

        {/* LINKS DESKTOP */}
        <div
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '28px',
          }}
          className="desktop-nav"
        >
          {/* Dropdown Produtos */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setProductsOpen(!productsOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: productsOpen ? '#00F5D4' : '#E2E8F0',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 0',
                transition: 'color 0.2s',
              }}
            >
              Produtos
              <ChevronDown size={15} style={{ transform: productsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {productsOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '120%',
                  left: '-40px',
                  width: '320px',
                  backgroundColor: 'rgba(10, 17, 40, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 245, 212, 0.25)',
                  borderRadius: '16px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(0, 245, 212, 0.15)',
                  padding: '10px',
                  zIndex: 200,
                }}
              >
                {products.map((p) => (
                  <a
                    key={p.id}
                    href="https://agillex.com.br/#produtos"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      textDecoration: 'none',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: p.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#fff' }}>{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{p.desc}</div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          <a
            href="https://agillex.com.br/#tabela-produtos"
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: 'none', border: 'none', color: '#CBD5E1', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }}
          >
            Tabela de Soluções
          </a>

          <a
            href="https://agillex.com.br/#calculadora"
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: 'none', border: 'none', color: '#CBD5E1', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }}
          >
            Calculadora ROI
          </a>

          <a
            href="https://agillex.com.br/#planos"
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: 'none', border: 'none', color: '#CBD5E1', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }}
          >
            Planos & Preços
          </a>

          <a
            href="https://agillex.com.br/#faq"
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: 'none', border: 'none', color: '#CBD5E1', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }}
          >
            Dúvidas
          </a>
        </div>

        {/* AÇÕES DIREITAS DESKTOP */}
        <div style={{ display: 'none', alignItems: 'center', gap: '14px' }} className="desktop-nav">
          <a
            href="https://hub.agillex.com.br/login?switch=true"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              fontSize: '0.84rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            Acessar Hub
          </a>

          <button
            onClick={onOpenTrial}
            className="btn-primary-neon"
            style={{ padding: '9px 20px', fontSize: '0.84rem' }}
          >
            <Sparkles size={16} />
            Testar 14 Dias Grátis
          </button>
        </div>

        {/* BOTÃO MOBILE */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: '6px',
            display: 'block',
          }}
          className="mobile-btn"
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* MENU MOBILE */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: 'rgba(6, 11, 24, 0.98)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0, 245, 212, 0.25)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
          }}
        >
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, letterSpacing: '0.05em' }}>
            Módulos Agillex
          </div>
          {products.map((p) => (
            <a
              key={p.id}
              href="https://agillex.com.br/#produtos"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 600,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: p.color }} />
              {p.name}
            </a>
          ))}
          <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            <a
              href="https://hub.agillex.com.br/login?switch=true"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                textAlign: 'center',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Acessar Hub (Login)
            </a>
            <button
              onClick={onOpenTrial}
              className="btn-primary-neon"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Sparkles size={16} />
              Iniciar Teste Grátis de 14 Dias
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (min-width: 900px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-btn {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}
