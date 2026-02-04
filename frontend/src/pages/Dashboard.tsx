import { useState, useEffect } from 'react';
import { agentConfigApi, callApi } from '../services/api';
import type { AgentConfig, Call } from '../types';
import CallTriggerForm from '../components/CallTrigger/CallTriggerForm';
import CallStatusIndicator from '../components/CallTrigger/CallStatusIndicator';

export default function Dashboard() {
  const [agentConfigs, setAgentConfigs] = useState<AgentConfig[]>([]);
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState<Call | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [configs, calls] = await Promise.all([
        agentConfigApi.list(),
        callApi.list(5),
      ]);
      setAgentConfigs(configs.filter((c) => c.is_active));
      setRecentCalls(calls);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCallInitiated = (call: Call) => {
    setActiveCall(call);
    setRecentCalls((prev) => [call, ...prev]);
  };

  const handleCallCompleted = () => {
    setActiveCall(null);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Trigger test calls and monitor agent performance
        </p>
      </div>

      {activeCall && (
        <CallStatusIndicator call={activeCall} onComplete={handleCallCompleted} />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Initiate Test Call
          </h3>
          <CallTriggerForm
            agentConfigs={agentConfigs}
            onCallInitiated={handleCallInitiated}
          />
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Recent Calls
          </h3>
          <div className="space-y-3">
            {recentCalls.length === 0 ? (
              <p className="text-sm text-gray-500">No calls yet</p>
            ) : (
              recentCalls.map((call) => (
                <div
                  key={call.id}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {call.driver_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Load: {call.load_number}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          call.call_status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : call.call_status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {call.call_status}
                      </span>
                      {call.duration_seconds && (
                        <p className="text-xs text-gray-500 mt-1">
                          {call.duration_seconds}s
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Active Agent Configurations
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agentConfigs.map((config) => (
            <div
              key={config.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h4 className="text-sm font-medium text-gray-900">
                {config.name}
              </h4>
              <p className="mt-1 text-xs text-gray-500">{config.description}</p>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    config.scenario_type === 'check_in'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {config.scenario_type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
