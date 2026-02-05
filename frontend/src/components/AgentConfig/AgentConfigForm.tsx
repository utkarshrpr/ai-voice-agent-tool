import { useState, useEffect } from 'react';
import api from '../../services/api';
import type { AgentConfig, AgentConfigCreate, ConversationConfig } from '../../types';

interface Props {
  agent: AgentConfig | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const DEFAULT_CONVERSATION_CONFIG: ConversationConfig = {
  enable_backchannel: true,
  backchannel_frequency: 0.5,
  enable_filler_words: true,
  interruption_sensitivity: 0.5,
  responsiveness: 0.8,
  voice_id: '11labs-Adrian',
};

export default function AgentConfigForm({ agent, onSuccess, onCancel }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scenarioType, setScenarioType] = useState<'check_in' | 'emergency'>('check_in');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [conversationConfig, setConversationConfig] = useState<ConversationConfig>(
    DEFAULT_CONVERSATION_CONFIG
  );
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setDescription(agent.description || '');
      setScenarioType(agent.scenario_type);
      setSystemPrompt(agent.system_prompt);
      setConversationConfig(agent.conversation_config);
      setIsActive(agent.is_active);
    } else {
      resetForm();
    }
  }, [agent]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setScenarioType('check_in');
    setSystemPrompt('');
    setConversationConfig(DEFAULT_CONVERSATION_CONFIG);
    setIsActive(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data: AgentConfigCreate = {
        name,
        description: description || undefined,
        scenario_type: scenarioType,
        system_prompt: systemPrompt,
        conversation_config: conversationConfig,
        is_active: isActive,
      };

      if (agent) {
        await api.updateAgentConfig(agent.id, data);
      } else {
        await api.createAgentConfig(data);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to save agent configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">
        {agent ? 'Edit Agent' : 'Create New Agent'}
      </h3>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agent Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Driver Check-in Agent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief description of the agent's purpose"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scenario Type *
          </label>
          <select
            value={scenarioType}
            onChange={(e) => setScenarioType(e.target.value as 'check_in' | 'emergency')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="check_in">Check-in (Routine)</option>
            <option value="emergency">Emergency Response</option>
          </select>
        </div>

        {/* System Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            System Prompt *
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            required
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="Enter the system prompt that defines the agent's behavior..."
          />
          <p className="mt-1 text-sm text-gray-500">
            This prompt guides the agent's conversation flow and behavior.
          </p>
        </div>

        {/* Conversation Settings */}
        <div className="border-t pt-6">
          <h4 className="text-md font-semibold mb-4">Conversation Settings</h4>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Enable Backchannel
              </label>
              <input
                type="checkbox"
                checked={conversationConfig.enable_backchannel}
                onChange={(e) =>
                  setConversationConfig({
                    ...conversationConfig,
                    enable_backchannel: e.target.checked,
                  })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backchannel Frequency: {conversationConfig.backchannel_frequency.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={conversationConfig.backchannel_frequency}
                onChange={(e) =>
                  setConversationConfig({
                    ...conversationConfig,
                    backchannel_frequency: parseFloat(e.target.value),
                  })
                }
                className="w-full"
                disabled={!conversationConfig.enable_backchannel}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Enable Filler Words
              </label>
              <input
                type="checkbox"
                checked={conversationConfig.enable_filler_words}
                onChange={(e) =>
                  setConversationConfig({
                    ...conversationConfig,
                    enable_filler_words: e.target.checked,
                  })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interruption Sensitivity: {conversationConfig.interruption_sensitivity.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={conversationConfig.interruption_sensitivity}
                onChange={(e) =>
                  setConversationConfig({
                    ...conversationConfig,
                    interruption_sensitivity: parseFloat(e.target.value),
                  })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsiveness: {conversationConfig.responsiveness.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={conversationConfig.responsiveness}
                onChange={(e) =>
                  setConversationConfig({
                    ...conversationConfig,
                    responsiveness: parseFloat(e.target.value),
                  })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voice ID
              </label>
              <input
                type="text"
                value={conversationConfig.voice_id}
                onChange={(e) =>
                  setConversationConfig({
                    ...conversationConfig,
                    voice_id: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Active
              </label>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {loading ? 'Saving...' : agent ? 'Update Agent' : 'Create Agent'}
          </button>
        </div>
      </form>
    </div>
  );
}
