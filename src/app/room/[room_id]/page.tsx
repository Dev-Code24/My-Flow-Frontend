'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';

import { useJoinRoom } from '@/hooks/api';
import { CollaborationParticipant } from '@/interfaces';
import {
  deleteCollaborationRoomEntry, getCollaborationParticipant, getCollaborationRoomEntry, getCollaborationWsToken,
  saveCollaborationParticipant, saveCollaborationWsToken
} from '@/utils';
import JoinCollaborationModal from "@/components/JoinCollaborationModal";

type RoomInitializationStatus = | 'initializing' | 'ready' | 'needs-display-name' | 'error';

export default function CollaborationRoomPage() {
  const { room_id } = useParams<{ room_id: string }>();
  const router = useRouter();

  const { join, isJoining } = useJoinRoom();
  // TODO: Swap this temp state with a proper auth context
  const isAuthenticated = false;
  const [participant, setParticipant] = useState<CollaborationParticipant | null>(null);
  const [status, setStatus] = useState<RoomInitializationStatus>('initializing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      setStatus('ready');

      return true;
    },
    [room_id, join]
  );

  useEffect(() => {
    async function initializeRoom() : Promise<void> {
      try {
        const existingParticipant = await getCollaborationParticipant(room_id);
        const existingWsToken = getCollaborationWsToken(room_id);

        if (existingParticipant && existingWsToken) {
          setParticipant(existingParticipant);
          setStatus('ready');

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
  }, [room_id, isAuthenticated, joinAndInitialize]);

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

  return (
    <main className='fixed inset-0 overflow-hidden bg-slate-200'>
      <div className='flex h-full items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-xl font-semibold text-text-primary'>
            Collaboration room
          </h1>

          <p className='pt-3 text-sm text-text-secondary'>
            {participant.displayName}
          </p>

          <p className='pt-1 text-xs text-text-muted'>
            {participant.role}
          </p>
        </div>
      </div>
    </main>
  );
}