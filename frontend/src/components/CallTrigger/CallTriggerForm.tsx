import { useState } from 'react';
import { callApi } from '../../services/api';
import type { AgentConfig, Call } from '../../types';

interface Props {
  agentConfigs: AgentConfig[];
  onCallInitiated: (call: Call) => void;
}

export default function CallTriggerForm({ agentConfigs, onCallInitiated }: Props) {
  const [formData, setFormData] = useState({
    agent_config_id: '',
    driver_name: '',
    driver_phone: '',
    load_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const call = await callApi.create(formData);
      onCallInitiated(call);
      setFormData({
        agent_config_id: '',
        driver_name: '',
        driver_phone: '',
        load_number: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to initiate call');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Agent Configuration
        </label>
        <select
          value={formData.agent_config_id}
          onChange={(e) =>
            setFormData({ ...formData, agent_config_id: e.target.value })
          }
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">Select an agent...</option>
          {agentConfigs.map((config) => (
            <option key={config.id} value={config.id}>
              {config.name} ({config.scenario_type})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Driver Name
        </label>
        <input
          type="text"
          value={formData.driver_name}
          onChange={(e) =>
            setFormData({ ...formData, driver_name: e.target.value })
          }
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Driver Phone
        </label>
        <input
          type="tel"
          value={formData.driver_phone}
          onChange={(e) =>
            setFormData({ ...formData, driver_phone: e.target.value })
          }
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="+1234567890"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Load Number
        </label>
        <input
          type="text"
          value={formData.load_number}
          onChange={(e) =>
            setFormData({ ...formData, load_number: e.target.value })
          }
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="LD-12345"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
      >
        {loading ? 'Initiating Call...' : 'Start Test Call'}
      </button>
    </form>
  );
}
