import { JoinRoomResponseData } from "@/lib/interfaces";
import { useCallback, useState } from "react";
import { joinRoom } from "@/lib/api/rooms";
import { ApiError } from "@/lib/errors";
import { toast } from "@/ui/toast";

interface UseJoinRoomResult {
  join: (roomId: string, displayName?: string) => Promise<JoinRoomResponseData | undefined>;
  isJoining: boolean;
}

export function useJoinRoom(): UseJoinRoomResult {
  const [isJoining, setIsJoining] = useState<boolean>(false);

  const join = useCallback(async function join(roomId: string, displayName?: string): Promise<JoinRoomResponseData | undefined> {
    setIsJoining(true);

    try {
      const response = await joinRoom(roomId, displayName);

      return response.data;
    } catch (error) {
      let message: string;

      if (error instanceof ApiError) {
        message = error.message;
      } else {
        message = 'Failed to join the room.';
      }

      console.error(message, error);
      toast.error(message);

      return undefined;
    } finally {
      setIsJoining(false);
    }
  }, [])

  return { join, isJoining };
}