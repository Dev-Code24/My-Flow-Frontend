'use client';

import { Redo2, Undo2 } from 'lucide-react';

interface HistoryControlsProps {
	canUndo: boolean;
	canRedo: boolean;
	onUndo: () => void;
	onRedo: () => void;
}

export default function HistoryControls({
	canUndo,
	canRedo,
	onUndo,
	onRedo,
}: HistoryControlsProps) {
	return (
		<div className='flex items-center gap-1 rounded-lg border border-border bg-white px-1 py-1 shadow-md'>
			<button
				type='button'
				onClick={onUndo}
				disabled={!canUndo}
				aria-label='Undo'
				title='Undo'
				className='flex h-7 w-7 items-center justify-center rounded-md text-tool-default transition-colors hover:bg-surface-muted disabled:opacity-40 disabled:hover:bg-transparent'
			>
				<Undo2
					size={17}
					aria-hidden
				/>
			</button>

			<button
				type='button'
				onClick={onRedo}
				disabled={!canRedo}
				aria-label='Redo'
				title='Redo'
				className='flex h-7 w-7 items-center justify-center rounded-md text-tool-default transition-colors hover:bg-surface-muted disabled:opacity-40 disabled:hover:bg-transparent'
			>
				<Redo2
					size={17}
					aria-hidden
				/>
			</button>
		</div>
	);
}