'use client'

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ResizeHandle, Shape, Tool, Element } from "@/interfaces";
import { KeyboardKeys, MIN_SHAPE_SIZE } from "@/constanst";
import ShapesNavbar from "@/components/ShapesNavbar";
import { getHandleAtPosition, getMouseXY, getShapeFromTool, isDrawingTool, isElementInSelection, isMouseOnElement, updateElementPropertiesUsingHandles } from "@/utils";

export default function WhiteBoard() {
  const HANDLE_SIZE = 8;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [tool, setTool] = useState<Tool>(Tool.SELECT);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectionBox, setSelectionBox] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
  const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
  const [elements, setElements] = useState<Element[]>([
    { id: 1, x: 100, y: 100, width: 350, height: 300, angle: 0 , fill: true, shape: Shape.RECTANGLE, },
    { id: 3, x: 100, y: 100, width: 350, height: 300, angle: 90 , fill: true, shape: Shape.RECTANGLE, },
    { id: 2, x:600, y: 200, width: 350, height: 300, angle: 0, fill: false, shape: Shape.RECTANGLE },
  ]);

  const [resizeAnchor, setResizeAnchor] = useState<{ x: number, y: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false);
  const [pan, setPan] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  
  function handleMouseDown(e: React.MouseEvent): void {
    const canvas = canvasRef.current;
    if (!canvas) { return; }
    const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (!ctx) { return; }

    const rect: DOMRect = canvas.getBoundingClientRect();
    const rawMouseXY = getMouseXY(e, rect);
    const mouseX = rawMouseXY.mouseX - pan.x;
    const mouseY = rawMouseXY.mouseY - pan.y;

    if ((isSpacePressed) || tool === Tool.PAN) {
      setIsPanning(true);
      setLastMousePos({ x: rawMouseXY.mouseX, y: rawMouseXY.mouseY });
      return;
    }

    const newElementShape = getShapeFromTool(tool);

    if (isDrawingTool(tool) && newElementShape) {
      const newId: number = Date.now();
      const newElement: Element = {
        id: newId,
        x: mouseX,
        y: mouseY,
        width: 0,
        height: 0,
        angle: 0,
        fill: false,
        shape: newElementShape,
      };

      setElements((prev) => [...prev, newElement]);
      setSelectedIds([ newId ]);
      setIsDrawing(true);
      return;
    }

    if (selectedIds.length === 1) {
      const selected: Element | undefined = elements.find((el) => el.id === selectedIds[0]);
      if (selected) {
        const handle = getHandleAtPosition(mouseX, mouseY, selected);
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
          if (handle === "top-left") { anchor = getGlobal(halfW, halfH); }
          else if (handle === "top-right") { anchor = getGlobal(-halfW, halfH); }
          else if (handle === "bottom-right") { anchor = getGlobal(-halfW, -halfH); }
          else if (handle === "bottom-left") { anchor = getGlobal(halfW, -halfH); }
  
          if (anchor) { setResizeAnchor(anchor); }
          
          setIsResizing(true);
          setActiveHandle(handle);
          return;
        }
      }
    }

    let clickedElement: Element | undefined;
    for (let i = elements.length - 1; i >= 0; i--) {
      if (isMouseOnElement(mouseX, mouseY, elements[i], ctx)) {
        clickedElement = elements[i];
        break;
      }
    }

    if (clickedElement) {
      if (!selectedIds.includes(clickedElement.id)) {
        setSelectedIds([clickedElement.id]);
      }
      setIsMoving(true);
      setLastMousePos({ x: rawMouseXY.mouseX, y: rawMouseXY.mouseY });
    } else {
      setSelectedIds([]);
      setIsSelecting(true);
      setSelectionBox({ x1: mouseX, y1: mouseY, x2: mouseX, y2: mouseY });
    }
  }

  function handleMouseMove(e: React.MouseEvent): void {
    const canvas = canvasRef.current;
    if (!canvas) { return; }

    const ctx = canvas.getContext('2d');

    if (!ctx) { return; }
    
    const rect: DOMRect = canvas.getBoundingClientRect();
    const rawMouseXY = getMouseXY(e, rect);
    const mouseX = rawMouseXY.mouseX - pan.x;
    const mouseY = rawMouseXY.mouseY - pan.y;

    if (isPanning) {
      canvas.style.cursor = 'grabbing';
      const dx = rawMouseXY.mouseX - lastMousePos.x;
      const dy = rawMouseXY.mouseY - lastMousePos.y;

      setPan((prev) => {
        return { x: prev.x + dx, y: prev.y + dy };
      })
      
      setLastMousePos({ x: rawMouseXY.mouseX, y: rawMouseXY.mouseY });
      return;
    }

    const isHoveringShape = elements.some((el) => {
      return isMouseOnElement(mouseX, mouseY, el, ctx);
    });

    if (isMoving) {
      canvas.style.cursor = 'grabbing';
    } else if (!!activeHandle) {
      if (activeHandle === 'bottom-left' || activeHandle === 'top-right') {
        canvas.style.cursor = 'nesw-resize';
      } else if (activeHandle === 'top-left' || activeHandle === 'bottom-right') {
        canvas.style.cursor = 'nwse-resize';
      } else if (activeHandle === 'rotation') {
        canvas.style.cursor = 'grabbing';
      }
    } else if (isSpacePressed || tool === Tool.PAN) {
      canvas.style.cursor = 'grab';
    } else if (isHoveringShape && tool === Tool.SELECT) {
      canvas.style.cursor = 'grab';
    } else if (!isSpacePressed) {
      canvas.style.cursor = tool === Tool.SELECT ? 'default' : 'crosshair';
    }

    if (isSelecting && selectionBox) {
      const newBox = { ...selectionBox, x2: mouseX, y2: mouseY };
      setSelectionBox(newBox);
      const idsInBox = elements.filter((el) => isElementInSelection(el, newBox)).map((el) => el.id);
      setSelectedIds(idsInBox);

      return;
    }

    if (isMoving && selectedIds.length > 0) {
      const dx = rawMouseXY.mouseX - lastMousePos.x;
      const dy = rawMouseXY.mouseY - lastMousePos.y;

      setElements((prev: Element[]) => { 
        return prev.map((el: Element) => { 
          if (selectedIds.includes(el.id)) {
            return {
              ...el,
              x: el.x + dx,
              y: el.y + dy,
            };
          }

          return el;
        });
      });

      setLastMousePos({ x: rawMouseXY.mouseX, y: rawMouseXY.mouseY });
      return;
    }

    if (isDrawing && isDrawingTool(tool)) {
      setElements((prev) => prev.map((el) => {
        if (el.id === selectedIds[0]) {
          let newWidth = mouseX - el.x;
          let newHeight = mouseY - el.y;

          if (isShiftPressed) {
            const side = Math.max(Math.abs(newWidth), Math.abs(newHeight));
            const minSizePossible = Math.max(side, MIN_SHAPE_SIZE);
            newWidth = newWidth < 0 ? -minSizePossible : minSizePossible;
            newHeight = newHeight < 0 ? -minSizePossible : minSizePossible;
          }

          return { ...el, width: newWidth, height: newHeight };
        }

        return el;
      }));

      return;
    }
    
    if (isResizing && selectedIds.length === 1) {
      let effectiveMouseX = mouseX;
      let effectiveMouseY = mouseY;

      if (isShiftPressed && resizeAnchor && activeHandle && activeHandle !== 'rotation') {
        const el = elements.find(e => e.id === selectedIds[0]);
        if (el) {
          const ratio = Math.abs(el.width / el.height);
          const dx = mouseX - resizeAnchor.x;
          const dy = mouseY - resizeAnchor.y;
          const localDX = dx * Math.cos(-el.angle) - dy * Math.sin(-el.angle);
          const localDY = dx * Math.sin(-el.angle) + dy * Math.cos(-el.angle);
          const constrainedDY = (localDY < 0 ? -1 : 1) * (Math.abs(localDX) / ratio);

          effectiveMouseX = resizeAnchor.x + (localDX * Math.cos(el.angle) - constrainedDY * Math.sin(el.angle));
          effectiveMouseY = resizeAnchor.y + (localDX * Math.sin(el.angle) + constrainedDY * Math.cos(el.angle));
        }
      }

      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== selectedIds[0]) return el;
          return updateElementPropertiesUsingHandles(activeHandle, el, effectiveMouseX, effectiveMouseY, resizeAnchor);
        })
      );
    }
  }

  function handleMouseUp(): void {
    setIsResizing(false);
    setIsDrawing(false);
    setIsMoving(false);
    setIsSelecting(false);
    setSelectionBox(null);
    setActiveHandle(null);
    setResizeAnchor(null);
    setIsPanning(false);

    const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.cursor = tool === Tool.SELECT ? 'default' : 'crosshair';
      }

    setElements((prev) =>
      prev.map((el) => {
        const newX = el.width < 0 ? el.x + el.width : el.x;
        const newY = el.height < 0 ? el.y + el.height : el.y;
        return {
          ...el,
          x: newX,
          y: newY,
          width: Math.abs(el.width),
          height: Math.abs(el.height),
        };
      })
    );
  }

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext) {
      return;
    }
    if (canvasSize.width === 0 || canvasSize.height === 0) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);

    elements.forEach((el) => {
      ctx.save();

      const isSelected = selectedIds.includes(el.id);
      const centerX = el.x + el.width / 2;
      const centerY = el.y + el.height / 2;
      const halfW = el.width / 2;
      const halfH = el.height / 2;

      ctx.translate(centerX, centerY);
      ctx.rotate(el.angle);
      ctx.beginPath();

      if (el.shape === Shape.RHOMBUS) {
        ctx.moveTo(0, -halfH);
        ctx.lineTo(halfW, 0);
        ctx.lineTo(0, halfH);
        ctx.lineTo(-halfW, 0);
        ctx.closePath();
      } else if (el.shape === Shape.OVAL) {
        ctx.ellipse(0, 0, Math.abs(halfW), Math.abs(halfH), 0, 0, Math.PI * 2);
      } else  if (el.shape === Shape.RECTANGLE) {
        ctx.rect(-halfW, -halfH, el.width, el.height);
      }

      // Draw Fill
      if (el.fill) {
        ctx.fillStyle = isSelected ? "rgba(59, 130, 246, 0.5)" : "rgba(0, 0, 0, 0.1)";
        ctx.fill();
      }

      ctx.strokeStyle = isSelected ? "#3b82f6" : "#000";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (isSelected) {
        // 1. Calculate visual (positive) half-dimensions
        if (selectedIds.length === 1) {
          ctx.fillStyle = "#3b82f6";
          const absHalfW = Math.abs(el.width) / 2;
          const absHalfH = Math.abs(el.height) / 2;

          ctx.fillRect(-absHalfW - 4, -absHalfH - 4, HANDLE_SIZE, HANDLE_SIZE);
          ctx.fillRect(absHalfW - 4, -absHalfH - 4, HANDLE_SIZE, HANDLE_SIZE);
          ctx.fillRect(-absHalfW - 4, absHalfH - 4, HANDLE_SIZE, HANDLE_SIZE);
          ctx.fillRect(absHalfW - 4, absHalfH - 4, HANDLE_SIZE, HANDLE_SIZE);

          ctx.beginPath();
          ctx.arc(0, -absHalfH - 25, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore(); // Clean up for the next element
    });

    if (isSelecting && selectionBox) {
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
      ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
      const x = Math.min(selectionBox.x1, selectionBox.x2);
      const y = Math.min(selectionBox.y1, selectionBox.y2);
      const w = Math.abs(selectionBox.x2 - selectionBox.x1);
      const h = Math.abs(selectionBox.y2 - selectionBox.y1);
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [elements, selectedIds, isSelecting, selectionBox, canvasSize, pan.x, pan.y]);

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      const key = event.key.toLowerCase();
      if (event.key === KeyboardKeys.SPACEBAR) {
        const canvas = canvasRef.current;
        if (!canvas) { return; }

        event.preventDefault();
        setIsSpacePressed(true);
        canvas.style.cursor = 'grab';
        return;
      }

      if (key === KeyboardKeys.BACKSPACE && selectedIds.length) {
        setElements((prev) =>
          prev.filter((el) => {
            return !selectedIds.includes(el.id);
          }),
        );
        setSelectedIds([]);
      } else if (key === KeyboardKeys.V) {
        setTool(Tool.SELECT);
      } else if (key === KeyboardKeys.D) {
        setSelectedIds([]);
        setTool(Tool.DRAW_RECTANGLE);
      } else if (key === KeyboardKeys.R) {
        setSelectedIds([]);
        setTool(Tool.DRAW_RHOMBUS);
      } else if (key === KeyboardKeys.O) {
        setSelectedIds([]);
        setTool(Tool.DRAW_OVAL);
      } else if (key === KeyboardKeys.SHIFT) {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (event.key === KeyboardKeys.SPACEBAR) {
        setIsSpacePressed(false);
        return;
      }
      if (key === KeyboardKeys.SHIFT) {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedIds]);

  return (
  <div className="fixed inset-0 overflow-hidden bg-slate-200">
    {/* Refined Top Navbar */}
      <ShapesNavbar 
        tool={tool}
        setTool={setTool}
        setSelectedId={setSelectedIds}
        setIsSpacePressed={setIsSpacePressed}
      />

    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ cursor: tool === Tool.SELECT ? 'default' : 'crosshair' }}
      className="absolute top-0 left-0 w-full h-full block bg-white touch-none shadow-inner" />
  </div>
  );
}
