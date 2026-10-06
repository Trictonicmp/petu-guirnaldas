import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import App from './App'

const rootRoute = createRootRoute({ component: Outlet })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>): { g?: string } => ({
    g: typeof search.g === 'string' && search.g ? search.g : undefined,
  }),
  component: App,
})

export const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute]) })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
