import { RefObject, useEffect } from "react";

import { Tool, WhiteboardMode } from "@/interfaces";
import { CursorStyles } from "@/constants";

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

		if (!canvas) { return; }

		if (isSpacePressed) {
			canvas.style.cursor = CursorStyles.GRAB;
			return;
		}

		if (mode === "readonly") {
			canvas.style.cursor = CursorStyles.DEFAULT;
			return;
		}

		if (tool === Tool.PAN) {
			canvas.style.cursor = CursorStyles.GRAB;
		} else if (tool === Tool.SELECT) {
			canvas.style.cursor = CursorStyles.DEFAULT;
		} else {
			canvas.style.cursor = CursorStyles.CROSSHAIR;
		}
	}, [ canvasRef, tool, mode, isSpacePressed ]);
}