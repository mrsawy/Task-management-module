import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from '../organs/Navbar';
import { SidebarInset, SidebarProvider } from '../atoms/sidebar';
import { AppSidebar } from '../organs/AppSidebar';
import { useMeQuery } from '@/services/authApi';


export default function DashboardLayout() {
  const location = useLocation();
  const { error } = useMeQuery()
  if (error) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  return <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <div className="min-h-screen bg-background  mx-auto w-full">
        <Navbar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 ">
          <Outlet />
        </main>
      </div>
    </SidebarInset>
  </SidebarProvider>
}