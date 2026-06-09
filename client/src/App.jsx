import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { ToastProvider } from './lib/toast';

// Layout & Pages
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CrmLeads from './pages/CrmLeads';
import StudentList from './pages/StudentList';
import FeeCollection from './pages/FeeCollection';
import Attendance from './pages/Attendance';
import Academics from './pages/Academics';
import StaffManagement from './pages/StaffManagement';
import Payroll from './pages/Payroll';
import Settings from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Full-screen loading spinner shown during initial session rehydration
function RehydratingSpinner() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #0d0d2b 40%, #0a1628 70%, #050510 100%)',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(99,102,241,0.2)',
        borderTopColor: '#6366f1',
        borderRadius: '50%',
        animation: 'spin 0.75s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Guard for protected routes
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isRehydrating, user } = useAuthStore();

  if (isRehydrating) return <RehydratingSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Guard for guest-only routes (e.g. login)
function GuestRoute({ children }) {
  const { isAuthenticated, isRehydrating } = useAuthStore();

  if (isRehydrating) return <RehydratingSpinner />;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  const rehydrate = useAuthStore((state) => state.rehydrate);

  useEffect(() => {
    rehydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Guest Routes */}
          <Route 
            path="/login" 
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            } 
          />

          {/* Protected Routes inside Dashboard Layout */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            
            <Route 
              path="crm" 
              element={
                <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin', 'Principal', 'HR']}>
                  <CrmLeads />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="students" 
              element={
                <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin', 'Principal', 'Teacher', 'Accountant', 'HR']}>
                  <StudentList />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="attendance" 
              element={
                <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin', 'Principal', 'Teacher']}>
                  <Attendance />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="fees" 
              element={
                <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin', 'Accountant', 'Student', 'Parent']}>
                  <FeeCollection />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="academics" 
              element={
                <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin', 'Principal', 'Teacher', 'Student', 'Parent']}>
                  <Academics />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="staff" 
              element={
                <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin', 'Principal', 'HR']}>
                  <StaffManagement />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="payroll" 
              element={
                <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin', 'Accountant', 'HR']}>
                  <Payroll />
                </ProtectedRoute>
              } 
            />

            {/* Settings Route */}
            <Route path="settings" element={<Settings />} />

            {/* Fallback route within dashboard layout */}
            <Route 
              path="*" 
              element={
                <div className="p-8 text-center text-gray-500 font-medium">
                  This module is currently under active deployment. Check back shortly.
                </div>
              } 
            />
          </Route>
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
