import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Clock, Calendar, User, Package, Phone as PhoneIcon, AlertCircle } from 'lucide-react';
import CallStatusIndicator from '../CallTrigger/CallStatusIndicator';
import StructuredDataDisplay from './StructuredDataDisplay';
import TranscriptDisplay from './TranscriptDisplay';
import api from '../../services/api';
import type { Call } from '../../types';

interface Props {
  call: Call;
  onUpdate?: () => void;
}

export default function CallResultsView({ call, onUpdate }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSyncFromRetell = async () => {
    setSyncing(true);
    setSyncError(null);

    try {
      const result = await api.post(`/calls/${call.id}/sync-from-retell`);
      console.log('Synced from Retell:', result);

      if (onUpdate) {
        onUpdate();
      }
    } catch (err: any) {
      console.error('Failed to sync from Retell:', err);
      setSyncError(err.response?.data?.detail || 'Failed to sync from Retell');
    } finally {
      setSyncing(false);
    }
  };

  const callEnded = call.status === 'completed' || call.status === 'failed';
  const hasTranscript = call.transcript && call.transcript.length > 0;

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Call Metadata */}
      <div className="border-b border-dark-border pb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <User className="w-6 h-6 text-accent-primary" />
              {call.driver_name}
            </h3>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-400 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Load Number: {call.load_number}
              </p>
              {call.phone_number && (
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4" />
                  Phone: {call.phone_number}
                </p>
              )}
            </div>
          </div>
          <CallStatusIndicator status={call.status} size="md" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-3">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Created
            </p>
            <p className="text-sm font-medium text-white">
              {new Date(call.created_at).toLocaleString()}
            </p>
          </div>
          {call.started_at && (
            <div className="glass-card p-3">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Started
              </p>
              <p className="text-sm font-medium text-white">
                {new Date(call.started_at).toLocaleString()}
              </p>
            </div>
          )}
          {call.ended_at && (
            <div className="glass-card p-3">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Ended
              </p>
              <p className="text-sm font-medium text-white">
                {new Date(call.ended_at).toLocaleString()}
              </p>
            </div>
          )}
          {call.call_duration && (
            <div className="glass-card p-3">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Duration
              </p>
              <p className="text-sm font-medium text-white">
                {Math.floor(call.call_duration / 60)}m {call.call_duration % 60}s
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sync from Retell Button */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">
              Sync Call Details from Retell AI
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Fetch latest status, transcript, and call details from Retell AI
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSyncFromRetell}
            disabled={syncing}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync from Retell'}
          </motion.button>
        </div>
        {syncError && (
          <div className="mt-3 glass-card border-accent-danger/50 p-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-accent-danger flex-shrink-0" />
            <span className="text-sm text-accent-danger">{syncError}</span>
          </div>
        )}
      </div>

      {/* Two-Column Layout: Structured Data & Transcript */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Structured Data (40%) */}
        <div className="lg:col-span-2">
          {call.structured_data ? (
            <StructuredDataDisplay data={call.structured_data} />
          ) : hasTranscript ? (
            <div className="glass-card border-accent-warning/50 p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-accent-warning flex-shrink-0" />
              <span className="text-accent-warning text-sm">
                Structured data is being processed. Please refresh in a moment.
              </span>
            </div>
          ) : !callEnded ? (
            <div className="glass-card border-gray-600/50 p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-400 text-sm">
                Call has not ended yet. No structured data available.
              </span>
            </div>
          ) : null}
        </div>

        {/* Right Column: Transcript (60%) */}
        <div className="lg:col-span-3">
          {hasTranscript ? (
            <TranscriptDisplay transcript={call.transcript} />
          ) : !callEnded ? (
            <div className="glass-card border-gray-600/50 p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-400 text-sm">
                Call has not ended yet. No transcript available.
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
