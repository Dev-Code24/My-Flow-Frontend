'use client';

import { Dispatch, useCallback, useState } from 'react';

import { Element, WhiteboardAction } from '@/interfaces';

interface UseWhiteboardHistoryParams {
	elements: Element[];
	dispatchWhiteBoardState: Dispatch<WhiteboardAction>;
}

interface UseWhiteboardHistoryResult {
	canUndo: boolean;
	canRedo: boolean;
	recordSnapshot: (snapshot: Element[]) => void;
	undo: () => void;
	redo: () => void;
	clearHistory: () => void;
}

const MAX_HISTORY_SIZE = 100;

function cloneElements(elements: Element[]): Element[] {
	return structuredClone(elements);
}

export function useWhiteboardHistory({ elements, dispatchWhiteBoardState }: UseWhiteboardHistoryParams): UseWhiteboardHistoryResult {
	const [past, setPast] = useState<Element[][]>([]);
	const [future, setFuture] = useState<Element[][]>([]);

	const recordSnapshot = useCallback((snapshot: Element[]): void => {
		setPast((currentPast) => {
			const nextPast = [...currentPast, cloneElements(snapshot)];

			if (nextPast.length > MAX_HISTORY_SIZE) {
				return nextPast.slice(nextPast.length - MAX_HISTORY_SIZE);
			}

			return nextPast;
		});

		setFuture([]);
	}, []);

	const undo = useCallback((): void => {
		if (past.length === 0) {
			return;
		}

		const previousState = past[past.length - 1];

		setPast((currentPast) => currentPast.slice(0, -1));

		setFuture((currentFuture) => [cloneElements(elements), ...currentFuture]);

		dispatchWhiteBoardState({ type: 'SET_ELEMENTS', updater: () => cloneElements(previousState) });
	}, [past, elements, dispatchWhiteBoardState]);

	const redo = useCallback((): void => {
		if (future.length === 0) {
			return;
		}

		const nextState = future[0];

		setFuture((currentFuture) => currentFuture.slice(1));

		setPast((currentPast) => {
			const nextPast = [...currentPast, cloneElements(elements)];

			if (nextPast.length > MAX_HISTORY_SIZE) {
				return nextPast.slice(nextPast.length - MAX_HISTORY_SIZE);
			}

			return nextPast;
		});

		dispatchWhiteBoardState({ type: 'SET_ELEMENTS', updater: () => cloneElements(nextState) });
	}, [future, elements, dispatchWhiteBoardState]);

	const clearHistory = useCallback((): void => {
		setPast([]);
		setFuture([]);
	}, []);

	return {
		canUndo: past.length > 0,
		canRedo: future.length > 0,
		recordSnapshot,
		undo,
		redo,
		clearHistory,
	};
}
