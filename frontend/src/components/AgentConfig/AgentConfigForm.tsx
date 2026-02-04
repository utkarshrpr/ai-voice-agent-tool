import { useState, useEffect } from 'react';
import { agentConfigApi } from '../../services/api';
import type { AgentConfig, AgentConfigCreate, ScenarioType } from '../../types';
import PromptEditor from './PromptEditor';

interface Props {
  config?: AgentConfig | null;
  onSaved: () => void;
  onCancel: () => void;
}

const defaultConversationConfig = {
  voice_id: 'default',
  enable_backchannel: true,
  backchannel_frequency: 0.8,
  enable_filler_words: true,
  filler_words: ['um', 'uh', 'you know'],
  interruption_sensitivity: 0.5,
  responsiveness: 0.7,
  ambient_sound: 'office',
};

export default function AgentConfigForm({ config, onSaved, onCancel }: Props) {
  const [formData, setFormData] = useState<AgentConfigCreate>({
    name: '',
    description: '',
    system_prompt: '',
    conversation_config: defaultConversationConfig,
    scenario_type: 'check_in' as ScenarioType,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (config) {
      setFormData({
        name: config.name,
        description: config.description,
        system_prompt: config.system_prompt,
        conversation_config: config.conversation_config,
        scenario_type: config.scenario_type,
        is_active: config.is_active,
      });
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (config) {
        await agentConfigApi.update(config.id, formData);
      } else {
        await agentConfigApi.create(formData);
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">
        {config ? 'Edit Configuration' : 'Create New Configuration'}
      </h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Scenario Type
          </label>
          <select
            value={formData.scenario_type}
            onChange={(e) =>
              setFormData({ ...formData, scenario_type: e.target.value as ScenarioType })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="check_in">Check-in</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          System Prompt
        </label>
        <PromptEditor
          value={formData.system_prompt}
          onChange={(value) => setFormData({ ...formData, system_prompt: value })}
        />
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) =>
              setFormData({ ...formData, is_active: e.target.checked })
            }
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Active</span>
        </label>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </form>
  );
}
