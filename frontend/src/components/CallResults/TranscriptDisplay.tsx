import type { TranscriptEntry } from '../../types';

interface Props {
  transcript: TranscriptEntry[];
}

export default function TranscriptDisplay({ transcript }: Props) {
  const emergencyKeywords = [
    'accident',
    'crash',
    'emergency',
    'hurt',
    'injured',
    'breakdown',
    'medical',
  ];

  const highlightEmergencyKeywords = (text: string): string[] => {
    const words = text.split(' ');
    return words;
  };

  const containsEmergencyKeyword = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    return emergencyKeywords.some((keyword) => lowerText.includes(keyword));
  };

  return (
    <div>
      <h4 className="text-lg font-semibold mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
            clipRule="evenodd"
          />
        </svg>
        Call Transcript
      </h4>

      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
        {transcript.length === 0 ? (
          <p className="text-gray-500 text-sm">No transcript available</p>
        ) : (
          <div className="space-y-3">
            {transcript.map((entry, index) => {
              const isAgent = entry.role === 'agent';
              const hasEmergency = containsEmergencyKeyword(entry.content);

              return (
                <div
                  key={index}
                  className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      isAgent
                        ? 'bg-blue-100 text-blue-900'
                        : hasEmergency
                        ? 'bg-red-100 text-red-900 border-2 border-red-400'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      <p className="text-xs font-semibold">
                        {isAgent ? 'Agent' : 'Driver'}
                      </p>
                      {entry.timestamp && (
                        <p className="text-xs ml-2 opacity-70">
                          {entry.timestamp.toFixed(1)}s
                        </p>
                      )}
                      {hasEmergency && (
                        <span className="ml-2 text-xs font-bold text-red-700">
                          ⚠️ EMERGENCY
                        </span>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{entry.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {transcript.length > 0 && (
        <div className="mt-3 text-xs text-gray-500">
          <p>Total turns: {transcript.length}</p>
          <p>
            Agent turns: {transcript.filter((e) => e.role === 'agent').length} | Driver
            turns: {transcript.filter((e) => e.role === 'user').length}
          </p>
        </div>
      )}
    </div>
  );
}
