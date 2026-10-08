import { useCallback, useEffect, useRef, useState } from 'react'
import { AddRegular, CopyRegular } from '@fluentui/react-icons'
import { ChevronLeftRegular, ChevronRightRegular } from '@fluentui/react-icons'
import { colors } from '../../domain/colors/colors'
import { getDesign } from '../../domain/designs/designs'
import { MAX_BANDERINES } from '../../domain/garland/types'
import type { GarlandSlot } from '../../domain/garland/types'
import { useOnboarding, useOnboardingTarget } from '../onboarding/OnboardingProvider'
import BanderinRenderer from '../banderin/BanderinRenderer'

type GarlandCarouselProps = {
  items: GarlandSlot[]
  onSelectPosition: (index: number) => void
  onDuplicatePosition: (index: number) => number | undefined
  scrollRequest?: { index: number; id: number } | null
}

export default function GarlandCarousel({ items, onSelectPosition, onDuplicatePosition, scrollRequest }: GarlandCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [duplicateNotice, setDuplicateNotice] = useState('')
  const onboarding = useOnboarding()
  const addTargetRef = useOnboardingTarget('add')
  const carouselTargetRef = useOnboardingTarget('carousel')
  const duplicateTargetRef = useOnboardingTarget('duplicate')
  const firstEmptyIndex = items.findIndex((item) => item === null)
  const firstConfiguredIndex = items.findIndex((item) => item !== null)
  const setViewportRef = useCallback((element: HTMLDivElement | null) => {
    viewportRef.current = element
    carouselTargetRef(element)
  }, [carouselTargetRef])

  const goToPosition = (index: number) => {
    const viewport = viewportRef.current
    const card = viewport?.querySelectorAll<HTMLButtonElement>('.garland-slot-card')[index]
    if (!viewport || !card) return
    const targetLeft = viewport.scrollLeft + card.getBoundingClientRect().left - viewport.getBoundingClientRect().left
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    viewport.scrollTo({ left: targetLeft, behavior: reduceMotion ? 'instant' : 'smooth' })
    setActiveIndex(index)
    if (index > 0 && onboarding.step === 'carousel') onboarding.setStep('progress')
  }

  useEffect(() => {
    if (scrollRequest) goToPosition(scrollRequest.index)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollRequest])

  const handleScroll = () => {
    const viewport = viewportRef.current
    const cards = viewport?.querySelectorAll<HTMLButtonElement>('.garland-slot-card')
    if (!viewport || !cards?.length) return
    const viewportLeft = viewport.getBoundingClientRect().left
    let closestIndex = 0
    let closestDistance = Number.POSITIVE_INFINITY
    cards.forEach((card, index) => {
      const distance = Math.abs(card.getBoundingClientRect().left - viewportLeft)
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    })
    setActiveIndex(closestIndex)
    if (closestIndex > 0 && onboarding.step === 'carousel') onboarding.setStep('progress')
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      event.stopPropagation()
      goToPosition(Math.min(activeIndex + 1, MAX_BANDERINES - 1))
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      event.stopPropagation()
      goToPosition(Math.max(activeIndex - 1, 0))
    } else if (event.key === 'Home') {
      event.preventDefault()
      event.stopPropagation()
      goToPosition(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      event.stopPropagation()
      goToPosition(MAX_BANDERINES - 1)
    }
  }

  return (
    <div className="garland-carousel-shell">
      <div
        className="garland-carousel"
        ref={setViewportRef}
        role="region"
        aria-roledescription="carrusel"
        aria-label="Posiciones de la guirnalda"
        tabIndex={0}
        onScroll={handleScroll}
        onKeyDownCapture={handleKeyDown}
      >
      <div className="garland-carousel-track">
        {Array.from({ length: MAX_BANDERINES }, (_, index) => {
          const item = items[index] ?? null
          const design = item ? getDesign(item.designId) : undefined
          const color = item ? colors.find((candidate) => candidate.id === item.colorId) : undefined
          const position = String(index + 1).padStart(2, '0')

          return (
            <div className="garland-slot-wrap" key={index}>
              <button
                type="button"
                className={`garland-slot-card ${item ? 'is-configured' : 'is-empty'}`}
                onClick={() => onSelectPosition(index)}
                onFocus={() => setActiveIndex(index)}
                onKeyDown={handleKeyDown}
                ref={index === firstEmptyIndex ? addTargetRef : undefined}
                aria-label={item
                  ? `Editar posición ${index + 1}: ${design?.name ?? item.designId}${item.customization?.name ? ` ${item.customization.name}` : ''}`
                  : `Agregar banderín a la posición ${index + 1}`}
                aria-current={activeIndex === index ? 'step' : undefined}
                aria-roledescription="diapositiva"
                aria-posinset={index + 1}
                aria-setsize={MAX_BANDERINES}
              >
                <span className="garland-slot-number">{position}</span>
                {item && color
                  ? <BanderinRenderer item={item} color={color.value} index={index} className="garland-slot-art" />
                  : <span className="garland-slot-add"><AddRegular /><span>Agregar</span></span>}
              </button>
              {item && (
                <button
                  type="button"
                  className="garland-slot-duplicate"
                  ref={index === firstConfiguredIndex ? duplicateTargetRef : undefined}
                  aria-label={`Duplicar banderín de la posición ${index + 1}`}
                  title="Duplicar banderín"
                  disabled={!items.some((slot) => slot === null)}
                  onClick={() => {
                    const duplicatedIndex = onDuplicatePosition(index)
                    if (duplicatedIndex === undefined) {
                      setDuplicateNotice('No hay posiciones libres para duplicar este banderín.')
                      return
                    }
                    setDuplicateNotice(`Banderín duplicado en la posición ${duplicatedIndex + 1}.`)
                    goToPosition(duplicatedIndex)
                    if (onboarding.step === 'duplicate') onboarding.setStep('carousel')
                  }}
                >
                  <CopyRegular />
                </button>
              )}
            </div>
          )
        })}
      </div>
      </div>
      <div className="garland-carousel-controls" aria-label="Controles del carrusel">
        <button type="button" className="carousel-arrow" onClick={() => goToPosition(Math.max(activeIndex - 1, 0))} disabled={activeIndex === 0} aria-label="Banderín anterior" title="Banderín anterior">
          <ChevronLeftRegular />
        </button>
        <span className="carousel-position" aria-live="polite">{String(activeIndex + 1).padStart(2, '0')} / {MAX_BANDERINES}</span>
        <button type="button" className="carousel-arrow" onClick={() => goToPosition(Math.min(activeIndex + 1, MAX_BANDERINES - 1))} disabled={activeIndex === MAX_BANDERINES - 1} aria-label="Banderín siguiente" title="Banderín siguiente">
          <ChevronRightRegular />
        </button>
      </div>
      <p className="garland-duplicate-notice" aria-live="polite">{duplicateNotice}</p>
    </div>
  )
}