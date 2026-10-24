'use strict';
(() => {
  const MODEL_ID = '66994283798747f0b8eca9ad0960c319';
  const SDK = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
  const $ = id => document.getElementById(id);
  const controls = ['overview','places','orbit','firstPerson','fullscreen'];
  const areaNames = {
    '100':'정문 · 박물관', '200':'자연과학대학 · 약학대학',
    '300':'공과대학 · 해양과학대학', '400':'본관 · 정보화본부',
    '500':'학생회관 · 체육관', '600':'아라뮤즈홀 · 경상대학',
    '700':'중앙도서관 · 의학전문대학원', '800':'인문대학 · 학생생활관'
  };
  let api = null, navigation = 'orbit', initialCamera = null, attempt = 0;
  let sdkPromise, loadTimer, toastTimer;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function notice(message) {
    $('notice').textContent = message; $('notice').hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('notice').hidden = true; }, 6500);
  }
  function enableControls(ready) { controls.forEach(id => { $(id).disabled = !ready; }); }
  function fail(message, token) {
    if (token !== attempt) return;
    clearTimeout(loadTimer); document.body.dataset.viewerState = 'error';
    $('loading').hidden = true; $('failure').hidden = false;
    $('failureText').textContent = message; enableControls(false);
  }
  function loadSdk() {
    if (window.Sketchfab) return Promise.resolve();
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = SDK; script.async = true;
      const timeout = setTimeout(() => {
        script.onload = script.onerror = null; script.remove();
        reject(new Error('SDK timeout'));
      }, 30000);
      script.onload = () => {
        clearTimeout(timeout);
        if (window.Sketchfab) resolve();
        else { script.remove(); reject(new Error('SDK unavailable')); }
      };
      script.onerror = () => { clearTimeout(timeout); script.remove(); reject(new Error('SDK network failure')); };
      document.head.append(script);
    }).catch(error => { sdkPromise = null; throw error; });
    return sdkPromise;
  }
  function setProgress(factor) {
    if (Number.isFinite(factor)) {
      $('loadProgress').value = Math.max(0, Math.min(1, factor));
      $('loadingText').textContent = factor < 1 ? `3D 공간을 불러오는 중 · ${Math.round(factor * 100)}%` : '건물과 지형을 화면에 준비하고 있어요.';
    }
  }
  function loadAnnotations(token) {
    api.getAnnotationList((error, annotations) => {
      if (error || token !== attempt || !Array.isArray(annotations)) return;
      $('places').replaceChildren(new Option('구역으로 이동',''));
      annotations.forEach((item, index) => {
        const match = String(item.name || '').match(/area\s*(\d+)/i);
        if (!match || !areaNames[match[1]]) return;
        $('places').append(new Option(areaNames[match[1]], String(index)));
      });
      document.body.dataset.annotationCount = String(annotations.length);
      $('places').disabled = $('places').options.length < 2;
    });
  }
  async function initialize(mode, camera) {
    const token = ++attempt; clearTimeout(loadTimer); api = null;
    navigation = mode; document.body.dataset.navigation = mode;
    document.body.dataset.viewerState = 'loading'; enableControls(false);
    $('loading').hidden = false; $('failure').hidden = true;
    $('loadProgress').removeAttribute('value');
    $('loadingText').textContent = '실제 캠퍼스의 3D 모델을 불러오고 있어요.';
    $('orbit').setAttribute('aria-pressed', String(mode === 'orbit'));
    $('firstPerson').setAttribute('aria-pressed', String(mode === 'fps'));
    $('controlHint').textContent = mode === 'fps'
      ? '클릭 후 WASD로 이동 · 드래그로 시선 회전 · 벽과 바닥을 통과할 수 있어요'
      : '드래그로 회전 · 휠로 확대 · 숫자를 누르면 구역 안내';
    const previousFrame = $('campusFrame');
    const frame = previousFrame.cloneNode(false); previousFrame.replaceWith(frame);
    loadTimer = setTimeout(() => fail('모델 응답이 늦어지고 있어요. 인터넷 연결을 확인하거나 원본 페이지에서 열어 주세요.', token), 90000);
    try {
      await loadSdk(); if (token !== attempt) return;
      const client = new window.Sketchfab('1.12.1', frame);
      client.init(MODEL_ID, {
        autostart: 1, preload: 0, dnt: 1, navigation: mode, fps_speed: 5,
        success(viewer) {
          if (token !== attempt) return;
          api = viewer;
          viewer.addEventListener('modelLoadProgress', factor => { if (token === attempt) setProgress(factor); });
          viewer.addEventListener('viewerready', () => {
            if (token !== attempt) return;
            clearTimeout(loadTimer); document.body.dataset.viewerState = 'ready';
            $('loading').hidden = true; $('failure').hidden = true; enableControls(true);
            viewer.getCameraLookAt((error, position) => {
              if (error || token !== attempt) return;
              if (!initialCamera) initialCamera = { position: [...position.position], target: [...position.target] };
              if (camera) viewer.setCameraLookAt(camera.position, camera.target, 0);
            });
            loadAnnotations(token);
            if (mode === 'fps') notice('1인칭 탐색 · 화면을 클릭한 뒤 WASD로 움직여 보세요. 충돌 처리는 지원하지 않아요.');
          });
          viewer.start();
        },
        error() { fail('Sketchfab의 3D 모델에 연결하지 못했어요. 인터넷 연결 또는 콘텐츠 차단 설정을 확인해 주세요.', token); }
      });
    } catch { fail('3D 뷰어를 불러오지 못했어요. 이 모델은 인터넷 연결이 필요합니다.', token); }
  }
  function switchMode(mode) {
    if (navigation === mode || !api) return;
    const token = attempt;
    api.getCameraLookAt((error, camera) => {
      if (token === attempt) initialize(mode, error ? null : camera);
    });
  }
  $('orbit').addEventListener('click', () => switchMode('orbit'));
  $('firstPerson').addEventListener('click', () => switchMode('fps'));
  $('retry').addEventListener('click', () => initialize(navigation));
  $('overview').addEventListener('click', () => {
    if (!api || !initialCamera) return;
    api.hideAnnotationTooltips();
    api.setCameraLookAt(initialCamera.position, initialCamera.target, reducedMotion ? 0 : 1.2);
    $('places').value = '';
  });
  $('places').addEventListener('change', () => {
    if (!api || $('places').value === '') return;
    api.gotoAnnotation(Number($('places').value), { preventCameraAnimation: reducedMotion }, error => {
      if (error) notice('이 구역으로 이동하지 못했어요. 화면 속 숫자로 다시 선택해 주세요.');
    });
  });
  $('fullscreen').addEventListener('click', async () => {
    try {
      if ($('campusFrame').requestFullscreen) await $('campusFrame').requestFullscreen();
      else notice('3D 화면 오른쪽 아래의 전체 화면 버튼을 이용해 주세요.');
    } catch { notice('3D 화면 오른쪽 아래의 전체 화면 버튼을 이용해 주세요.'); }
  });
  const dialog = $('infoDialog');
  function showDialog(title, html) { $('dialogTitle').textContent = title; $('dialogBody').innerHTML = html; dialog.showModal(); }
  $('help').addEventListener('click', () => showDialog('캠퍼스를 둘러보는 방법', '<ul><li><b>둘러보기</b>: 화면을 드래그해 회전하고, 휠이나 두 손가락으로 확대해요.</li><li><b>구역 이동</b>: 아래 목록이나 모델 속 숫자를 누르면 해당 구역으로 이동해요.</li><li><b>1인칭 탐색</b>: 화면을 클릭한 뒤 <kbd>W A S D</kbd> 또는 방향키로 움직이고, 드래그로 시선을 바꿔요. 휠로 이동 속도를 조절할 수 있어요.</li><li><b>휴대폰 1인칭</b>: 한 손가락으로 시선을 바꾸고, 두 손가락을 벌리거나 모아 앞뒤로 이동해요.</li></ul><p class="dialog-note">1인칭 탐색에는 중력과 충돌 처리가 없습니다. 벽이나 바닥을 통과하면 ‘전체 캠퍼스’를 눌러 돌아오세요. 카메라 방식 전환 시 모델을 다시 불러옵니다.</p>'));
  $('about').addEventListener('click', () => showDialog('모델과 제작 안내', '<p><b>제주대학교 전체 3d map</b><br>META jeju 제작 · 2023년 1월 4일 공개</p><p>제작자가 제공하는 Sketchfab 공식 뷰어로 연결합니다. 모델 파일은 이 프로젝트에 내려받지 않았으며, 원본의 다운로드·재배포 허가는 확인되지 않았습니다.</p><p>공개 당시 모델이므로 현재 캠퍼스와 차이가 있을 수 있습니다. 원본의 표현 품질과 제공 상태에 따라 화면이 달라질 수 있으며 인터넷 연결이 필요합니다.</p><p><a href="https://sketchfab.com/3d-models/3d-map-66994283798747f0b8eca9ad0960c319" target="_blank" rel="noopener">원본 모델과 제작자 확인 ↗</a></p><p><a href="walk.html">기존 Three.js 캠퍼스 산책 열기 →</a></p><p class="dialog-note">숨결 스타일을 적용한 별도 로컬 실험 프로젝트입니다. 제주대학교의 공식 서비스는 아닙니다. 기존 숨결 앱은 수정하지 않았습니다.</p>'));
  $('closeDialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  initialize('orbit');
})();
