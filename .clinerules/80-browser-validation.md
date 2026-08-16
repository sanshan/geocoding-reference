# Browser validation

When a task changes frontend behavior:

1. Build or start the affected application when necessary.
2. Use Playwright MCP to inspect the actual application.
3. Verify the changed user flow.
4. Check browser console errors when relevant.
5. Do not claim that UI behavior works based only on code inspection.

For user-facing features, validate the primary happy path.

For the Geocoding application, important flows include:

- search autocomplete;
- selecting a search result;
- map movement after selecting a result;
- clicking a map location;
- reverse geocoding;
- displaying the resolved location.