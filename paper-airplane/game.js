// ゲーム状態管理
class PaperAirplaneGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.angle = 0; // 投げる角度（度）
        this.power = 5; // 投げる強さ（1-10）
        this.balance = 5; // 重心位置（1-10、5が中央）
        this.airplane = null;
        this.isFlying = false;
        this.animationId = null;
        this.maxHeight = 0; // 最高高度を追跡
        this.animationTime = 0; // アニメーション用のタイムスタンプ

        // シナリオ・ステージ管理
        this.isStageMode = false; // 初期はフリーモード
        this.currentStage = 1;
        this.stageCleared = false;
        this.flightHistory = []; // 飛行記録
        this.stageProgress = {
            stage1: { completed: false },
            stage2: { completed: false, bestDistance: 0 },
            stage3: { completed: false, attempts: 0, totalDistance: 0 },
            stage4: { completed: false, attempts: 0, birdEventTriggered: false },
            stage5: { completed: false, attempts: 0, variationFlights: [] }
        };

        // 効果音システム
        this.audioContext = null;
        this.sounds = {};
        this.soundEnabled = true;
        this.initializeSoundSystem();

        // 特殊イベント用のアニメーション状態
        this.isSpecialEventAnimating = false;
        this.specialEventRotationCount = 0;
        this.specialEventRotationSpeed = 0.15; // 回転速度を調整
        this.specialEventParams = null; // 特殊イベント用のパラメータを保存

        // スイングバイアニメーション用のパラメータ
        this.swingbyCenter = null; // 回転中心
        this.swingbyRadiusX = 15; // 楕円の横半径（論理座標）
        this.swingbyRadiusY = 8; // 楕円の縦半径（論理座標）
        this.swingbyAngle = 0; // 現在の回転角度
        this.swingbyTiltAngle = 40 * Math.PI / 180; // 楕円の傾き角度（40度をラジアンに変換）

        // 特殊イベント演出用のパラメータ
        this.specialEventEffect = {
            isActive: false,
            startTime: 0,
            duration: 2000, // 2秒間の演出
            text: '',
            particles: []
        };

        // 月への飛行演出用のパラメータ
        this.moonFlightEffect = {
            isActive: false,
            startTime: 0,
            duration: 7000, // 7秒間の演出（着陸シーンを含む）
            moonX: 0,
            moonY: 0,
            stars: [],
            phase: 'flight', // 'flight' -> 'landing' -> 'landed'
            landingStartTime: 0,
            returnButtonShown: false, // 地球へ帰るボタンが表示されているか
            waitingForReturn: false,   // 帰還ボタンが押されるのを待っているか
            spinSoundPlayed: false,    // 回転効果音が再生されたか
            landingSoundPlayed: false  // 着陸効果音が再生されたか
        };

        // 特殊イベント発生フラグ（月への飛行のため）
        this.specialEventTriggered = false;

        // 鳥の持ち去りイベント用のパラメータ
        this.birdCarryEvent = {
            isActive: false,
            startTime: 0,
            duration: 5000, // 5秒間の演出
            birdX: 0,
            birdY: 0,
            birdSpeed: 2,
            wingFlap: 0,
            carryStarted: false,
            heightTriggered: false, // 飛距離60m&高度50m条件達成フラグ
            completed: false // イベント完了フラグ
        };

        // うんこ突き刺さりイベント用のパラメータ
        this.poopCrashEvent = {
            isActive: false,
            startTime: 0,
            duration: 3000, // 3秒間の演出
            poopX: 0,
            poopY: 0,
            crashTriggered: false, // 飛距離70m-75m&高度10m未満条件達成フラグ
            stinkLines: [] // 臭い線のアニメーション用
        };

        // 滑空状態の追跡
        this.glidingState = {
            isGliding: false,
            glidingStartTime: 0,
            glidingMessageShown: false
        };

        // ブレ情報の保存（結果表示用）
        this.blurInfo = {
            hasBlur: false,
            originalAngle: 0,
            actualAngle: 0,
            blurAmount: 0,
            direction: ''
        };

        // 特定条件（77-7-7）の処理用フラグ
        this.pendingSpecialCondition = {
            angle77Set: false,
            needsRecheck: false,
            originalAngle: 0  // 元の角度値を保存
        };

        // 全体のイベント進行状態管理
        this.eventSequenceActive = false; // イベントシーケンス実行中フラグ
        this.flightStartTime = 0; // 飛行開始時刻

        // 物理パラメーター（論理座標系に適応）
        this.gravity = 0.15; // 重力を少し強めて現実的な軌道に
        this.airResistance = 0.96; // 空気抵抗を強めて飛距離を調整

        // 乱気流の設定
        this.turbulences = [
            {
                name: 'α',
                centerX: 10,
                centerY: 25,
                radius: 7,
                color: 'rgba(80, 120, 200, 0.6)' // 青系
            },
            {
                name: 'β',
                centerX: 40,
                centerY: 30,
                radius: 7,
                color: 'rgba(120, 120, 80, 0.6)' // 黄系
            }
        ];

        this.init();
        this.updateUIState(); // 初期UI状態を設定
        this.initStageSystem(); // ステージシステム初期化
        // 初期化時は飛行距離と高度を0に設定
        document.getElementById('distanceDisplay').textContent = '0m';
        document.getElementById('heightDisplay').textContent = '0m';
    }

    // ステージシステム初期化
    initStageSystem() {
        if (this.isStageMode) {
            this.showStageMessage();
            this.updateStageDisplay();
        } else {
            this.showFreeMode();
        }
    }

    // フリーモード表示
    showFreeMode() {
        this.showMessage("🎮 フリーモード\n自由に紙飛行機を飛ばして楽しみましょう！\n「ステージ開始」ボタンでチャレンジモードに挑戦できます。", '#2196F3');
        this.updateStageDisplay();
    }

    // 現在のステージメッセージを表示
    showStageMessage() {
        const stageMessages = {
            1: "ステージ1: ゲームに慣れよう！\n紙飛行機のパラメータ（角度・強さ・重心）を設定して紙飛行機を飛ばしてみましょう。",
            2: "ステージ2: 距離の挑戦！\n90m以上飛ばしてみましょう。角度と強さを調整してベストを目指そう！",
            3: "ステージ3: 安定性の証明！\nループを使って10回飛ばし、平均飛行距離80m以上を達成しましょう。",
            4: "ステージ4: 幸運を掴もう！\nループを使って何度か飛ばし、鳥イベントを発生させましょう。",
            5: "ステージ5: プログラマーへの道！\nループと数学、変数を使ってパラメータを変動させながら16回飛ばしましょう。"
        };

        if (stageMessages[this.currentStage]) {
            this.showMessage(stageMessages[this.currentStage], '#2196F3');
        }
    }

    // ステージ表示を更新
    updateStageDisplay() {
        const stageDisplay = document.getElementById('stageDisplay');
        if (!stageDisplay) {
            // ステージ表示エリアを作成
            const stageDiv = document.createElement('div');
            stageDiv.id = 'stageDisplay';
            stageDiv.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(33, 150, 243, 0.9);
                color: white;
                padding: 10px 15px;
                border-radius: 8px;
                font-size: 16pt;
                font-weight: bold;
                z-index: 1000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                cursor: pointer;
                transition: all 0.3s ease;
            `;

            // クリックイベントを追加
            stageDiv.addEventListener('click', () => {
                this.showStageInfo();
            });

            // ホバー効果を追加
            stageDiv.addEventListener('mouseenter', () => {
                stageDiv.style.transform = 'scale(1.05)';
                stageDiv.style.boxShadow = '0 4px 15px rgba(0,0,0,0.4)';
            });

            stageDiv.addEventListener('mouseleave', () => {
                stageDiv.style.transform = 'scale(1)';
                stageDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
            });

            document.body.appendChild(stageDiv);
        }

        const display = document.getElementById('stageDisplay');

        if (!this.isStageMode) {
            display.textContent = 'フリーモード';
            display.style.background = 'rgba(76, 175, 80, 0.9)';
            display.title = 'クリックで詳細情報を表示';
            return;
        }

        display.textContent = `ステージ ${this.currentStage}`;
        display.style.background = 'rgba(33, 150, 243, 0.9)';
        display.title = 'クリックでステージ情報を表示';

        // ステージ進捗を表示
        const progressText = this.getStageProgressText();
        if (progressText) {
            display.innerHTML = `ステージ ${this.currentStage}<br><small style="font-size: 12pt;">${progressText}</small>`;
        }

        // 新しいステージ情報エリアも更新
        const currentStageDisplay = document.getElementById('currentStageDisplay');
        if (currentStageDisplay) {
            currentStageDisplay.textContent = this.currentStage;
        }
    }

    // ステージ進捗テキストを取得
    getStageProgressText() {
        switch (this.currentStage) {
            case 1:
                return this.flightHistory.length > 0 ? "飛行済み ✓" : "飛行してみよう";
            case 2:
                return `最高記録: ${this.stageProgress.stage2.bestDistance}m`;
            case 3:
                const avg3 = this.stageProgress.stage3.attempts > 0 ?
                    Math.round(this.stageProgress.stage3.totalDistance / this.stageProgress.stage3.attempts) : 0;
                return `${this.stageProgress.stage3.attempts}/10回 平均:${avg3}m`;
            case 4:
                return this.stageProgress.stage4.birdEventTriggered ?
                    "鳥イベント発生 ✓" : `${this.stageProgress.stage4.attempts}回試行中`;
            case 5:
                return `${this.stageProgress.stage5.attempts}/16回`;
            default:
                return "";
        }
    }

    // ステージ情報を表示
    showStageInfo() {
        if (!this.isStageMode) {
            this.showStageInfoMessage("🎮 フリーモード\n\n制約なしで自由に紙飛行機を飛ばして楽しめます。\n\n操作に慣れたら「ステージ開始」ボタンでチャレンジモードに挑戦してみましょう！", '#4CAF50');
            return;
        }

        const stageInfo = this.getStageDetailInfo();
        this.showStageInfoMessage(stageInfo.message, stageInfo.color);
    }

    // ステージ情報専用のメッセージ表示（自動で閉じない）
    showStageInfoMessage(message, backgroundColor) {
        // 既存のステージ情報メッセージがあれば削除
        const existingMessage = document.getElementById('stageInfoMessage');
        if (existingMessage) {
            existingMessage.remove();
        }

        // メッセージ要素を作成
        const messageDiv = document.createElement('div');
        messageDiv.id = 'stageInfoMessage';
        messageDiv.innerHTML = message.replace(/\n/g, '<br>') + '<br><br><small style="opacity: 0.8;">📱 ページ内をクリックで閉じる</small>';

        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${backgroundColor};
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            font-weight: bold;
            z-index: 1001;
            max-width: 90%;
            text-align: left;
            font-size: 14pt;
            line-height: 1.6;
            animation: slideDown 0.4s ease-out;
            border: 2px solid rgba(255,255,255,0.2);
        `;

        // 背景オーバーレイを作成
        const overlay = document.createElement('div');
        overlay.id = 'stageInfoOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            animation: fadeIn 0.3s ease-out;
        `;

        // オーバーレイのアニメーション
        if (!document.getElementById('overlayAnimation')) {
            const style = document.createElement('style');
            style.id = 'overlayAnimation';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        // 閉じる機能
        const closeStageInfo = () => {
            overlay.style.animation = 'fadeOut 0.3s ease-out';
            messageDiv.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (overlay.parentNode) overlay.remove();
                if (messageDiv.parentNode) messageDiv.remove();
            }, 300);
        };

        // オーバーレイクリックで閉じる
        overlay.addEventListener('click', closeStageInfo);

        // ESCキーで閉じる
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeStageInfo();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // 要素を画面に追加
        document.body.appendChild(overlay);
        document.body.appendChild(messageDiv);
    }

    // ステージ詳細情報を取得
    getStageDetailInfo() {
        const stageDetails = {
            1: {
                message: "🎯 ステージ1: ゲームに慣れよう\n\n【目標】\n基本操作を覚えて紙飛行機を1回飛ばす\n\n【ヒント】\n• 左のツールボックスからブロックをドラッグ\n• 「角度を設定」「強さを設定」「紙飛行機を飛ばす」を組み合わせる\n• 角度: -30°～30°、強さ: 1～10で調整してみよう",
                color: '#2196F3'
            },
            2: {
                message: "🚀 ステージ2: 距離の挑戦\n\n【目標】\n90m以上の飛行距離を達成\n\n【ヒント】\n• 角度: 25°～35°が効果的\n• 強さ: 7～9で力強く投げる\n• 重心: 4～6でバランスを取る\n• 何度か試して最適な組み合わせを見つけよう",
                color: '#FF9800'
            },
            3: {
                message: "📊 ステージ3: 安定性の証明\n\n【目標】\nループで10回飛ばし、平均80m以上を達成\n\n【ヒント】\n• 「○回繰り返す」ブロックを使用\n• 安定した設定を見つけたら同じ値で繰り返す\n• 角度30°、強さ8、重心5あたりが安定しやすい\n• ブレに注意！重心5なら精密な角度制御が可能",
                color: '#9C27B0'
            },
            4: {
                message: "🐦 ステージ4: 幸運を掴もう\n\n【目標】\nループを使って鳥イベントを発生させる\n\n【ヒント】\n• 鳥イベントは30%の確率で高度35m以上で発生\n• 角度35°～45°で高く飛ばそう\n• 強さ6～8で適度な勢いを\n• 何度も繰り返せば必ず発生する！",
                color: '#00BCD4'
            },
            5: {
                message: "🎓 ステージ5: プログラマーへの道\n\n【目標】\n変数とループを使って16回のバリエーション飛行\n\n【ヒント】\n• 「変数」ブロックを使ってパラメータを変動\n• 「計算」ブロックで値を増減させる\n• 例: 角度を毎回2°ずつ変える\n• ループの中で変数の値を更新していこう",
                color: '#4CAF50'
            }
        };

        return stageDetails[this.currentStage] || {
            message: "ステージ情報が見つかりません",
            color: '#757575'
        };
    }

    // UI状態を更新（ボタンの有効/無効化）
    updateUIState() {
        const throwButton = document.querySelector('button[onclick="throwAirplane()"]');
        const resetButton = document.querySelector('button[onclick="resetGame()"]');

        // ループ実行中またはイベントシーケンス中の判定
        const isDisabled = this.eventSequenceActive || (typeof loopData !== 'undefined' && loopData.isLooping);

        if (isDisabled) {
            // イベントシーケンス中またはループ中：飛行ボタンを無効化
            if (throwButton) {
                throwButton.disabled = true;
                if (typeof loopData !== 'undefined' && loopData.isLooping) {
                    throwButton.textContent = `ループ実行中... (${loopData.currentLoop}/${loopData.type === 'count' ? loopData.targetCount : '最大' + loopData.maxLoops})`;
                } else {
                    throwButton.textContent = 'イベント実行中...';
                }
                throwButton.style.opacity = '0.6';
                throwButton.style.cursor = 'not-allowed';
            }
        } else {
            // 通常状態：ボタンを有効化
            if (throwButton) {
                throwButton.disabled = false;
                throwButton.textContent = '飛行機を飛ばす';
                throwButton.style.opacity = '1';
                throwButton.style.cursor = 'pointer';
            }
        }
    }

    // ゲーム内確認ダイアログを表示
    showConfirmDialog(message, onConfirm, onCancel = null) {
        // 既存のダイアログがあれば削除
        const existingDialog = document.getElementById('confirmDialog');
        if (existingDialog) {
            existingDialog.remove();
        }

        // ダイアログを作成
        const dialog = document.createElement('div');
        dialog.id = 'confirmDialog';
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        const dialogBox = document.createElement('div');
        dialogBox.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            max-width: 400px;
            text-align: center;
            font-family: inherit;
        `;

        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            margin-bottom: 20px;
            font-size: 16px;
            line-height: 1.5;
            color: #333;
            white-space: pre-line;
        `;
        messageDiv.textContent = message;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 15px;
            justify-content: center;
        `;

        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'はい';
        confirmButton.style.cssText = `
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
        `;

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'いいえ';
        cancelButton.style.cssText = `
            background: #f44336;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
        `;

        confirmButton.addEventListener('click', () => {
            dialog.remove();
            if (onConfirm) onConfirm();
        });

        cancelButton.addEventListener('click', () => {
            dialog.remove();
            if (onCancel) onCancel();
        });

        buttonContainer.appendChild(confirmButton);
        buttonContainer.appendChild(cancelButton);
        dialogBox.appendChild(messageDiv);
        dialogBox.appendChild(buttonContainer);
        dialog.appendChild(dialogBox);
        document.body.appendChild(dialog);
    }

    init() {
        // キャンバスの初期化
        this.drawBackground();
        this.drawGround();
        this.drawAirplane(this.toScreenX(0), this.toScreenY(0), 0); // 論理座標(0,0)を画面座標に変換

        // パラメーター表示の更新
        this.updateDisplay();

        // 乱気流のアニメーションを開始
        this.animate();
    }

    // 背景を描画
    drawBackground() {
        // 空のグラデーション
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#B0E0E6');
        gradient.addColorStop(1, '#98FB98');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 雲を描画
        this.drawClouds();

        // 乱気流を描画
        this.drawTurbulence();
    }

    // 雲を描画
    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

        // 雲1
        this.drawCloud(100, 80, 60);
        this.drawCloud(300, 50, 80);
        this.drawCloud(450, 90, 70);
    }

    drawCloud(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.3, y, size * 0.7, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.6, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.3, y - size * 0.3, size * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // 乱気流を描画
    drawTurbulence() {
        // 各乱気流を描画
        this.turbulences.forEach((turbulence, index) => {
            this.drawSingleTurbulence(turbulence, index);
        });
    }

    // 単一の乱気流を描画
    drawSingleTurbulence(turbulence, index) {
        // 論理座標を画面座標に変換
        const screenCenterX = this.toScreenX(turbulence.centerX);
        const screenCenterY = this.toScreenY(turbulence.centerY);
        const screenRadius = turbulence.radius * 5; // 5倍でピクセル変換

        // アニメーション効果用の時間ベースの値（各乱気流で異なる位相）
        const time = this.animationTime * 0.1 + index * Math.PI;

        // 乱気流の影響範囲を薄く表示（デバッグ用）
        this.ctx.fillStyle = turbulence.color.replace('0.6', '0.1');
        this.ctx.beginPath();
        this.ctx.arc(screenCenterX, screenCenterY, screenRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // 乱気流の渦巻き模様を描画
        const opacity = 0.6 + 0.3 * Math.sin(time);
        this.ctx.strokeStyle = turbulence.color.replace('0.6', opacity.toString());
        this.ctx.lineWidth = 3;

        // 中心に1つの渦巻きを描画（時間に応じて回転）
        this.drawAnimatedSpiral(screenCenterX, screenCenterY, 15, 2, time);
    }

    // アニメーション付き渦巻きを描画するヘルパーメソッド
    drawAnimatedSpiral(centerX, centerY, maxRadius, turns, timeOffset) {
        this.ctx.beginPath();
        let angle = timeOffset; // 時間オフセットで回転
        let radius = 0;
        const step = 0.15;
        const radiusStep = maxRadius / (turns * 2 * Math.PI / step);

        this.ctx.moveTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);

        while (radius < maxRadius) {
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            this.ctx.lineTo(x, y);

            angle += step;
            radius += radiusStep;
        }

        this.ctx.stroke();
    }

    // 乱気流の影響をチェックして適用
    checkTurbulenceEffect() {
        if (!this.airplane) return;

        // 特殊イベントアニメーション中は乱気流の影響をスキップ
        if (this.isSpecialEventAnimating) return;

        // 各乱気流の影響をチェック
        this.turbulences.forEach(turbulence => {
            this.checkSingleTurbulenceEffect(turbulence);
        });
    }

    // 単一の乱気流の影響をチェックして適用
    checkSingleTurbulenceEffect(turbulence) {
        // 紙飛行機と乱気流中心の距離を計算
        const deltaX = this.airplane.x - turbulence.centerX;
        const deltaY = this.airplane.y - turbulence.centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // 乱気流の範囲内にいるかチェック
        if (distance <= turbulence.radius) {
            // 【特殊イベント】乱気流αでの再発射機能
            // 条件: 角度77, 強さ7, 重心7で乱気流αに入る
            // 効果: 角度45, 強さ10, 重心1でその場所から再発射
            if (turbulence.name === 'α' &&
                this.angle === 77 &&
                this.power === 7 &&
                this.balance === 7) {

                console.log('【特殊イベント発生】乱気流αでの再発射条件が満たされました！');

                // 特殊イベント演出を開始
                this.startSpecialEventEffect();

                // 現在の位置から新しいパラメータで再発射（回転アニメーション後）
                const currentX = this.airplane.x;
                const currentY = this.airplane.y;

                // 特殊イベント用の新しいパラメータを設定
                const newAngle = 45;
                const newPower = 10;
                const newBalance = 1;

                // 特殊イベントのパラメータを保存
                this.specialEventParams = {
                    x: currentX,
                    y: currentY,
                    angle: newAngle,
                    power: newPower,
                    balance: newBalance
                };

                // スイングバイアニメーションの初期設定
                this.swingbyCenter = { x: turbulence.centerX, y: turbulence.centerY };
                this.swingbyAngle = Math.atan2(currentY - turbulence.centerY, currentX - turbulence.centerX);

                // 回転アニメーションを開始
                this.isSpecialEventAnimating = true;
                this.specialEventRotationCount = 0;

                // 特殊イベントが発生したことを記録
                this.specialEventTriggered = true;
                this.eventSequenceActive = true; // イベントシーケンス開始
                this.updateUIState(); // UI更新

                console.log('【特殊イベント】スイングバイアニメーションを開始します');

                // 特殊イベントが発生したので、通常の乱気流効果は適用しない
                return;
            }

            // 通常の乱気流効果
            // 距離に応じた影響の強さ（中心に近いほど強い）
            const distanceEffect = 1 - (distance / turbulence.radius);

            // 重心による影響の調整（前重心ほど影響が大きい）
            const balanceEffect = this.calculateTurbulenceBalanceEffect();

            // 最終的な影響の強さ
            const totalEffect = distanceEffect * balanceEffect;

            // ランダムな速度変化を適用（影響を強化）
            const velocityChange = totalEffect * 1.5; // 0.5から1.5に増加（3倍強化）
            const randomVx = (Math.random() - 0.5) * velocityChange;
            const randomVy = (Math.random() - 0.5) * velocityChange;

            this.airplane.vx += randomVx;
            this.airplane.vy += randomVy;

            // ランダムな角度変化を適用（影響を強化）
            const angleChange = totalEffect * 0.8; // 0.2から0.8に増加（4倍強化）
            const randomRotation = (Math.random() - 0.5) * angleChange;
            this.airplane.rotation += randomRotation;

            // 追加の不安定効果（機体の振動）
            const vibrationEffect = totalEffect * 0.3;
            this.airplane.vx += (Math.random() - 0.5) * vibrationEffect;
            this.airplane.vy += (Math.random() - 0.5) * vibrationEffect;

            // デバッグ情報（コンソールに出力）
            if (Math.random() < 0.1) { // 10%の確率で出力（頻度制限）
                console.log(`乱気流${turbulence.name}影響: 距離=${distance.toFixed(1)}m, 効果=${totalEffect.toFixed(2)}, 重心効果=${balanceEffect.toFixed(2)}`);
            }
        }
    }

    // 重心による乱気流影響の計算
    calculateTurbulenceBalanceEffect() {
        // 重心値を0-1の範囲に正規化（1が前重心、10が後重心）
        const normalizedBalance = (this.balance - 1) / 9;

        // 前重心（1-3）: 影響大（1.0-0.8）
        // 中央重心（4-7）: 影響中（0.8-0.5）
        // 後重心（8-10）: 影響小（0.5-0.3）
        let effect = 1.0 - normalizedBalance * 0.7; // 1.0から0.3の範囲

        return Math.max(0.3, Math.min(1.0, effect)); // 0.3-1.0の範囲に制限
    }

    // 渦巻きを描画するヘルパーメソッド
    drawSpiral(centerX, centerY, maxRadius, turns) {
        this.ctx.beginPath();
        let angle = 0;
        let radius = 0;
        const step = 0.1;
        const radiusStep = maxRadius / (turns * 2 * Math.PI / step);

        this.ctx.moveTo(centerX, centerY);

        while (radius < maxRadius) {
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            this.ctx.lineTo(x, y);

            angle += step;
            radius += radiusStep;
        }

        this.ctx.stroke();
    }

    // 特殊イベント演出を開始
    startSpecialEventEffect() {
        this.specialEventEffect.isActive = true;
        this.specialEventEffect.startTime = Date.now();
        this.specialEventEffect.text = 'SWINGBY ACTIVATED!';

        // パーティクルエフェクトを生成
        this.specialEventEffect.particles = [];
        const centerX = this.toScreenX(this.airplane.x);
        const centerY = this.toScreenY(this.airplane.y);

        for (let i = 0; i < 20; i++) {
            this.specialEventEffect.particles.push({
                x: centerX,
                y: centerY,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.01,
                size: 3 + Math.random() * 4,
                color: `hsl(${60 + Math.random() * 60}, 100%, 70%)`
            });
        }
    }

    // 特殊イベント演出を描画
    drawSpecialEventEffect() {
        if (!this.specialEventEffect.isActive) return;

        const elapsed = Date.now() - this.specialEventEffect.startTime;
        const progress = elapsed / this.specialEventEffect.duration;

        if (progress >= 1.0) {
            this.specialEventEffect.isActive = false;
            return;
        }

        // テキスト演出
        this.ctx.save();
        const alpha = progress < 0.1 ? progress * 10 : progress > 0.8 ? (1 - progress) * 5 : 1;
        const scale = 1 + Math.sin(elapsed * 0.01) * 0.1;

        this.ctx.globalAlpha = alpha;
        this.ctx.font = `${40 * scale}px Arial Black`;
        this.ctx.fillStyle = '#FFD700';
        this.ctx.strokeStyle = '#FF4500';
        this.ctx.lineWidth = 3;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const textX = this.canvas.width / 2;
        const textY = this.canvas.height / 3;

        this.ctx.strokeText(this.specialEventEffect.text, textX, textY);
        this.ctx.fillText(this.specialEventEffect.text, textX, textY);

        // パーティクルエフェクト
        this.specialEventEffect.particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            particle.vy += 0.2; // 重力効果

            if (particle.life > 0) {
                this.ctx.globalAlpha = particle.life;
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.specialEventEffect.particles.splice(index, 1);
            }
        });

        this.ctx.restore();
    }

    // 月への飛行演出を開始
    startMoonFlightEffect() {
        console.log('【月への飛行演出】演出を開始します');

        // 月着陸の神秘的な効果音を再生
        this.createSound('moon');

        // 月イベント用BGMに切り替え
        this.switchBGM('moon');

        this.moonFlightEffect.isActive = true;
        this.moonFlightEffect.startTime = Date.now();
        this.moonFlightEffect.moonX = this.canvas.width - 100;
        this.moonFlightEffect.moonY = 80;
        this.moonFlightEffect.phase = 'flight';
        this.moonFlightEffect.landingStartTime = 0;
        this.moonFlightEffect.returnButtonShown = false;
        this.moonFlightEffect.waitingForReturn = false;
        this.moonFlightEffect.spinSoundPlayed = false;
        this.moonFlightEffect.landingSoundPlayed = false;

        // 星空を生成
        this.moonFlightEffect.stars = [];
        for (let i = 0; i < 50; i++) {
            this.moonFlightEffect.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height * 0.7,
                size: Math.random() * 2 + 1,
                twinkle: Math.random() * Math.PI * 2
            });
        }
        console.log('【月への飛行演出】設定完了 - stars生成数:', this.moonFlightEffect.stars.length);
        console.log('【月への飛行演出】アニメーション継続の準備完了');
    }

    // 地球へ帰るボタンを表示
    showReturnToEarthButton() {
        if (this.moonFlightEffect.returnButtonShown) return;

        this.moonFlightEffect.returnButtonShown = true;
        this.moonFlightEffect.waitingForReturn = true;

        // ボタンを作成
        const returnButton = document.createElement('button');
        returnButton.id = 'returnToEarthButton';
        returnButton.textContent = '地球へ帰る';
        returnButton.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
            padding: 12px 25px;
            font-size: 16px;
            font-weight: bold;
            color: white;
            background: linear-gradient(45deg, #4CAF50, #45a049);
            border: none;
            border-radius: 10px;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            white-space: nowrap;
            min-width: fit-content;
        `;

        // ホバー効果
        returnButton.addEventListener('mouseenter', () => {
            returnButton.style.transform = 'translate(-50%, -50%) scale(1.05)';
            returnButton.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
        });

        returnButton.addEventListener('mouseleave', () => {
            returnButton.style.transform = 'translate(-50%, -50%) scale(1)';
            returnButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        });

        // クリックイベント
        returnButton.addEventListener('click', () => {
            this.returnToEarth();
        });

        document.body.appendChild(returnButton);
        console.log('【月着陸】地球へ帰るボタンを表示しました');
    }

    // 地球への帰還処理
    returnToEarth() {
        // ボタンを削除
        const returnButton = document.getElementById('returnToEarthButton');
        if (returnButton) {
            returnButton.remove();
        }

        // 通常BGMに戻す
        this.switchBGM('normal');

        // 月の演出を終了
        this.moonFlightEffect.isActive = false;
        this.moonFlightEffect.returnButtonShown = false;
        this.moonFlightEffect.waitingForReturn = false;

        // 初期状態に戻る
        this.resetToInitialState();

        console.log('【月着陸】地球に帰還しました');
    }

    // 初期状態にリセット
    resetToInitialState() {
        this.isFlying = false;
        this.airplane = null;
        this.animationId = null;
        this.maxHeight = 0;
        this.animationTime = 0;
        this.specialEventTriggered = false;
        this.eventSequenceActive = false;
        this.flightStartTime = 0;

        // 特殊イベント関連もリセット
        this.isSpecialEventAnimating = false;
        this.specialEventRotationCount = 0;

        // 鳥の持ち去りイベントもリセット
        this.birdCarryEvent.isActive = false;
        this.birdCarryEvent.heightTriggered = false;
        this.birdCarryEvent.carryStarted = false;
        this.birdCarryEvent.startTime = 0;
        this.birdCarryEvent.birdX = 0;
        this.birdCarryEvent.birdY = 0;
        this.birdCarryEvent.wingFlap = 0;
        this.birdCarryEvent.completed = false;

        // うんこ突き刺さりイベントもリセット
        this.poopCrashEvent.isActive = false;
        this.poopCrashEvent.crashTriggered = false;
        this.poopCrashEvent.startTime = 0;
        this.poopCrashEvent.poopX = 0;
        this.poopCrashEvent.poopY = 0;
        this.poopCrashEvent.stinkLines = [];

        // UI状態を更新
        this.updateUIState();
        this.updateDisplay();

        // 飛距離と高度の表示を初期化
        document.getElementById('distanceDisplay').textContent = '0m';
        document.getElementById('heightDisplay').textContent = '0m';

        // キャンバスをクリア
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBackground();

        console.log('【システム】初期状態にリセットしました');
    }

    // 鳥の持ち去りイベントを開始
    startBirdCarryEvent() {
        console.log('【鳥の持ち去りイベント】条件達成 - イベント開始処理');
        console.log(`【鳥の持ち去りイベント】イベント開始前の状態 - airplane: ${this.airplane ? '存在' : 'null'}, canvas: ${this.canvas.width}x${this.canvas.height}`);

        // 鳥の鳴き声効果音を再生
        this.createSound('bird');

        this.birdCarryEvent.isActive = true;
        this.birdCarryEvent.startTime = Date.now();
        this.birdCarryEvent.heightTriggered = true;
        this.birdCarryEvent.carryStarted = false;
        this.birdCarryEvent.wingFlap = 0;

        // 鳥の初期位置（画面右上から登場）
        this.birdCarryEvent.birdX = this.canvas.width + 50;
        this.birdCarryEvent.birdY = this.toScreenY(this.airplane.y) - 50;

        console.log(`【鳥の持ち去りイベント】鳥が登場します - 初期位置: (${this.birdCarryEvent.birdX}, ${this.birdCarryEvent.birdY})`);
        console.log(`【鳥の持ち去りイベント】airplane位置: (${this.airplane.x}, ${this.airplane.y}) → 画面座標: (${this.toScreenX(this.airplane.x)}, ${this.toScreenY(this.airplane.y)})`);
        console.log(`【鳥の持ち去りイベント】フラグ状態: isActive=${this.birdCarryEvent.isActive}, heightTriggered=${this.birdCarryEvent.heightTriggered}`);
        console.log(`【鳥の持ち去りイベント】duration: ${this.birdCarryEvent.duration}ms`);
    }

    // うんこ突き刺さりイベントを開始
    startPoopCrashEvent() {
        console.log('【うんこ突き刺さりイベント】条件達成 - イベント開始処理');

        // クラッシュ効果音を再生
        this.createSound('crash');

        this.poopCrashEvent.isActive = true;
        this.poopCrashEvent.startTime = Date.now();
        this.poopCrashEvent.crashTriggered = true;

        // うんこの位置（紙飛行機の現在位置に設定）
        this.poopCrashEvent.poopX = this.toScreenX(this.airplane.x);
        this.poopCrashEvent.poopY = this.toScreenY(0); // 地面の高さ

        // 臭い線のアニメーション初期化
        this.poopCrashEvent.stinkLines = [];
        for (let i = 0; i < 5; i++) {
            this.poopCrashEvent.stinkLines.push({
                x: this.poopCrashEvent.poopX + (Math.random() - 0.5) * 30,
                y: this.poopCrashEvent.poopY,
                offsetY: 0,
                speed: 0.5 + Math.random() * 1,
                opacity: 1
            });
        }

        console.log(`【うんこ突き刺さりイベント】うんこの位置: (${this.poopCrashEvent.poopX}, ${this.poopCrashEvent.poopY})`);
        console.log(`【うんこ突き刺さりイベント】フラグ状態: isActive=${this.poopCrashEvent.isActive}, crashTriggered=${this.poopCrashEvent.crashTriggered}`);
    }

    // 鳥の持ち去りイベントを描画
    drawBirdCarryEvent() {
        if (!this.birdCarryEvent.isActive) return;

        const elapsed = Date.now() - this.birdCarryEvent.startTime;
        const progress = elapsed / this.birdCarryEvent.duration;

        // 2秒に1回だけ進行状況をログ出力（安定性のため頻度を下げる）
        if (elapsed % 2000 < 50) {
            console.log(`【鳥イベント描画】進行状況: ${(progress * 100).toFixed(1)}%`);
        }

        if (progress >= 1.0) {
            // イベント終了 - すべてのフラグをリセット
            console.log('【鳥の持ち去りイベント】イベント終了');
            this.birdCarryEvent.isActive = false;
            this.birdCarryEvent.carryStarted = false;
            this.birdCarryEvent.startTime = 0;
            this.birdCarryEvent.birdX = 0;
            this.birdCarryEvent.birdY = 0;
            this.birdCarryEvent.wingFlap = 0;
            this.birdCarryEvent.completed = true; // イベント完了フラグを設定
            this.isFlying = false;
            this.updateUIState();
            this.landAirplane();
            return;
        }

        const currentX = this.toScreenX(this.airplane.x);
        const currentY = this.toScreenY(this.airplane.y);

        // 鳥のアニメーション
        this.birdCarryEvent.wingFlap += 0.3;

        if (!this.birdCarryEvent.carryStarted) {
            // フェーズ1: 鳥が紙飛行機に近づく
            if (progress < 0.3) {
                const approachProgress = progress / 0.3;
                this.birdCarryEvent.birdX = (this.canvas.width + 50) + (currentX - (this.canvas.width + 50)) * approachProgress;
                this.birdCarryEvent.birdY = (this.toScreenY(this.airplane.y) - 50) + ((currentY - 30) - (this.toScreenY(this.airplane.y) - 50)) * approachProgress;
            } else {
                // 紙飛行機に到達
                this.birdCarryEvent.carryStarted = true;
                this.birdCarryEvent.birdX = currentX;
                this.birdCarryEvent.birdY = currentY - 30;
                console.log('【鳥の持ち去りイベント】鳥が紙飛行機をキャッチしました');
            }
        } else {
            // フェーズ2: 鳥が紙飛行機を持って上昇
            const carryProgress = (progress - 0.3) / 0.7;
            this.birdCarryEvent.birdX = currentX + Math.sin(elapsed * 0.003) * 10; // 軽い横揺れ
            this.birdCarryEvent.birdY = currentY - 30 - carryProgress * 200; // 上昇

            // 紙飛行機も一緒に移動
            this.airplane.x = this.toLogicalX(this.birdCarryEvent.birdX);
            this.airplane.y = this.toLogicalY(this.birdCarryEvent.birdY + 30);
            this.airplane.vx = 0; // 物理挙動を停止
            this.airplane.vy = 0;
        }

        // 鳥を描画
        this.drawBird(this.birdCarryEvent.birdX, this.birdCarryEvent.birdY);

        // イベントテキスト表示
        this.ctx.save();
        this.ctx.font = '24px Arial Black';
        this.ctx.fillStyle = '#FF6B35';
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        if (!this.birdCarryEvent.carryStarted) {
            this.ctx.strokeText('🐦 鳥が近づいてきました！', this.canvas.width / 2, 50);
            this.ctx.fillText('🐦 鳥が近づいてきました！', this.canvas.width / 2, 50);
        } else {
            this.ctx.strokeText('🐦 鳥に持ち去られました！', this.canvas.width / 2, 50);
            this.ctx.fillText('🐦 鳥に持ち去られました！', this.canvas.width / 2, 50);
        }
        this.ctx.restore();
    }

    // 鳥を描画
    drawBird(x, y) {
        this.ctx.save();
        this.ctx.translate(x, y);        // 翼の羽ばたき角度
        const wingAngle = Math.sin(this.birdCarryEvent.wingFlap) * 0.5;

        // 体
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // 頭
        this.ctx.fillStyle = '#654321';
        this.ctx.beginPath();
        this.ctx.ellipse(-12, -5, 8, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // くちばし
        this.ctx.fillStyle = '#FFA500';
        this.ctx.beginPath();
        this.ctx.moveTo(-20, -5);
        this.ctx.lineTo(-25, -3);
        this.ctx.lineTo(-20, -1);
        this.ctx.closePath();
        this.ctx.fill();

        // 目
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(-15, -7, 2, 0, Math.PI * 2);
        this.ctx.fill();

        // 翼（左）
        this.ctx.fillStyle = '#696969';
        this.ctx.save();
        this.ctx.rotate(wingAngle);
        this.ctx.beginPath();
        this.ctx.ellipse(-5, -10, 20, 8, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        // 翼（右）
        this.ctx.save();
        this.ctx.rotate(-wingAngle);
        this.ctx.beginPath();
        this.ctx.ellipse(-5, 10, 20, 8, 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        // 尾
        this.ctx.fillStyle = '#556B2F';
        this.ctx.beginPath();
        this.ctx.ellipse(15, 0, 12, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    // うんこ突き刺さりイベントを描画
    drawPoopCrashEvent() {
        if (!this.poopCrashEvent.isActive) return;

        const elapsed = Date.now() - this.poopCrashEvent.startTime;
        const progress = elapsed / this.poopCrashEvent.duration;

        if (progress >= 1.0) {
            // イベント終了
            console.log('【うんこ突き刺さりイベント】イベント終了');

            // 飛距離表示を最終距離に戻す
            const finalDistance = Math.max(0, Math.round(this.airplane.x));
            document.getElementById('distanceDisplay').textContent = finalDistance + 'm';

            this.poopCrashEvent.isActive = false;
            this.poopCrashEvent.startTime = 0;
            this.poopCrashEvent.stinkLines = [];
            this.isFlying = false;
            this.updateUIState();
            this.landAirplane();
            return;
        }

        // 紙飛行機をうんこの位置に固定
        this.airplane.x = this.toLogicalX(this.poopCrashEvent.poopX);
        this.airplane.y = this.toLogicalY(this.poopCrashEvent.poopY - 10); // うんこの少し上
        this.airplane.vx = 0;
        this.airplane.vy = 0;
        this.airplane.rotation = Math.PI / 2; // 下向きに刺さった状態

        // 飛距離表示を💩に変更
        document.getElementById('distanceDisplay').textContent = '💩';

        // うんこを描画
        this.drawPoop(this.poopCrashEvent.poopX, this.poopCrashEvent.poopY);

        // 臭い線のアニメーション
        this.drawStinkLines();

        // イベントテキスト表示
        this.ctx.save();
        this.ctx.font = '28px Arial Black';
        this.ctx.fillStyle = '#8B4513';
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const bounceY = Math.sin(elapsed * 0.01) * 5;
        this.ctx.strokeText('💩 うんピーイベント発生！', this.canvas.width / 2, 50 + bounceY);
        this.ctx.fillText('💩 うんピーイベント発生！', this.canvas.width / 2, 50 + bounceY);
        this.ctx.restore();
    }

    // うんこを描画
    drawPoop(x, y) {
        this.ctx.save();
        this.ctx.translate(x, y);

        // 💩絵文字を描画
        this.ctx.font = '60px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('💩', 0, -10);

        this.ctx.restore();
    }    // 臭い線を描画
    drawStinkLines() {
        this.ctx.save();
        this.ctx.strokeStyle = '#90EE90';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';

        for (let line of this.poopCrashEvent.stinkLines) {
            // 線を上向きに移動
            line.offsetY -= line.speed;
            line.opacity -= 0.01;

            if (line.offsetY < -50) {
                // 線がリセットされたら再生成
                line.offsetY = 0;
                line.opacity = 1;
                line.x = this.poopCrashEvent.poopX + (Math.random() - 0.5) * 30;
            }

            this.ctx.globalAlpha = Math.max(0, line.opacity);
            this.ctx.beginPath();
            this.ctx.moveTo(line.x, line.y + line.offsetY);
            this.ctx.quadraticCurveTo(
                line.x + Math.sin(line.offsetY * 0.1) * 10,
                line.y + line.offsetY - 20,
                line.x + Math.sin(line.offsetY * 0.1) * 20,
                line.y + line.offsetY - 40
            );
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    // 論理座標から画面座標への変換（逆変換）
    toLogicalX(screenX) {
        return (screenX - 20) / 5;
    }

    toLogicalY(screenY) {
        return (this.canvas.height - 20 - screenY) / 5;
    }

    // 月への飛行演出を描画
    drawMoonFlightEffect() {
        if (!this.moonFlightEffect.isActive) {
            console.log('【月への飛行演出】非アクティブのため描画スキップ');
            return;
        }

        const elapsed = Date.now() - this.moonFlightEffect.startTime;
        const progress = elapsed / this.moonFlightEffect.duration;

        // 定期的なログ出力（60フレームに1回）
        if (elapsed % 1000 < 16) { // 約1秒ごと
            console.log(`【月への飛行演出】描画実行中 - progress: ${(progress * 100).toFixed(1)}%, phase: ${this.moonFlightEffect.phase}`);
        }

        if (progress >= 1.0) {
            // 月着陸完了 - 地球へ帰るボタンを表示して待機
            if (!this.moonFlightEffect.waitingForReturn) {
                console.log('【月着陸】着陸完了 - 地球へ帰るボタンを表示');
                this.showReturnToEarthButton();

                // 着陸データを設定
                this.airplane.x = 384400000; // 月までの距離（メートル単位）
                this.airplane.y = 384400000; // 高度も月までの距離に設定
                this.maxHeight = 384400000; // 最高高度も更新
                this.eventSequenceActive = false;
                this.isFlying = false; // 飛行状態を終了
                this.updateUIState(); // UI更新
            }

            // ボタンが押されるまでは演出を継続
            if (!this.moonFlightEffect.waitingForReturn) {
                return;
            }
        }

        // フェーズ管理
        if (this.moonFlightEffect.phase === 'flight' && progress > 0.6) {
            this.moonFlightEffect.phase = 'landing';
            this.moonFlightEffect.landingStartTime = Date.now();

            // 回転効果音を再生（一度だけ）
            if (!this.moonFlightEffect.spinSoundPlayed) {
                this.createMoonSpinSound();
                this.moonFlightEffect.spinSoundPlayed = true;
            }

        } else if (this.moonFlightEffect.phase === 'landing' && progress > 0.85) {
            this.moonFlightEffect.phase = 'landed';

            // 着陸効果音を再生（一度だけ）
            if (!this.moonFlightEffect.landingSoundPlayed) {
                this.createMoonLandingSound();
                this.moonFlightEffect.landingSoundPlayed = true;
            }
        }

        // 夜空の背景
        this.ctx.save();
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#000428');
        gradient.addColorStop(1, '#004e92');
        const bgAlpha = this.moonFlightEffect.phase === 'landed' ? 1.0 : progress;
        this.ctx.globalAlpha = bgAlpha;
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 星を描画
        this.moonFlightEffect.stars.forEach(star => {
            const twinkle = Math.sin(elapsed * 0.005 + star.twinkle);
            const starAlpha = this.moonFlightEffect.phase === 'landed' ? (0.5 + 0.5 * twinkle) : progress * (0.5 + 0.5 * twinkle);
            this.ctx.globalAlpha = starAlpha;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // 月の描画（フェーズに応じてサイズと位置を調整）
        let moonRadius, moonX, moonY;

        if (this.moonFlightEffect.phase === 'flight') {
            // 飛行中：小さな月
            moonRadius = 40;
            moonX = this.moonFlightEffect.moonX;
            moonY = this.moonFlightEffect.moonY;
        } else if (this.moonFlightEffect.phase === 'landing') {
            // 着陸中：月が大きくなり、中央に移動
            const landingProgress = (progress - 0.6) / 0.25; // 0.6-0.85の範囲を0-1に正規化
            moonRadius = 40 + landingProgress * 120; // 40から160に拡大
            moonX = this.moonFlightEffect.moonX - landingProgress * (this.moonFlightEffect.moonX - this.canvas.width / 2);
            moonY = this.moonFlightEffect.moonY + landingProgress * (this.canvas.height / 2 - this.moonFlightEffect.moonY);
        } else {
            // 着陸後：大きな月面
            moonRadius = 160;
            moonX = this.canvas.width / 2;
            moonY = this.canvas.height / 2;
        }

        // 透明度の設定：着陸後は完全に不透明にする
        const moonAlpha = this.moonFlightEffect.phase === 'landed' ? 1.0 : progress;
        this.ctx.globalAlpha = moonAlpha;
        this.ctx.fillStyle = '#f5f5dc';
        this.ctx.beginPath();
        this.ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // 月のクレーター（サイズに応じて調整）
        const craterScale = moonRadius / 40;
        this.ctx.fillStyle = '#d3d3d3';

        // 大きなクレーター
        this.ctx.beginPath();
        this.ctx.arc(moonX - 10 * craterScale, moonY - 8 * craterScale, 6 * craterScale, 0, Math.PI * 2);
        this.ctx.fill();

        // 中くらいのクレーター
        this.ctx.beginPath();
        this.ctx.arc(moonX + 12 * craterScale, moonY + 5 * craterScale, 4 * craterScale, 0, Math.PI * 2);
        this.ctx.fill();

        // 小さなクレーター
        this.ctx.beginPath();
        this.ctx.arc(moonX - 5 * craterScale, moonY + 15 * craterScale, 3 * craterScale, 0, Math.PI * 2);
        this.ctx.fill();

        // 着陸フェーズ以降でさらに詳細なクレーターを追加
        if (this.moonFlightEffect.phase !== 'flight') {
            this.ctx.fillStyle = '#c0c0c0';

            // 追加のクレーター
            this.ctx.beginPath();
            this.ctx.arc(moonX + 20 * craterScale, moonY - 15 * craterScale, 2 * craterScale, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.arc(moonX - 18 * craterScale, moonY + 8 * craterScale, 2.5 * craterScale, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.arc(moonX + 8 * craterScale, moonY + 20 * craterScale, 1.5 * craterScale, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // 紙飛行機の描画（フェーズに応じて）
        if (this.moonFlightEffect.phase === 'flight') {
            // 飛行中：月に向かって移動
            const airplaneProgress = Math.min(progress * 1.67, 1.0); // 飛行フェーズで完了
            const startX = this.toScreenX(this.airplane.x);
            const startY = this.toScreenY(this.airplane.y);
            const targetX = moonX - 30;
            const targetY = moonY;

            const currentX = startX + (targetX - startX) * airplaneProgress;
            const currentY = startY + (targetY - startY) * airplaneProgress;

            const angle = Math.atan2(targetY - startY, targetX - startX);
            this.ctx.globalAlpha = progress;
            this.drawAirplane(currentX, currentY, angle);

        } else if (this.moonFlightEffect.phase === 'landing') {
            // 着陸中：月面に向かって降下
            const landingProgress = (progress - 0.6) / 0.25;
            const startX = moonX - 30;
            const startY = moonY;
            const targetX = moonX;
            const targetY = moonY + moonRadius - 15; // 月面に着陸

            const currentX = startX + (targetX - startX) * landingProgress;
            const currentY = startY + (targetY - startY) * landingProgress;

            // 着陸時は機体を水平に
            const angle = -landingProgress * Math.PI / 6; // 徐々に水平に
            this.ctx.globalAlpha = progress;
            this.drawAirplane(currentX, currentY, angle);

            // 着陸エフェクト（月の砂煙）
            if (landingProgress > 0.7) {
                this.drawMoonDustEffect(currentX, currentY, landingProgress);
            }

        } else if (this.moonFlightEffect.phase === 'landed') {
            // 着陸後：月面に静止
            const landedX = moonX;
            const landedY = moonY + moonRadius - 15;

            this.ctx.globalAlpha = 1.0; // 着陸後は完全に不透明
            this.drawAirplane(landedX, landedY, 0); // 水平に静止

            // 着陸完了エフェクト
            this.drawLandingCompleteEffect(landedX, landedY);
        }

        // テキスト表示（フェーズに応じて）
        if (this.moonFlightEffect.phase === 'flight' && progress > 0.3) {
            const textAlpha = Math.min((progress - 0.3) / 0.3, 1.0);
            this.ctx.globalAlpha = textAlpha;
            this.ctx.font = '48px Arial Black';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.strokeStyle = '#FF4500';
            this.ctx.lineWidth = 3;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            this.ctx.strokeText('TO THE MOON!', this.canvas.width / 2, this.canvas.height / 4);
            this.ctx.fillText('TO THE MOON!', this.canvas.width / 2, this.canvas.height / 4);

        } else if (this.moonFlightEffect.phase === 'landing') {
            this.ctx.globalAlpha = progress;
            this.ctx.font = '36px Arial Black';
            this.ctx.fillStyle = '#87CEEB';
            this.ctx.strokeStyle = '#4682B4';
            this.ctx.lineWidth = 2;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            this.ctx.strokeText('月面着陸中...', this.canvas.width / 2, this.canvas.height / 4);
            this.ctx.fillText('月面着陸中...', this.canvas.width / 2, this.canvas.height / 4);

        } else if (this.moonFlightEffect.phase === 'landed') {
            this.ctx.globalAlpha = 1.0; // 着陸後は完全に不透明
            this.ctx.font = '42px Arial Black';
            this.ctx.fillStyle = '#32CD32';
            this.ctx.strokeStyle = '#228B22';
            this.ctx.lineWidth = 3;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            this.ctx.strokeText('🌙 月面着陸成功！ 🌙', this.canvas.width / 2, this.canvas.height / 4);
            this.ctx.fillText('🌙 月面着陸成功！ 🌙', this.canvas.width / 2, this.canvas.height / 4);

            // サブテキスト
            this.ctx.font = '24px Arial';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1;

            this.ctx.strokeText('人類史上初の紙飛行機月面着陸', this.canvas.width / 2, this.canvas.height / 3);
            this.ctx.fillText('人類史上初の紙飛行機月面着陸', this.canvas.width / 2, this.canvas.height / 3);

            // 帰還ボタンが表示されている場合の案内メッセージ
            if (this.moonFlightEffect.waitingForReturn) {
                this.ctx.font = '20px Arial';
                this.ctx.fillStyle = '#FFD700';
                this.ctx.strokeStyle = '#FFA500';
                this.ctx.lineWidth = 1;

                this.ctx.strokeText('地球へ帰るボタンを押してください', this.canvas.width / 2, this.canvas.height * 2 / 3);
                this.ctx.fillText('地球へ帰るボタンを押してください', this.canvas.width / 2, this.canvas.height * 2 / 3);
            }
        }

        this.ctx.restore();
    }

    // 月の砂煙エフェクトを描画
    drawMoonDustEffect(centerX, centerY, progress) {
        const dustParticles = 12;
        const maxRadius = 30;

        this.ctx.save();

        for (let i = 0; i < dustParticles; i++) {
            const angle = (i / dustParticles) * Math.PI * 2;
            const distance = progress * maxRadius * (0.5 + Math.random() * 0.5);
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance * 0.3; // 平たく広がる

            const alpha = Math.max(0, 1 - progress * 1.5);
            this.ctx.globalAlpha = alpha * 0.6;
            this.ctx.fillStyle = '#D3D3D3';

            const size = 2 + Math.random() * 3;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    // 着陸完了エフェクトを描画
    drawLandingCompleteEffect(centerX, centerY) {
        const time = Date.now() * 0.01;

        this.ctx.save();

        // 成功の光輪エフェクト
        for (let i = 0; i < 3; i++) {
            const radius = 25 + i * 15 + Math.sin(time + i) * 5;
            const alpha = 0.3 - i * 0.1 + Math.sin(time * 2 + i) * 0.1;

            this.ctx.globalAlpha = Math.max(0, alpha);
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // きらめきエフェクト
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + time * 0.5;
            const distance = 40 + Math.sin(time * 3 + i) * 10;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;

            const alpha = 0.7 + Math.sin(time * 4 + i) * 0.3;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#FFFFFF';

            // 星型のきらめき
            this.drawStar(x, y, 3, 2);
        }

        this.ctx.restore();
    }

    // 星型を描画するヘルパーメソッド
    drawStar(x, y, outerRadius, innerRadius) {
        const spikes = 4;
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;

        this.ctx.beginPath();
        this.ctx.moveTo(x, y - outerRadius);

        for (let i = 0; i < spikes; i++) {
            const xOuter = x + Math.cos(rot) * outerRadius;
            const yOuter = y + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(xOuter, yOuter);
            rot += step;

            const xInner = x + Math.cos(rot) * innerRadius;
            const yInner = y + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(xInner, yInner);
            rot += step;
        }

        this.ctx.lineTo(x, y - outerRadius);
        this.ctx.closePath();
        this.ctx.fill();
    }

    // 地面を描画
    drawGround() {
        this.ctx.fillStyle = '#90EE90';
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);

        // x軸（距離）の目盛りを描画
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 1;
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#333';

        for (let i = 20; i <= this.canvas.width; i += 25) { // 20pxから開始、25px = 5m間隔
            this.ctx.beginPath();
            this.ctx.moveTo(i, this.canvas.height - 20);
            this.ctx.lineTo(i, this.canvas.height - 10);
            this.ctx.stroke();

            if ((i - 20) % 50 === 0) { // 50px = 10m間隔でラベル
                this.ctx.fillText((i - 20) / 5 + 'm', i + 2, this.canvas.height - 5);
            }
        }

        // y軸（高度）の目盛りを描画
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 1;

        // 地面から上方向に目盛りを描画
        const groundLevel = this.canvas.height - 20; // 地面レベルを20px上に
        for (let i = 0; i <= groundLevel; i += 25) { // 25px = 5m間隔
            const y = groundLevel - i;
            this.ctx.beginPath();
            this.ctx.moveTo(20, y); // x軸の開始位置に合わせる
            this.ctx.lineTo(30, y);
            this.ctx.stroke();

            if (i % 50 === 0 && i > 0) { // 50px = 10m間隔でラベル
                const heightInMeters = Math.round(i / 5);
                this.ctx.fillText(heightInMeters + 'm', 32, y + 4);
            }
        }
    }

    // 紙飛行機を描画
    drawAirplane(x, y, rotation) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);

        // 紙飛行機の形状
        this.ctx.fillStyle = '#FFD700';
        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();
        this.ctx.moveTo(15, 0);      // 先端
        this.ctx.lineTo(-10, -8);    // 上の翼
        this.ctx.lineTo(-8, 0);      // 胴体中央
        this.ctx.lineTo(-10, 8);     // 下の翼
        this.ctx.closePath();

        this.ctx.fill();
        this.ctx.stroke();

        // 機体の詳細
        this.ctx.strokeStyle = '#FF8C00';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(5, 0);
        this.ctx.lineTo(-5, 0);
        this.ctx.stroke();

        this.ctx.restore();
    }

    // 角度を設定
    setAngle(angle) {
        const originalAngle = angle;

        // 特定の条件（角度77、強さ7、重心7）の場合はブレを発生させない
        if (angle === 77 && this.power === 7 && this.balance === 7) {
            console.log(`特定条件(77-7-7)検出: ブレなしで角度を設定します`);
            this.angle = angle;
            this.updateDisplay();
            this.blurInfo.hasBlur = false;
            this.pendingSpecialCondition.angle77Set = false;
            this.pendingSpecialCondition.needsRecheck = false;
            return;
        }

        // 角度77が設定された場合、後で条件をチェックできるようにフラグを立てる
        if (angle === 77) {
            this.pendingSpecialCondition.angle77Set = true;
            this.pendingSpecialCondition.needsRecheck = true;
            this.pendingSpecialCondition.originalAngle = angle; // 元の角度値を保存
            console.log(`角度77が設定されました。後で特定条件(77-7-7)をチェックします`);
        } else {
            this.pendingSpecialCondition.angle77Set = false;
            this.pendingSpecialCondition.needsRecheck = false;
            this.pendingSpecialCondition.originalAngle = 0;
        }

        console.log(`setAngle実行: 角度=${angle}, 強さ=${this.power}, 重心=${this.balance}`);

        // 重心5の場合は角度設定時のブレも2度未満に制限
        let randomBlur;
        if (this.balance === 5) {
            // 重心5: パワーに関係なく最大±1.99度のブレ
            randomBlur = (Math.random() - 0.5) * 2 * 1.99;
            console.log(`【重心5角度設定】パワー${this.power}でも角度ブレ${randomBlur.toFixed(2)}度（パワー無関係）`);
        } else {
            // 投げる強さに応じたブレを計算
            // 強さ10で最大±25度、強さに比例してブレが大きくなる
            const maxBlur = 25; // 最大ブレ角度
            const blurAmount = (this.power / 10) * maxBlur; // 強さに比例したブレ量

            // 重心による方向性の調整
            // balance: 1(前重心) → 上方向寄り, 10(後重心) → 下方向寄り
            // 5が中央で方向性なし
            const balanceBias = (5.5 - this.balance) / 4.5; // -1 ～ +1 の範囲 (+1:上方向寄り, -1:下方向寄り)

            // ランダムブレ + 重心によるバイアス
            const randomComponent = (Math.random() - 0.5) * 2; // -1 ～ +1
            const biasedRandom = randomComponent + (balanceBias * 0.6); // バイアスを60%の強度で適用
            randomBlur = biasedRandom * blurAmount; // 最終的なブレ角度
        }

        // ブレを適用した角度
        const blurredAngle = angle + randomBlur;

        // 0-90度の範囲に制限
        this.angle = Math.max(0, Math.min(90, blurredAngle));
        this.updateDisplay();

        // ブレ情報を保存（結果表示用）
        if (Math.abs(randomBlur) > 1) { // 1度以上のブレがある場合
            let balanceDirection;
            if (this.balance === 5) {
                balanceDirection = '重心5制限';
            } else {
                const balanceBias = (5.5 - this.balance) / 4.5;
                balanceDirection = balanceBias > 0.2 ? '上方向寄り' : balanceBias < -0.2 ? '下方向寄り' : '';
            }
            this.blurInfo = {
                hasBlur: true,
                originalAngle: originalAngle,
                actualAngle: this.angle,
                blurAmount: randomBlur,
                direction: balanceDirection
            };
        } else {
            this.blurInfo.hasBlur = false;
        }

        // 範囲外の値が入力された場合の画面メッセージ
        if (originalAngle !== angle || blurredAngle < 0 || blurredAngle > 90) {
            let message = '';
            if (originalAngle > 90) {
                message = `投げる角度 ${originalAngle}° は最大値90°を超えています。`;
            } else if (originalAngle < 0) {
                message = `投げる角度 ${originalAngle}° は最小値0°を下回っています。`;
            }
            if (message) {
                this.showMessage(message, 'warning');
            }
        }

        console.log(`角度を${this.angle.toFixed(1)}度に設定しました（入力値: ${originalAngle}、ブレ: ${randomBlur.toFixed(1)}°${this.balance === 5 ? '、重心5特別制限' : '、重心バイアス: ' + ((5.5 - this.balance) / 4.5).toFixed(2)}）`);
    }

    // 強さを設定
    setPower(power) {
        const originalPower = power;
        this.power = Math.max(1, Math.min(10, power)); // 1-10の範囲に厳密に制限
        this.updateDisplay();

        // 特定条件（角度77、強さ7、重心7）のチェック
        this.checkSpecialCondition();

        // 範囲外の値が入力された場合の画面メッセージ
        if (originalPower !== this.power) {
            let message = '';
            if (originalPower > 10) {
                message = `投げる強さ ${originalPower} は最大値10を超えています。10に調整されました。`;
            } else if (originalPower < 1) {
                message = `投げる強さ ${originalPower} は最小値1を下回っています。1に調整されました。`;
            }

            // 画面にメッセージを表示
            this.showMessage(message, 'warning');
        }

        console.log(`強さを${this.power}に設定しました（入力値: ${originalPower}）`);
    }

    // 重心を設定
    setBalance(balance) {
        const originalBalance = balance;
        this.balance = Math.max(1, Math.min(10, balance));
        this.updateDisplay();

        // 特定条件（角度77、強さ7、重心7）のチェック
        this.checkSpecialCondition();

        // 範囲外の値が入力された場合の画面メッセージ
        if (originalBalance !== this.balance) {
            let message = '';
            if (originalBalance > 10) {
                message = `重心 ${originalBalance} は最大値10を超えています。10に調整されました。`;
            } else if (originalBalance < 1) {
                message = `重心 ${originalBalance} は最小値1を下回っています。1に調整されました。`;
            }
            this.showMessage(message, 'warning');
        }

        console.log(`重心を${this.balance}に設定しました（入力値: ${originalBalance}）`);
    }

    // 特定条件（角度77、強さ7、重心7）のチェックと処理
    checkSpecialCondition() {
        console.log(`checkSpecialCondition呼び出し: angle77Set=${this.pendingSpecialCondition.angle77Set}, needsRecheck=${this.pendingSpecialCondition.needsRecheck}, 現在の値: 角度=${this.angle}, 強さ=${this.power}, 重心=${this.balance}`);

        // 角度77が設定されていて、かつ再チェックが必要な場合のみ処理
        if (this.pendingSpecialCondition.angle77Set && this.pendingSpecialCondition.needsRecheck) {
            if (this.pendingSpecialCondition.originalAngle === 77 && this.power === 7 && this.balance === 7) {
                console.log(`特定条件(77-7-7)達成: 角度を77度に再設定し、ブレをリセット`);
                this.angle = 77; // ブレなしで角度を再設定
                this.blurInfo.hasBlur = false;
                this.pendingSpecialCondition.angle77Set = false;
                this.pendingSpecialCondition.needsRecheck = false;
                this.pendingSpecialCondition.originalAngle = 0;
                this.updateDisplay();
            }
        }
    }

    // 論理座標を画面座標に変換
    toScreenX(logicalX) {
        return logicalX * 5 + 20; // 論理座標をピクセルに変換（5倍）+ 最小限のオフセット（20px = 4m）
    }

    toScreenY(logicalY) {
        return this.canvas.height - 20 - logicalY * 5; // y軸は上方向が正、地面レベルを少し上に（20px = 4m）
    }

    // パラメーター表示を更新
    updateDisplay() {
        document.getElementById('angleDisplay').textContent = this.angle.toFixed(1);
        document.getElementById('powerDisplay').textContent = this.power;
        document.getElementById('balanceDisplay').textContent = this.balance;
        // 飛行距離と最高高度は飛行結果でのみ更新するため、ここではリセットしない
    }

    // 画面にメッセージを表示
    showMessage(message, type = 'info', options = {}) {
        // 既存のメッセージ要素があれば削除
        const existingMessage = document.getElementById('gameMessage');
        if (existingMessage) {
            existingMessage.remove();
        }

        // メッセージ要素を作成
        const messageDiv = document.createElement('div');
        messageDiv.id = 'gameMessage';

        // 閉じるボタンを追加するかどうか
        const showCloseButton = options.showCloseButton || false;
        const autoClose = options.autoClose !== false; // デフォルトは自動で閉じる

        // メッセージコンテンツを作成
        let messageContent = message.replace(/\n/g, '<br>');

        if (showCloseButton) {
            messageContent += '<br><br><button id="closeMessageBtn" style="background: rgba(255,255,255,0.2); border: 1px solid white; color: white; padding: 8px 16px; border-radius: 15px; cursor: pointer; font-size: 12px; margin-top: 10px;">閉じる</button>';
        }

        messageDiv.innerHTML = messageContent;

        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'warning' ? '#ff6b6b' : type === 'error' ? '#ff4757' : type === 'final' ? '#27ae60' : '#4834d4'};
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            font-weight: bold;
            z-index: 1000;
            max-width: 80%;
            text-align: center;
            font-size: 16pt;
            animation: slideDown 0.3s ease-out;
            ${!showCloseButton ? 'cursor: pointer;' : ''}
            line-height: 1.5;
        `;

        // CSSアニメーションを追加
        if (!document.getElementById('messageAnimation')) {
            const style = document.createElement('style');
            style.id = 'messageAnimation';
            style.textContent = `
                @keyframes slideDown {
                    from {
                        transform: translateX(-50%) translateY(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        // メッセージを画面に追加
        document.body.appendChild(messageDiv);

        // 閉じる機能の設定
        const closeMessage = () => {
            messageDiv.style.animation = 'fadeOut 0.5s ease-out';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 500);
        };

        // 閉じるボタンのイベントリスナー
        if (showCloseButton) {
            const closeBtn = messageDiv.querySelector('#closeMessageBtn');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // バブリングを防止
                    closeMessage();
                });
            }
        } else {
            // クリックで閉じる機能（閉じるボタンがない場合のみ）
            messageDiv.addEventListener('click', closeMessage);
        }

        // 自動で閉じる設定
        if (autoClose) {
            const autoCloseTime = message.includes('飛行距離:') ? 8000 : 3000;
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    closeMessage();
                }
            }, autoCloseTime);
        }
    }

    // 紙飛行機を飛ばす
    async throwAirplane() {
        // イベントシーケンス実行中は飛行機を飛ばせない
        if (this.eventSequenceActive) {
            console.log('イベントシーケンス実行中のため飛行できません');
            this.showMessage('月着陸イベント実行中です。しばらくお待ちください...', 'warning');
            return;
        }

        if (this.isFlying) {
            console.log('既に飛行中です');
            this.showMessage('既に飛行中です。リセットしてから再度お試しください。', 'warning');
            return;
        }

        // AudioContextを確実に初期化してから効果音を再生
        console.log('効果音システム状態チェック - soundEnabled:', this.soundEnabled, 'audioContext:', !!this.audioContext);
        await this.ensureAudioContext();
        console.log('ensureAudioContext後 - audioContext:', !!this.audioContext, 'state:', this.audioContext?.state);

        // AudioContext初期化後に少し待機（初回のみ）
        if (this.audioContext.currentTime < 0.1) {
            console.log('初回AudioContext - 安定化のため少し待機');
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // 投げる音を再生
        this.createSound('throw');

        // 新しい飛行のためにイベントフラグをリセット
        this.birdCarryEvent.heightTriggered = false;
        this.birdCarryEvent.completed = false;
        this.poopCrashEvent.crashTriggered = false;
        console.log('【イベントフラグリセット】新しい飛行のためにイベントフラグをリセットしました');

        // パラメーターの最終確認と制限
        const originalPower = this.power;
        const originalAngle = this.angle;
        const originalBalance = this.balance;

        this.power = Math.max(1, Math.min(10, this.power));
        this.angle = Math.max(0, Math.min(90, this.angle));
        this.balance = Math.max(1, Math.min(10, this.balance));

        // 飛行時に調整された値がある場合のメッセージ
        let adjustments = [];
        if (originalPower !== this.power) {
            adjustments.push(`強さ: ${originalPower} → ${this.power}`);
        }
        if (originalAngle !== this.angle) {
            adjustments.push(`角度: ${originalAngle}° → ${this.angle}°`);
        }
        if (originalBalance !== this.balance) {
            adjustments.push(`重心: ${originalBalance} → ${this.balance}`);
        }

        if (adjustments.length > 0) {
            this.showMessage(`パラメーターを調整しました: ${adjustments.join(', ')}`, 'warning');
        }

        console.log(`角度${this.angle.toFixed(1)}度、強さ${this.power}、重心${this.balance}で紙飛行機を飛ばします`);

        // 最高高度をリセット
        this.maxHeight = 0;

        // 鳥イベントをリセット
        this.birdCarryEvent.isActive = false;
        this.birdCarryEvent.heightTriggered = false;
        this.birdCarryEvent.carryStarted = false;
        this.birdCarryEvent.startTime = 0;

        // 初期位置と速度を計算
        const startX = 0;
        const startY = 0;

        // パワーによる発射角度のブレを計算
        const powerBlur = this.calculatePowerBlur();
        const actualAngle = this.angle + powerBlur;
        const radians = (actualAngle * Math.PI) / 180;
        const initialVelocity = this.power * 0.6; // 0.5から0.6に微増して適切な飛距離を確保

        // ブレが発生した場合のログ出力
        if (Math.abs(powerBlur) > 0.1) {
            let limitInfo = '';
            if (this.balance === 5) {
                limitInfo = ` (重心5特別制限: パワー無関係で±2°未満)`;
            } else {
                const maxBlurLimit = this.getMaxBlurByBalance();
                limitInfo = maxBlurLimit < 10 ? ` (重心${this.balance}制限: ±${maxBlurLimit}°)` : '';
            }
            console.log(`パワーによる角度ブレ: 設定角度${this.angle}° → 実際角度${actualAngle.toFixed(1)}° (ブレ: ${powerBlur.toFixed(1)}°)${limitInfo}`);
        }

        // 重心による飛行特性の変化
        const balanceEffect = this.calculateBalanceEffect();

        this.airplane = {
            x: startX,
            y: startY,
            vx: Math.cos(radians) * initialVelocity * balanceEffect.velocityMultiplier,
            vy: Math.sin(radians) * initialVelocity * balanceEffect.velocityMultiplier, // 上方向が正になるよう修正
            rotation: -radians,
            trail: [],
            stability: balanceEffect.stability,
            liftCoefficient: balanceEffect.liftCoefficient
        };

        this.isFlying = true;
        this.flightStartTime = Date.now(); // 飛行開始時刻を記録
        this.animate();
    }

    // 重心による飛行効果を計算
    calculateBalanceEffect() {
        // 重心位置 1-10を0-1の範囲に正規化（5が中央=0.5）
        const normalizedBalance = (this.balance - 1) / 9;

        let effect = {
            velocityMultiplier: 1.0,
            stability: 1.0,
            liftCoefficient: 1.0
        };

        if (normalizedBalance < 0.5) {
            // 前重心（1-4）: 速度は上がるが安定性が下がる
            const frontHeaviness = (0.5 - normalizedBalance) * 2; // 0-1の範囲
            effect.velocityMultiplier = 1.0 + frontHeaviness * 0.08; // 0.15から0.08に減少（最大1.08倍）
            effect.stability = 1.0 - frontHeaviness * 0.3; // 0.4から0.3に減少
            effect.liftCoefficient = 1.0 - frontHeaviness * 0.05; // 0.1から0.05に減少（最小0.95倍）
        } else if (normalizedBalance > 0.5) {
            // 後重心（6-10）: 安定性は上がるが速度が下がる
            const backHeaviness = (normalizedBalance - 0.5) * 2; // 0-1の範囲
            effect.velocityMultiplier = 1.0 - backHeaviness * 0.05; // 0.1から0.05に減少（最小0.95倍）
            effect.stability = 1.0 + backHeaviness * 0.4; // 安定性は維持
            effect.liftCoefficient = 1.0 + backHeaviness * 0.08; // 0.15から0.08に減少（最大1.08倍）
        }
        // 中央重心（5）: バランスが良い（デフォルト値）

        return effect;
    }

    // パワーと重心による発射角度のブレを計算
    calculatePowerBlur() {
        // 重心5の場合は投げる強さに関わらず常に2度未満に制限
        if (this.balance === 5) {
            // 重心5専用：パワーに関係なく最大±1.99度のブレ
            const blur = (Math.random() - 0.5) * 2 * 1.99; // ±1.99度の範囲
            console.log(`【重心5特別処理】パワー${this.power}でもブレ${blur.toFixed(2)}度（パワー無関係）`);
            return blur;
        }

        // 重心5以外の場合の通常処理
        // パワーが大きいほどブレが大きくなる
        // パワー1: ほぼブレなし、パワー10: 最大ブレ
        const basePowerRatio = (this.power - 1) / 9; // 0-1の範囲に正規化

        // 重心による影響を計算（前重心ほどブレが大きい）
        // 重心1（前重心）: 1.5倍、重心5（中央）: 1.0倍、重心10（後重心）: 0.5倍
        const balanceEffect = this.calculateBalanceBlurEffect();

        // 基本最大ブレ角度（度）
        const maxBlur = 5;

        // パワーと重心を組み合わせた最終的なブレ範囲
        const blurRange = maxBlur * basePowerRatio * balanceEffect;

        // ランダムなブレを生成（-blurRange から +blurRange の範囲）
        let blur = (Math.random() - 0.5) * 2 * blurRange;

        // 重心による最大ブレ制限を適用（重心5以外）
        const maxBlurByBalance = this.getMaxBlurByBalance();
        blur = Math.max(-maxBlurByBalance, Math.min(maxBlurByBalance, blur));

        return blur;
    }

    // 重心による最大ブレ制限を取得
    getMaxBlurByBalance() {
        if (this.balance === 5) {
            return 2; // 重心5: 最大2度未満
        } else if (this.balance === 4 || this.balance === 6) {
            return 5; // 重心4,6: 最大5度未満
        } else {
            return 10; // その他: 制限なし（従来通り）
        }
    }

    // 重心による角度ブレ効果を計算
    calculateBalanceBlurEffect() {
        // 重心5の場合はこの効果を無効化（パワーのみに依存させるため）
        if (this.balance === 5) {
            return 1.0; // 中立的な効果（影響なし）
        }

        // 重心値を0-1の範囲に正規化（1が前重心、10が後重心）
        const normalizedBalance = (this.balance - 1) / 9;

        // 前重心ほど不安定（ブレが大きい）
        // 重心1: 1.5倍、重心5: 1.0倍、重心10: 0.5倍
        const effect = 1.5 - normalizedBalance * 1.0; // 1.5から0.5の範囲

        return Math.max(0.5, Math.min(1.5, effect)); // 0.5-1.5の範囲に制限
    }

    // アニメーション
    animate() {
        // アニメーション時間を更新（乱気流の動的効果用）
        this.animationTime++;

        // UI状態を定期的に更新（60フレームに1回）
        if (this.animationTime % 60 === 0) {
            this.updateUIState();
        }

        if (!this.isFlying || !this.airplane) {
            // 飛行中でなくても背景を更新（乱気流のアニメーション）
            // ただし、月への飛行演出中は続行
            if (this.moonFlightEffect.isActive) {
                console.log('【アニメーション】月への飛行演出中 - 継続実行');
                // 月への飛行演出中のログ（60フレームに1回）
                if (this.animationTime % 60 === 0) {
                    const elapsed = Date.now() - this.moonFlightEffect.startTime;
                    const progress = elapsed / this.moonFlightEffect.duration;
                    console.log(`【月への飛行演出中】progress: ${(progress * 100).toFixed(1)}%, phase: ${this.moonFlightEffect.phase}`);
                }

                this.drawBackground();
                this.drawGround();
                this.drawMoonFlightEffect();
                this.animationId = requestAnimationFrame(() => this.animate());
                return;
            }

            this.drawBackground();
            this.drawGround();
            this.animationId = requestAnimationFrame(() => this.animate());
            return;
        }

        // 鳥の持ち去りイベント処理
        if (this.birdCarryEvent.isActive) {
            // 60フレームに1回だけログ出力（頻度制限で安定性確保）
            if (this.animationTime % 60 === 0) {
                console.log('【アニメーション】鳥イベント処理中');
            }
            this.drawBackground();
            this.drawGround();
            this.drawAirplane(this.toScreenX(this.airplane.x), this.toScreenY(this.airplane.y), this.airplane.rotation);
            this.drawBirdCarryEvent();
            this.animationId = requestAnimationFrame(() => this.animate());
            return;
        }

        // うんこ突き刺さりイベント処理
        if (this.poopCrashEvent.isActive) {
            this.drawBackground();
            this.drawGround();
            this.drawAirplane(this.toScreenX(this.airplane.x), this.toScreenY(this.airplane.y), this.airplane.rotation);
            this.drawPoopCrashEvent();
            this.animationId = requestAnimationFrame(() => this.animate());
            return;
        }

        // 特殊イベントの回転アニメーション処理
        if (this.isSpecialEventAnimating) {
            this.handleSpecialEventAnimation();
            // 回転アニメーション中は物理演算をスキップ
            this.animationId = requestAnimationFrame(() => this.animate());
            return;
        }

        // 特殊イベント後の飛行中の定期ログ（60フレームに1回）
        if (this.specialEventTriggered && this.animationTime % 60 === 0) {
            console.log(`【特殊イベント飛行中】x=${this.airplane.x.toFixed(1)}, y=${this.airplane.y.toFixed(1)}, vx=${this.airplane.vx.toFixed(2)}, vy=${this.airplane.vy.toFixed(2)}`);
        }

        // 通常の物理演算（重心効果を考慮）
        this.airplane.vy -= this.gravity; // 重力（下方向、y軸が上向き正なので減算）

        // 重心による安定性の影響
        const stabilityFactor = this.airplane.stability || 1.0;
        const liftFactor = this.airplane.liftCoefficient || 1.0;

        // 滑空効果の判定と適用
        const isGlidingCondition = this.balance >= 7 && this.angle < 45; // 後重心かつ45度未満
        const isPastApex = this.airplane.vy < 0; // 頂点を過ぎて下降中
        const shouldGlide = isGlidingCondition && isPastApex;

        if (shouldGlide) {
            // 滑空開始の検出
            if (!this.glidingState.isGliding) {
                this.glidingState.isGliding = true;
                this.glidingState.glidingStartTime = Date.now();
                this.glidingState.glidingMessageShown = false;
            }

            // 滑空効果: 下降速度を緩やかにし、前進速度を維持
            const glideStrength = (this.balance - 6) / 4; // 7-10 → 0.25-1.0の範囲
            const angleBonus = (45 - this.angle) / 45; // 角度が小さいほど滑空効果大
            let baseGlideEffect = glideStrength * angleBonus * 0.15; // 最大15%に変更

            // 確率的制限：13%以上の効果が出る確率を8%以下に制限
            if (baseGlideEffect >= 0.13) {
                const randomChance = Math.random();
                if (randomChance > 0.08) {
                    // 92%の確率で13%未満に制限
                    baseGlideEffect = 0.12 + Math.random() * 0.01; // 12-13%の範囲にランダム調整
                }
                // else: 8%の確率でそのまま13-15%の効果を適用
            }

            const totalGlideEffect = baseGlideEffect;

            // 下降速度を緩和（滑空）
            this.airplane.vy *= (1 - totalGlideEffect);

            // 前進速度をわずかに維持（空気抵抗に対抗）
            this.airplane.vx *= (1 + totalGlideEffect * 0.5);

            // 滑空中は重力の影響も軽減
            this.airplane.vy += this.gravity * totalGlideEffect * 0.5;

            // 滑空メッセージの表示（1秒後に1回だけ）
            const glidingDuration = Date.now() - this.glidingState.glidingStartTime;
            if (glidingDuration > 1000 && !this.glidingState.glidingMessageShown) {
                const effectPercentage = (totalGlideEffect * 100).toFixed(1);
                const isHighEffect = totalGlideEffect >= 0.13;
                const effectType = isHighEffect ? '強力滑空' : '滑空';
                this.showMessage(`${effectType}効果発動！🪂 (効果:${effectPercentage}%, 重心:${this.balance}, 角度:${this.angle.toFixed(1)}°)`, 'info');
                this.glidingState.glidingMessageShown = true;
            }
        } else {
            // 滑空終了
            if (this.glidingState.isGliding) {
                this.glidingState.isGliding = false;
                const glidingDuration = Date.now() - this.glidingState.glidingStartTime;
                console.log(`滑空終了: 滑空時間 ${(glidingDuration / 1000).toFixed(1)}秒`);
            }
        }

        // 安定性が高いほど空気抵抗の影響を受けにくい
        const effectiveAirResistance = this.airResistance + (1 - this.airResistance) * (1 - stabilityFactor) * 0.5;

        this.airplane.vx *= effectiveAirResistance;
        this.airplane.vy *= effectiveAirResistance;

        // リフト効果（重心が後ろだとより長く滞空）
        if (this.airplane.vy < 0) { // 下降中（y軸上向き正なので負の時が下降）
            this.airplane.vy *= (1 - (liftFactor - 1) * 0.1);
        }

        // 乱気流の影響をチェック
        this.checkTurbulenceEffect();

        // 位置更新
        this.airplane.x += this.airplane.vx;
        this.airplane.y += this.airplane.vy;

        // 最高高度を更新（y座標が正の方向（上）に行くほど高度が高くなる）
        const currentHeight = Math.max(0, this.airplane.y); // 論理座標のy値をそのまま高度として使用
        if (currentHeight > this.maxHeight) {
            this.maxHeight = currentHeight;
            document.getElementById('heightDisplay').textContent = Math.round(this.maxHeight) + 'm';
        }

        // 現在の飛行距離をリアルタイム表示
        const currentDistance = Math.max(0, Math.round(this.airplane.x));
        document.getElementById('distanceDisplay').textContent = currentDistance + 'm';

        // 【鳥の持ち去りイベント】飛距離60m時点で高度50m以上チェック（30%の確率で発生）
        if (currentDistance >= 60 && currentHeight >= 50 && !this.birdCarryEvent.heightTriggered && !this.birdCarryEvent.isActive && !this.specialEventTriggered && !this.eventSequenceActive) {
            console.log(`【鳥イベント条件チェック】条件達成 - 距離:${currentDistance}m, 高度:${currentHeight.toFixed(1)}m`);
            // ランダム確率チェック（30%の確率）
            const randomChance = Math.random();
            const eventProbability = 0.3; // 30%の確率

            if (randomChance <= eventProbability) {
                console.log(`【鳥の持ち去りイベント】条件達成&確率成功 - イベント開始 (飛距離: ${currentDistance}m, 高度: ${currentHeight.toFixed(1)}m, 確率: ${(randomChance * 100).toFixed(1)}%)`);
                this.startBirdCarryEvent();
            } else {
                // 確率で外れた場合はフラグを立てて今回は発生させない
                this.birdCarryEvent.heightTriggered = true;
                console.log(`【鳥の持ち去りイベント】条件達成だが確率で不発 - (飛距離: ${currentDistance}m, 高度: ${currentHeight.toFixed(1)}m, 確率: ${(randomChance * 100).toFixed(1)}%)`);
            }
        } else if (currentDistance >= 60 && currentHeight >= 50) {
            // デバッグ用：条件が合わない理由をログ出力
            console.log(`【鳥の持ち去りイベント】条件達成したが他の条件未達成 - 飛距離: ${currentDistance}m, 高度: ${currentHeight.toFixed(1)}m, heightTriggered: ${this.birdCarryEvent.heightTriggered}, isActive: ${this.birdCarryEvent.isActive}, specialEventTriggered: ${this.specialEventTriggered}, eventSequenceActive: ${this.eventSequenceActive}`);
        }

        // 【うんこ突き刺さりイベント】飛距離70m～75m時点で高度10m未満チェック
        if (currentDistance >= 70 && currentDistance <= 75 && currentHeight < 10 && !this.poopCrashEvent.crashTriggered && !this.poopCrashEvent.isActive && !this.birdCarryEvent.isActive && !this.specialEventTriggered && !this.eventSequenceActive) {
            console.log(`【うんこ突き刺さりイベント】条件達成 - イベント開始 (飛距離: ${currentDistance}m, 高度: ${currentHeight.toFixed(1)}m)`);
            this.startPoopCrashEvent();
        } else if (currentDistance >= 70 && currentDistance <= 75 && currentHeight < 10) {
            // デバッグ用：条件が合わない理由をログ出力
            console.log(`【うんこ突き刺さりイベント】条件達成したが他の条件未達成 - 飛距離: ${currentDistance}m, 高度: ${currentHeight.toFixed(1)}m, crashTriggered: ${this.poopCrashEvent.crashTriggered}, isActive: ${this.poopCrashEvent.isActive}, birdActive: ${this.birdCarryEvent.isActive}, specialEventTriggered: ${this.specialEventTriggered}, eventSequenceActive: ${this.eventSequenceActive}`);
        }

        // 回転更新（重心による安定性を考慮）
        const targetRotation = Math.atan2(this.airplane.vy, this.airplane.vx);
        const rotationStability = Math.min(stabilityFactor, 1.5);
        this.airplane.rotation += (targetRotation - this.airplane.rotation) * (0.1 * rotationStability);

        // 軌跡を記録
        this.airplane.trail.push({ x: this.airplane.x, y: this.airplane.y });
        if (this.airplane.trail.length > 20) {
            this.airplane.trail.shift();
        }

        // 画面をクリア
        this.drawBackground();
        this.drawGround();

        // 軌跡を描画
        this.drawTrail();

        // 紙飛行機を描画（論理座標を画面座標に変換）
        this.drawAirplane(this.toScreenX(this.airplane.x), this.toScreenY(this.airplane.y), this.airplane.rotation);

        // 特殊イベント演出を描画（通常飛行中でも表示）
        this.drawSpecialEventEffect();

        // 月への飛行演出を描画
        this.drawMoonFlightEffect();

        // 月への飛行演出中は着地判定をスキップ
        if (this.moonFlightEffect.isActive) {
            this.animationId = requestAnimationFrame(() => this.animate());
            return;
        }

        // 地面に着地（y座標が0以下になった場合）または画面外に出た場合
        const isGrounded = this.airplane.y <= 0;
        const isTooFarRight = this.toScreenX(this.airplane.x) > this.canvas.width * 3; // 特殊イベント用に範囲拡大
        const isTooFarLeft = this.toScreenX(this.airplane.x) < -50;
        const isTooHigh = this.toScreenY(this.airplane.y) < -100;

        // 特殊イベント後の飛行の場合は、より遠くまで飛行可能にする
        const shouldLand = isGrounded || isTooFarRight || isTooFarLeft || isTooHigh;

        // 飛行時間制限（特殊イベント後は30秒で強制着地）
        const flightDuration = Date.now() - this.flightStartTime;
        const isTimeLimit = flightDuration > (this.specialEventTriggered ? 30000 : 60000);

        if (shouldLand || isTimeLimit) {
            if (isTimeLimit) {
                console.log(`【着地判定】飛行時間制限により強制着地: ${(flightDuration / 1000).toFixed(1)}秒`);
            }
            console.log(`【着地判定】着地条件: ground=${isGrounded}, farRight=${isTooFarRight}, farLeft=${isTooFarLeft}, high=${isTooHigh}, timeLimit=${isTimeLimit}`);
            console.log(`【着地判定】現在位置: x=${this.airplane.x.toFixed(1)}, y=${this.airplane.y.toFixed(1)}, screenX=${this.toScreenX(this.airplane.x).toFixed(1)}`);
            this.landAirplane();
            return;
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    // 特殊イベントの回転アニメーション処理（スイングバイ）
    handleSpecialEventAnimation() {
        // スイングバイの角度を更新
        this.swingbyAngle += this.specialEventRotationSpeed;

        // 楕円上の基本位置を計算
        const ellipseX = Math.cos(this.swingbyAngle) * this.swingbyRadiusX;
        const ellipseY = Math.sin(this.swingbyAngle) * this.swingbyRadiusY;

        // 40度の傾きを適用して回転
        const cosTheta = Math.cos(this.swingbyTiltAngle);
        const sinTheta = Math.sin(this.swingbyTiltAngle);

        const rotatedX = ellipseX * cosTheta - ellipseY * sinTheta;
        const rotatedY = ellipseX * sinTheta + ellipseY * cosTheta;

        // 紙飛行機の新しい位置を計算（回転された楕円軌道で運動）
        const newX = this.swingbyCenter.x + rotatedX;
        const newY = this.swingbyCenter.y + rotatedY;

        // 紙飛行機の位置を更新
        this.airplane.x = newX;
        this.airplane.y = newY;

        // 回転された楕円の接線方向を計算
        const tangentX = -Math.sin(this.swingbyAngle) * this.swingbyRadiusX;
        const tangentY = Math.cos(this.swingbyAngle) * this.swingbyRadiusY;

        // 接線ベクトルも回転
        const rotatedTangentX = tangentX * cosTheta - tangentY * sinTheta;
        const rotatedTangentY = tangentX * sinTheta + tangentY * cosTheta;

        // 紙飛行機の向きを回転された楕円の接線方向に設定
        const tangentAngle = Math.atan2(rotatedTangentY, rotatedTangentX);
        this.airplane.rotation = tangentAngle;

        // 軌跡を更新（スイングバイの軌跡を記録）
        this.airplane.trail.push({ x: newX, y: newY });
        if (this.airplane.trail.length > 30) { // 軌跡を少し長めに
            this.airplane.trail.shift();
        }

        // 回転数をカウント（1回転 = 2π）
        const totalRotation = this.swingbyAngle - (this.specialEventRotationCount * Math.PI * 2);
        if (totalRotation >= Math.PI * 2) {
            this.specialEventRotationCount++;
            console.log(`【特殊イベント】スイングバイ${this.specialEventRotationCount}回転完了`);
        }

        // 2回転完了後、再発射を実行
        if (this.specialEventRotationCount >= 2) {
            this.executeSpecialEventRelaunch();
            return;
        }

        // 画面を再描画（スイングバイアニメーション表示）
        this.drawBackground();
        this.drawGround();
        this.drawTrail();

        // スイングバイエフェクトを描画
        this.drawSwingbyEffect();

        this.drawAirplane(this.toScreenX(this.airplane.x), this.toScreenY(this.airplane.y), this.airplane.rotation);

        // 特殊イベント演出を描画
        this.drawSpecialEventEffect();

        // 月への飛行演出を描画
        this.drawMoonFlightEffect();
    }

    // スイングバイエフェクトを描画
    drawSwingbyEffect() {
        const screenCenterX = this.toScreenX(this.swingbyCenter.x);
        const screenCenterY = this.toScreenY(this.swingbyCenter.y);
        const screenRadiusX = this.swingbyRadiusX * 5; // 画面座標に変換
        const screenRadiusY = this.swingbyRadiusY * 5; // 画面座標に変換

        // 紙飛行機の実際の軌跡をもとに楕円軌道を描画
        this.ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]); // 破線
        this.ctx.beginPath();

        // 楕円を手動で描画（紙飛行機の軌跡と同じ変換を適用）
        for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
            // 楕円上の基本位置を計算
            const ellipseX = Math.cos(angle) * this.swingbyRadiusX;
            const ellipseY = Math.sin(angle) * this.swingbyRadiusY;

            // 40度の傾きを適用して回転
            const cosTheta = Math.cos(this.swingbyTiltAngle);
            const sinTheta = Math.sin(this.swingbyTiltAngle);

            const rotatedX = ellipseX * cosTheta - ellipseY * sinTheta;
            const rotatedY = ellipseX * sinTheta + ellipseY * cosTheta;

            // 中心からの相対位置を画面座標に変換
            const screenX = screenCenterX + rotatedX * 5;
            const screenY = screenCenterY - rotatedY * 5; // y軸は画面では下向きが正

            if (angle === 0) {
                this.ctx.moveTo(screenX, screenY);
            } else {
                this.ctx.lineTo(screenX, screenY);
            }
        }
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.setLineDash([]); // 破線をリセット

        // 加速エフェクト（中心から外側に向かう線）
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8 + this.swingbyAngle * 0.5;

            // 楕円上の基本位置
            const ellipseInnerX = Math.cos(angle) * this.swingbyRadiusX * 0.3;
            const ellipseInnerY = Math.sin(angle) * this.swingbyRadiusY * 0.3;
            const ellipseOuterX = Math.cos(angle) * this.swingbyRadiusX * 0.8;
            const ellipseOuterY = Math.sin(angle) * this.swingbyRadiusY * 0.8;

            // 40度の傾きを適用
            const cosTheta = Math.cos(this.swingbyTiltAngle);
            const sinTheta = Math.sin(this.swingbyTiltAngle);

            const rotatedInnerX = ellipseInnerX * cosTheta - ellipseInnerY * sinTheta;
            const rotatedInnerY = ellipseInnerX * sinTheta + ellipseInnerY * cosTheta;
            const rotatedOuterX = ellipseOuterX * cosTheta - ellipseOuterY * sinTheta;
            const rotatedOuterY = ellipseOuterX * sinTheta + ellipseOuterY * cosTheta;

            const opacity = 0.3 + 0.2 * Math.sin(this.swingbyAngle * 3 + i);
            this.ctx.strokeStyle = `rgba(255, 150, 50, ${opacity})`;
            this.ctx.lineWidth = 2;

            this.ctx.beginPath();
            this.ctx.moveTo(
                screenCenterX + rotatedInnerX * 5,
                screenCenterY - rotatedInnerY * 5
            );
            this.ctx.lineTo(
                screenCenterX + rotatedOuterX * 5,
                screenCenterY - rotatedOuterY * 5
            );
            this.ctx.stroke();
        }
    }

    // 特殊イベントの再発射実行（スイングバイ効果）
    executeSpecialEventRelaunch() {
        console.log('【特殊イベント】スイングバイ2回転完了！加速して再発射します');

        const params = this.specialEventParams;

        // スイングバイによる加速効果を計算
        const swingbyBoost = 1.5; // スイングバイによる加速倍率
        const tangentVelocity = this.specialEventRotationSpeed * Math.max(this.swingbyRadiusX, this.swingbyRadiusY); // 接線速度

        // 新しいパラメータで発射計算（スイングバイ効果を含む）
        const radians = (params.angle * Math.PI) / 180;
        const baseVelocity = params.power * 0.6;
        const boostedVelocity = baseVelocity * swingbyBoost; // スイングバイ加速

        // 重心効果を計算（新しい重心値で）
        const tempBalance = this.balance; // 現在の重心を一時保存
        this.balance = params.balance; // 計算用に新しい重心を設定
        const balanceEffect = this.calculateBalanceEffect();
        this.balance = tempBalance; // 元の重心に戻す

        // スイングバイの最終位置から発射
        const ellipseX = Math.cos(this.swingbyAngle) * this.swingbyRadiusX;
        const ellipseY = Math.sin(this.swingbyAngle) * this.swingbyRadiusY;

        // 40度の傾きを適用
        const cosTheta = Math.cos(this.swingbyTiltAngle);
        const sinTheta = Math.sin(this.swingbyTiltAngle);

        const rotatedX = ellipseX * cosTheta - ellipseY * sinTheta;
        const rotatedY = ellipseX * sinTheta + ellipseY * cosTheta;

        const finalX = this.swingbyCenter.x + rotatedX;
        const finalY = this.swingbyCenter.y + rotatedY;

        // 紙飛行機を新しい条件で再設定
        this.airplane.x = finalX;
        this.airplane.y = finalY;
        this.airplane.vx = Math.cos(radians) * boostedVelocity * balanceEffect.velocityMultiplier;
        this.airplane.vy = Math.sin(radians) * boostedVelocity * balanceEffect.velocityMultiplier;
        this.airplane.rotation = -radians;
        this.airplane.stability = balanceEffect.stability;
        this.airplane.liftCoefficient = balanceEffect.liftCoefficient;

        // 軌跡をクリア（新しい飞行として記録）
        this.airplane.trail = [];

        // 新しい飛行の開始時刻を記録
        this.flightStartTime = Date.now();

        // 特殊イベントアニメーション状態をリセット
        this.isSpecialEventAnimating = false;
        this.specialEventRotationCount = 0;
        this.specialEventParams = null;
        this.swingbyCenter = null;
        this.swingbyAngle = 0;

        // 特殊イベント演出もリセット
        this.specialEventEffect.isActive = false;
        this.specialEventEffect.particles = [];

        // 月への飛行演出は削除（着地処理で判定する）
        // 注意: eventSequenceActiveとspecialEventTriggeredは継続（月着陸まで続く）

        console.log(`【特殊イベント実行】スイングバイ効果で加速再発射: 角度${params.angle}°, 強さ${params.power}→${(params.power * swingbyBoost).toFixed(1)}, 重心${params.balance}`);
    }

    // 軌跡を描画
    drawTrail() {
        if (!this.airplane.trail || this.airplane.trail.length < 2) return;

        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();

        for (let i = 0; i < this.airplane.trail.length; i++) {
            const point = this.airplane.trail[i];
            const screenX = this.toScreenX(point.x);
            const screenY = this.toScreenY(point.y);
            if (i === 0) {
                this.ctx.moveTo(screenX, screenY);
            } else {
                this.ctx.lineTo(screenX, screenY);
            }
        }

        this.ctx.stroke();
    }

    // 着地処理
    landAirplane() {
        // 月への飛行演出中は着地処理をスキップ
        if (this.moonFlightEffect.isActive) {
            console.log('【着地処理】月への飛行演出中のため着地処理をスキップ');
            return;
        }

        this.isFlying = false;

        // 着地音を再生
        this.createSound('land');

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        console.log(`【着地処理】specialEventTriggered: ${this.specialEventTriggered}, eventSequenceActive: ${this.eventSequenceActive}`);

        // 特殊イベントが発生していた場合は月への飛行演出を開始
        if (this.specialEventTriggered) {
            console.log('【着地処理】特殊イベント発生後の着地 - 月への飛行演出を開始');
            this.specialEventTriggered = false; // フラグをリセット
            this.startMoonFlightEffect();
            // 月への飛行演出中もアニメーションを継続
            this.isFlying = false; // 通常の飛行は終了
            // 月への飛行演出のためのアニメーション継続を強制実行
            this.animationId = requestAnimationFrame(() => this.animate());
            console.log('【着地処理】月への飛行演出のアニメーション継続を開始');
            return; // 通常の着地処理はスキップ
        }

        // イベントシーケンス完了（通常の着地の場合）
        this.eventSequenceActive = false;
        this.updateUIState(); // UI更新

        // 飛行距離を計算（論理座標をそのままメートルとして使用）
        const distance = Math.max(0, Math.round(this.airplane.x));

        // 最後の飛行距離を保存（条件チェック用）
        this.lastFlightDistance = distance;

        // 月への飛行の場合は特別な表示
        let displayDistance = distance;
        let distanceUnit = 'm';
        let specialMessage = '';

        // うんこイベントが発生した場合の特別処理
        if (this.poopCrashEvent.crashTriggered) {
            displayDistance = '💩';
            distanceUnit = '';
            specialMessage = '💩 うんピーイベント発生！';
        } else if (distance >= 384400000) { // 月までの距離
            displayDistance = Math.round(distance / 1000); // kmに変換
            distanceUnit = 'km';
            specialMessage = '🌙 月に到達しました！ 🌙';
        }

        document.getElementById('distanceDisplay').textContent = displayDistance + distanceUnit;

        // 最終的な最高高度を表示（月着陸時はkmで表示）
        let displayHeight, heightUnit;
        if (this.maxHeight >= 384400000) {
            displayHeight = Math.round(this.maxHeight / 1000);
            heightUnit = 'km';
        } else if (this.maxHeight >= 1000) {
            displayHeight = Math.round(this.maxHeight / 1000);
            heightUnit = 'km';
        } else {
            displayHeight = Math.round(this.maxHeight);
            heightUnit = 'm';
        }
        document.getElementById('heightDisplay').textContent = displayHeight + heightUnit;

        console.log(`飛行距離: ${distance}m, 最高高度: ${Math.round(this.maxHeight)}m`);

        // 結果に応じたメッセージ（重心も考慮）
        let message = '';
        let balanceComment = '';

        if (this.balance < 3) {
            balanceComment = '前重心で速度重視でした。';
        } else if (this.balance > 7) {
            balanceComment = '後重心で安定性重視でした。';
        } else {
            balanceComment = 'バランスの良い重心でした。';
        }

        // 鳥の持ち去りイベントが発生した場合の特別メッセージ
        if (this.poopCrashEvent.crashTriggered) {
            message = '💩 うんピーイベント発生！ なんと汚い出来事でしょう！';
            specialMessage = '💩 うんピーイベント発生！';
        } else if (this.birdCarryEvent.heightTriggered) {
            message = '🐦 鳥に持ち去られました！ なんと珍しい出来事でしょう！';
            specialMessage = '🐦 鳥の持ち去りイベント発生！';
        } else if (distance >= 384400000) {
            message = '信じられない！月まで飛んでいきました！！！';
        } else if (distance < 10) {
            message = 'もう少し調整してみましょう！';
        } else if (distance < 25) {
            message = 'なかなか良い飛び方です！';
        } else if (distance < 40) {
            message = 'すばらしい飛行距離です！';
        } else if (distance < 60) {
            message = '驚異的な飛行距離です！！';
        } else {
            message = '信じられない記録です！！！';
        }

        setTimeout(() => {
            // ステージ進捗をチェック（特殊イベント発生時も含む）
            this.checkStageProgress(distance, specialMessage);

            // ブレ情報を結果メッセージに追加
            let blurMessage = '';
            if (this.blurInfo.hasBlur) {
                const directionText = this.blurInfo.direction ? ` (${this.blurInfo.direction})` : '';
                blurMessage = `\n角度ブレ: ${this.blurInfo.blurAmount.toFixed(1)}°${directionText} (設定:${this.blurInfo.originalAngle}° → 実際:${this.blurInfo.actualAngle.toFixed(1)}°)`;
            }

            const finalMessage = specialMessage ?
                `${specialMessage}\n飛行距離: ${displayDistance}${distanceUnit}\n最高高度: ${displayHeight}${heightUnit}\n${message}\n${balanceComment}${blurMessage}` :
                `飛行距離: ${displayDistance}${distanceUnit}\n最高高度: ${displayHeight}${heightUnit}\n${message}\n${balanceComment}${blurMessage}`;

            // ループ中でない場合のみメッセージを表示
            if (!loopData.isLooping) {
                this.showMessage(finalMessage, 'info');
            }

            // ループ機能の結果記録
            recordLoopResult(Math.round(distance), Math.round(this.maxHeight));
        }, 100);
    }

    // 効果音システムの初期化
    initializeSoundSystem() {
        try {
            // Web Audio APIの初期化（ユーザーインタラクション後に実行）
            this.audioContext = null; // 初期は未初期化
            this.bgmSource = null; // BGM用のソース
            this.bgmBuffer = null; // 通常BGM用のバッファ
            this.moonBgmBuffer = null; // 月イベント用BGM
            this.currentBgmType = 'normal'; // 現在のBGMタイプ ('normal' or 'moon')
            this.bgmGainNode = null; // BGM音量制御
            this.bgmEnabled = true; // BGMの有効/無効

            // 音量設定（0.0～1.0の範囲）
            this.soundVolume = 0.5; // 効果音の音量（デフォルト50%）
            this.bgmVolume = 0.3; // BGMの音量（デフォルト30%）

            console.log('効果音システムを準備しました（ユーザーインタラクション後に初期化されます）');
        } catch (error) {
            console.warn('効果音システムの準備に失敗しました:', error);
            this.soundEnabled = false;
        }
    }

    // 音量設定を変更する
    setSoundVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume)); // 0-1の範囲に制限
        console.log('効果音音量を設定:', this.soundVolume);
    }

    setBGMVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume)); // 0-1の範囲に制限

        // 再生中のBGMがあれば音量を即座に更新
        if (this.bgmGainNode) {
            this.bgmGainNode.gain.setValueAtTime(this.bgmVolume, this.audioContext.currentTime);
        }

        console.log('BGM音量を設定:', this.bgmVolume);
    }

    // 効果音の音量を適用するヘルパー関数
    applySoundVolume(baseVolume) {
        return baseVolume * this.soundVolume;
    }

    // Web Audio Contextを初期化（ユーザーインタラクション時）
    async ensureAudioContext() {
        if (!this.audioContext && this.soundEnabled) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('Web Audio Contextを初期化しました - 状態:', this.audioContext.state, 'currentTime:', this.audioContext.currentTime);

                // AudioContextを確実にアクティブにするため、少し待機
                await new Promise(resolve => setTimeout(resolve, 10));

                // テスト用の短い可聴音を再生してAudioContextを確実にアクティブにする
                const testOsc = this.audioContext.createOscillator();
                const testGain = this.audioContext.createGain();
                testGain.gain.setValueAtTime(0.001, this.audioContext.currentTime); // 非常に小さい音量
                testOsc.connect(testGain);
                testGain.connect(this.audioContext.destination);
                testOsc.frequency.setValueAtTime(440, this.audioContext.currentTime);
                const startTime = this.audioContext.currentTime + 0.01;
                testOsc.start(startTime);
                testOsc.stop(startTime + 0.01);
                console.log('AudioContext アクティベーション用テスト音を再生 - startTime:', startTime);

                // テスト音の完了を待つ
                await new Promise(resolve => {
                    testOsc.onended = resolve;
                });

                console.log('AudioContext アクティベーション完了 - currentTime:', this.audioContext.currentTime);

                // BGMを読み込んで再生開始（エラーがあっても効果音には影響しない）
                if (this.bgmEnabled) {
                    this.loadAndPlayBGM().catch(error => {
                        console.warn('BGM初期化をスキップしました:', error.message);
                        this.bgmEnabled = false;
                    });
                }

            } catch (error) {
                console.warn('Web Audio Contextの初期化に失敗しました:', error);
                this.soundEnabled = false;
                return;
            }
        }

        // AudioContextが suspended状態の場合はresumeする
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('AudioContextを再開しました - 新しい状態:', this.audioContext.state);
            } catch (error) {
                console.warn('AudioContextの再開に失敗しました:', error);
            }
        }
    }

    // BGMを読み込んで再生する
    async loadAndPlayBGM() {
        if (!this.bgmEnabled || !this.audioContext) {
            console.log('BGMスキップ - bgmEnabled:', this.bgmEnabled, 'audioContext:', !!this.audioContext);
            return;
        }

        try {
            console.log('BGMの読み込みを開始します...');

            // BGMファイルを読み込み
            const response = await fetch('./437_BPM120.mp3');
            console.log('BGMファイル取得結果:', response.status, response.statusText);

            if (!response.ok) {
                throw new Error(`BGMファイルの読み込みに失敗: ${response.status}`);
            }

            console.log('BGMファイルのArrayBuffer変換開始...');
            const arrayBuffer = await response.arrayBuffer();
            console.log('BGMファイルサイズ:', arrayBuffer.byteLength, 'bytes');

            console.log('BGMファイルのデコード開始...');
            this.bgmBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            console.log('BGMファイルのデコードが完了しました - 長さ:', this.bgmBuffer.duration, '秒');

            // BGMの再生を開始
            this.playBGM();

        } catch (error) {
            console.error('BGMの読み込みに失敗しました:', error);
            this.bgmEnabled = false;
        }
    }

    // 月イベント用BGMを読み込む
    async loadMoonBGM() {
        if (!this.audioContext) {
            console.log('月BGMロードスキップ - AudioContextが未初期化');
            return;
        }

        try {
            console.log('月イベント用BGMの読み込みを開始します...');

            // 月イベント用BGMファイルを読み込み
            const response = await fetch('./330_BPM120.mp3');
            console.log('月BGMファイル取得結果:', response.status, response.statusText);

            if (!response.ok) {
                throw new Error(`月BGMファイルの読み込みに失敗: ${response.status}`);
            }

            console.log('月BGMファイルのArrayBuffer変換開始...');
            const arrayBuffer = await response.arrayBuffer();
            console.log('月BGMファイルサイズ:', arrayBuffer.byteLength, 'bytes');

            console.log('月BGMファイルのデコード開始...');
            this.moonBgmBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            console.log('月BGMファイルのデコードが完了しました - 長さ:', this.moonBgmBuffer.duration, '秒');

        } catch (error) {
            console.error('月BGMの読み込みに失敗しました:', error);
        }
    }

    // BGMを指定したタイプに切り替える
    async switchBGM(bgmType) {
        if (!this.bgmEnabled || !this.audioContext) {
            console.log('BGM切り替えスキップ - bgmEnabled:', this.bgmEnabled, 'audioContext:', !!this.audioContext);
            return;
        }

        // 現在のBGMを停止
        this.stopBGM();

        // BGMタイプを更新
        this.currentBgmType = bgmType;

        if (bgmType === 'moon') {
            // 月BGMが未ロードの場合は先にロード
            if (!this.moonBgmBuffer) {
                await this.loadMoonBGM();
            }

            if (this.moonBgmBuffer) {
                console.log('月イベント用BGMに切り替えます');
                this.playBGMWithBuffer(this.moonBgmBuffer);
            } else {
                console.warn('月BGMバッファが利用できません');
            }
        } else {
            // 通常BGMに切り替え
            if (this.bgmBuffer) {
                console.log('通常BGMに切り替えます');
                this.playBGMWithBuffer(this.bgmBuffer);
            } else {
                console.warn('通常BGMバッファが利用できません');
            }
        }
    }

    // BGMを再生する
    playBGM() {
        // 現在のBGMタイプに応じて適切なバッファを選択
        const buffer = this.currentBgmType === 'moon' ? this.moonBgmBuffer : this.bgmBuffer;
        this.playBGMWithBuffer(buffer);
    }

    // 指定されたバッファでBGMを再生する
    playBGMWithBuffer(buffer) {
        if (!this.bgmEnabled || !buffer || !this.audioContext) {
            console.log('BGM再生スキップ - bgmEnabled:', this.bgmEnabled, 'buffer:', !!buffer, 'audioContext:', !!this.audioContext);
            return;
        }

        try {
            console.log('BGM再生開始 - AudioContext状態:', this.audioContext.state, 'currentTime:', this.audioContext.currentTime);

            // 既存のBGMを完全に停止
            this.stopBGM();

            // 新しいソースを作成
            this.bgmSource = this.audioContext.createBufferSource();
            this.bgmGainNode = this.audioContext.createGain();

            console.log('BGMソースとゲインノードを作成しました');

            this.bgmSource.buffer = buffer;
            this.bgmSource.loop = true; // ループ再生

            // 音量を設定（動的音量設定を使用）
            this.bgmGainNode.gain.setValueAtTime(this.bgmVolume, this.audioContext.currentTime);
            console.log('BGM音量を設定しました:', this.bgmVolume);

            // 接続
            this.bgmSource.connect(this.bgmGainNode);
            this.bgmGainNode.connect(this.audioContext.destination);
            console.log('BGMオーディオノードを接続しました');

            // 再生開始
            const startTime = this.audioContext.currentTime + 0.1; // 少し遅延
            this.bgmSource.start(startTime);
            console.log('BGMの再生を開始しました - startTime:', startTime);

            // BGMの状態監視
            this.bgmSource.onended = () => {
                console.log('BGMが終了しました（予期しない終了）');
            };

        } catch (error) {
            console.error('BGMの再生に失敗しました:', error);
        }
    }

    // BGMを停止する
    stopBGM() {
        if (this.bgmSource) {
            try {
                this.bgmSource.stop();
                this.bgmSource.disconnect();
                this.bgmSource = null;
                console.log('BGMソースを停止・切断しました');
            } catch (error) {
                console.warn('BGMソースの停止に失敗しました:', error);
            }
        }

        if (this.bgmGainNode) {
            try {
                this.bgmGainNode.disconnect();
                this.bgmGainNode = null;
                console.log('BGMゲインノードを切断しました');
            } catch (error) {
                console.warn('BGMゲインノードの切断に失敗しました:', error);
            }
        }

        console.log('BGMを完全に停止しました');
    }

    // BGMの有効/無効を切り替え
    toggleBGM() {
        this.bgmEnabled = !this.bgmEnabled;
        if (this.bgmEnabled) {
            // 現在のBGMタイプに応じて適切なバッファで再生
            const buffer = this.currentBgmType === 'moon' ? this.moonBgmBuffer : this.bgmBuffer;
            if (buffer) {
                this.playBGM();
            }
        } else {
            this.stopBGM();
        }
        console.log('BGM設定:', this.bgmEnabled ? '有効' : '無効');
        return this.bgmEnabled;
    }

    // うんぴーイベント専用の特殊効果音
    createPoopSound() {
        if (!this.soundEnabled) return;

        this.ensureAudioContext();
        if (!this.audioContext) return;

        // AudioContextがsuspended状態の場合は少し待ってから実行
        if (this.audioContext.state === 'suspended') {
            setTimeout(() => {
                this.createPoopSound();
            }, 100);
            return;
        }

        try {
            // 複数のオシレーターで複雑な「ブリブリ」音を作成
            const oscillators = [];
            const gainNodes = [];

            // ベース音（低音のブリブリ音）
            const baseOsc = this.audioContext.createOscillator();
            const baseGain = this.audioContext.createGain();
            baseOsc.connect(baseGain);
            baseGain.connect(this.audioContext.destination);

            baseOsc.type = 'sawtooth';
            baseOsc.frequency.setValueAtTime(60, this.audioContext.currentTime);
            baseOsc.frequency.setValueAtTime(80, this.audioContext.currentTime + 0.1);
            baseOsc.frequency.setValueAtTime(55, this.audioContext.currentTime + 0.2);
            baseOsc.frequency.setValueAtTime(75, this.audioContext.currentTime + 0.3);
            baseOsc.frequency.setValueAtTime(65, this.audioContext.currentTime + 0.4);

            baseGain.gain.setValueAtTime(this.applySoundVolume(0.12), this.audioContext.currentTime);
            baseGain.gain.setValueAtTime(this.applySoundVolume(0.02), this.audioContext.currentTime + 0.05);
            baseGain.gain.setValueAtTime(this.applySoundVolume(0.15), this.audioContext.currentTime + 0.1);
            baseGain.gain.setValueAtTime(this.applySoundVolume(0.03), this.audioContext.currentTime + 0.15);
            baseGain.gain.setValueAtTime(this.applySoundVolume(0.13), this.audioContext.currentTime + 0.2);
            baseGain.gain.setValueAtTime(this.applySoundVolume(0.02), this.audioContext.currentTime + 0.25);
            baseGain.gain.setValueAtTime(this.applySoundVolume(0.14), this.audioContext.currentTime + 0.3);
            baseGain.gain.setValueAtTime(this.applySoundVolume(0.01), this.audioContext.currentTime + 0.6);

            // 中音域のプププ音
            const midOsc = this.audioContext.createOscillator();
            const midGain = this.audioContext.createGain();
            midOsc.connect(midGain);
            midGain.connect(this.audioContext.destination);

            midOsc.type = 'square';
            midOsc.frequency.setValueAtTime(120, this.audioContext.currentTime);
            midOsc.frequency.setValueAtTime(140, this.audioContext.currentTime + 0.1);
            midOsc.frequency.setValueAtTime(110, this.audioContext.currentTime + 0.2);
            midOsc.frequency.setValueAtTime(130, this.audioContext.currentTime + 0.3);

            midGain.gain.setValueAtTime(this.applySoundVolume(0.08), this.audioContext.currentTime);
            midGain.gain.setValueAtTime(this.applySoundVolume(0.01), this.audioContext.currentTime + 0.08);
            midGain.gain.setValueAtTime(this.applySoundVolume(0.09), this.audioContext.currentTime + 0.16);
            midGain.gain.setValueAtTime(this.applySoundVolume(0.01), this.audioContext.currentTime + 0.24);
            midGain.gain.setValueAtTime(this.applySoundVolume(0.08), this.audioContext.currentTime + 0.32);
            midGain.gain.setValueAtTime(this.applySoundVolume(0.01), this.audioContext.currentTime + 0.6);

            // 高音域のスプラッター音
            const highOsc = this.audioContext.createOscillator();
            const highGain = this.audioContext.createGain();
            highOsc.connect(highGain);
            highGain.connect(this.audioContext.destination);

            highOsc.type = 'triangle';
            highOsc.frequency.setValueAtTime(200, this.audioContext.currentTime);
            highOsc.frequency.setValueAtTime(180, this.audioContext.currentTime + 0.1);
            highOsc.frequency.setValueAtTime(220, this.audioContext.currentTime + 0.2);

            highGain.gain.setValueAtTime(this.applySoundVolume(0.05), this.audioContext.currentTime);
            highGain.gain.setValueAtTime(this.applySoundVolume(0.01), this.audioContext.currentTime + 0.05);
            highGain.gain.setValueAtTime(this.applySoundVolume(0.06), this.audioContext.currentTime + 0.1);
            highGain.gain.setValueAtTime(this.applySoundVolume(0.01), this.audioContext.currentTime + 0.3);

            // 全てのオシレーターを開始・停止
            const startTime = this.audioContext.currentTime;
            const stopTime = startTime + 0.6;

            baseOsc.start(startTime);
            baseOsc.stop(stopTime);

            midOsc.start(startTime);
            midOsc.stop(stopTime);

            highOsc.start(startTime);
            highOsc.stop(stopTime);

            console.log('うんぴー特殊効果音を再生しました！');

        } catch (error) {
            console.warn('うんぴー効果音の再生に失敗しました:', error);
        }
    }

    // 月着陸イベント専用の神秘的で壮大な効果音
    createMoonSound() {
        if (!this.soundEnabled) return;

        this.ensureAudioContext();
        if (!this.audioContext) return;

        try {
            // 神秘的で壮大な月着陸音を3つのオシレーターで構成
            const startTime = this.audioContext.currentTime;

            // ベース音：低音域の神秘的なドローン
            const baseOsc = this.audioContext.createOscillator();
            const baseGain = this.audioContext.createGain();
            baseOsc.connect(baseGain);
            baseGain.connect(this.audioContext.destination);

            baseOsc.type = 'sine';
            baseOsc.frequency.setValueAtTime(110, startTime); // A2
            baseOsc.frequency.exponentialRampToValueAtTime(165, startTime + 1.0); // E3
            baseOsc.frequency.exponentialRampToValueAtTime(220, startTime + 2.0); // A3

            baseGain.gain.setValueAtTime(0, startTime);
            baseGain.gain.linearRampToValueAtTime(this.applySoundVolume(0.1), startTime + 0.3);
            baseGain.gain.setValueAtTime(this.applySoundVolume(0.1), startTime + 1.5);
            baseGain.gain.linearRampToValueAtTime(0, startTime + 2.5);

            // 中音域：ハーモニー
            const midOsc = this.audioContext.createOscillator();
            const midGain = this.audioContext.createGain();
            midOsc.connect(midGain);
            midGain.connect(this.audioContext.destination);

            midOsc.type = 'triangle';
            midOsc.frequency.setValueAtTime(330, startTime + 0.2); // E4
            midOsc.frequency.exponentialRampToValueAtTime(440, startTime + 1.2); // A4
            midOsc.frequency.exponentialRampToValueAtTime(660, startTime + 2.2); // E5

            midGain.gain.setValueAtTime(0, startTime + 0.2);
            midGain.gain.linearRampToValueAtTime(0.06, startTime + 0.6);
            midGain.gain.setValueAtTime(0.06, startTime + 1.8);
            midGain.gain.linearRampToValueAtTime(0, startTime + 2.5);

            // 高音域：きらめく星のような音
            const highOsc = this.audioContext.createOscillator();
            const highGain = this.audioContext.createGain();
            highOsc.connect(highGain);
            highGain.connect(this.audioContext.destination);

            highOsc.type = 'sine';
            highOsc.frequency.setValueAtTime(880, startTime + 0.5); // A5
            highOsc.frequency.exponentialRampToValueAtTime(1320, startTime + 1.5); // E6
            highOsc.frequency.exponentialRampToValueAtTime(1760, startTime + 2.0); // A6

            highGain.gain.setValueAtTime(0, startTime + 0.5);
            highGain.gain.linearRampToValueAtTime(0.04, startTime + 0.8);
            highGain.gain.setValueAtTime(0.04, startTime + 1.2);
            highGain.gain.linearRampToValueAtTime(0.08, startTime + 1.8); // クライマックス
            highGain.gain.linearRampToValueAtTime(0, startTime + 2.5);

            // リバーブ効果のための追加レイヤー（エコー効果）
            const echoOsc = this.audioContext.createOscillator();
            const echoGain = this.audioContext.createGain();
            echoOsc.connect(echoGain);
            echoGain.connect(this.audioContext.destination);

            echoOsc.type = 'sine';
            echoOsc.frequency.setValueAtTime(440, startTime + 0.8); // A4
            echoOsc.frequency.exponentialRampToValueAtTime(880, startTime + 2.3); // A5

            echoGain.gain.setValueAtTime(0, startTime + 0.8);
            echoGain.gain.linearRampToValueAtTime(0.02, startTime + 1.2);
            echoGain.gain.setValueAtTime(0.02, startTime + 2.0);
            echoGain.gain.linearRampToValueAtTime(0, startTime + 3.0);

            // 全てのオシレーターを開始・停止
            const stopTime = startTime + 3.0;

            baseOsc.start(startTime);
            baseOsc.stop(stopTime);

            midOsc.start(startTime + 0.2);
            midOsc.stop(stopTime);

            highOsc.start(startTime + 0.5);
            highOsc.stop(stopTime);

            echoOsc.start(startTime + 0.8);
            echoOsc.stop(stopTime);

            console.log('月着陸の神秘的な効果音を再生しました！');

        } catch (error) {
            console.warn('月着陸効果音の再生に失敗しました:', error);
        }
    }

    // 月イベントの回転効果音
    createMoonSpinSound() {
        if (!this.soundEnabled) return;

        this.ensureAudioContext();
        if (!this.audioContext) return;

        try {
            const startTime = this.audioContext.currentTime;

            // 回転を表現する音：周波数が上下する音
            const spinOsc = this.audioContext.createOscillator();
            const spinGain = this.audioContext.createGain();
            spinOsc.connect(spinGain);
            spinGain.connect(this.audioContext.destination);

            spinOsc.type = 'triangle';

            // 回転をイメージした周波数変化
            spinOsc.frequency.setValueAtTime(220, startTime); // A3
            spinOsc.frequency.exponentialRampToValueAtTime(330, startTime + 0.3); // E4
            spinOsc.frequency.exponentialRampToValueAtTime(440, startTime + 0.6); // A4
            spinOsc.frequency.exponentialRampToValueAtTime(330, startTime + 0.9); // E4
            spinOsc.frequency.exponentialRampToValueAtTime(220, startTime + 1.2); // A3

            spinGain.gain.setValueAtTime(0, startTime);
            spinGain.gain.linearRampToValueAtTime(this.applySoundVolume(0.05), startTime + 0.1);
            spinGain.gain.setValueAtTime(this.applySoundVolume(0.05), startTime + 1.0);
            spinGain.gain.linearRampToValueAtTime(0, startTime + 1.2);

            // 回転の風切り音
            const windOsc = this.audioContext.createOscillator();
            const windGain = this.audioContext.createGain();
            windOsc.connect(windGain);
            windGain.connect(this.audioContext.destination);

            windOsc.type = 'sawtooth';
            windOsc.frequency.setValueAtTime(100, startTime);
            windOsc.frequency.exponentialRampToValueAtTime(150, startTime + 0.6);
            windOsc.frequency.exponentialRampToValueAtTime(80, startTime + 1.2);

            windGain.gain.setValueAtTime(0, startTime);
            windGain.gain.linearRampToValueAtTime(this.applySoundVolume(0.02), startTime + 0.2);
            windGain.gain.setValueAtTime(this.applySoundVolume(0.02), startTime + 0.8);
            windGain.gain.linearRampToValueAtTime(0, startTime + 1.2);

            const stopTime = startTime + 1.2;

            spinOsc.start(startTime);
            spinOsc.stop(stopTime);

            windOsc.start(startTime);
            windOsc.stop(stopTime);

            console.log('月イベント回転効果音を再生しました！');

        } catch (error) {
            console.warn('月回転効果音の再生に失敗しました:', error);
        }
    }

    // 月面着陸時の効果音
    createMoonLandingSound() {
        if (!this.soundEnabled) return;

        this.ensureAudioContext();
        if (!this.audioContext) return;

        try {
            const startTime = this.audioContext.currentTime;

            // 着陸の衝撃音（低音）
            const impactOsc = this.audioContext.createOscillator();
            const impactGain = this.audioContext.createGain();
            impactOsc.connect(impactGain);
            impactGain.connect(this.audioContext.destination);

            impactOsc.type = 'triangle';
            impactOsc.frequency.setValueAtTime(80, startTime); // 低い周波数
            impactOsc.frequency.exponentialRampToValueAtTime(60, startTime + 0.3);

            impactGain.gain.setValueAtTime(0, startTime);
            impactGain.gain.linearRampToValueAtTime(0.08, startTime + 0.05);
            impactGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

            // 月の砂の音（高音のノイズ）
            const dustOsc = this.audioContext.createOscillator();
            const dustGain = this.audioContext.createGain();
            dustOsc.connect(dustGain);
            dustGain.connect(this.audioContext.destination);

            dustOsc.type = 'square';
            dustOsc.frequency.setValueAtTime(400, startTime + 0.1);
            dustOsc.frequency.exponentialRampToValueAtTime(200, startTime + 0.4);

            dustGain.gain.setValueAtTime(0, startTime + 0.1);
            dustGain.gain.linearRampToValueAtTime(this.applySoundVolume(0.03), startTime + 0.15);
            dustGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

            // エコー効果
            const echoOsc = this.audioContext.createOscillator();
            const echoGain = this.audioContext.createGain();
            echoOsc.connect(echoGain);
            echoGain.connect(this.audioContext.destination);

            echoOsc.type = 'sine';
            echoOsc.frequency.setValueAtTime(220, startTime + 0.3);
            echoOsc.frequency.exponentialRampToValueAtTime(110, startTime + 0.8);

            echoGain.gain.setValueAtTime(0, startTime + 0.3);
            echoGain.gain.linearRampToValueAtTime(this.applySoundVolume(0.02), startTime + 0.4);
            echoGain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.0);

            const stopTime = startTime + 1.0;

            impactOsc.start(startTime);
            impactOsc.stop(stopTime);

            dustOsc.start(startTime + 0.1);
            dustOsc.stop(stopTime);

            echoOsc.start(startTime + 0.3);
            echoOsc.stop(stopTime);

            console.log('月面着陸効果音を再生しました！');

        } catch (error) {
            console.warn('月着陸効果音の再生に失敗しました:', error);
        }
    }

    // 鳥イベント専用の特殊効果音（リアルな鳥の鳴き声）
    createBirdSound() {
        if (!this.soundEnabled) return;

        this.ensureAudioContext();
        if (!this.audioContext) return;

        // AudioContextがsuspended状態の場合は少し待ってから実行
        if (this.audioContext.state === 'suspended') {
            setTimeout(() => {
                this.createBirdSound();
            }, 100);
            return;
        }

        try {
            // 鳥の鳴き声を複数のオシレーターで表現
            const oscillators = [];
            const gainNodes = [];

            // メイン鳴き声（さえずり音）
            const mainOsc = this.audioContext.createOscillator();
            const mainGain = this.audioContext.createGain();
            mainOsc.connect(mainGain);
            mainGain.connect(this.audioContext.destination);

            mainOsc.type = 'sine';
            // ピーヨピーヨという音程変化
            mainOsc.frequency.setValueAtTime(800, this.audioContext.currentTime);
            mainOsc.frequency.setValueAtTime(1200, this.audioContext.currentTime + 0.08);
            mainOsc.frequency.setValueAtTime(950, this.audioContext.currentTime + 0.16);
            mainOsc.frequency.setValueAtTime(1300, this.audioContext.currentTime + 0.24);
            mainOsc.frequency.setValueAtTime(900, this.audioContext.currentTime + 0.32);
            mainOsc.frequency.setValueAtTime(1100, this.audioContext.currentTime + 0.4);
            mainOsc.frequency.setValueAtTime(850, this.audioContext.currentTime + 0.48);

            // 音量で鳴き声のリズムを表現
            mainGain.gain.setValueAtTime(0.12, this.audioContext.currentTime);
            mainGain.gain.setValueAtTime(0.08, this.audioContext.currentTime + 0.04);
            mainGain.gain.setValueAtTime(0.15, this.audioContext.currentTime + 0.08);
            mainGain.gain.setValueAtTime(0.05, this.audioContext.currentTime + 0.12);
            mainGain.gain.setValueAtTime(0.13, this.audioContext.currentTime + 0.16);
            mainGain.gain.setValueAtTime(0.06, this.audioContext.currentTime + 0.2);
            mainGain.gain.setValueAtTime(0.14, this.audioContext.currentTime + 0.24);
            mainGain.gain.setValueAtTime(0.04, this.audioContext.currentTime + 0.28);
            mainGain.gain.setValueAtTime(0.12, this.audioContext.currentTime + 0.32);
            mainGain.gain.setValueAtTime(0.07, this.audioContext.currentTime + 0.36);
            mainGain.gain.setValueAtTime(0.11, this.audioContext.currentTime + 0.4);
            mainGain.gain.setValueAtTime(0.08, this.audioContext.currentTime + 0.44);
            mainGain.gain.setValueAtTime(0.09, this.audioContext.currentTime + 0.48);
            mainGain.gain.setValueAtTime(0.01, this.audioContext.currentTime + 0.6);

            // ハーモニクス（倍音）
            const harmOsc = this.audioContext.createOscillator();
            const harmGain = this.audioContext.createGain();
            harmOsc.connect(harmGain);
            harmGain.connect(this.audioContext.destination);

            harmOsc.type = 'triangle';
            // メイン音の1.5倍の周波数でより高い音
            harmOsc.frequency.setValueAtTime(1200, this.audioContext.currentTime);
            harmOsc.frequency.setValueAtTime(1800, this.audioContext.currentTime + 0.08);
            harmOsc.frequency.setValueAtTime(1425, this.audioContext.currentTime + 0.16);
            harmOsc.frequency.setValueAtTime(1950, this.audioContext.currentTime + 0.24);
            harmOsc.frequency.setValueAtTime(1350, this.audioContext.currentTime + 0.32);
            harmOsc.frequency.setValueAtTime(1650, this.audioContext.currentTime + 0.4);
            harmOsc.frequency.setValueAtTime(1275, this.audioContext.currentTime + 0.48);

            harmGain.gain.setValueAtTime(0.06, this.audioContext.currentTime);
            harmGain.gain.setValueAtTime(0.04, this.audioContext.currentTime + 0.04);
            harmGain.gain.setValueAtTime(0.08, this.audioContext.currentTime + 0.08);
            harmGain.gain.setValueAtTime(0.02, this.audioContext.currentTime + 0.12);
            harmGain.gain.setValueAtTime(0.07, this.audioContext.currentTime + 0.16);
            harmGain.gain.setValueAtTime(0.03, this.audioContext.currentTime + 0.2);
            harmGain.gain.setValueAtTime(0.07, this.audioContext.currentTime + 0.24);
            harmGain.gain.setValueAtTime(0.02, this.audioContext.currentTime + 0.28);
            harmGain.gain.setValueAtTime(0.06, this.audioContext.currentTime + 0.32);
            harmGain.gain.setValueAtTime(0.04, this.audioContext.currentTime + 0.36);
            harmGain.gain.setValueAtTime(0.05, this.audioContext.currentTime + 0.4);
            harmGain.gain.setValueAtTime(0.04, this.audioContext.currentTime + 0.44);
            harmGain.gain.setValueAtTime(0.04, this.audioContext.currentTime + 0.48);
            harmGain.gain.setValueAtTime(0.01, this.audioContext.currentTime + 0.6);

            // 低音のベースノート（鳥の体からの共鳴音）
            const bassOsc = this.audioContext.createOscillator();
            const bassGain = this.audioContext.createGain();
            bassOsc.connect(bassGain);
            bassGain.connect(this.audioContext.destination);

            bassOsc.type = 'sawtooth';
            bassOsc.frequency.setValueAtTime(400, this.audioContext.currentTime);
            bassOsc.frequency.setValueAtTime(450, this.audioContext.currentTime + 0.16);
            bassOsc.frequency.setValueAtTime(420, this.audioContext.currentTime + 0.32);
            bassOsc.frequency.setValueAtTime(380, this.audioContext.currentTime + 0.48);

            bassGain.gain.setValueAtTime(0.03, this.audioContext.currentTime);
            bassGain.gain.setValueAtTime(0.04, this.audioContext.currentTime + 0.08);
            bassGain.gain.setValueAtTime(0.02, this.audioContext.currentTime + 0.16);
            bassGain.gain.setValueAtTime(0.04, this.audioContext.currentTime + 0.24);
            bassGain.gain.setValueAtTime(0.03, this.audioContext.currentTime + 0.32);
            bassGain.gain.setValueAtTime(0.02, this.audioContext.currentTime + 0.4);
            bassGain.gain.setValueAtTime(0.03, this.audioContext.currentTime + 0.48);
            bassGain.gain.setValueAtTime(0.01, this.audioContext.currentTime + 0.6);

            // 全てのオシレーターを開始・停止
            const startTime = this.audioContext.currentTime;
            const stopTime = startTime + 0.6;

            mainOsc.start(startTime);
            mainOsc.stop(stopTime);

            harmOsc.start(startTime);
            harmOsc.stop(stopTime);

            bassOsc.start(startTime);
            bassOsc.stop(stopTime);

            console.log('鳥の特殊効果音を再生しました！');

        } catch (error) {
            console.warn('鳥の効果音の再生に失敗しました:', error);
        }
    }

    // 効果音を生成する関数
    createSound(type) {
        console.log('createSound呼び出し - type:', type, 'soundEnabled:', this.soundEnabled, 'audioContext:', !!this.audioContext);

        if (!this.soundEnabled) {
            console.log('効果音が無効のため終了');
            return;
        }

        // AudioContextを確実に初期化
        this.ensureAudioContext();

        if (!this.audioContext) {
            console.log('AudioContextが初期化されていないため終了');
            return;
        }

        console.log('AudioContext状態:', this.audioContext.state);

        // AudioContextがsuspended状態の場合は少し待ってから実行
        if (this.audioContext.state === 'suspended') {
            console.log('AudioContextがsuspended状態のため100ms後に再試行');
            setTimeout(() => {
                this.createSound(type);
            }, 100);
            return;
        }

        console.log('効果音生成開始 - type:', type);

        try {
            // AudioContextのcurrentTimeを確認し、必要に応じて遅延を追加
            let startTime = this.audioContext.currentTime;
            const minStartTime = 0.05; // 最小開始時間を設定

            if (startTime < minStartTime) {
                // currentTimeが小さい場合は確実に遅延させる
                startTime = this.audioContext.currentTime + minStartTime;
                console.log('AudioContext currentTimeが小さいため遅延追加:', 'originalTime:', this.audioContext.currentTime, 'adjustedTime:', startTime);
            } else {
                // 通常時も少し遅延を追加して確実性を高める
                startTime = this.audioContext.currentTime + 0.01;
                console.log('AudioContext 通常遅延追加:', 'originalTime:', this.audioContext.currentTime, 'adjustedTime:', startTime);
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            switch (type) {
                case 'throw':
                    // 飛行機を投げる音（シューッという音）
                    oscillator.frequency.setValueAtTime(800, startTime);
                    oscillator.frequency.exponentialRampToValueAtTime(400, startTime + 0.3);
                    gainNode.gain.setValueAtTime(0.1 * this.soundVolume, startTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01 * this.soundVolume, startTime + 0.3);
                    oscillator.type = 'sawtooth';
                    break;

                case 'land':
                    // 着地音（ポンという音）
                    oscillator.frequency.setValueAtTime(200, startTime);
                    oscillator.frequency.exponentialRampToValueAtTime(150, startTime + 0.1);
                    gainNode.gain.setValueAtTime(0.15 * this.soundVolume, startTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01 * this.soundVolume, startTime + 0.1);
                    oscillator.type = 'sine';
                    break;

                case 'bird':
                    // 鳥イベント専用の特殊効果音を呼び出し
                    this.createBirdSound();
                    return; // 通常のオシレーター処理をスキップ

                case 'crash':
                    // うんぴーイベント専用の特殊効果音を呼び出し
                    this.createPoopSound();
                    return; // 通常のオシレーター処理をスキップ

                case 'moon':
                    // 月着陸の神秘的で壮大な音
                    // 3つのオシレーターを組み合わせて豊かな音を作成
                    this.createMoonSound();
                    return; // 通常のオシレーター処理をスキップ
            }

            console.log('オシレーター開始 - type:', type, 'currentTime:', this.audioContext.currentTime, 'startTime:', startTime);

            // オシレーターの開始をPromiseでラップして確実性を向上
            try {
                oscillator.start(startTime);
                console.log('oscillator.start() 成功 - type:', type, 'startTime:', startTime);

                // 効果音の持続時間を設定
                let duration = 0.3; // デフォルト
                if (type === 'moon') duration = 3.0; // 月着陸は壮大な3秒間
                if (type === 'crash') duration = 0.5; // うんぴーイベントは少し長め

                oscillator.stop(startTime + duration);
                console.log('oscillator.stop() 設定完了 - type:', type, 'duration:', duration, 'stopTime:', startTime + duration);

                // 実際に音が終了したときのログ
                oscillator.onended = () => {
                    console.log('オシレーター実際に終了 - type:', type);
                };

            } catch (startError) {
                console.error('oscillator.start() エラー:', startError);
            }

        } catch (error) {
            console.warn('効果音の再生に失敗しました:', error);
        }
    }

    // 効果音の有効/無効を切り替え
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        console.log('効果音:', this.soundEnabled ? '有効' : '無効');
        return this.soundEnabled;
    }

    // リセット
    reset() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        this.isFlying = false;
        this.airplane = null;
        this.maxHeight = 0; // 最高高度もリセット

        // 特殊イベント状態をリセット
        this.isSpecialEventAnimating = false;
        this.specialEventRotationCount = 0;
        this.specialEventParams = null;
        this.swingbyCenter = null;
        this.swingbyAngle = 0;
        this.specialEventTriggered = false; // 特殊イベントフラグもリセット
        this.eventSequenceActive = false; // イベントシーケンスもリセット
        this.flightStartTime = 0; // 飛行開始時刻もリセット
        this.updateUIState(); // UI更新

        // ブレ情報もリセット
        this.blurInfo = {
            hasBlur: false,
            originalAngle: 0,
            actualAngle: 0,
            blurAmount: 0,
            direction: ''
        };

        // 滑空状態もリセット
        this.glidingState = {
            isGliding: false,
            glidingStartTime: 0,
            glidingMessageShown: false
        };

        // 特殊イベント演出もリセット
        this.specialEventEffect.isActive = false;
        this.specialEventEffect.particles = [];

        // 月への飛行演出もリセット
        this.moonFlightEffect.isActive = false;
        this.moonFlightEffect.stars = [];
        this.moonFlightEffect.phase = 'flight';

        document.getElementById('distanceDisplay').textContent = '0m';
        document.getElementById('heightDisplay').textContent = '0m';

        this.init();
        console.log('ゲームをリセットしました');
    }
}

// グローバル変数
let game;

// Blocklyから呼び出される関数
function setAngle(angle) {
    console.log(`setAngle(${angle}) が呼び出されました`);
    if (game) {
        game.setAngle(angle);
    } else {
        console.error('game オブジェクトが初期化されていません');
    }
}

function setPower(power) {
    console.log(`setPower(${power}) が呼び出されました`);
    if (game) {
        // 30を超える値が入力された場合の警告
        if (power > 30) {
            console.warn(`強さ ${power} は制限値30を超えています。30に調整されます。`);
        } else if (power < 1) {
            console.warn(`強さ ${power} は最小値1を下回っています。1に調整されます。`);
        }
        game.setPower(power);
    } else {
        console.error('game オブジェクトが初期化されていません');
    }
}

function setBalance(balance) {
    console.log(`setBalance(${balance}) が呼び出されました`);
    if (game) {
        game.setBalance(balance);
    } else {
        console.error('game オブジェクトが初期化されていません');
    }
}

function throwAirplane() {
    console.log('throwAirplane() が呼び出されました');
    if (game) {
        // 非同期関数を呼び出すが、戻り値は待機しない
        game.throwAirplane().catch(error => {
            console.error('throwAirplane実行エラー:', error);
        });
    } else {
        console.error('game オブジェクトが初期化されていません');
    }
}

// リセット関数をグローバルに追加
function resetGame() {
    console.log('resetGame() が呼び出されました');
    if (game) {
        game.reset();
    } else {
        console.error('game オブジェクトが初期化されていません');
    }
}

// ループ機能の実装
let loopData = {
    isLooping: false,
    currentLoop: 0,
    maxLoops: 16,
    type: null, // 'count' または 'distance'
    targetCount: 0,
    targetDistance: 0,
    callback: null,
    results: []
};

// 指定回数ループ機能
function loopCount(count, callback) {
    console.log(`loopCount(${count}) が呼び出されました`);

    if (loopData.isLooping) {
        game.showMessage('既にループ実行中です。', 'warning');
        return;
    }

    const loopCount = Math.min(Math.max(1, parseInt(count)), loopData.maxLoops);

    loopData.isLooping = true;
    loopData.currentLoop = 0;
    loopData.type = 'count';
    loopData.targetCount = loopCount;

    // ループ停止ボタンを表示
    document.getElementById('stopLoopButton').style.display = 'block';
    loopData.callback = callback;
    loopData.results = [];

    game.showMessage(`${loopCount}回のループを開始します...`, 'info');
    executeNextLoop();
}

// 飛距離条件ループ機能
function loopUntilDistance(targetDistance, callback) {
    console.log(`loopUntilDistance(${targetDistance}) が呼び出されました`);

    if (loopData.isLooping) {
        game.showMessage('既にループ実行中です。', 'warning');
        return;
    }

    const distance = Math.max(1, parseInt(targetDistance));

    loopData.isLooping = true;
    loopData.currentLoop = 0;
    loopData.type = 'distance';
    loopData.targetDistance = distance;

    // ループ停止ボタンを表示
    document.getElementById('stopLoopButton').style.display = 'block';
    loopData.callback = callback;
    loopData.results = [];

    game.showMessage(`飛距離${distance}m以上になるまでループを開始します...`, 'info');
    executeNextLoop();
}

// 条件が真になるまでループ機能
function loopUntilTrue(conditionFunc, callback) {
    console.log('loopUntilTrue が呼び出されました');

    if (loopData.isLooping) {
        game.showMessage('既にループ実行中です。', 'warning');
        return;
    }

    loopData.isLooping = true;
    loopData.currentLoop = 0;
    loopData.type = 'condition';
    loopData.conditionFunc = conditionFunc;
    loopData.maxLoops = 50; // 条件ループの最大回数

    // ループ停止ボタンを表示
    document.getElementById('stopLoopButton').style.display = 'block';
    loopData.callback = callback;
    loopData.results = [];

    game.showMessage('条件が真になるまでループを開始します...', 'info');
    executeNextLoop();
}

// 鳥イベント発生チェック関数
function isBirdEventOccurred() {
    // 鳥イベントが完了した場合にtrueを返す
    const eventCompleted = game.birdCarryEvent.completed;
    console.log('鳥イベント発生チェック:', {
        heightTriggered: game.birdCarryEvent.heightTriggered,
        isActive: game.birdCarryEvent.isActive,
        completed: game.birdCarryEvent.completed,
        eventCompleted: eventCompleted
    });
    return eventCompleted;
}

// 飛距離条件チェック関数
function isDistanceGreaterThan(targetDistance) {
    const distance = parseFloat(targetDistance) || 0;
    const lastDistance = game.lastFlightDistance || 0;
    console.log(`飛距離チェック: 最後の飛距離=${lastDistance}m, 目標=${distance}m`);
    return lastDistance >= distance;
}

// 次のループを実行
function executeNextLoop() {
    if (!loopData.isLooping) return;

    loopData.currentLoop++;

    // UI状態を更新
    if (game) {
        game.updateUIState();
    }

    // 最大ループ回数チェック
    if (loopData.currentLoop > loopData.maxLoops) {
        finishLoop('最大ループ回数に到達しました。');
        return;
    }

    // ループ条件チェック
    if (loopData.type === 'count' && loopData.currentLoop > loopData.targetCount) {
        finishLoop('指定回数のループが完了しました。');
        return;
    }

    if (loopData.type === 'distance' && loopData.results.length > 0) {
        const lastResult = loopData.results[loopData.results.length - 1];
        if (lastResult.distance >= loopData.targetDistance) {
            finishLoop(`目標飛距離${loopData.targetDistance}mを達成しました！`);
            return;
        }
    }

    if (loopData.type === 'condition' && loopData.results.length > 0) {
        try {
            if (loopData.conditionFunc && loopData.conditionFunc()) {
                finishLoop('条件が真になりました！');
                return;
            }
        } catch (error) {
            console.error('条件関数の実行エラー:', error);
            finishLoop('条件チェック中にエラーが発生しました。');
            return;
        }
    }

    console.log(`ループ ${loopData.currentLoop} 回目を実行中...`);

    // ゲームをリセット
    game.reset();

    // 少し待ってからコールバックを実行
    setTimeout(() => {
        if (loopData.callback) {
            loopData.callback();
        }
    }, 500);
}

// ループ終了処理
function finishLoop(message) {
    console.log('ループ終了:', message);

    // 結果をまとめて表示
    let resultMessage = message + '\n\n【ループ結果】\n';
    loopData.results.forEach((result, index) => {
        resultMessage += `${index + 1}回目: ${result.distance}m (高度: ${result.height}m)\n`;
    });

    if (loopData.results.length > 0) {
        const distances = loopData.results.map(r => r.distance);
        const maxDistance = Math.max(...distances);
        const avgDistance = Math.round(distances.reduce((a, b) => a + b, 0) / distances.length);
        resultMessage += `\n最高記録: ${maxDistance}m\n平均飛距離: ${avgDistance}m`;
    }

    // 最終結果メッセージは自動で閉じず、閉じるボタンを表示
    game.showMessage(resultMessage, 'final', {
        autoClose: false,
        showCloseButton: true
    });

    // ループ状態をリセット
    loopData.isLooping = false;
    loopData.currentLoop = 0;
    loopData.type = null;
    loopData.targetCount = 0;
    loopData.targetDistance = 0;
    loopData.callback = null;
    loopData.results = [];

    // ループ停止ボタンを非表示
    document.getElementById('stopLoopButton').style.display = 'none';

    // UI状態を更新
    if (game) {
        game.updateUIState();
    }
}

// ゲームの飛行完了時にループ結果を記録する関数
function recordLoopResult(distance, height) {
    if (loopData.isLooping) {
        loopData.results.push({
            distance: distance,
            height: height,
            loop: loopData.currentLoop
        });

        console.log(`ループ${loopData.currentLoop}回目の結果: 距離${distance}m, 高度${height}m`);

        // 各ループの結果をメッセージで表示
        const distanceUnit = distance >= 1000 ? 'km' : 'm';
        const displayDistance = distance >= 1000 ? Math.round(distance / 1000) : distance;
        let progressMessage = `ループ ${loopData.currentLoop}回目完了\n飛行距離: ${displayDistance}${distanceUnit} (高度: ${height}m)`;

        // 進行状況を追加
        if (loopData.type === 'count') {
            progressMessage += `\n進行状況: ${loopData.currentLoop}/${loopData.targetCount}`;
        } else if (loopData.type === 'distance') {
            progressMessage += `\n目標: ${loopData.targetDistance}m`;
            if (distance >= loopData.targetDistance) {
                progressMessage += ' 🎉 達成！';
            }
        }

        game.showMessage(progressMessage, 'info');

        // 次のループを実行
        setTimeout(() => {
            executeNextLoop();
        }, 2000); // メッセージを読む時間を確保するため少し長めに
    }
}

// ===== ステージ管理システム =====
// ステージ進捗チェック
PaperAirplaneGame.prototype.checkStageProgress = function (distance, specialMessage) {
    // フリーモードではステージ進捗をチェックしない
    if (!this.isStageMode) {
        return;
    }

    // 飛行記録を追加
    this.flightHistory.push({
        distance: distance,
        height: Math.round(this.maxHeight),
        stage: this.currentStage,
        timestamp: Date.now(),
        specialEvent: specialMessage || null
    });

    switch (this.currentStage) {
        case 1:
            this.checkStage1Progress();
            break;
        case 2:
            this.checkStage2Progress(distance);
            break;
        case 3:
            this.checkStage3Progress(distance);
            break;
        case 4:
            this.checkStage4Progress();
            break;
        case 5:
            this.checkStage5Progress(distance);
            break;
    }

    this.updateStageDisplay();
};

// ステージ1進捗チェック
PaperAirplaneGame.prototype.checkStage1Progress = function () {
    if (!this.stageProgress.stage1.completed && this.flightHistory.length >= 1) {
        this.stageProgress.stage1.completed = true;
        this.completeStage(1, "ステージ1クリア！\nゲームの基本操作を覚えました。次のステージに挑戦しましょう！");
    }
};

// ステージ2進捗チェック
PaperAirplaneGame.prototype.checkStage2Progress = function (distance) {
    if (distance > this.stageProgress.stage2.bestDistance) {
        this.stageProgress.stage2.bestDistance = distance;
    }

    if (!this.stageProgress.stage2.completed && distance >= 90) {
        this.stageProgress.stage2.completed = true;
        this.completeStage(2, `ステージ2クリア！\n90m以上の飛行距離を達成しました！(${distance}m)\n次は安定性の挑戦です。`);
    }
};

// ステージ3進捗チェック
PaperAirplaneGame.prototype.checkStage3Progress = function (distance) {
    // ループでの飛行のみカウント
    if (loopData.isLooping) {
        this.stageProgress.stage3.attempts++;
        this.stageProgress.stage3.totalDistance += distance;

        if (this.stageProgress.stage3.attempts >= 10) {
            const average = this.stageProgress.stage3.totalDistance / this.stageProgress.stage3.attempts;
            if (!this.stageProgress.stage3.completed && average >= 80) {
                this.stageProgress.stage3.completed = true;
                this.completeStage(3, `ステージ3クリア！\n10回の平均飛行距離${Math.round(average)}mを達成しました！\n次は特別なイベントを狙いましょう。`);
            } else if (!this.stageProgress.stage3.completed) {
                this.showMessage(`10回の平均: ${Math.round(average)}m\n80m以上が必要です...もう一度挑戦しましょう！`, '#ff9800');
                // リセットして再挑戦
                this.stageProgress.stage3.attempts = 0;
                this.stageProgress.stage3.totalDistance = 0;
            }
        }
    }
};

// ステージ4進捗チェック
PaperAirplaneGame.prototype.checkStage4Progress = function () {
    if (loopData.isLooping) {
        this.stageProgress.stage4.attempts++;
    }

    // 鳥の持ち去りイベントが実際に開始されたかをチェック（確率で成功した場合のみ）
    if (!this.stageProgress.stage4.completed && this.birdCarryEvent.isActive) {
        this.stageProgress.stage4.birdEventTriggered = true;
        this.stageProgress.stage4.completed = true;
        this.completeStage(4, `ステージ4クリア！\n鳥イベントを発生させることができました！\n最終ステージに挑戦しましょう。`);
    }
};

// ステージ5進捗チェック
PaperAirplaneGame.prototype.checkStage5Progress = function (distance) {
    // ループでの飛行のみカウント（変数使用の飛行）
    if (loopData.isLooping && this.hasVariableParameters()) {
        this.stageProgress.stage5.attempts++;
        this.stageProgress.stage5.variationFlights.push(distance);

        if (this.stageProgress.stage5.attempts >= 16 && !this.stageProgress.stage5.completed) {
            this.stageProgress.stage5.completed = true;
            const avgDistance = Math.round(this.stageProgress.stage5.variationFlights.reduce((a, b) => a + b, 0) / 16);
            this.completeStage(5, `ステージ5クリア！\n変数とループを使って16回の飛行を完了しました！\n平均飛行距離: ${avgDistance}m\n\nおめでとうございます！全てのステージをクリアしました！🎉`);
        }
    }
};

// パラメータに変数が使用されているかチェック
PaperAirplaneGame.prototype.hasVariableParameters = function () {
    // Blocklyワークスペースから変数ブロックの使用をチェック
    // 簡易実装：実際にはBlocklyのワークスペースを解析する必要がある
    return true; // 今回は簡略化
};

// ステージクリア処理
PaperAirplaneGame.prototype.completeStage = function (stageNumber, message) {
    // ループ中にステージクリアした場合はループを停止
    if (typeof loopData !== 'undefined' && loopData.isLooping) {
        loopData.isLooping = false;
        loopData.currentLoop = 0;
        loopData.type = null;
        loopData.targetCount = 0;
        loopData.targetDistance = 0;
        loopData.callback = null;
        loopData.results = [];

        // ループ停止ボタンを非表示
        document.getElementById('stopLoopButton').style.display = 'none';

        // UIを更新
        this.updateUIState();

        // ステージクリア + ループ停止のメッセージ
        message += '\n\n💫 ループを自動停止しました！';
    }

    this.showMessage(message, '#4CAF50');

    setTimeout(() => {
        if (stageNumber < 5) {
            this.currentStage = stageNumber + 1;
            this.showStageMessage();
            this.updateStageDisplay();
        } else {
            // 全ステージクリア
            this.showMessage("🎉 全ステージクリア！🎉\nあなたは真のプログラマー紙飛行機マスターです！", '#FFD700');
        }
    }, 3000);
};

// ステージモード開始
PaperAirplaneGame.prototype.startStageMode = function () {
    this.isStageMode = true;
    this.currentStage = 1;
    this.flightHistory = [];
    this.stageProgress = {
        stage1: { completed: false },
        stage2: { completed: false, bestDistance: 0 },
        stage3: { completed: false, attempts: 0, totalDistance: 0 },
        stage4: { completed: false, attempts: 0, birdEventTriggered: false },
        stage5: { completed: false, attempts: 0, variationFlights: [] }
    };
    this.showStageMessage();
    this.updateStageDisplay();
};

// フリーモードに戻る
PaperAirplaneGame.prototype.returnToFreeMode = function () {
    this.isStageMode = false;
    this.showFreeMode();
};
