export enum Shape {
  RECTANGLE = 'rectangle',
  RHOMBUS = 'rhombus',
  OVAL = 'oval'
}

export enum Tool {
  SELECT = 'select',
  DRAW_RECTANGLE = 'draw-rectangle',
  DRAW_RHOMBUS = 'draw-rhombus',
  DRAW_OVAL = 'draw-oval',
}

export interface Element {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  fill: boolean;
  shape: Shape;
};

export type ResizeHandle = 'top-left' | 'bottom-right' | 'top-right' | 'bottom-left' | 'rotation' | null;
