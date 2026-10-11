'use client';

import { useEffect, useRef } from 'react';

import { Element } from '@/lib/interfaces';
import { COLLABORATION_SNAPSHOT_AUTOSAVE_DELAY } from '@/constants';
import { saveCollaborationSnapshotState } from '@/utils';

interface UseAutosaveCollaborationSnapshotParams {
  roomId: string;
  elements: Element[];
  enabled: boolean;
}

export function useAutosaveCollaborationSnapshot({
  roomId,
  elements,
  enabled,
}: UseAutosaveCollaborationSnapshotParams): void {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      void saveCollaborationSnapshotState(roomId, elements)
        .catch((error) => {
          console.error('Failed to save collaboration snapshot:', error);
        });
    }, COLLABORATION_SNAPSHOT_AUTOSAVE_DELAY);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [roomId, elements, enabled]);
}