import { ANGLE_SNAP_INCREMENT, MIN_SHAPE_SIZE } from '@/constants';
import { Coordinates2D, Element, PendingDrawing, Shape, Tool } from '@/interfaces';

export function isElementInSelection(el: Element, box: { x1: number; y1: number; x2: number; y2: number }): boolean {
	const minX = Math.min(box.x1, box.x2);
	const maxX = Math.max(box.x1, box.x2);
	const minY = Math.min(box.y1, box.y2);
	const maxY = Math.max(box.y1, box.y2);

	const corners = getElementCorners(el);

	// Inclusive selection: true if all corners are inside the box
	return corners.every((c) => c.x >= minX && c.x <= maxX && c.y >= minY && c.y <= maxY);
}

export function getContentBounds(elements: Element[]): { minValues: Coordinates2D; maxValues: Coordinates2D } {
	const minValues: Coordinates2D = { x: Infinity, y: Infinity };
	const maxValues: Coordinates2D = { x: -Infinity, y: -Infinity };

	elements.forEach((el: Element) => {
		const allCorners: Coordinates2D[] = getElementCorners(el);
		allCorners.forEach((corner) => {
			minValues.x = Math.min(minValues.x, corner.x);
			minValues.y = Math.min(minValues.y, corner.y);
			maxValues.x = Math.max(maxValues.x, corner.x);
			maxValues.y = Math.max(maxValues.y, corner.y);
		});
	});

	return { minValues, maxValues };
}

export function getElementCorners(el: Element) {
	const cx = el.x + el.width / 2;
	const cy = el.y + el.height / 2;
	const hw = el.width / 2;
	const hh = el.height / 2;

	const rotate = (px: number, py: number) => ({
		x: cx + px * Math.cos(el.angle) - py * Math.sin(el.angle),
		y: cy + px * Math.sin(el.angle) + py * Math.cos(el.angle),
	});

	return [
		rotate(-hw, -hh), // Top Left
		rotate(hw, -hh), // Top Right
		rotate(hw, hh), // Bottom Right
		rotate(-hw, hh), // Bottom Left
	];
}

export function isDrawingTool(tool: Tool): tool is Tool.DRAW_RECTANGLE | Tool.DRAW_RHOMBUS | Tool.DRAW_OVAL | Tool.DRAW_ARROW {
	return tool === Tool.DRAW_RECTANGLE || tool === Tool.DRAW_RHOMBUS || tool === Tool.DRAW_OVAL || tool === Tool.DRAW_ARROW;
}

export function getShapeFromTool(tool: Tool): Shape | null {
	switch (tool) {
		case Tool.DRAW_RECTANGLE:
			return Shape.RECTANGLE;
		case Tool.DRAW_RHOMBUS:
			return Shape.RHOMBUS;
		case Tool.DRAW_OVAL:
			return Shape.OVAL;
		case Tool.DRAW_ARROW:
			return Shape.ARROW;
		default:
			return null;
	}
}

export function getDrawingDimensions(
	shape: Shape,
	dx: number,
	dy: number,
	isShiftPressed: boolean,
): {
	width: number;
	height: number;
} {
	if (shape === Shape.ARROW) {
		if (!isShiftPressed) {
			return { width: dx, height: dy };
		}

		return getSnappedArrowDimensions(dx, dy);
	}

	return getInitialDrawingDimensions(dx, dy, isShiftPressed);
}

function getSnappedArrowDimensions(
	dx: number,
	dy: number,
): {
	width: number;
	height: number;
} {
	const length = Math.hypot(dx, dy);

	if (length === 0) {
		return {
			width: 0,
			height: 0,
		};
	}

	const rawAngle = Math.atan2(dy, dx);
	const snappedAngle =
		Math.round(rawAngle / ANGLE_SNAP_INCREMENT) *
		ANGLE_SNAP_INCREMENT;

	return {
		width: length * Math.cos(snappedAngle),
		height: length * Math.sin(snappedAngle),
	};
}

export function getInitialDrawingDimensions(
	rawWidth: number,
	rawHeight: number,
	isShiftPressed: boolean,
): {
	width: number;
	height: number;
} {
	const widthDirection = rawWidth < 0 ? -1 : 1;

	const heightDirection = rawHeight < 0 ? -1 : 1;

	if (isShiftPressed) {
		const side = Math.max(Math.abs(rawWidth), Math.abs(rawHeight), MIN_SHAPE_SIZE);

		return {
			width: widthDirection * side,
			height: heightDirection * side,
		};
	}

	return {
		width: widthDirection * Math.max(Math.abs(rawWidth), MIN_SHAPE_SIZE),
		height: heightDirection * Math.max(Math.abs(rawHeight), MIN_SHAPE_SIZE),
	};
}

export function getElementCenter(element: Element): Coordinates2D {
	return {
		x: element.x + element.width / 2,
		y: element.y + element.height / 2,
	};
}

export function createDrawingElement(pending: PendingDrawing, current: Coordinates2D, isShiftPressed: boolean): Element {
	const dimensions = getDrawingDimensions(pending.shape, current.x - pending.x, current.y - pending.y, isShiftPressed);

	return {
		id: crypto.randomUUID(),
		x: pending.x,
		y: pending.y,
		width: dimensions.width,
		height: dimensions.height,
		angle: 0,
		fill: false,
		shape: pending.shape,
	};
}

export function updateDrawingElement(elements: Element[], elementId: string, mouse: Coordinates2D, isShiftPressed: boolean): Element[] {
	return elements.map((element: Element) => {
		if (element.id !== elementId) {
			return element;
		}

		const dimensions = getDrawingDimensions(element.shape, mouse.x - element.x, mouse.y - element.y, isShiftPressed);

		return {
			...element,
			width: dimensions.width,
			height: dimensions.height,
		};
	});
}
