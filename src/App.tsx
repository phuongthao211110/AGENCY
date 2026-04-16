import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DocumentIndex from './components/DocumentIndex'
import StoryDetailPage from './components/StoryDetailPage'
import StoryCreatePage from './components/StoryCreatePage'
// Super Admin
import SuperAdminLayout from './platforms/super-admin/layout/SuperAdminLayout'
import SuperAdminLogin from './platforms/super-admin/pages/Login'
import Agencies from './platforms/super-admin/pages/Agencies'
import AgencyCreate from './platforms/super-admin/pages/AgencyCreate'
import AgencyDetail from './platforms/super-admin/pages/AgencyDetail'
import SuperAdminDocument from './platforms/super-admin/pages/Document'

// Agency Admin
import AgencyAdminLayout from './platforms/agency-admin/layout/AgencyAdminLayout'
import AgencyAdminLogin from './platforms/agency-admin/pages/Login'
import Shops from './platforms/agency-admin/pages/Shops'
import ShopCreate from './platforms/agency-admin/pages/ShopCreate'
import ShopDetail from './platforms/agency-admin/pages/ShopDetail'
import CarrierSetup from './platforms/agency-admin/pages/CarrierSetup'
import ServiceDetail from './platforms/agency-admin/pages/ServiceDetail'
import AgencyAdminDocument from './platforms/agency-admin/pages/Document'

// Shop
import ShopLayout from './platforms/shop/layout/ShopLayout'
import ShopLogin from './platforms/shop/pages/Login'
import ShopOrders from './platforms/shop/pages/Orders'
import ShopReconciliation from './platforms/shop/pages/Reconciliation'
import ShopPricing from './platforms/shop/pages/Pricing'
import ShopSupport from './platforms/shop/pages/Support'
import ShopDocument from './platforms/shop/pages/Document'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/super-admin/dashboard" replace />} />

        {/* Super Admin */}
        <Route path="/super-admin/login" element={<SuperAdminLogin />} />
        <Route path="/super-admin" element={<SuperAdminLayout />}>
          <Route path="dashboard" element={<Navigate to="/super-admin/agencies" replace />} />
          <Route path="agencies" element={<Agencies />} />
          <Route path="agencies/create" element={<AgencyCreate />} />
          <Route path="agencies/:id" element={<AgencyDetail />} />
          <Route path="document" element={<SuperAdminDocument />}>
            <Route index element={<DocumentIndex />} />
            <Route path="story/:storyId" element={<StoryDetailPage />} />
            <Route path="new/:sectionKey" element={<StoryCreatePage />} />
          </Route>
          <Route index element={<Navigate to="agencies" replace />} />
        </Route>

        {/* Agency Admin */}
        <Route path="/agency-admin/login" element={<AgencyAdminLogin />} />
        <Route path="/agency-admin" element={<AgencyAdminLayout />}>
          <Route path="shops" element={<Shops />} />
          <Route path="shops/create" element={<ShopCreate />} />
          <Route path="shops/:id" element={<ShopDetail />} />
          <Route path="carrier-setup" element={<CarrierSetup />} />
          <Route path="carrier-setup/services/:id" element={<ServiceDetail />} />
          <Route path="document" element={<AgencyAdminDocument />}>
            <Route index element={<DocumentIndex />} />
            <Route path="story/:storyId" element={<StoryDetailPage />} />
            <Route path="new/:sectionKey" element={<StoryCreatePage />} />
          </Route>
          <Route index element={<Navigate to="shops" replace />} />
        </Route>

        {/* Shop */}
        <Route path="/shop/login" element={<ShopLogin />} />
        <Route path="/shop" element={<ShopLayout />}>
          <Route path="orders" element={<ShopOrders />} />
          <Route path="reconciliation" element={<ShopReconciliation />} />
          <Route path="pricing" element={<ShopPricing />} />
          <Route path="support" element={<ShopSupport />} />
          <Route path="document" element={<ShopDocument />}>
            <Route index element={<DocumentIndex />} />
            <Route path="story/:storyId" element={<StoryDetailPage />} />
            <Route path="new/:sectionKey" element={<StoryCreatePage />} />
          </Route>
          <Route index element={<Navigate to="orders" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
