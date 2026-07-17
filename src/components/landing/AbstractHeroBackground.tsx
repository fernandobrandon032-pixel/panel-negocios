// Fondo abstracto 100% original (gradientes CSS), no reproduce ningún personaje ni arte con
// derechos de autor. Sustituye el pedido original de fondos tipo Spider-Man / agujero negro /
// paisaje japonés, que se declinó por temas de copyright.
export function AbstractHeroBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '900px',
          height: '900px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, rgba(226,20,28,0.05) 32%, rgba(53,212,136,0.04) 55%, transparent 72%)',
          filter: 'blur(2px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '18%',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.06), transparent 70%)',
          filter: 'blur(30px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          right: '12%',
          width: '460px',
          height: '460px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(53,212,136,0.08), transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0, opacity: 0.5 }}
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id="voidCore" cx="50%" cy="20%" r="60%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#voidCore)" />
      </svg>
    </div>
  )
}
