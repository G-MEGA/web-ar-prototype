# Web AR 프로토타입 (마커형)

휴대폰 브라우저에서 링크만 열면 카메라 화면 위에 3D 모델이 나타나는 **마커형 웹 AR** 프로토타입입니다.
앱 설치나 스토어 배포 없이 **안드로이드(Chrome)** 와 **아이폰(Safari)** 에서 모두 동작합니다.

- AR 엔진: [MindAR](https://github.com/hiukim/mind-ar-js) 1.2.5 (이미지 마커 인식)
- 3D 표시: [three.js](https://threejs.org) r160
- 두 라이브러리는 `vendor/` 폴더에 들어 있어서 인터넷 CDN 없이도 동작합니다.

---

## 1. 사용 방법

1. **마커 인쇄**: `assets/targets/marker-A4.pdf` 를 A4 용지에 **실제 크기(100%)** 로 인쇄합니다.
   (인쇄가 어려우면 다른 화면(모니터, 태블릿)에 `assets/targets/marker.png` 를 띄워도 됩니다.)
2. 마커를 책상 위에 평평하게 놓습니다.
3. 휴대폰으로 GitHub Pages 링크(`https://<GitHub아이디>.github.io/web-ar-prototype/`)를 엽니다.
4. 모델을 고르고 **AR 시작** → 카메라 권한 **허용**.
5. 마커를 화면에 비추면 모델이 마커 위에 나타납니다.
6. 아래쪽 버튼으로
   - **▶ 애니메이션 재생 / ⏸ 일시정지**
   - 애니메이션이 여러 개인 모델(로봇)은 옆의 목록에서 동작을 고를 수 있습니다.
   - 맨 아래 칩으로 AR 화면에서 바로 다른 모델로 바꿀 수 있습니다.

### 잘 인식되게 하는 팁
- 밝은 곳에서, 마커 전체가 화면에 들어오게 비춥니다. (20~50cm 거리)
- 종이가 구겨지거나 빛이 반사되면 인식이 약해집니다.
- 처음 인식할 때는 마커를 정면에 가깝게 비추고, 인식된 뒤에 기울이면 잘 따라옵니다.

### 접속이 안 될 때
- 주소가 반드시 **https://** 로 시작해야 카메라가 켜집니다. (GitHub Pages는 자동으로 https)
- 카카오톡·인스타그램 같은 앱 안의 브라우저에서는 카메라가 막힐 수 있습니다.
  → **Chrome(안드로이드) / Safari(아이폰)** 로 열어 주세요.
- 카메라 권한을 실수로 거부했다면 브라우저 설정에서 이 사이트의 카메라 권한을 허용으로 바꿔 주세요.

---

## 2. 모델 바꾸기 / 추가하기 (블렌더 모델 넣기)

1. 블렌더에서 **File → Export → glTF 2.0** 을 고르고, 형식(Format)은 **glTF Binary (.glb)** 로 저장합니다.
   - 애니메이션을 넣으려면 Export 창의 **Animation** 항목이 체크되어 있어야 합니다.
   - 모델 크기는 신경 쓰지 않아도 됩니다. 앱이 자동으로 마커 크기에 맞춥니다.
   - 파일이 너무 크면(수십 MB) 휴대폰에서 로딩이 느려집니다. 가급적 10MB 이하를 권장합니다.
2. 만든 `.glb` 파일을 `assets/models/` 폴더에 넣습니다.
3. `js/models.js` 파일을 열어 목록에 한 줄 블록을 추가합니다.

```js
{
  file: 'MyModel.glb',   // assets/models/ 안의 파일 이름
  name: '내 모델',        // 화면에 보일 이름
  emoji: '⭐',            // 선택 화면 아이콘
  size: 0.8,             // 마커 한 변 = 1 기준 크기
  rotationY: 0,          // 바라보는 방향(도). 뒤돌아 있으면 180
  autoPlay: false,       // 나타나자마자 애니메이션 재생할지
},
```

4. 샘플 모델이 필요 없으면 해당 블록을 지우고, `assets/models/` 의 파일도 지우면 됩니다.
5. GitHub에 올리면(커밋) 1~2분 뒤 같은 링크에 반영됩니다.

> 모델은 블렌더 기준으로 **바닥에 서 있는 방향(Z-up, glTF로 내보내면 Y-up으로 자동 변환)** 그대로 만들면,
> 마커를 책상에 눕혔을 때 마커 위에 서 있는 모습으로 나옵니다.

---

## 3. 마커(이미지) 바꾸기

마커는 그림 파일(`marker.png`)과, 그 그림을 MindAR가 인식할 수 있게 변환한 파일(`marker.mind`) 한 쌍입니다.

1. MindAR 공식 변환 도구에 접속: https://hiukim.github.io/mind-ar-js-doc/tools/compile
2. 새 마커 그림을 올리고 **Start** → 끝나면 **Download compiled** 로 `targets.mind` 를 받습니다.
3. 받은 파일 이름을 `marker.mind` 로 바꿔서 `assets/targets/` 에 덮어씁니다. (인쇄용 그림도 함께 교체)

좋은 마커 그림의 조건: 무늬가 복잡하고, 대비가 강하고, 좌우·상하가 대칭이 아닌 그림.
단색 로고나 반복 패턴은 인식이 잘 안 됩니다.

---

## 4. 내 컴퓨터에서 실행해 보기 (선택)

카메라는 https 또는 `localhost` 에서만 켜지므로 파일을 더블클릭해서 열면 동작하지 않습니다.
간단한 로컬 서버로 열어 주세요.

```bash
# 이 폴더에서
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 접속 (PC 웹캠으로 테스트 가능)
```

휴대폰 테스트는 GitHub Pages 링크를 쓰는 것이 가장 쉽습니다.

---

## 5. 폴더 구조

```
index.html               화면 구성 (선택 화면 + AR 화면)
css/style.css            디자인
js/app.js                AR 동작 (카메라, 마커 인식, 모델 표시, 애니메이션)
js/models.js             ★ 모델 목록 (모델 교체 시 여기만 수정)
assets/models/           GLB 모델 파일
assets/targets/          마커 그림(png), 인쇄용(pdf), 인식용 파일(mind)
vendor/                  MindAR, three.js 라이브러리 (수정 불필요)
```

---

## 6. GitHub Pages 켜는 법 (처음 한 번만)

저장소 → **Settings** → 왼쪽 **Pages** → *Build and deployment* 의 Source를 **Deploy from a branch**,
Branch를 **main** / **/(root)** 로 고르고 **Save**. 1~2분 뒤 위쪽에 사이트 주소가 표시됩니다.

---

## 샘플 모델 출처와 라이선스

샘플 모델은 three.js 공식 예제 저장소(`examples/models/gltf/`)에서 가져왔으며, 테스트용입니다.

| 파일 | 출처 | 라이선스 |
|---|---|---|
| RobotExpressive.glb | Tomás Laulhé ([Quaternius](https://quaternius.com)), three.js 예제 | CC0 |
| Horse.glb, Flamingo.glb, Parrot.glb | [mirada.com](https://mirada.com) 의 "ROME" 프로젝트, three.js 예제 | three.js 저장소 배포본 (테스트 용도) |

라이브러리: MindAR (MIT, `vendor/mind-ar/LICENSE`), three.js (MIT, `vendor/three/LICENSE`).
