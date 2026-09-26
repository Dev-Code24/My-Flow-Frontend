'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

import DropdownOption from './DropdownOption';
import { DropdownItem } from './interfaces';

interface DropdownProps<T extends string> {
  value: T;
  options: DropdownItem<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
}

export default function Dropdown<T extends string>({
   value,
   options,
   onChange,
   disabled = false,
   label,
   className = '',
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [dropdownPosition, setDropdownPosition] =  useState<DropdownPosition>({ top: 0, left: 0, width: 0 });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(
    (option) => option.value === value
  );

  function updateDropdownPosition(): void {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();

    setDropdownPosition({
      top: rect.top,
      left: rect.left,
      width: rect.width,
    });
  }

  function handleToggle(): void {
    if (disabled) {
      return;
    }

    if (!isOpen) {
      updateDropdownPosition();
    }

    setIsOpen((prev) => !prev);
  }

  function handleSelect(value: T): void {
    onChange(value);
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleMouseDown(event: MouseEvent): void {
      const target = event.target as Node;
      const clickedDropdown = dropdownRef.current?.contains(target);
      const clickedOptions = optionsRef.current?.contains(target);

      if (clickedDropdown || clickedOptions) {
        return;
      }

      setIsOpen(false);
    }

    function handleWindowChange(): void {
      updateDropdownPosition();
    }

    document.addEventListener('mousedown', handleMouseDown    );
    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
    };
  }, [isOpen]);

  return (
    <div
      ref={dropdownRef}
      className={`flex flex-col gap-2 ${className}`}
    >
      {label && (
        <span className='text-sm font-medium text-text-primary'>
          {label}
        </span>
      )}

      <button
        ref={triggerRef}
        type='button'
        disabled={disabled}
        aria-haspopup='listbox'
        aria-expanded={isOpen}
        onClick={handleToggle}
        className='flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-text-primary outline-none transition-colors hover:bg-surface-muted focus:border-primary disabled:opacity-60'
      >
        <span>
          {selectedOption?.label}
        </span>

        <ChevronDown
          size={17}
          aria-hidden
          className={`shrink-0 text-text-secondary transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen &&
        !disabled &&
        createPortal(
          <div
            ref={optionsRef}
            role='listbox'
            style={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
            className='z-100 overflow-hidden rounded-lg border border-border bg-white p-1 shadow-md'
          >
            {options.map((option) => (
              <DropdownOption
                key={option.value}
                value={option.value}
                label={option.label}
                isSelected={option.value === value}
                onSelect={handleSelect}
              />
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}