import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MODELS } from './models.js';

const MODEL_DIR = 'assets/models/';

// ---------------------------------------------------------------
// 화면 요소
// ---------------------------------------------------------------
const $ = (id) => document.getElementById(id);
const viewerEl = $('viewer');
const homeEl = $('home');
const overlayEl = $('xr-overlay');
const arBtn = $('ar-btn');
const exitBtn = $('exit-btn');
const statusEl = $('status');
const deviceNote = $('device-note');
const quickLook = $('quicklook');
const toastEl = $('toast');
// 미리보기 화면과 AR 화면에 같은 조작 UI가 하나씩 있음
const playBtns = [$('play-btn'), $('xr-play-btn')];
const clipSelects = [$('clip-select'), $('xr-clip-select')];
const chipBoxes = [$('model-chips'), $('xr-model-chips')];

// ---------------------------------------------------------------
// 기기 판별
// ---------------------------------------------------------------
const supportsQuickLook = (() => {
  const a = document.createElement('a');
  return !!(a.relList && a.relList.supports && a.relList.supports('ar'));
})();
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let supportsWebXR = false;

async function detectAR() {
  if (navigator.xr && navigator.xr.isSessionSupported) {
    try { supportsWebXR = await navigator.xr.isSessionSupported('immersive-ar'); } catch (e) { supportsWebXR = false; }
  }
  if (supportsWebXR) {
    deviceNote.innerHTML = '모델을 고르고 <b>AR로 보기</b>를 누른 뒤, 책상을 비추고 화면을 눌러 모델을 놓으세요.';
  } else if (supportsQuickLook || isIOS) {
    deviceNote.innerHTML = '모델을 고르고 <b>AR로 보기</b>를 누르면 아이폰 AR 뷰어가 열려요. 아래에서 고른 동작이 자동으로 반복 재생됩니다.';
  } else {
    deviceNote.innerHTML = '이 기기/브라우저는 AR을 지원하지 않아 <b>3D 미리보기</b>만 가능해요. 안드로이드는 Chrome, 아이폰은 Safari로 열어 주세요.';
  }
}
detectAR();

// ---------------------------------------------------------------
// three.js 기본 구성 (미리보기와 AR이 같은 렌더러를 씀)
// ---------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.xr.enabled = true;
viewerEl.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const PREVIEW_BG = new THREE.Color(0x1a1d24);
scene.background = PREVIEW_BG;

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.01, 50);
camera.position.set(0, 0.22, 0.75);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.11, 0);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 0.25;
controls.maxDistance = 2;
controls.maxPolarAngle = Math.PI * 0.49;
controls.update();

scene.add(new THREE.HemisphereLight(0xffffff, 0x445066, 2.0));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 0.1;
sun.shadow.camera.far = 3;
sun.shadow.camera.left = sun.shadow.camera.bottom = -0.5;
sun.shadow.camera.right = sun.shadow.camera.top = 0.5;
sun.shadow.bias = -0.0005;
scene.add(sun);
scene.add(sun.target);
const SUN_OFFSET = new THREE.Vector3(0.4, 1.2, 0.6);
sun.position.copy(SUN_OFFSET);
// 그림자가 모델 주변에 생기도록 빛을 모델 위치 기준으로 옮김
function moveSunTo(p) {
  sun.target.position.copy(p);
  sun.position.copy(p).add(SUN_OFFSET);
}

// 모델을 담는 그릇. 미리보기에서는 원점, AR에서는 사용자가 누른 책상 위치로 옮겨짐
const holder = new THREE.Group();
scene.add(holder);

// 그림자만 보이는 투명 바닥 (AR에서 모델이 책상에 붙어 있는 느낌을 줌)
const shadowFloor = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
  new THREE.ShadowMaterial({ opacity: 0.35 }),
);
shadowFloor.receiveShadow = true;
holder.add(shadowFloor);

// 미리보기용 원형 받침
const previewDisc = new THREE.Mesh(
  new THREE.CircleGeometry(0.22, 64).rotateX(-Math.PI / 2),
  new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 1 }),
);
previewDisc.position.y = -0.001;
previewDisc.receiveShadow = true;
scene.add(previewDisc);

// AR에서 책상 위치를 보여주는 링
const reticle = new THREE.Mesh(
  new THREE.RingGeometry(0.05, 0.065, 48).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }),
);
reticle.matrixAutoUpdate = false;
reticle.visible = false;
scene.add(reticle);

window.addEventListener('resize', () => {
  if (renderer.xr.isPresenting) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------------------------------------------------------------
// 모델 선택 UI
// ---------------------------------------------------------------
let selectedIndex = 0;
chipBoxes.forEach((box) => {
  MODELS.forEach((m, i) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.setAttribute('role', 'option');
    chip.textContent = `${m.emoji || '📦'} ${m.name}`;
    chip.addEventListener('click', () => selectModel(i));
    box.appendChild(chip);
  });
});

function selectModel(i) {
  selectedIndex = i;
  chipBoxes.forEach((box) => [...box.children].forEach((el, j) => el.setAttribute('aria-selected', String(j === i))));
  showModel(i);
}

// ---------------------------------------------------------------
// 모델 불러오기
// ---------------------------------------------------------------
const loader = new GLTFLoader();
const gltfCache = new Map();
let current = null;   // { root, mixer, clips, action, playing }
let loadToken = 0;

function loadGLTF(file) {
  if (!gltfCache.has(file)) {
    gltfCache.set(file, loader.loadAsync(MODEL_DIR + file).catch((e) => { gltfCache.delete(file); throw e; }));
  }
  return gltfCache.get(file);
}

async function showModel(i) {
  const token = ++loadToken;
  const cfg = MODELS[i];

  if (current) {
    holder.remove(current.root);
    if (current.mixer) current.mixer.stopAllAction();
    current = null;
  }
  setPlayUI({ loading: true });

  let gltf;
  try {
    gltf = await loadGLTF(cfg.glb);
  } catch (e) {
    console.error(e);
    if (token === loadToken) { toast(`모델 파일을 불러오지 못했어요: ${cfg.glb}`); setPlayUI(); }
    return;
  }
  if (token !== loadToken) return;

  const model = cloneSkinned(gltf.scene);
  model.traverse((o) => {
    if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; }
  });

  // 키(height, 미터)에 맞게 크기 조절하고, 발이 바닥(y=0) 중앙에 오도록
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model, true);
  const size = box.getSize(new THREE.Vector3());
  const s = (cfg.height || 0.2) / (size.y || 1);
  const center = box.getCenter(new THREE.Vector3());
  model.scale.setScalar(s);
  model.position.set(-center.x * s, -box.min.y * s, -center.z * s);

  const root = new THREE.Group();
  root.rotation.y = THREE.MathUtils.degToRad(cfg.rotationY || 0);
  root.add(model);
  holder.add(root);

  const clips = gltf.animations || [];
  current = { root, mixer: clips.length ? new THREE.AnimationMixer(model) : null, clips, action: null, playing: false };

  // 애니메이션 목록 채우기
  let defaultClip = Math.max(0, clips.findIndex((c) => c.name === cfg.clip));
  clipSelects.forEach((sel) => {
    sel.innerHTML = '';
    clips.forEach((c, k) => {
      const opt = document.createElement('option');
      opt.value = String(k);
      opt.textContent = c.name || `애니메이션 ${k + 1}`;
      sel.appendChild(opt);
    });
    sel.value = String(defaultClip);
  });

  // 미리보기 카메라를 모델 크기에 맞추기
  if (!renderer.xr.isPresenting) {
    const h = cfg.height || 0.2;
    const span = Math.max(h, size.x * s, size.z * s);
    controls.target.set(0, h * 0.5, 0);
    // 화면 가로/세로 중 좁은 쪽에 모델이 다 들어오도록 거리 계산
    const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
    const dist = 1.5 * Math.max(h / 2 / Math.tan(vHalf), span / 2 / Math.tan(hHalf));
    camera.position.set(0, h * 0.5 + dist * 0.3, dist);
    controls.update();
  }

  if (cfg.autoPlay && clips.length) playClip(defaultClip);
  setPlayUI();
}

// ---------------------------------------------------------------
// 애니메이션 재생 / 정지
// ---------------------------------------------------------------
playBtns.forEach((btn, n) => btn.addEventListener('click', () => {
  if (!current || !current.mixer) return;
  const k = Number(clipSelects[n].value) || 0;
  if (current.playing) {
    current.action.paused = true;
    current.playing = false;
  } else if (current.action && current.action.getClip() === current.clips[k]) {
    current.action.paused = false;
    current.playing = true;
  } else {
    playClip(k);
  }
  setPlayUI();
}));

clipSelects.forEach((sel) => sel.addEventListener('change', () => {
  if (!current || !current.mixer) return;
  clipSelects.forEach((other) => { other.value = sel.value; });
  playClip(Number(sel.value));
  setPlayUI();
}));

function playClip(k) {
  const next = current.mixer.clipAction(current.clips[k]);
  next.reset();
  next.paused = false;
  next.play();
  if (current.action && current.action !== next) current.action.crossFadeTo(next, 0.3, false);
  current.action = next;
  current.playing = true;
}

function setPlayUI({ loading = false } = {}) {
  const has = !!(current && current.mixer);
  playBtns.forEach((btn) => {
    btn.disabled = loading || !has;
    if (loading) btn.textContent = '불러오는 중…';
    else if (!has) btn.textContent = current ? '애니메이션 없음' : '▶ 애니메이션 재생';
    else btn.textContent = current.playing ? '⏸ 일시정지' : '▶ 애니메이션 재생';
  });
  clipSelects.forEach((sel) => sel.classList.toggle('hidden', loading || !(has && current.clips.length > 1)));
}

// ---------------------------------------------------------------
// AR 시작
// ---------------------------------------------------------------
arBtn.addEventListener('click', () => {
  if (supportsWebXR) startWebXR();
  else if (supportsQuickLook || isIOS) openQuickLook();
  else toast('이 기기/브라우저에서는 AR을 쓸 수 없어요.\n안드로이드는 Chrome, 아이폰은 Safari로 열어 주세요.\n(PC에서는 3D 미리보기만 됩니다)', 5000);
});

// ----- 아이폰: AR 뷰어(Quick Look) -----
function openQuickLook() {
  const cfg = MODELS[selectedIndex];
  let file = cfg.usdz;
  if (file && typeof file === 'object') {
    // 동작별 USDZ: 화면에서 고른 동작 이름의 파일을 엶 (없으면 첫 번째)
    const clipName = current && current.clips.length
      ? current.clips[Number(clipSelects[0].value) || 0].name : cfg.clip;
    file = file[clipName] || Object.values(file)[0];
  }
  if (!file) { toast('이 모델은 아이폰용 USDZ 파일이 없어요.'); return; }
  quickLook.setAttribute('href', MODEL_DIR + file);
  quickLook.click();
}

// ----- 안드로이드: WebXR -----
let hitTestSource = null;
let placed = false;

async function startWebXR() {
  let session;
  try {
    session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: overlayEl },
    });
  } catch (e) {
    console.error(e);
    toast('AR을 시작하지 못했어요. 카메라 권한을 허용했는지, Google Play 스토어의 "Google Play 서비스(AR)"가 설치돼 있는지 확인해 주세요.', 6000);
    return;
  }

  renderer.xr.setReferenceSpaceType('local');
  await renderer.xr.setSession(session);

  // AR 화면으로 전환
  scene.background = null;
  previewDisc.visible = false;
  holder.visible = false;
  placed = false;
  controls.enabled = false;
  homeEl.classList.add('hidden');
  overlayEl.classList.remove('hidden');
  setStatus('책상을 천천히 비춰 주세요');

  const viewerSpace = await session.requestReferenceSpace('viewer');
  hitTestSource = await session.requestHitTestSource({ space: viewerSpace });

  // 화면을 누르면(select) 링 위치에 모델 놓기
  session.addEventListener('select', placeModel);
  session.addEventListener('end', onXREnd);
}

// AR 중 UI 버튼을 누를 때는 모델이 옮겨지지 않도록
overlayEl.querySelectorAll('.ar-top, .ar-bottom').forEach((el) => {
  el.addEventListener('beforexrselect', (e) => e.preventDefault());
});

exitBtn.addEventListener('click', () => {
  const s = renderer.xr.getSession();
  if (s) s.end();
});

const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _camPos = new THREE.Vector3();

function placeModel() {
  if (!reticle.visible) return;
  reticle.matrix.decompose(_pos, _quat, _scale);
  holder.position.copy(_pos);
  // 모델이 휴대폰(사용자) 쪽을 바라보도록 회전
  const xrCam = renderer.xr.getCamera();
  xrCam.getWorldPosition(_camPos);
  holder.rotation.set(0, Math.atan2(_camPos.x - _pos.x, _camPos.z - _pos.z), 0);
  moveSunTo(holder.position);
  holder.visible = true;
  placed = true;
  setStatus('다른 곳을 누르면 모델이 옮겨져요', true);
}

function onXREnd() {
  hitTestSource = null;
  reticle.visible = false;
  scene.background = PREVIEW_BG;
  previewDisc.visible = true;
  holder.visible = true;
  holder.position.set(0, 0, 0);
  holder.rotation.set(0, 0, 0);
  moveSunTo(holder.position);
  controls.enabled = true;
  overlayEl.classList.add('hidden');
  homeEl.classList.remove('hidden');
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function setStatus(text, ok = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle('ok', ok);
}

// ---------------------------------------------------------------
// 매 프레임
// ---------------------------------------------------------------
const clock = new THREE.Clock();
renderer.setAnimationLoop((time, frame) => {
  const dt = Math.min(clock.getDelta(), 0.1);
  if (current && current.mixer) current.mixer.update(dt);

  if (frame && hitTestSource) {
    const refSpace = renderer.xr.getReferenceSpace();
    const hits = frame.getHitTestResults(hitTestSource);
    if (hits.length) {
      const pose = hits[0].getPose(refSpace);
      reticle.matrix.fromArray(pose.transform.matrix);
      reticle.visible = true;
      if (!placed) setStatus('책상을 찾았어요. 화면을 눌러 모델을 놓으세요', true);
    } else {
      reticle.visible = false;
      if (!placed) setStatus('책상을 천천히 비춰 주세요');
    }
  } else if (!renderer.xr.isPresenting) {
    controls.update();
  }

  renderer.render(scene, camera);
});

// ---------------------------------------------------------------
// 안내 메시지
// ---------------------------------------------------------------
let toastTimer = null;
function toast(msg, ms = 3500) {
  toastEl.innerText = msg;
  toastEl.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.add('hidden'), ms);
}
toastEl.addEventListener('click', () => toastEl.classList.add('hidden'));

// ---------------------------------------------------------------
// 뼈대(스킨)가 있는 모델 복제 — three.js SkeletonUtils.clone 과 같은 동작
// ---------------------------------------------------------------
function cloneSkinned(source) {
  const sourceLookup = new Map();
  const cloneLookup = new Map();
  const clone = source.clone();
  parallelTraverse(source, clone, (s, c) => { sourceLookup.set(c, s); cloneLookup.set(s, c); });
  clone.traverse((node) => {
    if (!node.isSkinnedMesh) return;
    const src = sourceLookup.get(node);
    node.skeleton = src.skeleton.clone();
    node.bindMatrix.copy(src.bindMatrix);
    node.skeleton.bones = src.skeleton.bones.map((b) => cloneLookup.get(b));
    node.bind(node.skeleton, node.bindMatrix);
  });
  return clone;
}
function parallelTraverse(a, b, cb) {
  cb(a, b);
  for (let i = 0; i < a.children.length; i++) parallelTraverse(a.children[i], b.children[i], cb);
}

// 시작
selectModel(0);
