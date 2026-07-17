import { Dispatch, MouseEvent as ReactMouseEvent, RefObject, SetStateAction, useRef, useState } from "react";
import { Coordinates2D, Element, Interaction, ResizeHandle, Tool, WhiteboardAction, WhiteboardMode, WhiteboardState } from "@/interfaces";
import { CORNER_HANDLES, CursorStyles } from "@/constants";
import { constrainResizeToAspectRatio, getCanvasPoint, getCursorForHandle, getHandleAtPosition, getInitialDrawingDimensions, getResizeAnchor, getShapeFromTool, isDrawingTool, isMouseOnElement, updateElementPropertiesUsingHandles, findTopmostElementAtPosition, hasCrossedDrawingThreshold } from "@/utils";

interface UseWhiteboardInteractionsParams {
	mode: WhiteboardMode;
	canvasRef: RefObject<HTMLCanvasElement | null>;
	elements: Element[];
	interaction: Interaction;
	selectedIds: string[];
	selectionBox: WhiteboardState["selectionBox"];
	tool: Tool;
	pan: Coordinates2D;
	zoom: number;
	isShiftPressed: boolean;
	isSpacePressed: boolean;
	setPan: Dispatch<SetStateAction<Coordinates2D>>;
	dispatchWhiteBoardState: Dispatch<WhiteboardAction>;
}

interface UseWhiteboardInteractionsResult {
	handleMouseDown: (event: ReactMouseEvent<HTMLCanvasElement>) => void;
	handleMouseMove: (event: ReactMouseEvent<HTMLCanvasElement>) => void;
	handleMouseUp: (event: ReactMouseEvent<HTMLCanvasElement>) => void;
}

interface PendingDrawing {
	x: number;
	y: number;
	shape: Element["shape"];
}

const DRAWING_DRAG_THRESHOLD = 3;

export function useWhiteboardInteractions({
	mode,
	canvasRef,
	elements,
	interaction,
	selectedIds,
	selectionBox,
	tool,
	pan,
	zoom,
	isShiftPressed,
	isSpacePressed,
	setPan,
	dispatchWhiteBoardState,
}: UseWhiteboardInteractionsParams): UseWhiteboardInteractionsResult {
	const pendingDrawing = useRef<PendingDrawing | null>(null);
	const hasStartedDrawing = useRef<boolean>(false);
	const lastMousePos = useRef<Coordinates2D>({ x: 0, y: 0 });
	const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
	const [resizeAnchor, setResizeAnchor] = useState<Coordinates2D | null>(null);

	const isReadOnly = mode === "readonly";

	function handleMouseDown(event: ReactMouseEvent<HTMLCanvasElement>): void {
		if (event.button === 1) {
			event.preventDefault();
		}

		const canvas = canvasRef.current;

		if (!canvas) { return; }

		const context = canvas.getContext("2d");

		if (!context) { return; }

		const { x, y, rawX, rawY } = getCanvasPoint(event, canvas, pan, zoom);

		if (isSpacePressed || event.button === 1 || tool === Tool.PAN) {
			dispatchWhiteBoardState({ type: "SET_INTERACTION", interaction: Interaction.PANNING });
			lastMousePos.current = { x: rawX, y: rawY };
			canvas.style.cursor = CursorStyles.GRABBING;

			return;
		}

		if (event.button !== 0 || isReadOnly) { return; }

		const newElementShape = getShapeFromTool(tool);

		if (isDrawingTool(tool) && newElementShape) {
			pendingDrawing.current = {
				x,
				y,
				shape: newElementShape,
			};
		
			hasStartedDrawing.current = false;
		
			return;
		}

		if (tryStartResize(canvas, x, y)) {
			return;
		}

		const clickedElement = findTopmostElementAtPosition(elements, context, x, y);

		if (clickedElement) {
			if (!selectedIds.includes(clickedElement.id)) {
				dispatchWhiteBoardState({ type: "SELECT_ELEMENT", id: clickedElement.id });
			}
			dispatchWhiteBoardState({ type: "SET_INTERACTION", interaction: Interaction.MOVING });
			lastMousePos.current = { x: rawX, y: rawY };
			canvas.style.cursor = CursorStyles.GRABBING;

			return;
		}

		dispatchWhiteBoardState({ type: "START_SELECTION", x, y });
	}

	function handleMouseMove(event: ReactMouseEvent<HTMLCanvasElement>): void {
		const canvas = canvasRef.current;

		if (!canvas) { return; }

		const context = canvas.getContext("2d");

		if (!context) { return; }

		const { x, y, rawX, rawY } = getCanvasPoint(event, canvas, pan, zoom);

		const isMiddleClickPanning = event.buttons === 4;

		if (pendingDrawing.current) {
			const pending = pendingDrawing.current;
			const dx = x - pending.x;
			const dy = y - pending.y;
			const hasCrossedDragThreshold = hasCrossedDrawingThreshold(pending, { x, y }, DRAWING_DRAG_THRESHOLD);
		
			if (!hasStartedDrawing.current && hasCrossedDragThreshold) {
				const dimensions = getInitialDrawingDimensions(dx, dy, isShiftPressed);
		
				const newElement: Element = {
					id: crypto.randomUUID(),
					x: pending.x,
					y: pending.y,
					width: dimensions.width,
					height: dimensions.height,
					angle: 0,
					fill: false,
					shape: pending.shape,
				};
		
				hasStartedDrawing.current = true;
		
				dispatchWhiteBoardState({
					type: "START_DRAW",
					element: newElement,
				});
		
				return;
			}
		
			if (!hasStartedDrawing.current) {
				return;
			}
		}

		if (interaction === Interaction.PANNING || isMiddleClickPanning) {
			handlePanning(canvas, rawX, rawY);
			return;
		}

		if (isReadOnly) {
			canvas.style.cursor = isSpacePressed ? CursorStyles.GRAB : CursorStyles.DEFAULT;
			return;
		}

		updateCursor(canvas, context, x, y);

		if (interaction === Interaction.SELECTING && selectionBox) {
			dispatchWhiteBoardState({ type: "UPDATE_SELECTION", x, y });
			return;
		}

		if (interaction === Interaction.MOVING && selectedIds.length > 0) {
			handleMoving(rawX, rawY);
			return;
		}

		if (interaction === Interaction.DRAWING && isDrawingTool(tool)) {
			handleDrawing(x, y);
			return;
		}

		if (interaction === Interaction.RESIZING && selectedIds.length === 1) {
			handleResizing(x, y);
		}
	}

	function handleMouseUp(event: ReactMouseEvent<HTMLCanvasElement>): void {
		const completedDrawing = hasStartedDrawing.current;
	
		pendingDrawing.current = null;
		hasStartedDrawing.current = false;
	
		setActiveHandle(null);
		setResizeAnchor(null);
	
		dispatchWhiteBoardState({ type: "END_INTERACTION" });
	
		const canvas = canvasRef.current;
	
		if (canvas) {
			if (isReadOnly) {
				canvas.style.cursor = CursorStyles.DEFAULT;
			} else {
				updateCursorAfterMouseUp(canvas, event);
			}
		}
	
		if (!isReadOnly && (completedDrawing || interaction !== Interaction.DRAWING)) {
			dispatchWhiteBoardState({ type: "NORMALIZE_ELEMENTS" });
		}
	}

	function tryStartResize(canvas: HTMLCanvasElement, x: number, y: number): boolean {
		if (selectedIds.length !== 1) {
			return false;
		}

		const selected = elements.find((element) => element.id === selectedIds[0]);

		if (!selected) { return false; }

		const handle = getHandleAtPosition(x, y, selected);

		if (!handle) { return false; }

		const anchor = getResizeAnchor(selected, handle);

		if (anchor) { setResizeAnchor(anchor); }

		setActiveHandle(handle);
		dispatchWhiteBoardState({ type: "SET_INTERACTION", interaction: Interaction.RESIZING });

		canvas.style.cursor = getCursorForHandle(selected.angle, handle, true);

		return true;
	}

	function handlePanning(canvas: HTMLCanvasElement, rawX: number, rawY: number): void {
		canvas.style.cursor = CursorStyles.GRABBING;

		const dx = rawX - lastMousePos.current.x;
		const dy = rawY - lastMousePos.current.y;

		setPan((currentPan) => ({ x: currentPan.x + dx, y: currentPan.y + dy }));

		lastMousePos.current = { x: rawX, y: rawY };
	}

	function handleMoving(rawX: number, rawY: number): void {
		const dx = (rawX - lastMousePos.current.x) / zoom;
		const dy = (rawY - lastMousePos.current.y) / zoom;

		dispatchWhiteBoardState({ type: "MOVE_SELECTED", dx, dy });
		lastMousePos.current = { x: rawX, y: rawY };
	}

	function handleDrawing(x: number, y: number): void {
		dispatchWhiteBoardState({
			type: "SET_ELEMENTS",
			updater: (currentElements) =>
				currentElements.map((element) => {
					if (element.id !== selectedIds[0]) {
						return element;
					}
	
					const dimensions = getInitialDrawingDimensions(x - element.x, y - element.y, isShiftPressed);
	
					return {
						...element,
						width: dimensions.width,
						height: dimensions.height,
					};
				}),
		});
	}

	function handleResizing(x: number, y: number): void {
		let effectiveMouseX = x;
		let effectiveMouseY = y;

		const isCornerHandle = activeHandle !== null && CORNER_HANDLES.includes(activeHandle);

		if (isShiftPressed && resizeAnchor && isCornerHandle) {
			const selected = elements.find((element) => element.id === selectedIds[0]);

			if (selected) {
				const constrainedMouse = constrainResizeToAspectRatio(selected, x, y, resizeAnchor);

				effectiveMouseX = constrainedMouse.x;
				effectiveMouseY = constrainedMouse.y;
			}
		}

		dispatchWhiteBoardState({
			type: "SET_ELEMENTS",
			updater: (currentElements) =>
				currentElements.map((element) => {
					if (element.id !== selectedIds[0]) {
						return element;
					}

					return updateElementPropertiesUsingHandles(activeHandle, element, effectiveMouseX, effectiveMouseY, resizeAnchor);
				}),
		});
	}

	function updateCursor(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, x: number, y: number): void {
		const isHoveringShape = elements.some((element) => isMouseOnElement(x, y, element, context));

		let hoveredHandle: ResizeHandle = null;

		if (
			selectedIds.length === 1 &&
			tool === Tool.SELECT &&
			!isSpacePressed &&
			interaction !== Interaction.MOVING &&
			interaction !== Interaction.RESIZING
		) {
			const selected = elements.find((element) => element.id === selectedIds[0]);

			if (selected) {
				hoveredHandle = getHandleAtPosition(x, y, selected);
			}
		}

		const visibleHandle = activeHandle ?? hoveredHandle;
		const selectedElement = selectedIds.length === 1 ? elements.find((element) => element.id === selectedIds[0]) : undefined;

		if (interaction === Interaction.MOVING) {
			canvas.style.cursor = CursorStyles.GRABBING;
			return;
		}

		if (visibleHandle && selectedElement) {
			canvas.style.cursor = getCursorForHandle(selectedElement.angle, visibleHandle, activeHandle !== null);
			return;
		}

		if (isSpacePressed || tool === Tool.PAN || (isHoveringShape && tool === Tool.SELECT)) {
			canvas.style.cursor = CursorStyles.GRAB;
			return;
		}

		if (!isSpacePressed) {
			canvas.style.cursor = tool === Tool.SELECT ? CursorStyles.DEFAULT : CursorStyles.CROSSHAIR;
		}
	}

	function updateCursorAfterMouseUp(canvas: HTMLCanvasElement, event: ReactMouseEvent<HTMLCanvasElement>): void {
		const context = canvas.getContext("2d");

		const { x, y } = getCanvasPoint(event, canvas, pan, zoom);

		let nextCursor = tool === Tool.SELECT ? CursorStyles.DEFAULT : CursorStyles.CROSSHAIR;

		if (tool === Tool.SELECT && selectedIds.length === 1 && context) {
			const selected = elements.find((element) => element.id === selectedIds[0]);

			if (selected) {
				const hoveredHandle = getHandleAtPosition(x, y, selected);

				if (hoveredHandle) {
					nextCursor = getCursorForHandle(selected.angle, hoveredHandle, false);
				} else if (isMouseOnElement(x, y, selected, context)) {
					nextCursor = CursorStyles.GRAB;
				}
			}
		}

		canvas.style.cursor = nextCursor;
	}

	return {
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
	};
}