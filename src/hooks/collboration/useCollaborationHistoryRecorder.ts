'use client';

import { useCallback, useRef } from 'react';

import { CollaborationHistoryEntryDraft, Element, HistoryElementChange } from '@/interfaces';
import { areHistoryElementStatesEqual, getHistoryElementChanges } from '@/utils';

interface UseCollaborationHistoryRecorderParams {
  onEntryCommitted: (entry: CollaborationHistoryEntryDraft) => void;
}

interface UseCollaborationHistoryRecorderResult {
  beginDocumentChange: VoidFunction;
  recordDocumentMutation: (
    beforeElements: Element[],
    afterElements: Element[],
  ) => void;
  commitDocumentChange: VoidFunction;
  discardDocumentChange: VoidFunction;
}

export function useCollaborationHistoryRecorder({
  onEntryCommitted,
}: UseCollaborationHistoryRecorderParams): UseCollaborationHistoryRecorderResult {
  const activeEntryIdRef = useRef<string | null>(null);
  const changesRef = useRef<Map<string, HistoryElementChange>>(new Map());

  const beginDocumentChange = useCallback((): void => {
    activeEntryIdRef.current = crypto.randomUUID();
    changesRef.current.clear();
  }, []);

  const recordDocumentMutation = useCallback((
    beforeElements: Element[],
    afterElements: Element[],
  ): void => {
    if (activeEntryIdRef.current === null) {
      return;
    }

    const changes = getHistoryElementChanges(
      beforeElements,
      afterElements,
    );

    for (const change of changes) {
      const existingChange = changesRef.current.get(change.elementId);

      const mergedChange: HistoryElementChange = existingChange
        ? {
          elementId: change.elementId,
          before: existingChange.before,
          after: change.after,
        }
        : change;

      if (
        areHistoryElementStatesEqual(
          mergedChange.before,
          mergedChange.after,
        )
      ) {
        changesRef.current.delete(change.elementId);
        continue;
      }

      changesRef.current.set(
        change.elementId,
        mergedChange,
      );
    }
  }, []);

  const commitDocumentChange = useCallback((): void => {
    const entryId = activeEntryIdRef.current;

    if (entryId === null) {
      return;
    }

    activeEntryIdRef.current = null;

    if (changesRef.current.size === 0) {
      changesRef.current.clear();
      return;
    }

    const entry: CollaborationHistoryEntryDraft = {
      entryId,
      changes: Array.from(changesRef.current.values()),
    };

    changesRef.current.clear();

    onEntryCommitted(entry);
  }, [onEntryCommitted]);

  const discardDocumentChange = useCallback((): void => {
    activeEntryIdRef.current = null;
    changesRef.current.clear();
  }, []);

  return {
    beginDocumentChange,
    recordDocumentMutation,
    commitDocumentChange,
    discardDocumentChange,
  };
}