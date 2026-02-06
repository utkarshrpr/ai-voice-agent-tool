import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, Loader2, AlertCircle, Radio } from 'lucide-react';
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
  const callIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
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

      const callData: CallCreate = {
        agent_config_id: selectedAgentId,
        driver_name: driverName,
        phone_number: phoneNumber || undefined,
        load_number: loadNumber,
      };

      const webCallResponse = await api.createWebCall(callData);
      setCurrentCallId(webCallResponse.call_id);
      callIdRef.current = webCallResponse.call_id;

      const retellClient = new RetellWebClient();
      retellClientRef.current = retellClient;

      retellClient.on('call_started', () => {
        console.log('Call started');
        setCallState('connected');
        startDurationTimer();
      });

      retellClient.on('call_ended', async () => {
        console.log('Call ended - syncing with Retell AI...');
        console.log('Current call ID:', callIdRef.current);
        setCallState('ended');
        stopDurationTimer();

        const dbCallId = callIdRef.current;
        if (dbCallId) {
          try {
            console.log('Fetching call details from Retell AI for call:', dbCallId);
            const result = await api.post(`/calls/${dbCallId}/sync-from-retell`);
            console.log('Call synced successfully:', result);
          } catch (err: any) {
            console.error('Failed to sync call from Retell:', err);
            console.error('Error details:', err.response?.data || err.message);
          }
        } else {
          console.warn('No call ID found - cannot sync');
        }

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
    callIdRef.current = null;
    setCallDuration(0);
    setIsMuted(false);
    setError(null);
  };

  const isCallActive = callState === 'connecting' || callState === 'connected';

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <Phone className="w-5 h-5 text-accent-primary" />
        Start Web Call
      </h3>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 glass-card border-accent-danger/50 p-3 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-accent-danger flex-shrink-0" />
            <span className="text-accent-danger text-sm">{error}</span>
          </motion.div>
        )}

        {isCallActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 glass-card border-accent-primary/50 p-6 bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300 mb-1">
                  {callState === 'connecting' ? 'Connecting...' : 'Call Active'}
                </p>
                <p className="text-3xl font-bold text-white">
                  {formatDuration(callDuration)}
                </p>
              </div>
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-accent-primary/20 rounded-full blur-xl"
                />
                <div className="relative w-16 h-16 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-full flex items-center justify-center shadow-glow">
                  <Radio className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleStartCall} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Agent *
          </label>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            disabled={isCallActive}
            required
            className="input-field"
          >
            <option value="">Choose an agent...</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.scenario_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Driver Name *
          </label>
          <input
            type="text"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            disabled={isCallActive}
            required
            className="input-field"
            placeholder="e.g., Mike Johnson"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Load Number *
          </label>
          <input
            type="text"
            value={loadNumber}
            onChange={(e) => setLoadNumber(e.target.value)}
            disabled={isCallActive}
            required
            className="input-field"
            placeholder="e.g., 7891-B"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isCallActive}
            className="input-field"
            placeholder="e.g., (555) 123-4567"
          />
          <p className="mt-1 text-xs text-gray-500">
            For record-keeping only. Call is made in your browser.
          </p>
        </div>

        {!isCallActive ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={callState === 'ended'}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {callState === 'ended' ? (
              <>Call Ended</>
            ) : (
              <>
                <Phone className="w-5 h-5" />
                Start Web Call
              </>
            )}
          </motion.button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleToggleMute}
              className={`btn-secondary flex items-center justify-center gap-2 ${
                isMuted ? 'bg-accent-warning/20 border-accent-warning/50' : ''
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleEndCall}
              className="bg-accent-danger hover:bg-accent-danger/80 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2"
            >
              <PhoneOff className="w-5 h-5" />
              End Call
            </motion.button>
          </div>
        )}
      </form>

      <div className="mt-6 glass-card p-4 border-accent-primary/30">
        <p className="font-medium text-white mb-2 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-accent-primary" />
          Web Call Instructions
        </p>
        <ul className="space-y-1 text-xs text-gray-400">
          <li>• Ensure your microphone is connected</li>
          <li>• Allow microphone permissions when prompted</li>
          <li>• Call is made directly in your browser</li>
          <li>• Speak naturally with the AI agent</li>
        </ul>
      </div>
    </div>
  );
}
