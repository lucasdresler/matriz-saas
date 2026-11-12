export default function TrialExpiredPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background: '#0B132B',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '36px',
          borderRadius: '16px',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          background: '#172038',
          textAlign: 'center',
        }}
      >
        <h1 style={{ margin: '0 0 12px', fontSize: '1.6rem' }}>Seu período de teste terminou</h1>
        <p style={{ margin: '0 0 24px', color: '#CBD5E1', lineHeight: 1.6 }}>
          O acesso ao workspace foi pausado. Seus dados continuam preservados e não haverá
          cobrança automática. Compare os produtos e planos da Família Agillex e escolha o mais
          adequado para continuar.
        </p>
        <a
          href="/plans"
          style={{
            display: 'inline-flex',
            justifyContent: 'center',
            padding: '12px 20px',
            borderRadius: '8px',
            background: '#2563EB',
            color: '#fff',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Ver produtos e escolher meu plano
        </a>
      </section>
    </main>
  );
}
