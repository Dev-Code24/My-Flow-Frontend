'use client';

import { MouseEvent as ReactMouseEvent, ReactNode, RefObject, WheelEvent as ReactWheelEvent } from 'react';

import { Coordinates2D, Element, Interaction, WhiteboardState } from '@/interfaces';

import BackToContent from '@/components/whiteboard/BackToContent';
import ZoomControls from '@/components/whiteboard/ZoomControls';
import WhiteboardSurface from '@/components/whiteboard/WhiteboardSurface';

interface CanvasSize {
	width: number;
	height: number;
}

interface WhiteboardProps {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	elements: Element[];
	pan: Coordinates2D;
	zoom: number;
	selectedIds: string[];
	selectionBox: WhiteboardState['selectionBox'];
	interaction: Interaction;
	showBackToContent: boolean;
	onCanvasResize: (size: CanvasSize) => void;
	onMouseDown: (event: ReactMouseEvent<HTMLCanvasElement>) => void;
	onMouseMove: (event: ReactMouseEvent<HTMLCanvasElement>) => void;
	onMouseUp: (event: ReactMouseEvent<HTMLCanvasElement>) => void;
	onWheel: (event: ReactWheelEvent<HTMLCanvasElement>) => void;
	onZoomIn: () => void;
	onZoomOut: () => void;
	onResetZoom: () => void;
	onBackToContent: () => void;
	toolbar?: ReactNode;
	topRightAction?: ReactNode;
	bottomLeftAction?: ReactNode;
}

export default function Whiteboard({
	canvasRef,
	elements,
	pan,
	zoom,
	selectedIds,
	selectionBox,
	interaction,
	showBackToContent,
	onCanvasResize,
	onMouseDown,
	onMouseMove,
	onMouseUp,
	onWheel,
	onZoomIn,
	onZoomOut,
	onResetZoom,
	onBackToContent,
	toolbar,
	topRightAction,
	bottomLeftAction,
}: WhiteboardProps) {
	return (
		<div className='fixed inset-0 overflow-hidden bg-slate-200'>
		{toolbar}

		<div className='absolute bottom-6 left-6 z-20 flex items-center gap-2'>
			<ZoomControls
				zoom={zoom}
				onZoomOut={onZoomOut}
				onZoomIn={onZoomIn}
				onResetZoom={onResetZoom}
			/>

			{bottomLeftAction}
		</div>

		<BackToContent
			visible={showBackToContent}
			onClick={onBackToContent}
		/>

		<WhiteboardSurface
			canvasRef={canvasRef}
			elements={elements}
			pan={pan}
			zoom={zoom}
			selectedIds={selectedIds}
			selectionBox={selectionBox}
			interaction={interaction}
			onCanvasResize={onCanvasResize}
			onMouseDown={onMouseDown}
			onMouseMove={onMouseMove}
			onMouseUp={onMouseUp}
			onWheel={onWheel}
		/>

		{topRightAction}
		</div>
	);
}