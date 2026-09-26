import { Element } from '@/interfaces';

export interface WhiteboardDocumentOperations {
  addElement: (element: Element) => void;
  updateElements: (updater: (elements: Element[]) => Element[]) => void;
  moveElements: (elementIds: string[], dx: number, dy: number) => void;
  duplicateElements: (elementIds: string[]) => Element[];
  deleteElements: (elementIds: string[]) => void;
  replaceElements: (elements: Element[]) => void;
  normalizeElements: () => void;
}