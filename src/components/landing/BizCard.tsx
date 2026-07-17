import { Link } from 'react-router-dom'

export function BizCard({
  to,
  theme,
  tag,
  name,
  desc,
}: {
  to: string
  theme: 'bz' | 'tp' | 'fz'
  tag: string
  name: string
  desc: string
}) {
  return (
    <Link to={to} className={`biz-card ${theme}`}>
      <div className="stripe" />
      <div className="tag">{tag}</div>
      <div>
        <div className="name">{name}</div>
        <div className="desc">{desc}</div>
      </div>
      <span className="enter">Entrar →</span>
    </Link>
  )
}
