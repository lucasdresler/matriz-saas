'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function Header() {

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
      </div>
    </header>
  );
}
