import { useState, useEffect } from 'react';
import AgentConfigForm from '../components/AgentConfig/AgentConfigForm';
import api from '../services/api';
import type { AgentConfig } from '../types';

export default function AgentConfiguration() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listAgentConfigs();
      setAgents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load agent configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedAgent(null);
    setIsCreating(true);
  };

  const handleEdit = (agent: AgentConfig) => {
    setSelectedAgent(agent);
    setIsCreating(false);
  };

  const handleDelete = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent configuration?')) {
      return;
    }

    try {
      await api.deleteAgentConfig(agentId);
      await loadAgents();
      if (selectedAgent?.id === agentId) {
        setSelectedAgent(null);
        setIsCreating(false);
      }
    } catch (err: any) {
      alert(`Failed to delete agent: ${err.message}`);
    }
  };

  const handleSaveSuccess = () => {
    setIsCreating(false);
    setSelectedAgent(null);
    loadAgents();
  };

  const handleCancel = () => {
    setIsCreating(false);
    setSelectedAgent(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading agent configurations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Agent Configuration</h2>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create New Agent
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent List */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Agents</h3>
            <div className="space-y-2">
              {agents.length === 0 ? (
                <p className="text-gray-500 text-sm">No agents configured yet.</p>
              ) : (
                agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedAgent?.id === agent.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleEdit(agent)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{agent.name}</h4>
                        <p className="text-sm text-gray-500 capitalize">
                          {agent.scenario_type.replace('_', ' ')}
                        </p>
                        {!agent.is_active && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(agent.id);
                        }}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Agent Form */}
        <div className="lg:col-span-2">
          {(isCreating || selectedAgent) ? (
            <AgentConfigForm
              agent={selectedAgent}
              onSuccess={handleSaveSuccess}
              onCancel={handleCancel}
            />
          ) : (
            <div className="bg-white shadow rounded-lg p-6 flex items-center justify-center h-96">
              <div className="text-center text-gray-500">
                <p className="mb-4">Select an agent to edit or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
