import { useState, useEffect } from 'react';
import { callApi } from '../services/api';
import type { Call } from '../types';
import CallResultsView from '../components/CallResults/CallResultsView';

export default function CallHistory() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      const data = await callApi.list(100);
      setCalls(data);
    } catch (error) {
      console.error('Failed to load calls:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Call History</h2>
        <p className="mt-1 text-sm text-gray-500">
          View and analyze past call records
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 bg-white shadow rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">All Calls</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {calls.map((call) => (
              <button
                key={call.id}
                onClick={() => setSelectedCall(call)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                  selectedCall?.id === call.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {call.driver_name}
                    </p>
                    <p className="text-xs text-gray-500">Load: {call.load_number}</p>
                  </div>
                  <span
                    className={`ml-2 px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${
                      call.call_status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : call.call_status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {call.call_status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(call.created_at).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedCall ? (
            <CallResultsView call={selectedCall} />
          ) : (
            <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              Select a call to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
