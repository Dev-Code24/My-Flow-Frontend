import { Coordinates2D, Element, Interaction, Shape } from "@/interfaces";

export function drawCanvas(
   ctx: CanvasRenderingContext2D,
   canvas: HTMLCanvasElement,
   elements: Element[],
   pan: Coordinates2D,
   zoom: number,
   selectedIds: number[],
   selectionBox: { x1: number, y1: number, x2: number, y2: number } | null,
   interaction: Interaction
): void {
   const HANDLE_SIZE = 8;
   ctx.clearRect(0, 0, canvas.width, canvas.height);
   ctx.save();
   ctx.translate(pan.x, pan.y);
   ctx.scale(zoom, zoom);

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
         const vHandle = HANDLE_SIZE / zoom; 
         const vOffset = vHandle / 2;

         ctx.fillRect(-absHalfW - vOffset, -absHalfH - vOffset, vHandle, vHandle);
         ctx.fillRect(absHalfW - vOffset, -absHalfH - vOffset, vHandle, vHandle);
         ctx.fillRect(-absHalfW - vOffset, absHalfH - vOffset, vHandle, vHandle);
         ctx.fillRect(absHalfW - vOffset, absHalfH - vOffset, vHandle, vHandle);

         ctx.beginPath();
         ctx.arc(0, -absHalfH - (25 / zoom), (6 / zoom), 0, Math.PI * 2);
         ctx.fill();
      }
   }

   ctx.restore(); // Clean up for the next element
   });

   // creating marquee for selecting elements
   if (interaction === 'selecting' && selectionBox) {
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
}