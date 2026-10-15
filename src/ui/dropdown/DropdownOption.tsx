import { Check } from 'lucide-react';

interface DropdownOptionProps<T extends string> {
  value: T;
  label: string;
  isSelected: boolean;
  onSelect: (value: T) => void;
}

export default function DropdownOption<T extends string>({
   value,
   label,
   isSelected,
   onSelect,
 }: DropdownOptionProps<T>) {
  return (
    <button
      type='button'
      role='option'
      aria-selected={isSelected}
      onClick={() => onSelect(value)}
      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
        isSelected
          ? 'bg-surface-selected text-primary'
          : 'text-text-primary hover:bg-surface-muted'
      }`}
    >
      <span>{label}</span>

      {isSelected && (
        <Check
          size={16}
          aria-hidden
          className='text-primary'
        />
      )}
    </button>
  );
}