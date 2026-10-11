const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { transformSync } = require('esbuild');

function loadUtility(file) {
  const source = fs.readFileSync(path.join(__dirname, '../src/app/utils', file), 'utf8');
  const { code } = transformSync(source, { loader: 'ts', format: 'cjs' });
  const module = { exports: {} };
  new Function('module', 'exports', code)(module, module.exports);
  return module.exports;
}

const { createRouteGeometry, advanceRouteProgress, getRemainingPath } = loadUtility('routeProgress.ts');
const { watchLiveLocation } = loadUtility('locationTracking.ts');
const origin = { lat: 37.5, lng: 127 };
const point = (north, east = 0) => ({ lat: origin.lat + north / 111195, lng: origin.lng + east / 88217 });
const near = (actual, expected, tolerance = 0.2) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test('walking halfway through a segment trims blue at the projected position and preserves the complete route', () => {
  const route = createRouteGeometry([point(0), point(100), point(200)]);
  const progress = advanceRouteProgress(route, point(45, 5), 0);
  near(progress, 45);
  const remaining = getRemainingPath(route, progress);
  near((remaining[0].lat - origin.lat) * 111195, 45);
  assert.equal(remaining.at(-1), route.path.at(-1));
  assert.equal(route.path.length, 3);
  assert.deepEqual(route.path[0], origin);
});

test('passed segments stay passed when a GPS fix drifts backwards', () => {
  const route = createRouteGeometry([point(0), point(100), point(200)]);
  assert.equal(advanceRouteProgress(route, point(40), 50), 50);
});

test('off-route movement leaves route progress unchanged', () => {
  const route = createRouteGeometry([point(0), point(100)]);
  assert.equal(advanceRouteProgress(route, point(50, 100), 20), 20);
});

test('a route crossing selects the earlier segment rather than consuming a future loop', () => {
  const route = createRouteGeometry([point(0), point(100), point(100, 100), point(0, 100), point(0), point(100)]);
  near(advanceRouteProgress(route, point(40), 0, 500), 40);
  near(advanceRouteProgress(route, point(40), 0, 60), 40);
});

test('reaching a later parallel segment cannot consume hundreds of unwalked meters', () => {
  const route = createRouteGeometry([point(0), point(100), point(100, 100), point(0, 100)]);
  assert.equal(advanceRouteProgress(route, point(0, 100), 0, 60), 0);
});

test('duplicate points and bends produce a valid remaining route', () => {
  const route = createRouteGeometry([point(0), point(0), point(100), point(100, 100)]);
  const progress = advanceRouteProgress(route, point(100, 40), 90, 60);
  near(progress, 140);
  const remaining = getRemainingPath(route, progress);
  near((remaining[0].lng - origin.lng) * 88217, 40);
  assert.equal(remaining.length, 2);
});

test('arrival removes the remaining blue path while the full gray path stays available', () => {
  const route = createRouteGeometry([point(0), point(100)]);
  assert.deepEqual(getRemainingPath(route, route.length), []);
  assert.equal(route.path.length, 2);
  assert.deepEqual(getRemainingPath(createRouteGeometry([]), 0), []);
});

test('one continuous watch delivers multiple movements, recovers after errors and cleans up late callbacks', () => {
  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  let success, failure, options;
  const cleared = [];
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { geolocation: {
    watchPosition: (onSuccess, onFailure, config) => { success = onSuccess; failure = onFailure; options = config; return 17; },
    clearWatch: (id) => cleared.push(id),
  } } });
  try {
    const locations = [], errors = [];
    const stop = watchLiveLocation((location) => locations.push(location), (error) => errors.push(error.code));
    const fix = (north, timestamp) => ({ coords: { latitude: point(north).lat, longitude: origin.lng, accuracy: 5 }, timestamp });
    success(fix(0, 1000));
    success(fix(20, 2000));
    success(fix(10, 1500)); // stale fix must not move the user backwards
    failure({ code: 3 });
    success(fix(30, 3000));
    assert.equal(locations.length, 3);
    assert.equal(locations.at(-1).lat, point(30).lat);
    assert.equal(locations.at(-1).accuracy, 5);
    assert.deepEqual(errors, [3]);
    assert.equal(options.enableHighAccuracy, true);
    assert.equal(options.maximumAge, 0);
    stop();
    success(fix(40, 4000));
    failure({ code: 1 });
    assert.equal(locations.length, 3);
    assert.deepEqual(errors, [3]);
    assert.deepEqual(cleared, [17]);
  } finally {
    if (previousNavigator) Object.defineProperty(globalThis, 'navigator', previousNavigator);
    else delete globalThis.navigator;
  }
});
