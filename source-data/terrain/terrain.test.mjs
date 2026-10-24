import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRasterSurface, createCampusTerrain } from '../../dist/terrain.js';

const close = (actual, expected, epsilon = 1e-7) => {
  assert.ok(Number.isFinite(actual), `Expected a finite result; got ${actual}`);
  assert.ok(Math.abs(actual - expected) <= epsilon,
    `${actual} differs from ${expected} by more than ${epsilon}`);
};

function linearSurface(origin = 10) {
  const xs = [0, 2, 5], zs = [0, 3, 7];
  const heights = zs.flatMap(z => xs.map(x => 10 + 2 * x + 3 * z));
  return createRasterSurface({ xs, zs, heights, heightOriginMeters: origin });
}

function assertMeshDraped(surface, mesh, offset) {
  assert.ok(mesh.positions.length > 0, 'Expected nonempty clipped geometry');
  assert.equal(mesh.positions.length % 3, 0);
  assert.equal(mesh.indices.length % 3, 0);
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const [x, y, z] = mesh.positions.slice(i, i + 3);
    close(y, surface.heightAt(x, z) + offset, 2e-5);
  }
  // Vertex-only checks miss road faces that cut across a terrain fold. Test the
  // interior of every face, where clipping against the terrain triangles matters.
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const triangle = Array.from(mesh.indices.slice(i, i + 3), index =>
      Array.from(mesh.positions.slice(index * 3, index * 3 + 3)));
    for (const weights of [[1 / 3, 1 / 3, 1 / 3], [.15, .25, .6]]) {
      const p = [0, 1, 2].map(axis => triangle.reduce(
        (sum, vertex, index) => sum + vertex[axis] * weights[index], 0));
      close(p[1], surface.heightAt(p[0], p[2]) + offset, 2e-5);
    }
  }
}

test('nonuniform X/Z spacing uses metres and preserves the vertical offset', () => {
  const surface = linearSurface();
  for (const [x, z] of [[0, 0], [2, 3], [5, 7], [.4, 2.1], [3.6, 5.4]]) {
    close(surface.heightAt(x, z), 2 * x + 3 * z);
    close(surface.rawHeightAt(x, z), 10 + 2 * x + 3 * z);
  }
  close(surface.heightOriginMeters, 10);
  assert.deepEqual(surface.worldBounds, { minX: 0, maxX: 5, minZ: 0, maxZ: 7 });
  close(surface.slopeAt(3.6, 5.4), Math.sqrt(13));
  const normal = surface.normalAt(3.6, 5.4);
  for (const [axis, value] of [-2, 1, -3].entries()) close(normal[axis], value / Math.sqrt(14));
});

test('height sampling follows the rendered triangle, rather than bilinear interpolation', () => {
  const surface = createRasterSurface({
    xs: [0, 1], zs: [0, 1], heights: [0, 0, 0, 10], heightOriginMeters: 0,
  });
  close(surface.heightAt(.25, .25), 0);
  close(surface.heightAt(.5, .5), 0);
  close(surface.heightAt(.75, .75), 5);
  close(surface.heightAt(.2, .9), 1);
});

test('terrain mesh covers all cells with upward-facing triangles', () => {
  const { geometry } = linearSurface();
  assert.equal(geometry.positions.length, 9 * 3);
  assert.equal(geometry.indices.length, 4 * 6);
  assert.equal(geometry.normals.length, geometry.positions.length);
  for (let i = 0; i < geometry.indices.length; i += 3) {
    const vertices = Array.from(geometry.indices.slice(i, i + 3), index =>
      Array.from(geometry.positions.slice(index * 3, index * 3 + 3)));
    const ab = vertices[1].map((v, axis) => v - vertices[0][axis]);
    const ac = vertices[2].map((v, axis) => v - vertices[0][axis]);
    const upwardCrossY = ab[2] * ac[0] - ab[0] * ac[2];
    assert.ok(upwardCrossY > 0, 'A rendered terrain triangle faces down');
  }
});

test('out-of-range queries explicitly clamp to the sampled edge', () => {
  const surface = linearSurface();
  close(surface.heightAt(-20, -20), surface.heightAt(0, 0));
  close(surface.heightAt(20, 20), surface.heightAt(5, 7));
  close(surface.heightAt(-20, 4.3), surface.heightAt(0, 4.3));
  close(surface.heightAt(2.4, 20), surface.heightAt(2.4, 7));
});

test('convex paving is split at every crossed terrain triangle', () => {
  const surface = createRasterSurface({
    xs: [0, 2, 5], zs: [0, 3, 7],
    heights: [0, 5, -1, 7, -2, 8, 4, 10, 3], heightOriginMeters: 2,
  });
  const mesh = surface.drapeConvexPolygon([[.2, .3], [4.7, .8], [4.4, 6.6], [.4, 6.4]], .12);
  assertMeshDraped(surface, mesh, .12);
  assert.ok(mesh.indices.length > 6, 'Paving should be subdivided across terrain folds');
  let projectedArea = 0;
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const [a, b, c] = Array.from(mesh.indices.slice(i, i + 3), index =>
      [mesh.positions[index * 3], mesh.positions[index * 3 + 2]]);
    const area = ((b[1] - a[1]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[1] - a[1])) / 2;
    assert.ok(area > 0, 'Draped pavement triangles must face upward');
    projectedArea += area;
  }
  close(projectedArea, 25.305, 1e-7); // Shoelace area of the input quadrilateral.
});

test('a diagonal road strip remains above the exact terrain surface through cell seams', () => {
  const surface = createRasterSurface({
    xs: [0, 2, 5], zs: [0, 3, 7],
    heights: [0, 5, -1, 7, -2, 8, 4, 10, 3], heightOriginMeters: 2,
  });
  const mesh = surface.drapeRoadSegment([-.5, 1.2], [5.5, 6.3], 1.6, .08);
  assertMeshDraped(surface, mesh, .08);
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const x = mesh.positions[i], z = mesh.positions[i + 2];
    assert.ok(x >= -1e-8 && x <= 5 + 1e-8 && z >= -1e-8 && z <= 7 + 1e-8,
      'Road geometry outside the available grid must be clipped');
  }
});

test('paving wholly outside the measured crop produces no unsupported geometry', () => {
  const surface = linearSurface();
  const mesh = surface.drapeConvexPolygon([[10, 10], [12, 10], [12, 12], [10, 12]], .1);
  assert.equal(mesh.positions.length, 0);
  assert.equal(mesh.indices.length, 0);
});

test('real AWS data keeps the original game projection and starts at ground zero', async () => {
  const metadata = JSON.parse(await readFile(new URL('../../dist/terrain-data/terrain.json', import.meta.url), 'utf8'));
  const bytes = await readFile(new URL('../../dist/terrain-data/elevations.f32', import.meta.url));
  const heights = new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  const data = JSON.parse(await readFile(new URL('../../dist/campus-data.json', import.meta.url), 'utf8'));
  const surface = createCampusTerrain(metadata, heights, data);
  close(surface.heightAt(...data.spawn), 0, 1e-6);
  close(surface.rawHeightAt(...data.spawn), surface.heightOriginMeters, 1e-6);
  assert.ok(surface.heightOriginMeters > 200 && surface.heightOriginMeters < 400,
    'Spawn elevation should be plausible for the unscaled source in metres');
  assert.equal(surface.geometry.positions.length / 3, heights.length);
  const longitudes = metadata.lonByColumn ?? metadata.grid?.lonByColumn ?? metadata.axes?.lonByColumn;
  const latitudes = metadata.latByRow ?? metadata.grid?.latByRow ?? metadata.axes?.latByRow;
  const [originLat, originLon] = data.origin;
  assert.deepEqual(data.origin, [33.455, 126.562], 'The existing game origin must stay unchanged');
  const rad = Math.PI / 180, radius = 6378137;
  for (const [row, col] of [[0, 0], [latitudes.length - 1, longitudes.length - 1], [83, 127]]) {
    const i = row * longitudes.length + col;
    close(surface.geometry.positions[i * 3], (longitudes[col] - originLon) * radius * rad * Math.cos(originLat * rad));
    close(surface.geometry.positions[i * 3 + 2], -(latitudes[row] - originLat) * radius * rad);
    close(surface.geometry.positions[i * 3 + 1] + surface.heightOriginMeters, heights[i]);
  }
});
