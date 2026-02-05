import { useState, useEffect } from 'react';
import CallResultsView from '../components/CallResults/CallResultsView';
import CallStatusIndicator from '../components/CallTrigger/CallStatusIndicator';
import api from '../services/api';
import type { Call } from '../types';

export default function CallHistory() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listCalls(undefined, 100);
      setCalls(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load call history');
    } finally {
      setLoading(false);
    }
  };

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

  const handleRefresh = () => {
    loadCalls();
    if (selectedCall) {
      // Refresh selected call
      api.getCall(selectedCall.id).then(setSelectedCall).catch(console.error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading call history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Call History</h2>
          <p className="mt-1 text-sm text-gray-600">
            View and analyze past call recordings and results
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call List */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Calls ({calls.length})</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {calls.length === 0 ? (
                <p className="text-gray-500 text-sm">No calls yet.</p>
              ) : (
                calls.map((call) => (
                  <div
                    key={call.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCall?.id === call.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedCall(call)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{call.driver_name}</h4>
                        <p className="text-sm text-gray-500">Load: {call.load_number}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(call.id);
                        }}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <CallStatusIndicator status={call.status} />
                      <p className="text-xs text-gray-400">
                        {new Date(call.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {call.call_duration && (
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.floor(call.call_duration / 60)}m {call.call_duration % 60}s
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Call Details */}
        <div className="lg:col-span-2">
          {selectedCall ? (
            <CallResultsView call={selectedCall} />
          ) : (
            <div className="bg-white shadow rounded-lg p-6 flex items-center justify-center h-96">
              <div className="text-center text-gray-500">
                <p className="mb-2">Select a call to view details</p>
                <p className="text-sm">Structured data and transcripts will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
