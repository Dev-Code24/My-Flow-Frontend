"use client";

import { useCallback, useEffect, useState } from "react";
import * as Y from "yjs";
import { Element } from "@/interfaces";
import {
	addElementToYDoc, getElementsFromYDoc,
	getYElementOrder, getYElements, removeElementFromYDoc, syncYElementOrder, updateYElement, YElementMap, YElementOrder,
	YElementsMap,
} from "@/lib/yjs";

interface UseCollaborationDocumentResult {
	document: Y.Doc;
	yElements: YElementsMap;
	yElementOrder: YElementOrder;
	elements: Element[];
	addElement: (element: Element) => void;
	updateElement: (elementId: string, updates: Partial<Element>) => void;
	removeElement: (elementId: string) => void;
	syncElementOrder: (elements: Element[]) => void;
}

interface CollaborationDocument {
	document: Y.Doc;
	yElements: YElementsMap;
	yElementOrder: YElementOrder;
}

export function useCollaborationDocument(): UseCollaborationDocumentResult {
	const [collaborationDocument] = useState<CollaborationDocument>(() => {
		const document = new Y.Doc();

		return {
			document,
			yElements: getYElements(document),
			yElementOrder: getYElementOrder(document),
		};
	});

	const { document, yElements, yElementOrder } = collaborationDocument;

	const [elements, setElements] = useState<Element[]>([]);

	useEffect(() => {
		function handleDocumentChange(): void {
			console.log('ELEMENT ORDER:', yElementOrder.toArray());
			console.log(
				'RENDERED ELEMENTS:',
				getElementsFromYDoc(
					yElements,
					yElementOrder,
				).map((element) => element.id),
			);
			setElements(getElementsFromYDoc(yElements, yElementOrder));
		}

		yElements.observeDeep(handleDocumentChange);
		yElements.observe(handleDocumentChange);

		return () => {
			yElements.unobserveDeep(handleDocumentChange);
			yElements.unobserve(handleDocumentChange);
		};
	}, [yElementOrder, yElements]);

	const addElement = useCallback((element: Element): void => {
			addElementToYDoc(yElements, element);
		},
		[yElements],
	);

	const updateElement = useCallback((elementId: string, updates: Partial<Element>): void => {
			const yElement: YElementMap | undefined = yElements.get(elementId);

			if (!yElement) {
				return;
			}

			updateYElement(yElement, updates);
		},
		[yElements],
	);

	const removeElement = useCallback((elementId: string): void => {
			if (!yElements.has(elementId)) {
				return;
			}

			removeElementFromYDoc(yElements, elementId);
		},
		[yElements],
	);

	const syncElementOrder = useCallback((elements: Element[]): void => {
				syncYElementOrder(yElementOrder, elements);
			},
			[yElementOrder],
		);

	return {
		document,
		yElements,
		elements,
		addElement,
		updateElement,
		removeElement,
		syncElementOrder,
		yElementOrder
	};
}