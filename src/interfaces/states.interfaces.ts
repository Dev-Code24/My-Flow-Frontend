import { Interaction, Tool, Element } from ".";

export interface SelectionBox {
   x1: number;
   y1: number;
   x2: number;
   y2: number;
}

export interface WhiteboardState {
   elements: Element[];
   selectedIds: number[];
   selectionBox: SelectionBox | null;
   interaction: Interaction;
   tool: Tool;
}

export type WhiteboardAction =
   | {
      type: "START_DRAW";
      element: Element;
   }
   | {
      type: "SET_TOOL";
      tool: Tool;
   }
   | {
      type: "SET_INTERACTION";
      interaction: Interaction;
   }
   | {
      type: "SELECT_ELEMENT";
      id: number;
   }
   | {
      type: "CLEAR_SELECTION";
   }
   | {
      type: "START_SELECTION";
      x: number;
      y: number;
   }
   | {
      type: "UPDATE_SELECTION";
      x: number;
      y: number;
   }
   | {
      type: "SET_ELEMENTS";
      updater: (prev: Element[]) => Element[];
   }
   | {
      type: "MOVE_SELECTED";
      dx: number;
      dy: number;
   }
   | {
      type: "END_INTERACTION";
   }
   | {
      type: "NORMALIZE_ELEMENTS";
   }
   | {
      type: "CHANGE_TOOL";
      tool: Tool;
   }
   | {
      type: "DELETE_SELECTED"
   };