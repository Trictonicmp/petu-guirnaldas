import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type RefCallback,
} from 'react'
import {
  Button,
  TeachingPopover,
  TeachingPopoverBody,
  TeachingPopoverHeader,
  TeachingPopoverSurface,
  TeachingPopoverTitle,
} from '@fluentui/react-components'
import { helpTopics, otherDesignHint } from '../../domain/help/helpTopics'
import { useOnboardingStore } from '../../store/onboardingStore'

export type OnboardingStep =
  | 'intro'
  | 'add'
  | 'shape'
  | 'design'
  | 'color'
  | 'save'
  | 'duplicate'
  | 'carousel'
  | 'progress'
  | 'completion'
  | 'order'
  | 'whatsapp'

type OnboardingContextValue = {
  step: OnboardingStep | null
  setStep: (step: OnboardingStep | null) => void
  complete: () => void
  dismiss: () => void
  restart: () => void
  targetRef: (step: OnboardingStep) => RefCallback<HTMLElement>
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

const onboardingContent: Record<OnboardingStep, { title: string; description: string }> = {
  intro: {
    title: 'Crea tu guirnalda',
    description: 'Vamos a crear tu guirnalda, banderín por banderín. Necesitas completar 10 posiciones.',
  },
  add: {
    title: 'Agrega tu primer banderín',
    description: helpTopics.find((topic) => topic.id === 'add')!.description,
  },
  shape: {
    title: 'Elige la forma',
    description: 'Primero elige la forma de tu banderín.',
  },
  design: {
    title: 'Elige un diseño',
    description: `Escoge el diseño que quieres utilizar. ${otherDesignHint}`,
  },
  color: {
    title: 'Selecciona el color',
    description: 'Elige el color del papel y, si aplica, escribe el nombre o la raza.',
  },
  save: {
    title: 'Listo',
    description: 'Agrega el banderín a tu guirnalda.',
  },
  duplicate: {
    title: 'Duplica un banderín',
    description: helpTopics.find((topic) => topic.id === 'duplicate')!.description,
  },
  carousel: {
    title: 'Continúa con los siguientes',
    description: helpTopics.find((topic) => topic.id === 'carousel')!.description,
  },
  progress: {
    title: 'Tu progreso',
    description: helpTopics.find((topic) => topic.id === 'progress')!.description,
  },
  completion: {
    title: '¡Guirnalda completa!',
    description: 'Cuando tengas los 10 banderines, continúa para ingresar tu número de pedido y preparar tu mensaje de WhatsApp.',
  },
  order: {
    title: 'Número de pedido',
    description: helpTopics.find((topic) => topic.id === 'order')!.description,
  },
  whatsapp: {
    title: 'Envía tu configuración',
    description: helpTopics.find((topic) => topic.id === 'whatsapp')!.description,
  },
}

export function OnboardingProvider({ children }: PropsWithChildren) {
  const hasCompleted = useOnboardingStore((state) => state.hasCompleted)
  const setHasCompleted = useOnboardingStore((state) => state.setHasCompleted)
  const [step, setStep] = useState<OnboardingStep | null>(null)
  const [popoverDismissed, setPopoverDismissed] = useState(false)
  const [targets, setTargets] = useState<Partial<Record<OnboardingStep, HTMLElement | null>>>({})
  const popoverSurfaceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasCompleted) setStep('intro')
  }, [hasCompleted])

  const complete = useCallback(() => {
    setStep(null)
    setPopoverDismissed(false)
    setHasCompleted(true)
  }, [setHasCompleted])

  const dismiss = useCallback(() => {
    setPopoverDismissed(true)
  }, [])

  const advanceTo = useCallback((nextStep: OnboardingStep | null) => {
    setStep(nextStep)
    setPopoverDismissed(false)
  }, [])

  const restart = useCallback(() => {
    setHasCompleted(false)
    advanceTo('intro')
  }, [advanceTo, setHasCompleted])

  const registerTarget = useCallback((targetStep: OnboardingStep, element: HTMLElement | null) => {
    setTargets((current) => current[targetStep] === element
      ? current
      : { ...current, [targetStep]: element })
  }, [])

  const targetRef = useCallback((targetStep: OnboardingStep): RefCallback<HTMLElement> => (
    (element) => registerTarget(targetStep, element)
  ), [registerTarget])

  const value = useMemo(() => ({
    step,
    setStep: advanceTo,
    complete,
    dismiss,
    restart,
    targetRef,
  }), [step, advanceTo, complete, dismiss, restart, targetRef])

  const target = step ? targets[step] : null

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {step && target && !popoverDismissed && (
        <TeachingPopover
          open
          trapFocus={false}
          unstable_disableAutoFocus
          withArrow
          positioning={{
            target,
            position: 'below',
            align: 'start',
            offset: 10,
            fallbackPositions: ['above', 'above-start'],
          }}
          onOpenChange={(event, data) => {
            if (!data.open && step && event.target instanceof Node && popoverSurfaceRef.current?.contains(event.target)) {
              if (step === 'intro') advanceTo('add')
              else dismiss()
            }
          }}
        >
          <TeachingPopoverSurface className="onboarding-surface" ref={popoverSurfaceRef}>
            <TeachingPopoverHeader dismissButton={{ 'aria-label': 'Cerrar tutorial', title: 'Cerrar tutorial' }}>
              Guía rápida
            </TeachingPopoverHeader>
            <TeachingPopoverBody>
              <TeachingPopoverTitle>{onboardingContent[step].title}</TeachingPopoverTitle>
              <p>{onboardingContent[step].description}</p>
              <div className="onboarding-actions">
                {step === 'intro' && (
                  <Button
                    appearance="primary"
                    onClick={() => advanceTo(targets.add ? 'add' : 'completion')}
                  >
                    Comenzar
                  </Button>
                )}
                {step === 'duplicate' && (
                  <Button appearance="primary" onClick={() => advanceTo('carousel')}>
                    Continuar
                  </Button>
                )}
                <Button appearance="secondary" onClick={complete}>
                  Saltar tutorial
                </Button>
              </div>
            </TeachingPopoverBody>
          </TeachingPopoverSurface>
        </TeachingPopover>
      )}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) throw new Error('useOnboarding debe usarse dentro de OnboardingProvider.')
  return context
}

export function useOnboardingTarget(step: OnboardingStep) {
  const { targetRef } = useOnboarding()
  return useCallback(targetRef(step), [targetRef, step])
}
