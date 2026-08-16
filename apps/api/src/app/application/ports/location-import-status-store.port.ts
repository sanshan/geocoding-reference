export interface ImportLocationsCounters {
    processed: number;
    inserted: number;
    skipped: number;
}

export type ImportLocationsStatus =
    | ({
          status: 'running';
      } & ImportLocationsCounters)
    | ({
          status: 'completed';
      } & ImportLocationsCounters)
    | {
          status: 'failed';
          message: string;
      };

export abstract class ImportLocationsStatusStore {
    abstract get(importId: string): Promise<ImportLocationsStatus | undefined>;

    abstract setRunning(importId: string): Promise<void>;

    abstract setProgress(importId: string, counters: ImportLocationsCounters): Promise<void>;

    abstract setCompleted(importId: string, counters: ImportLocationsCounters): Promise<void>;

    abstract setFailed(importId: string, message: string): Promise<void>;
}
