interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function PromptEditor({ value, onChange }: Props) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={12}
      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
      placeholder="Enter your system prompt here..."
    />
  );
}
