import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
// Super Admin
import SuperAdminLayout from './platforms/super-admin/layout/SuperAdminLayout'
import SuperAdminLogin from './platforms/super-admin/pages/Login'
import Agencies from './platforms/super-admin/pages/Agencies'
import AgencyCreate from './platforms/super-admin/pages/AgencyCreate'
import AgencyDetail from './platforms/super-admin/pages/AgencyDetail'
import Hubs247 from './platforms/super-admin/pages/Hubs247'
import SuperAdminSettings from './platforms/super-admin/pages/Settings'
import AccountInfo from './platforms/super-admin/pages/settings/AccountInfo'
import UserManagement from './platforms/super-admin/pages/settings/UserManagement'
import Permissions from './platforms/super-admin/pages/settings/Permissions'

// Agency Admin
import AgencyAdminLayout from './platforms/agency-admin/layout/AgencyAdminLayout'
import AgencyAdminLogin from './platforms/agency-admin/pages/Login'
import Shops from './platforms/agency-admin/pages/Shops'
import ShopCreate from './platforms/agency-admin/pages/ShopCreate'
import ShopDetail from './platforms/agency-admin/pages/ShopDetail'
import CarrierSetup from './platforms/agency-admin/pages/CarrierSetup'
import ServiceDetail from './platforms/agency-admin/pages/ServiceDetail'
import PricingCreate from './platforms/agency-admin/pages/PricingCreate'
import PricingCreate247 from './platforms/agency-admin/pages/PricingCreate247'
import PricingDetail from './platforms/agency-admin/pages/PricingDetail'
import AgencyOrders from './platforms/agency-admin/pages/AgencyOrders'
import AgencyReconciliation from './platforms/agency-admin/pages/AgencyReconciliation'
import AgencyReconciliationDetail from './platforms/agency-admin/pages/AgencyReconciliationDetail'
import AgencyReconciliationShopDetail from './platforms/agency-admin/pages/AgencyReconciliationShopDetail'
import AgencyAdminSettings from './platforms/agency-admin/pages/Settings'
import RouteCheck from './platforms/agency-admin/pages/RouteCheck'
import AccountInfoAgency from './platforms/agency-admin/pages/settings/AccountInfo'
import UserManagementAgency from './platforms/agency-admin/pages/settings/UserManagement'
import PermissionsAgency from './platforms/agency-admin/pages/settings/Permissions'

// Shop
import ShopLayout from './platforms/shop/layout/ShopLayout'
import ShopLogin from './platforms/shop/pages/Login'
import ShopOrders from './platforms/shop/pages/Orders'
import ShopReconciliation from './platforms/shop/pages/Reconciliation'
import ShopPricing from './platforms/shop/pages/Pricing'
import ShopSupport from './platforms/shop/pages/Support'
import ShopSettings from './platforms/shop/pages/Settings'
import AccountInfoShop from './platforms/shop/pages/settings/AccountInfo'
import ShopSettingsPricing from './platforms/shop/pages/settings/ShopSettingsPricing'
import BankAccounts from './platforms/shop/pages/settings/BankAccounts'

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
          <Route path="hubs-247" element={<Hubs247 />} />
          <Route path="settings" element={<SuperAdminSettings />}>
            <Route path="account" element={<AccountInfo />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="permissions" element={<Permissions />} />
            <Route index element={<Navigate to="account" replace />} />
          </Route>
          <Route index element={<Navigate to="agencies" replace />} />
        </Route>

        {/* Agency Admin */}
        <Route path="/agency-admin/login" element={<AgencyAdminLogin />} />
        <Route path="/agency-admin" element={<AgencyAdminLayout />}>
          <Route path="orders" element={<AgencyOrders />} />
          <Route path="shops" element={<Shops />} />
          <Route path="shops/create" element={<ShopCreate />} />
          <Route path="shops/:id" element={<ShopDetail />} />
          <Route path="reconciliation" element={<AgencyReconciliation />} />
          <Route path="reconciliation/:id" element={<AgencyReconciliationDetail />} />
          <Route path="reconciliation/shop/:shopSessionId" element={<AgencyReconciliationShopDetail />} />
          <Route path="carrier-setup" element={<CarrierSetup />} />
          <Route path="carrier-setup/:tab" element={<CarrierSetup />} />
          <Route path="carrier-setup/pricing/create" element={<PricingCreate />} />
          <Route path="carrier-setup/pricing/create-247" element={<PricingCreate247 />} />
          <Route path="carrier-setup/pricing/:id" element={<PricingDetail />} />
          <Route path="carrier-setup/services/new" element={<ServiceDetail />} />
          <Route path="carrier-setup/services/:id" element={<ServiceDetail />} />
          <Route path="route-check" element={<RouteCheck />} />
          <Route path="settings" element={<AgencyAdminSettings />}>
            <Route path="account" element={<AccountInfoAgency />} />
            <Route path="users" element={<UserManagementAgency />} />
            <Route path="permissions" element={<PermissionsAgency />} />
            <Route index element={<Navigate to="account" replace />} />
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
          <Route path="settings" element={<ShopSettings />}>
            <Route path="account" element={<AccountInfoShop />} />
            <Route path="pricing" element={<ShopSettingsPricing />} />
            <Route path="bank" element={<BankAccounts />} />
            <Route index element={<Navigate to="account" replace />} />
          </Route>
          <Route index element={<Navigate to="orders" replace />} />
        </Route>
      </Routes>

    </BrowserRouter>
  )
}
