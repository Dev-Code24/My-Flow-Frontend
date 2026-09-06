import { Element, CollaborationSnapshot } from '@/interfaces';
import { COLLABORATION_SNAPSHOT_TTL_MS, MAX_COLLABORATION_SNAPSHOTS } from '@/constants';
import {
  deleteCollaborationParticipant, deleteCollaborationRoomEntry, deleteCollaborationSnapshot, getAllCollaborationSnapshots,
  getCollaborationSnapshot, saveCollaborationSnapshot,
} from '@/utils';

export async function saveCollaborationSnapshotState(
  roomId: string,
  elements: Element[],
): Promise<void> {
  const now = Date.now();

  const snapshot: CollaborationSnapshot = {
    roomId,
    elements,
    updatedAt: now,
    lastAccessedAt: now,
  };

  await saveCollaborationSnapshot(snapshot);
  await cleanupCollaborationSnapshots(roomId);
}

export async function getValidCollaborationSnapshot(roomId: string): Promise<CollaborationSnapshot | undefined> {
  const snapshot = await getCollaborationSnapshot(roomId);

  if (!snapshot) {
    return undefined;
  }

  if (!isCollaborationSnapshotExpired(snapshot)) {
    return snapshot;
  }

  await deleteCachedCollaborationRoom(roomId);

  return undefined;
}

export async function touchCollaborationSnapshot(roomId: string): Promise<void> {
  const snapshot = await getCollaborationSnapshot(roomId);

  if (!snapshot) {
    return;
  }

  await saveCollaborationSnapshot({
    ...snapshot,
    lastAccessedAt: Date.now(),
  });
}

export async function cleanupCollaborationSnapshots(preservedRoomId?: string): Promise<void> {
  const snapshots = await getAllCollaborationSnapshots();
  const validSnapshots: CollaborationSnapshot[] = [];

  for (const snapshot of snapshots) {
    if (isCollaborationSnapshotExpired(snapshot)) {
      await deleteCachedCollaborationRoom(snapshot.roomId);

      continue;
    }

    validSnapshots.push(snapshot);
  }

  const overflow = validSnapshots.length - MAX_COLLABORATION_SNAPSHOTS;

  if (overflow <= 0) {
    return;
  }

  const evictionCandidates = validSnapshots
    .filter((snapshot) => snapshot.roomId !== preservedRoomId)
    .sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);

  for (let i = 0; i < overflow && i < evictionCandidates.length; ++i) {
    await deleteCachedCollaborationRoom(evictionCandidates[i].roomId);
  }
}

function isCollaborationSnapshotExpired(snapshot: CollaborationSnapshot): boolean {
  return Date.now() - snapshot.lastAccessedAt >= COLLABORATION_SNAPSHOT_TTL_MS;
}

async function deleteCachedCollaborationRoom(roomId: string): Promise<void> {
  await Promise.all([
    deleteCollaborationSnapshot(roomId),
    deleteCollaborationParticipant(roomId),
    deleteCollaborationRoomEntry(roomId),
  ]);
}