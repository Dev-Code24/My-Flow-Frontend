import { CursorStyles, MIN_SHAPE_SIZE } from "@/constants";
import { Element, ResizeHandle, Shape, Tool } from "@/interfaces";

export function getHandleAtPosition(mx: number, my: number, el: Element): ResizeHandle {
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

  // 2. Edges (evaluate second)
  const isYWithin = localY >= -absHalfH && localY <= absHalfH;
  const isXWithin = localX >= -absHalfW && localX <= absHalfW;

  if (isYWithin && Math.abs(localX - (-absHalfW)) < THRESHOLD) { return 'left'; }
  if (isYWithin && Math.abs(localX - absHalfW) < THRESHOLD) { return 'right'; }
  if (isXWithin && Math.abs(localY - (-absHalfH)) < THRESHOLD) { return 'top'; }
  if (isXWithin && Math.abs(localY - absHalfH) < THRESHOLD) { return 'bottom'; }

  return null;
}

export function getMouseXY(e: React.MouseEvent, rect: DOMRect): { mouseX: number, mouseY: number } {
  return { mouseX: e.clientX - rect.left, mouseY: e.clientY - rect.top };
}

export function isMouseOnElement(
  mx: number,
  my: number,
  el: Element,
  ctx: CanvasRenderingContext2D
): boolean {
  ctx.save();
  const centerX = el.x + el.width / 2;
  const centerY = el.y + el.height / 2;
  
  ctx.translate(centerX, centerY);
  ctx.rotate(el.angle);

  const hw = Math.abs(el.width) / 2;
  const hh = Math.abs(el.height) / 2;

  ctx.beginPath();
  if (el.shape === Shape.RHOMBUS) {
    ctx.moveTo(0, -hh);
    ctx.lineTo(hw, 0);
    ctx.lineTo(0, hh);
    ctx.lineTo(-hw, 0);
    ctx.closePath();
  } else if (el.shape === Shape.OVAL) {
    ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
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

export function updateElementPropertiesUsingHandles(
  activeHandle: ResizeHandle, 
  el: Element, 
  mouseX: number, 
  mouseY: number,
  anchor: { x: number, y: number } | null
): Element {
  if (activeHandle === 'rotation') { return updateRotation(el, mouseX, mouseY); }
  if (!anchor) { return el; }

  const dx = mouseX - anchor.x;
  const dy = mouseY - anchor.y;
  let localW = dx * Math.cos(-el.angle) - dy * Math.sin(-el.angle);
  let localH = dx * Math.sin(-el.angle) + dy * Math.cos(-el.angle);

  if (activeHandle === 'right') { 
    localH = Math.abs(el.height); 
  } else if (activeHandle === 'left') { 
    localH = -Math.abs(el.height); 
  } else if (activeHandle === 'bottom') { 
    localW = Math.abs(el.width); 
  } else if (activeHandle === 'top') { 
    localW = -Math.abs(el.width); 
  }

  const signW = localW < 0 ? -1 : 1;
  const signH = localH < 0 ? -1 : 1;

  if (Math.abs(localW) < MIN_SHAPE_SIZE) {
    localW = MIN_SHAPE_SIZE * signW;
  }
  if (Math.abs(localH) < MIN_SHAPE_SIZE) {
    localH = MIN_SHAPE_SIZE * signH;
  }

  const localWVectorX = localW * Math.cos(el.angle);
  const localWVectorY = localW * Math.sin(el.angle);
  const localHVectorX = -localH * Math.sin(el.angle);
  const localHVectorY = localH * Math.cos(el.angle);

  const globalTargetX = anchor.x + localWVectorX + localHVectorX;
  const globalTargetY = anchor.y + localWVectorY + localHVectorY;

  const newCx = (anchor.x + globalTargetX) / 2;
  const newCy = (anchor.y + globalTargetY) / 2;

  return {
    ...el,
    width: localW,
    height: localH,
    x: newCx - localW / 2,
    y: newCy - localH / 2,
  };
}

export function updateRotation(el: Element, mouseX: number, mouseY: number): Element {
  const centerX = el.x + el.width / 2;
  const centerY = el.y + el.height / 2;
  const angle = Math.atan2(mouseY - centerY, mouseX - centerX) + Math.PI / 2;

  return { ...el, angle };
}

export function isDrawingTool(tool: Tool): tool is Tool.DRAW_RECTANGLE | Tool.DRAW_RHOMBUS | Tool.DRAW_OVAL {
  return tool === Tool.DRAW_RECTANGLE || tool === Tool.DRAW_RHOMBUS || tool === Tool.DRAW_OVAL;
}

export function getShapeFromTool(tool: Tool): Shape | null {
  switch (tool) {
    case Tool.DRAW_RECTANGLE:
      return Shape.RECTANGLE;
    case Tool.DRAW_RHOMBUS:
      return Shape.RHOMBUS;
    case Tool.DRAW_OVAL:
      return Shape.OVAL;
    default:
      return null;
  }
}

export function getElementCorners(el: Element) {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const hw = el.width / 2;
  const hh = el.height / 2;

  const rotate = (px: number, py: number) => ({
    x: cx + px * Math.cos(el.angle) - py * Math.sin(el.angle),
    y: cy + px * Math.sin(el.angle) + py * Math.cos(el.angle)
  });

  return [
    rotate(-hw, -hh), // Top Left
    rotate(hw, -hh),  // Top Right
    rotate(hw, hh),   // Bottom Right
    rotate(-hw, hh)   // Bottom Left
  ];
}

export function isElementInSelection(el: Element, box: { x1: number, y1: number, x2: number, y2: number }): boolean {
  const minX = Math.min(box.x1, box.x2);
  const maxX = Math.max(box.x1, box.x2);
  const minY = Math.min(box.y1, box.y2);
  const maxY = Math.max(box.y1, box.y2);

  const corners = getElementCorners(el);
  
  // Inclusive selection: true if all corners are inside the box
  return corners.every(c => c.x >= minX && c.x <= maxX && c.y >= minY && c.y <= maxY);
}

export function getCursorForHandle(angle: number, handle: ResizeHandle, isResizing: boolean): CursorStyles {
  if (!handle) {
    return CursorStyles.DEFAULT;
  }

  if (handle === 'rotation') {
    return isResizing ? CursorStyles.GRABBING : CursorStyles.GRAB;
  }

  // Map each handle to its base angle in degrees
  const baseAngles: Record<string, number> = {
    'right': 0,
    'bottom-right': 45,
    'bottom': 90,
    'bottom-left': 135,
    'left': 180,
    'top-left': 225,
    'top': 270,
    'top-right': 315
  };

  const baseAngle = baseAngles[handle];
  if (baseAngle === undefined) { return CursorStyles.DEFAULT; }

  // 1. Convert shape's radian angle to degrees
  const angleInDegrees = angle * (180 / Math.PI);

  // 2. Add the shape's rotation to the handle's base angle
  let totalAngle = (baseAngle + angleInDegrees) % 360;
  if (totalAngle < 0) {
    totalAngle += 360; // Normalize negative angles
  }

  // 3. CSS cursors represent axes, which repeat every 180 degrees.
  totalAngle = totalAngle % 180;

  // 4. Map the resulting angle to the closest CSS cursor slice
  if (totalAngle < 22.5 || totalAngle >= 157.5) {
    return CursorStyles.EW_RESIZE;    // Horizontal axis
  } else if (totalAngle >= 22.5 && totalAngle < 67.5) {
    return CursorStyles.NWSE_RESIZE;  // Top-Left to Bottom-Right diagonal axis
  } else if (totalAngle >= 67.5 && totalAngle < 112.5) {
    return CursorStyles.NS_RESIZE;    // Vertical axis
  } else if (totalAngle >= 112.5 && totalAngle < 157.5) {
    return CursorStyles.NESW_RESIZE;  // Top-Right to Bottom-Left diagonal axis
  }

  return CursorStyles.DEFAULT;
}