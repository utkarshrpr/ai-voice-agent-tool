import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Phone, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import CallTriggerForm from '../components/CallTrigger/CallTriggerForm';
import CallStatusIndicator from '../components/CallTrigger/CallStatusIndicator';
import api from '../services/api';
import type { AgentConfig, Call } from '../types';

export default function Dashboard() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [agentsData, callsData] = await Promise.all([
        api.listAgentConfigs(true), // Only active agents
        api.listCalls(undefined, 10), // Last 10 calls
      ]);
      setAgents(agentsData);
      setRecentCalls(callsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCallComplete = () => {
    loadData(); // Refresh recent calls
  };

  const statsCards = [
    {
      label: 'Active Agents',
      value: agents.length,
      icon: Activity,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Total Calls',
      value: recentCalls.length,
      icon: Phone,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Completed',
      value: recentCalls.filter((c) => c.status === 'completed').length,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Dashboard
        </h2>
        <p className="mt-2 text-gray-400">
          Trigger web calls and monitor recent activity
        </p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card border-accent-danger/50 p-4 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-accent-danger flex-shrink-0" />
          <span className="text-accent-danger">{error}</span>
        </motion.div>
      )}

      {agents.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card border-accent-warning/50 p-4 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-accent-warning flex-shrink-0" />
          <span className="text-accent-warning">
            No active agents configured. Please create an agent in the Agent Configuration page first.
          </span>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass-card-hover p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">{stat.label}</p>
                  <p className="mt-2 text-4xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-glow-sm`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Trigger Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <CallTriggerForm
            agents={agents}
            onCallComplete={handleCallComplete}
          />
        </motion.div>

        {/* Recent Calls */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent-primary" />
              Recent Calls
            </h3>
            {recentCalls.length > 5 && (
              <a
                href="/history"
                className="text-sm text-accent-primary hover:text-accent-secondary transition-colors"
              >
                View all →
              </a>
            )}
          </div>

          {recentCalls.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No calls yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCalls.slice(0, 5).map((call, index) => (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="glass-card-hover p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-white">{call.driver_name}</p>
                      <p className="text-sm text-gray-400">Load: {call.load_number}</p>
                    </div>
                    <CallStatusIndicator status={call.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {new Date(call.created_at).toLocaleString()}
                    </span>
                    {call.call_duration && (
                      <span className="text-gray-400">
                        {Math.floor(call.call_duration / 60)}m {call.call_duration % 60}s
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
