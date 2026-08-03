import { Dispatch, RefObject, SetStateAction, MouseEvent as ReactMouseEvent } from 'react';

import { Coordinates2D, Element, Interaction, SelectionBox, Tool, WhiteboardAction } from '@/interfaces';

export interface UseCommonWhiteboardInteractionsParams {
   canvasRef: RefObject<HTMLCanvasElement | null>;
   interaction: Interaction;
   tool: Tool;
   pan: Coordinates2D;
   zoom: number;
   isSpacePressed: boolean;
   setPan: Dispatch<SetStateAction<Coordinates2D>>;
   dispatchWhiteBoardState: Dispatch<WhiteboardAction>;
}

interface EditableWhiteboardInteractionProps {
   elements: Element[];
   selectedIds: string[];
   selectionBox: SelectionBox | null;
   isShiftPressed: boolean;
   isCtrlOrMetaPressed: boolean;
   editing: {
      documentRevision: number;
      recordSnapshot: (snapshot: Element[]) => void;
      isAltPressed: boolean;
   };
}

export interface ReadonlyWhiteboardInteractionsProps extends UseCommonWhiteboardInteractionsParams {
   mode: 'readonly';
}

export interface EditableWhiteboardInteractionsProps extends UseCommonWhiteboardInteractionsParams, EditableWhiteboardInteractionProps {
   mode: 'editable';
}

export type UseWhiteboardInteractionsParams = ReadonlyWhiteboardInteractionsProps | EditableWhiteboardInteractionsProps;

export interface UseCommonWhiteboardInteractionsResult {
   tryHandleMouseDown: (event: ReactMouseEvent<HTMLCanvasElement>) => boolean;
   tryHandleMouseMove: (event: ReactMouseEvent<HTMLCanvasElement>) => boolean;
   handleMouseUp: VoidFunction;
   cancelInteraction: VoidFunction;
   resetCursor: VoidFunction;
}

export interface UseWhiteboardInteractionsResult {
   handleMouseDown: (event: ReactMouseEvent<HTMLCanvasElement>) => void;
   handleMouseMove: (event: ReactMouseEvent<HTMLCanvasElement>) => void;
   handleMouseUp: (event: ReactMouseEvent<HTMLCanvasElement>) => void;
   cancelInteraction: VoidFunction;
}