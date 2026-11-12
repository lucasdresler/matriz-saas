export default function TrialExpiredPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background: '#060B18',
        color: '#fff',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '36px',
          borderRadius: '14px',
          border: '1px solid rgba(31, 111, 255, 0.25)',
          background: '#0F172A',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(31, 111, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1F6FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <h1 style={{ margin: '0 0 12px', fontSize: '1.6rem', color: '#fff' }}>Seu período de teste terminou</h1>
        <p style={{ margin: '0 0 24px', color: '#94A3B8', lineHeight: 1.6 }}>
          O acesso ao workspace foi pausado. Seus dados continuam preservados e não haverá
          cobrança automática. Compare os produtos e planos da Família Agillex e escolha o mais
          adequado para continuar.
        </p>
        <a
          href="/plans"
          className="btn-primary"
        >
          Ver produtos e escolher meu plano
        </a>
      </section>
    </main>
  );
}
