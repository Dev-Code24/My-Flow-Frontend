import { Coordinates2D, Element, ResizeHandle, Shape, CornerHandles, BoundsResizeHandle } from '@/interfaces';
import { MIN_SHAPE_SIZE } from '@/constants';
import { isMouseOnArrow, updateArrowCurve, updateStraightArrowEndpoint } from '../arrows';
import { getSelectionHandleAtPosition } from '../elements';

export function getHandleAtPosition(mouseX: number, mouseY: number, element: Element, zoom: number): ResizeHandle {
	const centerX = element.x + element.width / 2;
	const centerY = element.y + element.height / 2;
	const dx = mouseX - centerX;
	const dy = mouseY - centerY;
	const cos = Math.cos(-element.angle);
	const sin = Math.sin(-element.angle);
	const localMouse: Coordinates2D = { x: dx * cos - dy * sin, y: dx * sin + dy * cos };

	return getSelectionHandleAtPosition(localMouse, element, zoom);
}

export function getResizeAnchor(element: Element, handle: ResizeHandle): Coordinates2D | null {
	const centerX = element.x + element.width / 2;
	const centerY = element.y + element.height / 2;
	const halfWidth = element.width / 2;
	const halfHeight = element.height / 2;

	function toGlobalCoordinates(localX: number, localY: number): Coordinates2D {
		return {
			x: centerX + localX * Math.cos(element.angle) - localY * Math.sin(element.angle),
			y: centerY + localX * Math.sin(element.angle) + localY * Math.cos(element.angle),
		};
	}

	switch (handle) {
		case 'top-left':
		case 'top':
		case 'left':
			return toGlobalCoordinates(halfWidth, halfHeight);

		case 'top-right':
			return toGlobalCoordinates(-halfWidth, halfHeight);

		case 'bottom-right':
		case 'bottom':
		case 'right':
			return toGlobalCoordinates(-halfWidth, -halfHeight);

		case 'bottom-left':
			return toGlobalCoordinates(halfWidth, -halfHeight);

		case 'start':
			return toGlobalCoordinates(halfWidth, halfHeight);

		case 'end':
			return toGlobalCoordinates(-halfWidth, -halfHeight);

		default:
			return null;
	}
}

export function constrainResizeToAspectRatio(element: Element, mouseX: number, mouseY: number, anchor: Coordinates2D): Coordinates2D {
	const aspectRatio = Math.abs(element.width / element.height);
	const dx = mouseX - anchor.x;
	const dy = mouseY - anchor.y;
	const localDX = dx * Math.cos(-element.angle) - dy * Math.sin(-element.angle);
	const localDY = dx * Math.sin(-element.angle) + dy * Math.cos(-element.angle);
	const constrainedDY = (localDY < 0 ? -1 : 1) * (Math.abs(localDX) / aspectRatio);

	return {
		x: anchor.x + (localDX * Math.cos(element.angle) - constrainedDY * Math.sin(element.angle)),
		y: anchor.y + (localDX * Math.sin(element.angle) + constrainedDY * Math.cos(element.angle)),
	};
}

export function findTopmostElementAtPosition(elements: Element[], context: CanvasRenderingContext2D, x: number, y: number): Element | undefined {
	for (let index = elements.length - 1; index >= 0; index--) {
		const element = elements[index];

		if (isMouseOnElement(x, y, element, context)) {
			return element;
		}
	}

	return undefined;
}

export function isMouseOnElement(mx: number, my: number, el: Element, ctx: CanvasRenderingContext2D): boolean {
	if (el.shape === Shape.ARROW) {
		return isMouseOnArrow(mx, my, el);
	}

	ctx.save();

	const centerX = el.x + el.width / 2;
	const centerY = el.y + el.height / 2;

	ctx.translate(centerX, centerY);
	ctx.rotate(el.angle);

	const halfWidth = Math.abs(el.width) / 2;
	const halfHeight = Math.abs(el.height) / 2;

	ctx.beginPath();

	switch (el.shape) {
		case Shape.RHOMBUS:
			ctx.moveTo(0, -halfHeight);
			ctx.lineTo(halfWidth, 0);
			ctx.lineTo(0, halfHeight);
			ctx.lineTo(-halfWidth, 0);
			ctx.closePath();
			break;

		case Shape.OVAL:
			ctx.ellipse(0, 0, halfWidth, halfHeight, 0, 0, Math.PI * 2);
			break;

		case Shape.RECTANGLE:
			ctx.rect(-halfWidth, -halfHeight, Math.abs(el.width), Math.abs(el.height));
			break;
	}

	let isHit = false;

	if (el.fill) {
		isHit = ctx.isPointInPath(mx, my);
	} else {
		ctx.lineWidth = 15;
		isHit = ctx.isPointInStroke(mx, my);
	}

	ctx.restore();

	return isHit;
}

export function updateElementPropertiesUsingHandles(
	activeHandle: ResizeHandle,
	el: Element,
	mouseX: number,
	mouseY: number,
	anchor: { x: number; y: number } | null,
	isShiftPressed: boolean,
): Element {
	if (activeHandle === 'rotation') {
		return updateRotation(el, mouseX, mouseY, isShiftPressed);
	}

	if (el.shape === Shape.ARROW) {
		if (activeHandle === 'start' || activeHandle === 'end') {
			return updateStraightArrowEndpoint(el, activeHandle, mouseX, mouseY, isShiftPressed);
		}

		if (activeHandle === 'curve') {
			return updateArrowCurve(el, mouseX, mouseY);
		}
	}

	if (!anchor) {
		return el;
	}

	const dx = mouseX - anchor.x;
	const dy = mouseY - anchor.y;
	let localW = dx * Math.cos(-el.angle) - dy * Math.sin(-el.angle);
	let localH = dx * Math.sin(-el.angle) + dy * Math.cos(-el.angle);

	if (activeHandle === 'right') {
		localH = Math.abs(el.height);
	} else if (activeHandle === 'left') {
		localH = -Math.abs(el.height);
	} else if (activeHandle === 'bottom') {
		localW = Math.abs(el.width);
	} else if (activeHandle === 'top') {
		localW = -Math.abs(el.width);
	}

	const signW = localW < 0 ? -1 : 1;
	const signH = localH < 0 ? -1 : 1;

	if (Math.abs(localW) < MIN_SHAPE_SIZE) {
		localW = MIN_SHAPE_SIZE * signW;
	}
	if (Math.abs(localH) < MIN_SHAPE_SIZE) {
		localH = MIN_SHAPE_SIZE * signH;
	}

	const localWVectorX = localW * Math.cos(el.angle);
	const localWVectorY = localW * Math.sin(el.angle);
	const localHVectorX = -localH * Math.sin(el.angle);
	const localHVectorY = localH * Math.cos(el.angle);

	const globalTargetX = anchor.x + localWVectorX + localHVectorX;
	const globalTargetY = anchor.y + localWVectorY + localHVectorY;

	const newCx = (anchor.x + globalTargetX) / 2;
	const newCy = (anchor.y + globalTargetY) / 2;

	return {
		...el,
		width: localW,
		height: localH,
		x: newCx - localW / 2,
		y: newCy - localH / 2,
	};
}

export function updateRotation(
	el: Element,
	mouseX: number,
	mouseY: number,
	isShiftPressed: boolean,
): Element {
	const centerX = el.x + el.width / 2;
	const centerY = el.y + el.height / 2;
	const rawAngle = Math.atan2(mouseY - centerY, mouseX - centerX) + Math.PI / 2;
	const rotationSnapIncrement = Math.PI / 12;
	const angle = isShiftPressed
		? Math.round(rawAngle / rotationSnapIncrement) * rotationSnapIncrement
		: rawAngle;

	return { ...el, angle };
}

export function updateElementByHandle(
	elements: Element[],
	elementId: string,
	activeHandle: ResizeHandle,
	mouse: Coordinates2D,
	resizeAnchor: Coordinates2D | null,
	isShiftPressed: boolean,
): Element[] {
	return elements.map((element) => {
		if (element.id !== elementId) {
			return element;
		}

		return updateElementPropertiesUsingHandles(
			activeHandle,
			element,
			mouse.x,
			mouse.y,
			resizeAnchor,
			isShiftPressed,
		);
	});
}

export function isCornerHandle(handle: ResizeHandle): handle is CornerHandles {
	return handle === 'top-left' || handle === 'top-right' || handle === 'bottom-left' || handle === 'bottom-right';
}

export function isBoundsResizeHandle(handle: ResizeHandle): handle is BoundsResizeHandle {
	return (
		handle === 'top-left' ||
		handle === 'top' ||
		handle === 'top-right' ||
		handle === 'right' ||
		handle === 'bottom-right' ||
		handle === 'bottom' ||
		handle === 'bottom-left' ||
		handle === 'left'
	);
}
