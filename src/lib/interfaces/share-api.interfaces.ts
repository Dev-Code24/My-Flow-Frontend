import { Element } from '@/interfaces';

export interface FlowDocumentData {
	elements: Element[];
	pan: {
		x: number;
		y: number;
	};
	zoom: number;
}

export interface ShareFlowResponseData {
	flowId: string;
	expiresAt: string;
}

export interface SharedFlowDocument {
	schemaVersion: number;
	canvas: {
	  elements: Element[];
	};
}

export interface SharedFlowDocumentResponseData {
	flowId: string;
	expiresAt: string;
	document: SharedFlowDocument;
}

export interface ShareFlowDocumentRequest {
	document: {
	  schemaVersion: number;
	  canvas: {
		 elements: Element[];
	  };
	};
 }
