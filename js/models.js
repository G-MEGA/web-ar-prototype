// ================================================================
//  모델 목록 — 모델을 추가하거나 바꾸려면 이 파일만 고치면 됩니다.
// ================================================================
//  file      : assets/models/ 폴더 안의 GLB 파일 이름
//  name      : 선택 화면에 보일 이름
//  emoji     : 선택 화면에 보일 아이콘 (아무 이모지나 가능)
//  size      : 마커 위에서의 크기. 1 = 마커 한 변 길이. (기본 0.8)
//  rotationY : 모델이 바라보는 방향(도 단위). 기본 0
//  autoPlay  : AR 화면에 나타나자마자 애니메이션을 재생할지 여부
// ================================================================

export const MODELS = [
  {
    file: 'RobotExpressive.glb',
    name: '로봇',
    emoji: '🤖',
    size: 0.8,
    rotationY: 0,
    autoPlay: false,
  },
  {
    file: 'Horse.glb',
    name: '말',
    emoji: '🐴',
    size: 0.9,
    rotationY: 0,
    autoPlay: false,
  },
  {
    file: 'Flamingo.glb',
    name: '홍학',
    emoji: '🦩',
    size: 0.9,
    rotationY: 0,
    autoPlay: false,
  },
  {
    file: 'Parrot.glb',
    name: '앵무새',
    emoji: '🦜',
    size: 0.8,
    rotationY: 0,
    autoPlay: false,
  },
];
