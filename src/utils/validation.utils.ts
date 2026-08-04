import { Shape } from '@/interfaces';
import { SharedFlowDocument } from '@/lib/interfaces';

export function isValidSharedFlowDocument(value: unknown): value is SharedFlowDocument {
   if (typeof value !== 'object' || value === null) {
      return false;
   }

   if (!('schemaVersion' in value) || typeof value.schemaVersion !== 'number') {
      return false;
   }

   if (!('canvas' in value) || typeof value.canvas !== 'object' || value.canvas === null) {
      return false;
   }

   if (!('elements' in value.canvas) || !Array.isArray(value.canvas.elements)) {
      return false;
   }

   return value.canvas.elements.every(isValidElement);
}

function isValidElement(value: unknown): value is Element {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	return (
		'id' in value &&
		typeof value.id === 'string' &&
		'x' in value &&
		typeof value.x === 'number' &&
		Number.isFinite(value.x) &&
		'y' in value &&
		typeof value.y === 'number' &&
		Number.isFinite(value.y) &&
		'width' in value &&
		typeof value.width === 'number' &&
		Number.isFinite(value.width) &&
		'height' in value &&
		typeof value.height === 'number' &&
		Number.isFinite(value.height) &&
		'angle' in value &&
		typeof value.angle === 'number' &&
		Number.isFinite(value.angle) &&
		'fill' in value &&
		typeof value.fill === 'boolean' &&
		'shape' in value &&
		Object.values(Shape).includes(value.shape as Shape)
	);
}
