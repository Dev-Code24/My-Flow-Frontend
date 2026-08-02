export enum Shape {
	RECTANGLE = 'rectangle',
	RHOMBUS = 'rhombus',
	OVAL = 'oval',
	ARROW = 'arrow',
}

export enum Tool {
	SELECT = 'select',
	PAN = 'pan',
	DRAW_RECTANGLE = 'draw-rectangle',
	DRAW_RHOMBUS = 'draw-rhombus',
	DRAW_OVAL = 'draw-oval',
	DRAW_ARROW = 'draw-arrow',
}

export interface Coordinates2D {
	x: number;
	y: number;
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
	curveOffset?: Coordinates2D;
}

export type CornerHandles = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type BoundsResizeHandle = CornerHandles | 'top' | 'right' | 'bottom' | 'left';
export type ResizeHandle = CornerHandles | 'rotation' | 'top' | 'bottom' | 'left' | 'right' | 'start' | 'end' | 'curve' | null;

export interface ArrowBounds {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}