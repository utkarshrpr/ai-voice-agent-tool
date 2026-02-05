import type { CallStatus } from '../../types';

interface Props {
  status: CallStatus;
  size?: 'sm' | 'md' | 'lg';
}

export default function CallStatusIndicator({ status, size = 'sm' }: Props) {
  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'bg-accent-warning/20 text-accent-warning border-accent-warning/40';
      case 'in_progress':
        return 'bg-accent-primary/20 text-accent-primary border-accent-primary/40';
      case 'completed':
        return 'bg-accent-success/20 text-accent-success border-accent-success/40';
      case 'failed':
      case 'error':
        return 'bg-accent-danger/20 text-accent-danger border-accent-danger/40';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-600/40';
    }
  };

  const getStatusText = () => {
    return status.replace('_', ' ').toUpperCase();
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2.5 py-1 text-xs';
      case 'md':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-2.5 py-1 text-xs';
    }
  };

  return (
    <span
      className={`status-badge border ${getStatusColor()} ${getSizeClasses()}`}
    >
      {status === 'in_progress' && (
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-primary"></span>
        </span>
      )}
      {getStatusText()}
    </span>
  );
}
