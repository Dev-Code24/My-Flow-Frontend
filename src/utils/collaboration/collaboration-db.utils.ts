import { INDEXED_DB_CONSTANTS } from "@/lib/constants";
import { deleteIndexedDBValue, getIndexedDBValue, openIndexedDB, setIndexedDBValue } from "@/lib/utils/indexed-db.utils";
import { CollaborationParticipant, CollaborationRoomEntry } from "@/interfaces";

function openCollaborationDB(): Promise<IDBDatabase> {
  return openIndexedDB(
    INDEXED_DB_CONSTANTS.COLLABORATION_DB_NAME,
    INDEXED_DB_CONSTANTS.COLLABORATION_DB_VERSION,
    [
      {
        name: INDEXED_DB_CONSTANTS.COLLABORATION_ROOM_ENTRY_STORE as string,
        keyPath: 'roomId',
      },
      {
        name: INDEXED_DB_CONSTANTS.COLLABORATION_PARTICIPANT_STORE as string,
        keyPath: 'roomId',
      },
    ]
  );
}

export async function saveCollaborationRoomEntry(entry: CollaborationRoomEntry): Promise<void> {
  const db = await openCollaborationDB();

  try {
    await setIndexedDBValue(db,  INDEXED_DB_CONSTANTS.COLLABORATION_ROOM_ENTRY_STORE, entry);
  } finally {
    db.close();
  }
}

export async function getCollaborationRoomEntry(roomId: string): Promise<CollaborationRoomEntry | undefined> {
  const db = await openCollaborationDB();

  try {
    return await getIndexedDBValue<CollaborationRoomEntry>(db, INDEXED_DB_CONSTANTS.COLLABORATION_ROOM_ENTRY_STORE, roomId);
  } finally {
    db.close();
  }
}

export async function deleteCollaborationRoomEntry(roomId: string): Promise<void> {
  const db = await openCollaborationDB();

  try {
    await deleteIndexedDBValue(db, INDEXED_DB_CONSTANTS.COLLABORATION_ROOM_ENTRY_STORE, roomId);
  } finally {
    db.close();
  }
}

export async function saveCollaborationParticipant(participant: CollaborationParticipant): Promise<void> {
  const db = await openCollaborationDB();

  try {
    await setIndexedDBValue(db, INDEXED_DB_CONSTANTS.COLLABORATION_PARTICIPANT_STORE, participant);
  } finally {
    db.close();
  }
}

export async function getCollaborationParticipant(roomId: string): Promise<CollaborationParticipant | undefined> {
  const db = await openCollaborationDB();

  try {
    return await getIndexedDBValue<CollaborationParticipant>(db, INDEXED_DB_CONSTANTS.COLLABORATION_PARTICIPANT_STORE, roomId);
  } finally {
    db.close();
  }
}

export async function deleteCollaborationParticipant(roomId: string): Promise<void> {
  const db = await openCollaborationDB();

  try {
    await deleteIndexedDBValue(db, INDEXED_DB_CONSTANTS.COLLABORATION_PARTICIPANT_STORE, roomId);
  } finally {
    db.close();
  }
}