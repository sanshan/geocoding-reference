import { useMutation } from '@tanstack/react-query';

import { reverseGeocode } from '../api/geocoding.api';

export function useReverseGeocode() {
    return useMutation({
        mutationFn: reverseGeocode,
    });
}
