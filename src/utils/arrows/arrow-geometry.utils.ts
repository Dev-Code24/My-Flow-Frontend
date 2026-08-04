import { ANGLE_SNAP_INCREMENT, EPSILON } from '@/constants';
import { ArrowBounds, Coordinates2D, Element } from '@/interfaces';

export function getArrowLocalPoints(element: Element): {
	start: Coordinates2D;
	control: Coordinates2D;
	end: Coordinates2D;
} {
	const start = { x: -element.width / 2, y: -element.height / 2 };
	const end = { x: element.width / 2, y: element.height / 2 };
	const control = element.curveOffset ?? { x: 0, y: 0 };

	return { start, control, end };
}

export function getQuadraticBezierPoint(start: Coordinates2D, control: Coordinates2D, end: Coordinates2D, t: number): Coordinates2D {
	const oneMinusT = 1 - t;

	return {
		x: oneMinusT * oneMinusT * start.x + 2 * oneMinusT * t * control.x + t * t * end.x,
		y: oneMinusT * oneMinusT * start.y + 2 * oneMinusT * t * control.y + t * t * end.y,
	};
}

export function getQuadraticCurveBounds(start: Coordinates2D, control: Coordinates2D, end: Coordinates2D): ArrowBounds {
	const xValues = [start.x, end.x];
	const yValues = [start.y, end.y];
	const xExtremumT = getQuadraticExtremumT(start.x, control.x, end.x);
	const yExtremumT = getQuadraticExtremumT(start.y, control.y, end.y);

	if (xExtremumT !== null) {
		xValues.push(getQuadraticValue(start.x, control.x, end.x, xExtremumT));
	}

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

export function getQuadraticControlFromCurvePoint(start: Coordinates2D, curvePoint: Coordinates2D, end: Coordinates2D, t: number): Coordinates2D {
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

export function rotatePoint(point: Coordinates2D, angle: number): Coordinates2D {
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);

	return {
		x: point.x * cos - point.y * sin,
		y: point.x * sin + point.y * cos,
	};
}

export function localPointToWorld(point: Coordinates2D, center: Coordinates2D, angle: number): Coordinates2D {
	const rotatedPoint = rotatePoint(point, angle);

	return {
		x: center.x + rotatedPoint.x,
		y: center.y + rotatedPoint.y,
	};
}

export function worldPointToLocal(point: Coordinates2D, center: Coordinates2D, angle: number): Coordinates2D {
	const dx = point.x - center.x;
	const dy = point.y - center.y;
	const cos = Math.cos(-angle);
	const sin = Math.sin(-angle);

	return {
		x: dx * cos - dy * sin,
		y: dx * sin + dy * cos,
	};
}

export function snapPointAroundPivot(point: Coordinates2D, pivot: Coordinates2D): Coordinates2D {
	const dx = point.x - pivot.x;
	const dy = point.y - pivot.y;
	const distance = Math.hypot(dx, dy);

	if (distance < EPSILON) {
		return point;
	}

	const rawAngle = Math.atan2(dy, dx);
	const snappedAngle = Math.round(rawAngle / ANGLE_SNAP_INCREMENT) * ANGLE_SNAP_INCREMENT;

	return {
		x: pivot.x + distance * Math.cos(snappedAngle),
		y: pivot.y + distance * Math.sin(snappedAngle),
	};
}

export function getDistanceFromPointToLineSegment(pointX: number, pointY: number, start: Coordinates2D, end: Coordinates2D): number {
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
