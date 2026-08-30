import { Element, Interaction, Shape, Tool, WhiteboardAction, WhiteboardState } from '@/interfaces';
import { isElementInSelection } from '@/utils';

export function whiteboardReducer(state: WhiteboardState, action: WhiteboardAction): WhiteboardState {
   switch (action.type) {
      case 'START_DRAW': {
         return {
            ...state,
            elements: [...state.elements, action.element],
            selectedIds: [action.element.id],
            interaction: Interaction.DRAWING,
            documentRevision: state.documentRevision + 1,
         };
      }

      case 'SET_TOOL': {
         return {
            ...state,
            tool: action.tool,
         };
      }

      case 'SET_INTERACTION': {
         return {
            ...state,
            interaction: action.interaction,
         };
      }

      case 'SELECT_ELEMENT': {
         if (action.mode === 'replace') {
            return {
               ...state,
               selectedIds: [action.id],
            };
         }

         if (action.mode === 'add') {
            if (state.selectedIds.includes(action.id)) {
               return state;
            }

            return {
               ...state,
               selectedIds: [...state.selectedIds, action.id],
            };
         }

         return {
            ...state,
            selectedIds: state.selectedIds.includes(action.id)
               ? state.selectedIds.filter((id) => id !== action.id)
               : [...state.selectedIds, action.id],
         };
      }

      case 'CLEAR_SELECTION': {
         return {
            ...state,
            selectedIds: [],
         };
      }

      case 'START_SELECTION': {
         return {
            ...state,
            interaction: Interaction.SELECTING,
            selectedIds: action.mode === 'replace' ? [] : state.selectedIds,
            selectionBox: {
               x1: action.x,
               y1: action.y,
               x2: action.x,
               y2: action.y,
            },
         };
      }

      case 'UPDATE_SELECTION': {
         if (!state.selectionBox) {
            return state;
         }

         const box = {
            ...state.selectionBox,
            x2: action.x,
            y2: action.y,
         };

         const enclosedIds = state.elements
            .filter((element) => isElementInSelection(element, box))
            .map((element) => element.id);

         return {
            ...state,
            selectionBox: box,
            selectedIds: action.mode === 'replace'
               ? enclosedIds
               : Array.from(new Set([...action.baseSelectedIds, ...enclosedIds])),
         };
      }

      case 'SET_ELEMENTS': {
         return {
            ...state,
            elements: action.updater(state.elements),
            documentRevision: state.documentRevision + 1,
         };
      }

      case 'MOVE_SELECTED': {
         if (state.selectedIds.length === 0 || (action.dx === 0 && action.dy === 0)) {
            return state;
         }

         return {
            ...state,
            elements: state.elements.map((element: Element) => {
               return state.selectedIds.includes(element.id)
                  ? {
                     ...element,
                     x: element.x + action.dx,
                     y: element.y + action.dy,
                  }
                  : element;
            }),
            documentRevision: state.documentRevision + 1,
         };
      }

      case 'DUPLICATE_SELECTED': {
         if (action.elementIds.length === 0) {
            return state;
         }

         const elementIds = new Set(action.elementIds);
         const duplicates = state.elements
            .filter((element) => elementIds.has(element.id))
            .map((element) => ({
               ...structuredClone(element),
               id: crypto.randomUUID(),
            }));

         if (duplicates.length === 0) {
            return state;
         }

         return {
            ...state,
            elements: [...state.elements, ...duplicates],
            selectedIds: duplicates.map((element) => element.id),
            documentRevision: state.documentRevision + 1,
         };
      }

      case 'RESTORE_INTERACTION_STATE': {
         return {
            ...state,
            elements: action.elements,
            selectedIds: action.selectedIds,
            documentRevision: action.documentRevision,
            interaction: Interaction.IDLE,
            selectionBox: null,
         };
      }

      case 'END_INTERACTION': {
         return {
            ...state,
            interaction: Interaction.IDLE,
            selectionBox: null,
         };
      }

      case 'NORMALIZE_ELEMENTS': {
         return {
            ...state,
            elements: state.elements.map(normalizeElement),
         };
      }

      case 'CHANGE_TOOL': {
         return {
            ...state,
            tool: action.tool,
            selectedIds: action.tool === Tool.SELECT ? state.selectedIds : [],
         };
      }

      case 'DELETE_SELECTED': {
         if (state.selectedIds.length === 0) {
            return state;
         }

         return {
            ...state,
            elements: state.elements.filter(
               (element) => !state.selectedIds.includes(element.id)
            ),
            selectedIds: [],
            documentRevision: state.documentRevision + 1,
         };
      }

      case 'SYNC_DOCUMENT_ELEMENTS': {
         return {
            ...state,
            elements: action.elements,
         };
      }

      case 'APPLY_WHITEBOARD_STATE': {
         return action.state;
      }

      default: {
         return state;
      }
   }
}

function normalizeElement(element: Element): Element {
   if (element.shape === Shape.ARROW) {
      return element;
   }

   return {
      ...element,
      x: element.width < 0
         ? element.x + element.width
         : element.x,
      y: element.height < 0
         ? element.y + element.height
         : element.y,
      width: Math.abs(element.width),
      height: Math.abs(element.height),
   };
}