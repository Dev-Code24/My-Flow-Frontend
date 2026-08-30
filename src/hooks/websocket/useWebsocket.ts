'use client';

import { useEffect, useState } from 'react';
import * as Y from 'yjs';

import { WsMessage, WsMessageType } from '@/lib/interfaces';
import { WebSocketService } from '@/lib/websocket';
import { base64ToUint8Array, uint8ArrayToBase64 } from '@/lib/utils';
import { ToastService } from "@/ui/toast";

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseCollaborationWebSocketParams {
  wsToken: string;
  document: Y.Doc;
}

export function useWebsocket({
  wsToken,
  document,
}: UseCollaborationWebSocketParams) {
  const [status, setStatus] = useState<WebSocketStatus>('connecting');
  const [service] = useState(() => new WebSocketService());

  useEffect(() => {
    const socket = service.connect(wsToken);

    const handleOpen = (): void => {
      ToastService.success("Connected");
      console.log('Connected');
      setStatus('connected');
    };

    const handleClose = (): void => {
      ToastService.info("Disconnected");
      console.log('Disconnected');
      setStatus('disconnected');
    };

    const handleError = (): void => {
      ToastService.error("Error");
      console.log('Error');
      setStatus('error');
    };

    const unsubscribe = service.subscribe((message: WsMessage) => {
        if (message.type !== WsMessageType.YJS_UPDATE) {
          return;
        }

        const update = base64ToUint8Array(message.message.update);

        Y.applyUpdate(document, update, service);
      }
    );

    const handleDocumentUpdate = (update: Uint8Array, origin: unknown): void => {
      if (origin === service) {
        return;
      }

      ToastService.error("Something changed!");

      service.send({
        type: WsMessageType.YJS_UPDATE,
        message: {
          update:
            uint8ArrayToBase64(update),
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

  return {
    status,
  };
}