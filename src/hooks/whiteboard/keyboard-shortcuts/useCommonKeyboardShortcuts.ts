import { useEffect } from 'react';

import { CursorType, KeyboardKeys } from '@/constants';
import { getCursorStyle } from '@/utils';
import { CommonKeyboardShortcutsProps } from './interfaces';

export function useCommonKeyboardShortcuts({ canvasRef, setIsSpacePressed, cancelInteraction }: CommonKeyboardShortcutsProps): void {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.repeat) {
				return;
			}

			const key = event.key.toLowerCase();

			if (key === KeyboardKeys.ESCAPE) {
				event.preventDefault();
				cancelInteraction();
				return;
			}

			if (event.key === KeyboardKeys.SPACEBAR) {
				const canvas = canvasRef.current;

				if (!canvas) {
					return;
				}

				event.preventDefault();
				setIsSpacePressed(true);
				canvas.style.cursor = getCursorStyle(CursorType.GRAB);
				return;
			}

		};

		const handleKeyUp = (event: KeyboardEvent): void => {
			const key = event.key.toLowerCase();

			if (key === KeyboardKeys.SPACEBAR) {
				setIsSpacePressed(false);
				return;
			}
		};

		const resetPressedKeys = (): void => {
			setIsSpacePressed(false);
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		window.addEventListener('blur', resetPressedKeys);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
			window.removeEventListener('blur', resetPressedKeys);
		};
	}, [canvasRef, setIsSpacePressed, cancelInteraction]);
}
