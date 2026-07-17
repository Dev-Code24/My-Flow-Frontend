'use client';

import Dialog from './Dialog';

interface ConfirmDialogProps {
	open: boolean;
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	isConfirming?: boolean;
	isDestructive?: boolean;
	onConfirm: () => void | Promise<void>;
	onCancel: () => void;
}

export default function ConfirmDialog({
	open,
	title,
	message,
	confirmLabel = 'Confirm',
	cancelLabel = 'Cancel',
	isConfirming = false,
	isDestructive = false,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	return (
		<Dialog
			open={open}
			onClose={onCancel}
			title={title}
			width='520px'
			closable={!isConfirming}
			closeOnBackdrop={!isConfirming}
			footer={
				<>
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
						className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-[#665CE8] hover:bg-[#574DDA]'}`}
					>
						{isConfirming ? 'Please wait...' : confirmLabel}
					</button>
				</>
			}
		>
			<p className='text-sm leading-6 text-[#5F5D68]'>{message}</p>
		</Dialog>
	);
}
