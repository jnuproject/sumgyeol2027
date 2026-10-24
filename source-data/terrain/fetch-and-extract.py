#!/usr/bin/env python3
"""Download six public AWS Terrarium tiles and verify the game's unchanged crop.

No third-party Python packages, credentials, resampling, or smoothing are used.
Default: verify local source tiles and dist/terrain-data/elevations.f32.
Use --download to acquire missing source PNGs from their public URLs first.
The script never writes or overwrites the game's elevations.f32.
"""
import argparse
import concurrent.futures
import datetime
import hashlib
import json
from pathlib import Path
import struct
import ssl
import urllib.request
import zlib

ZOOM = 15
TILES = [(x, y) for y in range(13148, 13151) for x in range(27903, 27905)]
PIXEL_ORIGIN = (7143249, 3366094)
COLS, ROWS = 324, 320
EXPECTED_SHA256 = '012f4486b4a20e60dee053516bf3b4de3186228044d21600b1d56d151251ffc4'
SOURCE_DIR = Path(__file__).resolve().parent
TARGET = SOURCE_DIR.parents[1] / 'dist' / 'terrain-data' / 'elevations.f32'
SIGNATURE = b'\x89PNG\r\n\x1a\n'


def sha256(raw):
    return hashlib.sha256(raw).hexdigest()


def paeth(a, b, c):
    p = a + b - c
    pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
    return a if pa <= pb and pa <= pc else b if pb <= pc else c


def decode_png(raw, expected_size=None):
    if raw[:8] != SIGNATURE:
        raise ValueError('Not a PNG')
    pos, image_data, header, ended = 8, bytearray(), None, False
    while pos < len(raw):
        if pos + 12 > len(raw):
            raise ValueError('Truncated PNG chunk')
        length = struct.unpack_from('>I', raw, pos)[0]
        kind = raw[pos + 4:pos + 8]
        end = pos + 12 + length
        if end > len(raw):
            raise ValueError('Truncated PNG payload')
        payload = raw[pos + 8:pos + 8 + length]
        crc = struct.unpack_from('>I', raw, pos + 8 + length)[0]
        if (zlib.crc32(kind + payload) & 0xffffffff) != crc:
            raise ValueError('PNG CRC mismatch')
        if kind == b'IHDR':
            if header is not None or length != 13:
                raise ValueError('Invalid IHDR')
            header = struct.unpack('>IIBBBBB', payload)
        elif kind == b'IDAT':
            image_data.extend(payload)
        elif kind == b'IEND':
            ended = True
            if end != len(raw):
                raise ValueError('Unexpected trailing PNG bytes')
            break
        pos = end
    if header is None or not ended:
        raise ValueError('Incomplete PNG')
    width, height, depth, color, compression, filtering, interlace = header
    if (depth, color, compression, filtering, interlace) != (8, 2, 0, 0, 0):
        raise ValueError('Only noninterlaced 8-bit RGB PNGs are supported')
    if not (0 < width <= 512 and 0 < height <= 512):
        raise ValueError('Unexpected source dimensions')
    if expected_size and (width, height) != expected_size:
        raise ValueError('Unexpected source tile dimensions')
    packed = zlib.decompress(image_data)
    stride = width * 3
    if len(packed) != height * (stride + 1):
        raise ValueError('Unexpected PNG scanline length')
    pixels = bytearray(width * height * 3)
    filters = set()
    for y in range(height):
        offset = y * (stride + 1)
        mode = packed[offset]
        if mode not in range(5):
            raise ValueError('Unsupported PNG filter')
        filters.add(mode)
        row = packed[offset + 1:offset + stride + 1]
        for i, value in enumerate(row):
            k = y * stride + i
            left = pixels[k - 3] if i >= 3 else 0
            up = pixels[k - stride] if y else 0
            upper_left = pixels[k - stride - 3] if y and i >= 3 else 0
            prediction = (0, left, up, (left + up) // 2, paeth(left, up, upper_left))[mode]
            pixels[k] = (value + prediction) & 255
    return width, height, bytes(pixels), sorted(filters)


def decoder_self_test():
    width, height = 7, 5
    original = bytes((i * 37 + i // 7 * 13) % 256 for i in range(width * height * 3))
    stride, packed = width * 3, bytearray()
    for y in range(height):
        packed.append(y)
        for i in range(stride):
            k = y * stride + i
            left = original[k - 3] if i >= 3 else 0
            up = original[k - stride] if y else 0
            upper_left = original[k - stride - 3] if y and i >= 3 else 0
            prediction = (0, left, up, (left + up) // 2, paeth(left, up, upper_left))[y]
            packed.append((original[k] - prediction) & 255)
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)
    encoded = SIGNATURE + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(packed)) + chunk(b'IEND', b'')
    w, h, decoded, filters = decode_png(encoded)
    assert (w, h) == (width, height) and decoded == original and filters == list(range(5))
    corrupt = bytearray(encoded)
    corrupt[29] ^= 1
    try:
        decode_png(corrupt)
    except ValueError:
        pass
    else:
        raise AssertionError('Corrupt CRC was not rejected')
    return {'allFiveFiltersRoundTrip': True, 'corruptCRCRejected': True}


def source_url(x, y):
    return f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{ZOOM}/{x}/{y}.png'


def obtain(tile, download):
    x, y = tile
    path = SOURCE_DIR / 'tiles' / f'{ZOOM}-{x}-{y}.png'
    headers = {}
    downloaded = False
    if path.exists():
        raw = path.read_bytes()
        decode_png(raw, (256, 256))
    elif download:
        request = urllib.request.Request(source_url(x, y), headers={'User-Agent': 'JejuCampusTerrainSourceVerifier/1.0'})
        # Use the system CA bundle when this Python installation has no CA store.
        # Certificate verification remains enabled; never use an unverified context.
        system_ca = Path('/etc/ssl/cert.pem')
        context = ssl.create_default_context(cafile=str(system_ca)) if system_ca.is_file() else ssl.create_default_context()
        with urllib.request.urlopen(request, timeout=30, context=context) as response:
            if response.status != 200:
                raise RuntimeError(f'HTTP {response.status}')
            raw = response.read(2_000_000)
            if response.read(1):
                raise ValueError('Unexpected tile size')
            headers = {k: response.headers[k] for k in ['Content-Type', 'Content-Length', 'Last-Modified', 'ETag'] if k in response.headers}
        decode_png(raw, (256, 256))
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open('xb') as f:
            f.write(raw)
        downloaded = True
    else:
        raise FileNotFoundError(f'{path.name} missing; run with --download')
    w, h, pixels, filters = decode_png(raw, (256, 256))
    info = {'z': ZOOM, 'x': x, 'y': y, 'url': source_url(x, y), 'file': f'tiles/{path.name}', 'bytes': len(raw), 'sha256': sha256(raw), 'width': w, 'height': h, 'filters': filters, 'downloadedThisRun': downloaded, 'headers': headers}
    return tile, pixels, info


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--download', action='store_true', help='Download missing official source PNGs before verifying')
    parser.add_argument('--verify', action='store_true', help='Explicit alias for default verification mode')
    args = parser.parse_args()
    self_test = decoder_self_test()
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        fetched = list(pool.map(lambda t: obtain(t, args.download), TILES))
    tiles = {tile: pixels for tile, pixels, _ in fetched}
    buffer = bytearray(ROWS * COLS * 4)
    minimum, maximum = float('inf'), float('-inf')
    for row in range(ROWS):
        for col in range(COLS):
            gx, gy = PIXEL_ORIGIN[0] + col, PIXEL_ORIGIN[1] + row
            tile = (gx // 256, gy // 256)
            offset = ((gy % 256) * 256 + gx % 256) * 3
            r, g, b = tiles[tile][offset:offset + 3]
            height = (r * 256 + g + b / 256) - 32768
            struct.pack_into('<f', buffer, (row * COLS + col) * 4, height)
            minimum, maximum = min(minimum, height), max(maximum, height)
    calculated = sha256(buffer)
    existing = TARGET.read_bytes()
    existing_hash = sha256(existing)
    verified = calculated == EXPECTED_SHA256 and existing_hash == calculated and existing == buffer
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    previous_path = SOURCE_DIR / 'download-manifest.json'
    previous = json.loads(previous_path.read_text()) if previous_path.exists() else {}
    previous_tiles = {(item['x'], item['y']): item for item in previous.get('tiles', [])}
    for tile, _, info in fetched:
        old = previous_tiles.get(tile, {})
        if not info['headers'] and old.get('sha256') == info['sha256']:
            info['headers'] = old.get('headers', {})
        info['firstRetrievedUTC'] = old.get('firstRetrievedUTC', previous.get('verifiedUTC', now))
        if info['downloadedThisRun']:
            info['lastRetrievedUTC'] = now
        elif old.get('lastRetrievedUTC'):
            info['lastRetrievedUTC'] = old['lastRetrievedUTC']
    manifest = {'verifiedUTC': now, 'source': 'Terrain Tiles / Mapzen on AWS', 'tiles': [info for _, _, info in fetched], 'originalPNGBytes': sum(info['bytes'] for _, _, info in fetched)}
    report = {'verifiedUTC': now, 'sourcePNGCount': len(fetched), 'decoderSelfTest': self_test, 'rows': ROWS, 'cols': COLS, 'globalPixelOrigin': {'x': PIXEL_ORIGIN[0], 'y': PIXEL_ORIGIN[1]}, 'sampleCoordinates': 'global pixel centres integer + 0.5, EPSG:3857 tile grid', 'rowOrder': 'north to south', 'columnOrder': 'west to east', 'resamplingByThisScript': False, 'smoothingByThisScript': False, 'providerGridIsAlreadyResampled': True, 'underlyingAccuracyNotice': 'Approximately 30 m source, not a campus road or step survey. Provider tile pixel spacing is not survey resolution.', 'minimumMetres': minimum, 'maximumMetres': maximum, 'binaryBytes': len(buffer), 'expectedSHA256': EXPECTED_SHA256, 'reconstructedSHA256': calculated, 'existingSHA256': existing_hash, 'existingBinaryUnchanged': True, 'exactByteMatch': verified}
    # These are verification reports, never the original game binary.
    (SOURCE_DIR / 'download-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    (SOURCE_DIR / 'extraction-validation.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report))
    if not verified:
        raise SystemExit('Source reconstruction does not match the existing game grid')


if __name__ == '__main__':
    main()
