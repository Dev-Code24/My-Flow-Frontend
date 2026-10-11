'use client';

import { useEffect, useReducer, useRef, useState } from 'react';

import { WhiteboardAction, WhiteboardMode, WhiteboardState, CollaborationEntryMode } from '@/interfaces';
import { Element } from '@/lib/interfaces';
import { initialWhiteBoardState } from '@/constants';
import { whiteboardReducer } from '@/reducer/whiteboard.reducer';
import { useCanvasPreventDefaultEvents, useCollaborativeWhiteboardDispatch, useKeyboardShortcuts, useWhiteboardCursor,
  useWhiteboardHistory, useWhiteboardInteractions, useWhiteboardViewport
} from '@/hooks/whiteboard';
import Whiteboard from '../whiteboard';
import { useCollaborationHistoryRecorder, useCollaborationSession } from "@/hooks/collboration";
import { HistoryControls, ShapesNavbar } from "@/components";

interface CollaborationWhiteboardProps {
  roomId: string;
  wsToken: string;
  entryMode: CollaborationEntryMode;
  cachedElements: Element[];
}

export default function CollaborationWhiteboard({
  roomId,
  wsToken,
  entryMode,
  cachedElements,
}: CollaborationWhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false);
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isAltPressed, setIsAltPressed] = useState<boolean>(false);
  const [isCtrlOrMetaPressed, setIsCtrlOrMetaPressed] = useState<boolean>(false);

  const [whiteBoardState, dispatchWhiteBoardState] = useReducer<WhiteboardState, [action: WhiteboardAction]>(whiteboardReducer, initialWhiteBoardState);

  const {
    elements,
    interaction,
    selectedIds,
    selectionBox,
    tool,
    documentRevision,
  } = whiteBoardState;

  const {
    document,
    elements: collaborationElements,
    initialSyncStatus,
    addElement,
    updateElement,
    removeElement,
    syncElementOrder,
    historyState,
    commitHistoryEntry,
    undo,
    redo,
    mutationLifecycle,
  } = useCollaborationSession({ roomId, wsToken, entryMode, cachedElements });

  const isCollaborationReady = initialSyncStatus === 'completed';
  const mode: WhiteboardMode = isCollaborationReady ? 'editable' : 'readonly';

  const { beginDocumentChange, recordDocumentMutation, commitDocumentChange, discardDocumentChange } = useCollaborationHistoryRecorder({
    onEntryCommitted: commitHistoryEntry,
  });

  const collaborativeDispatch = useCollaborativeWhiteboardDispatch({
    document,
    whiteBoardState,
    dispatchWhiteBoardState,
    addElement,
    updateElement,
    removeElement,
    onDocumentMutation: recordDocumentMutation,
    syncElementOrder
  });

  useEffect(() => {
    collaborativeDispatch({
      type: 'SYNC_DOCUMENT_ELEMENTS',
      elements: collaborationElements,
    });
  }, [collaborationElements, collaborativeDispatch]);

  const {
    pan,
    zoom,
    showBackToContent,
    setPan,
    setCanvasSize,
    handleWheel,
    zoomIn,
    zoomOut,
    resetZoom,
    backToContent,
  } = useWhiteboardViewport({ canvasRef, elements });

  // Temporary history implementation.
  const { recordSnapshot } = useWhiteboardHistory({ elements, dispatchWhiteBoardState: collaborativeDispatch });

  const historyLifecycle = {
    beginDocumentChange,
    commitDocumentChange,
    discardDocumentChange,
  };

  const { handleMouseDown, handleMouseMove, handleMouseUp, cancelInteraction } = useWhiteboardInteractions({
    mode,
    canvasRef,
    elements,
    interaction,
    selectedIds,
    selectionBox,
    tool,
    pan,
    zoom,
    isShiftPressed,
    isCtrlOrMetaPressed,
    isSpacePressed,
    setPan,
    dispatchWhiteBoardState: collaborativeDispatch,
    editing: { documentRevision, recordSnapshot, isAltPressed, historyLifecycle, mutationLifecycle },
  });

  useKeyboardShortcuts({
    mode,
    canvasRef,
    setIsSpacePressed,
    cancelInteraction,
    editing: {
      elements,
      selectedIds,
      setIsShiftPressed,
      setIsAltPressed,
      setIsCtrlOrMetaPressed,
      dispatchWhiteBoardState: collaborativeDispatch,
      recordSnapshot,
      undo,
      redo,
      historyLifecycle,
      mutationLifecycle,
    },
  });

  useWhiteboardCursor({ canvasRef, tool, mode, isSpacePressed });
  useCanvasPreventDefaultEvents({ canvasRef });

  useEffect(() => {
    console.log('Room history state:', historyState);
  }, [historyState]);

  return (
    <Whiteboard
      canvasRef={canvasRef}
      elements={elements}
      pan={pan}
      zoom={zoom}
      selectedIds={selectedIds}
      selectionBox={selectionBox}
      interaction={interaction}
      showBackToContent={showBackToContent}
      onCanvasResize={setCanvasSize}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onZoomIn={zoomIn}
      onZoomOut={zoomOut}
      onResetZoom={resetZoom}
      onBackToContent={backToContent}
      bottomLeftAction={
        <HistoryControls
          canRedo={ isCollaborationReady && historyState.canRedo }
          canUndo={ isCollaborationReady && historyState.canUndo }
          onRedo={redo}
          onUndo={undo}
        />
      }
      toolbar={
        <ShapesNavbar
          tool={tool}
          dispatchWhiteBoardState={collaborativeDispatch}
          setIsSpacePressed={setIsSpacePressed}
        />
      }
    />
  );
}