'use client';

import React from 'react';
import Link from 'next/link';
import { Bot, ExternalLink } from 'lucide-react';

export default function AgillexFooter() {
  return (
    <footer
      style={{
        backgroundColor: '#040711',
        borderTop: '1px solid rgba(56, 189, 248, 0.15)',
        padding: '70px 24px 40px',
        position: 'relative',
        marginTop: 'auto',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '40px',
            marginBottom: '60px',
          }}
        >
          {/* Coluna 1: Marca & Institucional */}
          <div style={{ maxWidth: '340px' }}>
            <Link
              href="https://agillex.com.br/"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '16px', textDecoration: 'none', cursor: 'pointer' }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #1F6FFF 0%, #00F5D4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={20} color="#060B18" strokeWidth={2.5} />
              </div>
              <span
                style={{
                  fontFamily: "'Orbitron', 'Inter', sans-serif",
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  letterSpacing: '0.04em',
                  background: 'linear-gradient(95deg, #FFFFFF 20%, #00F5D4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  transform: 'skewX(-6deg)',
                  display: 'inline-block',
                }}
              >
                AGILLEX
              </span>
            </Link>

            <p style={{ fontSize: '0.86rem', color: '#94A3B8', lineHeight: 1.6, marginBottom: '20px' }}>
              Ecossistema integrado de Atendimento IA 24/7, Agendamento Online Sincronizado, Funil CRM Kanban, Agillex Pay R$ 1,99 e Gestão Operacional.
            </p>

            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
              Uma marca da <strong>AllLogic Online</strong><br />
              Engenharia de Soluções Digitais
            </div>
          </div>

          {/* Coluna 2: Produtos */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '18px' }}>
              Família Agillex
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><a href="https://agillex.com.br/#produtos" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>Agillex Hub (Painel SaaS)</a></li>
              <li><a href="https://agillex.com.br/#produtos" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>Agilex Atende (WhatsApp IA)</a></li>
              <li><a href="https://agillex.com.br/#produtos" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>Agillex Agenda (Google Calendar)</a></li>
              <li><a href="https://agillex.com.br/#produtos" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>Agillex Cobrança (Pix R$ 1,99)</a></li>
              <li><a href="https://agillex.com.br/#produtos" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>Agillex Reputação (Google 5★)</a></li>
              <li><a href="https://agillex.com.br/#produtos" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>Agillex GED (Documentos com IA)</a></li>
            </ul>
          </div>

          {/* Coluna 3: Links Úteis / Acesso Rápido */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '18px' }}>
              Acesso Rápido
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <a
                  href="https://hub.agillex.com.br/login?switch=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#94A3B8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  Entrar no Hub (Área do Cliente)
                  <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a href="https://agillex.com.br/#calculadora" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>
                  Calculadora de Retorno (ROI)
                </a>
              </li>
              <li>
                <a href="https://agillex.com.br/#planos" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>
                  Planos & Preços
                </a>
              </li>
              <li>
                <a href="https://agillex.com.br/#faq" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>
                  Perguntas Frequentes
                </a>
              </li>
              <li>
                <a href="https://agillex.com.br/privacidade" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>
                  Política de Privacidade (LGPD)
                </a>
              </li>
              <li>
                <a href="https://agillex.com.br/termos" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>
                  Termos de Uso do Serviço
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Suporte & Contato */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '18px' }}>
              Atendimento Oficial
            </div>
            <div style={{ fontSize: '0.84rem', color: '#94A3B8', lineHeight: 1.6, marginBottom: '14px' }}>
              Plantão e Suporte Técnico via WhatsApp Oficial:
            </div>
            <a
              href="https://wa.me/5511966381915?text=Olá,%20preciso%20de%20ajuda%20com%20o%20Agillex"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 245, 212, 0.1)',
                border: '1px solid rgba(0, 245, 212, 0.3)',
                color: '#00F5D4',
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Falar no WhatsApp: (11) 96638-1915
            </a>
          </div>
        </div>

        {/* Linha Divisória */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '28px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            fontSize: '0.78rem',
            color: '#64748B',
          }}
        >
          <div>
            © {new Date().getFullYear()} Agillex. Todos os direitos reservados. Engenharia Digital por AllLogic Online.
          </div>
          <div>
            Tecnologia que trabalha para as pessoas.
          </div>
        </div>
      </div>
    </footer>
  );
}
