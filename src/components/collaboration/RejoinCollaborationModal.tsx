'use client';

import Modal from '@/ui/modal';

interface RejoinCollaborationModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onStartClean: () => void;
  onBack: () => void;
}

export default function RejoinCollaborationModal({
  isOpen,
  onContinue,
  onStartClean,
  onBack,
}: RejoinCollaborationModalProps) {
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
          Continue where you left?
        </h2>

        <p className='pt-2 text-sm text-text-secondary'>
          We found your recent work from this collaboration.
          You can bring it back into the room or start with the room&apos;s current state.
        </p>

        <div className='flex justify-end gap-2 pt-5'>
          <button
            type='button'
            onClick={onBack}
            className='rounded-lg border border-border px-4 py-2 text-sm font-medium text-tool-default transition-colors hover:bg-surface-muted'
          >
            Back
          </button>

          <button
            type='button'
            onClick={onStartClean}
            className='rounded-lg border border-border px-4 py-2 text-sm font-medium text-tool-default transition-colors hover:bg-surface-muted'
          >
            Start from a clean whiteboard
          </button>

          <button
            type='button'
            onClick={onContinue}
            className='rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover'
          >
            Continue
          </button>
        </div>
      </div>
    </Modal>
  );
}