import { MouseEvent as ReactMouseEvent, useRef } from 'react';

import { Coordinates2D, Interaction, Tool } from '@/interfaces';
import { CursorType } from '@/constants';
import { getCanvasPoint, getCursorStyle, getIdleWhiteboardCursor } from '@/utils';
import { UseCommonWhiteboardInteractionsParams, UseCommonWhiteboardInteractionsResult } from './interfaces';

export function useCommonWhiteboardInteractions({
	canvasRef,
	interaction,
	tool,
	pan,
	zoom,
	isSpacePressed,
	setPan,
	dispatchWhiteBoardState,
}: UseCommonWhiteboardInteractionsParams): UseCommonWhiteboardInteractionsResult {
	const lastPanPosition = useRef<Coordinates2D>({
		x: 0,
		y: 0,
	});

	function tryHandleMouseDown(event: ReactMouseEvent<HTMLCanvasElement>): boolean {
		const shouldPan = isSpacePressed || event.button === 1 || tool === Tool.PAN;

		if (!shouldPan) {
			return false;
		}

		const canvas = canvasRef.current;

		if (!canvas) {
			return false;
		}

		if (event.button === 1) {
			event.preventDefault();
		}

		const { rawX, rawY } = getCanvasPoint(event, canvas, pan, zoom);

		lastPanPosition.current = { x: rawX, y: rawY };

		dispatchWhiteBoardState({ type: 'SET_INTERACTION', interaction: Interaction.PANNING });
		canvas.style.cursor = getCursorStyle(CursorType.GRABBING);
		return true;
	}

	function tryHandleMouseMove(event: ReactMouseEvent<HTMLCanvasElement>): boolean {
		const isMiddleClickPanning = event.buttons === 4;

		const shouldPan = interaction === Interaction.PANNING || isMiddleClickPanning;

		if (!shouldPan) {
			return false;
		}

		const canvas = canvasRef.current;

		if (!canvas) {
			return false;
		}

		const { rawX, rawY } = getCanvasPoint(event, canvas, pan, zoom);
		const dx = rawX - lastPanPosition.current.x;
		const dy = rawY - lastPanPosition.current.y;

		setPan((currentPan) => ({ x: currentPan.x + dx, y: currentPan.y + dy }));
		lastPanPosition.current = { x: rawX, y: rawY };
		canvas.style.cursor = getCursorStyle(CursorType.GRABBING);
		return true;
	}

	function handleMouseUp(): void {
		if (interaction !== Interaction.PANNING) {
			return;
		}

		dispatchWhiteBoardState({ type: 'END_INTERACTION' });
		resetCursor();
	}

	function cancelInteraction(): void {
		if (interaction === Interaction.PANNING) {
			dispatchWhiteBoardState({ type: 'END_INTERACTION' });
		}

		resetCursor();
	}

	function resetCursor(): void {
		const canvas = canvasRef.current;

		if (!canvas) {
			return;
		}

		canvas.style.cursor = getIdleWhiteboardCursor(
			tool,
			isSpacePressed,
		);
	}

	return {
		tryHandleMouseDown,
		tryHandleMouseMove,
		handleMouseUp,
		cancelInteraction,
		resetCursor,
	};
}