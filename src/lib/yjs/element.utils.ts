import * as Y from "yjs";

import { Element, Coordinates2D } from "@/interfaces";
import { YJS_COORDINATE_KEYS, YJS_DOCUMENT_KEYS, YJS_ELEMENT_KEYS } from "@/constants";

export type YElementMap = Y.Map<unknown>;
export type YElementsMap = Y.Map<YElementMap>;

export function getYElements(document: Y.Doc): YElementsMap {
	return document.getMap<YElementMap>(YJS_DOCUMENT_KEYS.ELEMENTS);
}

export function createYElement(element: Element): YElementMap {
	const yElement = new Y.Map<unknown>();

	yElement.set(YJS_ELEMENT_KEYS.X, element.x);
	yElement.set(YJS_ELEMENT_KEYS.Y, element.y);
	yElement.set(YJS_ELEMENT_KEYS.WIDTH, element.width);
	yElement.set(YJS_ELEMENT_KEYS.HEIGHT, element.height);
	yElement.set(YJS_ELEMENT_KEYS.ANGLE, element.angle);
	yElement.set(YJS_ELEMENT_KEYS.FILL, element.fill);
	yElement.set(YJS_ELEMENT_KEYS.SHAPE, element.shape);

	if ("curveOffset" in element && element.curveOffset) {
		yElement.set(YJS_ELEMENT_KEYS.CURVE_OFFSET, createYCoordinates(element.curveOffset));
	}

	return yElement;
}

export function getElementFromYMap(id: string, yElement: YElementMap): Element {
	const curveOffset = getCoordinatesFromYElement(yElement, YJS_ELEMENT_KEYS.CURVE_OFFSET);

	return {
		id,
		x: yElement.get(YJS_ELEMENT_KEYS.X) as number,
		y: yElement.get(YJS_ELEMENT_KEYS.Y) as number,
		width: yElement.get(YJS_ELEMENT_KEYS.WIDTH) as number,
		height: yElement.get(YJS_ELEMENT_KEYS.HEIGHT) as number,
		angle: yElement.get(YJS_ELEMENT_KEYS.ANGLE) as number,
		fill: yElement.get(YJS_ELEMENT_KEYS.FILL) as boolean,
		shape: yElement.get(YJS_ELEMENT_KEYS.SHAPE) as Element["shape"],
		...(curveOffset ? { curveOffset } : {}),
	} as Element;
}

export function addElementToYDoc(yElements: YElementsMap, element: Element): void {
	yElements.set(element.id, createYElement(element));
}

export function updateYElement(yElement: YElementMap, updates: Partial<Element>): void {
	runInTransaction(yElement, () => {
		if (updates.x !== undefined) {
			setIfChanged(yElement, YJS_ELEMENT_KEYS.X, updates.x);
		}

		if (updates.y !== undefined) {
			setIfChanged(yElement, YJS_ELEMENT_KEYS.Y, updates.y);
		}

		if (updates.width !== undefined) {
			setIfChanged(yElement, YJS_ELEMENT_KEYS.WIDTH, updates.width);
		}

		if (updates.height !== undefined) {
			setIfChanged(yElement, YJS_ELEMENT_KEYS.HEIGHT, updates.height);
		}

		if (updates.angle !== undefined) {
			setIfChanged(yElement, YJS_ELEMENT_KEYS.ANGLE, updates.angle);
		}

		if (updates.fill !== undefined) {
			setIfChanged(yElement, YJS_ELEMENT_KEYS.FILL, updates.fill);
		}

		if (updates.shape !== undefined) {
			setIfChanged(yElement, YJS_ELEMENT_KEYS.SHAPE, updates.shape);
		}

		if ("curveOffset" in updates) {
			updateCurveOffset(yElement, updates.curveOffset as Coordinates2D | undefined);
		}
	});
}

export function removeElementFromYDoc(yElements: YElementsMap, elementId: string): void {
	yElements.delete(elementId);
}

export function seedYDoc(yElements: YElementsMap, elements: Element[]): void {
	runInTransaction(yElements, () => {
		elements.forEach((element) => {
			addElementToYDoc(yElements, element);
		});
	});
}

export function getElementsFromYDoc(yElements: YElementsMap): Element[] {
	const elements: Element[] = [];

	yElements.forEach((yElement, elementId) => {
		elements.push(getElementFromYMap(elementId, yElement));
	});

	return elements;
}

function createYCoordinates(coordinates: Coordinates2D): Y.Map<number> {
	const yCoordinates = new Y.Map<number>();

	yCoordinates.set(YJS_COORDINATE_KEYS.X, coordinates.x);

	yCoordinates.set(YJS_COORDINATE_KEYS.Y, coordinates.y);

	return yCoordinates;
}

function getCoordinatesFromYElement(yElement: YElementMap, key: string): Coordinates2D | undefined {
	const yCoordinates = yElement.get(key);

	if (!(yCoordinates instanceof Y.Map)) {
		return undefined;
	}

	return {
		x: yCoordinates.get(YJS_COORDINATE_KEYS.X) as number,
		y: yCoordinates.get(YJS_COORDINATE_KEYS.Y) as number,
	};
}

function updateCurveOffset(yElement: YElementMap, curveOffset: Coordinates2D | undefined): void {
	if (!curveOffset) {
		yElement.delete(YJS_ELEMENT_KEYS.CURVE_OFFSET);

		return;
	}

	const existingCurveOffset = yElement.get(YJS_ELEMENT_KEYS.CURVE_OFFSET);

	if (existingCurveOffset instanceof Y.Map) {
		setIfChanged(existingCurveOffset, YJS_COORDINATE_KEYS.X, curveOffset.x);

		setIfChanged(existingCurveOffset, YJS_COORDINATE_KEYS.Y, curveOffset.y);

		return;
	}

	yElement.set(YJS_ELEMENT_KEYS.CURVE_OFFSET, createYCoordinates(curveOffset));
}

function setIfChanged<T>(map: Y.Map<unknown>, key: string, value: T): void {
	if (map.get(key) === value) {
		return;
	}

	map.set(key, value);
}

function runInTransaction<T>(map: Y.Map<T>, callback: () => void): void {
	if (!map.doc) {
		callback();
		return;
	}

	map.doc.transact(callback);
}
