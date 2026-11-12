'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Sparkles, CreditCard, ShieldCheck, FileText, Server, Calendar, MessageSquare, ArrowRight } from 'lucide-react';

const NAV_LINKS = [
  { name: 'Início', href: '/' },
  { name: 'Soluções', href: '#solucoes' },
  { name: 'Portfólio', href: '#portfolio' },
  { name: 'Diagnóstico', href: '#diagnostico' },
  { name: 'Sobre', href: '#sobre' },
  { name: 'Contato', href: '#contato' },
];

const PRODUCTS = [
  { name: 'Agillex Hub', href: 'https://agillex.com.br/#produtos', module: 'combo', color: '#1F6FFF' },
  { name: 'Agillex Agenda', href: 'https://agillex.com.br/#produtos', module: 'agenda', color: '#38BDF8' },
  { name: 'Agillex Atende', href: 'https://agillex.com.br/#produtos', module: 'atendimento', color: '#00F5D4' },
  { name: 'Agillex Cobrança', href: 'https://agillex.com.br/#produtos', module: 'cobranca', color: '#10B981' },
  { name: 'Agillex Reputação', href: 'https://agillex.com.br/#produtos', module: 'reputacao', color: '#F59E0B' },
  { name: 'Agillex GED', href: 'https://agillex.com.br/#produtos', module: 'ged', color: '#8B5CF6' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: 'rgba(6, 14, 30, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(31, 111, 255, 0.14)',
      }}
    >
      <div
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
        }}
      >
        {/* Logo */}
        <Link
          href="https://agillex.com.br/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1F6FFF, #00F5D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(31, 111, 255, 0.4)',
            }}
          >
            <Sparkles size={20} color="#fff" />
          </div>
          <span
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.02em',
              background: 'linear-gradient(to right, #fff, #00F5D4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Agillex Hub
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              style={{
                color: '#CBD5E1',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                transition: 'color 0.2s ease',
              }}
            >
              {link.name}
            </Link>
          ))}

          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(31, 111, 255, 0.1)',
                border: '1px solid rgba(31, 111, 255, 0.25)',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Sparkles size={16} />
              <span>Família Agillex</span>
              <ArrowRight size={14} />
            </button>
            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '8px',
                  background: '#0F172A',
                  border: '1px solid rgba(31, 111, 255, 0.25)',
                  borderRadius: '10px',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
                  padding: '12px',
                  minWidth: '200px',
                  zIndex: 210,
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                {PRODUCTS.map((product) => (
                  <Link
                    key={product.name}
                    href={product.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      color: '#CBD5E1',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease',
                      borderLeft: `3px solid ${product.color}`,
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: product.color,
                        boxShadow: `0 0 10px ${product.color}`,
                      }}
                    />
                    {product.name}
                  </Link>
                ))}
                <Link
                  href="https://hub.agillex.com.br/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #1F6FFF, #00F5D4)',
                    marginTop: '8px',
                    boxShadow: '0 0 20px rgba(31, 111, 255, 0.4)',
                  }}
                >
                  <ArrowRight size={16} />
                  Acessar Hub
                </Link>
              </div>
            )}
          </div>

          <a
            href="https://hub.agillex.com.br/login"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'linear-gradient(135deg, #1F6FFF, #00F5D4)',
              color: '#060B18',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.9rem',
              textDecoration: 'none',
              boxShadow: '0 0 20px rgba(31, 111, 255, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            Acessar Hub
          </a>
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            background: 'transparent',
            border: '1px solid rgba(31, 111, 255, 0.25)',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(6, 14, 30, 0.95)',
            backdropFilter: 'blur(12px)',
            zIndex: 210,
            display: 'flex',
            flexDirection: 'column',
            padding: '60px 20px',
            gap: '20px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            <X size={20} />
          </button>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              style={{
                color: '#CBD5E1',
                textDecoration: 'none',
                fontSize: '1.1rem',
                fontWeight: 500,
                padding: '12px 0',
                display: 'block',
              }}
            >
              {link.name}
            </Link>
          ))}
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(31, 111, 255, 0.14)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {PRODUCTS.map((product) => (
              <Link
                key={product.name}
                href={product.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#CBD5E1',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  padding: '12px 0',
                  display: 'block',
                }}
              >
                {product.name}
              </Link>
            ))}
            <a
              href="https://hub.agillex.com.br/login"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'linear-gradient(135deg, #1F6FFF, #00F5D4)',
                color: '#060B18',
                padding: '12px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                textAlign: 'center',
                textDecoration: 'none',
                boxShadow: '0 0 20px rgba(31, 111, 255, 0.4)',
              }}
            >
              Acessar Hub
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
