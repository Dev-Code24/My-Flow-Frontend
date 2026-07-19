import { Dispatch, RefObject, SetStateAction, useEffect } from 'react';
import { Element, Tool, WhiteboardAction, WhiteboardMode } from '@/interfaces';
import { CursorType, KeyboardKeys } from '@/constants';
import { getCursorStyle } from '@/utils';

interface UseKeyboardShortcutsProps {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	elements: Element[];
	selectedIds: string[];
	dispatchWhiteBoardState: Dispatch<WhiteboardAction>;
	setIsSpacePressed: Dispatch<SetStateAction<boolean>>;
	setIsShiftPressed: Dispatch<SetStateAction<boolean>>;
	mode: WhiteboardMode;
	recordSnapshot: (snapshot: Element[]) => void;
	undo: () => void;
	redo: () => void;
}

export function useKeyboardShortcuts({
	mode,
	canvasRef,
	elements,
	selectedIds,
	dispatchWhiteBoardState,
	setIsSpacePressed,
	setIsShiftPressed,
	recordSnapshot,
	redo,
	undo,
}: UseKeyboardShortcutsProps): void {
	const isReadOnly = mode === 'readonly';

	useEffect(() => {
		const changeTool = (tool: Tool) => {
			dispatchWhiteBoardState({ type: 'CHANGE_TOOL', tool });
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.repeat) { return; }

			const key = event.key.toLowerCase();

			if (event.key === KeyboardKeys.SPACEBAR) {
				const canvas = canvasRef.current;

				if (!canvas) { return; }

				event.preventDefault();
				setIsSpacePressed(true);
				canvas.style.cursor = getCursorStyle(CursorType.GRAB);

				return;
			}

			if (isReadOnly) { return; }

			const isModifierPressed = event.ctrlKey || event.metaKey;

			if (isModifierPressed && key === KeyboardKeys.Z) {
				event.preventDefault();

				if (event.shiftKey) {
					redo();
				} else {
					undo();
				}

				return;
			}

			if (event.ctrlKey && key === KeyboardKeys.Y) {
				event.preventDefault();
				redo();

				return;
			}

			switch (key) {
				case KeyboardKeys.DELETE: 
				case KeyboardKeys.BACKSPACE: {
					if (selectedIds.length === 0) { return; }

					event.preventDefault();
					recordSnapshot(elements);
					dispatchWhiteBoardState({ type: 'DELETE_SELECTED' });

					return;
				}

				case KeyboardKeys.V: {
					changeTool(Tool.SELECT);
					return;
				}

				case KeyboardKeys.D: {
					changeTool(Tool.DRAW_RECTANGLE);

					return;
				}

				case KeyboardKeys.R: {
					changeTool(Tool.DRAW_RHOMBUS);

					return;
				}

				case KeyboardKeys.O: {
					changeTool(Tool.DRAW_OVAL);

					return;
				}

				case KeyboardKeys.SHIFT: {
					setIsShiftPressed(true);
					return;
				}
			}
		};

		const handleKeyUp = (event: KeyboardEvent) => {
			const key = event.key.toLowerCase();

			if (event.key === KeyboardKeys.SPACEBAR) {
				setIsSpacePressed(false);
				return;
			}

			if (key === KeyboardKeys.SHIFT) {
				setIsShiftPressed(false);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, [canvasRef, elements, selectedIds, dispatchWhiteBoardState, setIsSpacePressed, setIsShiftPressed, isReadOnly, recordSnapshot, redo, undo]);
}
