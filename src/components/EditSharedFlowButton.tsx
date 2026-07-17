'use client';

import { Pencil } from 'lucide-react';

interface EditSharedFlowButtonProps {
	onClick: () => void;
}

export default function EditSharedFlowButton({
	onClick,
}: EditSharedFlowButtonProps) {
	return (
		<button
			type='button'
			onClick={onClick}
			className='absolute right-6 top-6 z-20 flex h-10 items-center gap-2 rounded-lg bg-[#665CE8] px-4 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#574DDA] cursor-pointer'
		>
			<Pencil
				size={18}
				strokeWidth={2}
			/>

			Edit in workspace
		</button>
	);
}