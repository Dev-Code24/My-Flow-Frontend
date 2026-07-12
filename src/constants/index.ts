import { Interaction, Shape, Tool, WhiteboardState } from "@/interfaces";

export enum KeyboardKeys {
   SHIFT = 'shift',
   O = 'o',
   V = 'v',
   R = 'r',
   D = 'd',
   BACKSPACE = 'backspace',
   SPACEBAR = ' '
};

export const MIN_SHAPE_SIZE = 18;

export const CORNER_HANDLES = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

export enum CursorStyles { 
   DEFAULT = 'default',
   GRAB = 'grab',
   GRABBING = 'grabbing',
   EW_RESIZE = 'ew-resize',
   NWSE_RESIZE = 'nwse-resize',
   NS_RESIZE = 'ns-resize',
   NESW_RESIZE = 'nesw-resize',
   CROSSHAIR = 'crosshair'
};

export const initialWhiteBoardState: WhiteboardState = {
   elements: [
      { id: crypto.randomUUID(), x: 100, y: 100, width: 350, height: 300, angle: 0 , fill: true, shape: Shape.RECTANGLE, },
      { id: crypto.randomUUID(), x: 100, y: 100, width: 350, height: 300, angle: 90 , fill: true, shape: Shape.RECTANGLE, },
      { id: crypto.randomUUID(), x:600, y: 200, width: 350, height: 300, angle: 0, fill: false, shape: Shape.RECTANGLE },
   ],
   selectedIds: [],
   selectionBox: null,
   interaction: Interaction.IDLE,
   tool: Tool.SELECT,
};