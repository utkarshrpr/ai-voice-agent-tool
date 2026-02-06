import axios, { AxiosInstance } from 'axios';
import type {
  AgentConfig,
  AgentConfigCreate,
  AgentConfigUpdate,
  Call,
  CallCreate,
  WebCallResponse,
} from '../types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Agent Configuration Endpoints
  async createAgentConfig(data: AgentConfigCreate): Promise<AgentConfig> {
    const response = await this.client.post<AgentConfig>('/agents/', data);
    return response.data;
  }

  async listAgentConfigs(activeOnly: boolean = false): Promise<AgentConfig[]> {
    const response = await this.client.get<AgentConfig[]>('/agents/', {
      params: { active_only: activeOnly },
    });
    return response.data;
  }

  async getAgentConfig(agentId: string): Promise<AgentConfig> {
    const response = await this.client.get<AgentConfig>(`/agents/${agentId}`);
    return response.data;
  }

  async updateAgentConfig(
    agentId: string,
    data: AgentConfigUpdate
  ): Promise<AgentConfig> {
    const response = await this.client.put<AgentConfig>(`/agents/${agentId}`, data);
    return response.data;
  }

  async deleteAgentConfig(agentId: string): Promise<void> {
    await this.client.delete(`/agents/${agentId}`);
  }

  // Call Endpoints
  async createWebCall(data: CallCreate): Promise<WebCallResponse> {
    const response = await this.client.post<WebCallResponse>('/calls/web-call', data);
    return response.data;
  }

  async listCalls(
    agentConfigId?: string,
    limit: number = 50,
    statusFilter?: string,
    driverName?: string,
    createdAfter?: string,
    createdBefore?: string
  ): Promise<Call[]> {
    const response = await this.client.get<Call[]>('/calls/', {
      params: {
        agent_config_id: agentConfigId,
        limit,
        status_filter: statusFilter,
        driver_name: driverName,
        created_after: createdAfter,
        created_before: createdBefore,
      },
    });
    return response.data;
  }

  async getCall(callId: string): Promise<Call> {
    const response = await this.client.get<Call>(`/calls/${callId}`);
    return response.data;
  }

  async deleteCall(callId: string): Promise<void> {
    await this.client.delete(`/calls/${callId}`);
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; services: Record<string, boolean> }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Generic methods for additional endpoints
  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await this.client.post(endpoint, data);
    return response.data;
  }

  async get<T = any>(endpoint: string, params?: any): Promise<T> {
    const response = await this.client.get(endpoint, { params });
    return response.data;
  }
}

export const api = new ApiService();
export default api;
