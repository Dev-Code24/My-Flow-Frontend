'use client';

import { RefObject, useEffect, useLayoutEffect, useState } from 'react';

import { Coordinates2D, Element, Interaction, WhiteboardState } from '@/interfaces';

import { drawCanvas } from '@/utils';

interface CanvasSize {
	width: number;
	height: number;
}

interface WhiteboardSurfaceProps {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	elements: Element[];
	pan: Coordinates2D;
	zoom: number;
	selectedIds: string[];
	selectionBox: WhiteboardState['selectionBox'];
	interaction: Interaction;
	onCanvasResize: (size: CanvasSize) => void;
	onMouseDown?: (event: React.MouseEvent<HTMLCanvasElement>) => void;
	onMouseMove?: (event: React.MouseEvent<HTMLCanvasElement>) => void;
	onMouseUp?: (event: React.MouseEvent<HTMLCanvasElement>) => void;
	onWheel?: (event: React.WheelEvent<HTMLCanvasElement>) => void;
}

export default function WhiteboardSurface({
	canvasRef,
	elements,
	pan,
	zoom,
	selectedIds,
	selectionBox,
	interaction,
	onCanvasResize,
	onMouseDown,
	onMouseMove,
	onMouseUp,
	onWheel,
}: WhiteboardSurfaceProps) {
	const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });

	useLayoutEffect(() => {
		const canvas = canvasRef.current;

		if (!canvas || canvasSize.width === 0 || canvasSize.height === 0) {
			return;
		}

		const context = canvas.getContext('2d');

		if (!context) {
			return;
		}

		drawCanvas(context, canvas, elements, pan, zoom, selectedIds, selectionBox, interaction);
	}, [canvasRef, canvasSize, elements, pan, zoom, selectedIds, selectionBox, interaction]);

	useEffect(() => {
		const canvas = canvasRef.current;

		if (!canvas) {
			return;
		}

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];

			if (!entry) {
				return;
			}

			const width = Math.round(entry.contentRect.width);

			const height = Math.round(entry.contentRect.height);

			if (canvas.width === width && canvas.height === height) {
				return;
			}

			canvas.width = width;
			canvas.height = height;

			const nextSize: CanvasSize = {
				width,
				height,
			};

			setCanvasSize(nextSize);
			onCanvasResize(nextSize);
		});

		observer.observe(canvas);

		return () => {
			observer.disconnect();
		};
	}, [canvasRef, onCanvasResize]);

	return (
		<canvas
			ref={canvasRef}
			onMouseDown={onMouseDown}
			onMouseMove={onMouseMove}
			onMouseUp={onMouseUp}
			onWheel={onWheel}
			className='absolute left-0 top-0 block h-full w-full touch-none bg-white shadow-inner'
		/>
	);
}
