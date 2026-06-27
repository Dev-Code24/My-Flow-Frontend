import { WhiteboardAction } from '@/interfaces';

export interface UseKeyboardShortcutsProps {
   canvasRef: React.RefObject<HTMLCanvasElement | null>,
   selectedIds: number[],
   dispatchWhiteBoardState: React.ActionDispatch<[action: WhiteboardAction]>,
   setIsSpacePressed: React.Dispatch<React.SetStateAction<boolean>>,
   setIsShiftPressed: React.Dispatch<React.SetStateAction<boolean>>,
}