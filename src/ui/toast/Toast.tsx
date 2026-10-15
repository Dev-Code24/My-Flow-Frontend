'use client';

import { useSyncExternalStore } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

import { ToastItem, ToastPosition, ToastVariant } from './toast.interface';
import { ToastService } from './toast.service';
import { getPositionClasses, getVariantClasses, groupToastsByPosition } from './toast.utils';

interface ToastIconProps {
	variant: ToastVariant;
}

interface ToastCardProps {
	toastItem: ToastItem;
}

const EMPTY_TOAST_LIST: ToastItem[] = [];

const TOAST_POSITIONS: ToastPosition[] = [
	'top-left',
	'top-center',
	'top-right',
	'bottom-left',
	'bottom-center',
	'bottom-right',
];

export default function Toast() {
	const toastList = useSyncExternalStore(ToastService.subscribe, ToastService.getSnapshot, () => EMPTY_TOAST_LIST);

	if (toastList.length === 0) {
		return null;
	}

	const groupedToasts = groupToastsByPosition(toastList);

	return (
		<div
			aria-live='polite'
			aria-atomic='false'
		>
			{TOAST_POSITIONS.map((position) => {
				const positionedToasts = groupedToasts[position];

				if (positionedToasts.length === 0) {
					return null;
				}

				return (
					<div
						key={position}
						className={`pointer-events-none fixed z-1000 flex w-[calc(100%-2rem)] max-w-md flex-col gap-2 ${getPositionClasses(position)}`}
					>
						{positionedToasts.map((item) => (
							<ToastCard
								key={item.id}
								toastItem={item}
							/>
						))}
					</div>
				);
			})}
		</div>
	);
}

function ToastCard({ toastItem }: ToastCardProps) {
	const { id, message, variant, visible } = toastItem;

	return (
		<div
			role={variant === 'error' ? 'alert' : 'status'}
			onMouseEnter={() => ToastService.pause(id)}
			onMouseLeave={() => ToastService.resume(id)}
			className={`pointer-events-auto w-full ${visible ? 'animate-toast-enter' : 'animate-toast-exit'}`}
		>
			<div className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 shadow-lg ${getVariantClasses(variant)}`}>
				<span className='flex h-5 shrink-0 items-center'>
					<ToastIcon variant={variant} />
				</span>

				<p className='min-w-0 flex-1 wrap-break-word text-sm leading-5'>{message}</p>

				<button
					type='button'
					onClick={() => ToastService.dismiss(id)}
					aria-label='Dismiss notification'
					className='-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current'
				>
					<X size={16} aria-hidden />
				</button>
			</div>
		</div>
	);
}

function ToastIcon({ variant }: ToastIconProps) {
	switch (variant) {
		case 'success':
			return (
				<CheckCircle2
					size={18}
					aria-hidden
				/>
			);

		case 'error':
			return (
				<AlertCircle
					size={18}
					aria-hidden
				/>
			);

		case 'warning':
			return (
				<TriangleAlert
					size={18}
					aria-hidden
				/>
			);

		case 'info':
			return (
				<Info
					size={18}
					aria-hidden
				/>
			);
	}
}
