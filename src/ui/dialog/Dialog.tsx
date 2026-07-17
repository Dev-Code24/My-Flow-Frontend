'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
	open: boolean;
	onClose: () => void;
	title?: string;
	width?: string;
	height?: string;
	closable?: boolean;
	closeOnBackdrop?: boolean;
	className?: string;
	contentClassName?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
}

export default function Dialog({
	open,
	onClose,
	title,
	width = '500px',
	height,
	closable = true,
	closeOnBackdrop = true,
	className = '',
	contentClassName = '',
	children,
	footer,
}: DialogProps) {
	const dialogRef = useRef<HTMLElement>(null);

	useEffect(() => {
		if (!open) {
			return;
		}

		dialogRef.current?.focus();
	}, [open]);

	useEffect(() => {
		if (!open || !closable) {
			return;
		}

		function handleKeyDown(event: KeyboardEvent): void {
			if (event.key !== 'Escape') {
				return;
			}

			event.preventDefault();
			onClose();
		}

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [open, closable, onClose]);

	if (!open) {
		return null;
	}

	return (
		<div className='fixed inset-0 z-9999 flex items-center justify-center'>
			<div
				aria-hidden
				onClick={() => {
					if (closeOnBackdrop && closable) {
						onClose();
					}
				}}
				className='fixed inset-0 cursor-pointer bg-black/50 backdrop-blur-sm'
			/>

			<section
				ref={dialogRef}
				role='dialog'
				aria-modal='true'
				aria-labelledby={title ? 'dialog-title' : undefined}
				tabIndex={-1}
				style={{
					width,
					height,
				}}
				className={`relative z-10 max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl bg-white shadow-2xl outline-none ${className}`}
			>
				<div className='flex h-full w-full flex-col'>
					{(title || closable) && (
						<header className='flex items-center justify-between border-b border-[#E7E5EC] px-5 py-4'>
							{title ? (
								<h2 id='dialog-title' className='m-0 text-lg font-semibold text-[#2F2D38]'>
									{title}
								</h2>
							) : (
								<span />
							)}

							{closable && (
								<button
									type='button'
									onClick={onClose}
									aria-label='Close dialog'
									className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-[#665CE8] transition-colors hover:bg-[#F4F4F7]'
								>
									<X size={18} aria-hidden />
								</button>
							)}
						</header>
					)}

					<div className={`flex-1 overflow-y-auto p-5 ${contentClassName}`}>{children}</div>

					{footer && <footer className='flex justify-end gap-2 border-t border-[#E7E5EC] px-5 py-4'>{footer}</footer>}
				</div>
			</section>
		</div>
	);
}
