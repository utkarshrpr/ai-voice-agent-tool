import { MessageSquare, AlertTriangle } from 'lucide-react';
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

  const containsEmergencyKeyword = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    return emergencyKeywords.some((keyword) => lowerText.includes(keyword));
  };

  return (
    <div>
      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-accent-primary" />
        Call Transcript
      </h4>

      <div className="glass-card p-4 max-h-96 overflow-y-auto custom-scrollbar">
        {transcript.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No transcript available</p>
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
                        ? 'bg-accent-primary/20 border border-accent-primary/40 text-white'
                        : hasEmergency
                        ? 'bg-accent-danger/20 border-2 border-accent-danger/60 text-white'
                        : 'glass-card text-white'
                    }`}
                  >
                    <div className="flex items-center mb-1 gap-2">
                      <p className="text-xs font-semibold">
                        {isAgent ? 'Agent' : 'Driver'}
                      </p>
                      {entry.timestamp && (
                        <p className="text-xs opacity-60">
                          {entry.timestamp.toFixed(1)}s
                        </p>
                      )}
                      {hasEmergency && (
                        <span className="flex items-center gap-1 text-xs font-bold text-accent-danger">
                          <AlertTriangle className="w-3 h-3" />
                          EMERGENCY
                        </span>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {transcript.length > 0 && (
        <div className="mt-3 glass-card p-3 text-xs text-gray-400 flex items-center justify-between">
          <span>Total turns: {transcript.length}</span>
          <span>
            Agent: {transcript.filter((e) => e.role === 'agent').length} | Driver:{' '}
            {transcript.filter((e) => e.role === 'user').length}
          </span>
        </div>
      )}

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
