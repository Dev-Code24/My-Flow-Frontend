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