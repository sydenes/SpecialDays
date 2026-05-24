import { Outlet, Route, Routes } from 'react-router-dom'
import { SiteLayout } from './components/SiteLayout.jsx'
import { Home } from './pages/Home.jsx'
import { CategorySelect } from './pages/CategorySelect.jsx'
import { TemplatePicker } from './pages/TemplatePicker.jsx'
import { CreatePage } from './pages/CreatePage.jsx'
import { EditPage } from './pages/EditPage.jsx'
import { PublicPage } from './pages/PublicPage.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="templates" element={<Outlet />}>
          <Route index element={<CategorySelect />} />
          <Route path=":categoryCode" element={<TemplatePicker />} />
        </Route>
        <Route path="create" element={<CreatePage />} />
        <Route path="edit/:slug" element={<EditPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path=":slug" element={<PublicPage />} />
      </Route>
    </Routes>
  )
}
