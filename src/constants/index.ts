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
export * from './arrows.constants';