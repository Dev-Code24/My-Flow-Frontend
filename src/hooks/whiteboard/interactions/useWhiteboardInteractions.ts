import { MouseEvent as ReactMouseEvent } from 'react';

import { Interaction, Tool } from '@/interfaces';

import { useCommonWhiteboardInteractions } from './useCommonWhiteboardInteractions';
import { useEditableWhiteboardInteractions } from './useEditableWhiteboardInteractions';
import { UseWhiteboardInteractionsParams, UseWhiteboardInteractionsResult } from './interfaces';

export function useWhiteboardInteractions(props: UseWhiteboardInteractionsParams): UseWhiteboardInteractionsResult {
   const common = useCommonWhiteboardInteractions({
      canvasRef: props.canvasRef,
      interaction: props.interaction,
      tool: props.tool,
      pan: props.pan,
      zoom: props.zoom,
      isSpacePressed: props.isSpacePressed,
      setPan: props.setPan,
      dispatchWhiteBoardState: props.dispatchWhiteBoardState,
   });

   const editableProps =
      props.mode === 'editable'
         ? {
            elements: props.elements,
            interaction: props.interaction,
            selectedIds: props.selectedIds,
            selectionBox: props.selectionBox,
            tool: props.tool,
            pan: props.pan,
            zoom: props.zoom,
            isShiftPressed: props.isShiftPressed,
            isCtrlOrMetaPressed: props.isCtrlOrMetaPressed,
            isSpacePressed: props.isSpacePressed,
            dispatchWhiteBoardState: props.dispatchWhiteBoardState,
            documentRevision: props.editing.documentRevision,
            recordSnapshot: props.editing.recordSnapshot,
            isAltPressed: props.editing.isAltPressed,
         }
         : null;

   const editable = useEditableWhiteboardInteractions(props.canvasRef, editableProps);

   function handleMouseDown(event: ReactMouseEvent<HTMLCanvasElement>): void {
      if (common.tryHandleMouseDown(event)) {
         return;
      }

      editable.handleMouseDown(event);
   }

   function handleMouseMove(event: ReactMouseEvent<HTMLCanvasElement>): void {
      if (common.tryHandleMouseMove(event)) {
         return;
      }

      editable.handleMouseMove(event);
   }

   function handleMouseUp(event: ReactMouseEvent<HTMLCanvasElement>): void {
      if (props.interaction === Interaction.PANNING) {
         common.handleMouseUp();
         return;
      }

      editable.handleMouseUp(event);

      if (props.mode === 'readonly') {
         common.resetCursor();
      }
   }

   function cancelInteraction(): void {
      if (props.mode === 'readonly') {
         common.cancelInteraction();
         return;
      }

      if (props.interaction === Interaction.PANNING) {
         common.cancelInteraction();
      } else {
         editable.cancelInteraction();
      }

      props.dispatchWhiteBoardState({
         type: 'CHANGE_TOOL',
         tool: Tool.SELECT,
      });
   }

   return {
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      cancelInteraction,
   };
}
