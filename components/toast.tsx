"use client";

import { useEffect, useRef } from "react";

type Props = {
    message: string;
    onDismiss: () => void;
};

export function Toast({ message, onDismiss }: Props) {
    const startX = useRef<number | null>(null);

    useEffect(() => {
        const timeout = window.setTimeout(onDismiss, 4500);
        return () => window.clearTimeout(timeout);
    }, [message, onDismiss]);

    return (
        <div
            className="toast"
            role="alert"
            onPointerDown={event => { startX.current = event.clientX; }}
            onPointerUp={event => {
                if (startX.current !== null && Math.abs(event.clientX - startX.current) >= 56) onDismiss();
                startX.current = null;
            }}
            onPointerCancel={() => { startX.current = null; }}
        >
            {message}
        </div>
    );
}
