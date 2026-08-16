import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { startLocationsImport } from '../api/geocoding.api';

type ImportProgress = {
    processed: number;
    inserted: number;
    skipped: number;
};

type ImportStatus = 'idle' | 'running' | 'completed' | 'failed';

export function useLocationImport() {
    const [status, setStatus] = useState<ImportStatus>('idle');
    const [progress, setProgress] = useState<ImportProgress | null>(null);
    const [error, setError] = useState<string | null>(null);

    const eventSourceRef = useRef<EventSource | null>(null);

    const startImportMutation = useMutation({
        mutationFn: startLocationsImport,
        onSuccess: ({ id }) => {
            setStatus('running');
            setProgress(null);
            setError(null);

            eventSourceRef.current?.close();

            const eventSource = new EventSource(`/api/geocoding/import/${id}/events`);

            eventSourceRef.current = eventSource;

            eventSource.addEventListener('progress', (event) => {
                const data = JSON.parse(event.data) as ImportProgress;

                setProgress(data);
            });

            eventSource.addEventListener('completed', (event) => {
                const data = JSON.parse(event.data) as ImportProgress;

                setProgress(data);
                setStatus('completed');

                eventSource.close();
                eventSourceRef.current = null;
            });

            eventSource.addEventListener('failed', (event) => {
                const data = JSON.parse(event.data) as {
                    message: string;
                };

                setError(data.message);
                setStatus('failed');

                eventSource.close();
                eventSourceRef.current = null;
            });

            eventSource.onerror = () => {
                setError('Import event stream disconnected');
                setStatus('failed');

                eventSource.close();
                eventSourceRef.current = null;
            };
        },
        onError: () => {
            setError('Failed to start import');
            setStatus('failed');
        },
    });

    useEffect(() => {
        return () => {
            eventSourceRef.current?.close();
        };
    }, []);

    return {
        startImport: startImportMutation.mutate,
        status,
        progress,
        error,
        isStarting: startImportMutation.isPending,
    };
}
