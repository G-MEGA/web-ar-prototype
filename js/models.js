// ================================================================
//  모델 목록 — 모델을 추가하거나 바꾸려면 이 파일만 고치면 됩니다.
// ================================================================
//  glb       : assets/models/ 안의 GLB 파일 (안드로이드 AR, 미리보기용)
//  usdz      : assets/models/ 안의 USDZ 파일 (아이폰 AR 뷰어용)
//              tools/glb_to_usdz.py 로 GLB에서 만들 수 있습니다. (README 참고)
//  name      : 화면에 보일 이름
//  emoji     : 화면에 보일 아이콘 (아무 이모지나 가능)
//  height    : 실제 AR 공간에서의 키(미터). 0.2 = 20cm
//              (USDZ는 변환할 때 정한 높이를 따릅니다)
//  rotationY : 모델이 바라보는 방향(도 단위). 뒤돌아 있으면 180
//  clip      : 처음에 선택돼 있을 애니메이션 이름 (없으면 첫 번째)
//  autoPlay  : 화면에 나타나자마자 애니메이션을 재생할지 여부
// ================================================================

export const MODELS = [
  {
    glb: 'RobotExpressive.glb',
    usdz: 'RobotExpressive.usdz',
    name: '로봇',
    emoji: '🤖',
    height: 0.2,
    rotationY: 0,
    clip: 'Dance',
    autoPlay: false,
  },
  {
    glb: 'Michelle.glb',
    usdz: 'Michelle.usdz',
    name: '미셸',
    emoji: '💃',
    height: 0.25,
    rotationY: 0,
    clip: 'SambaDance',
    autoPlay: false,
  },
  {
    glb: 'Xbot.glb',
    usdz: 'Xbot.usdz',
    name: 'X봇',
    emoji: '🦾',
    height: 0.25,
    rotationY: 0,
    clip: 'agree',
    autoPlay: false,
  },
];
