import { useState, useRef, useEffect } from 'react';
import { RetellWebClient } from 'retell-client-js-sdk';
import api from '../../services/api';
import type { AgentConfig, CallCreate } from '../../types';

interface Props {
  agents: AgentConfig[];
  onCallComplete: () => void;
}

type CallState = 'idle' | 'connecting' | 'connected' | 'ended';

export default function CallTriggerForm({ agents, onCallComplete }: Props) {
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loadNumber, setLoadNumber] = useState('');
  const [callState, setCallState] = useState<CallState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const retellClientRef = useRef<RetellWebClient | null>(null);
  const durationIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (retellClientRef.current) {
        retellClientRef.current.stopCall();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  const startDurationTimer = () => {
    setCallDuration(0);
    durationIntervalRef.current = window.setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopDurationTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedAgentId || !driverName || !loadNumber) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setCallState('connecting');

      // Create call in backend
      const callData: CallCreate = {
        agent_config_id: selectedAgentId,
        driver_name: driverName,
        phone_number: phoneNumber || undefined,
        load_number: loadNumber,
      };

      const webCallResponse = await api.createWebCall(callData);
      setCurrentCallId(webCallResponse.call_id);

      // Initialize Retell Web Client
      const retellClient = new RetellWebClient();
      retellClientRef.current = retellClient;

      // Set up event listeners
      retellClient.on('call_started', () => {
        console.log('Call started');
        setCallState('connected');
        startDurationTimer();
      });

      retellClient.on('call_ended', () => {
        console.log('Call ended');
        setCallState('ended');
        stopDurationTimer();
        setTimeout(() => {
          setCallState('idle');
          onCallComplete();
          resetForm();
        }, 3000);
      });

      retellClient.on('error', (error) => {
        console.error('Retell error:', error);
        setError(`Call error: ${error.message || 'Unknown error'}`);
        setCallState('idle');
        stopDurationTimer();
      });

      retellClient.on('update', (update) => {
        console.log('Call update:', update);
      });

      // Start the web call
      await retellClient.startCall({
        accessToken: webCallResponse.access_token,
        sampleRate: webCallResponse.sample_rate,
        emitRawAudioSamples: false,
      });

    } catch (err: any) {
      console.error('Error starting call:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to start call');
      setCallState('idle');
      stopDurationTimer();
    }
  };

  const handleEndCall = () => {
    if (retellClientRef.current) {
      retellClientRef.current.stopCall();
      stopDurationTimer();
    }
  };

  const handleToggleMute = () => {
    if (retellClientRef.current) {
      if (isMuted) {
        retellClientRef.current.unmute();
      } else {
        retellClientRef.current.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  const resetForm = () => {
    setDriverName('');
    setPhoneNumber('');
    setLoadNumber('');
    setCurrentCallId(null);
    setCallDuration(0);
    setIsMuted(false);
    setError(null);
  };

  const isCallActive = callState === 'connecting' || callState === 'connected';

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Start Web Call</h3>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Call Status Display */}
      {isCallActive && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                {callState === 'connecting' ? 'Connecting...' : 'Call Active'}
              </p>
              <p className="text-lg font-bold text-blue-900 mt-1">
                {formatDuration(callDuration)}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center">
              <span className="flex h-10 w-10">
                <span className="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-10 w-10 bg-blue-500"></span>
              </span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleStartCall} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Agent *
          </label>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            disabled={isCallActive}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">Choose an agent...</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.scenario_type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Driver Name *
          </label>
          <input
            type="text"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            disabled={isCallActive}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="e.g., Mike Johnson"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Load Number *
          </label>
          <input
            type="text"
            value={loadNumber}
            onChange={(e) => setLoadNumber(e.target.value)}
            disabled={isCallActive}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="e.g., 7891-B"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number (Optional - for context only)
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isCallActive}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="e.g., (555) 123-4567"
          />
          <p className="mt-1 text-xs text-gray-500">
            This is for record-keeping only. The call will be made in your browser.
          </p>
        </div>

        {!isCallActive ? (
          <button
            type="submit"
            disabled={callState === 'ended'}
            className="w-full px-4 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-300"
          >
            {callState === 'ended' ? 'Call Ended' : 'Start Web Call'}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleToggleMute}
                className={`px-4 py-3 font-medium rounded-md focus:outline-none focus:ring-2 ${
                  isMuted
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500'
                    : 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
                }`}
              >
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button
                type="button"
                onClick={handleEndCall}
                className="px-4 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                End Call
              </button>
            </div>
          </div>
        )}
      </form>

      <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
        <p className="font-medium mb-1">Web Call Instructions:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Make sure your microphone is connected</li>
          <li>Allow microphone permissions when prompted</li>
          <li>The call will be made directly in your browser</li>
          <li>You'll hear the AI agent and can speak naturally</li>
        </ul>
      </div>
    </div>
  );
}
