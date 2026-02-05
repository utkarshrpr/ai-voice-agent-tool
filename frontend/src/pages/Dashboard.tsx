import { useState, useEffect } from 'react';
import CallTriggerForm from '../components/CallTrigger/CallTriggerForm';
import CallStatusIndicator from '../components/CallTrigger/CallStatusIndicator';
import api from '../services/api';
import type { AgentConfig, Call } from '../types';

export default function Dashboard() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [agentsData, callsData] = await Promise.all([
        api.listAgentConfigs(true), // Only active agents
        api.listCalls(undefined, 10), // Last 10 calls
      ]);
      setAgents(agentsData);
      setRecentCalls(callsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCallComplete = () => {
    loadData(); // Refresh recent calls
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600">
          Trigger web calls and monitor recent activity
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {agents.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          No active agents configured. Please create an agent in the Agent Configuration page first.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Trigger Form */}
        <div>
          <CallTriggerForm
            agents={agents}
            onCallComplete={handleCallComplete}
          />
        </div>

        {/* Recent Calls */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Calls</h3>
          {recentCalls.length === 0 ? (
            <p className="text-gray-500 text-sm">No calls yet.</p>
          ) : (
            <div className="space-y-3">
              {recentCalls.slice(0, 5).map((call) => (
                <div
                  key={call.id}
                  className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{call.driver_name}</p>
                      <p className="text-sm text-gray-500">Load: {call.load_number}</p>
                    </div>
                    <CallStatusIndicator status={call.status} />
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(call.created_at).toLocaleString()}
                  </p>
                  {call.call_duration && (
                    <p className="text-xs text-gray-500 mt-1">
                      Duration: {Math.floor(call.call_duration / 60)}m {call.call_duration % 60}s
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          {recentCalls.length > 5 && (
            <div className="mt-4 text-center">
              <a
                href="/history"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View all calls →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Active Agents</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{agents.length}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Calls</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{recentCalls.length}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Completed Calls</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {recentCalls.filter((c) => c.status === 'completed').length}
          </p>
        </div>
      </div>
    </div>
  );
}
