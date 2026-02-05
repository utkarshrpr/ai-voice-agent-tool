import { Database } from 'lucide-react';
import type { StructuredData, CheckInData, EmergencyData } from '../../types';

interface Props {
  data: StructuredData;
}

function isCheckInData(data: StructuredData): data is CheckInData {
  return 'pod_reminder_acknowledged' in data;
}

function isEmergencyData(data: StructuredData): data is EmergencyData {
  return 'escalation_status' in data;
}

export default function StructuredDataDisplay({ data }: Props) {
  const renderCheckInData = (checkInData: CheckInData) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <DataField label="Call Outcome" value={checkInData.call_outcome} highlight />
      <DataField label="Driver Status" value={checkInData.driver_status} />
      <DataField label="Current Location" value={checkInData.current_location} />
      <DataField label="ETA" value={checkInData.eta} />
      <DataField label="Delay Reason" value={checkInData.delay_reason} />
      <DataField label="Unloading Status" value={checkInData.unloading_status} />
      <DataField
        label="POD Reminder Acknowledged"
        value={checkInData.pod_reminder_acknowledged ? 'Yes' : 'No'}
      />
    </div>
  );

  const renderEmergencyData = (emergencyData: EmergencyData) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <DataField
        label="Call Outcome"
        value={emergencyData.call_outcome}
        highlight
        isEmergency
      />
      <DataField
        label="Emergency Type"
        value={emergencyData.emergency_type}
        isEmergency
      />
      <DataField
        label="Safety Status"
        value={emergencyData.safety_status}
        isEmergency
      />
      <DataField
        label="Injury Status"
        value={emergencyData.injury_status}
        isEmergency
      />
      <DataField
        label="Emergency Location"
        value={emergencyData.emergency_location}
        isEmergency
      />
      <DataField
        label="Load Secure"
        value={
          emergencyData.load_secure === true
            ? 'Yes'
            : emergencyData.load_secure === false
            ? 'No'
            : 'Unknown'
        }
        isEmergency
      />
      <DataField
        label="Escalation Status"
        value={emergencyData.escalation_status}
        highlight
        isEmergency
      />
    </div>
  );

  return (
    <div>
      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Database className="w-5 h-5 text-accent-primary" />
        Structured Data
      </h4>

      <div className="glass-card p-4">
        {isCheckInData(data) ? (
          renderCheckInData(data)
        ) : isEmergencyData(data) ? (
          renderEmergencyData(data)
        ) : (
          <p className="text-gray-400">Unknown data format</p>
        )}
      </div>
    </div>
  );
}

interface DataFieldProps {
  label: string;
  value: string | number | boolean | null | undefined;
  highlight?: boolean;
  isEmergency?: boolean;
}

function DataField({ label, value, highlight, isEmergency }: DataFieldProps) {
  const displayValue =
    value === null || value === undefined || value === '' ? 'N/A' : String(value);

  const baseClasses = 'p-3 rounded-lg';
  const bgClasses = highlight
    ? isEmergency
      ? 'bg-accent-danger/20 border border-accent-danger/50'
      : 'bg-accent-primary/20 border border-accent-primary/50'
    : 'glass-card border-dark-border';

  const labelClasses = highlight
    ? isEmergency
      ? 'text-accent-danger'
      : 'text-accent-primary'
    : 'text-gray-400';

  const valueClasses = highlight
    ? isEmergency
      ? 'text-accent-danger'
      : 'text-accent-primary'
    : 'text-white';

  return (
    <div className={`${baseClasses} ${bgClasses}`}>
      <p className={`text-xs font-medium ${labelClasses} mb-1`}>{label}</p>
      <p className={`text-sm font-semibold ${valueClasses}`}>{displayValue}</p>
    </div>
  );
}
