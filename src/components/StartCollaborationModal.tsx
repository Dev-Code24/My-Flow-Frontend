'use client';

import { useState } from 'react';

import Modal from '@/ui/modal';
import Dropdown from '@/ui/dropdown';
import { RoomDuration } from '@/lib/interfaces';
import { ROOM_DURATION_OPTIONS } from '@/constants';
import { RoomCollaborationOptions } from '@/interfaces';
import { useAuth } from "@/hooks/auth";

interface StartCollaborationModalProps {
  isOpen: boolean;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (options: RoomCollaborationOptions) => void | Promise<void>;
}

export default function StartCollaborationModal({
  isOpen,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: StartCollaborationModalProps) {
  const { isAuthenticated, user } = useAuth();
  const [displayName, setDisplayName] = useState<string>('');
  const [duration, setDuration] = useState<RoomDuration>(RoomDuration.ONE_HOUR);

  const trimmedName = displayName.trim();
  const isDisplayNameValid = isAuthenticated || (trimmedName.length >= 2 && trimmedName.length <= 50);

  async function handleSubmit(): Promise<void> {
    if (!isDisplayNameValid || isSubmitting) { return; }

    await onSubmit({ displayName: isAuthenticated ? user.name : trimmedName, duration });
    setDisplayName('');
    setDuration(RoomDuration.ONE_HOUR);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      width='32.5rem'
      closable={!isSubmitting}
      closeOnBackdrop={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <div>
        <h2 className='text-lg font-semibold text-text-primary'>
          Start collaboration
        </h2>

        <p className='pt-2 text-sm text-secondary'>
          Set up your collaboration session.
        </p>

        <div className='flex gap-5 pt-5'>
          {!isAuthenticated && (
            <div className='flex w-[20rem] flex-col gap-2'>
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
                disabled={isSubmitting}
                autoFocus
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
                className='w-full rounded-lg border border-border px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary disabled:opacity-60'
              />
            </div>
          )}

          <Dropdown
            label='Room duration'
            value={duration}
            options={ROOM_DURATION_OPTIONS}
            onChange={setDuration}
            disabled={isSubmitting}
            className='flex-1'
          />
        </div>

        <div className='pt-5 flex justify-end gap-2'>
          <button
            type='button'
            onClick={onCancel}
            disabled={isSubmitting}
            className='rounded-lg border border-border px-4 py-2 text-sm font-medium text-tool-default transition-colors hover:bg-surface-muted disabled:opacity-60'
          >
            Cancel
          </button>

          <button
            type='button'
            onClick={() => { void handleSubmit(); }}
            disabled={
              !isDisplayNameValid ||
              isSubmitting
            }
            className='rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60'
          >
            Start session
          </button>
        </div>
      </div>
    </Modal>
  );
}