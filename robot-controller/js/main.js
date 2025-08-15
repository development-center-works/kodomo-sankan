// メインアプリケーション制御

class RobotProgrammingApp {
    constructor() {
        this.workspace = null;
        this.gameEngine = null;
        this.stageManager = null;
        this.isRunning = false;
        this.currentCategory = 'basic-movement';
        this.currentLevel = 0;
        this.runningExecution = null; // 実行中のプロミスを追跡
    }

    // アプリケーション初期化
    async initialize() {
        try {
            console.log('ロボットプログラミングアプリを初期化中...');

            // カスタムブロックの初期化
            initializeCustomBlocks();
            console.log('カスタムブロック初期化完了');

            // Blocklyワークスペースの初期化
            this.workspace = initializeBlocklyWorkspace();
            console.log('Blocklyワークスペース初期化完了');

            // ゲームエンジンの初期化
            this.gameEngine = initializeGameEngine();
            console.log('ゲームエンジン初期化完了');

            // ステージマネージャーの初期化
            this.stageManager = initializeStageManager();
            console.log('ステージマネージャー初期化完了');

            // イベントリスナーの設定
            this.setupEventListeners();
            console.log('イベントリスナー設定完了');

            // 初期ステージの読み込み
            this.loadCurrentStage();
            console.log('初期ステージ読み込み完了');

            // ステージ説明の初期更新
            this.updateStageDescription();
            console.log('ステージ説明初期化完了');

            // レスポンシブ対応の設定
            this.setupResponsive();
            console.log('レスポンシブ設定完了');

            console.log('アプリケーション初期化完了！');

        } catch (error) {
            console.error('初期化エラー:', error);
            alert('アプリケーションの初期化に失敗しました: ' + error.message);
        }
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // 実行ボタン
        document.getElementById('runProgram').addEventListener('click', () => {
            this.runProgram();
        });

        // 停止ボタン
        document.getElementById('stopProgram').addEventListener('click', async () => {
            await this.stopProgram();
        });

        // リセットボタン
        document.getElementById('resetProgram').addEventListener('click', async () => {
            await this.resetProgram();
        });

        // ヒントボタン
        document.getElementById('showHint').addEventListener('click', () => {
            this.showHint();
        });

        // 次のステージボタン
        document.getElementById('nextStage').addEventListener('click', () => {
            this.nextStage();
        });

        // ステージセレクター
        document.getElementById('stageSelect').addEventListener('change', (e) => {
            this.updateLevelSelector(e.target.value);
        });

        // レベルセレクター
        document.getElementById('levelSelect').addEventListener('change', () => {
            this.updateStageDescription();
        });

        // ステージ移動ボタン
        document.getElementById('goToStage').addEventListener('click', () => {
            this.goToSelectedStage();
        });

        // ステージセレクターパネルのトグル
        document.getElementById('stageSelectToggle').addEventListener('click', () => {
            this.toggleStageSelector();
        });

        // ステージセレクターパネルを閉じる
        document.getElementById('closeStagePanelBtn').addEventListener('click', () => {
            this.hideStageSelector();
        });

        // パネル外クリックで閉じる
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('stageSelectorPanel');
            const toggle = document.getElementById('stageSelectToggle');
            
            if (!panel.contains(e.target) && !toggle.contains(e.target)) {
                this.hideStageSelector();
            }
        });

        // モーダル関連
        document.getElementById('closeHint').addEventListener('click', () => {
            document.getElementById('hintModal').style.display = 'none';
        });

        document.getElementById('continueButton').addEventListener('click', () => {
            document.getElementById('successModal').style.display = 'none';
            this.nextStage();
        });

        document.getElementById('retryButton').addEventListener('click', async () => {
            document.getElementById('successModal').style.display = 'none';
            await this.resetProgram();
        });

        // ウィンドウクリックでモーダルを閉じる
        window.addEventListener('click', (e) => {
            const hintModal = document.getElementById('hintModal');
            const successModal = document.getElementById('successModal');
            
            if (e.target === hintModal) {
                hintModal.style.display = 'none';
            }
            if (e.target === successModal) {
                successModal.style.display = 'none';
            }
        });

        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'Enter':
                        e.preventDefault();
                        this.runProgram();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.resetProgram();
                        break;
                    case 's':
                        e.preventDefault();
                        this.stopProgram();
                        break;
                }
            }
        });
    }

    // レスポンシブ対応の設定
    setupResponsive() {
        const resizeHandler = () => {
            // Blocklyワークスペースのリサイズ
            if (this.workspace) {
                try {
                    // 新しいAPIを試す
                    if (Blockly.utils && Blockly.utils.svgResize) {
                        Blockly.utils.svgResize(this.workspace);
                    } else {
                        // 古いAPIをフォールバック
                        Blockly.svgResize(this.workspace);
                    }
                } catch (error) {
                    console.log('Blocklyリサイズエラー:', error);
                }
            }

            // ゲームキャンバスのリサイズ
            if (this.gameEngine) {
                this.gameEngine.initializeCanvas();
            }
        };

        window.addEventListener('resize', resizeHandler);
        window.addEventListener('orientationchange', () => {
            setTimeout(resizeHandler, 500);
        });

        // 初期リサイズ
        setTimeout(resizeHandler, 100);
    }

    // プログラム実行
    async runProgram() {
        if (this.isRunning) return;

        // プログラムの検証
        const validation = validateProgram();
        if (!validation.valid) {
            alert(validation.message);
            return;
        }

        try {
            this.isRunning = true;
            this.gameEngine.start();
            
            // UIの更新
            document.getElementById('runProgram').disabled = true;
            document.getElementById('stopProgram').disabled = false;

            // Blocklyからコードを生成
            let code;
            try {
                // 関数定義をクリア（新しい実行のため）
                if (typeof Blockly !== 'undefined' && Blockly.JavaScript && Blockly.JavaScript.definitions_) {
                    Blockly.JavaScript.definitions_ = {};
                }
                
                code = Blockly.JavaScript.workspaceToCode(this.workspace);
                console.log('生成されたコード:', code);
                
                // 生成されたコードの安全性チェック
                if (this.hasUnsafeCode(code)) {
                    throw new Error('安全でないコードが検出されました。while文やfor文の中身を確認してください。');
                }
                
            } catch (error) {
                throw new Error('コード生成エラー: ' + error.message);
            }

            // コードの実行（実行プロミスを保存）
            this.runningExecution = this.executeCode(code);
            await this.runningExecution;

        } catch (error) {
            console.error('プログラム実行エラー:', error);
            
            // 無限ループエラーと停止エラーは区別して処理
            if (error.message.includes('長時間実行されたため自動停止')) {
                await this.gameEngine.showMessage(error.message.replace('コード実行エラー: ', ''), 'warning');
            } else if (error.message !== 'プログラムが停止されました') {
                await this.gameEngine.showError('プログラム実行中にエラーが発生しました: ' + error.message);
            }
        } finally {
            this.runningExecution = null;
            this.isRunning = false;
            
            // プログラム終了時にゴール未到達なら初期位置に戻す
            if (!this.gameEngine.shouldStop) {
                await this.gameEngine.onProgramEnd();
            }
            
            document.getElementById('runProgram').disabled = false;
            document.getElementById('stopProgram').disabled = true;
        }
    }

    // コードの実行
    async executeCode(code) {
        // 無限ループ対策：最大実行回数と時間制限を設定
        let totalOperations = 0;
        const MAX_OPERATIONS = 1000; // 最大1000回の操作で停止
        const MAX_EXECUTION_TIME = 30000; // 最大30秒で停止
        const startTime = Date.now();
        
        // ロボットのメソッドを適切にバインド（停止チェック付き）
        const robotApi = {
            moveForward: async () => {
                if (this.gameEngine.shouldStop) throw new Error('プログラムが停止されました');
                
                // 無限ループチェック
                totalOperations++;
                const elapsedTime = Date.now() - startTime;
                if (totalOperations > MAX_OPERATIONS) {
                    throw new Error('プログラムが長時間実行されたため自動停止されました（最大操作回数: ' + MAX_OPERATIONS + '回）');
                }
                if (elapsedTime > MAX_EXECUTION_TIME) {
                    throw new Error('プログラムが長時間実行されたため自動停止されました（最大実行時間: 30秒）');
                }
                
                return await this.gameEngine.moveForward();
            },
            turnLeft: async () => {
                if (this.gameEngine.shouldStop) throw new Error('プログラムが停止されました');
                
                totalOperations++;
                const elapsedTime = Date.now() - startTime;
                if (totalOperations > MAX_OPERATIONS) {
                    throw new Error('プログラムが長時間実行されたため自動停止されました（最大操作回数: ' + MAX_OPERATIONS + '回）');
                }
                if (elapsedTime > MAX_EXECUTION_TIME) {
                    throw new Error('プログラムが長時間実行されたため自動停止されました（最大実行時間: 30秒）');
                }
                
                return await this.gameEngine.turnLeft();
            },
            turnRight: async () => {
                if (this.gameEngine.shouldStop) throw new Error('プログラムが停止されました');
                
                totalOperations++;
                const elapsedTime = Date.now() - startTime;
                if (totalOperations > MAX_OPERATIONS) {
                    throw new Error('プログラムが長時間実行されたため自動停止されました（最大操作回数: ' + MAX_OPERATIONS + '回）');
                }
                if (elapsedTime > MAX_EXECUTION_TIME) {
                    throw new Error('プログラムが長時間実行されたため自動停止されました（最大実行時間: 30秒）');
                }
                
                return await this.gameEngine.turnRight();
            },
            turnAround: async () => {
                if (this.gameEngine.shouldStop) throw new Error('プログラムが停止されました');
                
                totalOperations++;
                const elapsedTime = Date.now() - startTime;
                if (totalOperations > MAX_OPERATIONS) {
                    throw new Error('プログラムが長時間実行されたため自動停止されました（最大操作回数: ' + MAX_OPERATIONS + '回）');
                }
                if (elapsedTime > MAX_EXECUTION_TIME) {
                    throw new Error('プログラムが長時間実行されたため自動停止されました（最大実行時間: 30秒）');
                }
                
                return await this.gameEngine.turnAround();
            },
            checkWallAhead: () => {
                if (this.gameEngine.shouldStop) throw new Error('プログラムが停止されました');
                return this.gameEngine.checkWallAhead();
            },
            checkGoalReached: () => {
                if (this.gameEngine.shouldStop) throw new Error('プログラムが停止されました');
                return this.gameEngine.checkGoalReached();
            },
            checkItemHere: () => {
                if (this.gameEngine.shouldStop) throw new Error('プログラムが停止されました');
                return this.gameEngine.checkItemHere();
            },
            collectItem: async () => {
                if (this.gameEngine.shouldStop) throw new Error('プログラムが停止されました');
                
                totalOperations++;
                const elapsedTime = Date.now() - startTime;
                if (totalOperations > MAX_OPERATIONS) {
                    throw new Error('プログラムが長時間実行されたため自動停止されました（最大操作回数: ' + MAX_OPERATIONS + '回）');
                }
                if (elapsedTime > MAX_EXECUTION_TIME) {
                    throw new Error('プログラムが長時間実行されたため自動停止されました（最大実行時間: 30秒）');
                }
                
                return await this.gameEngine.collectItem();
            },
            dropItem: async () => {
                if (this.gameEngine.shouldStop) throw new Error('プログラムが停止されました');
                
                totalOperations++;
                const elapsedTime = Date.now() - startTime;
                if (totalOperations > MAX_OPERATIONS) {
                    throw new Error('プログラムが長時間実行されたため自動停止されました（最大操作回数: ' + MAX_OPERATIONS + '回）');
                }
                if (elapsedTime > MAX_EXECUTION_TIME) {
                    throw new Error('プログラムが長時間実行されたため自動停止されました（最大実行時間: 30秒）');
                }
                
                return await this.gameEngine.dropItem();
            },
            placeItem: async () => {
                if (this.gameEngine.shouldStop) throw new Error('プログラムが停止されました');
                
                totalOperations++;
                const elapsedTime = Date.now() - startTime;
                if (totalOperations > MAX_OPERATIONS) {
                    throw new Error('プログラムが長時間実行されたため自動停止されました（最大操作回数: ' + MAX_OPERATIONS + '回）');
                }
                if (elapsedTime > MAX_EXECUTION_TIME) {
                    throw new Error('プログラムが長時間実行されたため自動停止されました（最大実行時間: 30秒）');
                }
                
                return await this.gameEngine.placeItem();
            },
            wait: async (seconds) => {
                if (this.gameEngine.shouldStop) throw new Error('プログラムが停止されました');
                return await this.gameEngine.wait(seconds);
            },
            sleep: async (ms) => {
                if (this.gameEngine.shouldStop) throw new Error('プログラムが停止されました');
                return await this.gameEngine.sleep(ms);
            }
        };

        // AsyncFunctionコンストラクタでコードを実行
        try {
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            
            // Blocklyで定義された関数を含むコードの処理
            let fullCode = code;
            
            // Blockly.JavaScript.definitions_から関数定義を取得
            if (typeof Blockly !== 'undefined' && Blockly.JavaScript && Blockly.JavaScript.definitions_) {
                const definitions = Object.values(Blockly.JavaScript.definitions_);
                if (definitions.length > 0) {
                    // 関数定義をコードの前に追加
                    const definitionsCode = definitions.join('\n');
                    fullCode = definitionsCode + '\n' + code;
                    console.log('関数定義を含むコード:', fullCode);
                }
            }
            
            const executeFn = new AsyncFunction('robot', fullCode);
            await executeFn(robotApi);
        } catch (error) {
            throw new Error('コード実行エラー: ' + error.message);
        }
    }

    // プログラム停止
    async stopProgram() {
        if (!this.isRunning) return;
        
        // 実行フラグを即座に停止
        this.isRunning = false;
        
        // ゲームエンジンに停止指示
        this.gameEngine.shouldStop = true;
        this.gameEngine.isRunning = false;
        
        // 実行中のプロミスがあれば例外を投げて停止
        if (this.runningExecution) {
            // プロミスをキャンセルするため、エラーを投げる
            this.runningExecution = null;
        }
        
        // UIを即座に更新
        document.getElementById('runProgram').disabled = false;
        document.getElementById('stopProgram').disabled = true;
        
        // 少し待ってから停止フラグをリセット
        setTimeout(() => {
            this.gameEngine.shouldStop = false;
        }, 200);
    }

    // プログラムリセット
    async resetProgram() {
        // 実行中なら即座に停止
        if (this.isRunning) {
            await this.stopProgram();
        }
        
        // ゲームエンジンをリセット
        this.gameEngine.reset();
        
        // プログレスバーのリセット
        document.getElementById('progressFill').style.width = '0%';
    }

    // ヒント表示
    showHint() {
        const stage = this.stageManager.getStage(this.currentCategory, this.currentLevel);
        if (stage && stage.hint) {
            document.getElementById('hintContent').innerHTML = `<p>${stage.hint}</p>`;
            document.getElementById('hintModal').style.display = 'block';
        }
    }

    // 次のステージ
    nextStage() {
        if (this.stageManager.hasNextStage(this.currentCategory, this.currentLevel)) {
            this.currentLevel++;
        } else {
            // 次のカテゴリに移動
            const categories = ['basic-movement', 'loops', 'conditions', 'variables', 'functions', 'challenge'];
            const currentIndex = categories.indexOf(this.currentCategory);
            if (currentIndex < categories.length - 1) {
                this.currentCategory = categories[currentIndex + 1];
                this.currentLevel = 0;
                document.getElementById('stageSelect').value = this.currentCategory;
                this.stageManager.updateLearningContent(this.currentCategory);
            } else {
                alert('おめでとうございます！全てのステージをクリアしました！');
                return;
            }
        }
        
        this.loadCurrentStage();
    }

    // 現在のステージを読み込み
    loadCurrentStage() {
        const stage = this.stageManager.getStage(this.currentCategory, this.currentLevel);
        if (!stage) {
            console.error('ステージが見つかりません:', this.currentCategory, this.currentLevel);
            return;
        }

        // ゲームエンジンにステージを読み込み
        this.gameEngine.loadStage(stage);

        // UIの更新
        document.getElementById('currentStageInfo').textContent = 
            `ステージ ${this.getSubLevel()}-${this.currentLevel + 1}`;
        document.getElementById('missionDescription').textContent = stage.description;

        // ステージセレクターの同期
        document.getElementById('stageSelect').value = this.currentCategory;
        document.getElementById('levelSelect').value = this.currentLevel;
        
        // レベルセレクターを更新（完了状況を反映）
        this.updateLevelSelector(this.currentCategory);

        // 初期ブロックの設定
        setInitialBlocks(this.currentCategory);

        // 次のステージボタンの表示制御
        const hasNext = this.stageManager.hasNextStage(this.currentCategory, this.currentLevel) ||
                       this.hasNextCategory();
        document.getElementById('nextStage').style.display = 'none'; // 初期は非表示

        // ステージセレクターボタンのテキスト更新
        this.updateStageToggleText();

        console.log(`ステージ読み込み完了: ${stage.title}`);
    }

    // ステージ説明の更新
    updateStageDescription() {
        const selectedCategory = document.getElementById('stageSelect').value;
        const selectedLevel = parseInt(document.getElementById('levelSelect').value);
        
        const stage = this.stageManager.getStage(selectedCategory, selectedLevel);
        const descriptionEl = document.getElementById('stageDescription');
        
        if (stage) {
            descriptionEl.textContent = stage.description;
            descriptionEl.style.color = '#666';
        } else {
            descriptionEl.textContent = 'ステージを選択すると詳細が表示されます';
            descriptionEl.style.color = '#999';
        }
    }

    // サブレベルの取得（カテゴリ内のステージ番号）
    getSubLevel() {
        const categoryMap = {
            'basic-movement': 1,
            'loops': 2,
            'conditions': 3,
            'variables': 4,
            'functions': 5,
            'challenge': 6
        };
        return categoryMap[this.currentCategory] || 1;
    }

    // 次のカテゴリがあるかチェック
    hasNextCategory() {
        const categories = ['basic-movement', 'loops', 'conditions', 'variables', 'functions', 'challenge'];
        const currentIndex = categories.indexOf(this.currentCategory);
        return currentIndex < categories.length - 1;
    }

    // ステージクリア時の処理
    onStageComplete() {
        const stage = this.stageManager.getStage(this.currentCategory, this.currentLevel);
        if (stage) {
            this.stageManager.markCompleted(stage.id);
            document.getElementById('nextStage').style.display = 'block';
            
            // レベルセレクターを更新して完了マークを反映
            this.updateLevelSelector(this.currentCategory);
        }
    }

    // レベルセレクターの更新
    updateLevelSelector(category) {
        const levelSelect = document.getElementById('levelSelect');
        levelSelect.innerHTML = '';
        
        const stageCount = this.stageManager.getStageCount(category);
        const stages = this.stageManager.stages[category];
        
        for (let i = 0; i < stageCount; i++) {
            const stage = stages[i];
            const option = document.createElement('option');
            option.value = i;
            
            // ステージのタイトルから詳細な名前を取得
            const categoryDisplayName = this.getCategoryDisplayName(category);
            const levelName = stage.title.includes(' - ') 
                ? stage.title.split(' - ')[1] 
                : `レベル ${i + 1}`;
            option.textContent = `${levelName}`;
            
            // 完了済みの場合は視覚的に表示
            if (this.stageManager.completedStages.has(stage.id)) {
                option.textContent += ' ✓';
                option.style.color = '#28a745';
            }
            
            levelSelect.appendChild(option);
        }
        
        // 初期選択
        levelSelect.value = this.currentCategory === category ? this.currentLevel : 0;
        
        // ステージ説明を更新（呼び出し元がloadCurrentStageでない場合のみ）
        if (this.currentCategory === category && this.currentLevel === levelSelect.value) {
            this.updateStageDescription();
        }
    }

    // カテゴリの表示名を取得
    getCategoryDisplayName(category) {
        const names = {
            'basic-movement': '基本移動',
            'loops': 'ループ',
            'conditions': '条件分岐',
            'variables': '変数の使用',
            'functions': '関数の定義',
            'challenge': '総合チャレンジ'
        };
        return names[category] || category;
    }

    // 選択されたステージに移動
    goToSelectedStage() {
        const selectedCategory = document.getElementById('stageSelect').value;
        const selectedLevel = parseInt(document.getElementById('levelSelect').value);
        
        this.currentCategory = selectedCategory;
        this.currentLevel = selectedLevel;
        
        this.stageManager.updateLearningContent(selectedCategory);
        this.loadCurrentStage();
        
        // ステージセレクターパネルを閉じる
        this.hideStageSelector();
        
        console.log(`ステージ移動: ${selectedCategory} - レベル ${selectedLevel + 1}`);
    }

    // カテゴリ変更（レベルセレクターも更新）
    changeCategory(category) {
        this.currentCategory = category;
        this.currentLevel = 0;
        this.updateLevelSelector(category);
        this.stageManager.updateLearningContent(category);
        this.loadCurrentStage();
    }

    // 生成されたコードの安全性チェック
    hasUnsafeCode(code) {
        if (!code || typeof code !== 'string') {
            return false;
        }
        
        // 危険なパターンをチェック
        const dangerousPatterns = [
            /while\s*\(\s*true\s*\)\s*\{\s*\}/g,  // 空のwhile(true)
            /while\s*\(\s*[^)]+\s*\)\s*\{\s*\}/g,  // 空のwhile文
            /for\s*\([^)]*\)\s*\{\s*\}/g,         // 空のfor文
        ];
        
        for (let pattern of dangerousPatterns) {
            if (pattern.test(code)) {
                console.warn('危険なコードパターンを検出:', code.match(pattern));
                return true;
            }
        }
        
        // while文の詳細チェック
        if (this.hasEmptyWhileLoop(code)) {
            return true;
        }
        
        return false;
    }
    
    // 空のwhile文の検出
    hasEmptyWhileLoop(code) {
        // while文の正規表現マッチング
        const whileMatches = code.match(/while\s*\([^)]+\)\s*\{[^}]*\}/g);
        
        if (whileMatches) {
            for (let whileBlock of whileMatches) {
                // while文の中身を取得
                const bodyMatch = whileBlock.match(/\{([^}]*)\}/);
                if (bodyMatch) {
                    const body = bodyMatch[1].trim();
                    
                    // 空か、コメントやセミコロンのみの場合
                    if (!body || 
                        body.match(/^\s*$/) ||                    // 完全に空
                        body.match(/^\s*(\/\/.*|\*.*\*\/|;)*\s*$/)) { // コメントかセミコロンのみ
                        console.warn('空のwhile文を検出:', whileBlock);
                        return true;
                    }
                    
                    // 実質的に何もしない処理のみの場合
                    const meaninglessPatterns = [
                        /^\s*\/\/.*\s*$/,     // コメントのみ
                        /^\s*;\s*$/,          // セミコロンのみ
                        /^\s*\{\s*\}\s*$/     // 空のブロック
                    ];
                    
                    for (let pattern of meaninglessPatterns) {
                        if (pattern.test(body)) {
                            console.warn('意味のないwhile文を検出:', whileBlock);
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }

    // ステージセレクターの表示/非表示
    toggleStageSelector() {
        const panel = document.getElementById('stageSelectorPanel');
        const isVisible = panel.classList.contains('show');
        
        if (isVisible) {
            this.hideStageSelector();
        } else {
            this.showStageSelector();
        }
    }

    showStageSelector() {
        const panel = document.getElementById('stageSelectorPanel');
        panel.classList.add('show');
    }

    hideStageSelector() {
        const panel = document.getElementById('stageSelectorPanel');
        panel.classList.remove('show');
    }

    // ステージセレクターボタンのテキスト更新
    updateStageToggleText() {
        const currentStage = this.stageManager.getStage(this.currentCategory, this.currentLevel);
        const categoryName = this.getCategoryDisplayName(this.currentCategory);
        const toggleText = document.querySelector('.toggle-text');
        
        if (currentStage && toggleText) {
            toggleText.textContent = `${categoryName} ${this.currentLevel + 1}`;
        }
    }
}

// グローバルインスタンス
let app;

// ページ読み込み完了時の初期化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded - アプリケーション開始');
    
    // Blocklyが完全に読み込まれるまで少し待つ
    setTimeout(async () => {
        try {
            app = new RobotProgrammingApp();
            await app.initialize();
        } catch (error) {
            console.error('アプリケーション開始エラー:', error);
            alert('アプリケーションの開始に失敗しました。ページを再読み込みしてください。');
        }
    }, 100);
});

// エラーハンドリング
window.addEventListener('error', (e) => {
    console.error('グローバルエラー:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('未処理のPromise拒否:', e.reason);
});
