import { useState } from 'react';

import { LocationDetails } from './components/location-details/location-details';
import { GeocodingMap } from './components/geocoding-map/geocoding-map';
import { LocationSearch } from './components/location-search/location-search';
import { useReverseGeocode } from './hooks/use-reverse-geocode';
import { DatasetImport } from './components/dataset-import/dataset-import';
import type { LocationResult } from './types/location-result';

import styles from './app.module.css';

export function App() {
    const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);

    const reverseGeocodeMutation = useReverseGeocode();

    async function handleMapClick(latitude: number, longitude: number) {
        const location = await reverseGeocodeMutation.mutateAsync({
            latitude,
            longitude,
        });

        setSelectedLocation(location);
    }

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <h1>Geocoding</h1>
                <p>Search US locations by city, ZIP code or address</p>
            </header>

            <div className={styles.import}>
                <DatasetImport />
            </div>

            <div className={styles.search}>
                <LocationSearch
                    selectedLocation={selectedLocation}
                    onSelect={setSelectedLocation}
                />
            </div>

            <section className={styles.content}>
                <aside className={styles.details}>
                    <LocationDetails
                        location={selectedLocation}
                        isLoading={reverseGeocodeMutation.isPending}
                        isError={reverseGeocodeMutation.isError}
                    />
                </aside>

                <div className={styles.map}>
                    <GeocodingMap
                        location={selectedLocation}
                        onMapClick={(latitude, longitude) => {
                            void handleMapClick(latitude, longitude);
                        }}
                    />
                </div>
            </section>
        </main>
    );
}

export default App;
