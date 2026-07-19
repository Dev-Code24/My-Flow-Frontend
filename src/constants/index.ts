import { Interaction, Tool, WhiteboardState } from '@/interfaces';

export enum KeyboardKeys {
   SHIFT = 'shift',
   O = 'o',
   V = 'v',
   R = 'r',
   D = 'd',
   BACKSPACE = 'backspace',
   DELETE = 'delete',
   SPACEBAR = ' ',
   Z = 'z',
   Y = 'y',
};

export const MIN_SHAPE_SIZE = 18;

export const CORNER_HANDLES = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

export enum CursorType {
   POINTER = 'pointer',
	TEXT = 'text',
	NOT_ALLOWED = 'not-allowed',
	DEFAULT = 'default',
	ROTATE = 'rotate',
	GRAB = 'grab',
	GRABBING = 'grabbing',
	EW_RESIZE = 'ew-resize',
	NWSE_RESIZE = 'nwse-resize',
	NS_RESIZE = 'ns-resize',
	NESW_RESIZE = 'nesw-resize',
	CROSSHAIR = 'crosshair',
}

export const initialWhiteBoardState: WhiteboardState = {
   elements: [],
   selectedIds: [],
   selectionBox: null,
   interaction: Interaction.IDLE,
   tool: Tool.SELECT,
   documentRevision: 0,
};