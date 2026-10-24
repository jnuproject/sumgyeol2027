# ODbL 지도 보완 자료

SMASH-JEJU의 data/campus.json에서 라이선스가 ODbL로 별도 명시된 지도 정보를 사용했습니다. 고정 커밋과 SHA256은 download.json, 원 라이선스는 SMASH-SOURCE-LICENSE.txt, 좌표 정렬은 alignment.json에 있습니다. © OpenStreetMap contributors. https://www.openstreetmap.org/copyright

게임 코드·화면 디자인·효과·텍스처는 가져오지 않았습니다. 소스의 고도 및7000개 생성 수목도 사용하지 않았습니다. 기존 게임의 실제 지도 윤곽과 정문 모델을 보존하고 누락된 사범대학2호관1동, 주변 도로16개, 지도 공원1개를 추가했습니다. 신규 건물 높이16m는 소스의 표시용 추정치이며 실측값이 아닙니다. 모든 도로 폭도 별도 태그가 없는 경우 추정입니다.

독립 변환 스크립트 재실행:
python3 merge_open_data.py baseline-before-merge.json smash-campus-original.json alignment.json ../../dist/terrain-data/terrain.json ../../dist/campus-data.json

원본·변환 지도 데이터는 ODbL1.0 조건으로 제공합니다: https://opendatacommons.org/licenses/odbl/1-0/
