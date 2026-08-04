import { Coordinates2D, Element } from '@/interfaces';
import {
	getArrowLocalPoints,
	getDistanceFromPointToLineSegment,
	getQuadraticBezierPoint,
	worldPointToLocal,
} from './arrow-geometry.utils';

const HIT_THRESHOLD = 10;
const CURVE_SEGMENTS = 30;

export function isMouseOnArrow(
	mouseX: number,
	mouseY: number,
	element: Element,
): boolean {
	const center = {
		x: element.x + element.width / 2,
		y: element.y + element.height / 2,
	};

	const localMouse = worldPointToLocal(
		{ x: mouseX, y: mouseY },
		center,
		element.angle,
	);

	const { start, control, end } = getArrowLocalPoints(element);

	if (element.curveOffset) {
		return isMouseOnQuadraticCurve(
			localMouse.x,
			localMouse.y,
			start,
			control,
			end,
		);
	}

	return (
		getDistanceFromPointToLineSegment(
			localMouse.x,
			localMouse.y,
			start,
			end,
		) <= HIT_THRESHOLD
	);
}

function isMouseOnQuadraticCurve(
	mouseX: number,
	mouseY: number,
	start: Coordinates2D,
	control: Coordinates2D,
	end: Coordinates2D,
): boolean {
	let previousPoint = start;

	for (let index = 1; index <= CURVE_SEGMENTS; index++) {
		const t = index / CURVE_SEGMENTS;
		const currentPoint = getQuadraticBezierPoint(start, control, end, t);
		const distance = getDistanceFromPointToLineSegment(
			mouseX,
			mouseY,
			previousPoint,
			currentPoint,
		);

		if (distance <= HIT_THRESHOLD) {
			return true;
		}

		previousPoint = currentPoint;
	}

	return false;
}
