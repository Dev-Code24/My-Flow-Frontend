import { Dispatch, MouseEvent as ReactMouseEvent, RefObject, useRef } from 'react';

import { Coordinates2D, Element, Interaction, MarqueeSelectionMode, SelectionBox, Tool, WhiteboardAction } from '@/interfaces';
import { CursorType } from '@/constants';
import {
	findTopmostElementAtPosition,
	getCanvasPoint,
	getCursorStyle,
	getIdleWhiteboardCursor,
	getShapeFromTool,
	isDrawingTool,
	updateEditableCursorAfterMouseUp,
	updateEditableWhiteboardCursor,
} from '@/utils';
import { UseWhiteboardInteractionsResult } from './interfaces';
import { useDrawingInteraction } from './useDrawingInteraction';
import { useElementDragInteraction } from './useElementDragInteraction';
import { useInteractionHistory } from './useInteractionHistory';
import { useResizeInteraction } from './useResizeInteraction';

export interface EditableWhiteboardInteractionsParams {
	elements: Element[];
	interaction: Interaction;
	selectedIds: string[];
	selectionBox: SelectionBox | null;
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

const NOOP_INTERACTIONS: UseWhiteboardInteractionsResult = {
	handleMouseDown: () => {},
	handleMouseMove: () => {},
	handleMouseUp: () => {},
	cancelInteraction: () => {},
};

const EMPTY_EDITABLE_INTERACTION_PROPS: EditableWhiteboardInteractionsParams = {
	elements: [],
	interaction: Interaction.IDLE,
	selectedIds: [],
	selectionBox: null,
	tool: Tool.SELECT,
	pan: { x: 0, y: 0 },
	zoom: 1,
	isShiftPressed: false,
	isCtrlOrMetaPressed: false,
	isSpacePressed: false,
	documentRevision: 0,
	recordSnapshot: () => {},
	dispatchWhiteBoardState: () => {},
	isAltPressed: false,
};

export function useEditableWhiteboardInteractions(
	canvasRef: RefObject<HTMLCanvasElement | null>,
	props: EditableWhiteboardInteractionsParams | null,
): UseWhiteboardInteractionsResult {
	const marqueeSelectionMode = useRef<MarqueeSelectionMode>('replace');
	const selectionAtMarqueeStart = useRef<string[]>([]);
	const resolvedProps = props ?? EMPTY_EDITABLE_INTERACTION_PROPS;
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
		documentRevision,
		recordSnapshot,
		dispatchWhiteBoardState,
		isAltPressed = false,
	} = resolvedProps;

	const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
	const selectedElement = selectedId ? elements.find((element) => element.id === selectedId) : undefined;

	const history = useInteractionHistory({
		elements,
		selectedIds,
		documentRevision,
		recordSnapshot,
		dispatchWhiteBoardState,
	});

	const drawing = useDrawingInteraction({
		dispatchWhiteBoardState,
		selectedId,
		isShiftPressed,
		beginDocumentChange: history.beginDocumentChange,
	});

	const dragging = useElementDragInteraction({
		selectedIds,
		zoom,
		dispatchWhiteBoardState,
		beginDocumentChange: history.beginDocumentChange,
	});

	const resizing = useResizeInteraction({
		canvasRef,
		selectedElement,
		zoom,
		isShiftPressed,
		isAltPressed,
		dispatchWhiteBoardState,
		beginDocumentChange: history.beginDocumentChange,
	});

	if (!props) {
		return NOOP_INTERACTIONS;
	}

	function handleMouseDown(event: ReactMouseEvent<HTMLCanvasElement>): void {
		if (event.button !== 0) return;

		const canvas = canvasRef.current;

		if (!canvas) {
			return;
		}

		const context = canvas.getContext('2d');

		if (!context) {
			return;
		}

		const point = getCanvasPoint(event, canvas, pan, zoom);
		const canvasPoint = { x: point.x, y: point.y };
		const shape = getShapeFromTool(tool);

		if (isDrawingTool(tool) && shape) {
			drawing.startDrawing(canvasPoint, shape);
			return;
		}

		if (resizing.tryStartResize(canvasPoint)) { return; }

		const clickedElement = findTopmostElementAtPosition(elements, context, point.x, point.y);
		const modifierPressed = event.ctrlKey || event.metaKey || isCtrlOrMetaPressed;

		if (clickedElement) {
			dragging.prepareElementInteraction(clickedElement, { x: point.rawX, y: point.rawY }, modifierPressed);
			return;
		}

		marqueeSelectionMode.current = modifierPressed ? 'add' : 'replace';
		selectionAtMarqueeStart.current = [...selectedIds];

		dispatchWhiteBoardState({
			type: 'START_SELECTION',
			x: point.x,
			y: point.y,
			mode: marqueeSelectionMode.current,
		});
	}

	function handleMouseMove(event: ReactMouseEvent<HTMLCanvasElement>): void {
		const canvas = canvasRef.current;

		if (!canvas) {
			return;
		}

		const context = canvas.getContext('2d');

		if (!context) {
			return;
		}

		const point = getCanvasPoint(event, canvas, pan, zoom);
		const canvasPoint = { x: point.x, y: point.y };
		const rawPoint = { x: point.rawX, y: point.rawY };

		if (drawing.pendingDrawing.current) {
			if (drawing.tryStartDrawing(canvasPoint)) return;
		}

		if (dragging.pendingElementInteraction.current && !dragging.hasStartedMoving.current) {
			const handled = dragging.tryStartMoving(rawPoint, isAltPressed, event.altKey);

			if (handled) {
				if (dragging.hasStartedMoving.current) {
					canvas.style.cursor = getCursorStyle(CursorType.GRABBING);
				} else {
					updateCursor(canvas, context, canvasPoint);
				}
				return;
			}
		}

		if (interaction === Interaction.SELECTING && selectionBox) {
			dispatchWhiteBoardState({
				type: 'UPDATE_SELECTION',
				x: point.x,
				y: point.y,
				mode: marqueeSelectionMode.current,
				baseSelectedIds: selectionAtMarqueeStart.current,
			});
			return;
		}

		if (interaction === Interaction.MOVING && dragging.moveSelected(rawPoint)) {
			return;
		}

		if (interaction === Interaction.DRAWING && drawing.updateDrawing(canvasPoint)) {
			return;
		}

		if (interaction === Interaction.RESIZING && selectedIds.length === 1 && resizing.resize(canvasPoint)) {
			return;
		}

		updateCursor(canvas, context, canvasPoint);
	}

	function handleMouseUp(event: ReactMouseEvent<HTMLCanvasElement>): void {
		const completedDrawing = drawing.hasStartedDrawing.current;
		const completedMoving = dragging.hasStartedMoving.current;
		const completedInteraction = interaction;

		dragging.applyPendingClickSelection();

		drawing.resetDrawing();
		dragging.resetElementInteraction();
		resizing.resetResize();
		resetMarqueeState();

		dispatchWhiteBoardState({ type: 'END_INTERACTION' });

		const canvas = canvasRef.current;

		if (canvas) {
			const context = canvas.getContext('2d');

			if (!context) {
				history.commitDocumentChange();
				return;
			}

			if (completedMoving || completedInteraction === Interaction.MOVING) {
				canvas.style.cursor = getCursorStyle(CursorType.GRAB);
			} else {
				const point = getCanvasPoint(event, canvas, pan, zoom);

				updateEditableCursorAfterMouseUp(
					canvas,
					context,
					{ x: point.x, y: point.y },
					{
						elements,
						selectedElement,
						tool,
						isSpacePressed,
						zoom,
					},
				);
			}
		}

		if (completedDrawing || completedInteraction !== Interaction.DRAWING) {
			dispatchWhiteBoardState({
				type: 'NORMALIZE_ELEMENTS',
			});
		}

		history.commitDocumentChange();
	}

	function cancelInteraction(): void {
		const hasPendingInteraction =
			drawing.pendingDrawing.current !== null ||
			dragging.pendingElementInteraction.current !== null ||
			drawing.hasStartedDrawing.current ||
			dragging.hasStartedMoving.current ||
			resizing.hasActiveResize ||
			interaction !== Interaction.IDLE;

		if (history.snapshotRef.current) {
			history.restoreDocumentChange();
		} else if (interaction === Interaction.SELECTING) {
			dispatchWhiteBoardState({
				type: 'RESTORE_INTERACTION_STATE',
				elements,
				selectedIds: selectionAtMarqueeStart.current,
				documentRevision,
			});
		} else if (hasPendingInteraction) {
			dispatchWhiteBoardState({ type: 'END_INTERACTION' });
		} else if (selectedIds.length > 0) {
			dispatchWhiteBoardState({ type: 'CLEAR_SELECTION' });
		}

		drawing.resetDrawing();
		dragging.resetElementInteraction();
		resizing.resetResize();
		resetMarqueeState();
		history.clearDocumentChange();

		const canvas = canvasRef.current;
		if (canvas) {
			canvas.style.cursor = getIdleWhiteboardCursor(tool, isSpacePressed);
		}
	}

	function updateCursor(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, point: Coordinates2D): void {
		updateEditableWhiteboardCursor(canvas, context, point, {
			elements,
			selectedElement,
			tool,
			interaction,
			isSpacePressed,
			activeHandle: resizing.activeHandle,
			zoom,
		});
	}

	function resetMarqueeState(): void {
		marqueeSelectionMode.current = 'replace';
		selectionAtMarqueeStart.current = [];
	}

	return {
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
		cancelInteraction,
	};
}
