import type { Location } from '../../../domain/location.aggregate';
import type { LocationPort } from '../../ports/location.port';
import { ReverseGeocodeUseCase } from './reverse-geocode.use-case';

describe('ReverseGeocodeUseCase', () => {
    let locationPort: jest.Mocked<LocationPort>;
    let useCase: ReverseGeocodeUseCase;

    beforeEach(() => {
        locationPort = {
            search: jest.fn(),
            findNearest: jest.fn(),
        };

        useCase = new ReverseGeocodeUseCase(locationPort);
    });

    it('should return the nearest location found by the repository', async () => {
        const location = {} as Location;

        locationPort.findNearest.mockResolvedValue(location);

        const result = await useCase.execute({
            latitude: 40.7128,
            longitude: -74.006,
        });

        expect(locationPort.findNearest).toHaveBeenCalledTimes(1);
        expect(locationPort.findNearest).toHaveBeenCalledWith(40.7128, -74.006);
        expect(result).toBe(location);
    });

    it('should return null when the repository finds no location', async () => {
        locationPort.findNearest.mockResolvedValue(null);

        const result = await useCase.execute({
            latitude: 40.7128,
            longitude: -74.006,
        });

        expect(locationPort.findNearest).toHaveBeenCalledTimes(1);
        expect(locationPort.findNearest).toHaveBeenCalledWith(40.7128, -74.006);
        expect(result).toBeNull();
    });
});
