// ======================
// 전역 변수
// ======================
let mapImg; // 현재 표시 중인 이미지
let cHallImg; // C홀 이미지
let dHallImg; // D홀 이미지
let currentHall = "C"; // 현재 선택된 홀

// 카메라 관련 변수
let zoom = 1;
let minZoom = 1; // 이미지 세로가 화면 세로에 맞는 상태
let maxZoom = 3;
let offsetX = 0;
let offsetY = 0;

// 마우스 드래그용
let dragging = false;
let prevX, prevY;

// 터치용
let isPinching = false;
let lastTouchDist = -1;
let lastTouchX = 0;
let lastTouchY = 0;

// UI 버튼 설정
const btnW = 80;
const btnH = 32;
const btnMargin = 10;

// ======================
// 이미지 로드
// ======================
function preload() {
  cHallImg = loadImage("asset/C홀 맵.jpg");
  dHallImg = loadImage("asset/D홀 맵.jpg");
}

// ======================
// 초기 설정
// ======================
function setup() {
  createCanvas(windowWidth, windowHeight);

  // 기본은 C홀부터
  mapImg = cHallImg;
  currentHall = "C";

  setInitialView();
}

// 화면에 첫 진입 / 이미지 변경 / 리사이즈 시 호출
function setInitialView() {
  if (!mapImg) return;

  // 이미지 세로를 화면 세로에 맞게 → 이 상태를 최소 줌으로 사용
  minZoom = height / mapImg.height;
  zoom = minZoom;

  // 그 상태에서 중앙 정렬
  let imgW = mapImg.width * zoom;
  let imgH = mapImg.height * zoom;

  offsetX = (width - imgW) / 2;
  offsetY = (height - imgH) / 2;

  clampOffset();
}

// offsetX, offsetY가 이미지 외곽을 넘지 않도록 제한
function clampOffset() {
  if (!mapImg) return;

  let imgW = mapImg.width * zoom;
  let imgH = mapImg.height * zoom;

  // 가로 방향
  if (imgW <= width) {
    // 이미지가 화면보다 작으면 가운데 고정
    offsetX = (width - imgW) / 2;
  } else {
    // 이미지가 화면보다 크면 좌우 끝 이상으로 못 나가게
    offsetX = constrain(offsetX, width - imgW, 0);
  }

  // 세로 방향
  if (imgH <= height) {
    offsetY = (height - imgH) / 2;
  } else {
    offsetY = constrain(offsetY, height - imgH, 0);
  }
}

// ======================
// 매 프레임 렌더링
// ======================
function draw() {
  background(220);

  // 1) 지도(이미지) 그리기: 카메라 변환 적용
  if (mapImg) {
    translate(offsetX, offsetY);
    scale(zoom);
    image(mapImg, 0, 0);
  }

  // 2) UI는 화면 고정 좌표계에서 그려야 하므로 변환 리셋
  resetMatrix();
  drawHallButtons();
}

// ======================
// 오른쪽 상단 A/B/C/D 홀 버튼 그리기
// ======================
function drawHallButtons() {
  let labels = ["A홀", "B홀", "C홀", "D홀"];

  textAlign(CENTER, CENTER);
  textSize(14);
  noStroke();

  for (let i = 0; i < labels.length; i++) {
    let x = width - btnMargin - btnW;
    let y = btnMargin + i * (btnH + 6);

    // 현재 선택된 홀은 진하게 표시
    let hallName = labels[i][0]; // "A", "B", "C", "D"
    if (hallName === currentHall) {
      fill(50);
      rect(x, y, btnW, btnH, 6);
      fill(255);
    } else {
      fill(255);
      rect(x, y, btnW, btnH, 6);
      fill(0);
    }

    text(labels[i], x + btnW / 2, y + btnH / 2);
  }
}

// ======================
// 버튼 히트 테스트
// (화면 좌표 x,y가 어느 홀 버튼 위인지)
// ======================
function getHallAtPosition(px, py) {
  let labels = ["A홀", "B홀", "C홀", "D홀"];

  for (let i = 0; i < labels.length; i++) {
    let x = width - btnMargin - btnW;
    let y = btnMargin + i * (btnH + 6);

    if (px >= x && px <= x + btnW && py >= y && py <= y + btnH) {
      return labels[i][0]; // "A", "B", "C", "D" 중 하나 반환
    }
  }
  return null;
}

// 홀 변경 함수
function changeHall(hallChar) {
  // A/B홀 이미지는 아직 없으니, 일단 C/D만 처리
  if (hallChar === "C") {
    mapImg = cHallImg;
    currentHall = "C";
    setInitialView();
  } else if (hallChar === "D") {
    mapImg = dHallImg;
    currentHall = "D";
    setInitialView();
  } else {
    // A/B 클릭 시 지금은 동작 없음 (필요하면 나중에 이미지 추가)
    currentHall = hallChar; // UI 강조만 바꾸고 싶다면 유지
  }
}

// ======================
// PC: 마우스 휠 줌
// ======================
function mouseWheel(event) {
  if (!mapImg) return false;

  let newZoom = zoom - event.delta * 0.001;
  newZoom = constrain(newZoom, minZoom, maxZoom);

  // 마우스를 기준으로 줌
  let wx = (mouseX - offsetX) / zoom;
  let wy = (mouseY - offsetY) / zoom;

  offsetX -= wx * (newZoom - zoom);
  offsetY -= wy * (newZoom - zoom);

  zoom = newZoom;
  clampOffset();

  return false; // 브라우저 기본 스크롤 방지
}

// ======================
// PC: 마우스 클릭 / 드래그
// ======================
function mousePressed() {
  // 1) 먼저 버튼 클릭인지 확인 (UI는 화면 좌표로 체크)
  let hall = getHallAtPosition(mouseX, mouseY);
  if (hall) {
    changeHall(hall);
    return; // 버튼 클릭이면 드래그 시작 안 함
  }

  // 2) 그 외 → 지도 드래그 시작
  if (touches.length > 0) return; // 터치 중이면 무시

  dragging = true;
  prevX = mouseX;
  prevY = mouseY;
}

function mouseDragged() {
  if (dragging) {
    offsetX += mouseX - prevX;
    offsetY += mouseY - prevY;
    prevX = mouseX;
    prevY = mouseY;
    clampOffset();
  }
}

function mouseReleased() {
  dragging = false;
}

// ======================
// 모바일: 터치(핀치 + 드래그)
// ======================
function touchStarted() {
  // 한 손가락 터치일 경우: 먼저 버튼 터치인지 확인
  if (touches.length === 1) {
    let tx = touches[0].x;
    let ty = touches[0].y;

    let hall = getHallAtPosition(tx, ty);
    if (hall) {
      changeHall(hall);
      return false; // 버튼 터치면 여기서 종료
    }

    // 버튼이 아니라면 지도 드래그 준비
    isPinching = false;
    lastTouchX = tx;
    lastTouchY = ty;
  } else if (touches.length === 2) {
    // 두 손가락 → 핀치 시작
    isPinching = true;
    lastTouchDist = dist(
      touches[0].x,
      touches[0].y,
      touches[1].x,
      touches[1].y
    );
  }
}

function touchMoved() {
  if (!mapImg) return false;

  if (touches.length === 2) {
    // 핀치 줌
    let d = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);

    if (lastTouchDist > 0) {
      let scaleFactor = d / lastTouchDist;
      let newZoom = zoom * scaleFactor;
      newZoom = constrain(newZoom, minZoom, maxZoom);

      let cx = (touches[0].x + touches[1].x) * 0.5;
      let cy = (touches[0].y + touches[1].y) * 0.5;

      let wx = (cx - offsetX) / zoom;
      let wy = (cy - offsetY) / zoom;

      offsetX -= wx * (newZoom - zoom);
      offsetY -= wy * (newZoom - zoom);

      zoom = newZoom;
      clampOffset();
    }
    lastTouchDist = d;
  } else if (touches.length === 1 && !isPinching) {
    // 한 손가락 드래그
    let tx = touches[0].x;
    let ty = touches[0].y;

    offsetX += tx - lastTouchX;
    offsetY += ty - lastTouchY;

    lastTouchX = tx;
    lastTouchY = ty;

    clampOffset();
  }

  return false; // 브라우저 기본 스크롤/줌 방지
}

function touchEnded() {
  if (touches.length < 2) {
    isPinching = false;
    lastTouchDist = -1;
  }
  if (touches.length === 1) {
    lastTouchX = touches[0].x;
    lastTouchY = touches[0].y;
  }
}

// ======================
// 화면 크기 변경
// ======================
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setInitialView();
}
