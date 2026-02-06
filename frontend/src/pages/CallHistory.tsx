import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Trash2, Clock, Phone, AlertCircle, Filter, X } from 'lucide-react';
import CallResultsView from '../components/CallResults/CallResultsView';
import CallStatusIndicator from '../components/CallTrigger/CallStatusIndicator';
import api from '../services/api';
import type { Call } from '../types';

export default function CallHistory() {
  const location = useLocation();
  const [calls, setCalls] = useState<Call[]>([]);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [driverNameFilter, setDriverNameFilter] = useState<string>('');
  const [driverNameInput, setDriverNameInput] = useState<string>('');
  const [createdAfter, setCreatedAfter] = useState<string>('');
  const [createdBefore, setCreatedBefore] = useState<string>('');

  useEffect(() => {
    loadCalls();
  }, []);

  // Reload calls when filters change
  useEffect(() => {
    loadCalls();
  }, [statusFilter, driverNameFilter, createdAfter, createdBefore]);

  // Auto-select call if navigated from Dashboard
  useEffect(() => {
    const state = location.state as { selectedCallId?: string } | null;
    if (state?.selectedCallId && calls.length > 0) {
      const callToSelect = calls.find(c => c.id === state.selectedCallId);
      if (callToSelect) {
        setSelectedCall(callToSelect);
        // Clear the state after using it
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, calls]);

  const loadCalls = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listCalls(
        undefined,
        100,
        statusFilter || undefined,
        driverNameFilter || undefined,
        createdAfter || undefined,
        createdBefore || undefined
      );
      setCalls(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load call history');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setStatusFilter('');
    setDriverNameFilter('');
    setDriverNameInput('');
    setCreatedAfter('');
    setCreatedBefore('');
  };

  const handleDriverNameSearch = () => {
    setDriverNameFilter(driverNameInput);
  };

  const hasActiveFilters = statusFilter || driverNameFilter || createdAfter || createdBefore;

  const handleDelete = async (callId: string) => {
    if (!confirm('Are you sure you want to delete this call record?')) {
      return;
    }

    try {
      await api.deleteCall(callId);
      await loadCalls();
      if (selectedCall?.id === callId) {
        setSelectedCall(null);
      }
    } catch (err: any) {
      alert(`Failed to delete call: ${err.message}`);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCalls();
    if (selectedCall) {
      api.getCall(selectedCall.id).then(setSelectedCall).catch(console.error);
    }
    setRefreshing(false);
  };

  const handleCallUpdate = async () => {
    if (selectedCall) {
      try {
        const updatedCall = await api.getCall(selectedCall.id);
        setSelectedCall(updatedCall);
        loadCalls();
      } catch (err) {
        console.error('Failed to refresh call:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400">Loading call history...</span>
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
            Call History
          </h2>
          <p className="mt-2 text-gray-400">
            View and analyze past call recordings and results
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
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

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-accent-primary hover:text-accent-secondary transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters</span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 bg-accent-primary/20 text-accent-primary text-xs rounded-full">
                Active
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-field text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Driver Name Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Driver Name
                </label>
                <input
                  type="text"
                  value={driverNameInput}
                  onChange={(e) => setDriverNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleDriverNameSearch();
                    }
                  }}
                  placeholder="Search by name (press Enter)..."
                  className="input-field text-white placeholder-gray-500"
                />
              </div>

              {/* Created After Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Created After
                </label>
                <input
                  type="date"
                  value={createdAfter}
                  onChange={(e) => setCreatedAfter(e.target.value)}
                  className="input-field text-white"
                />
              </div>

              {/* Created Before Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Created Before
                </label>
                <input
                  type="date"
                  value={createdBefore}
                  onChange={(e) => setCreatedBefore(e.target.value)}
                  className="input-field text-white"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-1"
        >
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-accent-primary" />
              Calls ({calls.length})
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {calls.length === 0 ? (
                <div className="text-center py-12">
                  <Phone className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No calls yet</p>
                </div>
              ) : (
                calls.map((call, index) => (
                  <motion.div
                    key={call.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    whileHover={{ x: 4 }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                      selectedCall?.id === call.id
                        ? 'border-accent-primary bg-accent-primary/10 shadow-glow-sm'
                        : 'border-dark-border hover:border-accent-primary/50 glass-card-hover'
                    }`}
                    onClick={() => setSelectedCall(call)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{call.driver_name}</h4>
                        <p className="text-sm text-gray-400">Load: {call.load_number}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(call.id);
                        }}
                        className="ml-2 p-1 text-accent-danger hover:bg-accent-danger/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <CallStatusIndicator status={call.status} />
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(call.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {call.call_duration && (
                      <p className="text-xs text-gray-500 mt-2">
                        Duration: {Math.floor(call.call_duration / 60)}m {call.call_duration % 60}s
                      </p>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* Call Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2"
        >
          {selectedCall ? (
            <CallResultsView call={selectedCall} onUpdate={handleCallUpdate} />
          ) : (
            <div className="glass-card p-8 flex items-center justify-center min-h-[600px]">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-10 h-10 text-accent-primary" />
                </div>
                <p className="text-lg font-medium text-white mb-2">Select a call to view details</p>
                <p className="text-sm text-gray-400">Structured data and transcripts will appear here</p>
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
