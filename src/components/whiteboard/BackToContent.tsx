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
			type="button"
			onClick={onClick}
			className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full bg-[#6246EA] px-4 py-2 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(98,70,234,0.5)] transition-colors hover:bg-[#5238cc]"
		>
			Back to Content
		</button>
	);
}
