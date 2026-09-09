import { Element } from './whiteboard.interfaces';

export interface HistoryElementState {
  element: Element;
  index: number;
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

export interface DocumentHistoryLifecycle {
  beginDocumentChange: VoidFunction;
  commitDocumentChange: VoidFunction;
  discardDocumentChange: VoidFunction;
}