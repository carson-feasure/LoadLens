import { useEffect, useRef, useState } from 'react'
import { Menu, X, Settings, Info, RotateCcw, FlaskConical } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { STORAGE_KEY, usePlanner } from '../state/planner'
import { AboutDialog, PreferencesDialog } from './Dialogs'

const links: ReadonlyArray<readonly [string, string]> = [['/dashboard', 'Dashboard'], ['/build', 'Build'], ['/overview', 'Overview'], ['/adjust', 'Adjust']]

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const location = useLocation()
  const { state, dispatch, notice, clearNotice, persistenceAvailable } = usePlanner()
  useEffect(() => setMenuOpen(false), [location.pathname])
  useEffect(() => {
    if (!menuOpen) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus() } }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [menuOpen])
  const reset = () => {
    if (window.confirm('Reset your local plan, preferences, comparison, and study records to the demo defaults?')) {
      try { window.localStorage.removeItem(STORAGE_KEY) } catch { /* in-memory reset still works */ }
      dispatch({ type: 'RESET_DEMO' })
    }
  }
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/dashboard" aria-label="LoadLens dashboard"><span className="brand-mark" aria-hidden="true">L</span><span>LoadLens</span></Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map(([to, label]) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>{label}</NavLink>)}
        </nav>
        <div className="header-tools">
          <span className="term-chip">Fall 2026 <span aria-hidden="true">·</span> Demo</span>
          <button className="avatar-button" type="button" aria-label="Open demo student menu" onClick={() => setMenuOpen((open) => !open)}>M</button>
          <button ref={menuButton} className="mobile-menu-button" type="button" aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
        {menuOpen && <div className="menu-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setMenuOpen(false); menuButton.current?.focus() } }}>
          <div className="account-menu" id="mobile-menu" role="dialog" aria-label="Navigation and demo options">
            <div className="mobile-nav" aria-label="Mobile navigation">
              {links.map(([to, label]) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>{label}</NavLink>)}
            </div>
            <div className="menu-separator" />
            <button type="button" onClick={() => { setPrefsOpen(true); setMenuOpen(false) }}><Settings /> Workload preference</button>
            <button type="button" onClick={() => { setAboutOpen(true); setMenuOpen(false) }}><Info /> About this demo</button>
            <Link to="/study"><FlaskConical /> Prototype study</Link>
            <button type="button" onClick={reset}><RotateCcw /> Reset demo</button>
            <p className="menu-meta">{persistenceAvailable ? 'Saved on this browser' : 'In-memory session only'} · {state.studySessions.length} study response{state.studySessions.length === 1 ? '' : 's'}</p>
          </div>
        </div>}
      </div>
    </header>
    {notice && <div className="global-notice" role="status"><span>{notice}</span><button type="button" onClick={clearNotice}>Dismiss</button></div>}
    <main id="main-content"><Outlet /></main>
    <footer className="site-footer"><div><strong>LoadLens</strong><span>Illustrative workload planning prototype</span></div><button type="button" onClick={() => setAboutOpen(true)}>About the estimates</button></footer>
    <PreferencesDialog open={prefsOpen} onClose={() => setPrefsOpen(false)} />
    <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
  </div>
}
