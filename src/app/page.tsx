'use client'

import React, { useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import ShapesNavbar from '@/components/ShapesNavbar';
import ShareModal from '@/components/ShareModal';

import { ResizeHandle, Tool, Element, Coordinates2D, Interaction, WhiteboardState, WhiteboardAction } from '@/interfaces';
import { CORNER_HANDLES, CursorStyles, initialWhiteBoardState, MIN_SHAPE_SIZE } from '@/constants';
import { getCanvasPoint, getContentBounds, getCursorForHandle, getHandleAtPosition, getShapeFromTool, isDrawingTool, isMouseOnElement, updateElementPropertiesUsingHandles } from '@/utils';
import { drawCanvas } from '@/utils/draw-canvas';

import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useStartSession } from '@/hooks/useStartSession';
import { useExportFlow } from '@/hooks/useShareFlow';

import { whiteboardReducer } from '@/reducer/whiteboard.reducer';

export default function WhiteBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [whiteBoardState, dispatchWhiteBoardState] = useReducer<WhiteboardState, [action: WhiteboardAction]>(whiteboardReducer, initialWhiteBoardState);
  const { elements, interaction, selectedIds, selectionBox, tool } = whiteBoardState;

  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
  const lastMousePos = useRef<Coordinates2D>({ x: 0, y: 0 });
  const [resizeAnchor, setResizeAnchor] = useState<Coordinates2D | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false);
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [pan, setPan] = useState<Coordinates2D>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1); // (1 = 100%)

  const contentBounds = useMemo(() => getContentBounds(elements), [elements]);

  const { startSession, isStartingSession } = useStartSession();
  const { exportFlow, isExporting } = useExportFlow();

  function zoomTo(targetZoom: number, centerX: number, centerY: number) {
    const clampedZoom = Math.max(0.1, Math.min(targetZoom, 3));

    const scaleRatio = clampedZoom / zoom;

    setPan({
      x: centerX - (centerX - pan.x) * scaleRatio,
      y: centerY - (centerY - pan.y) * scaleRatio,
    });

    setZoom(clampedZoom);
  }

  function handleMouseDown(e: React.MouseEvent): void {
    if (e.button === 1) {  e.preventDefault(); }
    const canvas = canvasRef.current;
    if (!canvas) { return; }
    const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (!ctx) { return; }

    const { x, y, rawX, rawY } = getCanvasPoint(e, canvas, pan, zoom);

    if (isSpacePressed || e.button === 1 || tool === Tool.PAN) {
      dispatchWhiteBoardState({ type: 'SET_INTERACTION', interaction: Interaction.PANNING });

      lastMousePos.current = { x: rawX, y: rawY };
      canvas.style.cursor = CursorStyles.GRABBING;
      return;
    }

    if (e.button !== 0) { return; }

    const newElementShape = getShapeFromTool(tool);

    if (isDrawingTool(tool) && newElementShape) {
      const newId: number = Date.now();
      const newElement: Element = {
        id: newId,
        x,
        y,
        width: 0,
        height: 0,
        angle: 0,
        fill: false,
        shape: newElementShape,
      };

      dispatchWhiteBoardState({ type: 'START_DRAW', element: newElement });
      return;
    }

    if (selectedIds.length === 1) {
      const selected: Element | undefined = elements.find((el) => el.id === selectedIds[0]);
      if (selected) {
        const handle = getHandleAtPosition(x, y, selected);
        if (handle) {
          const cx = selected.x + selected.width / 2;
          const cy = selected.y + selected.height / 2;
          const halfW = selected.width / 2;
          const halfH = selected.height / 2;
          const getGlobal = (lx: number, ly: number) => ({
            x: cx + lx * Math.cos(selected.angle) - ly * Math.sin(selected.angle),
            y: cy + lx * Math.sin(selected.angle) + ly * Math.cos(selected.angle)
          });
  
          let anchor;
          if (handle === 'top-left' || handle === 'top' || handle === 'left') { 
            anchor = getGlobal(halfW, halfH); 
          } else if (handle === 'top-right') { 
            anchor = getGlobal(-halfW, halfH); 
          } else if (handle === 'bottom-right' || handle === 'bottom' || handle === 'right') { 
            anchor = getGlobal(-halfW, -halfH); 
          } else if (handle === 'bottom-left') { 
            anchor = getGlobal(halfW, -halfH); 
          }
  
          if (anchor) { setResizeAnchor(anchor); }
          
          dispatchWhiteBoardState({ type: 'SET_INTERACTION', interaction: Interaction.RESIZING })
          setActiveHandle(handle);
          canvas.style.cursor = getCursorForHandle(selected.angle, handle, true);
          return;
        }
      }
    }

    let clickedElement: Element | undefined;
    for (let i = elements.length - 1; i >= 0; i--) {
      if (isMouseOnElement(x, y, elements[i], ctx)) {
        clickedElement = elements[i];
        break;
      }
    }

    if (clickedElement) {
      if (!selectedIds.includes(clickedElement.id)) {
        dispatchWhiteBoardState({ type: 'SELECT_ELEMENT', id: clickedElement.id });
      }
      dispatchWhiteBoardState({ type: 'SET_INTERACTION', interaction: Interaction.MOVING });
      lastMousePos.current = { x: rawX, y: rawY };
      canvas.style.cursor = CursorStyles.GRABBING;
    } else {
      dispatchWhiteBoardState({ type: 'START_SELECTION', x, y });
    }
  }

  function handleMouseMove(e: React.MouseEvent): void {
    const canvas = canvasRef.current;
    if (!canvas) { return; }

    const ctx = canvas.getContext('2d');

    if (!ctx) { return; }

    const { x, y, rawX, rawY } = getCanvasPoint(e, canvas, pan, zoom);
    const isMiddleClickPanning = e.buttons === 4;

    if (interaction === Interaction.PANNING || isMiddleClickPanning) {
      canvas.style.cursor = CursorStyles.GRABBING;
      const dx = rawX - lastMousePos.current.x;
      const dy = rawY - lastMousePos.current.y;

      setPan((prev) => {
        return { x: prev.x + dx, y: prev.y + dy };
      })
      
      lastMousePos.current = { x: rawX, y: rawY };
      return;
    }

    const isHoveringShape = elements.some((el) => {
      return isMouseOnElement(x, y, el, ctx);
    });

    let hoveredHandle: ResizeHandle = null;

    if (selectedIds.length === 1 && tool === Tool.SELECT && !isSpacePressed && interaction !== Interaction.MOVING && interaction !== Interaction.RESIZING) {
      const selected = elements.find((el) => el.id === selectedIds[0]);
      if (selected) {
        hoveredHandle = getHandleAtPosition(x, y, selected);
      }
    }

    const visibleHandle = activeHandle || hoveredHandle;
    let cursorAngle = 0;
    if (selectedIds.length === 1) {
      const activeEl = elements.find((el) => el.id === selectedIds[0]);
      if (activeEl) {
        cursorAngle = activeEl.angle;
      }
    }

    if (interaction === Interaction.MOVING) {
      canvas.style.cursor = CursorStyles.GRABBING;
    } else if (!!visibleHandle) {
      canvas.style.cursor = getCursorForHandle(cursorAngle, visibleHandle, !!activeHandle);
    } else if (isSpacePressed || tool === Tool.PAN || (isHoveringShape && tool === Tool.SELECT)) {
      canvas.style.cursor = CursorStyles.GRAB;
    } else if (!isSpacePressed) {
      canvas.style.cursor = tool === Tool.SELECT ? CursorStyles.DEFAULT : CursorStyles.CROSSHAIR;
    }

    if (interaction === Interaction.SELECTING && selectionBox) {
      dispatchWhiteBoardState({ type: 'UPDATE_SELECTION', x, y });
      return;
    }

    if (interaction === Interaction.MOVING && selectedIds.length > 0) {
      const dx = (rawX - lastMousePos.current.x) / zoom;
      const dy = (rawY - lastMousePos.current.y) / zoom;

      dispatchWhiteBoardState({ type: 'MOVE_SELECTED', dx, dy });

      lastMousePos.current = { x: rawX, y: rawY };
      return;
    }

    if (interaction === Interaction.DRAWING && isDrawingTool(tool)) {
      dispatchWhiteBoardState({
        type: 'SET_ELEMENTS', updater: (prev: Element[]) => prev.map((el: Element) => {
          if (el.id === selectedIds[0]) {
            let newWidth = x - el.x;
            let newHeight = y - el.y;
            
            if (isShiftPressed) {
              const side = Math.max(Math.abs(newWidth), Math.abs(newHeight));
              const minSizePossible = Math.max(side, MIN_SHAPE_SIZE);
              newWidth = newWidth < 0 ? -minSizePossible : minSizePossible;
              newHeight = newHeight < 0 ? -minSizePossible : minSizePossible;
            }

            return { ...el, width: newWidth, height: newHeight };
          }

          return el;
        })
      });

      return;
    }
    
    if (interaction === Interaction.RESIZING && selectedIds.length === 1) {
      let effectiveMouseX = x;
      let effectiveMouseY = y;
      const isCornerHandle = activeHandle && CORNER_HANDLES.includes(activeHandle);

      if (isShiftPressed && resizeAnchor && isCornerHandle) {
        const el = elements.find(e => e.id === selectedIds[0]);
        if (el) {
          const ratio = Math.abs(el.width / el.height);
          const dx = x - resizeAnchor.x;
          const dy = y - resizeAnchor.y;
          const localDX = dx * Math.cos(-el.angle) - dy * Math.sin(-el.angle);
          const localDY = dx * Math.sin(-el.angle) + dy * Math.cos(-el.angle);
          const constrainedDY = (localDY < 0 ? -1 : 1) * (Math.abs(localDX) / ratio);

          effectiveMouseX = resizeAnchor.x + (localDX * Math.cos(el.angle) - constrainedDY * Math.sin(el.angle));
          effectiveMouseY = resizeAnchor.y + (localDX * Math.sin(el.angle) + constrainedDY * Math.cos(el.angle));
        }
      }

      dispatchWhiteBoardState({
        type: 'SET_ELEMENTS', updater: (prev: Element[]) => prev.map((el) => {
          if (el.id !== selectedIds[0]) { return el; }
          return updateElementPropertiesUsingHandles(activeHandle, el, effectiveMouseX, effectiveMouseY, resizeAnchor);
      })})
    }
  }

  function handleMouseUp(e: React.MouseEvent): void {
    setActiveHandle(null);
    setResizeAnchor(null);
    dispatchWhiteBoardState({ type: 'END_INTERACTION' });

    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext('2d');
      const { x, y } = getCanvasPoint(e, canvas, pan, zoom);
      let nextCursor = tool === Tool.SELECT ? 'default' : 'crosshair';

      if (tool === Tool.SELECT && selectedIds.length === 1) {
        const selected = elements.find((el) => el.id === selectedIds[0]);
        if (selected && ctx) {
          const hoveredHandle = getHandleAtPosition(x, y, selected);
          if (hoveredHandle) {
            nextCursor = getCursorForHandle(selected.angle, hoveredHandle, false);
          } else if (isMouseOnElement(x, y, selected, ctx)) {
            nextCursor = CursorStyles.GRAB;
          }
        }
      }

      canvas.style.cursor = nextCursor;
    }

    dispatchWhiteBoardState({ type: 'NORMALIZE_ELEMENTS' });
  }

  function handleBackToContent(): void {
    if (elements.length === 0) { return; }
    
    const { minValues, maxValues } = contentBounds;
    const contentCenter: Coordinates2D = {
      x: (minValues.x + maxValues.x) / 2,
      y: (minValues.y + maxValues.y) / 2,
    };
    
    setPan({
      x: (canvasSize.width / 2) - contentCenter.x,
      y: (canvasSize.height / 2) - contentCenter.y,
    });
    setZoom(1);
  }

  function handleWheel(e: React.WheelEvent): void {
    if (e.ctrlKey || e.metaKey) {
      const zoomSensitivity = 0.01;
      const delta = -e.deltaY * zoomSensitivity;
      let newZoom = zoom * (1 + delta);
      newZoom = Math.max(0.1, Math.min(newZoom, 3)); // limits zoom to 300%

      const canvas = canvasRef.current;

      if (!canvas) { return; }

      const canvasRect = canvas.getBoundingClientRect();
      zoomTo(newZoom, e.clientX - canvasRect.left, e.clientY - canvasRect.top);
      return;
    }

    setPan((prev) => ({
      x: prev.x - e.deltaX,
      y: prev.y - e.deltaY,
    }));
  }

  function handleZoomUI(delta: number) {
    let newZoom = zoom + delta;
    newZoom = Math.max(0.1, Math.min(newZoom, 3));
    zoomTo(newZoom, canvasSize.width / 2, canvasSize.height / 2)
  }

  function handleResetZoom() {
    if (zoom === 1) { return; }

    zoomTo(1, canvasSize.width / 2, canvasSize.height / 2);
  }

  async function handleExportToLink(): Promise<void> {
    await exportFlow({ elements, pan, zoom });
  }

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext) {
      return;
    }
    if (canvasSize.width === 0 || canvasSize.height === 0) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    drawCanvas(ctx, canvas, elements, pan, zoom, selectedIds, selectionBox, interaction);
  }, [elements, selectedIds, interaction, selectionBox, canvasSize, pan, zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ width, height });
      }
    });

    observer.observe(canvas);

    return () => {
      observer.disconnect();
    };
  }, []);

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

  let showBackToContent: boolean = false;
  if (elements.length > 0 && canvasSize.width > 0) { 
    const { minValues, maxValues } = contentBounds;
    
    const viewportMin: Coordinates2D = { x: -pan.x / zoom, y: -pan.y / zoom };
    const viewportMax: Coordinates2D = { x: (-pan.x + canvasSize.width) / zoom, y: (-pan.y + canvasSize.height) / zoom };
    const isNotVisible = minValues.x < viewportMax.x && maxValues.x > viewportMin.x &&
      minValues.y < viewportMax.y && maxValues.y > viewportMin.y;
    showBackToContent = !isNotVisible;
  }

  return (
  <div className='fixed inset-0 overflow-hidden bg-slate-200'>
    <ShapesNavbar 
      tool={tool}
      dispatchWhiteBoardState={dispatchWhiteBoardState}  
      setIsSpacePressed={setIsSpacePressed}
    />

    <div className='absolute bottom-6 left-6 z-20 flex items-center bg-white rounded-lg shadow-md border border-[#EBEAF0] px-1 py-1 text-sm font-medium text-[#3F3F49]'>
      <button onClick={() => handleZoomUI(-0.1)} className='w-7 h-7 flex items-center justify-center hover:bg-[#F4F4F7] rounded-md cursor-pointer transition-colors'>-</button>
      <span className='w-11 text-center select-none'>{Math.round(zoom * 100)}%</span>
      <button onClick={() => handleZoomUI(0.1)} className='w-7 h-7 flex items-center justify-center hover:bg-[#F4F4F7] rounded-md cursor-pointer transition-colors'>+</button>
      
      <span aria-hidden className='w-px h-5 mx-1 bg-[#E7E5EC] shrink-0' />

      <button 
        onClick={handleResetZoom} 
        className='px-2 h-7 flex items-center justify-center hover:bg-[#F4F4F7] rounded-md cursor-pointer transition-colors'
        title='Reset zoom to 100%'>
        Reset
      </button>
    </div>

    {showBackToContent && (
      <button
        onClick={handleBackToContent}
        className='absolute bottom-8 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-[#6246EA] text-white text-sm font-medium rounded-full shadow-[0_8px_24px_-8px_rgba(98,70,234,0.5)] hover:bg-[#5238cc] transition-colors cursor-pointer flex items-center gap-2'
      >
        Back to Content
      </button>
    )}

    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className='absolute top-0 left-0 w-full h-full block bg-white touch-none shadow-inner'
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
