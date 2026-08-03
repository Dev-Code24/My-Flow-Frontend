import { Dispatch, MouseEvent as ReactMouseEvent, RefObject, useRef, useState } from 'react';

import { BoundsResizeHandle, Coordinates2D, Element, Interaction, MarqueeSelectionMode, PendingDrawing, ResizeHandle, Shape, Tool, WhiteboardAction, WhiteboardState } from '@/interfaces';
import { CursorType } from '@/constants';
import {
	constrainResizeToAspectRatio,
	createDrawingElement,
	findTopmostElementAtPosition,
	getCanvasPoint,
	getCursorForHandle,
	getCursorStyle,
	getHandleAtPosition,
	getResizeAnchor,
	getShapeFromTool,
	getWhiteboardCursor,
	getIdleWhiteboardCursor,
	hasCrossedDrawingThreshold,
	isBoundsResizeHandle,
	isCornerHandle,
	isDrawingTool,
	isMouseOnElement,
	updateArrowBoundsByHandle,
	updateArrowByHandle,
	updateDrawingElement,
	updateElementByHandle,
} from '@/utils';
import { UseWhiteboardInteractionsResult } from './interfaces';

interface PendingElementInteraction {
	elementId: string;
	startRawX: number;
	startRawY: number;
	modifierPressed: boolean;
	wasSelected: boolean;
}

interface InteractionSnapshot {
	elements: Element[];
	selectedIds: string[];
	documentRevision: number;
}

export interface EditableWhiteboardInteractionsParams {
	elements: Element[];
	interaction: Interaction;
	selectedIds: string[];
	selectionBox: WhiteboardState["selectionBox"];
	tool: Tool;
	pan: Coordinates2D;
	zoom: number;
	isShiftPressed: boolean;
	isCtrlOrMetaPressed: boolean;
	isSpacePressed: boolean;
	documentRevision: number;
	recordSnapshot: (snapshot: Element[]) => void;
	dispatchWhiteBoardState: Dispatch<WhiteboardAction>;
	isAltPressed?: boolean;
}

const DRAWING_DRAG_THRESHOLD = 3;
const MOVING_DRAG_THRESHOLD = 3;

const NOOP_INTERACTIONS: UseWhiteboardInteractionsResult = {
	handleMouseDown: () => {},
	handleMouseMove: () => {},
	handleMouseUp: () => {},
	cancelInteraction: () => {},
};

export function useEditableWhiteboardInteractions(canvasRef: RefObject<HTMLCanvasElement | null>, props: EditableWhiteboardInteractionsParams | null): UseWhiteboardInteractionsResult {
	const pendingDrawing = useRef<PendingDrawing | null>(null);
	const hasStartedDrawing = useRef<boolean>(false);
	const pendingElementInteraction = useRef<PendingElementInteraction | null>(null);
	const hasStartedMoving = useRef<boolean>(false);
	const marqueeSelectionMode = useRef<MarqueeSelectionMode>("replace");
	const selectionAtMarqueeStart = useRef<string[]>([]);
	const interactionSnapshot = useRef<InteractionSnapshot | null>(null);
	const lastMovePosition = useRef<Coordinates2D>({ x: 0, y: 0 });

	const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
	const [resizeAnchor, setResizeAnchor] = useState<Coordinates2D | null>(null);

	if (!props) {
		return NOOP_INTERACTIONS;
	}

	const {
		elements,
		interaction,
		selectedIds,
		selectionBox,
		tool,
		pan,
		zoom,
		isShiftPressed,
		isCtrlOrMetaPressed,
		isSpacePressed,
		isAltPressed = false,
		dispatchWhiteBoardState,
		documentRevision,
		recordSnapshot,
	} = props;

	const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
	const selectedElement = selectedId ? elements.find((element) => element.id === selectedId) : undefined;

	function beginDocumentChange(): void {
		interactionSnapshot.current = {
			elements: structuredClone(elements),
			selectedIds: [...selectedIds],
			documentRevision,
		};
	}

	function commitDocumentChange(): void {
		const snapshot = interactionSnapshot.current;

		if (!snapshot) {
			return;
		}

		if (snapshot.documentRevision !== documentRevision) {
			recordSnapshot(snapshot.elements);
		}

		interactionSnapshot.current = null;
	}

	function resetTransientInteractionState(): void {
		pendingDrawing.current = null;
		hasStartedDrawing.current = false;
		pendingElementInteraction.current = null;
		hasStartedMoving.current = false;
		marqueeSelectionMode.current = "replace";
		selectionAtMarqueeStart.current = [];
		interactionSnapshot.current = null;

		setActiveHandle(null);
		setResizeAnchor(null);
	}

	function cancelInteraction(): void {
		const snapshot = interactionSnapshot.current;
		const hasPendingInteraction =
			pendingDrawing.current !== null ||
			pendingElementInteraction.current !== null ||
			hasStartedDrawing.current ||
			hasStartedMoving.current ||
			activeHandle !== null ||
			interaction !== Interaction.IDLE;

		if (snapshot) {
			dispatchWhiteBoardState({
				type: "RESTORE_INTERACTION_STATE",
				elements: snapshot.elements,
				selectedIds: snapshot.selectedIds,
				documentRevision: snapshot.documentRevision,
			});
		} else if (interaction === Interaction.SELECTING) {
			dispatchWhiteBoardState({
				type: "RESTORE_INTERACTION_STATE",
				elements,
				selectedIds: selectionAtMarqueeStart.current,
				documentRevision,
			});
		} else if (hasPendingInteraction) {
			dispatchWhiteBoardState({ type: "END_INTERACTION" });
		} else if (selectedIds.length > 0) {
			dispatchWhiteBoardState({ type: "CLEAR_SELECTION" });
		}

		resetTransientInteractionState();

		const canvas = canvasRef.current;

		if (canvas) {
			canvas.style.cursor = getIdleWhiteboardCursor(
				tool,
				isSpacePressed,
			);
		}
	}

	function handleMouseDown(event: ReactMouseEvent<HTMLCanvasElement>): void {
		if (event.button !== 0) {
			return;
		}

		const canvas = canvasRef.current;

		if (!canvas) {
			return;
		}

		const context = canvas.getContext("2d");

		if (!context) {
			return;
		}

		const { x, y, rawX, rawY } = getCanvasPoint(event, canvas, pan, zoom);
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
		const modifierPressed = event.ctrlKey || event.metaKey || isCtrlOrMetaPressed;

		if (clickedElement) {
			pendingElementInteraction.current = {
				elementId: clickedElement.id,
				startRawX: rawX,
				startRawY: rawY,
				modifierPressed,
				wasSelected: selectedIds.includes(clickedElement.id),
			};
			hasStartedMoving.current = false;
			return;
		}

		marqueeSelectionMode.current = modifierPressed ? "add" : "replace";
		selectionAtMarqueeStart.current = [...selectedIds];

		dispatchWhiteBoardState({ type: "START_SELECTION", x, y, mode: marqueeSelectionMode.current });
	}

	function handleMouseMove(event: ReactMouseEvent<HTMLCanvasElement>): void {
		const canvas = canvasRef.current;

		if (!canvas) {
			return;
		}

		const context = canvas.getContext("2d");

		if (!context) {
			return;
		}

		const { x, y, rawX, rawY } = getCanvasPoint(event, canvas, pan, zoom);

		if (pendingDrawing.current) {
			const pending = pendingDrawing.current;
			const crossedThreshold = hasCrossedDrawingThreshold(pending, { x, y }, DRAWING_DRAG_THRESHOLD);

			if (!hasStartedDrawing.current && crossedThreshold) {
				beginDocumentChange();

				const newElement = createDrawingElement(pending, { x, y }, isShiftPressed);

				hasStartedDrawing.current = true;
				dispatchWhiteBoardState({ type: "START_DRAW", element: newElement });
				return;
			}

			if (!hasStartedDrawing.current) {
				return;
			}
		}

		if (pendingElementInteraction.current && !hasStartedMoving.current) {
			const pending = pendingElementInteraction.current;
			const distance = Math.hypot(rawX - pending.startRawX, rawY - pending.startRawY);

			if (distance < MOVING_DRAG_THRESHOLD) {
				updateCursor(canvas, context, x, y);
				return;
			}

			beginDocumentChange();

			if (isAltPressed || event.altKey) {
				const elementIdsToDuplicate = getElementIdsForDrag(pending);

				dispatchWhiteBoardState({ type: "DUPLICATE_SELECTED", elementIds: elementIdsToDuplicate });
			} else if (!pending.wasSelected) {
				dispatchWhiteBoardState({
					type: "SELECT_ELEMENT",
					id: pending.elementId,
					mode: pending.modifierPressed ? "add" : "replace",
				});
			}

			hasStartedMoving.current = true;
			lastMovePosition.current = { x: rawX, y: rawY };

			dispatchWhiteBoardState({
				type: "SET_INTERACTION",
				interaction: Interaction.MOVING,
			});

			canvas.style.cursor = getCursorStyle(CursorType.GRABBING);
			return;
		}

		updateCursor(canvas, context, x, y);

		if (interaction === Interaction.SELECTING && selectionBox) {
			dispatchWhiteBoardState({
				type: "UPDATE_SELECTION",
				x,
				y,
				mode: marqueeSelectionMode.current,
				baseSelectedIds: selectionAtMarqueeStart.current,
			});
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
		const completedMoving = hasStartedMoving.current;
		const completedInteraction = interaction;
		const pendingElement = pendingElementInteraction.current;

		if (pendingElement && !completedMoving) {
			if (pendingElement.modifierPressed) {
				dispatchWhiteBoardState({
					type: "SELECT_ELEMENT",
					id: pendingElement.elementId,
					mode: "toggle",
				});
			} else if (!pendingElement.wasSelected) {
				dispatchWhiteBoardState({
					type: "SELECT_ELEMENT",
					id: pendingElement.elementId,
					mode: "replace",
				});
			}
		}

		pendingDrawing.current = null;
		hasStartedDrawing.current = false;
		pendingElementInteraction.current = null;
		hasStartedMoving.current = false;
		marqueeSelectionMode.current = "replace";
		selectionAtMarqueeStart.current = [];

		setActiveHandle(null);
		setResizeAnchor(null);

		dispatchWhiteBoardState({ type: "END_INTERACTION" });

		const canvas = canvasRef.current;

		if (canvas) {
			if (completedMoving || completedInteraction === Interaction.MOVING) {
				canvas.style.cursor = getCursorStyle(CursorType.GRAB);
			} else {
				updateCursorAfterMouseUp(canvas, event);
			}
		}

		if (completedDrawing || completedInteraction !== Interaction.DRAWING) {
			dispatchWhiteBoardState({ type: "NORMALIZE_ELEMENTS" });
		}

		commitDocumentChange();
	}

	function tryStartResize(canvas: HTMLCanvasElement, x: number, y: number): boolean {
		if (!selectedElement) {
			return false;
		}

		const handle = getHandleAtPosition(x, y, selectedElement, zoom);

		if (!handle) {
			return false;
		}

		beginDocumentChange();
		setActiveHandle(handle);

		if (selectedElement.shape !== Shape.ARROW) {
			setResizeAnchor(getResizeAnchor(selectedElement, handle));
		}

		dispatchWhiteBoardState({ type: "SET_INTERACTION", interaction: Interaction.RESIZING });

		canvas.style.cursor = getCursorForHandle(selectedElement.angle, handle);
		return true;
	}

	function getElementIdsForDrag(pending: PendingElementInteraction): string[] {
		if (pending.wasSelected) {
			return selectedIds;
		}

		if (pending.modifierPressed) {
			return Array.from(new Set([...selectedIds, pending.elementId]));
		}

		return [pending.elementId];
	}

	function handleMoving(rawX: number, rawY: number): void {
		const dx = (rawX - lastMovePosition.current.x) / zoom;
		const dy = (rawY - lastMovePosition.current.y) / zoom;

		dispatchWhiteBoardState({
			type: "MOVE_SELECTED",
			dx,
			dy,
		});

		lastMovePosition.current = { x: rawX, y: rawY };
	}

	function handleDrawing(x: number, y: number): void {
		if (!selectedId) {
			return;
		}

		dispatchWhiteBoardState({
			type: "SET_ELEMENTS",
			updater: (currentElements) => updateDrawingElement(currentElements, selectedId, { x, y }, isShiftPressed),
		});
	}

	function handleResizing(x: number, y: number): void {
		if (!selectedElement || !activeHandle) {
			return;
		}

		if (selectedElement.shape === Shape.ARROW) {
			if (activeHandle === "start" || activeHandle === "end" || activeHandle === "curve") {
				handleArrowResizing(x, y, activeHandle);
				return;
			}

			if (isBoundsResizeHandle(activeHandle)) {
				handleArrowBoundsResizing(x, y, activeHandle);
				return;
			}
		}

		let effectiveMouse: Coordinates2D = { x, y };

		if (isShiftPressed && resizeAnchor && isCornerHandle(activeHandle)) {
			effectiveMouse = constrainResizeToAspectRatio(selectedElement, x, y, resizeAnchor);
		}

		dispatchWhiteBoardState({
			type: "SET_ELEMENTS",
			updater: (currentElements) => updateElementByHandle(currentElements, selectedElement.id, activeHandle, effectiveMouse, resizeAnchor),
		});
	}

	function handleArrowBoundsResizing(x: number, y: number, handle: BoundsResizeHandle): void {
		if (!selectedElement) {
			return;
		}

		dispatchWhiteBoardState({
			type: "SET_ELEMENTS",
			updater: (currentElements) => updateArrowBoundsByHandle(currentElements, selectedElement.id, handle, { x, y }, zoom),
		});
	}

	function handleArrowResizing(x: number, y: number, handle: "start" | "end" | "curve"): void {
		if (!selectedElement) {
			return;
		}

		dispatchWhiteBoardState({
			type: "SET_ELEMENTS",
			updater: (currentElements) => updateArrowByHandle(currentElements, selectedElement.id, handle, { x, y }),
		});
	}

	function updateCursor(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, x: number, y: number): void {
		const isHoveringElement = elements.some((element) => isMouseOnElement(x, y, element, context));
		let hoveredHandle: ResizeHandle = null;

		if (selectedElement && tool === Tool.SELECT && !isSpacePressed && interaction !== Interaction.MOVING && interaction !== Interaction.RESIZING) {
			hoveredHandle = getHandleAtPosition(x, y, selectedElement, zoom);
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

	function updateCursorAfterMouseUp(canvas: HTMLCanvasElement, event: ReactMouseEvent<HTMLCanvasElement>): void {
		const context = canvas.getContext("2d");

		if (!context) {
			return;
		}

		const { x, y } = getCanvasPoint(event, canvas, pan, zoom);
		const hoveredHandle = selectedElement && tool === Tool.SELECT && !isSpacePressed ? getHandleAtPosition(x, y, selectedElement, zoom) : null;
		const isHoveringElement = elements.some((element) => isMouseOnElement(x, y, element, context));

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

	return {
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
		cancelInteraction,
	};
}