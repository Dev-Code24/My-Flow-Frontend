import { Dispatch, RefObject, useRef } from 'react';

import { Element, WhiteboardAction } from '@/interfaces';

interface InteractionSnapshot {
	elements: Element[];
	selectedIds: string[];
	documentRevision: number;
}

interface UseInteractionHistoryParams {
	elements: Element[];
	selectedIds: string[];
	documentRevision: number;
	recordSnapshot: (snapshot: Element[]) => void;
	dispatchWhiteBoardState: Dispatch<WhiteboardAction>;
	onBeginDocumentChange: VoidFunction;
	onCommitDocumentChange: VoidFunction;
	onDiscardDocumentChange: VoidFunction;
}

interface UseInteractionHistoryResult {
	snapshotRef: RefObject<InteractionSnapshot | null>;
	beginDocumentChange: VoidFunction;
	commitDocumentChange: VoidFunction;
	restoreDocumentChange: VoidFunction;
	clearDocumentChange: VoidFunction;
}

export function useInteractionHistory({
	elements,
	selectedIds,
	documentRevision,
	recordSnapshot,
	dispatchWhiteBoardState,
	onBeginDocumentChange,
	onCommitDocumentChange,
	onDiscardDocumentChange,
}: UseInteractionHistoryParams): UseInteractionHistoryResult {
	const snapshotRef = useRef<InteractionSnapshot | null>(null);

	function beginDocumentChange(): void {
		snapshotRef.current = {
			elements: structuredClone(elements),
			selectedIds: [...selectedIds],
			documentRevision,
		};
		onBeginDocumentChange();
	}

	function commitDocumentChange(): void {
		const snapshot = snapshotRef.current;

		if (!snapshot) {
			return;
		}

		if (snapshot.documentRevision !== documentRevision) {
			recordSnapshot(snapshot.elements);
			onCommitDocumentChange();
		} else {
			onDiscardDocumentChange();
		}

		snapshotRef.current = null;
	}

	function restoreDocumentChange(): void {
		const snapshot = snapshotRef.current;

		if (!snapshot) {
			return;
		}

		dispatchWhiteBoardState({
			type: 'RESTORE_INTERACTION_STATE',
			elements: snapshot.elements,
			selectedIds: snapshot.selectedIds,
			documentRevision: snapshot.documentRevision,
		});

		onDiscardDocumentChange();

		snapshotRef.current = null;
	}

	function clearDocumentChange(): void {
		snapshotRef.current = null;
	}

	return {
		snapshotRef,
		beginDocumentChange,
		commitDocumentChange,
		restoreDocumentChange,
		clearDocumentChange,
	};
}
