"use client";

import { useSyncExternalStore } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

import { ToastItem, ToastPosition, ToastVariant } from "./toast.interface";
import { toast } from "./toast.service";
import { getPositionClasses } from "./toast.utils";

interface ToastIconProps {
	variant: ToastVariant;
}

interface ToastCardProps {
	toastItem: ToastItem;
}

const EMPTY_TOAST_LIST: ToastItem[] = [];

const TOAST_POSITIONS: ToastPosition[] = [
	"top-left",
	"top-center",
	"top-right",
	"bottom-left",
	"bottom-center",
	"bottom-right",
];

export default function Toast() {
	const toastList = useSyncExternalStore(
		toast.subscribe,
		toast.getSnapshot,
		() => EMPTY_TOAST_LIST
	);

	if (toastList.length === 0) {
		return null;
	}

	const groupedToasts = groupToastsByPosition(toastList);

	return (
		<div
			aria-live="polite"
			aria-atomic="false"
		>
			{TOAST_POSITIONS.map((position) => {
				const positionedToasts = groupedToasts[position];

				if (positionedToasts.length === 0) {
					return null;
				}

				return (
					<div
						key={position}
						className={`pointer-events-none fixed z-1000 flex w-[calc(100%-2rem)] max-w-md flex-col gap-2 ${getPositionClasses(position)}`}
					>
						{positionedToasts.map((item) => (
							<ToastCard
								key={item.id}
								toastItem={item}
							/>
						))}
					</div>
				);
			})}
		</div>
	);
}

function groupToastsByPosition(toastList: ToastItem[]): Record<ToastPosition, ToastItem[]> {
	const grouped: Record<ToastPosition, ToastItem[]> = {
		"top-left": [],
		"top-center": [],
		"top-right": [],
		"bottom-left": [],
		"bottom-center": [],
		"bottom-right": [],
	};

	for (const toastItem of toastList) {
		grouped[toastItem.position].push(toastItem);
	}

	return grouped;
}

function ToastCard({ toastItem }: ToastCardProps) {
	const { id, message, variant, visible } = toastItem;

	return (
		<div
			role={variant === "error" ? "alert" : "status"}
			onMouseEnter={() => toast.pause(id)}
			onMouseLeave={() => toast.resume(id)}
			className={`pointer-events-auto w-full ${visible ? "animate-toast-enter" : "animate-toast-exit"}`}
		>
			<div className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 shadow-lg ${getVariantClasses(variant)}`}>
				<span className="flex h-5 shrink-0 items-center">
					<ToastIcon variant={variant} />
				</span>

				<p className="min-w-0 flex-1 wrap-break-word text-sm leading-5">{message}</p>

				<button
					type="button"
					onClick={() => toast.dismiss(id)}
					aria-label="Dismiss notification"
					className="-mr-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current "
				>
					<X size={16} aria-hidden />
				</button>
			</div>
		</div>
	);
}

function ToastIcon({ variant }: ToastIconProps) {
	switch (variant) {
		case "success":
			return (
				<CheckCircle2
					size={18}
					aria-hidden
				/>
			);

		case "error":
			return (
				<AlertCircle
					size={18}
					aria-hidden
				/>
			);

		case "warning":
			return (
				<TriangleAlert
					size={18}
					aria-hidden
				/>
			);

		case "info":
			return (
				<Info
					size={18}
					aria-hidden
				/>
			);
	}
}

function getVariantClasses(
	variant: ToastVariant
): string {
	switch (variant) {
		case "success":
			return "border-green-200 bg-green-50 text-green-800";

		case "error":
			return "border-red-200 bg-red-50 text-red-800";

		case "warning":
			return "border-yellow-200 bg-yellow-50 text-yellow-800";

		case "info":
			return "border-blue-200 bg-blue-50 text-blue-800";
	}
}