import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import { PlannerProvider } from './state/planner'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <PlannerProvider><App /></PlannerProvider>
    </HashRouter>
  </StrictMode>,
)
