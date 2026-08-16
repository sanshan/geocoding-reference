import { createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

const port = 4301;

const fixtureUrl = new URL('../fixtures/US.zip', import.meta.url);
const fixturePath = fileURLToPath(fixtureUrl);

const server = createServer((request, response) => {
    if (request.url !== '/US.zip') {
        response.writeHead(404);
        response.end('Not Found');
        return;
    }

    response.writeHead(200, {
        'Content-Type': 'application/zip',
    });

    createReadStream(fixturePath).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
    console.log(`API E2E fixture server: http://127.0.0.1:${port}/US.zip`);
});
