import type { CallStatus } from '../../types';

interface Props {
  status: CallStatus;
  size?: 'sm' | 'md' | 'lg';
}

export default function CallStatusIndicator({ status, size = 'sm' }: Props) {
  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = () => {
    return status.replace('_', ' ').toUpperCase();
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'md':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-2 py-1 text-xs';
    }
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${getStatusColor()} ${getSizeClasses()}`}
    >
      {status === 'in_progress' && (
        <span className="mr-1.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
      )}
      {getStatusText()}
    </span>
  );
}
