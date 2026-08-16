import { Controller, MessageEvent, Param, Sse } from '@nestjs/common';
import { EventBus, ofType } from '@nestjs/cqrs';
import { defer, filter, from, map, merge, type Observable } from 'rxjs';

import {
    type ImportLocationsStatus,
    ImportLocationsStatusStore,
} from '../../../../application/ports/location-import-status-store.port';
import { ImportLocationsCompletedEvent } from '../../../../application/use-cases/import-locations/events/import-locations-completed.event';
import { ImportLocationsFailedEvent } from '../../../../application/use-cases/import-locations/events/import-locations-failed.event';
import { ImportLocationsProgressedEvent } from '../../../../application/use-cases/import-locations/events/import-locations-progressed.event';

type ImportLocationsEvent =
    ImportLocationsProgressedEvent | ImportLocationsCompletedEvent | ImportLocationsFailedEvent;

@Controller('geocoding/import')
export class ImportLocationsEventsController {
    constructor(
        private readonly eventBus: EventBus,
        private readonly statusStore: ImportLocationsStatusStore,
    ) {}

    @Sse(':id/events')
    events(@Param('id') importId: string): Observable<MessageEvent> {
        const live$ = this.eventBus.pipe(
            ofType(
                ImportLocationsProgressedEvent,
                ImportLocationsCompletedEvent,
                ImportLocationsFailedEvent,
            ),
            filter((event) => event.importId === importId),
            map((event) => this.eventToMessageEvent(event)),
        );

        const replay$ = defer(() => from(this.statusStore.get(importId))).pipe(
            filter((status): status is ImportLocationsStatus => status !== undefined),
            map((status) => this.statusToMessageEvent(status)),
        );

        return merge(live$, replay$);
    }

    private eventToMessageEvent(event: ImportLocationsEvent): MessageEvent {
        if (event instanceof ImportLocationsProgressedEvent) {
            return {
                type: 'progress',
                data: {
                    processed: event.processed,
                    inserted: event.inserted,
                    skipped: event.skipped,
                },
            };
        }

        if (event instanceof ImportLocationsCompletedEvent) {
            return {
                type: 'completed',
                data: {
                    processed: event.processed,
                    inserted: event.inserted,
                    skipped: event.skipped,
                },
            };
        }

        return {
            type: 'failed',
            data: {
                message: event.message,
            },
        };
    }

    private statusToMessageEvent(status: ImportLocationsStatus): MessageEvent {
        if (status.status === 'failed') {
            return {
                type: 'failed',
                data: {
                    message: status.message,
                },
            };
        }

        return {
            type: status.status === 'completed' ? 'completed' : 'progress',
            data: {
                processed: status.processed,
                inserted: status.inserted,
                skipped: status.skipped,
            },
        };
    }
}
