import * as Y from "yjs";

import { Element, Shape } from "@/interfaces";
import { addElementToYDoc, getElementsFromYDoc, getYElements, removeElementFromYDoc, seedYDoc, updateYElement } from "./element.utils";

export function validateYjsElementModel(): void {
	const documentA = new Y.Doc();
	const documentB = new Y.Doc();

	const elementsA = getYElements(documentA);
	const elementsB = getYElements(documentB);

	const rectangleId = crypto.randomUUID();
	const arrowId = crypto.randomUUID();

	const initialElements: Element[] = [
		{
			id: rectangleId,
			x: 100,
			y: 100,
			width: 200,
			height: 150,
			angle: 0,
			fill: false,
			shape: Shape.RECTANGLE,
		},
		{
			id: arrowId,
			x: 400,
			y: 200,
			width: 300,
			height: 100,
			angle: 0,
			fill: false,
			shape: Shape.ARROW,
			curveOffset: {
				x: 20,
				y: 50,
			},
		},
	];

	seedYDoc(elementsA, initialElements);

	const initialUpdate = Y.encodeStateAsUpdate(documentA);

	Y.applyUpdate(documentB, initialUpdate);

	validateInitialSynchronization(elementsB, rectangleId, arrowId);

	documentA.on("update", (update: Uint8Array) => {
		Y.applyUpdate(documentB, update);
	});

	validateElementAddition(elementsA, elementsB);

	validateElementMovement(elementsA, elementsB, rectangleId);

	validateArrowCurve(elementsA, elementsB, arrowId);

	validateElementDeletion(elementsA, elementsB);

	validateConcurrentUpdates(documentA, documentB, elementsA, elementsB, rectangleId);

	console.log("Yjs element model validation passed.");

	documentA.destroy();
	documentB.destroy();
}

function validateInitialSynchronization(elementsB: ReturnType<typeof getYElements>, rectangleId: string, arrowId: string): void {
	const elements = getElementsFromYDoc(elementsB);

	assert(elements.length === 2, "Initial synchronization should contain two elements.");

	const rectangle = elements.find((element) => element.id === rectangleId);

	assert(rectangle !== undefined, "Rectangle should exist after initial synchronization.");

	assert(
		rectangle.x === 100 && rectangle.y === 100 && rectangle.width === 200 && rectangle.height === 150,
		"Rectangle properties should survive synchronization.",
	);

	const arrow = elements.find((element) => element.id === arrowId);

	assert(arrow !== undefined, "Arrow should exist after initial synchronization.");

	assert(
		arrow.curveOffset !== undefined && arrow.curveOffset.x === 20 && arrow.curveOffset.y === 50,
		"Arrow curveOffset should survive synchronization.",
	);
}

function validateElementAddition(elementsA: ReturnType<typeof getYElements>, elementsB: ReturnType<typeof getYElements>): void {
	const oval: Element = {
		id: crypto.randomUUID(),
		x: 800,
		y: 300,
		width: 150,
		height: 150,
		angle: 0,
		fill: false,
		shape: Shape.OVAL,
	};

	addElementToYDoc(elementsA, oval);

	const receivedOval = elementsB.get(oval.id);

	assert(receivedOval !== undefined, "Added element should synchronize to document B.");
}

function validateElementMovement(elementsA: ReturnType<typeof getYElements>, elementsB: ReturnType<typeof getYElements>, elementId: string): void {
	const elementA = elementsA.get(elementId);

	assert(elementA !== undefined, "Element should exist before movement.");

	updateYElement(elementA, {
		x: 500,
		y: 600,
	});

	const elementB = elementsB.get(elementId);

	assert(elementB !== undefined, "Moved element should exist in document B.");

	const receivedElement = getElementsFromYDoc(elementsB).find((element) => element.id === elementId);

	assert(receivedElement !== undefined && receivedElement.x === 500 && receivedElement.y === 600, "Element movement should synchronize.");
}

function validateArrowCurve(elementsA: ReturnType<typeof getYElements>, elementsB: ReturnType<typeof getYElements>, arrowId: string): void {
	const arrow = elementsA.get(arrowId);

	assert(arrow !== undefined, "Arrow should exist before curve update.");

	updateYElement(arrow, {
		curveOffset: {
			x: 80,
			y: 120,
		},
	});

	const receivedArrow = getElementsFromYDoc(elementsB).find((element) => element.id === arrowId);

	assert(
		receivedArrow !== undefined &&
			receivedArrow.curveOffset !== undefined &&
			receivedArrow.curveOffset.x === 80 &&
			receivedArrow.curveOffset.y === 120,
		"Arrow curveOffset should synchronize.",
	);
}

function validateElementDeletion(elementsA: ReturnType<typeof getYElements>, elementsB: ReturnType<typeof getYElements>): void {
	const temporaryElement: Element = {
		id: crypto.randomUUID(),
		x: 0,
		y: 0,
		width: 100,
		height: 100,
		angle: 0,
		fill: false,
		shape: Shape.RECTANGLE,
	};

	addElementToYDoc(elementsA, temporaryElement);

	assert(elementsB.has(temporaryElement.id), "Temporary element should synchronize before deletion.");

	removeElementFromYDoc(elementsA, temporaryElement.id);

	assert(!elementsB.has(temporaryElement.id), "Deleted element should be removed from document B.");
}

function validateConcurrentUpdates(
	documentA: Y.Doc,
	documentB: Y.Doc,
	elementsA: ReturnType<typeof getYElements>,
	elementsB: ReturnType<typeof getYElements>,
	elementId: string,
): void {
	const updateFromA: Uint8Array[] = [];
	const updateFromB: Uint8Array[] = [];

	const handleUpdateA = (update: Uint8Array): void => {
		updateFromA.push(update);
	};

	const handleUpdateB = (update: Uint8Array): void => {
		updateFromB.push(update);
	};

	documentA.on("update", handleUpdateA);
	documentB.on("update", handleUpdateB);

	const elementA = elementsA.get(elementId);
	const elementB = elementsB.get(elementId);

	assert(elementA !== undefined && elementB !== undefined, "Element should exist in both documents before concurrent changes.");

	updateYElement(elementA, {
		x: 900,
	});

	updateYElement(elementB, {
		fill: true,
	});

	documentA.off("update", handleUpdateA);

	documentB.off("update", handleUpdateB);

	updateFromA.forEach((update) => {
		Y.applyUpdate(documentB, update);
	});

	updateFromB.forEach((update) => {
		Y.applyUpdate(documentA, update);
	});

	const resultA = getElementsFromYDoc(elementsA).find((element) => element.id === elementId);
	const resultB = getElementsFromYDoc(elementsB).find((element) => element.id === elementId);

	assert(resultA !== undefined && resultB !== undefined, "Concurrent element should exist in both documents.");
	assert(resultA.x === 900 && resultB.x === 900, "Concurrent x update should converge.");
	assert(resultA.fill === true && resultB.fill === true, "Concurrent fill update should converge.");
}

function assert(condition: boolean, message: string): asserts condition {
	if (!condition) {
		throw new Error(`Yjs validation failed: ${message}`);
	}
}
