import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return <div className="page-wrap not-found"><p className="eyebrow">404 · PAGE NOT FOUND</p><h1>That route wandered off campus</h1><p>The page may have moved, but your local LoadLens plan is still here.</p><Link className="button primary" to="/dashboard">Return to dashboard <ArrowRight /></Link></div>
}
