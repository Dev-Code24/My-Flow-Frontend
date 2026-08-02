import { ARROW_CURVE_MIN_ENDPOINT_DISTANCE, ARROW_SELECTION_PADDING, EPSILON } from '@/constants';
import { ArrowBounds, Coordinates2D, Element, Shape, BoundsResizeHandle } from '@/interfaces';

const ARROW_CURVE_EPSILON = 0.001;
const CURVE_HANDLE_T = 0.5;

export function getArrowCurveHandlePosition(element: Element): Coordinates2D {
	const { start, control, end } = getArrowLocalPoints(element);

	return getQuadraticBezierPoint(start, control, end, CURVE_HANDLE_T);
}

export function isCurvedArrow(element: Element): boolean {
	if (element.shape !== Shape.ARROW || !element.curveOffset) {
		return false;
	}

	const { start, control, end } = getArrowLocalPoints(element);
	const dx = end.x - start.x;
	const dy = end.y - start.y;
	const length = Math.hypot(dx, dy);

	if (length < EPSILON) {
		return false;
	}

	const crossProduct = dx * (control.y - start.y) - dy * (control.x - start.x);
	const perpendicularDistance = Math.abs(crossProduct) / length;

	return perpendicularDistance > ARROW_CURVE_EPSILON;
}

export function updateArrowBoundsByHandle(
	elements: Element[],
	elementId: string,
	handle: BoundsResizeHandle,
	mouse: Coordinates2D,
	zoom: number,
): Element[] {
	return elements.map((element) => {
		if (element.id !== elementId || element.shape !== Shape.ARROW) {
			return element;
		}

		return resizeArrowFromBounds(element, handle, mouse, zoom);
	});
}

export function updateStraightArrowEndpoint(element: Element, handle: 'start' | 'end', mouseX: number, mouseY: number): Element {
	const { start: localStart, control: localControl, end: localEnd } = getArrowLocalPoints(element);
	const oldCenter: Coordinates2D = { x: element.x + element.width / 2, y: element.y + element.height / 2 };
	const worldStart = localPointToWorld(localStart, oldCenter, element.angle);
	const worldEnd = localPointToWorld(localEnd, oldCenter, element.angle);
	const worldControl = localPointToWorld(localControl, oldCenter, element.angle);
	const draggedPoint: Coordinates2D = { x: mouseX, y: mouseY };
	const newWorldStart = handle === 'start' ? draggedPoint : worldStart;
	const newWorldEnd = handle === 'end' ? draggedPoint : worldEnd;
	const newCenter: Coordinates2D = { x: (newWorldStart.x + newWorldEnd.x) / 2, y: (newWorldStart.y + newWorldEnd.y) / 2 };
	const worldDX = newWorldEnd.x - newWorldStart.x;
	const worldDY = newWorldEnd.y - newWorldStart.y;
	const cos = Math.cos(-element.angle);
	const sin = Math.sin(-element.angle);
	const width = worldDX * cos - worldDY * sin;
	const height = worldDX * sin + worldDY * cos;
	const controlDX = worldControl.x - newCenter.x;
	const controlDY = worldControl.y - newCenter.y;
	const curveOffset = element.curveOffset ? { x: controlDX * cos - controlDY * sin, y: controlDX * sin + controlDY * cos } : undefined;

	return normalizeArrowCurve({
		...element,
		x: newCenter.x - width / 2,
		y: newCenter.y - height / 2,
		width,
		height,
		curveOffset,
	});
}

export function getQuadraticBezierPoint(start: Coordinates2D, control: Coordinates2D, end: Coordinates2D, t: number): Coordinates2D {
	const oneMinusT = 1 - t;

	return {
		x: oneMinusT * oneMinusT * start.x + 2 * oneMinusT * t * control.x + t * t * end.x,
		y: oneMinusT * oneMinusT * start.y + 2 * oneMinusT * t * control.y + t * t * end.y,
	};
}

export function updateArrowCurve(element: Element, mouseX: number, mouseY: number): Element {
	const centerX = element.x + element.width / 2;
	const centerY = element.y + element.height / 2;
	const dx = mouseX - centerX;
	const dy = mouseY - centerY;
	const cos = Math.cos(-element.angle);
	const sin = Math.sin(-element.angle);
	let curveHandleX = dx * cos - dy * sin;
	let curveHandleY = dx * sin + dy * cos;
	const { start, end } = getArrowLocalPoints(element);
	const arrowDX = end.x - start.x;
	const arrowDY = end.y - start.y;
	const arrowLength = Math.hypot(arrowDX, arrowDY);

	if (arrowLength < EPSILON) {
		return element;
	}

	const unitX = arrowDX / arrowLength;
	const unitY = arrowDY / arrowLength;
	const ratioDistance = arrowLength * ARROW_CURVE_MIN_ENDPOINT_DISTANCE;
	const minDistance = Math.min(arrowLength / 2, Math.max(ratioDistance, ARROW_CURVE_MIN_ENDPOINT_DISTANCE));
	const distanceFromStart = (curveHandleX - start.x) * unitX + (curveHandleY - start.y) * unitY;
	const constrainedDistanceFromStart = Math.min(arrowLength - minDistance, Math.max(minDistance, distanceFromStart));
	const correction = constrainedDistanceFromStart - distanceFromStart;

	curveHandleX += correction * unitX;
	curveHandleY += correction * unitY;

	const control = getQuadraticControlFromCurvePoint(
		start,
		{
			x: curveHandleX,
			y: curveHandleY,
		},
		end,
		CURVE_HANDLE_T,
	);

	const updatedElement: Element = {
		...element,
		curveOffset: control,
	};

	return normalizeArrowCurve(updatedElement);
}

export function isMouseOnArrow(mouseX: number, mouseY: number, element: Element): boolean {
	const centerX = element.x + element.width / 2;
	const centerY = element.y + element.height / 2;
	const dx = mouseX - centerX;
	const dy = mouseY - centerY;
	const localMouseX = dx * Math.cos(-element.angle) - dy * Math.sin(-element.angle);
	const localMouseY = dx * Math.sin(-element.angle) + dy * Math.cos(-element.angle);
	const start: Coordinates2D = { x: -element.width / 2, y: -element.height / 2 };
	const end: Coordinates2D = { x: element.width / 2, y: element.height / 2 };

	if (element.curveOffset) {
		return isMouseOnQuadraticCurve(localMouseX, localMouseY, start, element.curveOffset, end);
	}

	const distance = getDistanceFromPointToLineSegment(localMouseX, localMouseY, start, end);
	const HIT_THRESHOLD = 10;

	return distance <= HIT_THRESHOLD;
}

export function updateArrowByHandle(elements: Element[], elementId: string, handle: 'start' | 'end' | 'curve', mouse: Coordinates2D): Element[] {
	return elements.map((element) => {
		if (element.id !== elementId || element.shape !== Shape.ARROW) {
			return element;
		}

		if (handle === 'curve') {
			return updateArrowCurve(element, mouse.x, mouse.y);
		}

		return updateStraightArrowEndpoint(element, handle, mouse.x, mouse.y);
	});
}

export function getArrowLocalPoints(element: Element): {
	start: Coordinates2D;
	control: Coordinates2D;
	end: Coordinates2D;
} {
	const start: Coordinates2D = { x: -element.width / 2, y: -element.height / 2 };
	const end: Coordinates2D = { x: element.width / 2, y: element.height / 2 };
	const control: Coordinates2D = element.curveOffset ?? { x: 0, y: 0 };

	return { start, control, end };
}

export function getArrowSelectionBounds(element: Element): ArrowBounds {
	const { start, control, end } = getArrowLocalPoints(element);

	if (!isCurvedArrow(element)) {
		return {
			minX: Math.min(start.x, end.x),
			minY: Math.min(start.y, end.y),
			maxX: Math.max(start.x, end.x),
			maxY: Math.max(start.y, end.y),
		};
	}

	return getQuadraticCurveBounds(start, control, end);
}

export function normalizeArrowCurve(element: Element): Element {
	if (element.shape !== Shape.ARROW) {
		return element;
	}

	if (!element.curveOffset) {
		return element;
	}

	if (isCurvedArrow(element)) {
		return element;
	}

	return {
		...element,
		curveOffset: undefined,
	};
}

function getQuadraticValue(start: number, control: number, end: number, t: number): number {
	const inverseT = 1 - t;

	return inverseT * inverseT * start + 2 * inverseT * t * control + t * t * end;
}

function getQuadraticExtremumT(start: number, control: number, end: number): number | null {
	const denominator = start - 2 * control + end;

	if (Math.abs(denominator) < EPSILON) {
		return null;
	}

	const t = (start - control) / denominator;

	return t > 0 && t < 1 ? t : null;
}

function getQuadraticCurveBounds(start: Coordinates2D, control: Coordinates2D, end: Coordinates2D): ArrowBounds {
	const xValues: number[] = [start.x, end.x];
	const yValues: number[] = [start.y, end.y];
	const xExtremumT = getQuadraticExtremumT(start.x, control.x, end.x);

	if (xExtremumT !== null) {
		xValues.push(getQuadraticValue(start.x, control.x, end.x, xExtremumT));
	}

	const yExtremumT = getQuadraticExtremumT(start.y, control.y, end.y);

	if (yExtremumT !== null) {
		yValues.push(getQuadraticValue(start.y, control.y, end.y, yExtremumT));
	}

	return {
		minX: Math.min(...xValues),
		minY: Math.min(...yValues),
		maxX: Math.max(...xValues),
		maxY: Math.max(...yValues),
	};
}

function isMouseOnQuadraticCurve(mouseX: number, mouseY: number, start: Coordinates2D, control: Coordinates2D, end: Coordinates2D): boolean {
	const HIT_THRESHOLD = 10;
	const SEGMENTS = 30;

	let previousPoint = start;

	for (let i = 1; i <= SEGMENTS; i++) {
		const t = i / SEGMENTS;
		const currentPoint = getQuadraticBezierPoint(start, control, end, t);
		const distance = getDistanceFromPointToLineSegment(mouseX, mouseY, previousPoint, currentPoint);

		if (distance <= HIT_THRESHOLD) {
			return true;
		}

		previousPoint = currentPoint;
	}

	return false;
}

function getDistanceFromPointToLineSegment(pointX: number, pointY: number, start: Coordinates2D, end: Coordinates2D): number {
	const segmentX = end.x - start.x;
	const segmentY = end.y - start.y;
	const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

	if (segmentLengthSquared === 0) {
		return Math.hypot(pointX - start.x, pointY - start.y);
	}

	const projection = ((pointX - start.x) * segmentX + (pointY - start.y) * segmentY) / segmentLengthSquared;
	const clampedProjection = Math.max(0, Math.min(1, projection));
	const closestX = start.x + clampedProjection * segmentX;
	const closestY = start.y + clampedProjection * segmentY;

	return Math.hypot(pointX - closestX, pointY - closestY);
}

function resizeArrowFromBounds(element: Element, handle: BoundsResizeHandle, mouse: Coordinates2D, zoom: number): Element {
	const oldBounds = getArrowSelectionBounds(element);
	const localMouse = getArrowLocalMousePosition(element, mouse);
	const padding = ARROW_SELECTION_PADDING / zoom;
	const resizedBoundary = removeSelectionPadding(localMouse, handle, padding);
	const newBounds = getResizedArrowBounds(oldBounds, handle, resizedBoundary);
	const oldWidth = oldBounds.maxX - oldBounds.minX;
	const oldHeight = oldBounds.maxY - oldBounds.minY;

	if (Math.abs(oldWidth) < EPSILON || Math.abs(oldHeight) < EPSILON) {
		return element;
	}

	const { start, control, end } = getArrowLocalPoints(element);
	const newStart = transformPointBetweenBounds(start, oldBounds, newBounds);
	const newControl = transformPointBetweenBounds(control, oldBounds, newBounds);
	const newEnd = transformPointBetweenBounds(end, oldBounds, newBounds);
	const resizedElement = rebuildArrowFromLocalPoints(element, newStart, newControl, newEnd);

	return normalizeArrowCurve(resizedElement);
}

function getArrowLocalMousePosition(element: Element, mouse: Coordinates2D): Coordinates2D {
	const centerX = element.x + element.width / 2;
	const centerY = element.y + element.height / 2;
	const dx = mouse.x - centerX;
	const dy = mouse.y - centerY;
	const cos = Math.cos(-element.angle);
	const sin = Math.sin(-element.angle);

	return {
		x: dx * cos - dy * sin,
		y: dx * sin + dy * cos,
	};
}

function removeSelectionPadding(mouse: Coordinates2D, handle: BoundsResizeHandle, padding: number): Coordinates2D {
	switch (handle) {
		case 'top-left':
			return {
				x: mouse.x + padding,
				y: mouse.y + padding,
			};

		case 'top':
			return {
				x: mouse.x,
				y: mouse.y + padding,
			};

		case 'top-right':
			return {
				x: mouse.x - padding,
				y: mouse.y + padding,
			};

		case 'right':
			return {
				x: mouse.x - padding,
				y: mouse.y,
			};

		case 'bottom-right':
			return {
				x: mouse.x - padding,
				y: mouse.y - padding,
			};

		case 'bottom':
			return {
				x: mouse.x,
				y: mouse.y - padding,
			};

		case 'bottom-left':
			return {
				x: mouse.x + padding,
				y: mouse.y - padding,
			};

		case 'left':
			return {
				x: mouse.x + padding,
				y: mouse.y,
			};
	}
}

function getResizedArrowBounds(bounds: ArrowBounds, handle: BoundsResizeHandle, mouse: Coordinates2D): ArrowBounds {
	switch (handle) {
		case 'top-left':
			return normaliseArrowBounds({
				minX: mouse.x,
				minY: mouse.y,
				maxX: bounds.maxX,
				maxY: bounds.maxY,
			});

		case 'top':
			return normaliseArrowBounds({
				minX: bounds.minX,
				minY: mouse.y,
				maxX: bounds.maxX,
				maxY: bounds.maxY,
			});

		case 'top-right':
			return normaliseArrowBounds({
				minX: bounds.minX,
				minY: mouse.y,
				maxX: mouse.x,
				maxY: bounds.maxY,
			});

		case 'right':
			return normaliseArrowBounds({
				minX: bounds.minX,
				minY: bounds.minY,
				maxX: mouse.x,
				maxY: bounds.maxY,
			});

		case 'bottom-right':
			return normaliseArrowBounds({
				minX: bounds.minX,
				minY: bounds.minY,
				maxX: mouse.x,
				maxY: mouse.y,
			});

		case 'bottom':
			return normaliseArrowBounds({
				minX: bounds.minX,
				minY: bounds.minY,
				maxX: bounds.maxX,
				maxY: mouse.y,
			});

		case 'bottom-left':
			return normaliseArrowBounds({
				minX: mouse.x,
				minY: bounds.minY,
				maxX: bounds.maxX,
				maxY: mouse.y,
			});

		case 'left':
			return normaliseArrowBounds({
				minX: mouse.x,
				minY: bounds.minY,
				maxX: bounds.maxX,
				maxY: bounds.maxY,
			});
	}
}

function normaliseArrowBounds(bounds: ArrowBounds): ArrowBounds {
	return {
		minX: Math.min(bounds.minX, bounds.maxX),
		minY: Math.min(bounds.minY, bounds.maxY),
		maxX: Math.max(bounds.minX, bounds.maxX),
		maxY: Math.max(bounds.minY, bounds.maxY),
	};
}

function transformPointBetweenBounds(point: Coordinates2D, oldBounds: ArrowBounds, newBounds: ArrowBounds): Coordinates2D {
	const oldWidth = oldBounds.maxX - oldBounds.minX;
	const oldHeight = oldBounds.maxY - oldBounds.minY;
	const newWidth = newBounds.maxX - newBounds.minX;
	const newHeight = newBounds.maxY - newBounds.minY;
	const relativeX = (point.x - oldBounds.minX) / oldWidth;
	const relativeY = (point.y - oldBounds.minY) / oldHeight;

	return {
		x: newBounds.minX + relativeX * newWidth,
		y: newBounds.minY + relativeY * newHeight,
	};
}

function rebuildArrowFromLocalPoints(element: Element, start: Coordinates2D, control: Coordinates2D, end: Coordinates2D): Element {
	const oldCenter: Coordinates2D = {
		x: element.x + element.width / 2,
		y: element.y + element.height / 2,
	};

	const localCenter: Coordinates2D = {
		x: (start.x + end.x) / 2,
		y: (start.y + end.y) / 2,
	};

	const rotatedCenterOffset = rotatePoint(localCenter, element.angle);

	const newCenter: Coordinates2D = {
		x: oldCenter.x + rotatedCenterOffset.x,
		y: oldCenter.y + rotatedCenterOffset.y,
	};

	const width = end.x - start.x;
	const height = end.y - start.y;

	return {
		...element,
		x: newCenter.x - width / 2,
		y: newCenter.y - height / 2,
		width,
		height,
		curveOffset: {
			x: control.x - localCenter.x,
			y: control.y - localCenter.y,
		},
	};
}

function rotatePoint(point: Coordinates2D, angle: number): Coordinates2D {
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);

	return {
		x: point.x * cos - point.y * sin,
		y: point.x * sin + point.y * cos,
	};
}


function localPointToWorld(point: Coordinates2D, center: Coordinates2D, angle: number): Coordinates2D {
	const rotatedPoint = rotatePoint(point, angle);

	return {
		x: center.x + rotatedPoint.x,
		y: center.y + rotatedPoint.y,
	};
}

function getQuadraticControlFromCurvePoint(start: Coordinates2D, curvePoint: Coordinates2D, end: Coordinates2D, t: number): Coordinates2D {
	const inverseT = 1 - t;
	const controlWeight = 2 * inverseT * t;

	if (Math.abs(controlWeight) < EPSILON) {
		return curvePoint;
	}

	return {
		x: (curvePoint.x - inverseT * inverseT * start.x - t * t * end.x) / controlWeight,
		y: (curvePoint.y - inverseT * inverseT * start.y - t * t * end.y) / controlWeight,
	};
}