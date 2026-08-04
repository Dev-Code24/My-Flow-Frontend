import { Coordinates2D } from '@/interfaces';

export function getMouseXY(e: React.MouseEvent, rect: DOMRect): { mouseX: number; mouseY: number } {
   return { mouseX: e.clientX - rect.left, mouseY: e.clientY - rect.top };
}

export function getCanvasPoint(
   e: React.MouseEvent,
   canvas: HTMLCanvasElement,
   pan: Coordinates2D,
   zoom: number,
): {
   rawX: number;
   rawY: number;
   x: number;
   y: number;
} {
   const rect = canvas.getBoundingClientRect();
   const { mouseX, mouseY } = getMouseXY(e, rect);

   return {
      rawX: mouseX,
      rawY: mouseY,
      x: (mouseX - pan.x) / zoom,
      y: (mouseY - pan.y) / zoom,
   };
}

export function hasCrossedDrawingThreshold(start: Coordinates2D, current: Coordinates2D, threshold: number): boolean {
   const dx = current.x - start.x;
   const dy = current.y - start.y;

   return Math.hypot(dx, dy) >= threshold;
}