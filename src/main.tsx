import React from 'react'
import ReactDOM from 'react-dom/client'
import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './app/router'
import { parseGarland } from './domain/garland/share'
import { useGarlandStore } from './store/garlandStore'
import './styles.css'

// Un link compartido tiene prioridad sobre lo guardado en LocalStorage.
const sharedGarland = parseGarland(new URLSearchParams(window.location.search).get('g'))
if (sharedGarland) useGarlandStore.getState().loadGarland(sharedGarland)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FluentProvider theme={webLightTheme}>
      <RouterProvider router={router} />
    </FluentProvider>
  </React.StrictMode>,
)