import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import type { LocationResult } from '../../types/location-result';

import styles from './geocoding-map.module.css';

L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

type GeocodingMapProps = {
    location: LocationResult | null;
    onMapClick: (latitude: number, longitude: number) => void;
};

function MapController({ location }: Pick<GeocodingMapProps, 'location'>) {
    const map = useMap();

    useEffect(() => {
        if (!location) {
            return;
        }

        map.flyTo([location.latitude, location.longitude], 12);
    }, [location, map]);

    return null;
}

function MapClickHandler({ onMapClick }: Pick<GeocodingMapProps, 'onMapClick'>) {
    useMapEvents({
        click(event) {
            onMapClick(event.latlng.lat, event.latlng.lng);
        },
    });

    return null;
}

export function GeocodingMap({ location, onMapClick }: GeocodingMapProps) {
    return (
        <MapContainer
            center={[39.8283, -98.5795]}
            zoom={4}
            minZoom={3}
            maxBounds={[
                [-90, -180],
                [90, 180],
            ]}
            maxBoundsViscosity={1}
            className={styles.map}
        >
            <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                noWrap
            />

            <MapController location={location} />
            <MapClickHandler onMapClick={onMapClick} />

            {location && (
                <Marker position={[location.latitude, location.longitude]}>
                    <Popup>{location.formattedAddress}</Popup>
                </Marker>
            )}
        </MapContainer>
    );
}
