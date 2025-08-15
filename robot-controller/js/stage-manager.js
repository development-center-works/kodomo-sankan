// ステージ管理とコンテンツ定義

class StageManager {
    constructor() {
        this.stages = {
            'basic-movement': this.createBasicMovementStages(),
            'loops': this.createLoopStages(),
            'conditions': this.createConditionStages(),
            'variables': this.createVariableStages(),
            'functions': this.createFunctionStages(),
            'challenge': this.createChallengeStages()
        };
        
        this.currentCategory = 'basic-movement';
        this.currentLevel = 0;
        this.completedStages = new Set();
    }
    
    // 基本移動ステージ
    createBasicMovementStages() {
        return [
            {
                id: 'basic-1',
                title: '基本移動 - レベル1',
                description: 'ロボットを右に3マス移動させよう！',
                startX: 0, startY: 4, startDirection: 1,
                walls: [],
                goals: ['3,4'],
                items: [],
                learningContent: {
                    title: '基本移動を学ぼう',
                    description: 'ロボットを上下左右に動かす基本的なコマンドを学びます。',
                    points: [
                        '「前に進む」ブロックでロボットを移動',
                        '「右に回転」「左に回転」でロボットの向きを変更',
                        '順次実行の概念を理解'
                    ]
                },
                hint: '「前に進む」ブロックを3回使ってみましょう。ロボットは最初から右を向いています。',
                checkWinCondition: (game) => game.checkGoalReached(),
                getProgress: (game) => {
                    const distance = Math.abs(game.robot.x - 3) + Math.abs(game.robot.y - 4);
                    return Math.max(0, (3 - distance) / 3 * 100);
                },
                successMessage: '基本移動をマスターしました！'
            },
            {
                id: 'basic-2',
                title: '基本移動 - レベル2',
                description: 'ロボットを回転させて上に移動させよう！',
                startX: 2, startY: 5, startDirection: 1,
                walls: [],
                goals: ['2,2'],
                items: [],
                hint: 'まず「左に回転」してから「前に進む」を3回使いましょう。',
                checkWinCondition: (game) => game.checkGoalReached(),
                getProgress: (game) => {
                    const distance = Math.abs(game.robot.x - 2) + Math.abs(game.robot.y - 2);
                    return Math.max(0, (3 - distance) / 3 * 100);
                },
                successMessage: '回転と移動の組み合わせができました！'
            },
            {
                id: 'basic-3',
                title: '基本移動 - レベル3',
                description: 'L字型のルートを通ってゴールへ！',
                startX: 1, startY: 6, startDirection: 0,
                walls: ['2,5', '3,5', '4,5', '2,4', '2,3'],
                goals: ['5,3'],
                items: [],
                hint: '右→上の順番で移動する必要があります。回転を活用しましょう。',
                checkWinCondition: (game) => game.checkGoalReached(),
                getProgress: (game) => {
                    const distance = Math.abs(game.robot.x - 5) + Math.abs(game.robot.y - 3);
                    return Math.max(0, (7 - distance) / 7 * 100);
                },
                successMessage: '複雑なルートも攻略できました！'
            }
        ];
    }
    
    // ループステージ
    createLoopStages() {
        return [
            {
                id: 'loop-1',
                title: 'ループ - レベル1',
                description: 'ループを使って効率的にプログラムを作ろう！',
                startX: 0, startY: 4, startDirection: 0,
                walls: [],
                goals: ['5,4'],
                items: [],
                learningContent: {
                    title: 'ループ処理を学ぼう',
                    description: '同じ処理を繰り返すループの使い方を学びます。',
                    points: [
                        '「繰り返し」ブロックで同じ処理を反復',
                        '効率的なプログラムの書き方',
                        'コードの短縮と読みやすさの向上'
                    ]
                },
                hint: '「前に進む」を5回実行する代わりに、「5回繰り返し」ブロックを使ってみましょう。',
                checkWinCondition: (game) => game.checkGoalReached(),
                getProgress: (game) => {
                    const distance = Math.abs(game.robot.x - 5) + Math.abs(game.robot.y - 4);
                    return Math.max(0, (5 - distance) / 5 * 100);
                },
                successMessage: 'ループの基本をマスターしました！'
        },
            {
                id: 'loop-2',
                title: 'ループ - レベル2',
                description: '正方形を描くようにロボットを動かそう！',
                startX: 2, startY: 5, startDirection: 0,
                walls: [],
                goals: ['2,5'],
                items: ['2,4','3,4','3,5'],
                hint: '「前に進む」→「右に回転」を4回繰り返すと正方形になります。上→右→下→左の順番で移動しましょう。\n\n アイテムは「アイテムを集める」で拾えるよ！',
                checkWinCondition: (game) => {
                    return game.checkGoalReached() && game.collectedItems.size === 3;
                },
                getProgress: (game) => {
                    // 正方形の完成度を計算
                    const itemProgress = (game.collectedItems.size / 3) * 50;
                    const positionProgress = game.checkGoalReached() ? 50 : 0;
                    return itemProgress + positionProgress;
                },
                successMessage: '正方形の移動パターンを習得しました！'
            },
            {
                id: 'loop-3',
                title: 'ループ - レベル3',
                description: 'ネストしたループを使って複雑なパターンを作ろう！',
                startX: 1, startY: 6, startDirection: 1,
                walls: [],
                goals: ['6,1'],
                items: ['2,6', '3,6', '4,6', '5,6', '6,2', '6,3', '6,4', '6,5'],
                hint: '小さなループを大きなループの中に入れる「ネストしたループ」を使いましょう。\n\n 2回繰り返すブロックの中に5回繰り返すブロック入れてクリアしてみましょう。',
                checkWinCondition: (game) => {
                    return game.checkGoalReached() && game.collectedItems.size === 8;
                },
                getProgress: (game) => {
                    const itemProgress = (game.collectedItems.size / 4) * 50;
                    const positionProgress = game.checkGoalReached() ? 50 : 0;
                    return itemProgress + positionProgress;
                },
                successMessage: 'ネストしたループをマスターしました！'
            }
        ];
    }
    
    // 条件分岐ステージ
    createConditionStages() {
        return [
            {
                id: 'condition-1',
                title: '条件分岐 - レベル1',
                description: '壁があるかチェックして進路を決めよう！',
                startX: 1, startY: 4, startDirection: 1,
                walls: ['6,4'],
                goals: ['5,2'],
                items: [],
                learningContent: {
                    title: '条件分岐を学ぼう',
                    description: '条件によって処理を分岐させる方法を学びます。',
                    points: [
                        'if文で条件によって処理を分岐',
                        '「前に壁がある」などの条件ブロック',
                        '複雑な判断ができるプログラム作成'
                    ]
                },
                hint: '「もし前に壁があるなら右に回転」を使って壁を回避しましょう。',
                checkWinCondition: (game) => game.checkGoalReached(),
                getProgress: (game) => {
                    const distance = Math.abs(game.robot.x - 5) + Math.abs(game.robot.y - 2);
                    return Math.max(0, (6 - distance) / 6 * 100);
                },
                successMessage: '条件分岐の基本をマスターしました！'
            },
            {
                id: 'condition-2',
                title: '条件分岐 - レベル2',
                description: 'while文を使って壁に沿って移動しよう！',
                startX: 0, startY: 0, startDirection: 1,
                walls: ['0,1','1,1', '2,1', '3,1', '4,1', '5,1', '5,2', '5,3', '5,4', '5,5'],
                goals: ['5,6'],
                items: [],
                hint: '「ゴールに着くまで繰り返し」と条件分岐を組み合わせましょう。',
                checkWinCondition: (game) => game.checkGoalReached(),
                getProgress: (game) => {
                    const distance = Math.abs(game.robot.x - 5) + Math.abs(game.robot.y - 6);
                    return Math.max(0, (11 - distance) / 11 * 100);
                },
                successMessage: 'while文と条件分岐を組み合わせられました！'
            },
            {
                id: 'condition-3',
                title: '条件分岐 - レベル3',
                description: '複数の条件を使って迷路を攻略しよう！',
                startX: 0, startY: 0, startDirection: 1,
                walls: [
                    '1,0', '2,0', '3,0', '5,0', '6,0',
                    '0,2', '2,2', '3,2', '4,2', '6,2',
                    '0,3', '2,3', '6,3',
                    '0,4', '2,4', '3,4', '4,4', '5,4',
                    '2,5', '4,5', '6,5',
                    '0,6', '1,6', '2,6', '4,6'
                ],
                goals: ['7,7'],
                items: [],
                hint: '壁チェックと複数の条件分岐を使って最適なルートを見つけましょう。',
                checkWinCondition: (game) => game.checkGoalReached(),
                getProgress: (game) => {
                    const distance = Math.abs(game.robot.x - 7) + Math.abs(game.robot.y - 7);
                    return Math.max(0, (14 - distance) / 14 * 100);
                },
                successMessage: '複雑な迷路も攻略できました！'
            },
            {
                id: 'condition-4',
                title: '条件分岐 - レベル4',
                description: '動的な条件判定でアイテムを集めよう！',
                startX: 0, startY: 3, startDirection: 1,
                walls: ['2,0', '2,1', '2,2', '2,4', '2,5', '2,6', '5,1', '5,2', '5,4', '5,5'],
                goals: ['7,3'],
                items: ['1,3', '3,3', '4,3', '6,3'],
                hint: 'アイテムがある位置を検出して、効率的に収集しましょう。',
                checkWinCondition: (game) => {
                    return game.checkGoalReached() && game.collectedItems.size === 4;
                },
                getProgress: (game) => {
                    const itemProgress = (game.collectedItems.size / 4) * 50;
                    const positionProgress = game.checkGoalReached() ? 50 : 0;
                    return itemProgress + positionProgress;
                },
                successMessage: '動的な条件判定をマスターしました！'
            }
        ];
    }
    
    // 変数ステージ
    createVariableStages() {
        return [
            {
                id: 'variable-1',
                title: '変数 - レベル1',
                description: '変数を使ってアイテムの数を数えよう！',
                startX: 0, startY: 4, startDirection: 1,
                walls: [],
                goals: ['7,4'],
                items: ['1,4', '3,4', '5,4'],
                learningContent: {
                    title: '変数を学ぼう',
                    description: '値を保存して操作する変数の使い方を学びます。',
                    points: [
                        '変数でデータを保存',
                        '変数の値を増減',
                        '変数を使った条件分岐'
                    ]
                },
                hint: '「アイテム数」変数を作って、アイテムを集めるたびに1増やしましょう。',
                checkWinCondition: (game) => {
                    return game.checkGoalReached() && game.collectedItems.size === 3;
                },
                getProgress: (game) => {
                    const itemProgress = (game.collectedItems.size / 3) * 70;
                    const positionProgress = game.checkGoalReached() ? 30 : 0;
                    return itemProgress + positionProgress;
                },
                successMessage: '変数の基本的な使い方をマスターしました！'
            },
            {
                id: 'variable-2',
                title: '変数 - レベル2',
                description: '変数を使って条件付きの動作を作ろう！',
                startX: 0, startY: 0, startDirection: 1,
                walls: ['2,0', '2,1', '2,2', '2,3', '2,4', '2,5'],
                goals: ['4,7'],
                items: ['1,0', '1,1', '1,2'],
                hint: '繰り返し、条件、変数のブロックを上手に組み合わせましょう。壁にぶつかったとき、収集したアイテム数が3個じゃない場合は右に、3個になったら左に移動するプログラムを作りましょう。',
                checkWinCondition: (game) => {
                    return game.checkGoalReached() && game.collectedItems.size === 3;
                },
                getProgress: (game) => {
                    const itemProgress = (game.collectedItems.size / 3) * 50;
                    const positionProgress = game.checkGoalReached() ? 50 : 0;
                    return itemProgress + positionProgress;
                },
                successMessage: '変数を使った条件分岐ができました！'
            },
            {
                id: 'variable-3',
                title: '変数 - レベル3',
                description: '複数の変数を使って複雑な処理を管理しよう！',
                startX: 0, startY: 7, startDirection: 1,
                walls: ['1,5', '2,5', '4,5', '5,5', '1,3', '2,3', '4,3', '5,3', '3,1'],
                goals: ['6,0'],
                items: ['0,6', '3,6', '6,6', '0,4', '3,4', '6,4', '0,2', '3,2', '6,2'],
                hint: 'アイテムの個数や前に進んだ回数などを別々の変数で管理し、効率的な経路を計算しましょう。',
                checkWinCondition: (game) => {
                    return game.checkGoalReached() && game.collectedItems.size >= 6;
                },
                getProgress: (game) => {
                    const itemProgress = (game.collectedItems.size / 9) * 60;
                    const positionProgress = game.checkGoalReached() ? 40 : 0;
                    return itemProgress + positionProgress;
                },
                successMessage: '複数の変数を活用できました！'
            }
        ];
    }
    
    // 関数ステージ
    createFunctionStages() {
        return [
            {
                id: 'function-1',
                title: '関数 - レベル1',
                description: '繰り返し使う処理を関数にまとめよう！',
                startX: 0, startY: 4, startDirection: 1,
                walls: [],
                goals: ['6,2'],
                items: ['2,4', '4,4', '6,4'],
                learningContent: {
                    title: '関数を学ぼう',
                    description: '再利用可能な処理をまとめる関数の作り方を学びます。',
                    points: [
                        '関数で処理をまとめる',
                        '関数の呼び出し',
                        'コードの再利用と整理'
                    ]
                },
                hint: '「アイテムを取って進む」関数を作って、3回呼び出してみましょう。',
                checkWinCondition: (game) => {
                    return game.checkGoalReached() && game.collectedItems.size === 3;
                },
                getProgress: (game) => {
                    const itemProgress = (game.collectedItems.size / 3) * 60;
                    const positionProgress = game.checkGoalReached() ? 40 : 0;
                    return itemProgress + positionProgress;
                },
                successMessage: '関数の基本をマスターしました！'
            },
            {
                id: 'function-2',
                title: '関数 - レベル2',
                description: 'パラメータ付きの関数を作ってみよう！',
                startX: 0, startY: 0, startDirection: 1,
                walls: ['3,0', '3,1', '3,2', '3,4', '3,5', '3,6'],
                goals: ['6,7'],
                items: ['1,0', '2,0', '4,0', '5,0', '6,0', '1,7', '2,7', '4,7', '5,7'],
                hint: '「〇歩進む」関数を作って、異なる歩数で呼び出してみましょう。',
                checkWinCondition: (game) => {
                    return game.checkGoalReached() && game.collectedItems.size >= 7;
                },
                getProgress: (game) => {
                    const itemProgress = (game.collectedItems.size / 9) * 70;
                    const positionProgress = game.checkGoalReached() ? 30 : 0;
                    return itemProgress + positionProgress;
                },
                successMessage: 'パラメータ付き関数をマスターしました！'
            },
            {
                id: 'function-3',
                title: '関数 - レベル3',
                description: '複数の関数を組み合わせて複雑な動作を作ろう！',
                startX: 3, startY: 3, startDirection: 0,
                walls: ['1,1', '2,1', '4,1', '5,1', '1,5', '2,5', '4,5', '5,5'],
                goals: ['3,3'],
                items: ['0,0', '3,0', '6,0', '0,3', '6,3', '0,6', '3,6', '6,6'],
                hint: '「正方形を描く」「アイテム収集」関数を組み合わせて使いましょう。',
                checkWinCondition: (game) => {
                    return game.checkGoalReached() && game.collectedItems.size === 8 && game.robot.direction === 0;
                },
                getProgress: (game) => {
                    const itemProgress = (game.collectedItems.size / 8) * 60;
                    const positionProgress = game.checkGoalReached() ? 30 : 0;
                    const directionProgress = (game.robot.direction === 0) ? 10 : 0;
                    return itemProgress + positionProgress + directionProgress;
                },
                successMessage: '関数の組み合わせをマスターしました！'
            }
        ];
    }
    
    // チャレンジステージ
    createChallengeStages() {
        return [
            {
                id: 'challenge-1',
                title: '総合チャレンジ - レベル1',
                description: '学んだことを全て使って複雑な課題を解こう！',
                startX: 0, startY: 7, startDirection: 0,
                walls: [
                    '1,6', '2,6', '3,6', '5,6', '6,6',
                    '1,5', '3,5', '5,5',
                    '1,4', '3,4', '5,4', '6,4',
                    '1,3', '5,3',
                    '1,2', '2,2', '3,2', '5,2', '6,2',
                    '3,1', '5,1',
                    '1,0', '3,0', '5,0', '6,0'
                ],
                goals: ['7,0'],
                items: ['0,6', '2,5', '4,4', '6,3', '4,2', '2,1', '4,0'],
                learningContent: {
                    title: '総合チャレンジ',
                    description: '今まで学んだ全ての概念を組み合わせて使います。',
                    points: [
                        '移動、ループ、条件分岐の組み合わせ',
                        '変数と関数の活用',
                        '効率的なアルゴリズムの設計'
                    ]
                },
                hint: '効率的なルートを見つけて、全てのアイテムを集めながらゴールを目指しましょう。',
                checkWinCondition: (game) => {
                    return game.checkGoalReached() && game.collectedItems.size === 7;
                },
                getProgress: (game) => {
                    const itemProgress = (game.collectedItems.size / 7) * 70;
                    const positionProgress = game.checkGoalReached() ? 30 : 0;
                    return itemProgress + positionProgress;
                },
                successMessage: '全ての概念をマスターしました！おめでとうございます！'
            }
        ];
    }
    
    // ステージの取得
    getStage(category, level) {
        if (this.stages[category] && this.stages[category][level]) {
            return this.stages[category][level];
        }
        return null;
    }
    
    // カテゴリ内のステージ数を取得
    getStageCount(category) {
        return this.stages[category] ? this.stages[category].length : 0;
    }
    
    // 次のステージがあるかチェック
    hasNextStage(category, level) {
        return this.getStageCount(category) > level + 1;
    }
    
    // ステージ完了マーク
    markCompleted(stageId) {
        this.completedStages.add(stageId);
    }
    
    // 完了チェック
    isCompleted(stageId) {
        return this.completedStages.has(stageId);
    }
    
    // 学習コンテンツの更新
    updateLearningContent(category) {
        const stages = this.stages[category];
        if (stages && stages[0] && stages[0].learningContent) {
            const content = stages[0].learningContent;
            document.getElementById('currentConcept').textContent = content.title;
            
            const learningDiv = document.getElementById('learningContent');
            learningDiv.innerHTML = `
                <p><strong>${content.title}:</strong> ${content.description}</p>
                <ul>
                    ${content.points.map(point => `<li>${point}</li>`).join('')}
                </ul>
            `;
        }
    }
}

// グローバルインスタンス
let stageManager;

function initializeStageManager() {
    stageManager = new StageManager();
    return stageManager;
}
