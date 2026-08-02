import { Coordinates2D, Element, ResizeHandle, Shape, Tool } from './whiteboard.interfaces';

export enum Interaction {
	IDLE = 'idle',
	SELECTING = 'selecting',
	MOVING = 'moving',
	RESIZING = 'resizing',
	DRAWING = 'drawing',
	PANNING = 'panning',
}

export interface CursorContext {
	tool: Tool;
	interaction: Interaction;
	isSpacePressed: boolean;
	isHoveringElement: boolean;
	activeHandle: ResizeHandle;
	hoveredHandle: ResizeHandle;
	selectedElement?: Element;
}

export interface PendingDrawing {
	x: number;
	y: number;
	shape: Shape;
}

export type SelectionHandleStyle = 'square' | 'circle';

export interface SelectionHandleGeometry {
	handle: Exclude<ResizeHandle, null>;
	position: Coordinates2D;
}

export interface SelectionBounds {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

export interface SelectionGeometry {
	bounds?: SelectionBounds;
	squareHandles: SelectionHandleGeometry[];
	circularHandles: SelectionHandleGeometry[];
	rotationHandle?: SelectionHandleGeometry;
}

export interface HandleHitCandidate {
	handle: Exclude<ResizeHandle, null>;
	distanceSquared: number;
	priority: number;
}