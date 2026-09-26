import { SESSION_STORAGE_CONSTANTS } from "@/lib/constants";
import { getSessionStorageValue, removeSessionStorageValue, setSessionStorageValue } from "@/lib/utils";

function getCollaborationWsTokenKey(roomId: string): string {
  return `${SESSION_STORAGE_CONSTANTS.COLLABORATION_WS_TOKEN_PREFIX}:${roomId}`;
}

export function saveCollaborationWsToken(roomId: string, wsToken: string): void {
  setSessionStorageValue(getCollaborationWsTokenKey(roomId), wsToken);
}

export function getCollaborationWsToken(roomId: string): string | null {
  return getSessionStorageValue(getCollaborationWsTokenKey(roomId));
}

export function deleteCollaborationWsToken(roomId: string): void {
  removeSessionStorageValue(getCollaborationWsTokenKey(roomId));
}