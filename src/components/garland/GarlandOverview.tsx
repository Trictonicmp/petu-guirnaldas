import { colors } from '../../domain/colors/colors'
import { MAX_BANDERINES, type GarlandSlot } from '../../domain/garland/types'
import BanderinRenderer from '../banderin/BanderinRenderer'

type GarlandOverviewProps = {
  items: GarlandSlot[]
  onSelectPosition: (index: number) => void
}

export default function GarlandOverview({ items, onSelectPosition }: GarlandOverviewProps) {
  const configuredCount = items.filter(Boolean).length

  return (
    <section className="garland-overview" aria-label="Vista completa de la guirnalda">
      <div className="garland-overview-heading">
        <h3>Vista completa</h3>
        <span>{configuredCount} / {MAX_BANDERINES}</span>
      </div>
      <div className="garland-overview-viewport">
        <div className="garland-overview-string">
          {Array.from({ length: MAX_BANDERINES }, (_, index) => {
            const item = items[index] ?? null
            const color = item ? colors.find((candidate) => candidate.id === item.colorId) : undefined

            return (
              <button
                type="button"
                className="garland-overview-position"
                key={index}
                onClick={() => onSelectPosition(index)}
                aria-label={`Ir a la posición ${index + 1}`}
              >
                <span className="garland-overview-knot" aria-hidden="true" />
                {item && color
                  ? <BanderinRenderer item={item} color={color.value} index={index} className="garland-overview-flag" />
                  : <span className="garland-overview-empty" aria-hidden="true">+</span>}
                <span className="garland-overview-index">{String(index + 1).padStart(2, '0')}</span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}