import { Coordinates2D, Element, ResizeHandle } from '@/interfaces';
import { isMouseOnElement } from '.';

export function getMouseXY(e: React.MouseEvent, rect: DOMRect): { mouseX: number; mouseY: number } {
	return { mouseX: e.clientX - rect.left, mouseY: e.clientY - rect.top };
}

export function getCanvasPoint(
	e: React.MouseEvent,
	canvas: HTMLCanvasElement,
	pan: Coordinates2D,
	zoom: number,
): {
	rawX: number;
	rawY: number;
	x: number;
	y: number;
} {
	const rect = canvas.getBoundingClientRect();
	const { mouseX, mouseY } = getMouseXY(e, rect);

	return {
		rawX: mouseX,
		rawY: mouseY,
		x: (mouseX - pan.x) / zoom,
		y: (mouseY - pan.y) / zoom,
	};
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

export function hasCrossedDrawingThreshold(start: Coordinates2D, current: Coordinates2D, threshold: number): boolean {
	const dx = current.x - start.x;
	const dy = current.y - start.y;

	return Math.hypot(dx, dy) >= threshold;
}
