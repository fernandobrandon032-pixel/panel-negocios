import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '../../lib/formatters'

const COLORS = ['#35d488', '#e2141c', '#7fa3e6', '#e6b043', '#c79bf0', '#e26a6a', '#6bd68a', '#bbbbbb']

export function SpendingDonutChart({ data }: { data: { categoria: string; monto: number }[] }) {
  if (!data.length) return null

  return (
    <div style={{ width: 220 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', opacity: 0.55, marginBottom: 8 }}>
        Gastos por categoría
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} dataKey="monto" nameKey="categoria" innerRadius={40} outerRadius={70} paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
