"use client";

import { RefObject, useCallback, useMemo, useState } from "react";

import { Coordinates2D, Element } from "@/interfaces";

import { getContentBounds } from "@/utils";

interface CanvasSize {
	width: number;
	height: number;
}

interface UseWhiteboardViewportParams {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	elements: Element[];
	initialPan?: Coordinates2D;
	initialZoom?: number;
}

interface UseWhiteboardViewportResult {
	pan: Coordinates2D;
	zoom: number;
	canvasSize: CanvasSize;
	showBackToContent: boolean;
	setPan: React.Dispatch<React.SetStateAction<Coordinates2D>>;
	setZoom: React.Dispatch<React.SetStateAction<number>>;
	setCanvasSize: React.Dispatch<React.SetStateAction<CanvasSize>>;
	handleWheel: (event: React.WheelEvent<HTMLCanvasElement>) => void;
	zoomIn: () => void;
	zoomOut: () => void;
	resetZoom: () => void;
	backToContent: () => void;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;
const WHEEL_ZOOM_SENSITIVITY = 0.01;

export function useWhiteboardViewport({
	canvasRef,
	elements,
	initialPan = {
		x: 0,
		y: 0,
	},
	initialZoom = 1,
}: UseWhiteboardViewportParams): UseWhiteboardViewportResult {
	const [pan, setPan] = useState<Coordinates2D>(initialPan);

	const [zoom, setZoom] = useState<number>(initialZoom);

	const [canvasSize, setCanvasSize] = useState<CanvasSize>({
		width: 0,
		height: 0,
	});

	const contentBounds = useMemo(() => getContentBounds(elements), [elements]);

	const backToContent = useCallback((): void => {
		if (elements.length === 0) { return; }
	
		const { minValues, maxValues } = contentBounds;
	
		const contentCenter: Coordinates2D = {
			x: (minValues.x + maxValues.x) / 2,
			y: (minValues.y + maxValues.y) / 2,
		};
	
		setPan({
			x: canvasSize.width / 2 - contentCenter.x * zoom,
			y: canvasSize.height / 2 - contentCenter.y * zoom,
		});
	}, [elements.length, contentBounds, canvasSize, zoom]);

	const showBackToContent = useMemo(() => {
		if (elements.length === 0 || canvasSize.width === 0 || canvasSize.height === 0) {
			return false;
		}

		const { minValues, maxValues } = contentBounds;

		const viewportMin: Coordinates2D = {
			x: -pan.x / zoom,
			y: -pan.y / zoom,
		};

		const viewportMax: Coordinates2D = {
			x: (-pan.x + canvasSize.width) / zoom,

			y: (-pan.y + canvasSize.height) / zoom,
		};

		const isContentVisible = minValues.x < viewportMax.x && maxValues.x > viewportMin.x && minValues.y < viewportMax.y && maxValues.y > viewportMin.y;

		return !isContentVisible;
	}, [elements.length, canvasSize, contentBounds, pan, zoom]);

	const zoomTo = useCallback(
		(targetZoom: number, centerX: number, centerY: number): void => {
			const clampedZoom = clampZoom(targetZoom);

			setPan((currentPan) => {
				const scaleRatio = clampedZoom / zoom;

				return {
					x: centerX - (centerX - currentPan.x) * scaleRatio,

					y: centerY - (centerY - currentPan.y) * scaleRatio,
				};
			});

			setZoom(clampedZoom);
		},
		[zoom],
	);

	const changeZoom = useCallback((delta: number): void => {
			zoomTo(zoom + delta, canvasSize.width / 2, canvasSize.height / 2);
      }, [zoom, canvasSize, zoomTo]
   );

	const zoomIn = useCallback((): void => {
		changeZoom(ZOOM_STEP);
	}, [changeZoom]);

	const zoomOut = useCallback((): void => {
		changeZoom(-ZOOM_STEP);
	}, [changeZoom]);

	const resetZoom = useCallback((): void => {
		if (elements.length === 0) {
			zoomTo(1, canvasSize.width / 2, canvasSize.height / 2);
			return;
		}
	
		const { minValues, maxValues } = contentBounds;
	
		const contentCenter: Coordinates2D = {
			x: (minValues.x + maxValues.x) / 2,
			y: (minValues.y + maxValues.y) / 2,
		};
	
		setZoom(1);
	
		setPan({
			x: canvasSize.width / 2 - contentCenter.x,
			y: canvasSize.height / 2 - contentCenter.y,
		});
	}, [elements.length, contentBounds, canvasSize, zoomTo]);

	const handleWheel = useCallback(
		(event: React.WheelEvent<HTMLCanvasElement>): void => {
			if (event.ctrlKey || event.metaKey) {
				const delta = -event.deltaY * WHEEL_ZOOM_SENSITIVITY;
				const nextZoom = zoom * (1 + delta);
				const canvas = canvasRef.current;

				if (!canvas) { return; }

				const canvasRect = canvas.getBoundingClientRect();

				zoomTo(nextZoom, event.clientX - canvasRect.left, event.clientY - canvasRect.top);

				return;
			}

			setPan((currentPan) => ({
				x: currentPan.x - event.deltaX,
				y: currentPan.y - event.deltaY,
			}));
		},
		[canvasRef, zoom, zoomTo],
	);

	return {
		pan,
		zoom,
		canvasSize,
		showBackToContent,
		setPan,
		setZoom,
		setCanvasSize,
		handleWheel,
		zoomIn,
		zoomOut,
		resetZoom,
		backToContent,
	};
}

function clampZoom(zoom: number): number {
	return Math.max(MIN_ZOOM, Math.min(zoom, MAX_ZOOM));
}
