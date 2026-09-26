'use client';

import { useState } from 'react';

import Modal from '@/ui/modal';

interface JoinCollaborationModalProps {
  isOpen: boolean;
  isJoining: boolean;
  onBack: () => void;
  onSubmit: (displayName: string) => Promise<void>;
}

export default function JoinCollaborationModal({
  isOpen,
  isJoining,
  onBack,
  onSubmit,
}: JoinCollaborationModalProps) {
  const [displayName, setDisplayName] = useState<string>('');
  const trimmedName = displayName.trim();
  const isDisplayNameValid = trimmedName.length >= 2 && trimmedName.length <= 50;

  async function handleSubmit(): Promise<void> {
    if (!isDisplayNameValid || isJoining) {
      return;
    }

    await onSubmit(trimmedName);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onBack}
      width='28rem'
      closable={false}
      closeOnBackdrop={false}
      closeOnEscape={false}
    >
      <div>
        <h2 className='text-lg font-semibold text-text-primary'>
          Join collaboration
        </h2>

        <p className='pt-2 text-sm text-text-secondary'>
          Choose a name others in the room can see.
        </p>

        <div className='flex flex-col gap-2 pt-5'>
          <label
            htmlFor='collaboration-display-name'
            className='text-sm font-medium text-text-primary'
          >
            Display name
          </label>

          <input
            id='collaboration-display-name'
            type='text'
            value={displayName}
            maxLength={50}
            disabled={isJoining}
            autoFocus
            autoComplete='name'
            placeholder='Your name'
            onChange={(event) => {
              setDisplayName(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleSubmit();
              }
            }}
            className='rounded-lg border border-border px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary disabled:opacity-60'
          />
        </div>

        <div className='flex justify-end gap-2 pt-5'>
          <button
            type='button'
            onClick={onBack}
            disabled={isJoining}
            className='rounded-lg border border-border px-4 py-2 text-sm font-medium text-tool-default transition-colors hover:bg-surface-muted disabled:opacity-60'
          >
            Back
          </button>

          <button
            type='button'
            onClick={() => {
              void handleSubmit();
            }}
            disabled={!isDisplayNameValid || isJoining}
            className='rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60'
          >
            {isJoining ? 'Joining' : 'Join room'}
          </button>
        </div>
      </div>
    </Modal>
  );
}