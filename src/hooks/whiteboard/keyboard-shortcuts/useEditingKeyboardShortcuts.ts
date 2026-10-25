import { KeyboardKeys } from '@/constants';
import { EditingKeyboardShortcutsProps } from './interfaces';
import { useEffect, useRef } from 'react';
import { Tool } from '@/lib/interfaces';

export function useEditingKeyboardShortcuts(editing : EditingKeyboardShortcutsProps | null) : void {
  const isDeletingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!editing) {
      return;
    }

    const {
      elements,
      selectedIds,
      dispatchWhiteBoardState,
      recordSnapshot,
      undo,
      redo,
      setIsAltPressed,
      setIsShiftPressed,
      setIsCtrlOrMetaPressed,
      historyLifecycle,
      mutationLifecycle,
    } = editing;
    const changeTool = (tool : Tool) : void => {
      dispatchWhiteBoardState({type: 'CHANGE_TOOL', tool});
    };

    const handleKeyDown = (event : KeyboardEvent) : void => {
      setIsCtrlOrMetaPressed(event.ctrlKey || event.metaKey);

      if (event.repeat || !event.key) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === KeyboardKeys.ALT) {
        setIsAltPressed(true);
        return;
      }

      const isModifierPressed = event.ctrlKey || event.metaKey;

      if (isModifierPressed && key === KeyboardKeys.Z) {
        event.preventDefault();

        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }

        return;
      }

      if (key === KeyboardKeys.SHIFT) {
        setIsShiftPressed(true);
      }

      if (event.ctrlKey && key === KeyboardKeys.Y) {
        event.preventDefault();
        redo();
        return;
      }

      switch (key) {
        case KeyboardKeys.DELETE:
        case KeyboardKeys.BACKSPACE: {
          if (selectedIds.length === 0) {
            return;
          }

          event.preventDefault();

          void deleteSelectedElements();

          return;
        }

        case KeyboardKeys.V: {
          changeTool(Tool.SELECT);
          return;
        }

        case KeyboardKeys.D: {
          changeTool(Tool.DRAW_RECTANGLE);
          return;
        }

        case KeyboardKeys.R: {
          changeTool(Tool.DRAW_RHOMBUS);
          return;
        }

        case KeyboardKeys.O: {
          changeTool(Tool.DRAW_OVAL);
          return;
        }
      }
    };

    const handleKeyUp = (event : KeyboardEvent) : void => {
      if (!event.key) {
        return;
      }

      const key = event.key.toLowerCase();

      setIsCtrlOrMetaPressed(event.ctrlKey || event.metaKey);

      if (key === KeyboardKeys.ALT) {
        setIsAltPressed(false);
      }

      if (key === KeyboardKeys.SHIFT) {
        setIsShiftPressed(false);
      }
    };

    const resetEditingKeys = () : void => {
      setIsAltPressed(false);
      setIsShiftPressed(false);
      setIsCtrlOrMetaPressed(false);
    };

    const deleteSelectedElements = async (): Promise<void> => {
        if (selectedIds.length === 0 || isDeletingRef.current) {
          return;
        }

        const elementIds = [ ...selectedIds ];

        isDeletingRef.current = true;

        let mutationStarted = false;

        try {
          const accepted = mutationLifecycle ? await mutationLifecycle.beginMutation(elementIds) : true;

          if (!accepted) {
            return;
          }

          mutationStarted = true;

          if (historyLifecycle) {
            historyLifecycle.beginDocumentChange();
          }

          recordSnapshot(elements);

          dispatchWhiteBoardState({
            type: 'DELETE_SELECTED',
            elementIds,
          });

          if (historyLifecycle) {
            historyLifecycle.commitDocumentChange();
          }

          if (mutationLifecycle) {
            mutationLifecycle.commitMutation();
          }

          mutationStarted = false;
        } finally {
          if (mutationStarted && mutationLifecycle) {
            mutationLifecycle.cancelMutation();
          }

          isDeletingRef.current = false;
        }
      };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', resetEditingKeys);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', resetEditingKeys);
    };
  }, [ editing ]);
}