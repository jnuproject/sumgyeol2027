import {gradeObservedSportsField} from './site-grading.js?v=campus-r28a';
// Independent rectilinear terrain adapter. Horizontal and vertical units are metres.
// The AWS Terrarium grid is already resampled by its provider; ~4 m grid spacing
// does not turn the underlying approximately 30 m source into a ground survey.
const R = 6378137;
const RAD = Math.PI / 180;
const EPS = 1e-8;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function cellFor(axis, value) {
  if (value <= axis[0]) return 0;
  if (value >= axis[axis.length - 1]) return axis.length - 2;
  let lo = 0, hi = axis.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (axis[mid] <= value) lo = mid; else hi = mid;
  }
  return lo;
}

export function createRasterSurface({xs, zs, heights, heightOriginMeters = 0, originAt}) {
  xs = Float64Array.from(xs); zs = Float64Array.from(zs);
  const cols = xs.length, rows = zs.length;
  if (cols < 2 || rows < 2 || heights.length !== cols * rows) throw Error('Invalid terrain grid dimensions');
  for (const axis of [xs, zs]) for (let i = 0; i < axis.length; i++) {
    if (!Number.isFinite(axis[i]) || (i && axis[i] <= axis[i - 1])) throw Error('Terrain axes must strictly increase');
  }
  heights = Float64Array.from(heights);
  if (heights.some(v => !Number.isFinite(v))) throw Error('Terrain contains invalid heights');
  const worldBounds = {minX: xs[0], maxX: xs[cols - 1], minZ: zs[0], maxZ: zs[rows - 1]};
  function sample(x, z) {
    x = clamp(x, worldBounds.minX, worldBounds.maxX);
    z = clamp(z, worldBounds.minZ, worldBounds.maxZ);
    const col = cellFor(xs, x), row = cellFor(zs, z), a = row * cols + col;
    const dx = xs[col + 1] - xs[col], dz = zs[row + 1] - zs[row];
    const u = (x - xs[col]) / dx, v = (z - zs[row]) / dz;
    const h00 = heights[a], h10 = heights[a + 1], h01 = heights[a + cols], h11 = heights[a + cols + 1];
    if (u + v <= 1) return [h00 + (h10 - h00) * u + (h01 - h00) * v, (h10 - h00) / dx, (h01 - h00) / dz];
    return [h11 + (h01 - h11) * (1 - u) + (h10 - h11) * (1 - v), (h11 - h01) / dx, (h11 - h10) / dz];
  }
  if (originAt) heightOriginMeters = sample(originAt[0], originAt[1])[0];
  if (!Number.isFinite(heightOriginMeters)) throw Error('Invalid vertical origin');
  const rawHeightAt = (x, z) => sample(x, z)[0];
  const heightAt = (x, z) => rawHeightAt(x, z) - heightOriginMeters;
  const normalAt = (x, z) => {const [, dx, dz] = sample(x, z), length = Math.hypot(dx, 1, dz); return [-dx / length, 1 / length, -dz / length];};
  const slopeAt = (x, z) => {const [, dx, dz] = sample(x, z); return Math.hypot(dx, dz);};
  const positions = new Float64Array(rows * cols * 3);
  const normals = new Float32Array(positions.length);
  const indices = new Uint32Array((rows - 1) * (cols - 1) * 6);
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    const i = row * cols + col;
    positions.set([xs[col], heights[i] - heightOriginMeters, zs[row]], i * 3);
  }
  let at = 0;
  for (let row = 0; row < rows - 1; row++) for (let col = 0; col < cols - 1; col++) {
    const a = row * cols + col, b = a + 1, c = a + cols, d = c + 1;
    indices.set([a, c, b, b, c, d], at); at += 6;
  }
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 3, b = indices[i + 1] * 3, c = indices[i + 2] * 3;
    const ux = positions[b] - positions[a], uy = positions[b + 1] - positions[a + 1], uz = positions[b + 2] - positions[a + 2];
    const vx = positions[c] - positions[a], vy = positions[c + 1] - positions[a + 1], vz = positions[c + 2] - positions[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const q of [a, b, c]) {normals[q] += nx; normals[q + 1] += ny; normals[q + 2] += nz;}
  }
  for (let i = 0; i < normals.length; i += 3) {
    const length = Math.hypot(normals[i], normals[i + 1], normals[i + 2]);
    normals[i] /= length; normals[i + 1] /= length; normals[i + 2] /= length;
  }

  // Clip each convex surface polygon to the exact terrain triangles, rather than
  // sampling only its corners. This keeps the interior above the same ground mesh.
  const cross = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  function clipToTriangle(input, triangle) {
    let output = input;
    const direction = Math.sign(cross(triangle[0], triangle[1], triangle[2]));
    for (let i = 0; i < 3 && output.length; i++) {
      const a = triangle[i], b = triangle[(i + 1) % 3], previous = output;
      output = [];
      let p = previous[previous.length - 1], pd = cross(a, b, p) * direction;
      for (const q of previous) {
        const qd = cross(a, b, q) * direction;
        if ((pd >= -EPS) !== (qd >= -EPS)) {
          const t = pd / (pd - qd);
          output.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
        }
        if (qd >= -EPS) output.push(q);
        p = q; pd = qd;
      }
    }
    const clean = [];
    for (const p of output) if (!clean.length || Math.hypot(p[0] - clean[clean.length - 1][0], p[1] - clean[clean.length - 1][1]) > EPS) clean.push(p);
    if (clean.length > 1 && Math.hypot(clean[0][0] - clean[clean.length - 1][0], clean[0][1] - clean[clean.length - 1][1]) < EPS) clean.pop();
    return clean;
  }
  const empty = () => ({positions: new Float64Array(), indices: new Uint32Array(), normals: new Float32Array()});
  function drapeConvexPolygon(points, offset = .06) {
    if (!Number.isFinite(offset) || points.length < 3) return empty();
    points = points.map(p => [Number(p[0]), Number(p[1])]);
    if (points.some(p => !Number.isFinite(p[0]) || !Number.isFinite(p[1]))) throw Error('Invalid surface polygon');
    if (Math.hypot(points[0][0] - points[points.length - 1][0], points[0][1] - points[points.length - 1][1]) < EPS) points.pop();
    if (points.length < 3) return empty();
    const minX = Math.min(...points.map(p => p[0])), maxX = Math.max(...points.map(p => p[0]));
    const minZ = Math.min(...points.map(p => p[1])), maxZ = Math.max(...points.map(p => p[1]));
    if (maxX < worldBounds.minX || minX > worldBounds.maxX || maxZ < worldBounds.minZ || minZ > worldBounds.maxZ) return empty();
    const firstCol = cellFor(xs, minX), lastCol = cellFor(xs, maxX), firstRow = cellFor(zs, minZ), lastRow = cellFor(zs, maxZ);
    const outPositions = [], outIndices = [], outNormals = [];
    for (let row = firstRow; row <= lastRow; row++) for (let col = firstCol; col <= lastCol; col++) {
      const a = [xs[col], zs[row]], b = [xs[col + 1], zs[row]], c = [xs[col], zs[row + 1]], d = [xs[col + 1], zs[row + 1]];
      for (const triangle of [[a, c, b], [b, c, d]]) {
        const clipped = clipToTriangle(points, triangle);
        if (clipped.length < 3) continue;
        let area = 0;
        for (let i = 0; i < clipped.length; i++) {const p = clipped[i], q = clipped[(i + 1) % clipped.length]; area += p[0] * q[1] - q[0] * p[1];}
        if (Math.abs(area) < EPS) continue;
        if (area > 0) clipped.reverse();
        const start = outPositions.length / 3;
        for (const p of clipped) {outPositions.push(p[0], heightAt(p[0], p[1]) + offset, p[1]); outNormals.push(...normalAt(p[0], p[1]));}
        for (let i = 1; i < clipped.length - 1; i++) outIndices.push(start, start + i, start + i + 1);
      }
    }
    return {positions: Float64Array.from(outPositions), indices: Uint32Array.from(outIndices), normals: Float32Array.from(outNormals)};
  }
  function drapeRoadSegment(a, b, width, offset = .06) {
    const dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz);
    if (length < EPS || !Number.isFinite(width) || width <= 0) return empty();
    const nx = -dz / length * width / 2, nz = dx / length * width / 2;
    return drapeConvexPolygon([[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]], offset);
  }
  return {heightAt, rawHeightAt, normalAt, slopeAt, worldBounds, heightOriginMeters,
    geometry: {positions, indices, normals}, drapeConvexPolygon, drapeRoadSegment,
    gridInfo: {rows, cols, sampleCount: rows * cols, horizontalScale: 1, verticalScale: 1, interpolation: 'piecewise planar triangles; outside values clamped'}};
}

export function createCampusTerrain(metadata, heights, data) {
  const lonByColumn = metadata.lonByColumn ?? metadata.grid?.lonByColumn ?? metadata.axes?.lonByColumn;
  const latByRow = metadata.latByRow ?? metadata.grid?.latByRow ?? metadata.axes?.latByRow;
  if (!lonByColumn || !latByRow) throw Error('Terrain coordinate arrays missing');
  const [originLat, originLon] = data.origin;
  if (![originLat, originLon].every(Number.isFinite)) throw Error('Game geographic origin missing');
  const xs = lonByColumn.map(lon => (lon - originLon) * R * RAD * Math.cos(originLat * RAD));
  const zs = latByRow.map(lat => -(lat - originLat) * R * RAD);
  const grading = gradeObservedSportsField(xs,zs,heights,data);
  const surface = createRasterSurface({xs, zs, heights:grading.heights, originAt: data.spawn});
  surface.metadata = {...metadata, gameProjection: {origin: [...data.origin], x: 'east metres', z: 'south metres', radius: R},
    heightOriginMeters: surface.heightOriginMeters, verticalExaggeration: 1, localObservedGrading:grading.notes,
    outsideSampledRegion: 'Clamped to nearest edge; not a measured continuation.',
    credit: 'Terrain Tiles / Mapzen, hosted on AWS. SRTM data courtesy of the U.S. Geological Survey.'};
  return surface;
}

export async function loadCampusTerrain(data) {
  const [metadataResponse, heightsResponse] = await Promise.all([
    fetch(new URL('./terrain-data/terrain.json', import.meta.url)),
    fetch(new URL('./terrain-data/elevations.f32', import.meta.url))
  ]);
  if (!metadataResponse.ok || !heightsResponse.ok) throw Error('Terrain source data could not be loaded');
  const metadata = await metadataResponse.json();
  const buffer = await heightsResponse.arrayBuffer();
  if (buffer.byteLength % 4 !== 0) throw Error('Invalid terrain binary length');
  const view = new DataView(buffer), heights = new Float32Array(buffer.byteLength / 4);
  for (let i = 0; i < heights.length; i++) heights[i] = view.getFloat32(i * 4, true);
  return createCampusTerrain(metadata, heights, data);
}
