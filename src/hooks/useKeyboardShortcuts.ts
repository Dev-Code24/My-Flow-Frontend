import { useEffect } from "react";
import { Element, Tool } from "@/interfaces";
import { CursorStyles, KeyboardKeys } from "@/constants";
import { UseKeyboardShortcutsProps } from "@/interfaces/hooks-props.interfaces";

export function useKeyboardShortcuts({
   canvasRef,
   selectedIds,
   dispatchWhiteBoardState,
   setIsSpacePressed,
   setIsShiftPressed
}: UseKeyboardShortcutsProps): void {
   useEffect(() => {
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

         if (key === KeyboardKeys.BACKSPACE && selectedIds.length) {
            // setElements((prev) =>
            //    prev.filter((el) => {
            //    return !selectedIds.includes(el.id);
            // }),
            // );
            // setSelectedIds([]);
            dispatchWhiteBoardState({
               type: 'SET_ELEMENTS', updater: (prev: Element[]) => prev.filter((el) => {
                  return !selectedIds.includes(el.id);
               }),
            });
            dispatchWhiteBoardState({ type: 'SET_SELECTION', ids: [] });
         } else if (key === KeyboardKeys.V) {
            // setTool(Tool.SELECT);
            dispatchWhiteBoardState({ type: 'SET_TOOL', tool: Tool.SELECT });
         } else if (key === KeyboardKeys.D) {
            // setSelectedIds([]);
            // setTool(Tool.DRAW_RECTANGLE);
            dispatchWhiteBoardState({ type: 'SET_SELECTION', ids: [] });
            dispatchWhiteBoardState({ type: 'SET_TOOL', tool: Tool.DRAW_RECTANGLE });
         } else if (key === KeyboardKeys.R) {
            // setSelectedIds([]);
            // setTool(Tool.DRAW_RHOMBUS);
            dispatchWhiteBoardState({ type: 'SET_SELECTION', ids: [] });
            dispatchWhiteBoardState({ type: 'SET_TOOL', tool: Tool.DRAW_RHOMBUS });
         } else if (key === KeyboardKeys.O) {
            // setSelectedIds([]);
            // setTool(Tool.DRAW_OVAL);
            dispatchWhiteBoardState({ type: 'SET_SELECTION', ids: [] });
            dispatchWhiteBoardState({ type: 'SET_TOOL', tool: Tool.DRAW_OVAL });
         } else if (key === KeyboardKeys.SHIFT) {
            setIsShiftPressed(true);
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
   }, [canvasRef, dispatchWhiteBoardState, selectedIds, setIsShiftPressed, setIsSpacePressed]);
}