'use client';

import { useReducer, useRef, useState } from 'react';

import Whiteboard from '@/components/whiteboard';
import { EditSharedFlowButton } from '@/components';

import { useSharedFlow } from '@/hooks/api';
import { Element, Interaction, WhiteboardAction, WhiteboardMode, WhiteboardState } from '@/interfaces';
import { initialWhiteBoardState } from '@/constants';
import { useWhiteboardViewport, useWhiteboardInteractions, useKeyboardShortcuts, useCanvasPreventDefaultEvents, useWhiteboardCursor } from '@/hooks/whiteboard';
import { whiteboardReducer } from '@/reducer/whiteboard.reducer';
import { useParams, useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { ConfirmDialog } from '@/ui/dialog';
import { FlowDocumentData } from '@/lib/interfaces';
import { saveWorkspace } from '@/lib/utils';

export default function SharedFlowPage() {
	const params = useParams<{ flowId: string; }>();
	const router = useRouter();

	const { flowId } = params;

	const mode: WhiteboardMode = 'readonly';
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false);
	const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
	const [isImportDialogOpen, setIsImportDialogOpen] = useState<boolean>(false);
	const { document, isLoading, error } = useSharedFlow(flowId);
	const [whiteBoardState, dispatchWhiteBoardState] = useReducer<WhiteboardState, [action: WhiteboardAction]>(whiteboardReducer, initialWhiteBoardState);

	const { interaction, selectedIds, selectionBox, tool } = whiteBoardState;

	const elements: Element[] = document ? document.canvas.elements : [];

	const {
		pan,
		zoom,
		showBackToContent,
      setPan,
		setCanvasSize,
		handleWheel,
		zoomIn,
		zoomOut,
		resetZoom,
		backToContent,
	} = useWhiteboardViewport({
		canvasRef,
		elements,
		initialPan: { x: 0, y: 0 },
		initialZoom: 1,
	});

	const {
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
	} = useWhiteboardInteractions({
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
	});

	useKeyboardShortcuts({
		mode,
		canvasRef,
		selectedIds,
		dispatchWhiteBoardState,
		setIsSpacePressed,
		setIsShiftPressed,
	});

	useWhiteboardCursor({
		mode,
		canvasRef,
		tool,
		isSpacePressed,
	});

	useCanvasPreventDefaultEvents({ canvasRef });

	function replaceWorkspace(document: FlowDocumentData): void {
		saveWorkspace(document);
	}
	
	function handleImportSharedFlow(): void {
		if (!document) { return; }
	
		replaceWorkspace({
			elements: document.canvas.elements,
			pan: {
				x: 0,
				y: 0,
			},
			zoom: 1,
		});
	
		setIsImportDialogOpen(false);
		router.push('/');
	}
   
   if (isLoading) {
      return (
         <div className='fixed inset-0 flex items-center justify-center bg-white'>
            <div className='flex flex-col items-center gap-3'>
               <LoaderCircle
                  size={32}
                  className='animate-spin text-[#665CE8]'
               />
   
               <p className='text-sm text-[#5F5D68]'>
                  Loading shared flow
               </p>
            </div>
         </div>
      );
   }

	if (error || !document) {
		return (
			<div className='fixed inset-0 flex items-center justify-center bg-white'>
				<div className='text-center'>
					<h1 className='text-xl font-semibold text-[#2F2D38]'>
						Unable to load this flow
					</h1>

					<p className='mt-2 text-sm text-[#6B6875]'>
                  This shared flow is unavailable.
					</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<Whiteboard
				canvasRef={canvasRef}
				elements={elements}
				pan={pan}
				zoom={zoom}
				selectedIds={[]}
				selectionBox={null}
				interaction={Interaction.IDLE}
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
				topRightAction={
					<EditSharedFlowButton
						onClick={() => {
							setIsImportDialogOpen((prev) => !prev);
						}}
					/>
				}
			/>

			<ConfirmDialog
				open={isImportDialogOpen}
				title='Replace your current workspace?'
				message='Importing this shared flow will replace everything currently in your workspace. This action cannot be undone.'
				confirmLabel='Import and replace'
				cancelLabel='Cancel'
				isDestructive
				onCancel={() => setIsImportDialogOpen(false)}
				onConfirm={handleImportSharedFlow}
			/>
		</>
	);
}