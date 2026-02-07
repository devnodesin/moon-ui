import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './hooks/useAuth';
import { NotificationProvider } from './contexts/NotificationContext';
import { ConnectionProvider } from './contexts/ConnectionContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { ToastContainer } from './components/ToastContainer';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ConnectionProvider>
          <NotificationProvider>
            <HashRouter>
              <ToastContainer />
              <Routes>
                {/* Public route */}
                <Route path="/" element={<LoginPage />} />

                {/* Protected routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <DashboardPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/notifications"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <NotificationsPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/connections"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <ConnectionsPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                {/* 404 Not Found */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </HashRouter>
          </NotificationProvider>
        </ConnectionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
