'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';

import { useJoinRoom } from '@/hooks/api';
import { CollaborationEntryMode, CollaborationParticipant, CollaborationSnapshot } from '@/interfaces';
import {
  cleanupCollaborationSnapshots,
  deleteCollaborationRoomEntry, getCollaborationParticipant, getCollaborationRoomEntry, getCollaborationWsToken,
  getValidCollaborationSnapshot,
  saveCollaborationParticipant, saveCollaborationWsToken, touchCollaborationSnapshot,
} from '@/utils';
import { JoinCollaborationModal, CollaborationWhiteboard, RejoinCollaborationModal } from "@/components";
import { useAuth } from "@/hooks/auth";

type RoomInitializationStatus = | 'initializing' | 'ready' | 'needs-display-name' | 'needs-rejoin-choice' | 'error';

export default function CollaborationRoomPage() {
  const { room_id } = useParams<{ room_id: string }>();
  const router = useRouter();

  const { join, isJoining } = useJoinRoom();
  const { isAuthenticated, isInitializing: isAuthenticating } = useAuth();
  
  const [participant, setParticipant] = useState<CollaborationParticipant | null>(null);
  const [status, setStatus] = useState<RoomInitializationStatus>('initializing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cachedSnapshot, setCachedSnapshot] = useState<CollaborationSnapshot | null>(null);
  const [entryMode, setEntryMode] = useState<CollaborationEntryMode | null>(null);

  const prepareCollaborationEntry = useCallback(async (): Promise<void> => {
    const snapshot = await getValidCollaborationSnapshot(room_id);

    if (!snapshot) {
      setCachedSnapshot(null);
      setEntryMode('clean');
      setStatus('ready');

      return;
    }

    setCachedSnapshot(snapshot);
    setStatus('needs-rejoin-choice');
  }, [room_id]);

  const joinAndInitialize = useCallback(async (displayName?: string): Promise<boolean> => {
      const joinResponse = await join(room_id, displayName);

      if (!joinResponse) {
        return false;
      }

      const collaborationParticipant: CollaborationParticipant = {
        roomId: room_id,
        participantId: joinResponse.participantId,
        displayName: joinResponse.displayName,
        role: joinResponse.role,
      };

      await saveCollaborationParticipant(collaborationParticipant);

      saveCollaborationWsToken(room_id, joinResponse.wsToken);

      await deleteCollaborationRoomEntry(room_id);

      setParticipant(collaborationParticipant);
      await prepareCollaborationEntry();

      return true;
    },
    [join, room_id, prepareCollaborationEntry]
  );

  useEffect(() => {
    if (isAuthenticating) {
      return;
    }

    async function initializeRoom() : Promise<void> {
      try {
        await cleanupCollaborationSnapshots(room_id);
        const existingParticipant = await getCollaborationParticipant(room_id);
        const existingWsToken = getCollaborationWsToken(room_id);

        if (existingParticipant && existingWsToken) {
          setParticipant(existingParticipant);
          await prepareCollaborationEntry();

          return;
        }

        if (existingParticipant) {
          const joined = await joinAndInitialize(existingParticipant.displayName);

          if (!joined) {
            setStatus('error');
            setErrorMessage('Unable to restore the collaboration room.');
          }

          return;
        }

        const roomEntry = await getCollaborationRoomEntry(room_id);

        if (roomEntry) {
          const joined = await joinAndInitialize(roomEntry.displayName);

          if (!joined) {
            setStatus('error');
            setErrorMessage('Unable to join the collaboration room.');
          }

          return;
        }

        if (isAuthenticated) {
          const joined = await joinAndInitialize();

          if ( !joined ) {
            setStatus('error');
            setErrorMessage('Unable to join the collaboration room.');
          }

          return;
        }

        setStatus('needs-display-name');
      } catch (error) {
        console.error('Failed to initialize collaboration room:', error);

        setErrorMessage(error instanceof Error ? error.message : 'Unable to initialize collaboration room.');
        setStatus('error');
      }
    }

    void initializeRoom();
  }, [room_id, isAuthenticated, joinAndInitialize, isAuthenticating, prepareCollaborationEntry]);

  if (status === 'initializing') {
    return (
      <main className='fixed inset-0 flex items-center justify-center bg-surface'>
        <div className='flex flex-col items-center gap-3'>
          <LoaderCircle
            size={30}
            aria-hidden
            className='animate-spin text-primary'
          />

          <p className='text-sm text-text-secondary'>
            Joining collaboration
          </p>
        </div>
      </main>
    );
  }

  if (status === 'needs-display-name') {
    return (
      <main className='fixed inset-0 bg-surface'>
        <JoinCollaborationModal
          isOpen
          isJoining={isJoining}
          onBack={() => {
            router.push('/');
          }}
          onSubmit={async (displayName) => {
            await joinAndInitialize(displayName);
          }}
        />
      </main>
    );
  }

  if (status === 'needs-rejoin-choice' && cachedSnapshot) {
    return (
      <main className='fixed inset-0 bg-surface'>
        <RejoinCollaborationModal
          isOpen
          onBack={() => {
            router.push('/');
          }}
          onContinue={() => {
            void touchCollaborationSnapshot(room_id);

            setEntryMode('continue');
            setStatus('ready');
          }}
          onStartClean={() => {
            void touchCollaborationSnapshot(room_id);

            setEntryMode('clean');
            setStatus('ready');
          }}
        />
      </main>
    );
  }

  if (status === 'error' || !participant) {
    return (
      <main className='fixed inset-0 flex items-center justify-center bg-surface'>
        <div className='text-center'>
          <h1 className='text-lg font-semibold text-text-primary'>
            Unable to join room
          </h1>

          <p className='pt-2 text-sm text-text-secondary'>
            {errorMessage ?? 'Something went wrong.'}
          </p>
        </div>
      </main>
    );
  }

  const wsToken = getCollaborationWsToken(room_id);

  if (!wsToken) {
    return (
      <main className='fixed inset-0 flex items-center justify-center bg-surface'>
        <div className='text-center'>
          <h1 className='text-lg font-semibold text-text-primary'>
            Unable to join room, please refresh the page.
          </h1>
        </div>
      </main>
    );
  }

  if (!entryMode) {
    return (
      <main className='fixed inset-0 flex items-center justify-center bg-surface'>
        <div className='text-center'>
          <h1 className='text-lg font-semibold text-text-primary'>
            Unable to initialize collaboration.
          </h1>
        </div>
      </main>
    );
  }

  const cachedElements = entryMode === 'continue' && cachedSnapshot ? cachedSnapshot.elements : [];

  return (
    <CollaborationWhiteboard
      roomId={room_id}
      wsToken={wsToken}
      entryMode={entryMode}
      cachedElements={cachedElements}
    />
  );
}