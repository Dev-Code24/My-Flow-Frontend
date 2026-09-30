import { Dispatch, MutableRefObject, useRef } from 'react';

import { Coordinates2D, DocumentMutationLifecycle, Element, Interaction, WhiteboardAction } from '@/interfaces';
import { generateUUID } from "@/lib/utils";

interface PendingElementInteraction {
	elementId: string;
	startRawX: number;
	startRawY: number;
	modifierPressed: boolean;
	wasSelected: boolean;
}

interface UseElementDragInteractionParams {
	selectedIds: string[];
	zoom: number;
	dispatchWhiteBoardState: Dispatch<WhiteboardAction>;
	beginDocumentChange: VoidFunction;
	mutationLifecycle: DocumentMutationLifecycle;
}

interface UseElementDragInteractionResult {
	pendingElementInteraction: MutableRefObject<PendingElementInteraction | null>;
	hasStartedMoving: MutableRefObject<boolean>;
	prepareElementInteraction: (element: Element, rawPoint: Coordinates2D, modifierPressed: boolean) => void;
	tryStartMoving: (rawPoint: Coordinates2D, isAltPressed: boolean, eventAltPressed: boolean) => Promise<boolean>;
	moveSelected: (rawPoint: Coordinates2D) => boolean;
	applyPendingClickSelection: VoidFunction;
	resetElementInteraction: VoidFunction;
}

const MOVING_DRAG_THRESHOLD = 3;

export function useElementDragInteraction({
	selectedIds,
	zoom,
	dispatchWhiteBoardState,
	beginDocumentChange,
	mutationLifecycle,
}: UseElementDragInteractionParams): UseElementDragInteractionResult {
	const pendingElementInteraction = useRef<PendingElementInteraction | null>(null);
	const hasStartedMoving = useRef(false);
	const lastMovePosition = useRef<Coordinates2D>({ x: 0, y: 0 });
	const isStartingMoving = useRef(false);
	const isMutationDenied = useRef(false);

	function prepareElementInteraction(
		element: Element,
		rawPoint: Coordinates2D,
		modifierPressed: boolean,
	): void {
		pendingElementInteraction.current = {
			elementId: element.id,
			startRawX: rawPoint.x,
			startRawY: rawPoint.y,
			modifierPressed,
			wasSelected: selectedIds.includes(element.id),
		};

		hasStartedMoving.current = false;
		isStartingMoving.current = false;
		isMutationDenied.current = false;
	}

	async function tryStartMoving(
		rawPoint: Coordinates2D,
		isAltPressed: boolean,
		eventAltPressed: boolean,
	): Promise<boolean> {
		const pending = pendingElementInteraction.current;

		if (!pending || hasStartedMoving.current) {
			return false;
		}

		const distance = Math.hypot(
			rawPoint.x - pending.startRawX,
			rawPoint.y - pending.startRawY,
		);

		if (distance < MOVING_DRAG_THRESHOLD) {
			return true;
		}

		if (isStartingMoving.current || isMutationDenied.current) {
			return true;
		}

		const isDuplicateInteraction = isAltPressed || eventAltPressed;
		const sourceElementIds = getElementIdsForDrag(pending);
		const duplicateIds: Record<string, string> = {};

		if (isDuplicateInteraction) {
			for (const elementId of sourceElementIds) {
				duplicateIds[elementId] = generateUUID();
			}
		}

		const mutationElementIds = isDuplicateInteraction ? Object.values(duplicateIds) : sourceElementIds;

		isStartingMoving.current = true;

		let accepted: boolean = false;
		try {
		accepted = await mutationLifecycle.beginMutation(mutationElementIds);
		} finally {
			isStartingMoving.current = false;
		}

		if (!accepted) {
			isMutationDenied.current = true;
			return true;
		}

		if (pendingElementInteraction.current !== pending) {
			mutationLifecycle.cancelMutation();
			return true;
		}


		beginDocumentChange();

		if (isDuplicateInteraction) {
			dispatchWhiteBoardState({
				type: 'DUPLICATE_SELECTED',
				elementIds: sourceElementIds,
				duplicateIds,
			});
		} else if (!pending.wasSelected) {
			dispatchWhiteBoardState({
				type: 'SELECT_ELEMENT',
				id: pending.elementId,
				mode: pending.modifierPressed ? 'add' : 'replace',
			});
		}

		hasStartedMoving.current = true;
		lastMovePosition.current = rawPoint;

		dispatchWhiteBoardState({
			type: 'SET_INTERACTION',
			interaction: Interaction.MOVING,
		});

		return true;
	}

	function moveSelected(rawPoint: Coordinates2D): boolean {
		if (!hasStartedMoving.current || selectedIds.length === 0) return false;

		dispatchWhiteBoardState({
			type: 'MOVE_SELECTED',
			dx: (rawPoint.x - lastMovePosition.current.x) / zoom,
			dy: (rawPoint.y - lastMovePosition.current.y) / zoom,
		});

		lastMovePosition.current = rawPoint;
		return true;
	}

	function applyPendingClickSelection(): void {
		const pending = pendingElementInteraction.current;
		if (!pending || hasStartedMoving.current) return;

		if (pending.modifierPressed) {
			dispatchWhiteBoardState({
				type: 'SELECT_ELEMENT',
				id: pending.elementId,
				mode: 'toggle',
			});
		} else if (!pending.wasSelected) {
			dispatchWhiteBoardState({
				type: 'SELECT_ELEMENT',
				id: pending.elementId,
				mode: 'replace',
			});
		}
	}

	function resetElementInteraction(): void {
		pendingElementInteraction.current = null;
		hasStartedMoving.current = false;
		isStartingMoving.current = false;
		isMutationDenied.current = false;
	}

	function getElementIdsForDrag(pending: PendingElementInteraction): string[] {
		if (pending.wasSelected) return selectedIds;

		return pending.modifierPressed ? Array.from(new Set([...selectedIds, pending.elementId])) : [pending.elementId];
	}

	return {
		pendingElementInteraction,
		hasStartedMoving,
		prepareElementInteraction,
		tryStartMoving,
		moveSelected,
		applyPendingClickSelection,
		resetElementInteraction,
	};
}
