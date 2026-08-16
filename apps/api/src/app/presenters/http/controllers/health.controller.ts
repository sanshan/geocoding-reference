import { Controller, Get } from '@nestjs/common';

type HealthResponse = {
    status: 'ok';
};

@Controller('health')
export class HealthController {
    @Get()
    health(): HealthResponse {
        return {
            status: 'ok',
        };
    }
}
