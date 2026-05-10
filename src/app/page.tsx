'use client'

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ResizeHandle, Shape, Tool, Element } from "@/interfaces";
import ShapesNavbar from "@/components/ShapesNavbar";

function getHandleAtPosition(mx: number, my: number, el: Element): ResizeHandle {
  const centerX = el.x + el.width / 2;
  const centerY = el.y + el.height / 2;
  const dx = mx - centerX;
  const dy = my - centerY;
  const localX = dx * Math.cos(-el.angle) - dy * Math.sin(-el.angle);
  const localY = dx * Math.sin(-el.angle) + dy * Math.cos(-el.angle);

  const absHalfW = Math.abs(el.width) / 2;
  const absHalfH = Math.abs(el.height) / 2;
  const THRESHOLD = 15;
  
  if (Math.abs(localX - 0) < THRESHOLD && Math.abs(localY - (-absHalfH - 25)) < THRESHOLD) { return 'rotation'; }
  if (Math.abs(localX - (-absHalfW)) < THRESHOLD && Math.abs(localY - (-absHalfH)) < THRESHOLD) { return 'top-left'; }
  if (Math.abs(localX - absHalfW) < THRESHOLD && Math.abs(localY - (-absHalfH)) < THRESHOLD) { return 'top-right'; }
  if (Math.abs(localX - (-absHalfW)) < THRESHOLD && Math.abs(localY - absHalfH) < THRESHOLD) { return 'bottom-left'; }
  if (Math.abs(localX - absHalfW) < THRESHOLD && Math.abs(localY - absHalfH) < THRESHOLD) { return 'bottom-right'; }

  return null;
}

function getMouseXY(e: React.MouseEvent, rect: DOMRect): { mouseX: number, mouseY: number } {
  return { mouseX: e.clientX - rect.left, mouseY: e.clientY - rect.top };
}

function isMouseOnElement(mx: number, my: number, el: Element, ctx: CanvasRenderingContext2D): boolean {
  ctx.save();
  const centerX = el.x + el.width / 2;
  const centerY = el.y + el.height / 2;
  
  ctx.translate(centerX, centerY);
  ctx.rotate(el.angle);

  const hw = Math.abs(el.width) / 2;
  const hh = Math.abs(el.height) / 2;

  ctx.beginPath();
  if (el.shape === 'rhombus') {
    ctx.moveTo(0, -hh);
    ctx.lineTo(hw, 0);
    ctx.lineTo(0, hh);
    ctx.lineTo(-hw, 0);
    ctx.closePath();
  } else {
    ctx.rect(-hw, -hh, Math.abs(el.width), Math.abs(el.height));
  }
  
  let isHit = false;
  if (el.fill) {
    isHit = ctx.isPointInPath(mx, my);
  } else {
    ctx.lineWidth = 15; // Slightly larger for easier selection
    isHit = ctx.isPointInStroke(mx, my);
  }
  ctx.restore();
  return isHit;
}

function updateElementPropertiesUsingHandles(
  activeHandle: ResizeHandle, 
  el: Element, 
  mouseX: number, 
  mouseY: number,
  anchor: { x: number, y: number } | null
): Element {
  if (activeHandle === 'rotation') { return updateRotation(el, mouseX, mouseY); }
  if (!anchor) { return el; }

  const newCx = (mouseX + anchor.x) / 2;
  const newCy = (mouseY + anchor.y) / 2;
  const dx = mouseX - anchor.x;
  const dy = mouseY - anchor.y;
  const localW = dx * Math.cos(-el.angle) - dy * Math.sin(-el.angle);
  const localH = dx * Math.sin(-el.angle) + dy * Math.cos(-el.angle);

  // 3. Return the new bounds
  return {
    ...el,
    width: localW,
    height: localH,
    x: newCx - localW / 2,
    y: newCy - localH / 2,
  };
}

function updateRotation(el: Element, mouseX: number, mouseY: number): Element {
  const centerX = el.x + el.width / 2;
  const centerY = el.y + el.height / 2;
  const angle = Math.atan2(mouseY - centerY, mouseX - centerX) + Math.PI / 2;

  return { ...el, angle };
}

function isDrawingTool(tool: Tool): tool is Tool.DRAW_RECTANGLE | Tool.DRAW_RHOMBUS {
  return tool === Tool.DRAW_RECTANGLE || tool === Tool.DRAW_RHOMBUS;
}

function getShapeFromTool(tool: Tool): Shape | null {
  switch (tool) {
    case Tool.DRAW_RECTANGLE:
      return Shape.RECTANGLE;
    case Tool.DRAW_RHOMBUS:
      return Shape.RHOMBUS;
    default:
      return null;
  }
}

export default function WhiteBoard() {
  const HANDLE_SIZE = 8;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>(Tool.SELECT);
  const [selectedId, setSelectedId] = useState<number | null>(-1);
  const [elements, setElements] = useState<Element[]>([
    { id: 1, x: 100, y: 100, width: 350, height: 300, angle: 0 , fill: true, shape: Shape.RECTANGLE, },
    { id: 3, x: 100, y: 100, width: 350, height: 300, angle: 90 , fill: true, shape: Shape.RECTANGLE, },
    { id: 2, x:600, y: 200, width: 350, height: 300, angle: 0, fill: false, shape: Shape.RECTANGLE },
  ]);
  
  const [resizeAnchor, setResizeAnchor] = useState<{ x: number, y: number } | null>(null);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
  const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false);
  
  function handleMouseDown(e: React.MouseEvent): void {
    const canvas = canvasRef.current;
    if (!canvas) { return; }
    const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (!ctx) { return; }

    const rect: DOMRect = canvas.getBoundingClientRect();
    const { mouseX, mouseY } = getMouseXY(e, rect);
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
      setSelectedId(newId);
      setIsDrawing(true);
      return;
    }
    const selected: Element | undefined = elements.find((el) => el.id === selectedId);
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

    let clickedElement: Element | undefined;

    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (isMouseOnElement(mouseX, mouseY, el, ctx)) {
        clickedElement = el;
        break;
      }
    }

    if (clickedElement) {
      setSelectedId(clickedElement.id);
    } else {
      setSelectedId(null);
    }
  }

  function handleMouseMove(e: React.MouseEvent): void {
    const canvas = canvasRef.current;
    if (!canvas) { return; }
    
    const rect: DOMRect = canvas.getBoundingClientRect();
    const { mouseX, mouseY } = getMouseXY(e, rect);

    if (isDrawing && isDrawingTool(tool)) {
      setElements((prev) => prev.map((el) => {
        if (el.id === selectedId) {
          let newWidth = mouseX - el.x;
          let newHeight = mouseY - el.y;

          if (isShiftPressed) {
            const side = Math.max(Math.abs(newWidth), Math.abs(newHeight));
            newWidth = newWidth < 0 ? -side : side;
            newHeight = newHeight < 0 ? -side : side;
          }

          return { ...el, width: newWidth, height: newHeight };
        }

        return el;
      }));

      return;
    }
    
    if (isResizing && selectedId) {
      let effectiveMouseX = mouseX;
      let effectiveMouseY = mouseY;

      if (isShiftPressed && resizeAnchor && activeHandle && activeHandle !== 'rotation') {
        const el = elements.find(e => e.id === selectedId);
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
          if (el.id !== selectedId) return el;
          return updateElementPropertiesUsingHandles(activeHandle, el, effectiveMouseX, effectiveMouseY, resizeAnchor);
        })
      );
    }
  }

  function handleMouseUp(): void {
    setIsResizing(false);
    setIsDrawing(false);
    setTool(Tool.SELECT);
    setActiveHandle(null);
    setResizeAnchor(null);

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
    if (!canvas || !canvas.getContext) { return; }
    const ctx = canvas.getContext('2d');
    if (!ctx) { return; }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    elements.forEach((el) => {
      ctx.save();

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
      } else if (el.shape === Shape.RECTANGLE) {
        ctx.rect(-halfW, -halfH, el.width, el.height);
      }

      // Draw Fill
      if (el.fill) {
        ctx.fillStyle = el.id === selectedId ? 'rgba(59, 130, 246, 0.5)' : 'rgba(0, 0, 0, 0.1)';
        ctx.fill();
      }

      ctx.strokeStyle = el.id === selectedId ? '#3b82f6' : '#000';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (el.id === selectedId) {
        ctx.fillStyle = '#3b82f6';
        
        // 1. Calculate visual (positive) half-dimensions
        const absHalfW = Math.abs(el.width) / 2;
        const absHalfH = Math.abs(el.height) / 2;

        // 2. Draw Corner handles at the visual corners
        ctx.fillRect(-absHalfW - 4, -absHalfH - 4, HANDLE_SIZE, HANDLE_SIZE); // Top-left
        ctx.fillRect(absHalfW - 4, -absHalfH - 4, HANDLE_SIZE, HANDLE_SIZE);  // Top-right
        ctx.fillRect(-absHalfW - 4, absHalfH - 4, HANDLE_SIZE, HANDLE_SIZE);  // Bottom-left
        ctx.fillRect(absHalfW - 4, absHalfH - 4, HANDLE_SIZE, HANDLE_SIZE);   // Bottom-right

        // 3. Draw Rotation handle at the visual top
        ctx.beginPath();
        ctx.arc(0, -absHalfH - 25, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore(); // Clean up for the next element
    });
  }, [elements, selectedId]);

  useEffect(() => {
    const handleCanvasResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleCanvasResize);
    handleCanvasResize();

    return () => window.removeEventListener('resize', handleCanvasResize);
  }, []);

  useEffect(() => { 
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if ((key === 'delete' || key === 'backspace') && selectedId !== null) {
        setElements((prev) => prev.filter((el) => { return el.id !== selectedId; }));
        setSelectedId(null);
      } else if (key === 'v') {
        setTool(Tool.SELECT);
      } else if (key === 'd') {
        setSelectedId(null);
        setTool(Tool.DRAW_RECTANGLE);
      } else if (event.key === 'r') {
        setSelectedId(null);
        setTool(Tool.DRAW_RHOMBUS);
      } else if (event.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => { 
      if (event.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    }
  }, [selectedId]);

  return (
  <div className="fixed inset-0 overflow-hidden bg-slate-200">
    {/* Refined Top Navbar */}
      <ShapesNavbar 
        tool={tool}
        setTool={setTool}
        setSelectedId={setSelectedId}
      />

    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ cursor: tool === Tool.SELECT ? 'default' : 'crosshair' }}
      className="block bg-white touch-none shadow-inner"
    />
  </div>
  );
}
