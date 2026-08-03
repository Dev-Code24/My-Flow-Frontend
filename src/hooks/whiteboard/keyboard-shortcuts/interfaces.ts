import { Element, WhiteboardAction } from '@/interfaces';
import { Dispatch, RefObject, SetStateAction } from 'react';

export interface CommonKeyboardShortcutsProps {
   canvasRef: RefObject<HTMLCanvasElement | null>;
   setIsSpacePressed: Dispatch<SetStateAction<boolean>>;
   cancelInteraction: () => void;
}

export interface EditingKeyboardShortcutsProps {
   elements: Element[];
   selectedIds: string[];
   setIsShiftPressed: Dispatch<SetStateAction<boolean>>;
   setIsAltPressed: Dispatch<SetStateAction<boolean>>;
   setIsCtrlOrMetaPressed: Dispatch<SetStateAction<boolean>>;
   dispatchWhiteBoardState: Dispatch<WhiteboardAction>;
   recordSnapshot: (snapshot: Element[]) => void;
   undo: () => void;
   redo: () => void;
}

export interface ReadonlyKeyboardShortcutsProps extends CommonKeyboardShortcutsProps {
   mode: 'readonly';
}

export interface EditableKeyboardShortcutsProps extends CommonKeyboardShortcutsProps {
   mode: 'editable';
   editing: EditingKeyboardShortcutsProps;
}

export type UseKeyboardShortcutsProps = ReadonlyKeyboardShortcutsProps | EditableKeyboardShortcutsProps;