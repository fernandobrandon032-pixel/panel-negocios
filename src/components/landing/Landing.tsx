import { AbstractHeroBackground } from './AbstractHeroBackground'
import { BizCard } from './BizCard'

export function Landing() {
  return (
    <div id="landing">
      <AbstractHeroBackground />
      <div className="kicker">Panel de negocios</div>
      <h1>¿En qué vamos a trabajar hoy?</h1>
      <div className="biz-picker">
        <BizCard
          to="/backzzxc"
          theme="bz"
          tag="Reventa · Mayoreo y menudeo"
          name="Backzzxc"
          desc="Catálogo de playeras de marca, clientes, prospectos, ventas y consignación."
        />
        <BizCard
          to="/turboprints"
          theme="tp"
          tag="DTF · Personalizado"
          name="TurboPrints95"
          desc="Pedidos a la medida, mangas para el sol y playeras de carros."
        />
        <BizCard
          to="/finanzas"
          theme="fz"
          tag="Personal"
          name="Finanzas"
          desc="Gastos, ingresos, presupuestos y tu meta de ahorro para el carro."
        />
      </div>
    </div>
  )
}
