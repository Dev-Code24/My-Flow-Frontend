interface BackToContentProps {
	visible: boolean;
	onClick: () => void;
}

export default function BackToContent({ visible, onClick }: BackToContentProps) {
	if (!visible) {
		return null;
	}

	return (
		<button
			type='button'
			onClick={onClick}
			className='absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-tool-primary px-4 py-2 text-sm font-medium text-white shadow-tool transition-colors hover:bg-tool-primary-hover'
		>
			Back to Content
		</button>
	);
}
