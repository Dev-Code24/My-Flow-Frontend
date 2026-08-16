'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { createRoom, joinRoom } from '@/lib/api/rooms';
import { RoomDuration } from '@/lib/interfaces';
import { toast } from '@/ui/toast/toast.service';
import { RoomCollaborationOptions } from "@/interfaces";

interface UseStartSessionResult {
  startSession: (options: RoomCollaborationOptions) => Promise<void>;
  isStartingSession: boolean;
}

export function useStartSession(): UseStartSessionResult {
   const router = useRouter();
   const [isStartingSession, setIsStartingSession] = useState<boolean>(false);

   async function startSession(options: RoomCollaborationOptions): Promise<void> {
      if (isStartingSession) {
         return;
      }

      setIsStartingSession(true);

      try {
         const createRoomResponse = await createRoom(options.duration);
         const { roomId } = createRoomResponse.data;
         const joinRoomResponse = await joinRoom(roomId, options.displayName);
         const { role, participantId, displayName: resolvedDisplayName, wsToken } = joinRoomResponse.data;

         console.log({ role, participantId, resolvedDisplayName, wsToken });
         router.push(`/room/${roomId}`);
      } catch (error) {
         console.error('Failed to start collaboration session:', error);
         toast.error(`We couldn't start the collaboration session. Please try again.`);
      } finally {
         setIsStartingSession(false);
      }
   }

   return {
      startSession,
      isStartingSession,
   };
}