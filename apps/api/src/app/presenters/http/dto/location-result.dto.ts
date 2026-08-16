export class LocationResultDto {
  id: number;
  zipCode: string;
  city: string;
  stateCode: string;
  stateName: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;

  constructor(
    id: number,
    zipCode: string,
    city: string,
    stateCode: string,
    stateName: string,
    latitude: number,
    longitude: number,
    formattedAddress: string
  ) {
    this.id = id;
    this.zipCode = zipCode;
    this.city = city;
    this.stateCode = stateCode;
    this.stateName = stateName;
    this.latitude = latitude;
    this.longitude = longitude;
    this.formattedAddress = formattedAddress;
  }
}