import { FlowDocumentData } from './share-api.interfaces';

export interface LocalWorkspace {
	version: number;
	document: FlowDocumentData;
	updatedAt: number;
}