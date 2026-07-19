export enum Shape {
  RECTANGLE = 'rectangle',
  RHOMBUS = 'rhombus',
  OVAL = 'oval'
}

export enum Tool {
  SELECT = 'select',
  PAN = 'pan',
  DRAW_RECTANGLE = 'draw-rectangle',
  DRAW_RHOMBUS = 'draw-rhombus',
  DRAW_OVAL = 'draw-oval',
}

export interface Element {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  fill: boolean;
  shape: Shape;
};

export interface Coordinates2D {
  x: number;
  y: number;
}

export type ResizeHandle =
  'top-left' | 'bottom-right' | 'top-right' | 'bottom-left' | 'rotation' |
  'top' | 'bottom' | 'left' | 'right' | null;

export enum Interaction {
  IDLE = 'idle',
  SELECTING = 'selecting',
  MOVING = 'moving',
  RESIZING = 'resizing',
  DRAWING = 'drawing',
  PANNING = 'panning'
}

export * from './hooks-props.interfaces';
export * from './states.interfaces';