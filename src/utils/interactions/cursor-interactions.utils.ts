import { Coordinates2D, Element, Interaction, ResizeHandle, Tool } from '@/interfaces';
import { getHandleAtPosition, getWhiteboardCursor, isMouseOnElement } from '@/utils';

interface EditableCursorParams {
	elements: Element[];
	selectedElement?: Element;
	tool: Tool;
	interaction: Interaction;
	isSpacePressed: boolean;
	activeHandle: ResizeHandle;
	zoom: number;
}

export function updateEditableWhiteboardCursor(
	canvas: HTMLCanvasElement,
	context: CanvasRenderingContext2D,
	point: Coordinates2D,
	params: EditableCursorParams,
): void {
	const { elements, selectedElement, tool, interaction, isSpacePressed, activeHandle, zoom } = params;
	const isHoveringElement = elements.some((element) => isMouseOnElement(point.x, point.y, element, context));
	let hoveredHandle: ResizeHandle = null;

	if (selectedElement && tool === Tool.SELECT && !isSpacePressed && interaction !== Interaction.MOVING && interaction !== Interaction.RESIZING) {
		hoveredHandle = getHandleAtPosition(point.x, point.y, selectedElement, zoom);
	}

	canvas.style.cursor = getWhiteboardCursor({
		tool,
		interaction,
		isSpacePressed,
		isHoveringElement,
		activeHandle,
		hoveredHandle,
		selectedElement,
	});
}

export function updateEditableCursorAfterMouseUp(
	canvas: HTMLCanvasElement,
	context: CanvasRenderingContext2D,
	point: Coordinates2D,
	params: Omit<EditableCursorParams, 'interaction' | 'activeHandle'>,
): void {
	const { elements, selectedElement, tool, isSpacePressed, zoom } = params;
	const hoveredHandle = selectedElement && tool === Tool.SELECT && !isSpacePressed ? getHandleAtPosition(point.x, point.y, selectedElement, zoom) : null;
	const isHoveringElement = elements.some((element) => isMouseOnElement(point.x, point.y, element, context));

	canvas.style.cursor = getWhiteboardCursor({
		tool,
		interaction: Interaction.IDLE,
		isSpacePressed,
		isHoveringElement,
		activeHandle: null,
		hoveredHandle,
		selectedElement,
	});
}
