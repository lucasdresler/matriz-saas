import Link from 'next/link';

const FOOTER_LINKS = [
  { name: 'Início', href: 'https://agillex.com.br/' },
  { name: 'Soluções', href: 'https://agillex.com.br/#solucoes' },
  { name: 'Portfólio', href: 'https://agillex.com.br/#portfolio' },
  { name: 'Diagnóstico', href: 'https://agillex.com.br/#diagnostico' },
  { name: 'Sobre', href: 'https://agillex.com.br/#sobre' },
  { name: 'Contato', href: 'https://agillex.com.br/contato' },
];

const PRODUCT_LINKS = [
  { name: 'Agillex Hub', href: 'https://agillex.com.br/#produtos' },
  { name: 'Agillex Agenda', href: 'https://agillex.com.br/#produtos' },
  { name: 'Agillex Atende', href: 'https://agillex.com.br/#produtos' },
  { name: 'Agillex Cobrança', href: 'https://agillex.com.br/#produtos' },
  { name: 'Agillex Reputação', href: 'https://agillex.com.br/#produtos' },
  { name: 'Agillex GED', href: 'https://agillex.com.br/#produtos' },
];

const ACCESS_LINKS = [
  { name: 'Acessar Hub', href: 'https://hub.agillex.com.br/login' },
  { name: 'Planos e Preços', href: 'https://hub.agillex.com.br/plans' },
  { name: 'Termos de Uso', href: 'https://agillex.com.br/termos' },
  { name: 'Política de Privacidade', href: 'https://agillex.com.br/privacidade' },
];

export default function Footer() {
  return (
    <footer
      style={{
        background: '#060B18',
        borderTop: '1px solid rgba(31, 111, 255, 0.14)',
        marginTop: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '48px 20px 32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
        }}
      >
        {/* Marca */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '260px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
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
              <span style={{ fontSize: '20px', color: '#fff' }}>✦</span>
            </div>
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#fff',
                letterSpacing: '-0.02em',
              }}
            >
              Agillex Hub
            </span>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
            Plataforma unificada de gestão operacional, atendimento IA 24/7 no WhatsApp, agendamento online, CRM Kanban e pagamentos integrados.
          </p>
          <div style={{ display: 'flex', gap: '14px', marginTop: '8px' }}>
            <a
              href="https://wa.me/5511966381915"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#00F5D4',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <span style={{ width: '16px', height: '16px', background: '#25D366', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff' }}>📱</span>
              WhatsApp
            </a>
          </div>
        </div>

        {/* Produtos */}
        <div>
          <h4 style={{ color: '#00F5D4', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Família Agillex</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PRODUCT_LINKS.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#CBD5E1',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Acesso rápido */}
        <div>
          <h4 style={{ color: '#00F5D4', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Acesso Rápido</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ACCESS_LINKS.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  target={link.href.includes('hub.agillex') ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  style={{
                    color: '#CBD5E1',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Institucional */}
        <div>
          <h4 style={{ color: '#00F5D4', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Institucional</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {FOOTER_LINKS.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  style={{
                    color: '#CBD5E1',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '24px 20px',
          borderTop: '1px solid rgba(31, 111, 255, 0.14)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#64748B', fontSize: '0.8rem', margin: 0 }}>
          AllLogic Online • Engenharia de Soluções Digitais • Tecnologia que trabalha para as pessoas.
        </p>
        <p style={{ color: '#64748B', fontSize: '0.8rem', margin: 0 }}>
          © 2026 AllLogic Online. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
