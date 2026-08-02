import { Coordinates2D, Element, HandleHitCandidate, ResizeHandle, SelectionBounds, SelectionGeometry, SelectionHandleGeometry, Shape } from '@/interfaces';
import { getArrowSelectionBounds, getArrowLocalPoints, getArrowCurveHandlePosition, isCurvedArrow } from '../arrows';

const ROTATION_HANDLE_OFFSET = 25;
const ARROW_SELECTION_PADDING = 12;
const SQUARE_HANDLE_SIZE = 8;
const CIRCULAR_HANDLE_RADIUS = 5;
const ROTATION_HANDLE_RADIUS = 6;
const HANDLE_HIT_TOLERANCE = 3;

export function getSelectionGeometry(element: Element, zoom: number): SelectionGeometry {
	if (element.shape === Shape.ARROW) {
		return getArrowSelectionGeometry(element, zoom);
	}

	return getShapeSelectionGeometry(element, zoom);
}

export function getSelectionHandleAtPosition(mouse: Coordinates2D, element: Element, zoom: number): ResizeHandle {
	const geometry = getSelectionGeometry(element, zoom);
	const candidates: HandleHitCandidate[] = [];

	collectSquareHandleCandidates(candidates, mouse, geometry.squareHandles, zoom);
	collectCircularHandleCandidates(candidates, mouse, geometry.circularHandles, zoom);

	if (geometry.rotationHandle) {
		collectRotationHandleCandidate(candidates, mouse, geometry.rotationHandle, zoom);
	}

	if (geometry.bounds) {
		collectEdgeCandidates(candidates, mouse, geometry.bounds, zoom);
	}

	if (candidates.length === 0) {
		return null;
	}

	candidates.sort((first, second) => {
		if (Math.abs(first.distanceSquared - second.distanceSquared) > Number.EPSILON) {
			return first.distanceSquared - second.distanceSquared;
		}

		return first.priority - second.priority;
	});

	return candidates[0].handle;
}

function collectSquareHandleCandidates(
	candidates: HandleHitCandidate[],
	mouse: Coordinates2D,
	handles: SelectionHandleGeometry[],
	zoom: number,
): void {
	const halfHitSize = (SQUARE_HANDLE_SIZE / 2 + HANDLE_HIT_TOLERANCE) / zoom;

	for (const handle of handles) {
		const dx = mouse.x - handle.position.x;

		const dy = mouse.y - handle.position.y;

		if (Math.abs(dx) <= halfHitSize && Math.abs(dy) <= halfHitSize) {
			candidates.push({
				handle: handle.handle,
				distanceSquared: dx * dx + dy * dy,
				priority: 0,
			});
		}
	}
}

function collectCircularHandleCandidates(
	candidates: HandleHitCandidate[],
	mouse: Coordinates2D,
	handles: SelectionHandleGeometry[],
	zoom: number,
): void {
	const hitRadius = (CIRCULAR_HANDLE_RADIUS + HANDLE_HIT_TOLERANCE) / zoom;
	const hitRadiusSquared = hitRadius * hitRadius;

	for (const handle of handles) {
		const dx = mouse.x - handle.position.x;

		const dy = mouse.y - handle.position.y;

		const distanceSquared = dx * dx + dy * dy;

		if (distanceSquared <= hitRadiusSquared) {
			candidates.push({
				handle: handle.handle,
				distanceSquared,
				priority: 1,
			});
		}
	}
}

function collectRotationHandleCandidate(candidates: HandleHitCandidate[], mouse: Coordinates2D, handle: SelectionHandleGeometry, zoom: number): void {
	const hitRadius = (ROTATION_HANDLE_RADIUS + HANDLE_HIT_TOLERANCE) / zoom;
	const dx = mouse.x - handle.position.x;
	const dy = mouse.y - handle.position.y;
	const distanceSquared = dx * dx + dy * dy;

	if (distanceSquared <= hitRadius * hitRadius) {
		candidates.push({
			handle: handle.handle,
			distanceSquared,
			priority: 2,
		});
	}
}

function collectEdgeCandidates(
	candidates: HandleHitCandidate[],
	mouse: Coordinates2D,
	bounds: {
		minX: number;
		minY: number;
		maxX: number;
		maxY: number;
	},
	zoom: number,
): void {
	const tolerance = HANDLE_HIT_TOLERANCE / zoom;
	const isWithinHorizontalRange = mouse.x >= bounds.minX && mouse.x <= bounds.maxX;
	const isWithinVerticalRange = mouse.y >= bounds.minY && mouse.y <= bounds.maxY;

	if (isWithinHorizontalRange && Math.abs(mouse.y - bounds.minY) <= tolerance) {
		candidates.push({
			handle: 'top',
			distanceSquared: (mouse.y - bounds.minY) ** 2,
			priority: 3,
		});
	}

	if (isWithinHorizontalRange && Math.abs(mouse.y - bounds.maxY) <= tolerance) {
		candidates.push({
			handle: 'bottom',
			distanceSquared: (mouse.y - bounds.maxY) ** 2,
			priority: 3,
		});
	}

	if (isWithinVerticalRange && Math.abs(mouse.x - bounds.minX) <= tolerance) {
		candidates.push({
			handle: 'left',
			distanceSquared: (mouse.x - bounds.minX) ** 2,
			priority: 3,
		});
	}

	if (isWithinVerticalRange && Math.abs(mouse.x - bounds.maxX) <= tolerance) {
		candidates.push({
			handle: 'right',
			distanceSquared: (mouse.x - bounds.maxX) ** 2,
			priority: 3,
		});
	}
}

function getShapeSelectionGeometry(element: Element, zoom: number): SelectionGeometry {
	const halfWidth = Math.abs(element.width) / 2;
	const halfHeight = Math.abs(element.height) / 2;
	const bounds: SelectionBounds = {
		minX: -halfWidth,
		minY: -halfHeight,
		maxX: halfWidth,
		maxY: halfHeight,
	};

	return {
		bounds,
		squareHandles: [
			{
				handle: 'top-left',
				position: {
					x: bounds.minX,
					y: bounds.minY,
				},
			},
			{
				handle: 'top-right',
				position: {
					x: bounds.maxX,
					y: bounds.minY,
				},
			},
			{
				handle: 'bottom-right',
				position: {
					x: bounds.maxX,
					y: bounds.maxY,
				},
			},
			{
				handle: 'bottom-left',
				position: {
					x: bounds.minX,
					y: bounds.maxY,
				},
			},
		],
		circularHandles: [],
		rotationHandle: {
			handle: 'rotation',
			position: {
				x: 0,
				y: bounds.minY - ROTATION_HANDLE_OFFSET / zoom,
			},
		},
	};
}

function getArrowSelectionGeometry(element: Element, zoom: number): SelectionGeometry {
	const { start, end } = getArrowLocalPoints(element);
	const curveHandle = getArrowCurveHandlePosition(element);
	const circularHandles: SelectionHandleGeometry[] = [
		{
			handle: 'start',
			position: start,
		},
		{
			handle: 'curve',
			position: curveHandle,
		},
		{
			handle: 'end',
			position: end,
		},
	];

	if (!isCurvedArrow(element)) {
		return {
			squareHandles: [],
			circularHandles,
		};
	}

	const bounds = getArrowSelectionBounds(element);
	const padding = ARROW_SELECTION_PADDING / zoom;
	const minX = bounds.minX - padding;
	const minY = bounds.minY - padding;
	const maxX = bounds.maxX + padding;
	const maxY = bounds.maxY + padding;
	const centerX = (minX + maxX) / 2;

	return {
		bounds: {
			minX,
			minY,
			maxX,
			maxY,
		},	
		squareHandles: [
			{
				handle: 'top-left',
				position: {
					x: minX,
					y: minY,
				},
			},
			{
				handle: 'top-right',
				position: {
					x: maxX,
					y: minY,
				},
			},
			{
				handle: 'bottom-left',
				position: {
					x: minX,
					y: maxY,
				},
			},
			{
				handle: 'bottom-right',
				position: {
					x: maxX,
					y: maxY,
				},
			},
		],
		circularHandles,
		rotationHandle: {
			handle: 'rotation',
			position: {
				x: centerX,
				y: minY - ROTATION_HANDLE_OFFSET / zoom,
			},
		},
	};
}
