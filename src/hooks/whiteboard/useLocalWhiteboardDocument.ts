import { Dispatch, useCallback } from 'react';

import { Element, WhiteboardAction, WhiteboardDocumentOperations } from '@/interfaces';

interface UseLocalWhiteboardDocumentParams {
  elements: Element[];
  dispatchWhiteBoardState: Dispatch<WhiteboardAction>;
}

export function useLocalWhiteboardDocument({
  elements,
  dispatchWhiteBoardState,
}: UseLocalWhiteboardDocumentParams): WhiteboardDocumentOperations {
  const addElement = useCallback((element: Element): void => {
      dispatchWhiteBoardState({
        type: 'SET_ELEMENTS',
        updater: (currentElements) => [
          ...currentElements,
          element,
        ],
      });
    }, [dispatchWhiteBoardState]);

  const updateElements = useCallback((updater: (elements: Element[]) => Element[]): void => {
      dispatchWhiteBoardState({
        type: 'SET_ELEMENTS',
        updater,
      });
    }, [dispatchWhiteBoardState]);

  const moveElements = useCallback((elementIds: string[], dx: number, dy: number): void => {
      if (elementIds.length === 0 || (dx === 0 && dy === 0)) {
        return;
      }

      const ids = new Set(elementIds);

      dispatchWhiteBoardState({
        type: 'SET_ELEMENTS',
        updater: (currentElements) =>
          currentElements.map((element) =>
            ids.has(element.id)
              ? {
                ...element,
                x: element.x + dx,
                y: element.y + dy,
              }
              : element
          ),
      });
    }, [dispatchWhiteBoardState]);

  const duplicateElements = useCallback((elementIds: string[]): Element[] => {
      if (elementIds.length === 0) {
        return [];
      }

      const ids = new Set(elementIds);

      const duplicates = elements
        .filter((element) => ids.has(element.id))
        .map((element) => ({
          ...structuredClone(element),
          id: crypto.randomUUID(),
        }));

      if (duplicates.length === 0) {
        return [];
      }

      dispatchWhiteBoardState({
        type: 'SET_ELEMENTS',
        updater: (currentElements) => [
          ...currentElements,
          ...duplicates,
        ],
      });

      return duplicates;
    }, [elements, dispatchWhiteBoardState]);

  const deleteElements = useCallback((elementIds: string[]): void => {
      if (elementIds.length === 0) {
        return;
      }

      const ids = new Set(elementIds);

      dispatchWhiteBoardState({
        type: 'SET_ELEMENTS',
        updater: (currentElements) =>
          currentElements.filter(
            (element) => !ids.has(element.id)
          ),
      });
    }, [dispatchWhiteBoardState]);

  const replaceElements = useCallback((nextElements: Element[]): void => {
      dispatchWhiteBoardState({
        type: 'SET_ELEMENTS',
        updater: () => nextElements,
      });
    }, [dispatchWhiteBoardState]);

  const normalizeElements = useCallback((): void => {
    dispatchWhiteBoardState({
      type: 'NORMALIZE_ELEMENTS',
    });
  }, [dispatchWhiteBoardState]);

  return {
    addElement,
    updateElements,
    moveElements,
    duplicateElements,
    deleteElements,
    replaceElements,
    normalizeElements,
  };
}