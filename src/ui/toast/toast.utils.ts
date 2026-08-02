import { ToastItem, ToastPosition, ToastVariant } from './toast.interface';

export function getPositionClasses(position: ToastPosition): string {
	switch (position) {
		case 'top-left':
			return 'top-4 left-4 items-start';

		case 'top-center':
			return 'top-4 left-1/2 -translate-x-1/2 items-center';

		case 'top-right':
			return 'top-4 right-4 items-end';

		case 'bottom-left':
			return 'bottom-4 left-4 items-start';

		case 'bottom-center':
			return 'bottom-4 left-1/2 -translate-x-1/2 items-center';

		case 'bottom-right':
			return 'bottom-4 right-4 items-end';
	}
}

export function groupToastsByPosition(toastList: ToastItem[]): Record<ToastPosition, ToastItem[]> {
	const grouped: Record<ToastPosition, ToastItem[]> = {
		'top-left': [],
		'top-center': [],
		'top-right': [],
		'bottom-left': [],
		'bottom-center': [],
		'bottom-right': [],
	};

	for (const toastItem of toastList) {
		grouped[toastItem.position].push(toastItem);
	}

	return grouped;
}

export function getVariantClasses(variant: ToastVariant): string {
	switch (variant) {
		case 'success':
			return 'border-green-200 bg-green-50 text-green-800';

		case 'error':
			return 'border-red-200 bg-red-50 text-red-800';

		case 'warning':
			return 'border-yellow-200 bg-yellow-50 text-yellow-800';

		case 'info':
			return 'border-blue-200 bg-blue-50 text-blue-800';
	}
}