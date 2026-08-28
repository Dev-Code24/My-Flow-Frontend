import { Interaction } from './interactions.interfaces';
import { Element, Tool } from './whiteboard.interfaces';

export interface SelectionBox {
   x1: number;
   y1: number;
   x2: number;
   y2: number;
}

export interface WhiteboardState {
   elements: Element[];
   selectedIds: string[];
   selectionBox: SelectionBox | null;
   interaction: Interaction;
   tool: Tool;
   documentRevision: number;
}

export type SelectionMode = 'replace' | 'add' | 'toggle';
export type MarqueeSelectionMode = 'replace' | 'add';

export type WhiteboardAction =
   | {
      type: 'START_DRAW';
      element: Element;
   }
   | {
      type: 'SET_TOOL';
      tool: Tool;
   }
   | {
      type: 'SET_INTERACTION';
      interaction: Interaction;
   }
   | {
      type: 'SELECT_ELEMENT';
      id: string;
      mode: SelectionMode;
   }
   | {
      type: 'CLEAR_SELECTION';
   }
   | {
      type: 'START_SELECTION';
      x: number;
      y: number;
      mode: MarqueeSelectionMode;
   }
   | {
      type: 'UPDATE_SELECTION';
      x: number;
      y: number;
      mode: MarqueeSelectionMode;
      baseSelectedIds: string[];
   }
   | {
      type: 'SET_ELEMENTS';
      updater: (prev: Element[]) => Element[];
   }
   | {
      type: 'MOVE_SELECTED';
      dx: number;
      dy: number;
   }
   | {
      type: 'DUPLICATE_SELECTED';
      elementIds: string[];
   }
   | {
      type: 'RESTORE_INTERACTION_STATE';
      elements: Element[];
      selectedIds: string[];
      documentRevision: number;
   }
   | {
      type: 'END_INTERACTION';
   }
   | {
      type: 'NORMALIZE_ELEMENTS';
   }
   | {
      type: 'CHANGE_TOOL';
      tool: Tool;
   }
   | {
      type: 'DELETE_SELECTED';
   };

export type WhiteboardMode = 'editable' | 'readonly';
