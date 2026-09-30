import { ActiveEdit, WsMessage, WsMessageType } from "@/lib/interfaces";
import { ENV_CONFIG } from "@/lib/config";
import { EDIT_KEEP_ALIVE_INTERVAL_MS } from "@/lib/constants";
import { generateUUID } from "@/lib/utils";

type MessageListener = (message: WsMessage) => void;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private messageListeners = new Set<MessageListener>();

  private pendingEdits = new Map<string, (accepted: boolean) => void>();
  private activeEdit: ActiveEdit | null = null;

  constructor() {
    this.handleMessage = this.handleMessage.bind(this);
  }

  public connect(wsToken: string): WebSocket {
    this.disconnect();
    const url = new URL(ENV_CONFIG.WS_BASE_URL);
    url.searchParams.set('token', wsToken);

    this.socket = new WebSocket(url.toString());

    this.socket.addEventListener('message', this.handleMessage);

    return this.socket;
  }

  disconnect(): void {
    if (!this.socket) {
      return;
    }

    if (this.activeEdit) {
      clearInterval(this.activeEdit.keepAliveTimer);

      this.activeEdit = null;
    }

    this.pendingEdits.forEach((resolve) => resolve(false));
    this.pendingEdits.clear();
    this.socket.removeEventListener('message', this.handleMessage);
    this.socket.close();
    this.socket = null;
  }

  public send<T extends WsMessageType>(message: WsMessage<T>): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(JSON.stringify(message));
  }

  public subscribe(listener: MessageListener): VoidFunction {
    this.messageListeners.add(listener);

    return () => {
      this.messageListeners.delete(listener);
    };
  }

  public getSocket(): WebSocket | null {
    return this.socket;
  }

  public async beginEdit(elementIds: string[]): Promise<boolean> {
    if (elementIds.length === 0 || this.activeEdit) {
      return false;
    }

    const editId = generateUUID();

    const accepted = await new Promise<boolean>((resolve) => {
          this.pendingEdits.set(editId, resolve);

          this.send({
            type: WsMessageType.EDIT_BEGIN,
            message: {
              editId,
              elementIds,
            },
          });
        },
      );

    if (!accepted) {
      return false;
    }

    const keepAliveTimer = setInterval(() => {
        this.send({
          type:
          WsMessageType.EDIT_KEEP_ALIVE,
          message: {
            editId,
            elementIds,
          },
        });
      }, EDIT_KEEP_ALIVE_INTERVAL_MS);

    this.activeEdit = {
      editId,
      elementIds,
      keepAliveTimer,
    };

    return true;
  }

  public endEdit(): void {
    if (!this.activeEdit) {
      return;
    }

    const { editId, elementIds, keepAliveTimer } = this.activeEdit;

    clearInterval(keepAliveTimer);

    this.send({
      type: WsMessageType.EDIT_END,
      message: {
        editId,
        elementIds,
      },
    });

    this.activeEdit = null;
  }

  public cancelEdit(): void {
    this.endEdit();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WsMessage;

      if (message.type === WsMessageType.EDIT_ACCEPTED) {
        const resolve = this.pendingEdits.get(message.message.editId);

        if (!resolve) { return; }

        this.pendingEdits.delete(message.message.editId);
        resolve(true);

        return;
      }

      if (message.type === WsMessageType.EDIT_REJECTED) {
        const resolve = this.pendingEdits.get(message.message.editId);

        if (!resolve) { return; }

        this.pendingEdits.delete(message.message.editId);
        resolve(false);

        return;
      }

      this.messageListeners.forEach((listener) => listener(message));
    } catch (error) {
      console.error('Failed to parse WebSocket message', error);
    }
  }
}