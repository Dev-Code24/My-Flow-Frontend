import { ToastPosition } from './toast.interface';

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
