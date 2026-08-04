import { CURVE_HANDLE_T } from '@/constants';
import { Coordinates2D, Element, Shape } from '@/interfaces';
import { getArrowCurveHandlePosition, isCurvedArrow, normalizeArrowCurve, updateArrowCurve } from './arrow-curve.utils';
import { getArrowLocalPoints, getQuadraticControlFromCurvePoint, localPointToWorld, snapPointAroundPivot, worldPointToLocal } from './arrow-geometry.utils';
export { getArrowCurveHandlePosition, isCurvedArrow, normalizeArrowCurve, updateArrowCurve } from './arrow-curve.utils';
export { getArrowLocalPoints, getQuadraticBezierPoint } from './arrow-geometry.utils';
export { getArrowSelectionBounds, updateArrowBoundsByHandle } from './arrow-bounds.utils';
export { isMouseOnArrow } from './arrow-hit-testing.utils';

export function updateStraightArrowEndpoint(
	element: Element,
	handle: 'start' | 'end',
	mouseX: number,
	mouseY: number,
	isShiftPressed: boolean,
): Element {
	const { start, control, end } = getArrowLocalPoints(element);
	const oldCenter = getElementCenter(element);
	const worldStart = localPointToWorld(start, oldCenter, element.angle);
	const worldEnd = localPointToWorld(end, oldCenter, element.angle);
	const worldControl = localPointToWorld(control, oldCenter, element.angle);
	const isCurved = isCurvedArrow(element);

	const worldCurveHandle = isCurved ? localPointToWorld(getArrowCurveHandlePosition(element), oldCenter, element.angle) : null;

	const rawDraggedPoint = { x: mouseX, y: mouseY };
	const snapPivot = getEndpointSnapPivot(handle, isCurved, worldCurveHandle, worldStart, worldEnd);

	const draggedPoint = isShiftPressed && snapPivot ? snapPointAroundPivot(rawDraggedPoint, snapPivot) : rawDraggedPoint;

	const newWorldStart = handle === 'start' ? draggedPoint : worldStart;
	const newWorldEnd = handle === 'end' ? draggedPoint : worldEnd;
	const newCenter = {
		x: (newWorldStart.x + newWorldEnd.x) / 2,
		y: (newWorldStart.y + newWorldEnd.y) / 2,
	};

	const localStart = worldPointToLocal(newWorldStart, newCenter, element.angle);

	const localEnd = worldPointToLocal(newWorldEnd, newCenter, element.angle);

	const width = localEnd.x - localStart.x;
	const height = localEnd.y - localStart.y;
	const curveOffset = getUpdatedCurveOffset({
		element,
		isShiftPressed,
		isCurved,
		worldCurveHandle,
		worldControl,
		newCenter,
		width,
		height,
	});

	return normalizeArrowCurve({
		...element,
		x: newCenter.x - width / 2,
		y: newCenter.y - height / 2,
		width,
		height,
		curveOffset,
	});
}

export function updateArrowByHandle(
	elements: Element[],
	elementId: string,
	handle: 'start' | 'end' | 'curve',
	mouse: Coordinates2D,
	isShiftPressed: boolean,
): Element[] {
	return elements.map((element) => {
		if (element.id !== elementId || element.shape !== Shape.ARROW) {
			return element;
		}

		if (handle === 'curve') {
			return updateArrowCurve(element, mouse.x, mouse.y);
		}

		return updateStraightArrowEndpoint(element, handle, mouse.x, mouse.y, isShiftPressed);
	});
}

function getUpdatedCurveOffset({
	element,
	isShiftPressed,
	isCurved,
	worldCurveHandle,
	worldControl,
	newCenter,
	width,
	height,
}: {
	element: Element;
	isShiftPressed: boolean;
	isCurved: boolean;
	worldCurveHandle: Coordinates2D | null;
	worldControl: Coordinates2D;
	newCenter: Coordinates2D;
	width: number;
	height: number;
}): Coordinates2D | undefined {
	if (!element.curveOffset) {
		return undefined;
	}

	if (isShiftPressed && isCurved && worldCurveHandle) {
		const localCurveHandle = worldPointToLocal(worldCurveHandle, newCenter, element.angle);

		return getQuadraticControlFromCurvePoint({ x: -width / 2, y: -height / 2 }, localCurveHandle, { x: width / 2, y: height / 2 }, CURVE_HANDLE_T);
	}

	return worldPointToLocal(worldControl, newCenter, element.angle);
}

function getEndpointSnapPivot(
	handle: 'start' | 'end',
	isCurved: boolean,
	worldCurveHandle: Coordinates2D | null,
	worldStart: Coordinates2D,
	worldEnd: Coordinates2D,
): Coordinates2D {
	if (isCurved && worldCurveHandle) {
		return worldCurveHandle;
	}

	return handle === 'start' ? worldEnd : worldStart;
}

function getElementCenter(element: Element): Coordinates2D {
	return {
		x: element.x + element.width / 2,
		y: element.y + element.height / 2,
	};
}
