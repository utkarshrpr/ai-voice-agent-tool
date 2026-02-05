import CallStatusIndicator from '../CallTrigger/CallStatusIndicator';
import StructuredDataDisplay from './StructuredDataDisplay';
import TranscriptDisplay from './TranscriptDisplay';
import type { Call } from '../../types';

interface Props {
  call: Call;
}

export default function CallResultsView({ call }: Props) {
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

      {/* Structured Data */}
      {call.structured_data ? (
        <StructuredDataDisplay data={call.structured_data} />
      ) : call.status === 'completed' ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          Structured data is being processed. Please refresh in a moment.
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded">
          No structured data available yet.
        </div>
      )}

      {/* Transcript */}
      {call.transcript && call.transcript.length > 0 ? (
        <TranscriptDisplay transcript={call.transcript} />
      ) : call.status === 'completed' ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          Transcript is being processed.
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded">
          No transcript available yet.
        </div>
      )}
    </div>
  );
}
