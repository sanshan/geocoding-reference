export class ImportLocationsFailedEvent {
    constructor(
        readonly importId: string,
        readonly message: string,
    ) {}
}
