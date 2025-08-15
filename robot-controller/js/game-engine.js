// ロボット制御ゲームエンジン

class RobotGameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 8; // 8x8のグリッド
        this.cellSize = this.canvas.width / this.gridSize;
        
        // ロボットの状態
        this.robot = {
            x: 0,
            y: 0,
            direction: 0, // 0:上, 1:右, 2:下, 3:左
            inventory: []
        };
        
        // ゲーム状態
        this.isRunning = false;
        this.animationSpeed = 500; // ミリ秒
        this.score = 0;
        this.currentStage = null;
        
        // 実行中の処理追跡
        this.runningAnimations = new Set();
        this.shouldStop = false;
        
        // ゲーム要素
        this.walls = new Set();
        this.goals = new Set();
        this.items = new Set();
        this.collectedItems = new Set();
        
        this.initializeCanvas();
    }
    
    initializeCanvas() {
        // キャンバスのサイズ調整
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.cellSize = this.canvas.width / this.gridSize;
        
        this.draw();
    }
    
    // ステージの設定
    loadStage(stageConfig) {
        this.currentStage = stageConfig;
        
        // 初期位置を保存
        this.initialState = {
            x: stageConfig.startX || 0,
            y: stageConfig.startY || 0,
            direction: stageConfig.startDirection || 0
        };
        
        this.robot.x = this.initialState.x;
        this.robot.y = this.initialState.y;
        this.robot.direction = this.initialState.direction;
        this.robot.inventory = [];
        
        this.walls = new Set(stageConfig.walls || []);
        this.goals = new Set(stageConfig.goals || []);
        this.items = new Set(stageConfig.items || []);
        this.collectedItems = new Set();
        
        this.score = 0;
        this.updateUI();
        this.draw();
    }
    
    // 描画処理
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // グリッドの描画
        this.drawGrid();
        
        // 要素の描画
        this.drawWalls();
        this.drawGoals();
        this.drawItems();
        this.drawRobot();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.gridSize; i++) {
            const pos = i * this.cellSize;
            
            // 縦線
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.canvas.height);
            this.ctx.stroke();
            
            // 横線
            this.ctx.beginPath();
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.canvas.width, pos);
            this.ctx.stroke();
        }
    }
    
    drawWalls() {
        this.ctx.fillStyle = '#8D6E63';
        this.walls.forEach(wall => {
            const [x, y] = wall.split(',').map(Number);
            this.ctx.fillRect(
                x * this.cellSize + 2,
                y * this.cellSize + 2,
                this.cellSize - 4,
                this.cellSize - 4
            );
            
            // 壁のテクスチャ
            this.ctx.fillStyle = '#6D4C41';
            this.ctx.fillRect(
                x * this.cellSize + 4,
                y * this.cellSize + 4,
                this.cellSize - 8,
                this.cellSize - 8
            );
            this.ctx.fillStyle = '#8D6E63';
        });
    }
    
    drawGoals() {
        this.goals.forEach(goal => {
            const [x, y] = goal.split(',').map(Number);
            const centerX = x * this.cellSize + this.cellSize / 2;
            const centerY = y * this.cellSize + this.cellSize / 2;
            
            // ゴールの輝くエフェクト
            const gradient = this.ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, this.cellSize / 2
            );
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(0.7, '#FFA500');
            gradient.addColorStop(1, '#FF8C00');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, this.cellSize / 2 - 5, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // ゴールマーク
            this.ctx.fillStyle = 'white';
            this.ctx.font = `${this.cellSize / 2}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('🏁', centerX, centerY);
        });
    }
    
    drawItems() {
        this.items.forEach(item => {
            if (!this.collectedItems.has(item)) {
                const [x, y] = item.split(',').map(Number);
                const centerX = x * this.cellSize + this.cellSize / 2;
                const centerY = y * this.cellSize + this.cellSize / 2;
                
                // アイテムの描画
                this.ctx.fillStyle = '#2196F3';
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, this.cellSize / 4, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // アイテムアイコン
                this.ctx.fillStyle = 'white';
                this.ctx.font = `${this.cellSize / 3}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('💎', centerX, centerY);
            }
        });
    }
    
    drawRobot() {
        const centerX = this.robot.x * this.cellSize + this.cellSize / 2;
        const centerY = this.robot.y * this.cellSize + this.cellSize / 2;
        
        // ロボット本体
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, this.cellSize / 3, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // 方向インジケーター
        this.ctx.fillStyle = '#2E7D32';
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate((this.robot.direction * 90) * Math.PI / 180);
        
        // 矢印の描画
        this.ctx.beginPath();
        this.ctx.moveTo(0, -this.cellSize / 4);
        this.ctx.lineTo(-this.cellSize / 6, this.cellSize / 6);
        this.ctx.lineTo(this.cellSize / 6, this.cellSize / 6);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
        
        // ロボットの目
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 8, centerY - 8, 3, 0, 2 * Math.PI);
        this.ctx.arc(centerX + 8, centerY - 8, 3, 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 8, centerY - 8, 1, 0, 2 * Math.PI);
        this.ctx.arc(centerX + 8, centerY - 8, 1, 0, 2 * Math.PI);
        this.ctx.fill();
    }
     // ロボット制御メソッド
    async moveForward() {
        if (!this.isRunning || this.shouldStop) return false;
        
        const newX = this.robot.x + (this.robot.direction === 1 ? 1 : this.robot.direction === 3 ? -1 : 0);
        const newY = this.robot.y + (this.robot.direction === 2 ? 1 : this.robot.direction === 0 ? -1 : 0);
        
        // 境界チェック
        if (newX < 0 || newX >= this.gridSize || newY < 0 || newY >= this.gridSize) {
            await this.showError('境界を超えようとしました！');
            return false;
        }
        
        // 壁チェック
        if (this.walls.has(`${newX},${newY}`)) {
            await this.showError('壁にぶつかりました！');
            return false;
        }

        // アニメーション付き移動
        await this.animateMovement(newX, newY);
        
        if (this.shouldStop) return false;
        
        this.robot.x = newX;
        this.robot.y = newY;
        
        this.checkMissionProgress();
        return true;
    }
    
    async turnRight() {
        if (!this.isRunning || this.shouldStop) return;
        
        await this.animateRotation(90);
        if (this.shouldStop) return;
        this.robot.direction = (this.robot.direction + 1) % 4;
    }
    
    async turnLeft() {
        if (!this.isRunning || this.shouldStop) return;
        
        await this.animateRotation(-90);
        if (this.shouldStop) return;
        this.robot.direction = (this.robot.direction + 3) % 4;
    }
    
    async turnAround() {
        if (!this.isRunning || this.shouldStop) return;
        
        await this.animateRotation(180);
        if (this.shouldStop) return;
        this.robot.direction = (this.robot.direction + 2) % 4;
    }
    
    // チェック系メソッド
    checkWallAhead() {
        const nextX = this.robot.x + (this.robot.direction === 1 ? 1 : this.robot.direction === 3 ? -1 : 0);
        const nextY = this.robot.y + (this.robot.direction === 2 ? 1 : this.robot.direction === 0 ? -1 : 0);
        
        // 境界チェック
        if (nextX < 0 || nextX >= this.gridSize || nextY < 0 || nextY >= this.gridSize) {
            return true;
        }
        
        return this.walls.has(`${nextX},${nextY}`);
    }
    
    checkGoalReached() {
        return this.goals.has(`${this.robot.x},${this.robot.y}`);
    }
    
    checkItemHere() {
        const itemKey = `${this.robot.x},${this.robot.y}`;
        return this.items.has(itemKey) && !this.collectedItems.has(itemKey);
    }
    
    // アクション系メソッド
    async collectItem() {
        if (!this.isRunning) return false;
        
        const itemKey = `${this.robot.x},${this.robot.y}`;
        if (this.items.has(itemKey) && !this.collectedItems.has(itemKey)) {
            this.collectedItems.add(itemKey);
            this.robot.inventory.push('item');
            this.score += 10;
            
            await this.animateCollection();
            this.updateUI();
            this.draw();
            return true;
        }
        
        await this.showError('ここにはアイテムがありません！');
        return false;
    }
    
    async placeItem() {
        if (!this.isRunning) return false;
        
        if (this.robot.inventory.length === 0) {
            await this.showError('インベントリにアイテムがありません！');
            return false;
        }
        
        this.robot.inventory.pop();
        await this.animatePlacement();
        this.updateUI();
        return true;
    }
    
    async wait(seconds) {
        if (!this.isRunning || this.shouldStop) return;
        
        await this.sleep(seconds * 1000);
    }
    
    // アニメーション系メソッド
    async animateMovement(newX, newY) {
        if (this.shouldStop) return;
        
        const startX = this.robot.x;
        const startY = this.robot.y;
        const steps = 10;
        
        for (let i = 1; i <= steps; i++) {
            if (this.shouldStop) return; // 各ステップで停止チェック
            
            const progress = i / steps;
            const tempX = startX + (newX - startX) * progress;
            const tempY = startY + (newY - startY) * progress;
            
            // 一時的な位置で描画
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawGrid();
            this.drawWalls();
            this.drawGoals();
            this.drawItems();
            
            // ロボットを一時位置で描画
            const oldX = this.robot.x;
            const oldY = this.robot.y;
            this.robot.x = tempX;
            this.robot.y = tempY;
            this.drawRobot();
            this.robot.x = oldX;
            this.robot.y = oldY;
            
            await this.sleep(this.animationSpeed / steps);
        }
    }
    
    async animateRotation(degrees) {
        if (this.shouldStop) return;
        
        const steps = 5;
        const startDirection = this.robot.direction;
        
        for (let i = 1; i <= steps; i++) {
            if (this.shouldStop) return; // 各ステップで停止チェック
            
            // 回転アニメーションエフェクト
            this.draw();
            
            // 回転エフェクトを追加
            const centerX = this.robot.x * this.cellSize + this.cellSize / 2;
            const centerY = this.robot.y * this.cellSize + this.cellSize / 2;
            
            this.ctx.strokeStyle = '#4CAF50';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, this.cellSize / 2, 0, (degrees * i / steps) * Math.PI / 180);
            this.ctx.stroke();
            
            await this.sleep(this.animationSpeed / steps);
        }
        
        this.draw();
    }
    
    async animateCollection() {
        // 収集エフェクト
        const centerX = this.robot.x * this.cellSize + this.cellSize / 2;
        const centerY = this.robot.y * this.cellSize + this.cellSize / 2;
        
        for (let i = 0; i < 10; i++) {
            this.draw();
            
            // 星のエフェクト
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('✨', centerX + Math.random() * 40 - 20, centerY + Math.random() * 40 - 20);
            
            await this.sleep(50);
        }
    }
    
    async animatePlacement() {
        // 配置エフェクト
        this.draw();
        await this.sleep(this.animationSpeed / 2);
    }
    
    async showMessage(message, type = 'info') {
        // メッセージの表示
        console.log(message);
        
        // 画面にメッセージエフェクト
        let backgroundColor, textColor;
        switch (type) {
            case 'success':
                backgroundColor = 'rgba(76, 175, 80, 0.3)';
                textColor = 'green';
                break;
            case 'warning':
                backgroundColor = 'rgba(255, 152, 0, 0.3)';
                textColor = 'orange';
                break;
            case 'error':
                backgroundColor = 'rgba(244, 67, 54, 0.3)';
                textColor = 'red';
                break;
            default: // info
                backgroundColor = 'rgba(33, 150, 243, 0.3)';
                textColor = 'blue';
        }
        
        this.ctx.fillStyle = backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = textColor;
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
        
        await this.sleep(1500);
        this.draw();
    }

    async showError(message) {
        // エラーメッセージの表示
        console.error(message);
        
        // 画面にエラーエフェクト
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'red';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
        
        await this.sleep(1000);
        this.draw();
    }
    
    // ゴール状態の確認
    isAtGoalPosition() {
        const currentPos = `${this.robot.x},${this.robot.y}`;
        return this.goals.has(currentPos);
    }
    
    // 初期位置に戻す処理
    async returnToInitialPosition() {
        if (!this.initialState) return;
        
        // ゴールに到達していない場合のみ初期位置に戻す
        if (!this.isAtGoalPosition()) {
            await this.showMessage('ゴールに到達できませんでした。初期位置に戻ります...', 'warning');
            
            // アニメーション付きで初期位置に戻る
            await this.animateMovement(this.initialState.x, this.initialState.y);
            
            this.robot.x = this.initialState.x;
            this.robot.y = this.initialState.y;
            this.robot.direction = this.initialState.direction;
            
            this.draw();
            
            // リセット完了メッセージ
            await this.sleep(500);
            await this.showMessage('初期位置に戻りました。もう一度挑戦してください！', 'info');
        }
    }
    
    // プログラム実行終了時の処理
    async onProgramEnd() {
        // プログラム実行終了時にゴール未到達なら初期位置に戻す
        await this.returnToInitialPosition();
    }

    sleep(ms) {
        return new Promise(resolve => {
            const timeout = setTimeout(resolve, ms);
            
            // 停止チェック用のインターバル
            const checkInterval = setInterval(() => {
                if (this.shouldStop) {
                    clearTimeout(timeout);
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 50);
            
            // タイムアウト時にインターバルもクリア
            setTimeout(() => clearInterval(checkInterval), ms);
        });
    }

    checkMissionProgress() {
        if (this.currentStage && this.currentStage.checkWinCondition) {
            if (this.currentStage.checkWinCondition(this)) {
                this.onMissionComplete();
            }
        }
    }
    
    onMissionComplete() {
        this.isRunning = false;
        
        // 成功エフェクト
        this.score += 50;
        this.updateUI();
        
        // 成功モーダルを表示
        setTimeout(() => {
            document.getElementById('successModal').style.display = 'block';
            document.getElementById('achievementText').textContent = 
                this.currentStage.successMessage || 'ミッションクリア！';
        }, 500);
    }
    
    updateUI() {
        document.getElementById('scoreDisplay').textContent = `スコア: ${this.score}`;
        
        if (this.currentStage) {
            const progress = this.currentStage.getProgress ? this.currentStage.getProgress(this) : 0;
            document.getElementById('progressFill').style.width = `${progress}%`;
        }
    }
    
    reset() {
        // 強制停止フラグを設定
        this.shouldStop = true;
        this.isRunning = false;
        
        // 少し待ってからステージをリロード
        setTimeout(() => {
            this.shouldStop = false;
            if (this.currentStage) {
                this.loadStage(this.currentStage);
            }
        }, 100);
    }
    
    start() {
        this.shouldStop = false;
        this.isRunning = true;
    }
    
    async stop() {
        // 強制停止フラグを設定
        this.shouldStop = true;
        this.isRunning = false;
        
        // 少し待ってから終了処理を実行
        setTimeout(async () => {
            await this.onProgramEnd();
            this.shouldStop = false;
        }, 100);
    }
}

// グローバルインスタンス
let gameEngine;
let robot; // ロボット制御オブジェクト

// 初期化
function initializeGameEngine() {
    gameEngine = new RobotGameEngine('gameCanvas');
    robot = gameEngine; // ブロックコードから参照できるように
    
    return gameEngine;
}
