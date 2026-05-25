import { Outlet, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, RequireAdminRoute } from './components/ProtectedRoute.jsx'
import { SiteLayout } from './components/SiteLayout.jsx'
import { LoginPage } from './pages/auth/LoginPage.jsx'
import { RegisterPage } from './pages/auth/RegisterPage.jsx'
import { Home } from './pages/Home.jsx'
import { CategorySelect } from './pages/CategorySelect.jsx'
import { TemplatePicker } from './pages/TemplatePicker.jsx'
import { CreatePage } from './pages/CreatePage.jsx'
import { EditPage } from './pages/EditPage.jsx'
import { PreviewPage } from './pages/PreviewPage.jsx'
import { PublishSuccessPage } from './pages/PublishSuccessPage.jsx'
import { PublicPage } from './pages/PublicPage.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { MyPanelPage } from './pages/MyPanelPage.jsx'
import { PageGuestbookPage } from './pages/PageGuestbookPage.jsx'
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
        <Route path="giris" element={<LoginPage />} />
        <Route path="kayit" element={<RegisterPage />} />
        <Route
          path="panom"
          element={
            <ProtectedRoute>
              <MyPanelPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="panom/:slug/defter"
          element={
            <ProtectedRoute>
              <PageGuestbookPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="create"
          element={
            <ProtectedRoute>
              <CreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="edit/:slug"
          element={
            <ProtectedRoute>
              <EditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="published/:slug"
          element={
            <ProtectedRoute>
              <PublishSuccessPage />
            </ProtectedRoute>
          }
        />
        <Route path="preview/:slug" element={<PreviewPage />} />
        <Route
          path="dashboard"
          element={
            <RequireAdminRoute>
              <DashboardPage />
            </RequireAdminRoute>
          }
        />
        <Route path=":slug" element={<PublicPage />} />
      </Route>
    </Routes>
  )
}
