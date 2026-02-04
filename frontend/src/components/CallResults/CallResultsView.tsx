import type { Call } from '../../types';
import StructuredDataDisplay from './StructuredDataDisplay';
import TranscriptDisplay from './TranscriptDisplay';

interface Props {
  call: Call;
}

export default function CallResultsView({ call }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Call Details</h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Driver Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{call.driver_name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Load Number</dt>
            <dd className="mt-1 text-sm text-gray-900">{call.load_number}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
            <dd className="mt-1 text-sm text-gray-900">{call.driver_phone}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1">
              <span
                className={`inline-flex px-2 py-1 text-xs rounded-full ${
                  call.call_status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : call.call_status === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {call.call_status}
              </span>
            </dd>
          </div>
          {call.duration_seconds && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Duration</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {call.duration_seconds} seconds
              </dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-500">Created At</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(call.created_at).toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>

      {call.structured_data && (
        <StructuredDataDisplay data={call.structured_data} />
      )}

      {call.raw_transcript && call.raw_transcript.length > 0 && (
        <TranscriptDisplay transcript={call.raw_transcript} />
      )}
    </div>
  );
}
