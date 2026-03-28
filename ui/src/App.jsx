import { Route, Routes } from 'react-router-dom'
import { SiteLayout } from './components/SiteLayout.jsx'
import { Home } from './pages/Home.jsx'
import { TemplateSelect } from './pages/TemplateSelect.jsx'
import { CreatePage } from './pages/CreatePage.jsx'
import { PublicPage } from './pages/PublicPage.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="templates" element={<TemplateSelect />} />
        <Route path="create" element={<CreatePage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path=":slug" element={<PublicPage />} />
      </Route>
    </Routes>
  )
}
