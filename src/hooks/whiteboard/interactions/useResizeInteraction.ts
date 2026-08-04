import { Dispatch, RefObject, useState } from 'react';

import { BoundsResizeHandle, Coordinates2D, Element, Interaction, ResizeHandle, Shape, WhiteboardAction } from '@/interfaces';
import {
	constrainResizeToAspectRatio,
	getCursorForHandle,
	getHandleAtPosition,
	getResizeAnchor,
	isBoundsResizeHandle,
	isCornerHandle,
	updateArrowBoundsByHandle,
	updateArrowByHandle,
	updateElementByHandle,
} from '@/utils';

interface UseResizeInteractionParams {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	selectedElement?: Element;
	zoom: number;
	isShiftPressed: boolean;
	dispatchWhiteBoardState: Dispatch<WhiteboardAction>;
	beginDocumentChange: VoidFunction;
}

interface UseResizeInteractionResult {
	activeHandle: ResizeHandle;
	hasActiveResize: boolean;
	tryStartResize: (point: Coordinates2D) => boolean;
	resize: (point: Coordinates2D) => boolean;
	resetResize: VoidFunction;
}

export function useResizeInteraction({
	canvasRef,
	selectedElement,
	zoom,
	isShiftPressed,
	dispatchWhiteBoardState,
	beginDocumentChange,
}: UseResizeInteractionParams): UseResizeInteractionResult {
	const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
	const [resizeAnchor, setResizeAnchor] = useState<Coordinates2D | null>(null);

	function tryStartResize(point: Coordinates2D): boolean {
		if (!selectedElement) return false;

		const handle = getHandleAtPosition(point.x, point.y, selectedElement, zoom);

		if (!handle) return false;

		beginDocumentChange();
		setActiveHandle(handle);

		if (selectedElement.shape !== Shape.ARROW) {
			setResizeAnchor(getResizeAnchor(selectedElement, handle));
		}

		dispatchWhiteBoardState({
			type: 'SET_INTERACTION',
			interaction: Interaction.RESIZING,
		});

		const canvas = canvasRef.current;
		if (canvas) {
			canvas.style.cursor = getCursorForHandle(selectedElement.angle, handle);
		}

		return true;
	}

	function resize(point: Coordinates2D): boolean {
		if (!selectedElement || !activeHandle) return false;

		if (selectedElement.shape === Shape.ARROW) {
			if (activeHandle === 'start' || activeHandle === 'end' || activeHandle === 'curve') {
				resizeArrowHandle(point, activeHandle);
				return true;
			}

			if (isBoundsResizeHandle(activeHandle)) {
				resizeArrowBounds(point, activeHandle);
				return true;
			}
		}

		let effectiveMouse = point;

		if (isShiftPressed && resizeAnchor && isCornerHandle(activeHandle)) {
			effectiveMouse = constrainResizeToAspectRatio(selectedElement, point.x, point.y, resizeAnchor);
		}

		dispatchWhiteBoardState({
			type: 'SET_ELEMENTS',
			updater: (elements) => updateElementByHandle(elements, selectedElement.id, activeHandle, effectiveMouse, resizeAnchor, isShiftPressed),
		});

		return true;
	}

	function resizeArrowBounds(point: Coordinates2D, handle: BoundsResizeHandle): void {
		if (!selectedElement) return;

		dispatchWhiteBoardState({
			type: 'SET_ELEMENTS',
			updater: (elements) => updateArrowBoundsByHandle(elements, selectedElement.id, handle, point, zoom),
		});
	}

	function resizeArrowHandle(point: Coordinates2D, handle: 'start' | 'end' | 'curve'): void {
		if (!selectedElement) return;

		dispatchWhiteBoardState({
			type: 'SET_ELEMENTS',
			updater: (elements) => updateArrowByHandle(elements, selectedElement.id, handle, point, isShiftPressed),
		});
	}

	function resetResize(): void {
		setActiveHandle(null);
		setResizeAnchor(null);
	}

	return {
		activeHandle,
		hasActiveResize: activeHandle !== null,
		tryStartResize,
		resize,
		resetResize,
	};
}
