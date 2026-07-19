import { FlowDocumentData, LocalWorkspace } from "@/lib/interfaces";
import { LOCAL_STORAGE_KEY } from "../constants";

const WORKSPACE_VERSION = 1;

export function saveWorkspace(document: FlowDocumentData): void {
	const workspace: LocalWorkspace = {
		version: WORKSPACE_VERSION,
		document,
		updatedAt: Date.now(),
	};

	localStorage.setItem(
		LOCAL_STORAGE_KEY.WORKSPACE,
		JSON.stringify(workspace)
	);
}

export function loadWorkspace(): LocalWorkspace | null {
	const storedWorkspace = localStorage.getItem(LOCAL_STORAGE_KEY.WORKSPACE);

	if (!storedWorkspace) {
		return null;
	}

	try {
		const parsed: unknown = JSON.parse(storedWorkspace);

		if (!isValidWorkspace(parsed)) {
			return null;
		}

		return parsed;
	} catch {
		return null;
	}
}

export function clearWorkspace(): void {
	localStorage.removeItem(LOCAL_STORAGE_KEY.WORKSPACE);
}

function isValidWorkspace(value: unknown): value is LocalWorkspace {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	if (!("version" in value) || value.version !== WORKSPACE_VERSION || !("document" in value)) {
		return false;
	}

	const document = value.document;

	if (typeof document !== "object" || document === null) {
		return false;
	}

	if (!("elements" in document) || !("pan" in document) || !("zoom" in document)) {
		return false;
	}

	if (!Array.isArray(document.elements)) {
		return false;
	}

	if (typeof document.zoom !== "number" || !Number.isFinite(document.zoom)) {
		return false;
	}

	if (
		typeof document.pan !== "object" ||
		document.pan === null ||
		!("x" in document.pan) ||
		!("y" in document.pan) ||
		typeof document.pan.x !== "number" ||
		typeof document.pan.y !== "number"
	) {
		return false;
	}

	return true;
}