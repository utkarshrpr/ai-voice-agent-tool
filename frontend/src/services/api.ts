import axios from 'axios';
import type { AgentConfig, AgentConfigCreate, Call, CallCreate } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Agent Config API
export const agentConfigApi = {
  list: async (): Promise<AgentConfig[]> => {
    const response = await api.get('/api/agent-configs');
    return response.data;
  },

  get: async (id: string): Promise<AgentConfig> => {
    const response = await api.get(`/api/agent-configs/${id}`);
    return response.data;
  },

  create: async (config: AgentConfigCreate): Promise<AgentConfig> => {
    const response = await api.post('/api/agent-configs', config);
    return response.data;
  },

  update: async (id: string, config: Partial<AgentConfigCreate>): Promise<AgentConfig> => {
    const response = await api.put(`/api/agent-configs/${id}`, config);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/agent-configs/${id}`);
  },
};

// Call API
export const callApi = {
  list: async (limit = 50, offset = 0): Promise<Call[]> => {
    const response = await api.get('/api/calls', { params: { limit, offset } });
    return response.data;
  },

  get: async (id: string): Promise<Call> => {
    const response = await api.get(`/api/calls/${id}`);
    return response.data;
  },

  create: async (callData: CallCreate): Promise<Call> => {
    const response = await api.post('/api/calls', callData);
    return response.data;
  },
};

export default api;
