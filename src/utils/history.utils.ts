import { Element, HistoryElementChange, HistoryElementState } from '@/interfaces';

export function getHistoryElementChanges(
  beforeElements: Element[],
  afterElements: Element[],
): HistoryElementChange[] {
  const beforeStates = getElementStates(beforeElements);
  const afterStates = getElementStates(afterElements);
  const shouldCompareOrder = haveSameElementIds(beforeStates, afterStates);

  const elementIds = new Set([
    ...beforeStates.keys(),
    ...afterStates.keys(),
  ]);

  const changes: HistoryElementChange[] = [];

  for (const elementId of elementIds) {
    const before = beforeStates.get(elementId) ?? null;
    const after = afterStates.get(elementId) ?? null;

    if (areHistoryElementStatesEqual(before, after, shouldCompareOrder)) {
      continue;
    }

    changes.push({
      elementId,
      before: cloneHistoryElementState(before),
      after: cloneHistoryElementState(after),
    });
  }

  return changes;
}

export function areHistoryElementStatesEqual(
  before: HistoryElementState | null,
  after: HistoryElementState | null,
  compareOrder: boolean = true,
): boolean {
  if (before === null && after === null) {
    return true;
  }

  if (before === null || after === null) {
    return false;
  }

  if (compareOrder) {
    if (before.index !== after.index) {
      return false;
    }

    if (before.orderContext.previousElementId !== after.orderContext.previousElementId) {
      return false;
    }

    if (before.orderContext.nextElementId !== after.orderContext.nextElementId) {
      return false;
    }
  }

  if (before.element === after.element) {
    return true;
  }

  return (
    JSON.stringify(before.element) ===
    JSON.stringify(after.element)
  );
}

function getElementStates(elements: Element[]): Map<string, HistoryElementState> {
  const states = new Map<string, HistoryElementState>();

  for (let index = 0; index < elements.length; ++index) {
    const element = elements[index];
    const previousElement = index > 0 ? elements[index - 1] : null;
    const nextElement = index < elements.length - 1 ? elements[index + 1] : null;

    states.set(element.id, {
        element,
        index,
        orderContext: {
          previousElementId: previousElement ? previousElement.id : null,
          nextElementId: nextElement ? nextElement.id : null,
        },
      },
    );
  }

  return states;
}

function cloneHistoryElementState(state: HistoryElementState | null): HistoryElementState | null {
  if (state === null) {
    return null;
  }

  return {
    element: structuredClone(state.element),
    index: state.index,
    orderContext: {
      previousElementId: state.orderContext.previousElementId,
      nextElementId: state.orderContext.nextElementId,
    },
  };
}

function haveSameElementIds(
  beforeStates: Map<string, HistoryElementState>,
  afterStates: Map<string, HistoryElementState>,
): boolean {
  if (beforeStates.size !== afterStates.size) {
    return false;
  }

  for (const elementId of beforeStates.keys()) {
    if (!afterStates.has(elementId)) {
      return false;
    }
  }

  return true;
}