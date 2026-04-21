import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import DashboardLayout from "./pages/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import LeadFinder from "./pages/dashboard/LeadFinder";
import Pipeline from "./pages/dashboard/Pipeline";
import WebsiteAudits from "./pages/dashboard/WebsiteAudits";
import AITools from "./pages/dashboard/AITools";
import SocialPublisher from "./pages/dashboard/SocialPublisher";
import PublishSettings from "./pages/dashboard/PublishSettings";
import SocialHealth from "./pages/dashboard/SocialHealth";
import SocialChannelDetail from "./pages/dashboard/SocialChannelDetail";
import ContentStudio from "./pages/dashboard/ContentStudio";
import ContentOverview from "./pages/dashboard/ContentOverview";
import Academy from "./pages/dashboard/Academy";
import SettingsPage from "./pages/dashboard/SettingsPage";
import UserManagement from "./pages/dashboard/UserManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="leads" element={<LeadFinder />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="audits" element={<WebsiteAudits />} />
            <Route path="ai-tools" element={<AITools />} />
            <Route path="social" element={<SocialPublisher />} />
            <Route path="social/health" element={<SocialHealth />} />
            <Route path="social/health/:connectionId" element={<SocialChannelDetail />} />
            <Route path="publish-settings" element={<PublishSettings />} />
            <Route path="content" element={<ContentStudio />} />
            <Route path="content/overview" element={<ContentOverview />} />
            <Route path="academy" element={<Academy />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="users" element={<UserManagement />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
