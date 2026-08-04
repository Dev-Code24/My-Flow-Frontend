import { Dispatch, RefObject, useRef, useState } from 'react';

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
	isAltPressed: boolean;
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
	isAltPressed,
	dispatchWhiteBoardState,
	beginDocumentChange,
}: UseResizeInteractionParams): UseResizeInteractionResult {
	const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
	const [resizeAnchor, setResizeAnchor] = useState<Coordinates2D | null>(null);
	const resizeStartElement = useRef<Element | null>(null);

	function tryStartResize(point: Coordinates2D): boolean {
		if (!selectedElement) return false;

		const handle = getHandleAtPosition(point.x, point.y, selectedElement, zoom);

		if (!handle) return false;

		beginDocumentChange();
		resizeStartElement.current = structuredClone(selectedElement);
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
		if (!selectedElement || !activeHandle || !resizeStartElement.current) return false;

		if (selectedElement.shape === Shape.ARROW) {
			if (activeHandle === 'start' || activeHandle === 'end' || activeHandle === 'curve') {
				resizeArrowHandle(point, activeHandle);
				return true;
			}

			if (isBoundsResizeHandle(activeHandle)) {
				resizeArrowBounds(
					point,
					activeHandle,
					resizeStartElement.current,
				);
				return true;
			}
		}

		let effectiveMouse = point;

		if (isShiftPressed && resizeAnchor && isCornerHandle(activeHandle)) {
			effectiveMouse = constrainResizeToAspectRatio(selectedElement, point.x, point.y, resizeAnchor);
		}

		dispatchWhiteBoardState({
			type: 'SET_ELEMENTS',
			updater: (elements) => updateElementByHandle(
					elements,
					selectedElement.id,
					activeHandle,
					effectiveMouse,
					resizeAnchor,
					isShiftPressed,
					isAltPressed,
					resizeStartElement.current,
				),
		});

		return true;
	}

	function resizeArrowBounds(
		point: Coordinates2D,
		handle: BoundsResizeHandle,
		startElement: Element,
	): void {
		if (!selectedElement) return;

		dispatchWhiteBoardState({
			type: 'SET_ELEMENTS',
			updater: (elements) =>
				updateArrowBoundsByHandle(
					elements,
					selectedElement.id,
					handle,
					point,
					zoom,
					isAltPressed,
					isShiftPressed,
					startElement,
				),
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
		resizeStartElement.current = null;
	}

	return {
		activeHandle,
		hasActiveResize: activeHandle !== null,
		tryStartResize,
		resize,
		resetResize,
	};
}
