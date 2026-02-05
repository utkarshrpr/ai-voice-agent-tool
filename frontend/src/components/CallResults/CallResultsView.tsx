import { useState } from 'react';
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
  const [fetching, setFetching] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleFetchTranscript = async () => {
    setFetching(true);
    setFetchError(null);

    try {
      const result = await api.post(`/calls/${call.id}/fetch-transcript`);
      console.log('Transcript fetched:', result);

      // Trigger parent to refresh call data
      if (onUpdate) {
        onUpdate();
      }
    } catch (err: any) {
      console.error('Failed to fetch transcript:', err);
      setFetchError(err.response?.data?.detail || 'Failed to fetch transcript');
    } finally {
      setFetching(false);
    }
  };

  const handleSyncFromRetell = async () => {
    setSyncing(true);
    setSyncError(null);

    try {
      const result = await api.post(`/calls/${call.id}/sync-from-retell`);
      console.log('Synced from Retell:', result);

      // Trigger parent to refresh call data
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
  const needsFetch = callEnded && !hasTranscript;
  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-6">
      {/* Call Metadata */}
      <div className="border-b pb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{call.driver_name}</h3>
            <p className="text-sm text-gray-500">Load Number: {call.load_number}</p>
            {call.phone_number && (
              <p className="text-sm text-gray-500">Phone: {call.phone_number}</p>
            )}
          </div>
          <CallStatusIndicator status={call.status} size="md" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Created</p>
            <p className="font-medium text-gray-900">
              {new Date(call.created_at).toLocaleString()}
            </p>
          </div>
          {call.started_at && (
            <div>
              <p className="text-gray-500">Started</p>
              <p className="font-medium text-gray-900">
                {new Date(call.started_at).toLocaleString()}
              </p>
            </div>
          )}
          {call.ended_at && (
            <div>
              <p className="text-gray-500">Ended</p>
              <p className="font-medium text-gray-900">
                {new Date(call.ended_at).toLocaleString()}
              </p>
            </div>
          )}
          {call.call_duration && (
            <div>
              <p className="text-gray-500">Duration</p>
              <p className="font-medium text-gray-900">
                {Math.floor(call.call_duration / 60)}m {call.call_duration % 60}s
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sync from Retell Button */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-900">
              Sync Call Details from Retell AI
            </p>
            <p className="text-xs text-green-700 mt-1">
              Fetch latest status, transcript, and call details from Retell AI
            </p>
          </div>
          <button
            onClick={handleSyncFromRetell}
            disabled={syncing}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-green-300"
          >
            {syncing ? 'Syncing...' : 'Sync from Retell'}
          </button>
        </div>
        {syncError && (
          <div className="mt-2 text-sm text-red-600">
            Error: {syncError}
          </div>
        )}
      </div>

      {/* Fetch Transcript Button (fallback) */}
      {needsFetch && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Transcript not yet fetched
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Click the button to fetch the transcript from Retell AI
              </p>
            </div>
            <button
              onClick={handleFetchTranscript}
              disabled={fetching}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {fetching ? 'Fetching...' : 'Fetch Transcript'}
            </button>
          </div>
          {fetchError && (
            <div className="mt-2 text-sm text-red-600">
              Error: {fetchError}
            </div>
          )}
        </div>
      )}

      {/* Structured Data */}
      {call.structured_data ? (
        <StructuredDataDisplay data={call.structured_data} />
      ) : hasTranscript ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          Structured data is being processed. Please refresh in a moment.
        </div>
      ) : !callEnded ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded">
          Call has not ended yet. No structured data available.
        </div>
      ) : null}

      {/* Transcript */}
      {hasTranscript ? (
        <TranscriptDisplay transcript={call.transcript} />
      ) : !callEnded ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded">
          Call has not ended yet. No transcript available.
        </div>
      ) : null}
    </div>
  );
}
