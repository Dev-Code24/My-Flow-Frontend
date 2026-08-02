import { Interaction, Tool, WhiteboardState } from '@/interfaces';

export enum KeyboardKeys {
   O = 'o',
   V = 'v',
   R = 'r',
   D = 'd',
   Z = 'z',
   Y = 'y',
   SHIFT = 'shift',
   BACKSPACE = 'backspace',
   DELETE = 'delete',
   SPACEBAR = ' ',
   ALT = 'alt',
   ESCAPE = 'escape',
};

export const EPSILON = 1e-6;
export const MIN_SHAPE_SIZE = 18;
export const ARROW_HANDLE_HIT_THRESHOLD = 15;
export const ARROW_CURVE_MIN_ENDPOINT_DISTANCE = 0.15;
export const ARROW_SELECTION_PADDING = 12;

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

export * from './zoom.constants';