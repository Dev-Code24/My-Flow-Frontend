"use client";

import { useEffect, useState } from "react";

import { SharedFlowDocument } from "@/lib/interfaces";
import { getSharedFlow } from "@/lib/api/share";
import { isValidSharedFlowDocument } from "@/utils";

interface UseSharedFlowResult {
	document: SharedFlowDocument | null;
	isLoading: boolean;
	error: Error | null;
}

export function useSharedFlow(flowId: string): UseSharedFlowResult {
	const [document, setDocument] = useState<SharedFlowDocument | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		let isCancelled = false;

		async function fetchSharedFlow(): Promise<void> {
			try {
				setIsLoading(true);
				setError(null);

				const response = await getSharedFlow(flowId);

				if (isCancelled) {
					return;
				}

				const sharedDocument = response.data.document;

				if (!isValidSharedFlowDocument(sharedDocument)) {
					throw new Error("The shared flow document has an invalid format.");
				}

				setDocument(sharedDocument);
			} catch (error) {
				if (isCancelled) {
					return;
				}

				setError(error instanceof Error ? error : new Error("Failed to load shared flow."));
			} finally {
				if (!isCancelled) {
					setIsLoading(false);
				}
			}
		}

		fetchSharedFlow();

		return () => {
			isCancelled = true;
		};
	}, [flowId]);

	return {
		document,
		isLoading,
		error,
	};
}
