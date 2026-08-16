import { createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const host = '127.0.0.1';
const port = 4300;

const currentDirectory = fileURLToPath(new URL('.', import.meta.url));
const fixturesDirectory = join(currentDirectory, '../fixtures');

const contentTypes = {
    '.zip': 'application/zip',
};

const server = createServer((request, response) => {
    const pathname = new URL(request.url ?? '/', `http://${request.headers.host}`).pathname;

    const filePath = join(fixturesDirectory, pathname);

    response.setHeader(
        'Content-Type',
        contentTypes[extname(filePath)] ?? 'application/octet-stream',
    );

    const stream = createReadStream(filePath);

    stream.on('error', () => {
        response.statusCode = 404;
        response.end('Not found');
    });

    stream.pipe(response);
});

server.listen(port, host, () => {
    console.log(`Fixture server is running on http://${host}:${port}`);
});
