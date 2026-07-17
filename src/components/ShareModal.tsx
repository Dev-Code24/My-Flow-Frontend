'use client';

import { useState } from 'react';
import { Link2, LoaderCircle, Play, Share2 } from 'lucide-react';

import Modal from '@/ui/modal';

interface ShareModalProps {
  onStartSession: () => Promise<void>;
  onExportToLink: () => Promise<void>;
  isStartingSession: boolean;
  isExporting: boolean;
}

export default function ShareModal({
  onStartSession,
  onExportToLink,
  isStartingSession,
  isExporting,
}: ShareModalProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const isLoading = isStartingSession || isExporting;

  function handleClose(): void {
    if (isLoading) {
      return;
    }

    setIsOpen(false);
  }

  async function handleStartSession(): Promise<void> {
    if (isLoading) {
      return;
    }

    await onStartSession();
  }

  async function handleExportToLink(): Promise<void> {
    if (isLoading) {
      return;
    }

    await onExportToLink();
  }

  return (
    <>
      <button
        type='button'
        onClick={() => setIsOpen(true)}
        className='absolute right-6 top-6 z-20 flex h-10 items-center gap-2 rounded-lg bg-[#665CE8] px-4 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#574DDA] cursor-pointer'
      >
        <Share2 size={18} strokeWidth={2} />
        Share
      </button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        width='550px'
        contentClassName='px-10 py-10 sm:px-12'
      >
        <section className='text-center'>
          <h2 className='text-xl font-bold text-[#665CE8]'>
            Live collaboration
          </h2>

          <p className='mt-6 text-sm text-[#2F2D38]'>
            Invite people to collaborate on your drawing.
          </p>

          <p className='mx-auto mt-4 max-w-115 text-sm leading-6 text-[#2F2D38]'>
            Don&apos;t worry, the session is end-to-end encrypted and fully
            private. Not even our server can see what you draw.
          </p>

          <button
            type='button'
            onClick={handleStartSession}
            disabled={isLoading}
            className='mx-auto mt-6 flex min-h-12 items-center justify-center gap-3 rounded-lg bg-[#665CE8] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#574DDA] disabled:cursor-not-allowed disabled:opacity-60'
          >
            {isStartingSession ? (
              <LoaderCircle
                size={18}
                className='animate-spin'
                aria-hidden
              />
            ) : (
              <Play size={18} aria-hidden />
            )}

            {isStartingSession ? 'Starting...' : 'Start session'}
          </button>
        </section>

        <div className='my-9 flex items-center gap-4'>
          <div className='h-px flex-1 bg-[#E7E5EC]' />

          <span className='text-sm text-[#2F2D38]'>
            Or
          </span>

          <div className='h-px flex-1 bg-[#E7E5EC]' />
        </div>

        <section className='text-center'>
          <h3 className='text-xl font-bold text-[#665CE8]'>
            Shareable link
          </h3>

          <p className='mt-6 text-sm text-[#2F2D38]'>
            Export as a read-only link.
          </p>

          <button
            type='button'
            onClick={handleExportToLink}
            disabled={isLoading}
            className='mx-auto mt-6 flex min-h-12 items-center justify-center gap-3 rounded-lg bg-[#665CE8] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#574DDA] disabled:cursor-not-allowed disabled:opacity-60'
          >
            {isExporting ? (
              <LoaderCircle
                size={18}
                className='animate-spin'
                aria-hidden
              />
            ) : (
              <Link2 size={18} aria-hidden />
            )}

            {isExporting ? 'Exporting...' : 'Export to Link'}
          </button>
        </section>
      </Modal>
    </>
  );
}