'use client';

import { LoaderCircle } from 'lucide-react';
import Modal from '@/ui/modal';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isConfirming = false,
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      width='520px'
    >
      <div>
        <h2 className='text-lg font-semibold text-[#2F2D38]'>
          {title}
        </h2>

        <p className='mt-3 text-sm leading-6 text-[#5F5D68]'>
          {message}
        </p>

        <div className='mt-7 flex justify-end gap-3'>
          <button
            type='button'
            onClick={onCancel}
            disabled={isConfirming}
            className='cursor-pointer rounded-lg border border-[#E7E5EC] px-4 py-2 text-sm font-medium text-[#3F3F49] transition-colors hover:bg-[#F4F4F7] disabled:cursor-not-allowed disabled:opacity-60'
          >
            {cancelLabel}
          </button>

          <button
            type='button'
            onClick={onConfirm}
            disabled={isConfirming}
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-[#665CE8] hover:bg-[#574DDA]'}`}
          >
            {isConfirming && (
              <LoaderCircle
                size={16}
                className='animate-spin'
              />
            )}

            {isConfirming
              ? 'Please wait...'
              : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}