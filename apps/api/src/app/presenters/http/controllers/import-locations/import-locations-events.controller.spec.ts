import type { EventBus } from '@nestjs/cqrs';
import { Subject } from 'rxjs';

import type { ImportLocationsStatusStore } from '../../../../application/ports/location-import-status-store.port';
import { ImportLocationsCompletedEvent } from '../../../../application/use-cases/import-locations/events/import-locations-completed.event';
import { ImportLocationsFailedEvent } from '../../../../application/use-cases/import-locations/events/import-locations-failed.event';
import { ImportLocationsProgressedEvent } from '../../../../application/use-cases/import-locations/events/import-locations-progressed.event';
import { ImportLocationsEventsController } from './import-locations-events.controller';

describe('ImportLocationsEventsController', () => {
    const importId = 'import-123';

    let events$: Subject<object>;
    let eventBus: EventBus;
    let statusStore: jest.Mocked<ImportLocationsStatusStore>;
    let controller: ImportLocationsEventsController;

    beforeEach(() => {
        events$ = new Subject<object>();

        eventBus = events$ as unknown as EventBus;

        statusStore = {
            get: jest.fn().mockResolvedValue(undefined),
            setRunning: jest.fn(),
            setProgress: jest.fn(),
            setCompleted: jest.fn(),
            setFailed: jest.fn(),
        };

        controller = new ImportLocationsEventsController(eventBus, statusStore);
    });

    afterEach(() => {
        events$.complete();
    });

    it('should map progress event to SSE message', () => {
        const messages: unknown[] = [];

        const subscription = controller.events(importId).subscribe((message) => {
            messages.push(message);
        });

        events$.next(new ImportLocationsProgressedEvent(importId, 1000, 900, 100));

        expect(messages).toEqual([
            {
                type: 'progress',
                data: {
                    processed: 1000,
                    inserted: 900,
                    skipped: 100,
                },
            },
        ]);

        subscription.unsubscribe();
    });

    it('should map completed event to SSE message', () => {
        const messages: unknown[] = [];

        const subscription = controller.events(importId).subscribe((message) => {
            messages.push(message);
        });

        events$.next(new ImportLocationsCompletedEvent(importId, 2500, 2100, 400));

        expect(messages).toEqual([
            {
                type: 'completed',
                data: {
                    processed: 2500,
                    inserted: 2100,
                    skipped: 400,
                },
            },
        ]);

        subscription.unsubscribe();
    });

    it('should map failed event to SSE message', () => {
        const messages: unknown[] = [];

        const subscription = controller.events(importId).subscribe((message) => {
            messages.push(message);
        });

        events$.next(new ImportLocationsFailedEvent(importId, 'Dataset failed'));

        expect(messages).toEqual([
            {
                type: 'failed',
                data: {
                    message: 'Dataset failed',
                },
            },
        ]);

        subscription.unsubscribe();
    });

    it('should ignore events for another import', () => {
        const messages: unknown[] = [];

        const subscription = controller.events(importId).subscribe((message) => {
            messages.push(message);
        });

        events$.next(new ImportLocationsProgressedEvent('another-import', 1000, 1000, 0));

        events$.next(new ImportLocationsCompletedEvent('another-import', 1000, 1000, 0));

        events$.next(new ImportLocationsFailedEvent('another-import', 'Another import failed'));

        expect(messages).toEqual([]);

        subscription.unsubscribe();
    });

    it('should emit only events matching the requested import id', () => {
        const messages: unknown[] = [];

        const subscription = controller.events(importId).subscribe((message) => {
            messages.push(message);
        });

        events$.next(new ImportLocationsProgressedEvent('another-import', 1000, 1000, 0));

        events$.next(new ImportLocationsProgressedEvent(importId, 1000, 900, 100));

        events$.next(new ImportLocationsCompletedEvent(importId, 1000, 900, 100));

        events$.next(new ImportLocationsCompletedEvent('another-import', 2000, 2000, 0));

        expect(messages).toEqual([
            {
                type: 'progress',
                data: {
                    processed: 1000,
                    inserted: 900,
                    skipped: 100,
                },
            },
            {
                type: 'completed',
                data: {
                    processed: 1000,
                    inserted: 900,
                    skipped: 100,
                },
            },
        ]);

        subscription.unsubscribe();
    });

    it('should ignore unrelated application events', () => {
        const messages: unknown[] = [];

        const subscription = controller.events(importId).subscribe((message) => {
            messages.push(message);
        });

        events$.next({
            importId,
            someOtherEvent: true,
        });

        expect(messages).toEqual([]);

        subscription.unsubscribe();
    });

    it('should stop emitting after subscription is disposed', () => {
        const messages: unknown[] = [];

        const subscription = controller.events(importId).subscribe((message) => {
            messages.push(message);
        });

        events$.next(new ImportLocationsProgressedEvent(importId, 1000, 900, 100));

        subscription.unsubscribe();

        events$.next(new ImportLocationsProgressedEvent(importId, 2000, 1800, 200));

        expect(messages).toEqual([
            {
                type: 'progress',
                data: {
                    processed: 1000,
                    inserted: 900,
                    skipped: 100,
                },
            },
        ]);
    });
});
