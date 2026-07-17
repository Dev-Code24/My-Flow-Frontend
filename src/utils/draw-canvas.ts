import { Coordinates2D, Element, Interaction, Shape } from '@/interfaces';
import { SharedFlowDocument } from '@/lib/interfaces';

export function drawCanvas(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	elements: Element[],
	pan: Coordinates2D,
	zoom: number,
	selectedIds: string[],
	selectionBox: { x1: number; y1: number; x2: number; y2: number } | null,
	interaction: Interaction,
): void {
	const HANDLE_SIZE = 8;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.save();
	ctx.translate(pan.x, pan.y);
	ctx.scale(zoom, zoom);

	elements.forEach((el) => {
		ctx.save();

		const isSelected = selectedIds.includes(el.id);
		const centerX = el.x + el.width / 2;
		const centerY = el.y + el.height / 2;
		const halfW = el.width / 2;
		const halfH = el.height / 2;

		ctx.translate(centerX, centerY);
		ctx.rotate(el.angle);
		ctx.beginPath();

		if (el.shape === Shape.RHOMBUS) {
			ctx.moveTo(0, -halfH);
			ctx.lineTo(halfW, 0);
			ctx.lineTo(0, halfH);
			ctx.lineTo(-halfW, 0);
			ctx.closePath();
		} else if (el.shape === Shape.OVAL) {
			ctx.ellipse(0, 0, Math.abs(halfW), Math.abs(halfH), 0, 0, Math.PI * 2);
		} else if (el.shape === Shape.RECTANGLE) {
			ctx.rect(-halfW, -halfH, el.width, el.height);
		}

		// Draw Fill
		if (el.fill) {
			ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.5)' : 'rgba(0, 0, 0, 0.1)';
			ctx.fill();
		}

		ctx.strokeStyle = isSelected ? '#3b82f6' : '#000';
		ctx.lineWidth = 2;
		ctx.stroke();

		if (isSelected) {
			// 1. Calculate visual (positive) half-dimensions
			if (selectedIds.length === 1) {
				ctx.fillStyle = '#3b82f6';
				const absHalfW = Math.abs(el.width) / 2;
				const absHalfH = Math.abs(el.height) / 2;
				const vHandle = HANDLE_SIZE / zoom;
				const vOffset = vHandle / 2;

				ctx.fillRect(-absHalfW - vOffset, -absHalfH - vOffset, vHandle, vHandle);
				ctx.fillRect(absHalfW - vOffset, -absHalfH - vOffset, vHandle, vHandle);
				ctx.fillRect(-absHalfW - vOffset, absHalfH - vOffset, vHandle, vHandle);
				ctx.fillRect(absHalfW - vOffset, absHalfH - vOffset, vHandle, vHandle);

				ctx.beginPath();
				ctx.arc(0, -absHalfH - 25 / zoom, 6 / zoom, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		ctx.restore(); // Clean up for the next element
	});

	// creating marquee for selecting elements
	if (interaction === 'selecting' && selectionBox) {
		ctx.setLineDash([5, 5]);
		ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
		ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
		const x = Math.min(selectionBox.x1, selectionBox.x2);
		const y = Math.min(selectionBox.y1, selectionBox.y2);
		const w = Math.abs(selectionBox.x2 - selectionBox.x1);
		const h = Math.abs(selectionBox.y2 - selectionBox.y1);
		ctx.fillRect(x, y, w, h);
		ctx.strokeRect(x, y, w, h);
		ctx.setLineDash([]);
	}

	ctx.restore();
}

export function isValidSharedFlowDocument(value: unknown): value is SharedFlowDocument {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	if (!('schemaVersion' in value) || typeof value.schemaVersion !== 'number') {
		return false;
	}

	if (!('canvas' in value) || typeof value.canvas !== 'object' || value.canvas === null) {
		return false;
	}

	if (!('elements' in value.canvas) || !Array.isArray(value.canvas.elements)) {
		return false;
	}

	return value.canvas.elements.every(isValidElement);
}

function isValidElement(value: unknown): value is Element {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	return (
		'id' in value &&
		typeof value.id === 'string' &&
		'x' in value &&
		typeof value.x === 'number' &&
		Number.isFinite(value.x) &&
		'y' in value &&
		typeof value.y === 'number' &&
		Number.isFinite(value.y) &&
		'width' in value &&
		typeof value.width === 'number' &&
		Number.isFinite(value.width) &&
		'height' in value &&
		typeof value.height === 'number' &&
		Number.isFinite(value.height) &&
		'angle' in value &&
		typeof value.angle === 'number' &&
		Number.isFinite(value.angle) &&
		'fill' in value &&
		typeof value.fill === 'boolean' &&
		'shape' in value &&
		(value.shape === 'rectangle' || value.shape === 'rhombus' || value.shape === 'oval')
	);
}
