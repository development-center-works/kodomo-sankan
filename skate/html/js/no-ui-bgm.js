// js/no-ui-bgm.js
(() => {
    /**
     * ボタンなしBGM: 先に muted 再生→ユーザーの最初のタップで unmute
     * @param {string} url  
     * @param {object} opts 
     */
    window.setupNoUiBGM = function (url, { startMuted = true } = {}) {
        const audio = new Audio(url);
        audio.loop = true;
        audio.preload = 'auto';
        audio.setAttribute('playsinline', '');
        audio.playsInline = true;
        audio.muted = !!startMuted;

        // iOS/Safari 対策：まずは muted のまま再生を試みる
        audio.play().catch(() => { /* ユーザー操作待ち */ });

        // 最初のタップ/クリックでアンロック
        let unlocked = false;
        const unlock = () => {
            if (unlocked) return;
            unlocked = true;
            audio.muted = false;
            audio.play().catch(() => { /* 無視 */ });

            window.removeEventListener('pointerdown', unlock, true);
            window.removeEventListener('touchend', unlock, true);
        };
        // capture:true にしてリンク押下でも先に実行されやすくする
        window.addEventListener('pointerdown', unlock, { once: true, capture: true });
        window.addEventListener('touchend', unlock, { once: true, capture: true });

        // タブが非表示なら一時停止、戻ったら再開（ミュート時は再生しない）
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) audio.pause();
            else if (!audio.muted) audio.play().catch(() => { });
        });

        // ページ離脱時にクリーンアップ
        window.addEventListener('pagehide', () => {
            try { audio.pause(); audio.src = ''; } catch { }
        });

        return audio;
    };
})();
