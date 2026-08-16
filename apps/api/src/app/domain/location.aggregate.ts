export class Location {
  id: number;
  zipCode: string;
  city: string;
  stateCode: string;
  stateName: string;
  county: string | null;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  accuracy: number | null;

  constructor(
    id: number,
    zipCode: string,
    city: string,
    stateCode: string,
    stateName: string,
    county: string | null,
    coordinates: {
      latitude: number;
      longitude: number;
    },
    accuracy: number | null
  ) {
    this.id = id;
    this.zipCode = zipCode;
    this.city = city;
    this.stateCode = stateCode;
    this.stateName = stateName;
    this.county = county;
    this.coordinates = coordinates;
    this.accuracy = accuracy;
  }
}