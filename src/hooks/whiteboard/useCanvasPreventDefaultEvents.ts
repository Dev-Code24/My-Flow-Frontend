import { RefObject, useEffect } from 'react';

interface useCanvasPreventDefaultEvents {
	canvasRef: RefObject<HTMLCanvasElement | null>;
}

export function useCanvasPreventDefaultEvents({ canvasRef }: useCanvasPreventDefaultEvents): void {
	useEffect(() => {
		const canvas = canvasRef.current;

		if (!canvas) { return; }

		function preventDefault(event: WheelEvent | MouseEvent): void {
			if (event.ctrlKey || event.metaKey) {
				event.preventDefault();
			}

			if (event instanceof MouseEvent && event.button === 1) {
				event.preventDefault();
			}
		}

		canvas.addEventListener('wheel', preventDefault, { passive: false });
		canvas.addEventListener('mousedown', preventDefault, { passive: false });

		return () => {
			canvas.removeEventListener( 'wheel', preventDefault);
			canvas.removeEventListener('mousedown', preventDefault);
		};
	}, [canvasRef]);
}