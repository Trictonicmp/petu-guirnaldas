import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import App from './App'

const rootRoute = createRootRoute({ component: Outlet })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>): { g?: string; p?: string } => {
    // El router convierte valores numéricos (p=123) a number, por eso se normaliza a string.
    const order = typeof search.p === 'string' || typeof search.p === 'number' ? String(search.p).trim() : ''
    return {
      g: typeof search.g === 'string' && search.g ? search.g : undefined,
      p: order || undefined,
    }
  },
  component: App,
})

export const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute]) })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
