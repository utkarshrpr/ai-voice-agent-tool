import type { TranscriptMessage } from '../../types';

interface Props {
  transcript: TranscriptMessage[];
}

export default function TranscriptDisplay({ transcript }: Props) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Call Transcript</h3>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {transcript.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'assistant' ? 'justify-start' : 'justify-end'
            }`}
          >
            <div
              className={`max-w-3/4 rounded-lg px-4 py-2 ${
                message.role === 'assistant'
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-blue-600 text-white'
              }`}
            >
              <p className="text-xs font-medium mb-1">
                {message.role === 'assistant' ? 'Agent' : 'Driver'}
              </p>
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
