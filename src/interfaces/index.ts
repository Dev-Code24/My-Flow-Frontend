export enum Shape {
  RECTANGLE = 'rectangle',
  RHOMBUS = 'rhombus',
}

export enum Tool {
  SELECT = 'select',
  DRAW_RECTANGLE = 'draw-rectangle',
  DRAW_RHOMBUS = 'draw-rhombus',
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
