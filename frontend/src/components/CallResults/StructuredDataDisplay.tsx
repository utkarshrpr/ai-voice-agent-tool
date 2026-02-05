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
      <h4 className="text-lg font-semibold mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
            clipRule="evenodd"
          />
        </svg>
        Structured Data
      </h4>

      <div className="bg-gray-50 rounded-lg p-4">
        {isCheckInData(data) ? (
          renderCheckInData(data)
        ) : isEmergencyData(data) ? (
          renderEmergencyData(data)
        ) : (
          <p className="text-gray-500">Unknown data format</p>
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

  const baseClasses = 'p-3 rounded';
  const bgClasses = highlight
    ? isEmergency
      ? 'bg-red-100 border border-red-300'
      : 'bg-blue-100 border border-blue-300'
    : 'bg-white border border-gray-200';

  const labelClasses = highlight
    ? isEmergency
      ? 'text-red-900'
      : 'text-blue-900'
    : 'text-gray-600';

  const valueClasses = highlight
    ? isEmergency
      ? 'text-red-900'
      : 'text-blue-900'
    : 'text-gray-900';

  return (
    <div className={`${baseClasses} ${bgClasses}`}>
      <p className={`text-xs font-medium ${labelClasses} mb-1`}>{label}</p>
      <p className={`text-sm font-semibold ${valueClasses}`}>{displayValue}</p>
    </div>
  );
}
