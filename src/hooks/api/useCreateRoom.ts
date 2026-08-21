import { createRoom } from '@/lib/api/rooms';
import { toast } from '@/ui/toast/toast.service';
import { RoomCollaborationOptions } from "@/interfaces";
import { ApiError } from "@/lib/errors";
import { saveCollaborationRoomEntry } from "@/utils";
import { useCallback } from "react";

interface UseStartSessionResult {
  create: (options: RoomCollaborationOptions) => Promise<string | undefined>;
}

export function useCreateRoom(): UseStartSessionResult {
   const create = useCallback(async function create(options: RoomCollaborationOptions): Promise<string | undefined> {
      try {
         const createRoomResponse = await createRoom(options.duration);
         const { roomId } = createRoomResponse.data;
         await saveCollaborationRoomEntry({ roomId, displayName: options.displayName });

         return roomId;
      } catch (error) {
         let message: string;

         if (error instanceof ApiError) {
            message = error.message;
         } else {
            message = 'Failed to create a collaboration session.';
         }

         console.error(message, error);
         toast.error(message);

         return undefined;
      }
   }, [])

   return { create };
}