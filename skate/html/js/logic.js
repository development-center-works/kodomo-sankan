/* global workspace, showMessage, success, fail, showTutorialModal */

// ===================== パラメータ ==========================
const DURATION_PER_TILE = 260;   // 1マスあたりの目標時間（ms）
const EDGE_EASE_PCT = 0.10; // 全体の前後をどれだけ減速させるか（0〜0.2くらい）
const WARP_WEIGHT = 0.35; // ワープ区間の距離重み（0.0=瞬間、1.0=通常1マス相当）

// ===================== ステージ定義 ========================
const { grid, blockLimit, tutorial } = window.STAGE_DATA;
const BLOCK_LIMIT = typeof blockLimit === 'number' ? blockLimit : Infinity;

// タイル
const WALL = '#';
const START = 'S';
const GOAL = 'G';
const TILE_FLIP = 'F';
const TILE_STOP = 'P';
const TILE_WARP = 'W';
const TILE_WARP2 = 'X';
const TILE_TREASURE = 'T';
const IS_ICE_STAGE = window.STAGE_DATA?.ice !== false;

// アイコン
const ICON_FLIP = '🔄';
const ICON_STOP = '⏸️';
const ICON_WARP = '🌀';
const ICON_TREASURE = '🎁';

// マップ・状態
let map = JSON.parse(JSON.stringify(grid));
let player = { x: 0, y: 0 };
let goal = { x: 0, y: 0 };
let executedSlides = 0;
let stopArmed = false;
let warps = [];
let warps2 = [];
let treasures = [];
let collected = 0;

// 使用チェック（非使用）
let used = { W: false, X: false, F: false, P: false, T: false };

// ===================== STOP スコープ =======================
async function withStop(fn) {
  const prev = stopArmed;
  stopArmed = true;
  await fn();
  stopArmed = prev;
}
window.withStop = withStop;

function armStop() { stopArmed = true; }
window.armStop = armStop;

// ===================== Canvas ==============================
const cvs = document.getElementById('gameCanvas');
const ctx = cvs.getContext('2d');

let COLS = map[0].length;
let ROWS = map.length;

function CELL() {
  return Math.min(cvs.clientWidth / COLS, cvs.clientHeight / ROWS);
}

// DPR 同期
function syncCanvasSize() {
  const dpr = window.devicePixelRatio || 1;
  const w = cvs.clientWidth | 0;
  const h = cvs.clientHeight | 0;
  if (cvs.width !== w * dpr || cvs.height !== h * dpr) {
    cvs.width = w * dpr;
    cvs.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

window.addEventListener('resize', drawStage);

// ===================== 初期化 ===============================
initPositions();
buildWarpList();
buildTreasureList();
drawStage();
showMessage(`ブロック数 ${BLOCK_LIMIT} 以内でクリアしよう！`);

if (tutorial) {
  const { title = 'ステージ説明', body = '' } = tutorial;
  showTutorialModal(title, body);
}

function initPositions() {
  ROWS = map.length;
  COLS = map[0].length;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (map[y][x] === START) player = { x, y };
      if (map[y][x] === GOAL) goal = { x, y };
    }
  }
}

// ===================== Warp/Treasure =======================
function buildWarpList() {
  warps = [];
  warps2 = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (map[y][x] === TILE_WARP) warps.push({ x, y });
      if (map[y][x] === TILE_WARP2) warps2.push({ x, y });
    }
  }
}

function getWarpDest(x, y) {
  const tile = map[y][x];
  if (tile === TILE_WARP && warps.length === 2) {
    if (x === warps[0].x && y === warps[0].y) return warps[1];
    if (x === warps[1].x && y === warps[1].y) return warps[0];
  }
  if (tile === TILE_WARP2 && warps2.length === 2) {
    if (x === warps2[0].x && y === warps2[0].y) return warps2[1];
    if (x === warps2[1].x && y === warps2[1].y) return warps2[0];
  }
  return null;
}

function buildTreasureList() {
  treasures = [];
  collected = 0;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (map[y][x] === TILE_TREASURE) treasures.push({ x, y });
    }
  }
}

// ===================== 描画 ================================
function drawStageBase() {
  syncCanvasSize();

  const w = cvs.clientWidth | 0;
  const h = cvs.clientHeight | 0;
  const cell = CELL();
  ctx.clearRect(0, 0, w, h);

  const offX = (w - COLS * cell) / 2;
  const offY = (h - ROWS * cell) / 2;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const tile = map[y][x];
      const px = offX + x * cell;
      const py = offY + y * cell;


      // 氷床にするのは「床('.')」のみ
      const isFloor = tile === '.' || tile === ' ';

      if (IS_ICE_STAGE && isFloor) {
        drawIceCell(px, py, cell);
      } else {
        // 既存配色を維持（ワープ/フリップはそのまま）
        ctx.fillStyle =
          tile === TILE_WARP ? '#cabdff' :
            tile === TILE_WARP2 ? '#8ecafc' :
              tile === TILE_FLIP ? '#7dd3fc' :
                tile === TILE_STOP ? '#ffe071' :
                  tile === TILE_TREASURE ? '#ffc8a2' :
                    tile === WALL ? '#3f6b6b' : '#dceeee';
        ctx.fillRect(px, py, cell, cell);
      }

      // 背景（drawIceCell or fillRect）の直後に追加
      if (tile === GOAL) {
        ctx.fillStyle = '#e91e63';
        const s = cell * 0.5; // □の一辺
        ctx.fillRect(px + (cell - s) / 2, py + (cell - s) / 2, s, s);
      }


      if ([TILE_FLIP, TILE_STOP, TILE_WARP, TILE_WARP2, TILE_TREASURE].includes(tile)) {
        const icon = tile === TILE_FLIP ? ICON_FLIP :
          tile === TILE_STOP ? ICON_STOP :
            tile === TILE_TREASURE ? ICON_TREASURE : ICON_WARP;
        ctx.font = `${Math.floor(cell * 0.6)}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#333';
        ctx.fillText(icon, px + cell / 2, py + cell / 2);
      }

      ctx.strokeStyle = '#999';
      ctx.strokeRect(px, py, cell, cell);
    }
  }
}

function drawPlayerAt(x, y) {
  const w = cvs.clientWidth | 0;
  const h = cvs.clientHeight | 0;
  const cell = CELL();
  const offX = (w - COLS * cell) / 2;
  const offY = (h - ROWS * cell) / 2;

  ctx.fillStyle = '#f39c12';
  ctx.beginPath();
  ctx.arc(
    offX + x * cell + cell / 2,
    offY + y * cell + cell / 2,
    cell / 3, 0, Math.PI * 2
  );
  ctx.fill();
}

function drawStage() {
  drawStageBase();
  drawPlayerAt(player.x, player.y);
}

// ===================== 判定 ================================
function isWall(x, y) {
  return x < 0 || y < 0 || y >= ROWS || x >= COLS || map[y][x] === WALL;
}
function isAtGoal() {
  return player.x === goal.x && player.y === goal.y;
}

// ===================== イージング ==========================
function easeOutQuad(t) { return 1 - (1 - t) * (1 - t); }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

/**
 * 端のみ減速・中央は等速。
 * edge=0 なら完全等速。
 */
function edgeEase(t, edge = EDGE_EASE_PCT) {
  if (edge <= 0) return t;
  if (t < edge) {
    // 出だしを軽く加速 → edge 区間の終点で "edge" に到達
    return easeOutQuad(t / edge) * edge;
  }
  if (t > 1 - edge) {
    const u = (t - (1 - edge)) / edge;     // 0..1
    return (1 - edge) + easeOutCubic(u) * edge;
  }
  return t; // 中央は等速
}

// ===================== 連続アニメ（Path全体） ===============
/**
 * path: [{x,y,tile,warped?}, ...]  到達順
 *  - 最初の現在位置 player を始点に含めるため内部で points を組み立てる
 *  - 各区間の距離を 1（ワープは WARP_WEIGHT）として合計距離を作り、
 *    t を 0..1 → progress 0..totalLen に変換して補間
 *  - 各 step に対して「到達しきった時」に効果を適用する
 */
async function animatePath(path) {
  if (path.length === 0) return;

  // points: [player, step1, step2, ...]
  const points = [{ x: player.x, y: player.y, tile: map[player.y][player.x] }, ...path];

  // 区間長（warp は短め）
  const segLens = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const isWarp = path[i]?.warped === true; // i番目の到達が warp で作られたか
    segLens.push(isWarp ? WARP_WEIGHT : 1);
  }

  // 各 step 到達時の閾値（累積長）
  const reachLen = [];
  {
    let acc = 0;
    for (let i = 0; i < segLens.length; i++) {
      acc += segLens[i];
      reachLen.push(acc); // step i の到達で acc
    }
  }
  const totalLen = reachLen[reachLen.length - 1];

  // 所要時間（距離に比例）
  const duration = totalLen * DURATION_PER_TILE;

  let appliedCount = 0; // 何個の step 効果を適用したか

  return new Promise((resolve) => {
    const start = performance.now();

    function frame(now) {
      const raw = (now - start) / duration;
      const t = raw >= 1 ? 1 : raw;
      const eased = edgeEase(t, EDGE_EASE_PCT);
      const progress = eased * totalLen;

      // 進行位置からセグメントを特定
      let seg = 0, acc = 0;
      while (seg < segLens.length && acc + segLens[seg] < progress) {
        acc += segLens[seg];
        seg++;
      }
      const segLen = segLens[Math.min(seg, segLens.length - 1)] || 1;
      const u = Math.min(Math.max((progress - acc) / segLen, 0), 1);

      const a = points[Math.min(seg, points.length - 1)];
      const b = points[Math.min(seg + 1, points.length - 1)];
      const x = a.x + (b.x - a.x) * u;
      const y = a.y + (b.y - a.y) * u;

      // 描画
      drawStageBase();
      drawPlayerAt(x, y);

      // 到達した step の効果をまとめて適用
      while (appliedCount < path.length && progress >= reachLen[appliedCount] - 1e-6) {
        const step = path[appliedCount];

        // 到達確定のステート反映（実座標）
        player = { x: step.x, y: step.y };

        // タイル効果
        if (step.tile === TILE_FLIP) {
          map[step.y][step.x] = WALL;
          used.F = true;
        }
        if (step.tile === TILE_TREASURE) {
          map[step.y][step.x] = '.';
          collected++;
          used.T = true;
          showMessage(`宝箱 ${collected}/${treasures.length} 回収！`);
        }
        if (step.tile === TILE_WARP) used.W = true;
        if (step.tile === TILE_WARP2) used.X = true;

        appliedCount++;
      }

      if (raw < 1) {
        requestAnimationFrame(frame);
      } else {
        // 最終位置を確定して終了
        player = { x: path[path.length - 1].x, y: path[path.length - 1].y };
        drawStage();
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

// ===================== slide 本体 ==========================
async function slide(dx, dy) {
  executedSlides++;

  const path = [];
  let cx = player.x;
  let cy = player.y;

  while (true) {
    const nx = cx + dx;
    const ny = cy + dy;
    if (isWall(nx, ny)) break;

    const tile = map[ny][nx];
    cx = nx; cy = ny;
    path.push({ x: cx, y: cy, tile });

    // ワープ（方向維持で直で飛ぶ）
    if (tile === TILE_WARP || tile === TILE_WARP2) {
      const dest = getWarpDest(cx, cy);
      if (dest) {
        cx = dest.x; cy = dest.y;
        path.push({ x: cx, y: cy, tile: map[cy][cx], warped: true });
      }
    }

    // STOP パッド（スコープ内のみ停止）
    if (stopArmed && map[cy][cx] === TILE_STOP) {
      used.P = true;
      break;
    }
  }

  // 連続アニメ
  await animatePath(path);

  // STOP スコープ消費
  if (stopArmed && path.some(p => p.tile === TILE_STOP)) {
    stopArmed = false;
  }

  /* クリア判定 */
  if (isAtGoal()) {
    // ── 宝箱取りこぼし ───────────────────
    if (collected < treasures.length) {
      fail(`宝箱をすべて回収してね！ ${collected}/${treasures.length}`);
      throw new Error('finished');
    }

    // ── ブロック数チェック OK ───────────────
    if (executedSlides <= BLOCK_LIMIT) {
      const stageNo = getCurrentStageNumber();   // 1‑12 / null 許容
      showClearModal(executedSlides, BLOCK_LIMIT, {
        stageNo,
        treasureCount: treasures.length,
        collectedCount: collected
      });

      /* ────────── 進行状況を保存 ────────── */
      const nextStage = ((stageNo ?? 0) + 1);    // null → 1
      const curProgress = parseInt(localStorage.getItem('stageProgress') || '1', 10);
      if (nextStage > curProgress) {
        localStorage.setItem('stageProgress', nextStage);
      }
      // 一覧ページが開いていれば即反映
      if (typeof window.advanceProgress === 'function') {
        window.advanceProgress(nextStage);
      }
      /* ─────────────────────────────────── */

      // ── ヘッダー「次のステージへ」ボタン ───
      const headerBtn = document.getElementById('headerNextBtn');
      if (headerBtn && stageNo && stageNo < 12) {
        headerBtn.href = `stage${stageNo + 1}.html`;
        headerBtn.classList.remove('hidden');
      }
    } else {
      fail(`ブロック数オーバー (${executedSlides}/${BLOCK_LIMIT})`);
    }
    throw new Error('finished');
  }
}
window.slide = slide;


// ===================== 実行 & リセット =====================
async function runCode() {
  try {
    executedSlides = 0;
    stopArmed = false;
    used = { W: false, X: false, F: false, P: false, T: false };

    // リセット
    map = JSON.parse(JSON.stringify(grid));
    initPositions();
    buildWarpList();
    buildTreasureList();
    drawStage();

    showMessage(`ブロック数 ${BLOCK_LIMIT} 以内でクリアしよう！ 実行中…`);

    const userCode = Blockly.JavaScript.workspaceToCode(workspace).trimEnd();
    await eval(`(async () => { ${userCode}; })()`);

    // 実行後に未到達ならエラー表示
    if (!isAtGoal()) fail('ゴールに届かなかったよ…');
  } catch (e) {
    // 'finished' は正常終了
  }
}

document.getElementById('runBtn').addEventListener('click', runCode);

document.getElementById('resetBtn').addEventListener('click', () => {
  map = JSON.parse(JSON.stringify(grid));
  initPositions();
  buildWarpList();
  buildTreasureList();
  executedSlides = 0;
  stopArmed = false;
  used = { W: false, X: false, F: false, P: false, T: false };
  drawStage();
  showMessage(`ブロック数 ${BLOCK_LIMIT} 以内でクリアしよう！`);
});

// ===================== 成功モーダル等 ======================
function getCurrentStageNumber() {
  if (window.stageNo) return window.stageNo;
  const m = location.pathname.match(/stage(\d+)\.html$/);
  return m ? parseInt(m[1], 10) : null;
}

function showClearModal(slidesUsed, limit, opts = {}) {
  const { stageNo, treasureCount, collectedCount } = opts;

  const stepsEl = document.getElementById('clearSteps');
  if (stepsEl) stepsEl.textContent = `${slidesUsed}/${limit}`;

  const treasureLine = document.getElementById('clearTreasureLine');
  if (treasureLine) {
    if (stageNo === 12) {
      treasureLine.textContent = `宝箱: ${collectedCount}/${treasureCount}`;
      treasureLine.classList.remove('hidden');
    } else {
      treasureLine.classList.add('hidden');
    }
  }

  const nextBtn = document.getElementById('nextStageBtn');
  if (nextBtn) {
    if (stageNo && stageNo < 12) {
      nextBtn.href = `stage${stageNo + 1}.html`;
      nextBtn.classList.remove('hidden');
    } else {
      nextBtn.classList.add('hidden');
    }
  }

  document.getElementById('clearBackdrop')?.classList.remove('hidden');
  document.getElementById('clearModal')?.classList.remove('hidden');
}

function closeClearModal() {
  document.getElementById('clearBackdrop')?.classList.add('hidden');
  document.getElementById('clearModal')?.classList.add('hidden');
}

function showHeaderNextBtn(stageNo) {
  const btn = document.getElementById('headerNextBtn');
  if (!btn) return;
  if (stageNo && stageNo < 12) {
    btn.href = `stage${stageNo + 1}.html`;
    btn.classList.remove('hidden');
  } else {
    btn.classList.add('hidden');
  }
}


// 氷の床を描く（グラデ＋ツヤ＋薄縁）
function drawIceCell(px, py, cell) {
  // 縦グラデ（上:ほぼ白 → 下:青み）
  const g = ctx.createLinearGradient(px, py, px, py + cell);
  g.addColorStop(0.00, '#f6fdff');
  g.addColorStop(0.45, '#e4f5ff');
  g.addColorStop(1.00, '#c9e9ff');
  ctx.fillStyle = g;
  ctx.fillRect(px, py, cell, cell);

  // ハイライト（上部のツヤ）
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(px + cell * 0.06, py + cell * 0.06, cell * 0.88, cell * 0.18);

  // 薄い氷縁
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.strokeRect(px + 0.5, py + 0.5, cell - 1, cell - 1);

  // 微細なスジ（控えめ）
  ctx.strokeStyle = 'rgba(80,150,200,0.22)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + cell * 0.20, py + cell * 0.60);
  ctx.lineTo(px + cell * 0.42, py + cell * 0.80);
  ctx.moveTo(px + cell * 0.62, py + cell * 0.32);
  ctx.lineTo(px + cell * 0.86, py + cell * 0.52);
  ctx.stroke();
}
