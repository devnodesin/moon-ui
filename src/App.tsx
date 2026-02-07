import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './hooks/useAuth';
import { NotificationProvider } from './contexts/NotificationContext';
import { ConnectionProvider } from './contexts/ConnectionContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { GlobalProgress } from './components/GlobalProgress';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { ToastContainer } from './components/ToastContainer';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { CollectionListPage } from './pages/CollectionListPage';
import { CollectionRecordsPage } from './pages/CollectionRecordsPage';
import { RecordDetailPage } from './pages/RecordDetailPage';
import { UsersPage } from './pages/UsersPage';
import { UserDetailPage } from './pages/UserDetailPage';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <ThemeProvider>
      <LoadingProvider>
        <AuthProvider>
          <ConnectionProvider>
            <NotificationProvider>
              <HashRouter>
                <GlobalProgress />
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
                <Route
                  path="/admin/collections"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <CollectionListPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/collections/:collectionName"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <CollectionRecordsPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/collections/:collectionName/:id"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <RecordDetailPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <UsersPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users/:id"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <UserDetailPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/keys"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <ApiKeysPage />
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
      </LoadingProvider>
    </ThemeProvider>
  );
}

export default App;
