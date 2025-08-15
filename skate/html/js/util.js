/** ステータスバーにメッセージ表示 */
function showMessage(msg) {
    const el = document.getElementById('statusBar');
    if (el) el.textContent = msg;
}

/** 成功時：logic.js は success() を呼ぶだけで OK → ここでモーダル発火 */
function success(msg) {
    showMessage(msg);
    // 実行回数やブロック制限が見えるならクリアモーダルへ
    if (typeof showClearModal === 'function' &&
        typeof executedSlides !== 'undefined' &&
        typeof BLOCK_LIMIT !== 'undefined') {

        const stageNo = getCurrentStageNumber();
        const treasureCount = (typeof treasures !== 'undefined') ? treasures.length : 0;
        const collectedCount = (typeof collected !== 'undefined') ? collected : 0;

        // ステージ12以外なら宝箱情報は渡さない（もしくは null 扱い）
        showClearModal(executedSlides, BLOCK_LIMIT, {
            stageNo,
            treasureCount,
            collectedCount
        });
    } else {
        // 保険でalert
        alert(msg);
    }
}

/** 失敗時：従来通り alert も残す */
function fail(msg) {
    alert(msg);
    showMessage(msg);
}

/** 待機（アニメ用） */
function sleep(ms = 300) {
    return new Promise(r => setTimeout(r, ms));
}

/* ---------- Tutorial Modal ---------- */
function showTutorialModal(title, body) {
    const modal = document.getElementById('tutorialModal');
    const backdrop = document.getElementById('tutorialBackdrop');
    if (!modal || !backdrop) return;

    if (!title && window.STAGE_DATA?.tutorial) {
        title = STAGE_DATA.tutorial.title;
        body = STAGE_DATA.tutorial.body;
    }
    modal.querySelector('.tut-title').textContent = title || 'ステージ説明';
    modal.querySelector('.tut-body').innerHTML = body || '';

    modal.classList.remove('hidden');
    backdrop.classList.remove('hidden');
}

function closeTutorialModal() {
    const modal = document.getElementById('tutorialModal');
    const backdrop = document.getElementById('tutorialBackdrop');
    if (modal) modal.classList.add('hidden');
    if (backdrop) backdrop.classList.add('hidden');
}

/* ---------- もう一回プレイ（完全リセット版） ---------- */
function replayStage() {
    if (window.workspace) {
        workspace.clear(); // Blocklyブロック消去
    }
    location.reload();   // ページリロードで完全初期化
}

/* ---------- 汎用モーダル操作ヘルパ ---------- */
function openModal(modalId, backdropId) {
    const m = document.getElementById(modalId);
    const b = document.getElementById(backdropId);
    if (m) m.classList.remove('hidden');
    if (b) b.classList.remove('hidden');
}

function closeModal(modalId, backdropId) {
    const m = document.getElementById(modalId);
    const b = document.getElementById(backdropId);
    if (m) m.classList.add('hidden');
    if (b) b.classList.add('hidden');
}

/* ---------- ステージ番号ユーティリティ ---------- */
function getCurrentStageNumber() {
    const match = location.pathname.match(/stage(\d+)\.html$/);
    return match ? parseInt(match[1], 10) : null;
}

window.stageNo = getCurrentStageNumber();
