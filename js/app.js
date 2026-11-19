import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MindARThree } from '../vendor/mind-ar/mindar-image-three.prod.js';
import { MODELS } from './models.js';

// ---------------------------------------------------------------
// 설정
// ---------------------------------------------------------------
const MODEL_DIR = 'assets/models/';
const TARGET_FILE = 'assets/targets/marker.mind';

// ---------------------------------------------------------------
// 화면 요소
// ---------------------------------------------------------------
const $ = (id) => document.getElementById(id);
const homeEl = $('home');
const arEl = $('ar');
const containerEl = $('ar-container');
const gridEl = $('model-grid');
const chipsEl = $('model-chips');
const startBtn = $('start-btn');
const backBtn = $('back-btn');
const playBtn = $('play-btn');
const clipSelect = $('clip-select');
const statusEl = $('status');
const hintEl = $('scan-hint');
const toastEl = $('toast');

// ---------------------------------------------------------------
// 상태
// ---------------------------------------------------------------
let selectedIndex = 0;
let mindar = null;          // MindARThree 인스턴스
let anchor = null;          // 마커에 붙는 3D 그룹
let current = null;         // { root, mixer, clips, action, playing }
let loadToken = 0;          // 모델을 빠르게 바꿀 때 이전 로딩 결과를 무시하기 위함
const clock = new THREE.Clock();
const loader = new GLTFLoader();
const gltfCache = new Map();

// ---------------------------------------------------------------
// 시작 화면: 모델 카드와 AR 화면의 모델 칩 만들기
// ---------------------------------------------------------------
MODELS.forEach((m, i) => {
  const card = document.createElement('button');
  card.className = 'model-card';
  card.setAttribute('role', 'option');
  card.innerHTML = `<span class="emoji">${m.emoji || '📦'}</span><span class="name">${m.name}</span>`;
  card.addEventListener('click', () => selectModel(i));
  gridEl.appendChild(card);

  const chip = document.createElement('button');
  chip.className = 'chip';
  chip.textContent = `${m.emoji || '📦'} ${m.name}`;
  chip.addEventListener('click', () => { selectModel(i); showModel(i); });
  chipsEl.appendChild(chip);
});

function selectModel(i) {
  selectedIndex = i;
  [...gridEl.children].forEach((el, j) => el.setAttribute('aria-selected', String(j === i)));
  [...chipsEl.children].forEach((el, j) => el.setAttribute('aria-pressed', String(j === i)));
}
selectModel(0);

// ---------------------------------------------------------------
// 안내 메시지
// ---------------------------------------------------------------
let toastTimer = null;
function toast(msg, ms = 3500) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  clearTimeout(toastTimer);
  if (ms) toastTimer = setTimeout(() => toastEl.classList.add('hidden'), ms);
}

// ---------------------------------------------------------------
// AR 시작 / 종료
// ---------------------------------------------------------------
startBtn.addEventListener('click', startAR);
backBtn.addEventListener('click', stopAR);

async function startAR() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    toast('이 브라우저에서는 카메라를 쓸 수 없어요. https 주소로 접속했는지, Chrome(안드로이드) 또는 Safari(아이폰)인지 확인해 주세요.', 0);
    return;
  }

  homeEl.classList.add('hidden');
  arEl.classList.remove('hidden');
  setStatus('카메라 준비 중…');
  hintEl.classList.remove('hidden');
  containerEl.innerHTML = '';

  mindar = new MindARThree({
    container: containerEl,
    imageTargetSrc: TARGET_FILE,
    maxTrack: 1,
    uiLoading: 'no',
    uiScanning: 'no',
    uiError: 'no',
    // 떨림을 줄이는 값 (작을수록 부드럽지만 반응이 느려짐)
    filterMinCF: 0.0001,
    filterBeta: 0.001,
  });

  const { renderer, scene, camera } = mindar;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // 조명
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444466, 2.2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.0);
  sun.position.set(0.5, 1, 1.5);
  scene.add(sun);

  anchor = mindar.addAnchor(0);
  anchor.onTargetFound = () => {
    hintEl.classList.add('hidden');
    setStatus('마커 인식됨', true);
  };
  anchor.onTargetLost = () => {
    hintEl.classList.remove('hidden');
    setStatus('마커를 찾는 중…');
  };

  // 모델은 카메라와 동시에 불러오기 시작
  const modelPromise = showModel(selectedIndex);

  try {
    await mindar.start();
  } catch (err) {
    console.error(err);
    toast('카메라를 켜지 못했어요. 브라우저의 카메라 권한을 허용했는지 확인해 주세요.', 0);
    stopAR(false);
    return;
  }
  setStatus('마커를 찾는 중…');
  await modelPromise;

  clock.getDelta();
  renderer.setAnimationLoop(() => {
    const dt = clock.getDelta();
    if (current && current.mixer) current.mixer.update(dt);
    renderer.render(scene, camera);
  });
}

function stopAR(hideToast = true) {
  if (mindar) {
    try {
      mindar.renderer.setAnimationLoop(null);
      mindar.stop();
    } catch (e) { console.warn(e); }
    try { mindar.renderer.dispose(); } catch (e) { /* noop */ }
  }
  mindar = null;
  anchor = null;
  current = null;
  containerEl.innerHTML = '';
  arEl.classList.add('hidden');
  homeEl.classList.remove('hidden');
  if (hideToast) toastEl.classList.add('hidden');
  updateAnimUI();
}

function setStatus(text, found = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle('found', found);
}

// ---------------------------------------------------------------
// 모델 불러오기 / 배치
// ---------------------------------------------------------------
function loadGLTF(file) {
  if (!gltfCache.has(file)) {
    gltfCache.set(file, loader.loadAsync(MODEL_DIR + file).catch((e) => {
      gltfCache.delete(file);
      throw e;
    }));
  }
  return gltfCache.get(file);
}

async function showModel(i) {
  if (!anchor) return;
  const token = ++loadToken;
  const cfg = MODELS[i];

  // 이전 모델 치우기
  if (current) {
    anchor.group.remove(current.wrapper);
    if (current.mixer) current.mixer.stopAllAction();
    current = null;
  }
  playBtn.disabled = true;
  playBtn.textContent = '불러오는 중…';
  clipSelect.classList.add('hidden');

  let gltf;
  try {
    gltf = await loadGLTF(cfg.file);
  } catch (e) {
    console.error(e);
    if (token === loadToken) {
      toast(`모델 파일을 불러오지 못했어요: ${cfg.file}`);
      updateAnimUI();
    }
    return;
  }
  if (token !== loadToken || !anchor) return; // 그 사이에 다른 모델을 골랐음

  // 같은 GLB를 여러 번 써도 되도록 매번 복제 (애니메이션 뼈대까지 복제)
  const root = cloneSkinned(gltf.scene);
  // 뼈대 애니메이션 모델이 화면 가장자리에서 사라지는 문제 방지
  root.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });

  // 크기 맞추기: 가장 긴 변이 cfg.size(마커 한 변 = 1) 가 되도록
  root.updateMatrixWorld(true); // 뼈대 위치를 먼저 계산해야 크기가 정확함
  const box = new THREE.Box3().setFromObject(root, true);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = (cfg.size ?? 0.8) / maxDim;
  root.scale.setScalar(scale);
  // 바닥 중앙이 원점에 오도록
  const center = box.getCenter(new THREE.Vector3());
  root.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

  // wrapper: 모델의 "위쪽(Y)"이 마커 면에서 튀어나오는 방향(Z)이 되도록 세우기
  // (마커를 책상에 눕혀 놓았을 때 모델이 마커 위에 서 있게 됨)
  const wrapper = new THREE.Group();
  wrapper.rotation.x = Math.PI / 2;
  const turn = new THREE.Group();
  turn.rotation.y = THREE.MathUtils.degToRad(cfg.rotationY || 0);
  turn.add(root);
  wrapper.add(turn);
  anchor.group.add(wrapper);

  const clips = gltf.animations || [];
  const mixer = clips.length ? new THREE.AnimationMixer(root) : null;
  current = { wrapper, root, mixer, clips, action: null, playing: false };

  // 애니메이션 목록 채우기
  clipSelect.innerHTML = '';
  clips.forEach((c, k) => {
    const opt = document.createElement('option');
    opt.value = String(k);
    opt.textContent = c.name || `애니메이션 ${k + 1}`;
    clipSelect.appendChild(opt);
  });
  const defaultClip = pickDefaultClip(clips);
  clipSelect.value = String(defaultClip);

  if (cfg.autoPlay && clips.length) playClip(defaultClip);
  updateAnimUI();
}

// 이름에 Idle/Walk/Dance 등이 있으면 그것을 기본으로, 없으면 첫 번째
function pickDefaultClip(clips) {
  const prefer = ['dance', 'walk', 'idle', 'run'];
  for (const p of prefer) {
    const k = clips.findIndex((c) => (c.name || '').toLowerCase().includes(p));
    if (k >= 0) return k;
  }
  return 0;
}

// ---------------------------------------------------------------
// 애니메이션 재생 / 정지
// ---------------------------------------------------------------
playBtn.addEventListener('click', () => {
  if (!current || !current.mixer) return;
  if (current.playing) {
    current.action.paused = true;
    current.playing = false;
  } else {
    const k = Number(clipSelect.value) || 0;
    if (current.action && current.action === current.mixer.clipAction(current.clips[k])) {
      current.action.paused = false;
      current.playing = true;
    } else {
      playClip(k);
    }
  }
  updateAnimUI();
});

clipSelect.addEventListener('change', () => {
  if (!current || !current.mixer) return;
  playClip(Number(clipSelect.value));
  updateAnimUI();
});

function playClip(k) {
  const next = current.mixer.clipAction(current.clips[k]);
  if (current.action && current.action !== next) {
    next.reset().play();
    current.action.crossFadeTo(next, 0.3, false);
  } else {
    next.reset().play();
  }
  next.paused = false;
  current.action = next;
  current.playing = true;
}

function updateAnimUI() {
  const has = !!(current && current.mixer && current.clips.length);
  playBtn.disabled = !has;
  if (!current) {
    playBtn.textContent = '▶ 애니메이션 재생';
  } else if (!has) {
    playBtn.textContent = '애니메이션 없음';
  } else {
    playBtn.textContent = current.playing ? '⏸ 일시정지' : '▶ 애니메이션 재생';
  }
  clipSelect.classList.toggle('hidden', !(has && current.clips.length > 1));
}

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
    const bones = src.skeleton.bones;
    node.skeleton = src.skeleton.clone();
    node.bindMatrix.copy(src.bindMatrix);
    node.skeleton.bones = bones.map((b) => cloneLookup.get(b));
    node.bind(node.skeleton, node.bindMatrix);
  });
  return clone;
}
function parallelTraverse(a, b, cb) {
  cb(a, b);
  for (let i = 0; i < a.children.length; i++) parallelTraverse(a.children[i], b.children[i], cb);
}
