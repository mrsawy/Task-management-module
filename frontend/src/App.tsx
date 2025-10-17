import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/atoms/sonner';
import { TooltipProvider } from '@/components/atoms/tooltip';
import DashboardLayout from './components/molecules/DashboardLayout';
import Auth from './pages/Auth';
import MyTasks from './pages/MyTasks';
import CreatedTasks from './pages/CreatedTasks';
import { useMeQuery } from './services/authApi';
import { useSelector } from 'react-redux';
import { type RootState } from '@/store/store';
import { ThemeProvider } from './components/molecules/ThemeProvider';
import Loading from './components/molecules/Loading';

const App = () => {

  const token = useSelector((state: RootState) => state.auth.token);
  const { isSuccess, isLoading } = useMeQuery(undefined, {
    skip: !token,
  });

  if (token && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const isAuthenticated = token && isSuccess;

  return (
    <TooltipProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route
              path="/auth/*"
              element={
                isAuthenticated ? <Navigate to="/dashboard/my-tasks" replace /> : <Auth />
              }
            />
            <Route element={<DashboardLayout />}>
              <Route path="dashboard/my-tasks" element={<MyTasks />} />
              <Route path="dashboard/created-tasks" element={<CreatedTasks />} />
            </Route>
            <Route
              path="/"
              element={
                <Navigate to={isAuthenticated ? "/dashboard/my-tasks" : "/auth/login"} replace />
              }
            />
          </Routes>
        </BrowserRouter>
        <Loading />
      </ThemeProvider>
    </TooltipProvider>
  );
};

export default App;