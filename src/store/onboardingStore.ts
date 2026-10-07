import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type OnboardingState = {
  hasCompleted: boolean
  setHasCompleted: (hasCompleted: boolean) => void
}

export const useOnboardingStore = create<OnboardingState>()(persist((set) => ({
  hasCompleted: false,
  setHasCompleted: (hasCompleted) => set({ hasCompleted }),
}), {
  name: 'petu-onboarding',
  storage: createJSONStorage(() => localStorage),
  partialize: ({ hasCompleted }) => ({ hasCompleted }),
}))
