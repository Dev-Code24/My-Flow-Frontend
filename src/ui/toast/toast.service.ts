import { ToastItem, ToastOptions, ToastPosition, ToastVariant } from "./toast.interface";

interface ToastTimer {
	startedAt: number;
	remainingTime: number;
	timeoutId: ReturnType<typeof setTimeout> | null;
}

type ToastListener = () => void;

const DEFAULT_POSITION: ToastPosition = "top-center";
const DEFAULT_DURATION = 5_000;
const EXIT_ANIMATION_DURATION = 300;
const MAX_TOASTS = 3;

let idCounter = 0;
let toasts: ToastItem[] = [];

const listeners = new Set<ToastListener>();
const timers = new Map<number, ToastTimer>();

function emitChange(): void {
	listeners.forEach((listener) => listener());
}

function getSnapshot(): ToastItem[] {
	return toasts;
}

function subscribe(listener: ToastListener): () => void {
	listeners.add(listener);

	return () => {
		listeners.delete(listener);
	};
}

function clearToastTimer(id: number): void {
	const timer = timers.get(id);

	if (timer?.timeoutId) {
		clearTimeout(timer.timeoutId);
	}
}

function removeToast(id: number): void {
	clearToastTimer(id);
	timers.delete(id);

	toasts = toasts.filter((toast) => toast.id !== id);

	if (toasts.length === 0) {
		idCounter = 0;
	}

	emitChange();
}

function dismiss(id: number): void {
	const toast = toasts.find((item) => item.id === id);

	if (!toast || !toast.visible) {
		return;
	}

	clearToastTimer(id);

	toasts = toasts.map((item) =>
		item.id === id
			? {
					...item,
					visible: false,
				}
			: item,
	);

	emitChange();

	setTimeout(() => {
		removeToast(id);
	}, EXIT_ANIMATION_DURATION);
}

function startTimer(id: number): void {
	const timer = timers.get(id);

	if (!timer) {
		return;
	}

	clearToastTimer(id);

	timer.startedAt = Date.now();

	timer.timeoutId = setTimeout(() => {
		dismiss(id);
	}, timer.remainingTime);
}

function pause(id: number): void {
	const timer = timers.get(id);

	if (!timer || timer.timeoutId === null) {
		return;
	}

	const elapsedTime = Date.now() - timer.startedAt;

	timer.remainingTime = Math.max(0, timer.remainingTime - elapsedTime);

	clearTimeout(timer.timeoutId);
	timer.timeoutId = null;
}

function resume(id: number): void {
	const timer = timers.get(id);

	if (!timer || timer.timeoutId !== null) {
		return;
	}

	if (timer.remainingTime <= 0) {
		dismiss(id);
		return;
	}

	startTimer(id);
}

function show(message: string, options: ToastOptions = {}): number {
	const id = ++idCounter;
	const duration = options.duration ?? DEFAULT_DURATION;
	const variant = options.variant ?? "info";

	const toast: ToastItem = {
		id,
		message,
		variant,
		duration,
		visible: true,
		position: options.position ?? DEFAULT_POSITION,
  };

	toasts = [toast, ...toasts];

	timers.set(id, {
		startedAt: Date.now(),
		remainingTime: duration,
		timeoutId: null,
	});

	if (toasts.length > MAX_TOASTS) {
		const overflowingToasts = toasts.slice(MAX_TOASTS);

		overflowingToasts.forEach((item) => {
			removeToast(item.id);
		});

		toasts = toasts.slice(0, MAX_TOASTS);
	}

	emitChange();
	startTimer(id);

	return id;
}

function showToast(variant: ToastVariant, message: string, duration?: number): number {
	return show(message, {
		variant,
		duration,
	});
}

export const toast = {
	success(message: string, duration?: number): number {
		return showToast("success", message, duration);
	},

	error(message: string, duration?: number): number {
		return showToast("error", message, duration);
	},

	warning(message: string, duration?: number): number {
		return showToast("warning", message, duration);
	},

	info(message: string, duration?: number): number {
		return showToast("info", message, duration);
	},

	dismiss,
	pause,
	resume,
	subscribe,
	getSnapshot,
};
