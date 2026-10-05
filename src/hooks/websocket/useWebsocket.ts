'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';

import { WsMessage, WsMessageType } from '@/lib/interfaces';
import { WebSocketService } from '@/lib/websocket';
import { base64ToUint8Array, generateUUID, uint8ArrayToBase64 } from '@/lib/utils';
import { ToastService } from '@/ui/toast';
import { CollaborationHistoryEntryDraft, RoomHistoryState } from "@/interfaces";

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
export type InitialSyncStatus = 'waiting' | 'syncing' | 'completed';

interface UseCollaborationWebSocketParams {
  wsToken: string;
  document: Y.Doc;
  onInitialSyncReady?: () => void;
}

export function useWebsocket({
  wsToken,
  document,
  onInitialSyncReady,
}: UseCollaborationWebSocketParams) {
  const onInitialSyncReadyRef = useRef(onInitialSyncReady);
  const [status, setStatus] = useState<WebSocketStatus>('connecting');
  const [initialSyncStatus, setInitialSyncStatus] = useState<InitialSyncStatus>('waiting');
  const [service] = useState(() => new WebSocketService());
  const [historyState, setHistoryState] = useState<RoomHistoryState>({
    cursor: 0,
    historyVersion: 0,
    historyLength: 0,
    canUndo: false,
    canRedo: false,
  });

  useEffect(() => {
    onInitialSyncReadyRef.current = onInitialSyncReady;
  }, [onInitialSyncReady]);

  useEffect(() => {
    const socket = service.connect(wsToken);

    const handleOpen = (): void => {
      ToastService.success('Connected');
      setStatus('connected');
    };

    const handleClose = (): void => {
      ToastService.info('Disconnected');
      setStatus('disconnected');
    };

    const handleError = (): void => {
      ToastService.error('Error');
      setStatus('error');
    };

    const unsubscribe = service.subscribe((message: WsMessage) => {
        switch (message.type) {
          case WsMessageType.CONNECTION_ESTABLISHED: {
            setInitialSyncStatus('syncing');

            return;
          }

          case WsMessageType.YJS_SYNC: {
            const update = base64ToUint8Array(message.message.update);

            Y.applyUpdate(document, update, service);

            if (onInitialSyncReadyRef.current) {
              onInitialSyncReadyRef.current();
            }

            setInitialSyncStatus('completed');

            return;
          }

          case WsMessageType.YJS_UPDATE: {
            const update = base64ToUint8Array(message.message.update);
            Y.applyUpdate(document, update, service);

            return;
          }

          case WsMessageType.ROOM_HISTORY_STATE: {
            console.log('ROOM_HISTORY_STATE received:', message.message);
            setHistoryState(message.message);

            return;
          }
        }
      });

    const handleDocumentUpdate = (update: Uint8Array, origin: unknown): void => {
      if (origin === service) {
        return;
      }

      service.send({
        type: WsMessageType.YJS_UPDATE,
        message: {
          updateId: generateUUID(),
          update: uint8ArrayToBase64(update),
        },
      });
    };

    socket.addEventListener('open', handleOpen);
    socket.addEventListener('close', handleClose);
    socket.addEventListener('error', handleError);
    document.on('update', handleDocumentUpdate);

    return () => {
      unsubscribe();

      document.off('update', handleDocumentUpdate);
      socket.removeEventListener('open', handleOpen);
      socket.removeEventListener('close', handleClose);
      socket.removeEventListener('error', handleError);
      service.disconnect();
    };
  }, [wsToken, document, service]);

  const commitHistoryEntry = useCallback((entry: CollaborationHistoryEntryDraft): void => {
    service.send({
      type: WsMessageType.HISTORY_ENTRY_COMMIT,
      message: entry,
    });
  }, [service]);

  const undo = useCallback((): void => {
    if (!historyState.canUndo) {
      return;
    }

    service.send({
      type: WsMessageType.UNDO_REQUEST,
      message: {
        requestId: generateUUID(),
        expectedVersion:
        historyState.historyVersion,
      },
    });
  }, [service, historyState]);

  const redo = useCallback((): void => {
    if (!historyState.canRedo) {
      return;
    }

    service.send({
      type: WsMessageType.REDO_REQUEST,
      message: {
        requestId: generateUUID(),
        expectedVersion:
        historyState.historyVersion,
      },
    });
  }, [service, historyState]);

  const beginMutation = useCallback((elementIds: string[]): Promise<boolean> => {
      return service.beginEdit(elementIds);
    }, [service]);

  const commitMutation = useCallback((): void => {
      service.endEdit();
    }, [service]);

  const cancelMutation = useCallback((): void => {
      service.cancelEdit();
    }, [service]);

  return {
    status,
    initialSyncStatus,
    historyState,
    commitHistoryEntry,
    undo,
    redo,
    beginMutation,
    commitMutation,
    cancelMutation,
  };
}