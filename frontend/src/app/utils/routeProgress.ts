import type { RoutePoint } from "../api/tmapRoutes";

const EARTH_RADIUS = 6371000;
const radians = (degrees: number) => degrees * Math.PI / 180;

export const distanceBetween = (a: RoutePoint, b: RoutePoint) => {
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const value = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(Math.min(1, value)));
};

export function createRouteGeometry(path: RoutePoint[]) {
  const cumulative = [0];
  for (let i = 1; i < path.length; i++) {
    cumulative.push(cumulative[i - 1] + distanceBetween(path[i - 1], path[i]));
  }
  return { path, cumulative, length: path.length ? cumulative[cumulative.length - 1] : 0 };
}

export type RouteGeometry = ReturnType<typeof createRouteGeometry>;

// Match to the next portion of the route, so crossings and GPS drift cannot erase a later loop.
export function advanceRouteProgress(
  route: RouteGeometry,
  location: RoutePoint,
  previous: number,
  maxAdvance = 60,
  tolerance = 30
) {
  let bestProgress = previous;
  let bestDistance = Infinity;
  const scaleX = EARTH_RADIUS * Math.cos(radians(location.lat)) * Math.PI / 180;
  const scaleY = EARTH_RADIUS * Math.PI / 180;
  for (let i = 0; i < route.path.length - 1; i++) {
    const length = route.cumulative[i + 1] - route.cumulative[i];
    if (length === 0 || route.cumulative[i + 1] < previous) continue;
    if (route.cumulative[i] > previous + maxAdvance) break;
    const a = route.path[i];
    const b = route.path[i + 1];
    const ax = (a.lng - location.lng) * scaleX;
    const ay = (a.lat - location.lat) * scaleY;
    const dx = (b.lng - a.lng) * scaleX;
    const dy = (b.lat - a.lat) * scaleY;
    const minimum = Math.max(0, (previous - route.cumulative[i]) / length);
    const maximum = Math.min(1, (previous + maxAdvance - route.cumulative[i]) / length);
    const fraction = Math.max(minimum, Math.min(maximum, -(ax * dx + ay * dy) / (dx * dx + dy * dy)));
    const distance = Math.hypot(ax + fraction * dx, ay + fraction * dy);
    if (distance < bestDistance - 0.01) {
      bestDistance = distance;
      bestProgress = route.cumulative[i] + fraction * length;
    }
  }
  return bestDistance <= tolerance ? Math.max(previous, bestProgress) : previous;
}

export function getRemainingPath(route: RouteGeometry, progress: number): RoutePoint[] {
  if (progress <= 0) return route.path;
  if (progress >= route.length) return [];
  for (let i = 0; i < route.path.length - 1; i++) {
    const length = route.cumulative[i + 1] - route.cumulative[i];
    if (length === 0 || route.cumulative[i + 1] <= progress) continue;
    const fraction = (progress - route.cumulative[i]) / length;
    const a = route.path[i];
    const b = route.path[i + 1];
    return [{ lat: a.lat + (b.lat - a.lat) * fraction, lng: a.lng + (b.lng - a.lng) * fraction }, ...route.path.slice(i + 1)];
  }
  return [];
}
