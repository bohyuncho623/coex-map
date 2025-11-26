// ======================
// 전역 변수
// ======================
let mapImg; // 현재 표시 중인 이미지
let cHallImg; // C홀 이미지
let dHallImg; // D홀 이미지
let currentHall = "C"; // 화면에 띄운 홀

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
// 1) 구역 좌표 정의 (이미지 원본 픽셀 기준)
//    필요에 따라 계속 추가해 사용
// ======================
const zonesC = {
  1: { x: 751, y: 432 },
  // "2": { x: ..., y: ... },
  // "3": ...
};

const zonesD = {
  1: { x: 300, y: 400 },
  // 필요시 추가
};

// ======================
// 2) 사용자 정보 (이름 + 색) + 내 위치
// ======================
let userName = null; // localStorage에서 읽거나 prompt로 입력
let userColorName = null; // "빨", "주", "노", "초", "파", "남", "보"

let myHall = null; // QR로부터 받은 "C", "D"
let myZone = null; // QR로부터 받은 "1", "2" ...

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

  // 1) URL에서 hall, zone 읽기 (예: ?hall=C&zone=1)
  readLocationFromURL();

  // 2) 이름/색 정보 초기화 (처음 접속이면 입력창)
  initUserInfo();

  // 3) 처음 보여줄 홀 결정
  if (myHall === "D") {
    mapImg = dHallImg;
    currentHall = "D";
  } else {
    // URL에 hall이 없거나 C일 때 기본 C홀
    mapImg = cHallImg;
    currentHall = "C";
    if (!myHall) myHall = "C";
  }

  setInitialView();
}

// URL 파라미터에서 hall, zone 읽기
function readLocationFromURL() {
  const params = new URLSearchParams(window.location.search);
  myHall = params.get("hall"); // "C" 또는 "D" 또는 null
  myZone = params.get("zone"); // "1", "2"... 또는 null
}

// 이름 + 색 정보를 localStorage에서 불러오거나, 처음이면 입력
function initUserInfo() {
  userName = localStorage.getItem("userName");
  userColorName = localStorage.getItem("userColorName");

  if (!userName) {
    userName = prompt("이름(또는 닉네임)을 입력하세요:");
    if (!userName) userName = "익명";
    localStorage.setItem("userName", userName);
  }

  if (!userColorName) {
    userColorName = prompt("색을 선택하세요 (빨/주/노/초/파/남/보 중 하나)");
    if (!userColorName) userColorName = "빨";
    localStorage.setItem("userColorName", userColorName);
  }
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

  // 1) 지도 + 내 마커 (지도 좌표계)
  if (mapImg) {
    translate(offsetX, offsetY);
    scale(zoom);

    image(mapImg, 0, 0);

    // 내 위치 마커
    drawMyMarker();
  }

  // 2) UI (홀 버튼 등)는 화면 좌표계로
  resetMatrix();
  drawHallButtons();
}

// ======================
// 내 위치 마커 그리기
// ======================
function drawMyMarker() {
  // zone 정보가 없으면 표시 X
  if (!myZone) return;
  // 현재 보고 있는 홀과 내가 있는 홀이 다르면 표시 X
  if (currentHall !== myHall) return;

  // 홀에 맞는 좌표 테이블 선택
  let table = null;
  if (myHall === "C") table = zonesC;
  else if (myHall === "D") table = zonesD;
  if (!table) return;

  const pos = table[myZone]; // 예: zonesC["1"] = {x:..., y:...}
  if (!pos) return;

  // "빨/주/노/초/파/남/보" → RGB
  const rgb = koreanColorToRGB(userColorName);

  stroke(0);
  strokeWeight(2);
  fill(rgb[0], rgb[1], rgb[2]);

  const r = 24;
  ellipse(pos.x, pos.y, r, r);

  // 이름 라벨
  noStroke();
  fill(255);
  textSize(12);
  textAlign(LEFT, CENTER);
  text(userName, pos.x + r * 0.8, pos.y);
}

// 한글 색 이름 → RGB 변환
function koreanColorToRGB(c) {
  switch (c) {
    case "빨":
      return [255, 0, 0];
    case "주":
      return [255, 140, 0];
    case "노":
      return [255, 215, 0];
    case "초":
      return [0, 200, 0];
    case "파":
      return [80, 140, 255];
    case "남":
      return [0, 0, 180];
    case "보":
      return [150, 0, 200];
    default:
      return [255, 0, 0];
  }
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

// 버튼 클릭 판정
function getHallAtPosition(px, py) {
  let labels = ["A홀", "B홀", "C홀", "D홀"];

  for (let i = 0; i < labels.length; i++) {
    let x = width - btnMargin - btnW;
    let y = btnMargin + i * (btnH + 6);

    if (px >= x && px <= x + btnW && py >= y && py <= y + btnH) {
      return labels[i][0]; // "A","B","C","D"
    }
  }
  return null;
}

// 홀 변경 함수 (A/B는 아직 지도 없음)
function changeHall(hallChar) {
  if (hallChar === "C") {
    mapImg = cHallImg;
    currentHall = "C";
    setInitialView();
  } else if (hallChar === "D") {
    mapImg = dHallImg;
    currentHall = "D";
    setInitialView();
  } else {
    // A/B 클릭 시: 아직 지도 없으니 화면만 전환
    mapImg = null;
    currentHall = hallChar;
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
  // 1) 버튼 클릭인지 확인
  let hall = getHallAtPosition(mouseX, mouseY);
  if (hall) {
    changeHall(hall);
    return;
  }

  // 2) 지도 드래그 시작
  if (touches.length > 0) return; // 터치 중이면 무시

  dragging = true;
  prevX = mouseX;
  prevY = mouseY;
}

function mouseDragged() {
  if (dragging && mapImg) {
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
  if (touches.length === 1) {
    let tx = touches[0].x;
    let ty = touches[0].y;

    // 버튼 터치인지 먼저 확인
    let hall = getHallAtPosition(tx, ty);
    if (hall) {
      changeHall(hall);
      return false;
    }

    // 버튼 아니면 드래그 시작
    isPinching = false;
    lastTouchX = tx;
    lastTouchY = ty;
  } else if (touches.length === 2) {
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
  } else if (touches.length === 1 && !isPinching && mapImg) {
    // 드래그
    let tx = touches[0].x;
    let ty = touches[0].y;

    offsetX += tx - lastTouchX;
    offsetY += ty - lastTouchY;

    lastTouchX = tx;
    lastTouchY = ty;

    clampOffset();
  }

  return false;
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
