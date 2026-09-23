import { Element } from './whiteboard.interfaces';

export interface HistoryElementState {
  element: Element;
  index: number;
  orderContext: {
    previousElementId: string | null;
    nextElementId: string | null;
  };
}
export interface HistoryElementChange {
  elementId: string;
  before: HistoryElementState | null;
  after: HistoryElementState | null;
}

export interface CollaborationHistoryEntryDraft {
  entryId: string;
  changes: HistoryElementChange[];
}

export interface RoomHistoryState {
  cursor: number;
  historyVersion: number;
  historyLength: number;
  canUndo: boolean;
  canRedo: boolean;
}

export interface DocumentHistoryLifecycle {
  beginDocumentChange: VoidFunction;
  commitDocumentChange: VoidFunction;
  discardDocumentChange: VoidFunction;
}