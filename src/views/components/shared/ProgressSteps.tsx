interface Step {
  step: number;
  label: string;
  done: boolean;
  active: boolean;
}

interface ProgressStepsProps {
  steps: Step[];
}

export function ProgressSteps({ steps }: ProgressStepsProps) {
  return (
    <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
      {steps.map((s, i) => (
        <div key={s.step} className="flex items-center gap-2 shrink-0">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
              s.done
                ? 'bg-green-500 text-white'
                : s.active
                ? 'bg-[#C62828] text-white'
                : 'bg-gray-200 text-gray-400'
            }`}
            style={{ fontSize: '0.75rem' }}
          >
            {s.done ? '✓' : s.step}
          </div>
          <span
            className={`${
              s.active
                ? 'text-[#C62828] font-semibold'
                : s.done
                ? 'text-green-600'
                : 'text-gray-400'
            }`}
            style={{ fontSize: '0.85rem' }}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && <div className="w-8 h-px bg-gray-200" />}
        </div>
      ))}
    </div>
  );
}
