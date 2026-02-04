import { useState, useEffect } from 'react';
import { agentConfigApi } from '../services/api';
import type { AgentConfig } from '../types';
import AgentConfigForm from '../components/AgentConfig/AgentConfigForm';

export default function AgentConfiguration() {
  const [configs, setConfigs] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AgentConfig | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const data = await agentConfigApi.list();
      setConfigs(data);
    } catch (error) {
      console.error('Failed to load configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSaved = () => {
    setShowForm(false);
    setEditingConfig(null);
    loadConfigs();
  };

  const handleEdit = (config: AgentConfig) => {
    setEditingConfig(config);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;

    try {
      await agentConfigApi.delete(id);
      loadConfigs();
    } catch (error) {
      console.error('Failed to delete config:', error);
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agent Configurations</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your AI voice agent configurations
          </p>
        </div>
        <button
          onClick={() => {
            setEditingConfig(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create New Config
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <AgentConfigForm
            config={editingConfig}
            onSaved={handleConfigSaved}
            onCancel={() => {
              setShowForm(false);
              setEditingConfig(null);
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {configs.map((config) => (
          <div key={config.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    {config.name}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      config.scenario_type === 'check_in'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {config.scenario_type}
                  </span>
                  {config.is_active && (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">{config.description}</p>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    System Prompt
                  </h4>
                  <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {config.system_prompt}
                  </div>
                </div>
              </div>
              <div className="ml-4 flex space-x-2">
                <button
                  onClick={() => handleEdit(config)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(config.id)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
