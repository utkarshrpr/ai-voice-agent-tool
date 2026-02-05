import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X, AlertCircle, Sliders } from 'lucide-react';
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
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-white mb-6">
        {agent ? 'Edit Agent' : 'Create New Agent'}
      </h3>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 glass-card border-accent-danger/50 p-3 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-accent-danger flex-shrink-0" />
          <span className="text-accent-danger text-sm">{error}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Agent Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input-field"
            placeholder="e.g., Driver Check-in Agent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field"
            placeholder="Brief description of the agent's purpose"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Scenario Type *
          </label>
          <select
            value={scenarioType}
            onChange={(e) => setScenarioType(e.target.value as 'check_in' | 'emergency')}
            className="input-field"
          >
            <option value="check_in">Check-in (Routine)</option>
            <option value="emergency">Emergency Response</option>
          </select>
        </div>

        {/* System Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            System Prompt *
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            required
            rows={12}
            className="input-field font-mono text-sm"
            placeholder="Enter the system prompt that defines the agent's behavior..."
          />
          <p className="mt-2 text-xs text-gray-500">
            This prompt guides the agent's conversation flow and behavior.
          </p>
        </div>

        {/* Conversation Settings */}
        <div className="border-t border-dark-border pt-6">
          <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent-primary" />
            Conversation Settings
          </h4>

          <div className="space-y-5">
            <div className="flex items-center justify-between glass-card p-3">
              <label className="text-sm font-medium text-gray-300">
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
                className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-dark-border rounded"
              />
            </div>

            <div className="glass-card p-4">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Backchannel Frequency: <span className="text-accent-primary">{conversationConfig.backchannel_frequency.toFixed(1)}</span>
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
                className="w-full accent-accent-primary"
                disabled={!conversationConfig.enable_backchannel}
              />
            </div>

            <div className="flex items-center justify-between glass-card p-3">
              <label className="text-sm font-medium text-gray-300">
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
                className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-dark-border rounded"
              />
            </div>

            <div className="glass-card p-4">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Interruption Sensitivity: <span className="text-accent-primary">{conversationConfig.interruption_sensitivity.toFixed(1)}</span>
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
                className="w-full accent-accent-primary"
              />
            </div>

            <div className="glass-card p-4">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Responsiveness: <span className="text-accent-primary">{conversationConfig.responsiveness.toFixed(1)}</span>
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
                className="w-full accent-accent-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
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
                className="input-field"
              />
            </div>

            <div className="flex items-center justify-between glass-card p-3">
              <label className="text-sm font-medium text-gray-300">
                Active
              </label>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-dark-border rounded"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-dark-border">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : agent ? 'Update Agent' : 'Create Agent'}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
