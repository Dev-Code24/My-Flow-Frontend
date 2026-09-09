import { Element, HistoryElementChange, HistoryElementState } from '@/interfaces';

export function getHistoryElementChanges(
  beforeElements: Element[],
  afterElements: Element[],
): HistoryElementChange[] {
  const beforeStates = getElementStates(beforeElements);
  const afterStates = getElementStates(afterElements);

  const elementIds = new Set([
    ...beforeStates.keys(),
    ...afterStates.keys(),
  ]);

  const changes: HistoryElementChange[] = [];

  for (const elementId of elementIds) {
    const before = beforeStates.get(elementId) ?? null;
    const after = afterStates.get(elementId) ?? null;

    if (areHistoryElementStatesEqual(before, after)) {
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
): boolean {
  if (before === null && after === null) {
    return true;
  }

  if (before === null || after === null) {
    return false;
  }

  if (before.index !== after.index) {
    return false;
  }

  if (before.element === after.element) {
    return true;
  }

  return JSON.stringify(before.element) === JSON.stringify(after.element);
}

function getElementStates(elements: Element[]): Map<string, HistoryElementState> {
  const states = new Map<string, HistoryElementState>();

  for (let index = 0; index < elements.length; ++index) {
    const element = elements[index];

    states.set(element.id, {
      element,
      index,
    });
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
  };
}