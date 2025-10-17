import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/atoms/sonner';
import { TooltipProvider } from '@/components/atoms/tooltip';
import DashboardLayout from './components/molecules/DashboardLayout';
import Auth from './pages/Auth';
import MyTasks from './pages/MyTasks';
import CreatedTasks from './pages/CreatedTasks';
import { useMeQuery } from './services/authApi';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '@/store/store';
import { ThemeProvider } from './components/molecules/ThemeProvider';
import Loading from './components/molecules/Loading';
import { setGeneralIsLoading } from './store/generalSlice';
import { useEffect } from 'react';

const App = () => {

  const { auth } = useSelector((state: RootState) => state);
  const dispatch = useDispatch()
  const { isSuccess, isLoading } = useMeQuery(undefined, {
    skip: !auth.token,
  });

  useEffect(() => {
      dispatch(setGeneralIsLoading(isLoading))
  }, [isLoading])

  const isAuthenticated = auth.token && isSuccess;

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