import { useEffect, useState } from 'react';
import { callApi } from '../../services/api';
import type { Call } from '../../types';

interface Props {
  call: Call;
  onComplete: () => void;
}

export default function CallStatusIndicator({ call, onComplete }: Props) {
  const [currentCall, setCurrentCall] = useState<Call>(call);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(async () => {
      try {
        const updatedCall = await callApi.get(call.id);
        setCurrentCall(updatedCall);

        if (updatedCall.call_status === 'completed' || updatedCall.call_status === 'failed') {
          setPolling(false);
          setTimeout(() => {
            onComplete();
          }, 2000);
        }
      } catch (error) {
        console.error('Failed to poll call status:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [call.id, polling, onComplete]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'in_progress':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Call Completed';
      case 'failed':
        return 'Call Failed';
      case 'in_progress':
        return 'Call In Progress';
      default:
        return 'Call Initiated';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center space-x-4">
        <div className={`w-3 h-3 rounded-full ${getStatusColor(currentCall.call_status)} ${
          currentCall.call_status === 'in_progress' ? 'animate-pulse' : ''
        }`} />
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">
            {getStatusText(currentCall.call_status)}
          </h3>
          <p className="text-sm text-gray-500">
            Driver: {currentCall.driver_name} | Load: {currentCall.load_number}
          </p>
        </div>
        {currentCall.duration_seconds && (
          <div className="text-sm text-gray-500">
            Duration: {currentCall.duration_seconds}s
          </div>
        )}
      </div>

      {currentCall.call_status === 'completed' && currentCall.structured_data && (
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Call Summary</h4>
          <div className="bg-gray-50 rounded p-3">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(currentCall.structured_data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
