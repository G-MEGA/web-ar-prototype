# Web AR 프로토타입 (바닥형)

휴대폰 브라우저에서 링크만 열면 **책상 위에 3D 모델을 놓아 볼 수 있는** 웹 AR 프로토타입입니다.
앱 설치나 스토어 배포는 필요 없습니다.

| 기기 | 동작 방식 |
|---|---|
| **안드로이드 (Chrome)** | 브라우저 안에서 카메라가 켜지고, 책상을 인식한 뒤 화면을 눌러 모델을 놓습니다. AR 화면 위에서 모델 바꾸기, 애니메이션 재생/일시정지, 동작 고르기가 됩니다. (WebXR) |
| **아이폰 (Safari)** | 아이폰에 기본으로 들어 있는 **AR 뷰어(AR Quick Look)** 로 넘어갑니다. 모델은 책상에 자동으로 놓이고 애니메이션은 자동으로 반복 재생됩니다. 웹 버튼은 AR 뷰어 안에서는 보이지 않으므로, 모델과 동작은 AR을 열기 전에 웹 화면에서 고릅니다. |
| PC | AR 없이 3D 미리보기만 됩니다. (마우스로 돌려 보기 가능) |

- 3D 표시: [three.js](https://threejs.org) r160 (`vendor/` 폴더에 포함, CDN 불필요)
- 아이폰용 모델 파일(USDZ)은 블렌더로 만들었습니다. (`tools/glb_to_usdz.py`)

---

## 1. 사용 방법

1. 휴대폰으로 GitHub Pages 링크(`https://g-mega.github.io/web-ar-prototype/`)를 엽니다.
2. 아래쪽에서 모델을 고릅니다. 화면의 3D 미리보기에서 애니메이션도 미리 볼 수 있어요.
3. **AR로 보기**를 누릅니다.

### 안드로이드
1. 카메라 권한을 **허용**합니다.
2. 휴대폰을 책상 쪽으로 향하고 **천천히 좌우로 움직이면** 책상 면이 인식되고 흰 링이 나타납니다.
3. 화면을 누르면 링 위치에 모델이 놓입니다.
   놓은 뒤 책상의 다른 곳을 누르면 모델이 그쪽으로 돌아서 **걸어가고**(Walk), 도착하면 Idle로 돌아옵니다.
   모델을 다른 자리에 새로 놓고 싶으면 위쪽 **📍 다시 놓기**를 누른 뒤 원하는 곳을 누르세요.
4. 아래 버튼으로 애니메이션 재생/일시정지, 동작 선택, 모델 변경을 할 수 있습니다.
5. 왼쪽 위 ✕ 로 AR을 끝냅니다.

> 처음 한 번 "Google Play 서비스(AR)" 설치를 요청할 수 있습니다. 설치하면 됩니다.
> 지원 기기 목록: https://developers.google.com/ar/devices

### 아이폰
1. AR 뷰어가 열리면 휴대폰을 책상 쪽으로 향하고 천천히 움직입니다.
2. 모델이 책상 위에 자동으로 놓이고, 애니메이션이 반복 재생됩니다.
3. 두 손가락으로 크기/회전, 한 손가락으로 위치를 바꿀 수 있습니다.
4. 다른 모델을 보려면 AR 뷰어를 닫고(✕) 웹 화면에서 다시 고릅니다.

> 아이폰 AR 뷰어는 USDZ 파일 하나에 **애니메이션을 하나만** 재생합니다.
> 그래서 안드로이드 모델은 동작별로 `Android_Idle.usdz`, `Android_Walk.usdz`, `Android_Fire.usdz` 세 파일을 두었고,
> 웹 화면에서 동작(Idle/Walk/Fire)을 고른 뒤 **AR로 보기**를 누르면 그 동작이 반복 재생됩니다.

### 잘 인식되게 하는 팁
- 밝은 곳에서, 무늬나 물건이 조금 있는 책상이 잘 인식됩니다. 완전히 하얗거나 반짝이는 면은 인식이 약합니다.
- 30cm~1m 정도 떨어져서 천천히 움직여 주세요.

### 접속이 안 될 때
- 주소는 반드시 **https://** 로 시작해야 합니다. (GitHub Pages는 자동으로 https)
- 카카오톡·인스타그램 같은 앱 안의 브라우저에서는 AR이 막힐 수 있습니다.
  → **Chrome(안드로이드) / Safari(아이폰)** 로 열어 주세요.
- 카메라 권한을 거부했다면 브라우저 설정에서 이 사이트의 카메라 권한을 허용으로 바꿔 주세요.

---

## 2. 모델 바꾸기 / 추가하기 (블렌더 모델 넣기)

모델 하나당 파일이 두 개 필요합니다.

| 파일 | 쓰는 곳 |
|---|---|
| `이름.glb` | 안드로이드 AR, 3D 미리보기 |
| `이름.usdz` | 아이폰 AR 뷰어 |

### 2-1. GLB 만들기
블렌더에서 **File → Export → glTF 2.0**, 형식(Format)은 **glTF Binary (.glb)**.
- 애니메이션을 넣으려면 Export 창의 **Animation** 이 체크되어 있어야 합니다.
- 크기는 신경 쓰지 않아도 됩니다. 앱이 `models.js` 의 `height` 에 맞춰 자동으로 조절합니다.
- 휴대폰 로딩을 위해 가급적 10MB 이하를 권장합니다.

### 2-2. USDZ 만들기 (아이폰용)
아래 둘 중 편한 방법을 쓰세요.

**방법 A — 이 저장소의 변환 스크립트 (추천, 크기/바닥 위치를 자동으로 맞춤)**
```bash
blender -b -P tools/glb_to_usdz.py -- assets/models/이름.glb assets/models/이름.usdz 0.2 동작이름
```
- `0.2` = 실제 키 20cm. `동작이름`은 아이폰에서 반복 재생할 애니메이션 이름(생략하면 첫 번째).
- 윈도우에서는 `blender` 대신 블렌더 설치 경로(예: `"C:\Program Files\Blender Foundation\Blender 4.2\blender.exe"`)를 씁니다.

**방법 B — 블렌더에서 직접**
**File → Export → Universal Scene Description**, 파일 이름을 `.usdz` 로 끝나게 저장.
Animation 체크, 모델 크기는 미터 기준(20cm짜리면 0.2)으로 맞춰서 내보냅니다.

### 2-3. 목록에 등록
두 파일을 `assets/models/` 에 넣고 `js/models.js` 에 블록을 추가합니다.

```js
{
  glb: 'MyModel.glb',
  usdz: 'MyModel.usdz',
  name: '내 모델',       // 화면에 보일 이름
  emoji: '⭐',           // 화면 아이콘
  height: 0.2,          // 안드로이드/미리보기에서의 키(미터)
  rotationY: 0,         // 바라보는 방향(도). 뒤돌아 있으면 180
  clip: 'Idle',         // 처음 선택될 애니메이션 이름
  autoPlay: false,      // 나타나자마자 재생할지
  walkClip: 'Walk',     // (선택) 탭한 곳으로 걸어갈 때 동작. 없으면 걷기 동작 없이 미끄러지듯 이동
  idleClip: 'Idle',     // (선택) 도착 후 동작
  walkSpeed: 0.15,      // (선택) 걷는 속도(초당 미터). 발이 미끄러져 보이면 조절
},
```

동작이 여러 개라면 아이폰용 USDZ를 동작마다 하나씩 만들고 이렇게 적으면,
웹 화면에서 고른 동작의 USDZ가 열립니다.

```js
usdz: { Idle: 'MyModel_Idle.usdz', Walk: 'MyModel_Walk.usdz' },
```
GitHub에 올리면(커밋) 1~2분 뒤 같은 링크에 반영됩니다.

> 팁: 블렌더에서 **뼈(Bone)에 직접 붙인 메시**는 USDZ로 내보낼 때 움직임이 사라질 수 있습니다.
> 방법 A 스크립트는 이것을 자동으로 고쳐 줍니다.

---

## 3. 내 컴퓨터에서 실행해 보기 (선택)

파일을 더블클릭해서 열면 동작하지 않으므로 간단한 로컬 서버로 엽니다.

```bash
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000
```

PC에서는 3D 미리보기만 확인할 수 있습니다. AR은 GitHub Pages 링크로 휴대폰에서 확인하세요.

---

## 4. 폴더 구조

```
index.html               화면 구성 (미리보기 + AR 화면 UI)
css/style.css            디자인
js/app.js                동작 (3D 미리보기, 안드로이드 WebXR, 아이폰 AR 뷰어 연결, 애니메이션)
js/models.js             ★ 모델 목록 (모델 교체 시 여기만 수정)
assets/models/           GLB / USDZ 모델 파일
tools/glb_to_usdz.py     GLB → 아이폰용 USDZ 변환 스크립트 (블렌더로 실행)
vendor/three/            three.js 라이브러리 (수정 불필요)
```

---

## 5. GitHub Pages 켜는 법 (처음 한 번만)

저장소 → **Settings** → 왼쪽 **Pages** → *Build and deployment* 의 Source를 **Deploy from a branch**,
Branch를 **main** / **/(root)** 로 고르고 **Save**. 1~2분 뒤 사이트 주소가 표시됩니다.

---

## 모델 출처

`Android.glb` (+ 동작별 USDZ): 직접 제작한 블렌더 모델. 아이폰용 USDZ는 GLB에서 `tools/glb_to_usdz.py`로 키 25cm에 맞춰 변환했습니다.

라이브러리: three.js (MIT, `vendor/three/LICENSE`).
