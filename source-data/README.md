# 지도 원자료와 출처

- `ara-campus.osm`: OpenStreetMap API 0.6에서 수집한 원본 XML
- `convert.py`: 원자료를 게임용 미터 단위 좌표로 변환하는 Python 표준 라이브러리 스크립트
- `validate.py`: 원자료의 각 꼭짓점 및 순서가 변환 데이터에 유지되는지 확인하는 스크립트
- `validation.json`: 원본 프로젝트에 포함된 좌표 검증 결과. WebGL 브라우저 검증 결과는 포함하지 않음

수집일: 2026-10-23. 수집 주소:

https://api.openstreetmap.org/api/0.6/map?bbox=126.553,33.447,126.572,33.463

원자료 SHA-256:

`e7412694cb32fca24262aafed780f13186cf9fa8fef54aded86db44b318df662`

캠퍼스 경계는 OSM way `369649909`, 정문은 node `4655302248`입니다. 원점은 위도 33.455, 경도 126.562이며 x는 동쪽, z는 남쪽, 단위는 미터입니다. 변환 결과는 건물 58개, 도로·보행로 75개, 구역 27개입니다.

출처 표기: **© OpenStreetMap contributors**. 라이선스: **ODbL 1.0**.

https://www.openstreetmap.org/copyright

더 자세한 지도 출처·가정·한계는 `../dist/provenance.json`에 있습니다. 정문·박물관·구본관 모델의 참고 사진과 반영 특징은 `../dist/visual-references.json`에 기록되어 있습니다. 사진 파일은 재배포하지 않습니다.

프로젝트 루트에서 아래 명령으로 데이터를 다시 생성하고 검증할 수 있습니다. 이 명령은 `dist/campus-data.json`, `dist/provenance.json`, `source-data/validation.json`을 갱신합니다.

```sh
python3 source-data/convert.py
python3 source-data/validate.py
```
