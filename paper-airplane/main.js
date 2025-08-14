// Blockly ワークスペース
let workspace;

// チュートリアル状態管理
let isTutorial = false;

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOMContentLoaded イベントが発生しました');

    // BGMモーダルの初期化
    initializeBGMModal();

    // Blocklyが完全に読み込まれるまで少し待つ
    setTimeout(function () {
        try {
            console.log('Blockly を初期化しています...');

            console.log('ゲームを初期化しています...');
            initializeGame();
            console.log('ゲームの初期化が完了しました');

            initializeBlockly();
            console.log('Blockly の初期化が完了しました');

            console.log('イベントリスナーを設定しています...');
            setupEventListeners();
            console.log('イベントリスナーの設定が完了しました');

            console.log('すべての初期化が完了しました');
        } catch (error) {
            console.error('初期化エラー:', error);
            alert('初期化エラーが発生しました: ' + error.message);
        }
    }, 100); // 100ms待機
});

// Blockly の初期化
function initializeBlockly() {
    try {
        console.log('Blockly バージョン:', Blockly.VERSION || 'unknown');

        // まずカスタムブロックを初期化
        if (typeof initializeCustomBlocks === 'function') {
            initializeCustomBlocks();
        } else {
            console.error('initializeCustomBlocks 関数が見つかりません');
            throw new Error('カスタムブロックの初期化に失敗しました');
        }

        workspace = Blockly.inject('blocklyDiv', {
            toolbox: document.getElementById('toolbox'),
            scrollbars: true,
            horizontalLayout: false,
            toolboxPosition: 'start',
            grid: {
                spacing: 20,
                length: 3,
                colour: '#ccc',
                snap: true
            },
            zoom: {
                controls: true,
                wheel: true,
                startScale: 1.0,
                maxScale: 3,
                minScale: 0.3,
                scaleSpeed: 1.2
            },
            trashcan: true,
            sounds: false
        });

        console.log('Blockly workspace が作成されました:', workspace);

        // ワークスペース作成後にコード生成器を再登録
        console.log('ワークスペース作成後のコード生成器再登録');
        if (typeof registerJavaScriptGenerators === 'function') {
            registerJavaScriptGenerators();
        }

    } catch (error) {
        console.error('Blockly 初期化エラー:', error);
        throw error;
    }

    // 初期ブロックを設定
    try {
        const xmlText = `
            <xml xmlns="https://developers.google.com/blockly/xml">
                <block type="set_angle" x="20" y="20">
                    <value name="ANGLE">
                        <shadow type="math_number">
                            <field name="NUM">0</field>
                        </shadow>
                    </value>
                    <next>
                        <block type="set_power">
                            <value name="POWER">
                                <shadow type="math_number">
                                    <field name="NUM">5</field>
                                </shadow>
                            </value>
                            <next>
                                <block type="set_balance">
                                    <value name="BALANCE">
                                        <shadow type="math_number">
                                            <field name="NUM">5</field>
                                        </shadow>
                                    </value>
                                </block>
                            </next>
                        </block>
                    </next>
                </block>
            </xml>
        `;

        let xml;
        // 新しいAPIを試す
        if (Blockly.utils && Blockly.utils.xml && Blockly.utils.xml.textToDom) {
            xml = Blockly.utils.xml.textToDom(xmlText);
        } else if (Blockly.Xml && Blockly.Xml.textToDom) {
            // 古いAPIにフォールバック
            xml = Blockly.Xml.textToDom(xmlText);
        } else {
            // DOMParserを使用
            const parser = new DOMParser();
            xml = parser.parseFromString(xmlText, 'text/xml').documentElement;
        }

        // ワークスペースに適用
        if (Blockly.serialization && Blockly.serialization.workspaces) {
            // 新しいシリアライゼーションAPI
            Blockly.serialization.workspaces.load(xml, workspace);
        } else if (Blockly.Xml && Blockly.Xml.domToWorkspace) {
            // 古いAPI
            Blockly.Xml.domToWorkspace(xml, workspace);
        }

        console.log('初期ブロックが正常に配置されました');
    } catch (error) {
        console.warn('初期ブロックの配置でエラーが発生:', error);
        console.log('手動でブロックを配置してください');
    }
}

// ゲームの初期化
function initializeGame() {
    console.log('PaperAirplaneGame クラスをインスタンス化しています...');
    game = new PaperAirplaneGame();
    console.log('ゲームオブジェクトが作成されました:', game);

    // 明示的に初期値を設定
    game.setAngle(0);
    game.setPower(5);
    game.setBalance(5);
    console.log('初期パラメーターを設定しました: 角度=0, 強さ=5, 重心=5');
}

// イベントリスナーの設定
function setupEventListeners() {
    // 既存のリスナーを削除してから新しいリスナーを追加
    const runButton = document.getElementById('runButton');
    runButton.removeEventListener('click', runCode);
    runButton.addEventListener('click', async function () {
        // BGMの初期化を試行
        if (game && !game.audioContext) {
            console.log('実行ボタンクリック - BGM初期化を試行');
            try {
                await game.ensureAudioContext();
            } catch (error) {
                console.warn('実行ボタンからのBGM初期化に失敗:', error);
            }
        }
        runCode();
    });

    const resetButton = document.getElementById('resetButton');
    resetButton.removeEventListener('click', resetGame);
    resetButton.addEventListener('click', resetGame);

    const stopLoopButton = document.getElementById('stopLoopButton');
    stopLoopButton.removeEventListener('click', stopLoop);
    stopLoopButton.addEventListener('click', stopLoop);

    const stageStartButton = document.getElementById('stageStartButton');
    stageStartButton.removeEventListener('click', startStage);
    stageStartButton.addEventListener('click', startStage);

    const stageResetButton = document.getElementById('stageResetButton');
    stageResetButton.removeEventListener('click', resetStage);
    stageResetButton.addEventListener('click', resetStage);

    // 効果音切り替えボタン
    const soundToggleButton = document.getElementById('soundToggleButton');
    soundToggleButton.addEventListener('click', function () {
        if (game && game.toggleSound) {
            const enabled = game.toggleSound();
            soundToggleButton.textContent = enabled ? '🔊' : '🔇';
            soundToggleButton.title = enabled ? '効果音をオフにする' : '効果音をオンにする';
        }
    });

    // BGM切り替えボタン
    const bgmToggleButton = document.getElementById('bgmToggleButton');
    if (bgmToggleButton) {
        bgmToggleButton.addEventListener('click', function () {
            if (game && game.toggleBGM) {
                const enabled = game.toggleBGM();
                bgmToggleButton.textContent = enabled ? '🎵' : '🔇';
                bgmToggleButton.title = enabled ? 'BGMをオフにする' : 'BGMをオンにする';
            }
        });

        // BGMの初期化を試行（クリック時）
        bgmToggleButton.addEventListener('click', async function () {
            if (game && !game.audioContext) {
                console.log('BGMボタンクリック - AudioContext初期化を試行');
                try {
                    await game.ensureAudioContext();
                } catch (error) {
                    console.warn('BGMボタンからのAudioContext初期化に失敗:', error);
                }
            }
        }, { once: true }); // 一度だけ実行
    }

    // 音量設定ボタン
    const volumeSettingsButton = document.getElementById('volumeSettingsButton');
    const volumePanel = document.getElementById('volumePanel');
    if (volumeSettingsButton && volumePanel) {
        volumeSettingsButton.addEventListener('click', function () {
            const isVisible = volumePanel.style.display !== 'none';
            volumePanel.style.display = isVisible ? 'none' : 'block';
        });

        // パネル外をクリックしたら閉じる
        document.addEventListener('click', function (event) {
            if (!volumePanel.contains(event.target) && !volumeSettingsButton.contains(event.target)) {
                volumePanel.style.display = 'none';
            }
        });
    }

    // 効果音音量スライダー
    const soundVolumeSlider = document.getElementById('soundVolumeSlider');
    const soundVolumeValue = document.getElementById('soundVolumeValue');
    if (soundVolumeSlider && soundVolumeValue) {
        soundVolumeSlider.addEventListener('input', function () {
            const volume = this.value / 100;
            soundVolumeValue.textContent = this.value + '%';
            if (game && game.setSoundVolume) {
                game.setSoundVolume(volume);
            }
        });
    }

    // BGM音量スライダー
    const bgmVolumeSlider = document.getElementById('bgmVolumeSlider');
    const bgmVolumeValue = document.getElementById('bgmVolumeValue');
    if (bgmVolumeSlider && bgmVolumeValue) {
        bgmVolumeSlider.addEventListener('input', function () {
            const volume = this.value / 100;
            bgmVolumeValue.textContent = this.value + '%';
            if (game && game.setBGMVolume) {
                game.setBGMVolume(volume);
            }
        });
    }

    // ステージスキップボタン
    document.getElementById('stageSkipButton').addEventListener('click', skipStage);

    // ヘルプモーダルの初期化
    initializeHelpModal();

    // チュートリアルの初期化
    initializeTutorial();

    // インタラクティブガイドの初期化（チュートリアルの代替）
    initializeInteractiveGuide();

    // ウィンドウリサイズ時の処理
    window.addEventListener('resize', function () {
        Blockly.svgResize(workspace);
    });
}

// 実行中フラグ
let isExecuting = false;

// コードを実行
function runCode() {
    try {
        console.log('runCode() が呼び出されました');
        console.log('チュートリアル状態:', isTutorial);
        console.log('実行中フラグ:', isExecuting);

        // 実行中の場合は無視
        if (isExecuting) {
            console.log('既に実行中のため、リクエストを無視します');
            return;
        }

        if (!workspace) {
            console.error('Blockly workspace が初期化されていません');
            alert('エラー: Blockly workspace が初期化されていません');
            return;
        }

        if (!game) {
            console.error('ゲームが初期化されていません');
            alert('エラー: ゲームが初期化されていません');
            return;
        }

        // Blocklyからコードを生成
        let code;
        try {
            console.log('使用可能なコード生成器をチェック:');
            console.log('- Blockly.javascript:', typeof Blockly.javascript);
            console.log('- Blockly.JavaScript:', typeof Blockly.JavaScript);

            // まず、カスタムブロックのコード生成器が登録されているか確認
            if (Blockly.JavaScript) {
                console.log('Blockly.JavaScript のカスタムブロック:');
                console.log('- set_angle:', typeof Blockly.JavaScript['set_angle']);
                console.log('- set_power:', typeof Blockly.JavaScript['set_power']);
                console.log('- throw_airplane:', typeof Blockly.JavaScript['throw_airplane']);

                // forBlock形式も確認
                if (Blockly.JavaScript.forBlock) {
                    console.log('Blockly.JavaScript.forBlock のカスタムブロック:');
                    console.log('- set_angle:', typeof Blockly.JavaScript.forBlock['set_angle']);
                    console.log('- set_power:', typeof Blockly.JavaScript.forBlock['set_power']);
                    console.log('- throw_airplane:', typeof Blockly.JavaScript.forBlock['throw_airplane']);
                }

                // コード生成器が登録されていない場合は強制再登録
                const hasOldStyle = typeof Blockly.JavaScript['set_angle'] === 'function';
                const hasNewStyle = Blockly.JavaScript.forBlock && typeof Blockly.JavaScript.forBlock['set_angle'] === 'function';

                if (!hasOldStyle && !hasNewStyle) {
                    console.warn('カスタムブロックが登録されていません。強制再登録します。');
                    if (typeof registerJavaScriptGenerators === 'function') {
                        registerJavaScriptGenerators();
                    }
                }
            }

            if (Blockly.JavaScript && Blockly.JavaScript.workspaceToCode) {
                console.log('Blockly.JavaScript でコード生成開始');

                // ワークスペース内の各ブロックをチェック
                const blocks = workspace.getAllBlocks(false);
                console.log('コード生成前のブロック確認:');
                blocks.forEach((block, index) => {
                    const oldStyleExists = typeof Blockly.JavaScript[block.type] === 'function';
                    const newStyleExists = Blockly.JavaScript.forBlock && typeof Blockly.JavaScript.forBlock[block.type] === 'function';
                    const generatorExists = oldStyleExists || newStyleExists;
                    console.log(`${index + 1}. ${block.type} - Generator: ${generatorExists ? 'OK' : 'Missing'} (Old: ${oldStyleExists}, New: ${newStyleExists})`);
                });

                code = Blockly.JavaScript.workspaceToCode(workspace);
                console.log('コード生成成功');
            } else if (Blockly.javascript && Blockly.javascript.workspaceToCode) {
                console.log('Blockly.javascript でコード生成');
                code = Blockly.javascript.workspaceToCode(workspace);
            } else {
                throw new Error('Blockly JavaScript generator が見つかりません');
            }
        } catch (generationError) {
            console.error('コード生成エラー:', generationError);

            // ワークスペース内のブロックを確認
            const blocks = workspace.getAllBlocks(false);
            console.log('ワークスペース内のブロック:');
            blocks.forEach((block, index) => {
                console.log(`${index + 1}. ${block.type}`);
            });

            throw new Error('コード生成に失敗しました: ' + generationError.message);
        }

        console.log('生成されたコード:');
        console.log(code);

        if (!code.trim()) {
            alert('ブロックを配置してください！');
            return;
        }

        // グローバル関数が存在するかチェック
        if (typeof setAngle !== 'function') {
            console.error('setAngle 関数が見つかりません');
        }
        if (typeof setPower !== 'function') {
            console.error('setPower 関数が見つかりません');
        }
        if (typeof setBalance !== 'function') {
            console.error('setBalance 関数が見つかりません');
        }
        if (typeof throwAirplane !== 'function') {
            console.error('throwAirplane 関数が見つかりません');
            isExecuting = false;
            return;
        }

        // 実行フラグを設定
        isExecuting = true;

        // コードを実行
        console.log('コードを実行します...');
        eval(code);
        console.log('コードの実行が完了しました');

    } catch (error) {
        console.error('コード実行エラー:', error);
        alert('エラーが発生しました: ' + error.message);
    } finally {
        // 実行フラグを解除
        isExecuting = false;
    }
}

// ゲームをリセット
function resetGame() {
    if (game) {
        game.reset();
    }
}

// チュートリアル開始
function startTutorial() {
    isTutorial = true;
    console.log('チュートリアルを開始しました');
    // チュートリアル用のUIや説明を表示する処理をここに追加
}

// チュートリアル終了
function endTutorial() {
    isTutorial = false;
    console.log('チュートリアルを終了しました');
    // チュートリアル用のUIを非表示にする処理をここに追加
}

// チュートリアル状態を切り替え
function toggleTutorial() {
    if (isTutorial) {
        endTutorial();
    } else {
        startTutorial();
    }
}

// ブロックの値が変更された時の処理
function onBlockChange() {
    // リアルタイムでパラメーターを更新する場合
    // const code = Blockly.JavaScript.workspaceToCode(workspace);
    // if (code.includes('setAngle') || code.includes('setPower')) {
    //     eval(code);
    // }
}

// Blocklyワークスペースの変更イベント
// workspace.addChangeListener(onBlockChange);

// ヘルプモーダルの機能
function initializeHelpModal() {
    const helpButton = document.getElementById('helpButton');
    const helpModal = document.getElementById('helpModal');
    const closeButton = helpModal.querySelector('.close');

    // ヘルプボタンクリック時
    helpButton.addEventListener('click', function () {
        helpModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 背景のスクロールを無効化
    });

    // 閉じるボタンクリック時
    closeButton.addEventListener('click', function () {
        helpModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // 背景のスクロールを有効化
    });

    // モーダル外クリック時に閉じる
    helpModal.addEventListener('click', function (event) {
        if (event.target === helpModal) {
            helpModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // ESCキーで閉じる
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && helpModal.style.display === 'block') {
            helpModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // 月着陸ヒントボタンの初期化
    const moonHintButton = document.getElementById('moonHintButton');
    const moonHintContent = document.getElementById('moonHintContent');

    if (moonHintButton && moonHintContent) {
        moonHintButton.addEventListener('click', function () {
            const isVisible = moonHintContent.style.display !== 'none';
            moonHintContent.style.display = isVisible ? 'none' : 'block';
            moonHintButton.title = isVisible ? '月着陸のヒント' : 'ヒントを隠す';
        });
    }
}

// チュートリアル機能
let tutorialData = {
    currentStep: 0,
    steps: [
        {
            title: "🌟 紙飛行機ゲームへようこそ！",
            content: `
                <p>このゲームでは、Blocklyブロックを使って紙飛行機のパラメータを設定し、より遠くまで飛ばすことを目指します。</p>
                <div class="tutorial-image">🛩️ 紙飛行機シミュレーター</div>
                <p>まずは基本的な操作から学んでいきましょう！</p>
            `
        },
        {
            title: "🧩 ブロックを使ってみよう",
            content: `
                <p>左側のツールボックスから、ブロックをドラッグ&ドロップして使います。</p>
                <div class="tutorial-highlight">
                    <strong>基本的なブロック：</strong><br>
                    • 投げる角度を設定<br>
                    • 投げる強さを設定<br>
                    • 重心を設定<br>
                    • 紙飛行機を飛ばす
                </div>
                <div class="tutorial-tip">
                    ブロックは上から下の順番で実行されます。
                </div>
            `
        },
        {
            title: "🎯 最初のプログラムを作ろう",
            content: `
                <p>簡単なプログラムを作ってみましょう：</p>
                <div class="tutorial-block-example">
                    1. 「投げる角度を 45 度に設定」<br>
                    2. 「投げる強さを 10 に設定」<br>
                    3. 「重心を 5 に設定」<br>
                    4. 「紙飛行機を飛ばす」
                </div>
                <div class="tutorial-tip">
                    数値ブロックをクリックして値を変更できます。
                </div>
            `
        },
        {
            title: "🔄 ループを使ってみよう",
            content: `
                <p>ループブロックを使うと、自動で複数回飛行させることができます。</p>
                <div class="tutorial-highlight">
                    <strong>ループの種類：</strong><br>
                    • 繰り返し回数：指定した回数だけ実行<br>
                    • 飛距離条件ループ：目標距離以上になるまで実行
                </div>
                <div class="tutorial-block-example">
                    繰り返し回数: 3<br>
                    └─ 投げる角度を 45 度に設定<br>
                    └─ 紙飛行機を飛ばす
                </div>
            `
        },
        {
            title: "🏆 上達のコツ",
            content: `
                <p>より良い記録を出すためのポイント：</p>
                <div class="tutorial-highlight">
                    <strong>パラメータのコツ：</strong><br>
                    • <strong>角度</strong>：45度前後がバランス良し<br>
                    • <strong>強さ</strong>：10-20が扱いやすい<br>
                    • <strong>重心</strong>：5（中央）から始めよう
                </div>
                <div class="tutorial-tip">
                    特定の組み合わせで特殊なイベントが発生することも...？
                </div>
                <p>これでチュートリアルは完了です！<br>いろいろな組み合わせを試して、最高記録を目指しましょう！</p>
            `
        }
    ]
};

// チュートリアル機能
function initializeTutorial() {
    const tutorialButton = document.getElementById('tutorialButton');
    const tutorialModal = document.getElementById('tutorialModal');
    const closeButton = tutorialModal.querySelector('.tutorial-close');
    const prevButton = document.getElementById('tutorialPrev');
    const nextButton = document.getElementById('tutorialNext');
    const completeButton = document.getElementById('tutorialComplete');
    const tutorialContent = document.getElementById('tutorialContent');
    const tutorialStep = document.getElementById('tutorialStep');

    // チュートリアルボタンクリック時
    tutorialButton.addEventListener('click', function () {
        tutorialData.currentStep = 0;
        updateTutorialContent();
        tutorialModal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // チュートリアル開始フラグを設定
        isTutorial = true;
        console.log('チュートリアル開始: isTutorial =', isTutorial);
    });

    // 閉じるボタンクリック時
    closeButton.addEventListener('click', function () {
        closeTutorial();
    });

    // モーダル外クリック時に閉じる
    tutorialModal.addEventListener('click', function (event) {
        if (event.target === tutorialModal) {
            closeTutorial();
        }
    });

    // 前へボタン
    prevButton.addEventListener('click', function () {
        if (tutorialData.currentStep > 0) {
            tutorialData.currentStep--;
            updateTutorialContent();
        }
    });

    // 次へボタン
    nextButton.addEventListener('click', function () {
        if (tutorialData.currentStep < tutorialData.steps.length - 1) {
            tutorialData.currentStep++;
            updateTutorialContent();
        }
    });

    // 完了ボタン
    completeButton.addEventListener('click', function () {
        closeTutorial();
        // 完了メッセージを表示
        if (game) {
            game.showMessage('チュートリアル完了！🎉\nさっそく紙飛行機を飛ばしてみましょう！', 'info');
        }
    });

    // ESCキーで閉じる
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && tutorialModal.style.display === 'block') {
            closeTutorial();
        }
    });

    function updateTutorialContent() {
        const step = tutorialData.steps[tutorialData.currentStep];
        tutorialStep.textContent = `ステップ ${tutorialData.currentStep + 1} / ${tutorialData.steps.length}`;

        tutorialContent.innerHTML = `
            <div class="tutorial-step">
                <h3>${step.title}</h3>
                ${step.content}
            </div>
        `;

        // ボタンの表示制御
        prevButton.disabled = tutorialData.currentStep === 0;

        if (tutorialData.currentStep === tutorialData.steps.length - 1) {
            nextButton.style.display = 'none';
            completeButton.style.display = 'block';
        } else {
            nextButton.style.display = 'block';
            completeButton.style.display = 'none';
        }
    }

    function closeTutorial() {
        tutorialModal.style.display = 'none';
        document.body.style.overflow = 'auto';

        // チュートリアル終了フラグを設定
        isTutorial = false;
        console.log('チュートリアル終了: isTutorial =', isTutorial);
    }
}

// インタラクティブガイド機能
let interactiveGuideData = {
    currentStep: 0,
    isActive: false,
    steps: [
        {
            title: "🌟 ようこそ！",
            content: "紙飛行機ゲームへようこそ！<br>左側のツールボックスからブロックをドラッグして使います。",
            target: ".blockly-section",
            position: "right"
        },
        {
            title: "🧩 ブロックを選ぼう",
            content: "「投げる角度を設定」ブロックをワークスペースにドラッグしてください。",
            target: "#blocklyDiv",
            position: "right",
            waitForAction: "blockPlaced"
        },
        {
            title: "🔢 数値を変更",
            content: "ブロックの数値をクリックして「45」に変更してみましょう。",
            target: "#blocklyDiv",
            position: "right",
            waitForAction: "valueChanged"
        },
        {
            title: "➕ ブロックを追加",
            content: "「投げる強さを設定」と「紙飛行機を飛ばす」ブロックも追加してください。<br><small>💡 3つのブロック（角度・強さ・飛ばす）が揃うと次に進みます</small>",
            target: "#blocklyDiv",
            position: "right",
            waitForAction: "moreBlocks"
        },
        {
            title: "🚀 実行してみよう",
            content: "「飛行機を飛ばす」ボタンをクリックして、プログラムを実行してみましょう！",
            target: "#runButton",
            position: "right",
            waitForAction: "buttonClick"
        },
        {
            title: "🎉 完了！",
            content: "お疲れ様でした！<br>いろいろな組み合わせを試して、最高記録を目指しましょう！",
            target: ".game-section",
            position: "left"
        }
    ]
};

function initializeInteractiveGuide() {
    const tutorialButton = document.getElementById('tutorialButton');
    const interactiveGuide = document.getElementById('interactiveGuide');
    const highlightOverlay = document.getElementById('highlightOverlay');
    const guideClose = document.getElementById('guideClose');
    const guidePrev = document.getElementById('guidePrev');
    const guideNext = document.getElementById('guideNext');
    const guideComplete = document.getElementById('guideComplete');

    // 既存のイベントリスナーをクリア（重複を防ぐため）
    const newTutorialButton = tutorialButton.cloneNode(true);
    tutorialButton.parentNode.replaceChild(newTutorialButton, tutorialButton);

    // チュートリアルボタンをインタラクティブガイド専用に設定
    newTutorialButton.addEventListener('click', function () {
        startInteractiveGuide();
    });

    // 閉じるボタン
    guideClose.addEventListener('click', function () {
        stopInteractiveGuide();
    });

    // 前へボタン
    guidePrev.addEventListener('click', function () {
        if (interactiveGuideData.currentStep > 0) {
            interactiveGuideData.currentStep--;
            updateGuideStep();
        }
    });

    // 次へボタン
    guideNext.addEventListener('click', function () {
        if (interactiveGuideData.currentStep < interactiveGuideData.steps.length - 1) {
            interactiveGuideData.currentStep++;
            updateGuideStep();
        }
    });

    // 完了ボタン
    guideComplete.addEventListener('click', function () {
        stopInteractiveGuide();
        if (game) {
            game.showMessage('チュートリアル完了！🎉\nさっそく他の組み合わせも試してみましょう！', 'info');
        }
    });

    // ESCキーで閉じる
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && interactiveGuideData.isActive) {
            stopInteractiveGuide();
        }
    });

    // ユーザーアクションの監視
    setupActionListeners();
}

function startInteractiveGuide() {
    interactiveGuideData.currentStep = 0;
    interactiveGuideData.isActive = true;

    document.getElementById('interactiveGuide').style.display = 'block';
    document.getElementById('highlightOverlay').style.display = 'block';

    updateGuideStep();
}

function stopInteractiveGuide() {
    interactiveGuideData.isActive = false;

    document.getElementById('interactiveGuide').style.display = 'none';
    document.getElementById('highlightOverlay').style.display = 'none';

    // ハイライトを削除
    clearHighlights();
}

function updateGuideStep() {
    const step = interactiveGuideData.steps[interactiveGuideData.currentStep];

    // ガイド内容を更新
    document.getElementById('guideStep').textContent = `${interactiveGuideData.currentStep + 1} / ${interactiveGuideData.steps.length}`;
    document.getElementById('guideTitle').textContent = step.title;
    document.getElementById('guideContent').innerHTML = step.content;

    // ボタンの表示制御
    document.getElementById('guidePrev').disabled = interactiveGuideData.currentStep === 0;

    if (interactiveGuideData.currentStep === interactiveGuideData.steps.length - 1) {
        document.getElementById('guideNext').style.display = 'none';
        document.getElementById('guideComplete').style.display = 'block';
    } else {
        document.getElementById('guideNext').style.display = 'block';
        document.getElementById('guideComplete').style.display = 'none';
    }

    // ターゲット要素をハイライト
    highlightElement(step.target);

    // ガイドの位置を調整
    positionGuide(step.target, step.position);
}

function highlightElement(selector) {
    // 既存のハイライトを削除
    clearHighlights();

    // 新しい要素をハイライト
    const element = document.querySelector(selector);
    if (element) {
        element.classList.add('highlight-element');
    }
}

function clearHighlights() {
    const highlighted = document.querySelectorAll('.highlight-element');
    highlighted.forEach(el => el.classList.remove('highlight-element'));
}

function positionGuide(targetSelector, position) {
    const guide = document.getElementById('interactiveGuide');
    const target = document.querySelector(targetSelector);

    if (!target) return;

    const targetRect = target.getBoundingClientRect();
    const guideWidth = 320;
    const guideHeight = guide.offsetHeight || 300;
    const margin = 20;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // 基本位置をリセット
    guide.style.top = '';
    guide.style.right = '';
    guide.style.left = '';
    guide.style.transform = '';

    // モバイル・タブレット対応：画面幅が768px以下の場合は下部固定
    if (windowWidth <= 768) {
        guide.style.position = 'fixed';
        guide.style.bottom = '20px';
        guide.style.left = '20px';
        guide.style.right = '20px';
        guide.style.top = 'auto';
        guide.style.width = 'auto';
        guide.style.transform = 'none';
        return;
    }

    // デスクトップでの位置調整
    let finalPosition = position;

    // 右側配置の場合のチェック
    if (position === 'right') {
        const leftPos = targetRect.right + margin;
        if (leftPos + guideWidth > windowWidth) {
            finalPosition = 'left'; // 右側に空きがない場合は左側に
        }
    }

    // 左側配置の場合のチェック
    if (finalPosition === 'left') {
        const rightEdge = targetRect.left - margin;
        if (rightEdge - guideWidth < 0) {
            finalPosition = 'center'; // 左側に空きがない場合は中央に
        }
    }

    // 最終的な位置設定
    if (finalPosition === 'right') {
        const leftPos = targetRect.right + margin;
        const topPos = Math.max(margin, Math.min(windowHeight - guideHeight - margin, targetRect.top + (targetRect.height - guideHeight) / 2));

        guide.style.position = 'fixed';
        guide.style.top = `${topPos}px`;
        guide.style.left = `${leftPos}px`;
        guide.style.right = 'auto';
        guide.style.transform = 'none';

    } else if (finalPosition === 'left') {
        const rightPos = windowWidth - targetRect.left + margin;
        const topPos = Math.max(margin, Math.min(windowHeight - guideHeight - margin, targetRect.top + (targetRect.height - guideHeight) / 2));

        guide.style.position = 'fixed';
        guide.style.top = `${topPos}px`;
        guide.style.right = `${rightPos}px`;
        guide.style.left = 'auto';
        guide.style.transform = 'none';

    } else {
        // center または fallback
        guide.style.position = 'fixed';
        guide.style.top = '50%';
        guide.style.right = '20px';
        guide.style.left = 'auto';
        guide.style.transform = 'translateY(-50%)';
    }
}

function setupActionListeners() {
    // Blocklyワークスペースの変更を監視
    let blockPlacedFlag = false;
    let valueChangedFlag = false;
    let moreBlocksFlag = false;

    // ワークスペース変更のリスナー（少し遅延させて設定）
    setTimeout(() => {
        if (workspace) {
            workspace.addChangeListener(function (event) {
                if (!interactiveGuideData.isActive) return;

                const currentStep = interactiveGuideData.steps[interactiveGuideData.currentStep];

                if (event.type === Blockly.Events.BLOCK_CREATE && currentStep.waitForAction === 'blockPlaced' && !blockPlacedFlag) {
                    blockPlacedFlag = true;
                    setTimeout(() => {
                        if (interactiveGuideData.currentStep === 1) {
                            interactiveGuideData.currentStep++;
                            updateGuideStep();
                        }
                    }, 1000);
                }

                if (event.type === Blockly.Events.BLOCK_CHANGE && currentStep.waitForAction === 'valueChanged' && !valueChangedFlag) {
                    valueChangedFlag = true;
                    setTimeout(() => {
                        if (interactiveGuideData.currentStep === 2) {
                            interactiveGuideData.currentStep++;
                            updateGuideStep();
                        }
                    }, 1000);
                }

                if (event.type === Blockly.Events.BLOCK_CREATE && currentStep.waitForAction === 'moreBlocks' && !moreBlocksFlag) {
                    const blocks = workspace.getAllBlocks(false);

                    // 必要なブロックタイプが存在するかチェック
                    const hasAngleBlock = blocks.some(block => block.type === 'set_angle');
                    const hasPowerBlock = blocks.some(block => block.type === 'set_power');
                    const hasThrowBlock = blocks.some(block => block.type === 'throw_airplane');

                    // 3つの基本ブロック（角度・強さ・飛ばす）が全て揃った場合のみ進む
                    if (hasAngleBlock && hasPowerBlock && hasThrowBlock) {
                        moreBlocksFlag = true;
                        setTimeout(() => {
                            if (interactiveGuideData.currentStep === 3) {
                                interactiveGuideData.currentStep++;
                                updateGuideStep();
                            }
                        }, 1000);
                    }
                }
            });
        }
    }, 1000);

    // 実行ボタンのクリックを監視
    document.getElementById('runButton').addEventListener('click', function () {
        // インタラクティブガイドがアクティブで該当ステップの場合、ガイドを進める
        if (interactiveGuideData.isActive && interactiveGuideData.currentStep === 4) {
            setTimeout(() => {
                interactiveGuideData.currentStep++;
                updateGuideStep();
            }, 2000); // 飛行アニメーション後に進む
        }
        // 注意: runCode は既に別のイベントリスナーで処理されているため、ここでは呼ばない
    });
}

// ステージ開始機能
function startStage() {
    if (game) {
        game.startStageMode();

        // ボタンの表示を切り替え
        document.getElementById('stageStartButton').style.display = 'none';
        document.getElementById('stageResetButton').style.display = 'block';

        // ステージ情報エリアとスキップボタンを表示
        document.getElementById('stageInfoArea').style.display = 'flex';
        document.getElementById('stageSkipButton').style.display = 'block';

        // ゲーム状態もリセット
        resetGame();
    }
}

// ステージリセット機能
function resetStage() {
    if (!game) return;

    game.showConfirmDialog('ステージモードを終了してフリーモードに戻りますか？', () => {
        // ゲームのステージ情報をリセット
        game.returnToFreeMode();

        // ボタンの表示を切り替え
        document.getElementById('stageStartButton').style.display = 'block';
        document.getElementById('stageResetButton').style.display = 'none';

        // ステージ情報エリアとスキップボタンを非表示
        document.getElementById('stageInfoArea').style.display = 'none';
        document.getElementById('stageSkipButton').style.display = 'none';

        // ゲーム状態もリセット
        resetGame();

        game.showMessage('フリーモードに戻りました。', '#4CAF50');
    });
}

// ループ停止機能
function stopLoop() {
    if (typeof loopData !== 'undefined' && loopData.isLooping) {
        game.showConfirmDialog('実行中のループを停止しますか？', () => {
            // ループデータをリセット
            loopData.isLooping = false;
            loopData.currentLoop = 0;
            loopData.type = null;
            loopData.targetCount = 0;
            loopData.targetDistance = 0;
            loopData.callback = null;
            loopData.results = [];

            // UI状態を更新
            if (game) {
                game.updateUIState();
            }

            // ループ停止ボタンを非表示
            document.getElementById('stopLoopButton').style.display = 'none';

            // 停止メッセージを表示
            if (game) {
                game.showMessage('ループを停止しました。', '#FF9800');
            }
        });
    } else {
        if (game) {
            game.showMessage('停止するループがありません。', 'info');
        }
    }
}

// BGMモーダルの初期化
function initializeBGMModal() {
    const modal = document.getElementById('bgmInitModal');
    const startWithAudio = document.getElementById('startGameWithAudio');
    const startWithoutAudio = document.getElementById('startGameWithoutAudio');
    const enableSoundCheckbox = document.getElementById('enableSound');
    const enableBGMCheckbox = document.getElementById('enableBGM');

    // 音声ありでゲーム開始
    startWithAudio.addEventListener('click', async function () {
        console.log('音声ありでゲーム開始が選択されました');

        // 設定を適用
        if (game) {
            game.soundEnabled = enableSoundCheckbox.checked;
            game.bgmEnabled = enableBGMCheckbox.checked;

            console.log('音声設定 - 効果音:', game.soundEnabled, 'BGM:', game.bgmEnabled);

            // AudioContextを初期化してBGMを開始
            if (game.soundEnabled || game.bgmEnabled) {
                try {
                    await game.ensureAudioContext();
                    console.log('AudioContext初期化完了');
                } catch (error) {
                    console.warn('AudioContext初期化エラー:', error);
                }
            }
        }

        // モーダルを閉じる
        modal.style.display = 'none';
    });

    // 音声なしでゲーム開始
    startWithoutAudio.addEventListener('click', function () {
        console.log('音声なしでゲーム開始が選択されました');

        // 音声を無効にする
        if (game) {
            game.soundEnabled = false;
            game.bgmEnabled = false;
            console.log('全ての音声を無効にしました');
        }

        // モーダルを閉じる
        modal.style.display = 'none';
    });
}

// ステージスキップ関数
function skipStage() {
    if (!game || !game.isStageMode) {
        if (game) {
            game.showMessage('ステージモードではありません。', 'warning');
        }
        return;
    }

    if (game.currentStage >= 5) {
        game.showMessage('既に最終ステージです。', 'info');
        return;
    }

    // 確認ダイアログ
    game.showConfirmDialog(`ステージ${game.currentStage}をスキップして次のステージに進みますか？\n\n注意: スキップしたステージの達成記録は残りません。`, () => {
        // 進行中のループを停止
        if (typeof loopData !== 'undefined' && loopData.isLooping) {
            loopData.isLooping = false;
            loopData.currentLoop = 0;
            loopData.type = null;
            loopData.targetCount = 0;
            loopData.targetDistance = 0;
            loopData.callback = null;
            loopData.results = [];
            document.getElementById('stopLoopButton').style.display = 'none';
        }

        // 次のステージに進む
        game.currentStage++;

        // ステージ進捗をリセット（スキップなので達成扱いにしない）
        if (game.currentStage <= 5) {
            game.showMessage(`ステージ${game.currentStage - 1}をスキップしました。\nステージ${game.currentStage}に進みます！`, '#FF9800');

            setTimeout(() => {
                game.showStageMessage();
                game.updateStageDisplay();
                game.updateUIState();
            }, 2000);
        } else {
            // 全ステージスキップした場合
            game.showMessage('全ステージをスキップしました。\nフリーモードで練習してみてください！', '#FF9800');
            setTimeout(() => {
                game.isStageMode = false;
                game.currentStage = 1;
                game.updateUIState();
            }, 2000);
        }
    });
}
