import { UseKeyboardShortcutsProps } from './interfaces';
import { useCommonKeyboardShortcuts } from './useCommonKeyboardShortcuts';
import { useEditingKeyboardShortcuts } from './useEditingKeyboardShortcuts';

export function useKeyboardShortcuts(props: UseKeyboardShortcutsProps): void {
	useCommonKeyboardShortcuts({
		canvasRef: props.canvasRef,
		setIsSpacePressed: props.setIsSpacePressed,
		cancelInteraction: props.cancelInteraction,
	});

	const editing = props.mode === 'readonly' ? null : props.editing;
	useEditingKeyboardShortcuts(editing);
}