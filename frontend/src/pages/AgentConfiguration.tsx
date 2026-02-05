import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings, Trash2, AlertCircle, Bot } from 'lucide-react';
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
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400">Loading agent configurations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Agent Configuration
          </h2>
          <p className="mt-2 text-gray-400">
            Configure AI agents for different call scenarios
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCreateNew}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create New Agent
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card border-accent-danger/50 p-4 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-accent-danger flex-shrink-0" />
            <span className="text-accent-danger">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-1"
        >
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-accent-primary" />
              Agents ({agents.length})
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {agents.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No agents configured yet</p>
                </div>
              ) : (
                agents.map((agent, index) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                      selectedAgent?.id === agent.id
                        ? 'border-accent-primary bg-accent-primary/10 shadow-glow-sm'
                        : 'border-dark-border hover:border-accent-primary/50 glass-card-hover'
                    }`}
                    onClick={() => handleEdit(agent)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-1">{agent.name}</h4>
                        <p className="text-sm text-gray-400 capitalize">
                          {agent.scenario_type.replace('_', ' ')}
                        </p>
                        {!agent.is_active && (
                          <span className="inline-block mt-2 status-badge bg-gray-600/20 text-gray-400 border-gray-600/40">
                            Inactive
                          </span>
                        )}
                        {agent.is_active && (
                          <span className="inline-block mt-2 status-badge bg-accent-success/20 text-accent-success border-accent-success/40">
                            Active
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(agent.id);
                        }}
                        className="ml-2 p-1 text-accent-danger hover:bg-accent-danger/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* Agent Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2"
        >
          {(isCreating || selectedAgent) ? (
            <AgentConfigForm
              agent={selectedAgent}
              onSuccess={handleSaveSuccess}
              onCancel={handleCancel}
            />
          ) : (
            <div className="glass-card p-8 flex items-center justify-center min-h-[600px]">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-10 h-10 text-accent-primary" />
                </div>
                <p className="text-lg font-medium text-white mb-2">Select an agent to edit</p>
                <p className="text-sm text-gray-400">Or create a new one using the button above</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
      `}</style>
    </div>
  );
}
