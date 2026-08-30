"use client";

import { useCallback, useEffect, useState } from "react";
import * as Y from "yjs";

import { Element } from "@/interfaces";
import {
	addElementToYDoc,
	getElementsFromYDoc,
	getYElements,
	removeElementFromYDoc,
	seedYDoc,
	updateYElement,
	YElementMap,
	YElementsMap,
} from "@/lib/yjs";

export type CollaborationRole = "creator" | "joiner";

interface UseCollaborationDocumentParams {
	role: CollaborationRole;
	initialElements?: Element[];
}

interface UseCollaborationDocumentResult {
	document: Y.Doc;
	yElements: YElementsMap;
	elements: Element[];

	addElement: (element: Element) => void;

	updateElement: (elementId: string, updates: Partial<Element>) => void;

	removeElement: (elementId: string) => void;
}

interface CollaborationDocument {
	document: Y.Doc;
	yElements: YElementsMap;
}

export function useCollaborationDocument({ role, initialElements = [] }: UseCollaborationDocumentParams): UseCollaborationDocumentResult {
	const [collaborationDocument] = useState<CollaborationDocument>(() => {
		const document = new Y.Doc();

		return {
			document,
			yElements: getYElements(document),
		};
	});

	const { document, yElements } = collaborationDocument;

	const [elements, setElements] = useState<Element[]>(role === "creator" ? initialElements : []);

	useEffect(() => {
		function handleDocumentChange(): void {
			setElements(getElementsFromYDoc(yElements));
		}

		yElements.observeDeep(handleDocumentChange);

		if (role === "creator" && yElements.size === 0) {
			seedYDoc(yElements, initialElements);
		}

		return () => {
			yElements.unobserveDeep(handleDocumentChange);

			document.destroy();
		};
	}, [document, yElements, role, initialElements]);

	const addElement = useCallback(
		(element: Element): void => {
			addElementToYDoc(yElements, element);
		},
		[yElements],
	);

	const updateElement = useCallback(
		(elementId: string, updates: Partial<Element>): void => {
			const yElement: YElementMap | undefined = yElements.get(elementId);

			if (!yElement) {
				return;
			}

			updateYElement(yElement, updates);
		},
		[yElements],
	);

	const removeElement = useCallback(
		(elementId: string): void => {
			if (!yElements.has(elementId)) {
				return;
			}

			removeElementFromYDoc(yElements, elementId);
		},
		[yElements],
	);

	return {
		document,
		yElements,
		elements,

		addElement,
		updateElement,
		removeElement,
	};
}
