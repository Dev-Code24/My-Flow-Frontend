'use client';

import { useEffect, useReducer, useRef, useState } from 'react';

import { Element, CollaborationParticipant, WhiteboardAction, WhiteboardMode, WhiteboardState } from '@/interfaces';
import { initialWhiteBoardState } from '@/constants';
import { whiteboardReducer } from '@/reducer/whiteboard.reducer';
import { useCanvasPreventDefaultEvents, useCollaborativeWhiteboardDispatch, useKeyboardShortcuts, useWhiteboardCursor,
  useWhiteboardHistory, useWhiteboardInteractions, useWhiteboardViewport
} from '@/hooks/whiteboard';
import Whiteboard from '../whiteboard';
import { useCollaborationDocument } from "@/hooks/collboration";
import { ShapesNavbar } from "@/components";
import { useWebsocket } from "@/hooks/websocket";

interface CollaborationWhiteboardProps {
  participant: CollaborationParticipant;
  wsToken: string;
  initialElements?: Element[];
}

export default function CollaborationWhiteboard({
  participant,
  initialElements = [],
  wsToken,
}: CollaborationWhiteboardProps) {
  const mode: WhiteboardMode = 'editable';

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false);
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isAltPressed, setIsAltPressed] = useState<boolean>(false);
  const [isCtrlOrMetaPressed, setIsCtrlOrMetaPressed] = useState<boolean>(false);
  const [collaborationInitialElements] = useState<Element[]>(() => participant.role === 'CREATOR' ? initialElements : []);

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
    addElement,
    updateElement,
    removeElement,
  } = useCollaborationDocument({
    role: participant.role === 'CREATOR' ? 'creator' : 'joiner',
    initialElements: collaborationInitialElements,
  });

  useWebsocket({ wsToken, document });

  const collaborativeDispatch = useCollaborativeWhiteboardDispatch({ document, whiteBoardState, dispatchWhiteBoardState, addElement, updateElement, removeElement });

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
  const { recordSnapshot, undo, redo } = useWhiteboardHistory({
    elements,
    dispatchWhiteBoardState: collaborativeDispatch,
  });

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
    editing: { documentRevision, recordSnapshot, isAltPressed },
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
    },
  });

  useWhiteboardCursor({ canvasRef, tool, mode, isSpacePressed });
  useCanvasPreventDefaultEvents({ canvasRef });

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