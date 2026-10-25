# 숨결 · 캠퍼스 산책

제주대학교 아라캠퍼스를 캐릭터로 걸어 다니는 Three.js 싱글플레이 웹 게임입니다. 공개 버전은 `scene-r22`입니다.

**게임 주소: https://jnuproject.github.io/sumgyeol2027/**

앱 설치·로그인·API 키가 필요 없습니다. 지도·고도·재질·Three.js·글꼴을 함께 제공하며, 게임에 필요한 외부 API 호출은 없습니다.

## 조작

- WASD / 방향키: 이동, Shift: 달리기, Space: 점프
- 화면 드래그: 시점 회전, 휠: 확대·축소
- V: 1·3인칭 전환, R: 정문으로 돌아가기
- 정문·도서관 오르막·학생회관(신관): 중점 구역 둘러보기
- 도서관 오르막: 경상대 앞 또는 중앙도서관 앞에서 걷기 시작
- 모바일: 이동 조이스틱과 점프·달리기 버튼
- 사진 모드: 화면 도구의 카메라 버튼

산책 기록은 해당 브라우저에만 저장됩니다.

## 로컬 실행

Python 3이 있는 환경에서 저장소 폴더로 이동해 실행합니다.

```sh
python3 run.py
```

또는 `python3 -m http.server 8000 --bind 127.0.0.1 --directory dist` 후 http://127.0.0.1:8000/ 를 엽니다. `file://` 직접 실행은 지원하지 않습니다.

## 배포

`.github/workflows/pages.yml`이 `main`의 `dist/`만 GitHub Pages에 배포합니다. 원자료와 변환 스크립트는 저장소의 `source-data/`에 보존합니다. GitHub Actions에서 수동 재배포할 수 있습니다.

## 자료와 한계

- 지도: © OpenStreetMap contributors, ODbL 1.0. 현재 건물 59개·도로/보행로 91개·구역 35개. 원자료·추가 공개 데이터·변환 기록은 `source-data/`와 `dist/odbl-provenance.json` 참조.
- 일부 ODbL 지도 데이터는 SMASH-JEJU의 명시적 데이터 예외 조항에 따라 사용합니다. 해당 프로젝트의 게임 코드·이미지·화면 디자인은 포함하지 않습니다. 원문의 조건은 `source-data/odbl/SMASH-SOURCE-LICENSE.txt`에 보존합니다.
- 고도: Terrain Tiles / Mapzen, hosted on AWS. SRTM data courtesy of the U.S. Geological Survey. 약 30m 원천 자료이며 약 4m 타일 픽셀·보간으로 현장 정밀도가 높아지지 않습니다. 출처와 원천 타일은 `source-data/terrain/`, 게임 격자는 `dist/terrain-data/` 참조.
- 운동장·도서관·공학관 마당의 국소 평탄면은 공개 로드뷰 관찰에 따른 시각적 보정이며 높이·경사는 실측값이 아닙니다. 미관찰 건물 면, 일반 건물 높이, 수목 위치, 도로 폭과 차량 배치는 추정입니다.
- 로드뷰는 공개 화면에서 형태를 관찰했으며 사진·파노라마·제한된 3D 모델을 추출하거나 텍스처로 배포하지 않습니다. 관찰 기록: `source-data/appearance/campus-survey-20261024/`.
- Three.js: MIT (`dist/THREE-LICENSE.txt`), Pretendard: SIL OFL (`dist/assets/PRETENDARD-LICENSE.txt`), Poly Haven 재질: CC0 (`dist/assets/materials/sources.json`). 숨결 브랜드 자산의 출처는 `dist/assets/README.md` 참조.

제주대학교 공식 서비스나 측량 기반 디지털 트윈이 아닙니다. 실제 휴대폰 하드웨어·멀티터치 검증은 추가로 필요합니다.

## 검증

Node.js가 있는 환경에서:

```sh
node --experimental-default-type=module --test tests/*.mjs source-data/terrain/terrain.test.mjs verification/navigation.test.mjs
```

원본 출발 커밋은 Sites의 `ce4c2a3461ee09077194c4e36d35b1d823bdcb06`이며 이후 독립 게임 코드와 환경 변경을 반영했습니다. 로컬 원본의 `.git`, 백업, 개인 작업 메타데이터는 이 저장소에 복사하지 않습니다.

## 중점 구역

학교 전체 확장 대신 정문, 경상대 앞에서 중앙도서관으로 올라가는 구간, 학생회관(신관)에 집중합니다. 기존 학교 배치와 산책 기능은 보존하고, 세 구역의 메뉴·출발점·미니맵 강조를 변경했습니다. 아직 정책 내용은 추가하지 않았습니다. `dist/focus-scope.json` 참조.

## 중점 구역 모델 구체화

`detail-r20`에서 경상대1·2호관의 서로 다른 외관, 중앙도서관 정면·차양·계단·층형 수목, 신관 타일·유리 계단실·낮은 마당과 진입 계단, 정문 문주와 경비실 주변을 구체화했습니다. 경상대–도서관의 OSM 계단 선형에 실제로 걸을 수 있는 계단과 난간을 연결했습니다. 계단 단수와 치수는 측량값이 아닙니다. `dist/focus-detail-sources.json`과 `source-data/appearance/focus-detail-r20/`에 관찰과 추정을 구분했습니다.

## 이동 가능 범위

`walk-r21`에서는 정문, 경상대에서 중앙도서관으로 올라가는 구간, 학생회관 신관 및 이들을 잇는 길에서만 걸을 수 있습니다. 화면의 파란 경계와 미니맵의 강조 영역이 산책 범위입니다. 달리기·점프·대각선 이동에도 같은 경계를 적용하고, 외부 건물로 바로 이동하던 URL은 차단합니다. `scene-r22`부터 다른 건물·운동장 모델은 생성하지 않고, 세 구역과 연결 길만 표시합니다. 지도 원자료는 삭제하거나 변경하지 않습니다.

## 세 구역만 보이는 장면

`scene-r22`는 정문과 경상대1·2호관, 중앙도서관, 학생회관 신관만 모델링해 표시합니다. 도로·지형·수목·주차 차량도 선택 구역과 연결 길의 주변부로 제한하고, 바깥은 하늘색으로 가립니다. 추가 공개 사진에서 확인한 신관 상층 돌출부·원형 기둥·계단, 도서관 외벽·끝탑·표지석, 정문 보행로 가로 구조물을 반영했습니다. 출처와 추정 범위는 `source-data/appearance/focus-scene-r22/README.md` 참조.
