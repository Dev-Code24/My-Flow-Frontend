import { Coordinates2D, Element, Interaction, Shape, SelectionGeometry, SelectionHandleGeometry } from '@/interfaces';
import { getContentBounds, getElementCenter, getSelectionGeometry } from '../elements';

const HANDLE_SIZE = 8;
const ROTATION_HANDLE_RADIUS = 6;

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
	clearCanvas(ctx, canvas);

	ctx.save();

	applyViewportTransform(ctx, pan, zoom);
	drawElements(ctx, elements, selectedIds, zoom);
	drawMultiSelectionBounds(ctx, elements, selectedIds, zoom);
	drawSelectionMarquee(ctx, selectionBox, interaction);

	ctx.restore();
}

function clearCanvas(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function applyViewportTransform(ctx: CanvasRenderingContext2D, pan: Coordinates2D, zoom: number): void {
	ctx.translate(pan.x, pan.y);
	ctx.scale(zoom, zoom);
}

function drawElements(ctx: CanvasRenderingContext2D, elements: Element[], selectedIds: string[], zoom: number): void {
	elements.forEach((element: Element) => {
		drawElement(ctx, element, selectedIds.includes(element.id), selectedIds.length, zoom);
	});
}

function drawMultiSelectionBounds(ctx: CanvasRenderingContext2D, elements: Element[], selectedIds: string[], zoom: number): void {
	if (selectedIds.length <= 1) {
		return;
	}

	const selectedIdSet = new Set(selectedIds);
	const selectedElements = elements.filter((element: Element) => selectedIdSet.has(element.id));

	if (selectedElements.length <= 1) {
		return;
	}

	const { minValues, maxValues } = getContentBounds(selectedElements);
	const padding = 4 / zoom;

	ctx.save();

	ctx.strokeStyle = '#3b82f6';
	ctx.lineWidth = 1 / zoom;
	ctx.setLineDash([]);

	ctx.strokeRect(minValues.x - padding, minValues.y - padding, maxValues.x - minValues.x + padding * 2, maxValues.y - minValues.y + padding * 2);

	ctx.restore();
}

function drawElement(ctx: CanvasRenderingContext2D, element: Element, isSelected: boolean, selectedElementCount: number, zoom: number): void {
	const center = getElementCenter(element);

	ctx.save();

	ctx.translate(center.x, center.y);
	ctx.rotate(element.angle);

	drawElementPath(ctx, element);
	drawElementFill(ctx, element, isSelected);
	drawElementStroke(ctx, isSelected);

	if (isSelected) {
		drawElementSelection(ctx, element, selectedElementCount, zoom);
	}

	ctx.restore();
}

function drawElementPath(ctx: CanvasRenderingContext2D, element: Element): void {
	const halfWidth = element.width / 2;
	const halfHeight = element.height / 2;

	ctx.beginPath();

	switch (element.shape) {
		case Shape.RECTANGLE:
			drawRectanglePath(ctx, halfWidth, halfHeight, element.width, element.height);
			break;

		case Shape.RHOMBUS:
			drawRhombusPath(ctx, halfWidth, halfHeight);
			break;

		case Shape.OVAL:
			drawOvalPath(ctx, halfWidth, halfHeight);
			break;

		case Shape.ARROW:
			drawArrowPath(ctx, element);
			break;
	}
}

function drawRectanglePath(ctx: CanvasRenderingContext2D, halfWidth: number, halfHeight: number, width: number, height: number): void {
	ctx.rect(-halfWidth, -halfHeight, width, height);
}

function drawRhombusPath(ctx: CanvasRenderingContext2D, halfWidth: number, halfHeight: number): void {
	ctx.moveTo(0, -halfHeight);
	ctx.lineTo(halfWidth, 0);
	ctx.lineTo(0, halfHeight);
	ctx.lineTo(-halfWidth, 0);
	ctx.closePath();
}

function drawOvalPath(ctx: CanvasRenderingContext2D, halfWidth: number, halfHeight: number): void {
	ctx.ellipse(0, 0, Math.abs(halfWidth), Math.abs(halfHeight), 0, 0, Math.PI * 2);
}

function drawArrowPath(ctx: CanvasRenderingContext2D, element: Element): void {
	const start: Coordinates2D = { x: -element.width / 2, y: -element.height / 2 };
	const end: Coordinates2D = { x: element.width / 2, y: element.height / 2 };

	ctx.moveTo(start.x, start.y);

	let arrowHeadAngle: number;

	if (element.curveOffset) {
		const control = element.curveOffset;
		ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
		arrowHeadAngle = Math.atan2(end.y - control.y, end.x - control.x);
	} else {
		ctx.lineTo(end.x, end.y);
		arrowHeadAngle = Math.atan2(end.y - start.y, end.x - start.x);
	}

	drawArrowHead(ctx, end.x, end.y, arrowHeadAngle);
}

function drawArrowHead(ctx: CanvasRenderingContext2D, endX: number, endY: number, angle: number): void {
	const arrowHeadLength = 15;
	const arrowHeadAngle = Math.PI / 6;
	const firstX = endX - arrowHeadLength * Math.cos(angle - arrowHeadAngle);
	const firstY = endY - arrowHeadLength * Math.sin(angle - arrowHeadAngle);
	const secondX = endX - arrowHeadLength * Math.cos(angle + arrowHeadAngle);
	const secondY = endY - arrowHeadLength * Math.sin(angle + arrowHeadAngle);

	ctx.moveTo(firstX, firstY);
	ctx.lineTo(endX, endY);
	ctx.lineTo(secondX, secondY);
}

function drawElementFill(ctx: CanvasRenderingContext2D, element: Element, isSelected: boolean): void {
	if (!element.fill || element.shape === Shape.ARROW) {
		return;
	}

	ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.5)' : 'rgba(0, 0, 0, 0.1)';

	ctx.fill();
}

function drawElementStroke(ctx: CanvasRenderingContext2D, isSelected: boolean): void {
	ctx.strokeStyle = isSelected ? '#3b82f6' : '#000';
	ctx.lineWidth = 2;
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';
	ctx.stroke();
}

function drawElementSelection(ctx: CanvasRenderingContext2D, element: Element, selectedElementCount: number, zoom: number): void {
	if (selectedElementCount !== 1) {
		return;
	}

	const geometry = getSelectionGeometry(element, zoom);

	if (geometry.bounds) {
		const { minX, minY, maxX, maxY } = geometry.bounds;
	
		ctx.save();
		ctx.lineWidth = 1 / zoom;
		ctx.setLineDash([]);
		ctx.strokeRect(
			minX,
			minY,
			maxX - minX,
			maxY - minY,
		);
	
		ctx.restore();
	}

	drawSelectionHandles(ctx, geometry, zoom);
}

function drawSelectionHandles(ctx: CanvasRenderingContext2D, geometry: SelectionGeometry, zoom: number): void {
	ctx.fillStyle = '#3b82f6';

	drawSquareSelectionHandles(ctx, geometry.squareHandles, zoom);
	drawCircularSelectionHandles(ctx, geometry.circularHandles, zoom);

	if (geometry.rotationHandle) {
		drawRotationSelectionHandle(ctx, geometry.rotationHandle.position, zoom);
	}
}

function drawSquareSelectionHandles(ctx: CanvasRenderingContext2D, handles: SelectionHandleGeometry[], zoom: number): void {
	const handleSize = HANDLE_SIZE / zoom;

	const handleOffset = handleSize / 2;

	for (const { position } of handles) {
		drawSquareHandle(ctx, position.x, position.y, handleSize, handleOffset);
	}
}

function drawCircularSelectionHandles(ctx: CanvasRenderingContext2D, handles: SelectionHandleGeometry[], zoom: number): void {
	const handleRadius = 5 / zoom;

	for (const { position } of handles) {
		drawCircularHandle(ctx, position.x, position.y, handleRadius);
	}
}

function drawRotationSelectionHandle(ctx: CanvasRenderingContext2D, position: Coordinates2D, zoom: number): void {
	ctx.beginPath();

	ctx.arc(position.x, position.y, ROTATION_HANDLE_RADIUS / zoom, 0, Math.PI * 2);

	ctx.fill();
}

function drawCircularHandle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, Math.PI * 2);
	ctx.fill();
}

function drawSquareHandle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, offset: number): void {
	ctx.fillRect(x - offset, y - offset, size, size);
}

function drawSelectionMarquee(
	ctx: CanvasRenderingContext2D,
	selectionBox: {
		x1: number;
		y1: number;
		x2: number;
		y2: number;
	} | null,
	interaction: Interaction,
): void {
	if (interaction !== Interaction.SELECTING || !selectionBox) {
		return;
	}

	const x = Math.min(selectionBox.x1, selectionBox.x2);
	const y = Math.min(selectionBox.y1, selectionBox.y2);
	const width = Math.abs(selectionBox.x2 - selectionBox.x1);
	const height = Math.abs(selectionBox.y2 - selectionBox.y1);

	ctx.setLineDash([5, 5]);

	ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
	ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';

	ctx.fillRect(x, y, width, height);
	ctx.strokeRect(x, y, width, height);

	ctx.setLineDash([]);
}