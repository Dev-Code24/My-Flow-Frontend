"use client";

import {Dispatch, SetStateAction, useEffect, useRef } from "react";

import { Coordinates2D, Element, WhiteboardAction } from "@/interfaces";
import { loadWorkspace, saveWorkspace } from "@/lib/utils";

interface UseLocalWorkspaceParams {
	elements: Element[];
	pan: Coordinates2D;
	zoom: number;
	setPan: Dispatch<SetStateAction<Coordinates2D>>;
	setZoom: Dispatch<SetStateAction<number>>;
	dispatchWhiteBoardState: Dispatch<WhiteboardAction>;
}

const AUTOSAVE_DELAY = 500;

export function useLocalWorkspace({
	elements,
	pan,
	zoom,
	setPan,
	setZoom,
	dispatchWhiteBoardState,
}: UseLocalWorkspaceParams): void {
	const isHydrated = useRef<boolean>(false);
	const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (isHydrated.current) {
			return;
		}

		const workspace = loadWorkspace();

		if (workspace) {
			dispatchWhiteBoardState({
				type: "SET_ELEMENTS",
				updater: () => workspace.document.elements,
			});

			setPan(workspace.document.pan);
			setZoom(workspace.document.zoom);
		}

		isHydrated.current = true;
	}, [ dispatchWhiteBoardState, setPan, setZoom ]);

	useEffect(() => {
		if (!isHydrated.current) {
			return;
		}

		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current);
		}

		saveTimeoutRef.current = setTimeout(() => {
         saveWorkspace({ elements, pan, zoom });
      }, AUTOSAVE_DELAY);

		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, [ elements, pan, zoom ]);
}