import { Interaction, Tool, WhiteboardAction, WhiteboardState } from "@/interfaces";
import { isElementInSelection } from "@/utils";

export function whiteboardReducer(
  state: WhiteboardState,
  action: WhiteboardAction
): WhiteboardState {
   switch (action.type) {
      case "START_DRAW": {
         return {
            ...state,
            elements: [...state.elements, action.element],
            selectedIds: [action.element.id],
            interaction: Interaction.DRAWING,
         };
      }

      case "SET_TOOL": {
         return {
            ...state,
            tool: action.tool,
         };
      }

      case "SET_INTERACTION": {
         return {
            ...state,
            interaction: action.interaction,
         };
      }

      case "SELECT_ELEMENT": {
         return {
            ...state,
            selectedIds: [action.id],
         };
      }

      case "CLEAR_SELECTION": {
         return {
            ...state,
            selectedIds: [],
         };
      }

      case "START_SELECTION": {
         return {
            ...state,
            interaction: Interaction.SELECTING,
            selectedIds: [],
            selectionBox: {
               x1: action.x,
               y1: action.y,
               x2: action.x,
               y2: action.y,
            },
         };
      }

      case "UPDATE_SELECTION": {
         if (!state.selectionBox) {
            return state;
         }

         const box = {
            ...state.selectionBox,
            x2: action.x,
            y2: action.y,
         };

         return {
            ...state,
            selectionBox: box,
            selectedIds: state.elements
               .filter((el) => isElementInSelection(el, box))
               .map((el) => el.id),
         };
      }

      case "SET_ELEMENTS": {
         return {
            ...state,
            elements: action.updater(state.elements),
         };
      }

      case "MOVE_SELECTED": {
         if (state.selectedIds.length === 0) {
            return state;
         }

         return {
            ...state,
            elements: state.elements.map((el) =>
               state.selectedIds.includes(el.id)
                  ? {
                     ...el,
                     x: el.x + action.dx,
                     y: el.y + action.dy,
                  }
                  : el
            ),
         };
      }

      case "END_INTERACTION": {
         return {
            ...state,
            interaction: Interaction.IDLE,
            selectionBox: null,
         };
      }

      case "NORMALIZE_ELEMENTS": {
         return {
            ...state,
            elements: state.elements.map((el) => ({
               ...el,
               x: el.width < 0 ? el.x + el.width : el.x,
               y: el.height < 0 ? el.y + el.height : el.y,
               width: Math.abs(el.width),
               height: Math.abs(el.height),
            })),
         };
      }
         
      case "CHANGE_TOOL": {
         return {
            ...state,
            tool: action.tool,
            selectedIds:
               action.tool === Tool.SELECT
                  ? state.selectedIds
                  : [],
         };
      }

      default: {
         return state;
      }
   }
}