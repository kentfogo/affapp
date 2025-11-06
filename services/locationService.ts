import * as Location from 'expo-location';
import { DistanceUnit } from '../types/session';

class LocationService {
  private watchSubscription: Location.LocationSubscription | null = null;
  private lastPosition: Location.LocationObject | null = null;
  private totalDistance = 0; // in meters
  private hasPermission = false;

  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.hasPermission = status === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      this.hasPermission = false;
      return false;
    }
  }

  async checkPermission(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      this.hasPermission = status === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('Error checking location permission:', error);
      return false;
    }
  }

  async startTracking(
    onLocationUpdate: (distance: number) => void
  ): Promise<void> {
    if (!this.hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) {
        throw new Error('Location permission denied');
      }
    }

    try {
      // Reset distance
      this.totalDistance = 0;
      this.lastPosition = null;

      // Get initial position
      const initialPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      this.lastPosition = initialPosition;

      // Start watching position
      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 1000, // 1 second
          distanceInterval: 1, // 1 meter
        },
        (location) => {
          if (this.lastPosition) {
            const distance = this.calculateDistance(
              this.lastPosition.coords,
              location.coords
            );
            this.totalDistance += distance;
            onLocationUpdate(this.totalDistance);
          }
          this.lastPosition = location;
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
      throw error;
    }
  }

  stopTracking(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
    this.lastPosition = null;
  }

  getDistance(unit: DistanceUnit): number {
    const distanceInMeters = this.totalDistance;
    if (unit === 'kilometers') {
      return distanceInMeters / 1000;
    } else {
      // miles
      return distanceInMeters / 1609.34;
    }
  }

  resetDistance(): void {
    this.totalDistance = 0;
    this.lastPosition = null;
  }

  private calculateDistance(
    coord1: Location.LocationObjectCoords,
    coord2: Location.LocationObjectCoords
  ): number {
    // Haversine formula for distance between two coordinates
    const R = 6371000; // Earth's radius in meters
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) *
        Math.cos(φ2) *
        Math.sin(Δλ / 2) *
        Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

export const locationService = new LocationService();

