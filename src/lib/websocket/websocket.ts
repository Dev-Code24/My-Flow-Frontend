import { WsMessage, WsMessageType } from "@/lib/interfaces";
import { ENV_CONFIG } from "@/lib/config";

type MessageListener = (message: WsMessage) => void;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private messageListeners = new Set<MessageListener>();

  connect(wsToken: string): WebSocket {
    const url = new URL(ENV_CONFIG.WS_BASE_URL);
    url.searchParams.set('token', wsToken);

    this.socket = new WebSocket(url.toString());

    this.socket.addEventListener('message', this.handleMessage.bind(this));

    return this.socket;
  }

  disconnect(): void {
    if (!this.socket) {
      return;
    }

    this.socket.removeEventListener('message', this.handleMessage.bind(this));

    this.socket.close();
    this.socket = null;
  }

  send<T extends WsMessageType>(message: WsMessage<T>): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(JSON.stringify(message));
  }

  subscribe(listener: MessageListener): VoidFunction {
    this.messageListeners.add(listener);

    return () => {
      this.messageListeners.delete(listener);
    };
  }

  getSocket(): WebSocket | null {
    return this.socket;
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WsMessage;

      this.messageListeners.forEach(listener => listener(message));
    } catch (error) {
      console.error('Failed to parse WebSocket message', error);
    }
  };
}