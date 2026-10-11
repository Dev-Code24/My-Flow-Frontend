'use client';

import { useState } from 'react';
import { CollaborationEntryMode, DocumentMutationLifecycle } from '@/interfaces';
import { Element } from '@/lib/interfaces';
import { useWebsocket } from '@/hooks/websocket';
import { useCollaborationDocument } from './useCollaborationDocument';
import { useAutosaveCollaborationSnapshot } from './useAutosaveCollaborationSnapshot';
import { generateUUID } from '@/lib/utils';

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
  const { document, elements, addElement, updateElement, removeElement, syncElementOrder } = useCollaborationDocument();
  const [continueImportRequestId] = useState<string>(generateUUID);

  const {
    status,
    initialSyncStatus,
    historyState,
    commitHistoryEntry,
    undo,
    redo,
    beginMutation,
    commitMutation,
    cancelMutation,
  } = useWebsocket({
    wsToken,
    document,
    continueImport: entryMode === 'continue'
        ? {
          requestId: continueImportRequestId,
          elements: cachedElements,
        } : undefined,

  });

  const mutationLifecycle: DocumentMutationLifecycle = {
    beginMutation,
    commitMutation,
    cancelMutation,
  };

  const isPersistenceEnabled = initialSyncStatus === 'completed';

  useAutosaveCollaborationSnapshot({ roomId, elements, enabled: isPersistenceEnabled });

  return {
    document,
    elements,
    status,
    initialSyncStatus,
    historyState,
    commitHistoryEntry,
    undo,
    redo,
    mutationLifecycle,
    addElement,
    updateElement,
    removeElement,
    syncElementOrder,
  };
}