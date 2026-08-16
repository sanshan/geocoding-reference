import { waitForPortOpen } from '@nx/node/utils';

/* eslint-disable */
var __TEARDOWN_MESSAGE__: string;

module.exports = async function () {
    console.log('\nSetting up...\n');

    const host = process.env.HOST ?? 'localhost';
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;

    await waitForPortOpen(port, { host });

    await waitForPortOpen(4301, {
        host: '127.0.0.1',
    });

    globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
};
