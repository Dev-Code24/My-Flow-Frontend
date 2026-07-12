import { useEffect } from "react";
import { Tool } from "@/interfaces";
import { CursorStyles, KeyboardKeys } from "@/constants";
import { UseKeyboardShortcutsProps } from "@/interfaces/hooks-props.interfaces";

export function useKeyboardShortcuts({ canvasRef, dispatchWhiteBoardState, setIsSpacePressed, setIsShiftPressed }: UseKeyboardShortcutsProps): void {
	useEffect(() => {
		const changeTool = (tool: Tool) => {
			dispatchWhiteBoardState({
				type: "CHANGE_TOOL",
				tool,
			});
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.repeat) { return; }

			const key = event.key.toLowerCase();

			if (event.key === KeyboardKeys.SPACEBAR) {
				const canvas = canvasRef.current;
				if (!canvas) { return; }

				event.preventDefault();
				setIsSpacePressed(true);
				canvas.style.cursor = CursorStyles.GRAB;
				return;
			}

			switch (key) {
				case KeyboardKeys.BACKSPACE:
					dispatchWhiteBoardState({
						type: "DELETE_SELECTED",
					});
					return;

				case KeyboardKeys.V:
					changeTool(Tool.SELECT);
					return;

				case KeyboardKeys.D:
					changeTool(Tool.DRAW_RECTANGLE);
					return;

				case KeyboardKeys.R:
					changeTool(Tool.DRAW_RHOMBUS);
					return;

				case KeyboardKeys.O:
					changeTool(Tool.DRAW_OVAL);
					return;

				case KeyboardKeys.SHIFT:
					setIsShiftPressed(true);
					return;
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

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, [canvasRef, dispatchWhiteBoardState, setIsSpacePressed, setIsShiftPressed]);
}
