import { ARROW_SELECTION_PADDING, EPSILON } from '@/constants';
import { ArrowBounds, BoundsResizeHandle, Coordinates2D, Element, Shape } from '@/interfaces';
import { isCurvedArrow, normalizeArrowCurve } from './arrow-curve.utils';
import { getArrowLocalPoints, getQuadraticCurveBounds, rotatePoint, worldPointToLocal } from './arrow-geometry.utils';

export function updateArrowBoundsByHandle(
	elements: Element[],
	elementId: string,
	handle: BoundsResizeHandle,
	mouse: Coordinates2D,
	zoom: number,
	isAltPressed: boolean,
	isShiftPressed: boolean,
	resizeStartElement: Element,
): Element[] {
	return elements.map((element) => {
		if (element.id !== elementId || element.shape !== Shape.ARROW) {
			return element;
		}

		return isAltPressed
			? resizeArrowFromCenter(resizeStartElement, handle, mouse, zoom, isShiftPressed)
			: resizeArrowFromBounds(element, handle, mouse, zoom);
	});
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

function resizeArrowFromCenter(element: Element, handle: BoundsResizeHandle, mouse: Coordinates2D, zoom: number, isShiftPressed: boolean): Element {
	const oldBounds = getArrowSelectionBounds(element);
	const elementCenter = {
		x: element.x + element.width / 2,
		y: element.y + element.height / 2,
	};

	const localMouse = worldPointToLocal(mouse, elementCenter, element.angle);

	const padding = ARROW_SELECTION_PADDING / zoom;
	const resizedBoundary = removeSelectionPadding(localMouse, handle, padding);

	const newBounds = getCenteredArrowBounds(oldBounds, handle, resizedBoundary, isShiftPressed);

	const oldWidth = oldBounds.maxX - oldBounds.minX;
	const oldHeight = oldBounds.maxY - oldBounds.minY;

	if (Math.abs(oldWidth) < EPSILON || Math.abs(oldHeight) < EPSILON) {
		return element;
	}

	const { start, control, end } = getArrowLocalPoints(element);
	const newStart = transformPointBetweenBounds(start, oldBounds, newBounds);
	const newControl = transformPointBetweenBounds(control, oldBounds, newBounds);
	const newEnd = transformPointBetweenBounds(end, oldBounds, newBounds);

	return normalizeArrowCurve(rebuildArrowFromLocalPoints(element, newStart, newControl, newEnd));
}

function getCenteredArrowBounds(bounds: ArrowBounds, handle: BoundsResizeHandle, mouse: Coordinates2D, isShiftPressed: boolean): ArrowBounds {
	const centerX = (bounds.minX + bounds.maxX) / 2;
	const centerY = (bounds.minY + bounds.maxY) / 2;
	const originalHalfWidth = (bounds.maxX - bounds.minX) / 2;
	const originalHalfHeight = (bounds.maxY - bounds.minY) / 2;
	let halfWidth = originalHalfWidth;
	let halfHeight = originalHalfHeight;

	if (
		handle === 'left' ||
		handle === 'right' ||
		handle === 'top-left' ||
		handle === 'top-right' ||
		handle === 'bottom-left' ||
		handle === 'bottom-right'
	) {
		halfWidth = Math.abs(mouse.x - centerX);
	}

	if (
		handle === 'top' ||
		handle === 'bottom' ||
		handle === 'top-left' ||
		handle === 'top-right' ||
		handle === 'bottom-left' ||
		handle === 'bottom-right'
	) {
		halfHeight = Math.abs(mouse.y - centerY);
	}

	if (isShiftPressed && isCornerHandleForBounds(handle) && originalHalfWidth > EPSILON && originalHalfHeight > EPSILON) {
		const widthScale = halfWidth / originalHalfWidth;
		const heightScale = halfHeight / originalHalfHeight;
		const scale = Math.max(widthScale, heightScale);

		halfWidth = originalHalfWidth * scale;
		halfHeight = originalHalfHeight * scale;
	}

	return {
		minX: centerX - Math.max(halfWidth, EPSILON),
		minY: centerY - Math.max(halfHeight, EPSILON),
		maxX: centerX + Math.max(halfWidth, EPSILON),
		maxY: centerY + Math.max(halfHeight, EPSILON),
	};
}

function isCornerHandleForBounds(handle: BoundsResizeHandle): boolean {
	return handle === 'top-left' || handle === 'top-right' || handle === 'bottom-left' || handle === 'bottom-right';
}

function resizeArrowFromBounds(element: Element, handle: BoundsResizeHandle, mouse: Coordinates2D, zoom: number): Element {
	const oldBounds = getArrowSelectionBounds(element);
	const center = {
		x: element.x + element.width / 2,
		y: element.y + element.height / 2,
	};

	const localMouse = worldPointToLocal(mouse, center, element.angle);
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

	return normalizeArrowCurve(rebuildArrowFromLocalPoints(element, newStart, newControl, newEnd));
}

function removeSelectionPadding(mouse: Coordinates2D, handle: BoundsResizeHandle, padding: number): Coordinates2D {
	switch (handle) {
		case 'top-left':
			return { x: mouse.x + padding, y: mouse.y + padding };
		case 'top':
			return { x: mouse.x, y: mouse.y + padding };
		case 'top-right':
			return { x: mouse.x - padding, y: mouse.y + padding };
		case 'right':
			return { x: mouse.x - padding, y: mouse.y };
		case 'bottom-right':
			return { x: mouse.x - padding, y: mouse.y - padding };
		case 'bottom':
			return { x: mouse.x, y: mouse.y - padding };
		case 'bottom-left':
			return { x: mouse.x + padding, y: mouse.y - padding };
		case 'left':
			return { x: mouse.x + padding, y: mouse.y };
	}
}

function getResizedArrowBounds(bounds: ArrowBounds, handle: BoundsResizeHandle, mouse: Coordinates2D): ArrowBounds {
	switch (handle) {
		case 'top-left':
			return normalizeBounds({
				minX: mouse.x,
				minY: mouse.y,
				maxX: bounds.maxX,
				maxY: bounds.maxY,
			});
		case 'top':
			return normalizeBounds({ ...bounds, minY: mouse.y });
		case 'top-right':
			return normalizeBounds({
				minX: bounds.minX,
				minY: mouse.y,
				maxX: mouse.x,
				maxY: bounds.maxY,
			});
		case 'right':
			return normalizeBounds({ ...bounds, maxX: mouse.x });
		case 'bottom-right':
			return normalizeBounds({ ...bounds, maxX: mouse.x, maxY: mouse.y });
		case 'bottom':
			return normalizeBounds({ ...bounds, maxY: mouse.y });
		case 'bottom-left':
			return normalizeBounds({
				minX: mouse.x,
				minY: bounds.minY,
				maxX: bounds.maxX,
				maxY: mouse.y,
			});
		case 'left':
			return normalizeBounds({ ...bounds, minX: mouse.x });
	}
}

function normalizeBounds(bounds: ArrowBounds): ArrowBounds {
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

	return {
		x: newBounds.minX + ((point.x - oldBounds.minX) / oldWidth) * newWidth,
		y: newBounds.minY + ((point.y - oldBounds.minY) / oldHeight) * newHeight,
	};
}

function rebuildArrowFromLocalPoints(element: Element, start: Coordinates2D, control: Coordinates2D, end: Coordinates2D): Element {
	const oldCenter = {
		x: element.x + element.width / 2,
		y: element.y + element.height / 2,
	};

	const localCenter = {
		x: (start.x + end.x) / 2,
		y: (start.y + end.y) / 2,
	};

	const rotatedCenterOffset = rotatePoint(localCenter, element.angle);
	const newCenter = {
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
