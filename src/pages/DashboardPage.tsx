import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotify } from '../hooks/useNotify';
import { useLoading } from '../contexts/LoadingContext';
import { extractUserMessage } from '../utils/errorUtils';
import * as collectionService from '../services/collectionService';
import * as userService from '../services/userService';
import * as apiKeyService from '../services/apiKeyService';
import type { CollectionInfo } from '../services/collectionService';

interface DashboardStats {
  collectionsCount: number;
  usersCount: number;
  apiKeysCount: number;
}

export function DashboardPage() {
  const { currentConnection } = useAuth();
  const navigate = useNavigate();
  const notify = useNotify();
  const { startLoading, stopLoading } = useLoading();
  
  const [stats, setStats] = useState<DashboardStats>({
    collectionsCount: 0,
    usersCount: 0,
    apiKeysCount: 0,
  });
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const baseUrl = currentConnection?.baseUrl ?? '';
  const token = currentConnection?.accessToken ?? '';

  const fetchDashboardData = useCallback(async () => {
    if (!baseUrl || !token) return;
    setLoading(true);
    startLoading();
    try {
      const [collectionsData, usersData, apiKeysData] = await Promise.all([
        collectionService.listCollections(baseUrl, token),
        userService.listUsers(baseUrl, token, { limit: 1 }),
        apiKeyService.listApiKeys(baseUrl, token, { limit: 1 }),
      ]);

      setCollections(collectionsData);
      setStats({
        collectionsCount: collectionsData.length,
        usersCount: usersData.total || usersData.users.length,
        apiKeysCount: apiKeysData.total || apiKeysData.apikeys.length,
      });
    } catch (error) {
      notify.error(extractUserMessage(error, 'Failed to load dashboard data'));
    } finally {
      setLoading(false);
      stopLoading();
    }
  }, [baseUrl, token, startLoading, stopLoading, notify]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const StatCard = ({ 
    title, 
    count, 
    icon, 
    onClick 
  }: { 
    title: string; 
    count: number; 
    icon: string; 
    onClick: () => void;
  }) => (
    <div 
      className="card bg-base-100 shadow-xl cursor-pointer hover:shadow-2xl transition-shadow"
      onClick={onClick}
      data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="card-title text-base-content/60 text-sm font-normal">{title}</h2>
            <p className="text-4xl font-bold mt-2">{count}</p>
          </div>
          <div className="text-5xl opacity-20">{icon}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatCard
              title="Collections"
              count={stats.collectionsCount}
              icon="📚"
              onClick={() => navigate('/admin/collections')}
            />
            <StatCard
              title="Users"
              count={stats.usersCount}
              icon="👥"
              onClick={() => navigate('/admin/users')}
            />
            <StatCard
              title="API Keys"
              count={stats.apiKeysCount}
              icon="🔑"
              onClick={() => navigate('/admin/apikeys')}
            />
          </div>

          {/* Collections Table */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-4">Collections</h2>
              
              {collections.length === 0 ? (
                <div className="text-center py-8 text-base-content/60">
                  No collections found. <button 
                    className="btn btn-link btn-sm" 
                    onClick={() => navigate('/admin/collections')}
                  >
                    Create your first collection
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Records</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collections.map((collection) => (
                        <tr 
                          key={collection.name}
                          className="hover cursor-pointer"
                          onClick={() => navigate(`/admin/collections/${encodeURIComponent(collection.name)}`)}
                        >
                          <td className="font-medium">{collection.name}</td>
                          <td>{collection.records}</td>
                          <td>
                            <button 
                              className="btn btn-xs btn-ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/collections/${encodeURIComponent(collection.name)}`);
                              }}
                            >
                              View →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
