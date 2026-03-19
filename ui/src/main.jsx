import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Simple slug detection from URL path, e.g. /john-and-martha
const slugFromPath = window.location.pathname.replace(/^\/+|\/+$/g, '')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App initialSlug={slugFromPath || ''} />
  </StrictMode>,
)
