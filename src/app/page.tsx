'use client';

import { useReducer, useRef, useState } from 'react';
import Whiteboard from '@/components/whiteboard';
import { EditableTopRightAction, HistoryControls, ShapesNavbar } from '@/components';

import {
	useKeyboardShortcuts, useWhiteboardViewport, useWhiteboardInteractions, useWhiteboardCursor, useCanvasPreventDefaultEvents,
	useWhiteboardHistory
} from '@/hooks/whiteboard';
import { useCreateRoom, useExportFlow } from '@/hooks/api';
import { useLocalWorkspace } from '@/hooks/local-storage';
import { whiteboardReducer } from '@/reducer/whiteboard.reducer';
import { WhiteboardState, WhiteboardAction, WhiteboardMode, RoomCollaborationOptions } from '@/interfaces';
import { initialWhiteBoardState } from '@/constants';
import { useRouter } from "next/navigation";

export default function Home() {
	const mode: WhiteboardMode = "editable";
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const router = useRouter();
	const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false);
	const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
	const [isAltPressed, setIsAltPressed] = useState<boolean>(false);
	const [isCtrlOrMetaPressed, setIsCtrlOrMetaPressed] = useState<boolean>(false);
	const [isStartingSession, setIsStartingSession] = useState<boolean>(false);
	const [whiteBoardState, dispatchWhiteBoardState] = useReducer<WhiteboardState, [action: WhiteboardAction]>(whiteboardReducer, initialWhiteBoardState);
	const { elements, interaction, selectedIds, selectionBox, tool, documentRevision } = whiteBoardState;
	const { create: createRoom } = useCreateRoom();
	const { exportFlow, isExporting } = useExportFlow();
	const { pan, zoom, showBackToContent, setZoom, setPan, setCanvasSize, handleWheel, zoomIn, zoomOut, resetZoom, backToContent } = useWhiteboardViewport({ canvasRef, elements });
	const { canRedo, canUndo, recordSnapshot, undo, redo } = useWhiteboardHistory({ elements, dispatchWhiteBoardState });
	const { handleMouseDown, handleMouseMove, handleMouseUp, cancelInteraction } = useWhiteboardInteractions({
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
		isCtrlOrMetaPressed,
		isSpacePressed,
		setPan,
		dispatchWhiteBoardState,
		editing: { documentRevision, recordSnapshot, isAltPressed },
	});

	useKeyboardShortcuts({
		mode,
		canvasRef,
		setIsSpacePressed,
		cancelInteraction,
		editing: {
			elements,
			selectedIds,
			setIsShiftPressed,
			setIsAltPressed,
			setIsCtrlOrMetaPressed,
			dispatchWhiteBoardState,
			recordSnapshot,
			undo,
			redo,
		},
	});

	useWhiteboardCursor({ canvasRef, tool, mode, isSpacePressed });
	useCanvasPreventDefaultEvents({ canvasRef });
	useLocalWorkspace({ elements, pan, zoom, setPan, setZoom, dispatchWhiteBoardState });

	async function handleExportToLink(): Promise<void> {
		await exportFlow({ elements, pan, zoom });
	}

	async function handleStartSession(options: RoomCollaborationOptions): Promise<void> {
		if (isStartingSession) {
			return;
		}

		setIsStartingSession(true);

		const roomId = await createRoom(options);

		if (!roomId) {
			setIsStartingSession(false);
			return;
		}

		router.push(`/room/${roomId}`);
	}

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
				<EditableTopRightAction
					onStartSession={handleStartSession}
					onExportToLink={handleExportToLink}
					isStartingSession={isStartingSession}
					isExporting={isExporting}
				/>
			}
			bottomLeftAction={<HistoryControls canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} />}
		/>
	);
}