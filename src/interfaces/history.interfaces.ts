export interface DocumentHistoryLifecycle {
  beginDocumentChange: VoidFunction;
  commitDocumentChange: VoidFunction;
  discardDocumentChange: VoidFunction;
}