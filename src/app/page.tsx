'use client'

import { useEffect, useReducer, useRef, useState } from 'react';
import BackToContent from '@/components/whiteboard/BackToContent';
import ZoomControls from '@/components/whiteboard/ZoomControls';
import ShapesNavbar from '@/components/ShapesNavbar';
import ShareModal from '@/components/ShareModal';

import { WhiteboardState, WhiteboardAction, Tool } from '@/interfaces';
import { CursorStyles, initialWhiteBoardState } from '@/constants';

import { useKeyboardShortcuts } from '@/hooks/whiteboard/useKeyboardShortcuts';
import { useStartSession } from '@/hooks/useStartSession';
import { useExportFlow } from '@/hooks/useShareFlow';

import { whiteboardReducer } from '@/reducer/whiteboard.reducer';
import WhiteboardSurface from '@/components/whiteboard/WhiteboardSurface';
import { useWhiteboardViewport } from '@/hooks/whiteboard/useWhiteboardViewport';
import { useWhiteboardInteractions } from '@/hooks/whiteboard/useWhiteboardInteractions';

export default function WhiteBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false);
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);

  const [whiteBoardState, dispatchWhiteBoardState] = useReducer<WhiteboardState, [action: WhiteboardAction]>(whiteboardReducer, initialWhiteBoardState);
  const { elements, interaction, selectedIds, selectionBox, tool } = whiteBoardState;

  const { startSession, isStartingSession } = useStartSession();
  const { exportFlow, isExporting } = useExportFlow();
  const { pan, zoom, showBackToContent, setPan, setCanvasSize, handleWheel, zoomIn, zoomOut, resetZoom, backToContent } = useWhiteboardViewport({ canvasRef, elements})
  const { handleMouseDown, handleMouseMove, handleMouseUp } = useWhiteboardInteractions({
    canvasRef,
    elements,
    interaction,
    selectedIds,
    selectionBox,
    tool,
    pan,
    zoom,
    isShiftPressed,
    isSpacePressed,
    setPan,
    dispatchWhiteBoardState,
  });

  async function handleExportToLink(): Promise<void> {
    await exportFlow({ elements, pan, zoom });
  }

  useKeyboardShortcuts({
    canvasRef, selectedIds, dispatchWhiteBoardState, setIsSpacePressed, setIsShiftPressed
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isSpacePressed || tool === Tool.PAN) {
      canvas.style.cursor = CursorStyles.GRAB;
    } else if (tool === Tool.SELECT) {
      canvas.style.cursor = CursorStyles.DEFAULT;
    } else {
      canvas.style.cursor = CursorStyles.CROSSHAIR;
    }
  }, [tool, isSpacePressed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) { return; }
    const preventDefault = (e: WheelEvent | MouseEvent) => {
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); }
      if (e instanceof MouseEvent && e.button === 1) { e.preventDefault(); }
    };

    canvas.addEventListener('wheel', preventDefault, { passive: false });
    canvas.addEventListener('mousedown', preventDefault, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', preventDefault);
      canvas.removeEventListener('mousedown', preventDefault);
    };
  }, []);

  return (
  <div className='fixed inset-0 overflow-hidden bg-slate-200'>
    <ShapesNavbar 
      tool={tool}
      dispatchWhiteBoardState={dispatchWhiteBoardState}  
      setIsSpacePressed={setIsSpacePressed}
    />

    <ZoomControls
      zoom={zoom}
      onZoomOut={zoomOut}
      onZoomIn={zoomIn}
      onResetZoom={resetZoom}
    />

    <BackToContent
      visible={showBackToContent}
      onClick={backToContent}
      />

    <WhiteboardSurface
      canvasRef={canvasRef}
      elements={elements}
      pan={pan}
      zoom={zoom}
      selectedIds={selectedIds}
      selectionBox={selectionBox}
      interaction={interaction}
      onCanvasResize={setCanvasSize}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    />

    <ShareModal
      onStartSession={startSession}
      onExportToLink={handleExportToLink}
      isStartingSession={isStartingSession}
      isExporting={isExporting}
    />
    </div>
  );
}
