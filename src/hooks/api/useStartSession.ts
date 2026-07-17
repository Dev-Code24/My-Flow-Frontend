"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createRoom } from "@/lib/api/rooms";
import { RoomDuration } from "@/lib/interfaces";
import { toast } from "@/ui/toast/toast.service";

interface UseStartSessionResult {
  startSession: () => Promise<void>;
  isStartingSession: boolean;
}

export function useStartSession(): UseStartSessionResult {
   const router = useRouter();
   const [isStartingSession, setIsStartingSession] = useState<boolean>(false);

   async function startSession(): Promise<void> {
      if (isStartingSession) {
         return;
      }

      setIsStartingSession(true);

      try {
         const response = await createRoom(RoomDuration.ONE_HOUR);
         const { roomId } = response.data;

         router.push(`/room/${roomId}`);
      } catch (error) {
         console.error("Failed to start collaboration session:", error);

         toast.error("We couldn't start the collaboration session. Please try again.");
      } finally {
         setIsStartingSession(false);
      }
   }

   return {
      startSession,
      isStartingSession,
   };
}