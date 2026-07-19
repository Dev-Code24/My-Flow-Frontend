import { RefObject, useEffect } from "react";

import { Tool, WhiteboardMode } from "@/interfaces";
import { CursorType } from "@/constants";
import { getCursorStyle } from "@/utils";

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
			canvas.style.cursor = getCursorStyle(CursorType.GRAB);
			return;
		}

		if (mode === "readonly") {
			canvas.style.cursor = getCursorStyle(CursorType.DEFAULT);
			return;
		}

		if (tool === Tool.PAN) {
			canvas.style.cursor = getCursorStyle(CursorType.GRAB);
		} else if (tool === Tool.SELECT) {
			canvas.style.cursor = getCursorStyle(CursorType.DEFAULT);
		} else {
			canvas.style.cursor = getCursorStyle(CursorType.CROSSHAIR);
		}
	}, [ canvasRef, tool, mode, isSpacePressed ]);
}