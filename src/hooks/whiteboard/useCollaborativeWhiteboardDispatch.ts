import {
  Dispatch,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import * as Y from 'yjs';

import {
  Element,
  WhiteboardAction,
  WhiteboardState,
} from '@/interfaces';
import { whiteboardReducer } from '@/reducer/whiteboard.reducer';

interface UseCollaborativeWhiteboardDispatchParams {
  document: Y.Doc;
  whiteBoardState: WhiteboardState;
  dispatchWhiteBoardState: Dispatch<WhiteboardAction>;
  addElement: (element: Element) => void;
  updateElement: (
    elementId: string,
    updates: Partial<Element>
  ) => void;
  removeElement: (elementId: string) => void;
}

export function useCollaborativeWhiteboardDispatch({
  document,
  whiteBoardState,
  dispatchWhiteBoardState,
  addElement,
  updateElement,
  removeElement,
}: UseCollaborativeWhiteboardDispatchParams): Dispatch<WhiteboardAction> {
  const stateRef = useRef<WhiteboardState>(whiteBoardState);

  useEffect(() => {
    stateRef.current = whiteBoardState;
  }, [whiteBoardState]);

  return useCallback((action: WhiteboardAction): void => {
      const currentState = stateRef.current;
      const nextState = whiteboardReducer(currentState, action);

      stateRef.current = nextState;

      if (action.type !== 'SYNC_DOCUMENT_ELEMENTS') {
        syncDocumentChanges(
          document,
          currentState.elements,
          nextState.elements,
          addElement,
          updateElement,
          removeElement,
        );
      }

      dispatchWhiteBoardState({type: 'APPLY_WHITEBOARD_STATE', state: nextState });
    }, [document, dispatchWhiteBoardState, addElement, updateElement, removeElement]);
}

function syncDocumentChanges(
  document: Y.Doc,
  currentElements: Element[],
  nextElements: Element[],
  addElement: (element: Element) => void,
  updateElement: (elementId: string, updates: Partial<Element>) => void,
  removeElement: (elementId: string) => void,
): void {
  if (currentElements === nextElements) {
    return;
  }

  const currentElementsById = new Map(currentElements.map((element) => [element.id, element]));
  const nextElementsById = new Map(nextElements.map((element) => [element.id, element]));

  document.transact(() => {
    for (const element of nextElements) {
      const currentElement =
        currentElementsById.get(element.id);

      if (!currentElement) {
        addElement(element);
        continue;
      }

      if (currentElement !== element) {
        const updates = getElementUpdates(currentElement, element);

        if (Object.keys(updates).length > 0) {
          updateElement(element.id, updates);
        }
      }
    }

    for (const element of currentElements) {
      if (!nextElementsById.has(element.id)) {
        removeElement(element.id);
      }
    }
  });
}

function getElementUpdates(
  currentElement: Element,
  nextElement: Element,
): Partial<Element> {
  const updates: Partial<Element> = {};

  for (const key of Object.keys(nextElement) as Array<keyof Element>) {
    if (currentElement[key] !== nextElement[key]) {
      Object.assign(updates, { [key]: nextElement[key] });
    }
  }

  return updates;
}