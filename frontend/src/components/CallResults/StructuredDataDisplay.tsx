interface Props {
  data: Record<string, any>;
}

export default function StructuredDataDisplay({ data }: Props) {
  const formatKey = (key: string): string => {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Structured Data</h3>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="border-l-4 border-blue-500 pl-4">
            <dt className="text-sm font-medium text-gray-500">{formatKey(key)}</dt>
            <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
              {formatValue(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
