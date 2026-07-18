const COLOR_MAP: Record<string, string> = {
  blanco: '#f2f2ee',
  negro: '#1a1a1a',
  gris: '#8a8a86',
  rojo: '#c81119',
  azul: '#2f4ea3',
  verde: '#35d488',
  beige: '#d8c9ad',
}

// Ícono original (SVG propio, sin fotos de terceros) usado como referencia visual rápida del
// color de cada blanco — no reemplaza una foto real, es solo un identificador de color.
export function ShirtIcon({ color, size = 40 }: { color: string; size?: number }) {
  const fill = COLOR_MAP[color.trim().toLowerCase()] ?? '#666'
  const stroke = fill === '#f2f2ee' ? '#999' : 'rgba(255,255,255,.25)'

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
      <path
        d="M22 6 L32 12 L42 6 L54 14 L48 24 L42 20 L42 58 L22 58 L22 20 L16 24 L10 14 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}
