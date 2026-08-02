import { CursorContext, Interaction, ResizeHandle, Tool, WhiteboardMode } from '@/interfaces';
import { CursorType } from '@/constants';

export function getCursorForHandle(angle: number, handle: ResizeHandle): string {
	if (!handle) {
		return getCursorStyle(CursorType.DEFAULT);
	}

	if (handle === 'rotation') {
		return getCursorStyle(CursorType.ROTATE);
	}

	if (handle === 'start' || handle === 'end' || handle === 'curve') {
		return getCursorStyle(CursorType.POINTER);
	}

	// Map each handle to its base angle in degrees
	const baseAngles: Record<string, number> = {
		right: 0,
		'bottom-right': 45,
		bottom: 90,
		'bottom-left': 135,
		left: 180,
		'top-left': 225,
		top: 270,
		'top-right': 315,
	};

	const baseAngle = baseAngles[handle];
	if (baseAngle === undefined) {
		return getCursorStyle(CursorType.DEFAULT);
	}

	// 1. Convert shape's radian angle to degrees
	const angleInDegrees = angle * (180 / Math.PI);

	// 2. Add the shape's rotation to the handle's base angle
	let totalAngle = (baseAngle + angleInDegrees) % 360;
	if (totalAngle < 0) {
		totalAngle += 360; // Normalize negative angles
	}

	// 3. CSS cursors represent axes, which repeat every 180 degrees.
	totalAngle = totalAngle % 180;

	// 4. Map the resulting angle to the closest CSS cursor slice
	if (totalAngle < 22.5 || totalAngle >= 157.5) {
		return getCursorStyle(CursorType.EW_RESIZE); // Horizontal axis
	} else if (totalAngle >= 22.5 && totalAngle < 67.5) {
		return getCursorStyle(CursorType.NWSE_RESIZE); // Top-Left to Bottom-Right diagonal axis
	} else if (totalAngle >= 67.5 && totalAngle < 112.5) {
		return getCursorStyle(CursorType.NS_RESIZE); // Vertical axis
	} else if (totalAngle >= 112.5 && totalAngle < 157.5) {
		return getCursorStyle(CursorType.NESW_RESIZE); // Top-Right to Bottom-Left diagonal axis
	}

	return getCursorStyle(CursorType.DEFAULT);
}

export function getIdleWhiteboardCursor(tool: Tool, isSpacePressed: boolean, mode: WhiteboardMode = 'editable'): string {
	if (isSpacePressed) {
		return getCursorStyle(CursorType.GRAB);
	}

	if (mode === 'readonly') {
		return getCursorStyle(CursorType.DEFAULT);
	}

	if (tool === Tool.PAN) {
		return getCursorStyle(CursorType.GRAB);
	}

	if (tool === Tool.SELECT) {
		return getCursorStyle(CursorType.DEFAULT);
	}

	return getCursorStyle(CursorType.CROSSHAIR);
}

export function getCursorStyle(type: CursorType): string {
	switch (type) {
		case CursorType.DEFAULT:
			return `url('/cursors/cursor.svg') 4 2, default`;

		case CursorType.POINTER:
			return `url('/cursors/pointer-cursor.svg') 6 2, pointer`;

		case CursorType.TEXT:
			return `url('/cursors/text-cursor.svg') 12 12, text`;

		case CursorType.NOT_ALLOWED:
			return `url('/cursors/not-allowed-cursor.svg') 12 12, not-allowed`;

		case CursorType.ROTATE:
			return `url('/cursors/rotate-cursor.svg') 12 12, default`;

		case CursorType.GRAB:
			return `url('/cursors/grab-cursor.svg') 12 12, grab`;

		case CursorType.GRABBING:
			return `url('/cursors/grabbing-cursor.svg') 12 12, grabbing`;

		case CursorType.EW_RESIZE:
			return `url('/cursors/ew-resize-cursor.svg') 12 12, ew-resize`;

		case CursorType.NWSE_RESIZE:
			return `url('/cursors/nwse-resize-cursor.svg') 12 12, nwse-resize`;

		case CursorType.NS_RESIZE:
			return `url('/cursors/ns-resize-cursor.svg') 12 12, ns-resize`;

		case CursorType.NESW_RESIZE:
			return `url('/cursors/nesw-resize-cursor.svg') 12 12, nesw-resize`;

		case CursorType.CROSSHAIR:
			return `url('/cursors/crosshair-cursor.svg') 12 12, crosshair`;
	}
}

export function getWhiteboardCursor({
	tool,
	interaction,
	isSpacePressed,
	isHoveringElement,
	activeHandle,
	hoveredHandle,
	selectedElement,
}: CursorContext): string {
	if (interaction === Interaction.MOVING) {
		return getCursorStyle(CursorType.GRABBING);
	}

	const visibleHandle = activeHandle ?? hoveredHandle;

	if (visibleHandle && selectedElement) {
		return getCursorForHandle(selectedElement.angle, visibleHandle);
	}

	if (isSpacePressed || tool === Tool.PAN || (isHoveringElement && tool === Tool.SELECT)) {
		return getCursorStyle(CursorType.GRAB);
	}

	return getCursorStyle(tool === Tool.SELECT ? CursorType.DEFAULT : CursorType.CROSSHAIR);
}
