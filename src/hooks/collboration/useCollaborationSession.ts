'use client';

import { useCallback, useRef } from 'react';

import { CollaborationEntryMode, Element } from '@/interfaces';
import { seedYDoc } from '@/lib/yjs';
import { useWebsocket } from '@/hooks/websocket';
import { useCollaborationDocument } from './useCollaborationDocument';
import { useCollaborationSnapshot } from './useCollaborationSnapshot';

interface UseCollaborationSessionParams {
  roomId: string;
  wsToken: string;
  entryMode: CollaborationEntryMode;
  cachedElements: Element[];
}

export function useCollaborationSession({
  roomId,
  wsToken,
  entryMode,
  cachedElements,
}: UseCollaborationSessionParams) {
  const {document, yElements, elements, addElement, updateElement, removeElement, syncElementOrder, yElementOrder } = useCollaborationDocument();
  const hasImportedCachedSnapshotRef = useRef<boolean>(false);

  const handleInitialSyncReady = useCallback((): void => {
    if (entryMode !== 'continue' || hasImportedCachedSnapshotRef.current) {
      return;
    }

    hasImportedCachedSnapshotRef.current = true;
    seedYDoc(yElements, yElementOrder, cachedElements);
  }, [entryMode, yElements, yElementOrder, cachedElements]);

  const {
    status,
    initialSyncStatus,
    historyState,
    commitHistoryEntry,
  } = useWebsocket({
    wsToken,
    document,
    onInitialSyncReady: handleInitialSyncReady,
  });

  const isPersistenceEnabled = initialSyncStatus === 'completed' || initialSyncStatus === 'not-required';

  useCollaborationSnapshot({ roomId, elements, enabled: isPersistenceEnabled });

  return {
    document,
    elements,
    status,
    initialSyncStatus,
    historyState,
    commitHistoryEntry,
    addElement,
    updateElement,
    removeElement,
    syncElementOrder,
  };
}