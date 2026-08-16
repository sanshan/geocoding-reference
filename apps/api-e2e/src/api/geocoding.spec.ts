import axios from 'axios';

describe('Geocoding API', () => {
    jest.setTimeout(30_000);

    it('should import locations, stream progress and expose geocoding endpoints', async () => {
        const startResponse = await axios.post('/api/geocoding/import');

        expect(startResponse.status).toBe(202);
        expect(startResponse.data).toEqual({
            id: expect.any(String),
            status: 'running',
        });

        const importId = startResponse.data.id as string;

        const eventsResponse = await fetch(
            `${axios.defaults.baseURL}/api/geocoding/import/${importId}/events`,
            {
                headers: {
                    Accept: 'text/event-stream',
                },
            },
        );

        expect(eventsResponse.status).toBe(200);
        expect(eventsResponse.body).not.toBeNull();

        const events = await collectImportEvents(eventsResponse);

        const progressEvents = events.filter((event) => event.type === 'progress');
        const completedEvent = events.find((event) => event.type === 'completed');

        expect(progressEvents.length).toBeGreaterThan(0);

        if (!completedEvent) {
            throw new Error('Completed event was not received');
        }

        expect(completedEvent.data.processed).toBeGreaterThan(0);
        expect(completedEvent.data.inserted).toBeGreaterThanOrEqual(0);
        expect(completedEvent.data.skipped).toBeGreaterThanOrEqual(0);

        expect(completedEvent.data.inserted + completedEvent.data.skipped).toBe(
            completedEvent.data.processed,
        );

        const zipSearchResponse = await axios.get('/api/geocoding/search', {
            params: {
                q: '90210',
            },
        });

        expect(zipSearchResponse.status).toBe(200);
        expect(zipSearchResponse.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    zipCode: '90210',
                    city: 'Beverly Hills',
                }),
            ]),
        );

        const citySearchResponse = await axios.get('/api/geocoding/search', {
            params: {
                q: 'Beverly Hills',
            },
        });

        expect(citySearchResponse.status).toBe(200);
        expect(citySearchResponse.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    zipCode: '90210',
                    city: 'Beverly Hills',
                }),
            ]),
        );

        const reverseResponse = await axios.get('/api/geocoding/reverse', {
            params: {
                latitude: 34.0901,
                longitude: -118.4065,
            },
        });

        expect(reverseResponse.status).toBe(200);
        expect(reverseResponse.data).toEqual(
            expect.objectContaining({
                zipCode: '90210',
                city: 'Beverly Hills',
            }),
        );
    });
});

interface ImportEvent {
    type: 'progress' | 'completed' | 'failed';
    data: {
        processed: number;
        inserted: number;
        skipped: number;
    };
}

async function collectImportEvents(response: Response): Promise<ImportEvent[]> {
    if (!response.body) {
        throw new Error('SSE response body is empty');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const events: ImportEvent[] = [];
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            break;
        }

        buffer += decoder.decode(value, {
            stream: true,
        });

        const messages = buffer.split('\n\n');
        buffer = messages.pop() ?? '';

        for (const message of messages) {
            const event = parseSseMessage(message);

            if (!event) {
                continue;
            }

            events.push(event);

            if (event.type === 'failed') {
                await reader.cancel();

                throw new Error('Location import failed');
            }

            if (event.type === 'completed') {
                await reader.cancel();

                return events;
            }
        }
    }

    return events;
}

function parseSseMessage(message: string): ImportEvent | null {
    const lines = message.split('\n');

    const type = lines
        .find((line) => line.startsWith('event:'))
        ?.slice('event:'.length)
        .trim();

    const data = lines
        .find((line) => line.startsWith('data:'))
        ?.slice('data:'.length)
        .trim();

    if (!type || !data) {
        return null;
    }

    if (type !== 'progress' && type !== 'completed' && type !== 'failed') {
        return null;
    }

    return {
        type,
        data: JSON.parse(data),
    };
}
