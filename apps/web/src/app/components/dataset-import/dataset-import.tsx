import { Button, Group, Loader, Stack, Text } from '@mantine/core';

import { useLocationImport } from '../../hooks/use-location-import';

export function DatasetImport() {
    const { startImport, status, progress, error, isStarting } = useLocationImport();

    const isRunning = status === 'running' || isStarting;

    return (
        <Stack gap="xs">
            <Group justify="space-between">
                <div>
                    <Text fw={600}>Dataset</Text>
                    <Text size="sm" c="dimmed">
                        Import US ZIP code location data
                    </Text>
                </div>

                <Button onClick={() => startImport()} disabled={isRunning}>
                    {isRunning ? 'Importing...' : 'Import data'}
                </Button>
            </Group>

            {isRunning && (
                <Group gap="xs">
                    <Loader size="xs" />
                    <Text size="sm" c="dimmed">
                        Import in progress
                    </Text>
                </Group>
            )}

            {progress && (
                <Group gap="lg">
                    <Text size="sm">Processed: {progress.processed}</Text>

                    <Text size="sm">Inserted: {progress.inserted}</Text>

                    <Text size="sm">Skipped: {progress.skipped}</Text>
                </Group>
            )}

            {status === 'completed' && (
                <Text size="sm" c="green">
                    Import completed
                </Text>
            )}

            {error && (
                <Text size="sm" c="red">
                    {error}
                </Text>
            )}
        </Stack>
    );
}
