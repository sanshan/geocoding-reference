import type { Location } from '../../../domain/location.aggregate';
import type { LocationPort } from '../../ports/location.port';
import { SearchLocationsUseCase } from './search-locations.use-case';

describe('SearchLocationsUseCase', () => {
    let locationPort: jest.Mocked<LocationPort>;
    let useCase: SearchLocationsUseCase;

    beforeEach(() => {
        locationPort = {
            search: jest.fn(),
            findNearest: jest.fn(),
        };

        useCase = new SearchLocationsUseCase(locationPort);
    });

    it('should return locations found by the repository', async () => {
        const locations = [] as Location[];

        locationPort.search.mockResolvedValue(locations);

        const result = await useCase.execute('New York');

        expect(locationPort.search).toHaveBeenCalledTimes(1);
        expect(locationPort.search).toHaveBeenCalledWith('New York');
        expect(result).toBe(locations);
    });
});
