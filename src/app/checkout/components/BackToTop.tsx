'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 350);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Voltar ao topo da página"
      title="Voltar ao topo"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        backgroundColor: 'rgba(10, 17, 40, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(0, 245, 212, 0.4)',
        color: '#00F5D4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 245, 212, 0.2)',
        zIndex: 90,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.backgroundColor = 'rgba(0, 245, 212, 0.15)';
        e.currentTarget.style.borderColor = '#00F5D4';
        e.currentTarget.style.boxShadow = '0 10px 28px rgba(0, 0, 0, 0.6), 0 0 25px rgba(0, 245, 212, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.backgroundColor = 'rgba(10, 17, 40, 0.85)';
        e.currentTarget.style.borderColor = 'rgba(0, 245, 212, 0.4)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 245, 212, 0.2)';
      }}
    >
      <ArrowUp size={20} strokeWidth={2.4} />
    </button>
  );
}
