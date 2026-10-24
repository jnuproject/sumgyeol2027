# 기존 산책 게임에 사용하는 지형

`dist/terrain.js`는 기존 산책 게임의 좌표를 유지하면서 AWS Terrain Tiles 높이 격자를 읽는 독립 구현입니다. 별도 뷰어나 SMASH-JEJU의 코드를 포함하지 않습니다.

## 자료와 원점

- 공개 원천: https://registry.opendata.aws/terrain-tiles/
- Terrarium PNG: zoom 15, x=27903..27904, y=13148..13150, 총 6개.
- 추출 표본: 324열 × 320행 = 103,680개, 북→남 행 순서, 서→동 열 순서.
- 전역 픽셀 시작점: (7143249, 3366094), 각 표본은 픽셀 중심 (+0.5).
- `elevations.f32`: little-endian Float32, 414,720바이트. SHA256: `012f4486b4a20e60dee053516bf3b4de3186228044d21600b1d56d151251ffc4`.
- 기존 게임 원점 `[위도 33.455, 경도 126.562]`, R=6378137m의 국소 등거리 근사. x=동쪽, z=남쪽. 비교 프리뷰의 다른 원점을 섞지 않았습니다.
- 수평·수직 축척은 1:1입니다. 게임 출발점의 원천 높이 277.10593460448075m를 빼 출발점을 y=0으로 둡니다. 고저차는 그대로 유지합니다.
- OSM 건물·도로 좌표는 변경하지 않습니다.

## 파일 복구 기록

이전 검증 자료의 `elevations.f32`를 iCloud에서 읽어 재사용했고, 위 SHA256과 일치함을 확인했습니다. 원래 `terrain.json`과 일부 출처 파일은 재수화 후에도 시간 초과되어, 검증된 zoom·전역 픽셀 시작점·행열 개수에서 위경도 축 배열을 다시 계산했습니다. `dist/terrain-data/terrain.json`의 `metadataReconstructed: true`가 이를 기록합니다. 표본 높이 자체는 변경하지 않았습니다. 6개 PNG 재다운로드와 독립 디코더의 검증 결과는 `extraction-validation.json`을 확인하세요.

## 표면과 도로 계산

`loadCampusTerrain(data)`는 메시와 높이 샘플러를 함께 반환합니다. 셀의 삼각형은 `[a,c,b]`, `[b,c,d]`로 위를 향합니다. 보간은 그 삼각형의 평면 보간이며 쌍선형 보간과 섞지 않습니다. 도로·보도 다각형은 지나가는 모든 지형 삼각형 경계에서 분할합니다. 따라서 꼭짓점만 지면에 맞추고 도로 내부가 땅에 묻히는 문제를 피합니다.

`heightAt(x,z)`와 `rawHeightAt(x,z)`, `normalAt(x,z)`(위쪽 단위 벡터 배열), `slopeAt(x,z)`(rise/run), `worldBounds`, `geometry`, `drapeConvexPolygon(points,offset)`, `drapeRoadSegment(a,b,width,offset)`를 제공합니다.

자료 범위 밖 높이 질의는 가장자리로 제한합니다. 이는 실제 고도의 연장이 아닙니다. 드레이핑은 자료 범위 밖 면을 생성하지 않습니다.

## 정확도와 재사용 조건

약 4m 간격의 zoom-15 표본은 제공자가 기존 자료를 재표본화한 결과입니다. 기반 지형은 약 30m 수준의 SRTM 계열 자료이며, 세밀한 계단·보도 턱·건물 기초의 실측 자료가 아닙니다. 촘촘한 메시와 보간으로 원래 정확도가 높아지지 않습니다. 별도의 평활화나 새로운 고도 보정은 하지 않았습니다.

SRTM 관측은 2000년 2월이며 일반적으로 EGM96 높이를 사용합니다. 그러나 개별 Terrarium PNG 픽셀에는 원천 자료·관측 연도·수직 기준 정보가 들어 있지 않으므로 모든 픽셀의 출처와 기준을 단정하지 않습니다.

출처 표시:

Terrain Tiles / Mapzen, hosted on AWS. SRTM data courtesy of the U.S. Geological Survey.

SRTM은 제공자의 출처 문서에서 public domain 자료로 설명하며 USGS 표기를 요청합니다. 참조:
- https://github.com/tilezen/joerd/blob/master/docs/attribution.md#srtm
- https://github.com/tilezen/joerd/blob/master/docs/formats.md

## 확인

프로젝트 `working` 폴더에서:

```sh
node --experimental-default-type=module --test source-data/terrain/terrain.test.mjs
```

8개 CPU 테스트로 비균등 좌표, 높이 원점, 표면 삼각형/보행 샘플러 일치, 위쪽 면, 경계 제한, 도로 면 내부의 지면 일치, 실제 격자와 기존 게임 좌표 정렬을 확인했습니다. 이것만으로 실제 게임의 WebGL·카메라·이동 검증을 대신하지 않습니다.

원천 자료의 오프라인 재검증(기존 게임 높이 이진 파일을 덮어쓰지 않음):

```sh
python3 source-data/terrain/fetch-and-extract.py --verify
```

원천 PNG가 없는 경우에만 `--download`를 추가하면 공식 공개 URL에서 필요한 타일을 받습니다. 표준 Python 라이브러리만 사용하며 새 API 키나 패키지 설치가 필요하지 않습니다.
