'use client';

import { useReducer, useRef, useState } from 'react';
import Whiteboard from '@/components/whiteboard';
import { HistoryControls, ShapesNavbar, ShareModal } from '@/components';

import { whiteboardReducer } from '@/reducer/whiteboard.reducer';
import { WhiteboardState, WhiteboardAction, WhiteboardMode } from '@/interfaces';
import { initialWhiteBoardState } from '@/constants';

import { useKeyboardShortcuts, useWhiteboardViewport, useWhiteboardInteractions, useWhiteboardCursor, useCanvasPreventDefaultEvents, useWhiteboardHistory } from '@/hooks/whiteboard';
import { useStartSession, useExportFlow } from '@/hooks/api';
import { useLocalWorkspace } from '@/hooks/local-storage';

export default function Home() {
	const mode: WhiteboardMode = 'editable';
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false);
	const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);

	const [whiteBoardState, dispatchWhiteBoardState] = useReducer<WhiteboardState, [action: WhiteboardAction]>(whiteboardReducer, initialWhiteBoardState);
	const { elements, interaction, selectedIds, selectionBox, tool, documentRevision } = whiteBoardState;

	const { startSession, isStartingSession } = useStartSession();
	const { exportFlow, isExporting } = useExportFlow();
	const { pan, zoom, showBackToContent, setZoom, setPan, setCanvasSize, handleWheel, zoomIn, zoomOut, resetZoom, backToContent } = useWhiteboardViewport({ canvasRef, elements });
	const { canRedo, canUndo, recordSnapshot, undo, redo } = useWhiteboardHistory({ elements, dispatchWhiteBoardState });
	const { handleMouseDown, handleMouseMove, handleMouseUp } = useWhiteboardInteractions({
		mode,
		canvasRef,
		elements,
		interaction,
		selectedIds,
		selectionBox,
		tool,
		pan,
		zoom,
		isShiftPressed,
		isSpacePressed,
		setPan,
		dispatchWhiteBoardState,
		documentRevision,
		recordSnapshot,
	});

	async function handleExportToLink(): Promise<void> {
		await exportFlow({ elements, pan, zoom });
	}

	useKeyboardShortcuts({ elements, mode, canvasRef, selectedIds, dispatchWhiteBoardState, setIsSpacePressed, setIsShiftPressed, recordSnapshot, undo, redo });

	useWhiteboardCursor({ canvasRef, tool, mode, isSpacePressed });

	useCanvasPreventDefaultEvents({ canvasRef });

	useLocalWorkspace({
		elements,
		pan,
		zoom,
		setPan,
		setZoom,
		dispatchWhiteBoardState,
	});

	return (
		<Whiteboard
			canvasRef={canvasRef}
			elements={elements}
			pan={pan}
			zoom={zoom}
			selectedIds={selectedIds}
			selectionBox={selectionBox}
			interaction={interaction}
			showBackToContent={showBackToContent}
			onCanvasResize={setCanvasSize}
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onWheel={handleWheel}
			onZoomIn={zoomIn}
			onZoomOut={zoomOut}
			onResetZoom={resetZoom}
			onBackToContent={backToContent}
			toolbar={<ShapesNavbar tool={tool} dispatchWhiteBoardState={dispatchWhiteBoardState} setIsSpacePressed={setIsSpacePressed} />}
			topRightAction={
				<ShareModal
					onStartSession={startSession}
					onExportToLink={handleExportToLink}
					isStartingSession={isStartingSession}
					isExporting={isExporting}
				/>
			}
			bottomLeftAction={
				<HistoryControls
					canUndo={canUndo}
					canRedo={canRedo}
					onUndo={undo}
					onRedo={redo}
				/>
			}
		/>
	);
}
