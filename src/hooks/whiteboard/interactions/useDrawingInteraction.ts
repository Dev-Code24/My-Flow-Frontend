import { Dispatch, MutableRefObject, useRef } from 'react';

import { Coordinates2D, Element, PendingDrawing, Shape, WhiteboardAction } from '@/interfaces';
import { createDrawingElement, hasCrossedDrawingThreshold, updateDrawingElement } from '@/utils';

interface UseDrawingInteractionParams {
	dispatchWhiteBoardState: Dispatch<WhiteboardAction>;
	selectedId: string | null;
	isShiftPressed: boolean;
	beginDocumentChange: VoidFunction;
}

interface UseDrawingInteractionResult {
	pendingDrawing: MutableRefObject<PendingDrawing | null>;
	hasStartedDrawing: MutableRefObject<boolean>;
	startDrawing: (point: Coordinates2D, shape: Shape) => void;
	tryStartDrawing: (point: Coordinates2D) => boolean;
	updateDrawing: (point: Coordinates2D) => boolean;
	resetDrawing: VoidFunction;
}

const DRAWING_DRAG_THRESHOLD = 3;

export function useDrawingInteraction({
	dispatchWhiteBoardState,
	selectedId,
	isShiftPressed,
	beginDocumentChange,
}: UseDrawingInteractionParams): UseDrawingInteractionResult {
	const pendingDrawing = useRef<PendingDrawing | null>(null);
	const hasStartedDrawing = useRef(false);

	function startDrawing(point: Coordinates2D, shape: Shape): void {
		pendingDrawing.current = { x: point.x, y: point.y, shape };
		hasStartedDrawing.current = false;
	}

	function tryStartDrawing(point: Coordinates2D): boolean {
		const pending = pendingDrawing.current;
		if (!pending || hasStartedDrawing.current) return false;

		if (!hasCrossedDrawingThreshold(pending, point, DRAWING_DRAG_THRESHOLD)) {
			return true;
		}

		beginDocumentChange();
		hasStartedDrawing.current = true;

		dispatchWhiteBoardState({
			type: 'START_DRAW',
			element: createDrawingElement(pending, point, isShiftPressed),
		});

		return true;
	}

	function updateDrawing(point: Coordinates2D): boolean {
		if (!hasStartedDrawing.current || !selectedId) return false;

		dispatchWhiteBoardState({
			type: 'SET_ELEMENTS',
			updater: (elements: Element[]) => updateDrawingElement(elements, selectedId, point, isShiftPressed),
		});

		return true;
	}

	function resetDrawing(): void {
		pendingDrawing.current = null;
		hasStartedDrawing.current = false;
	}

	return {
		pendingDrawing,
		hasStartedDrawing,
		startDrawing,
		tryStartDrawing,
		updateDrawing,
		resetDrawing,
	};
}
