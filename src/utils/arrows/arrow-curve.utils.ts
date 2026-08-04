import { ARROW_CURVE_EPSILON, ARROW_CURVE_MIN_ENDPOINT_DISTANCE, CURVE_HANDLE_T, EPSILON } from '@/constants';
import { Coordinates2D, Element, Shape } from '@/interfaces';
import { getArrowLocalPoints, getQuadraticBezierPoint, getQuadraticControlFromCurvePoint } from './arrow-geometry.utils';

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

	return Math.abs(crossProduct) / length > ARROW_CURVE_EPSILON;
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

	const control = getQuadraticControlFromCurvePoint(start, { x: curveHandleX, y: curveHandleY }, end, CURVE_HANDLE_T);

	return normalizeArrowCurve({
		...element,
		curveOffset: control,
	});
}

export function normalizeArrowCurve(element: Element): Element {
	if (element.shape !== Shape.ARROW || !element.curveOffset || isCurvedArrow(element)) {
		return element;
	}

	return {
		...element,
		curveOffset: undefined,
	};
}