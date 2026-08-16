import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

import {
    ImportLocationsCounters,
    ImportLocationsStatus,
    ImportLocationsStatusStore,
} from '../../../application/ports/location-import-status-store.port';

@Injectable()
export class CacheImportLocationsStatusStore extends ImportLocationsStatusStore {
    private static readonly ACTIVE_TTL_MS = 60 * 60 * 1000;
    private static readonly TERMINAL_TTL_MS = 5 * 60 * 1000;
    private static readonly KEY_PREFIX = 'location-import';

    constructor(
        @Inject(CACHE_MANAGER)
        private readonly cache: Cache,
    ) {
        super();
    }

    async get(importId: string): Promise<ImportLocationsStatus | undefined> {
        return this.cache.get<ImportLocationsStatus>(this.key(importId));
    }

    async setRunning(importId: string): Promise<void> {
        await this.cache.set(
            this.key(importId),
            {
                status: 'running',
                processed: 0,
                inserted: 0,
                skipped: 0,
            } satisfies ImportLocationsStatus,
            CacheImportLocationsStatusStore.ACTIVE_TTL_MS,
        );
    }

    async setProgress(importId: string, counters: ImportLocationsCounters): Promise<void> {
        await this.cache.set(
            this.key(importId),
            {
                status: 'running',
                ...counters,
            } satisfies ImportLocationsStatus,
            CacheImportLocationsStatusStore.ACTIVE_TTL_MS,
        );
    }

    async setCompleted(importId: string, counters: ImportLocationsCounters): Promise<void> {
        await this.cache.set(
            this.key(importId),
            {
                status: 'completed',
                ...counters,
            } satisfies ImportLocationsStatus,
            CacheImportLocationsStatusStore.TERMINAL_TTL_MS,
        );
    }

    async setFailed(importId: string, message: string): Promise<void> {
        await this.cache.set(
            this.key(importId),
            {
                status: 'failed',
                message,
            } satisfies ImportLocationsStatus,
            CacheImportLocationsStatusStore.TERMINAL_TTL_MS,
        );
    }

    private key(importId: string): string {
        return `${CacheImportLocationsStatusStore.KEY_PREFIX}:${importId}`;
    }
}
