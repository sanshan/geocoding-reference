export class ImportLocationsProgressedEvent {
    constructor(
        readonly importId: string,
        readonly processed: number,
        readonly inserted: number,
        readonly skipped: number,
    ) {}
}
