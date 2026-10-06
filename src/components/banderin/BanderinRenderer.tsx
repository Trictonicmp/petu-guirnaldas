import { ImageRegular } from '@fluentui/react-icons'
import type { GarlandItem } from '../../domain/garland/types'
import { getDesign } from '../../domain/designs/designs'
import { getBanderinSvg } from '../../services/assets'

type BanderinRendererProps = {
  item: GarlandItem
  color: string
  index: number
  className?: string
}

export default function BanderinRenderer({ item, color, index, className = '' }: BanderinRendererProps) {
  return (
    <div
      className={`preview-flag preview-flag--${item.shape} ${className}`}
      role="img"
      aria-label={`${getDesign(item.designId)?.name ?? item.designId}${item.customization?.name ? ` ${item.customization.name}` : ''}, ${color}, banderín ${index + 1}`}
    >
      <span
        className="preview-art"
        aria-hidden="true"
        style={{
          '--flag-color': color,
          backgroundColor: color,
          maskImage: `url("${getBanderinSvg(item.shape, item.designId)}")`,
          WebkitMaskImage: `url("${getBanderinSvg(item.shape, item.designId)}")`,
          maskMode: 'alpha',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
        } as React.CSSProperties}
      />
      {item.designId === 'otro' && <ImageRegular className="preview-image-icon" aria-hidden="true" />}
      {item.designId !== 'otro' && item.customization?.name && (
        <span className="preview-name" style={{ '--name-length': item.customization.name.length } as React.CSSProperties}>
          {item.customization.name}
        </span>
      )}
    </div>
  )
}