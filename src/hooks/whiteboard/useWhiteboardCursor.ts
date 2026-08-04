import { RefObject, useEffect } from 'react';

import { Tool, WhiteboardMode } from '@/interfaces';
import { getIdleWhiteboardCursor } from '@/utils';

interface UseWhiteboardCursorParams {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	tool: Tool;
	mode: WhiteboardMode;
	isSpacePressed: boolean;
}

export function useWhiteboardCursor({
	canvasRef,
	tool,
	mode,
	isSpacePressed,
}: UseWhiteboardCursorParams): void {
	useEffect(() => {
		const canvas = canvasRef.current;

		if (!canvas) {
			return;
		}

		canvas.style.cursor = getIdleWhiteboardCursor(tool, isSpacePressed, mode);
	}, [canvasRef, tool, mode, isSpacePressed]);
}