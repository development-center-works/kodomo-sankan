// カスタムブロックの定義と初期化

// ロボット移動ブロック
function initializeCustomBlocks() {
    // 前進ブロック
    Blockly.Blocks['move_forward'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("🚀 前に進む");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(120);
            this.setTooltip("ロボットを1マス前に進めます");
            this.setHelpUrl("");
        }
    };

    // 右回転ブロック
    Blockly.Blocks['turn_right'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("↻ 右に回転");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(120);
            this.setTooltip("ロボットを右に90度回転させます");
            this.setHelpUrl("");
        }
    };

    // 左回転ブロック
    Blockly.Blocks['turn_left'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("↺ 左に回転");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(120);
            this.setTooltip("ロボットを左に90度回転させます");
            this.setHelpUrl("");
        }
    };

    // 後ろ向きブロック
    Blockly.Blocks['turn_around'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("🔄 後ろを向く");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(120);
            this.setTooltip("ロボットを180度回転させます");
            this.setHelpUrl("");
        }
    };

    // 壁チェックブロック
    Blockly.Blocks['check_wall_ahead'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("🧱 前に壁がある");
            this.setOutput(true, "Boolean");
            this.setColour(290);
            this.setTooltip("前方に壁があるかチェックします");
            this.setHelpUrl("");
        }
    };

    // ゴール到達チェックブロック
    Blockly.Blocks['check_goal_reached'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("🏁 ゴールに到着");
            this.setOutput(true, "Boolean");
            this.setColour(290);
            this.setTooltip("ゴールに到達したかチェックします");
            this.setHelpUrl("");
        }
    };

    // アイテムチェックブロック
    Blockly.Blocks['check_item_here'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("💎 ここにアイテムがある");
            this.setOutput(true, "Boolean");
            this.setColour(290);
            this.setTooltip("現在の位置にアイテムがあるかチェックします");
            this.setHelpUrl("");
        }
    };

    // アイテム収集ブロック
    Blockly.Blocks['collect_item'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("💎 アイテムを集める");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(330);
            this.setTooltip("現在の位置のアイテムを収集します");
            this.setHelpUrl("");
        }
    };

    // アイテム配置ブロック
    Blockly.Blocks['place_item'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("📦 アイテムを置く");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(330);
            this.setTooltip("現在の位置にアイテムを配置します");
            this.setHelpUrl("");
        }
    };

    // 待機ブロック
    Blockly.Blocks['wait_seconds'] = {
        init: function() {
            this.appendValueInput("SECONDS")
                .setCheck("Number")
                .appendField("⏰ ");
            this.appendDummyInput()
                .appendField("秒待つ");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(330);
            this.setTooltip("指定した秒数だけ待機します");
            this.setHelpUrl("");
        }
    };

    // JavaScript コード生成器
    initializeCodeGenerators();
    
    // 数学ブロックの補完定義
    initializeMathBlocks();
}

function initializeCodeGenerators() {
    // 前進コード生成
    Blockly.JavaScript['move_forward'] = function(block) {
        return 'await robot.moveForward();\n';
    };

    // 右回転コード生成
    Blockly.JavaScript['turn_right'] = function(block) {
        return 'await robot.turnRight();\n';
    };

    // 左回転コード生成
    Blockly.JavaScript['turn_left'] = function(block) {
        return 'await robot.turnLeft();\n';
    };

    // 後ろ向きコード生成
    Blockly.JavaScript['turn_around'] = function(block) {
        return 'await robot.turnAround();\n';
    };

    // 壁チェックコード生成
    Blockly.JavaScript['check_wall_ahead'] = function(block) {
        return ['robot.checkWallAhead()', Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    // ゴールチェックコード生成
    Blockly.JavaScript['check_goal_reached'] = function(block) {
        return ['robot.checkGoalReached()', Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    // アイテムチェックコード生成
    Blockly.JavaScript['check_item_here'] = function(block) {
        return ['robot.checkItemHere()', Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    // アイテム収集コード生成
    Blockly.JavaScript['collect_item'] = function(block) {
        return 'await robot.collectItem();\n';
    };

    // アイテム配置コード生成
    Blockly.JavaScript['place_item'] = function(block) {
        return 'await robot.placeItem();\n';
    };

    // 待機コード生成
    Blockly.JavaScript['wait_seconds'] = function(block) {
        var seconds = Blockly.JavaScript.valueToCode(block, 'SECONDS', Blockly.JavaScript.ORDER_ATOMIC);
        return 'await robot.wait(' + seconds + ');\n';
    };

    // カスタム繰り返し処理コード生成（安全性チェック付き）
    Blockly.JavaScript['controls_whileUntil'] = function(block) {
        // Blocklyの元のコード生成をカスタマイズ
        var until = block.getFieldValue('MODE') == 'UNTIL';
        var argument0 = Blockly.JavaScript.valueToCode(block, 'BOOL',
            until ? Blockly.JavaScript.ORDER_LOGICAL_NOT :
            Blockly.JavaScript.ORDER_NONE) || 'false';
        var branch = Blockly.JavaScript.statementToCode(block, 'DO');
        
        // 中身が空の場合はエラーコメントを追加
        if (!branch || branch.trim() === '') {
            return '// ⚠️ 空の繰り返し処理は実行されません - 中にブロックを配置してください\n';
        }
        
        branch = Blockly.JavaScript.addLoopTrap(branch, block.id);
        var code;
        if (until) {
            argument0 = '!' + argument0;
        }
        code = 'while (' + argument0 + ') {\n' + branch + '}\n';
        return code;
    };

    // カスタムfor文コード生成（安全性チェック付き）
    Blockly.JavaScript['controls_repeat_ext'] = function(block) {
        var repeats = Blockly.JavaScript.valueToCode(block, 'TIMES',
            Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
        var branch = Blockly.JavaScript.statementToCode(block, 'DO');
        
        // 中身が空の場合はエラーコメントを追加
        if (!branch || branch.trim() === '') {
            return '// ⚠️ 空の繰り返しブロックは実行されません - 中にブロックを配置してください\n';
        }
        
        branch = Blockly.JavaScript.addLoopTrap(branch, block.id);
        var code = '';
        var loopVar = Blockly.JavaScript.variableDB_.getDistinctName(
            'count', Blockly.Variables.NAME_TYPE);
        var endVar = repeats;
        if (!repeats.match(/^\w+$/) && !Blockly.isNumber(repeats)) {
            var endVar = Blockly.JavaScript.variableDB_.getDistinctName(
                'repeat_end', Blockly.Variables.NAME_TYPE);
            code += 'var ' + endVar + ' = ' + repeats + ';\n';
        }
        code += 'for (var ' + loopVar + ' = 0; ' +
            loopVar + ' < ' + endVar + '; ' +
            loopVar + '++) {\n' +
            branch + '}\n';
        return code;
    };

    // 関数定義のカスタマイズ（戻り値なし）
    Blockly.JavaScript['procedures_defnoreturn'] = function(block) {
        var funcName = Blockly.JavaScript.variableDB_.getName(
            block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
        var branch = Blockly.JavaScript.statementToCode(block, 'STACK');
        
        if (Blockly.JavaScript.STATEMENT_PREFIX) {
            var id = block.id.replace(/\$/g, '$$$$'); // Issue 251.
            branch = Blockly.JavaScript.prefixLines(
                Blockly.JavaScript.STATEMENT_PREFIX.replace(/%1/g,
                '\'' + id + '\''), Blockly.JavaScript.INDENT) + branch;
        }
        if (Blockly.JavaScript.INFINITE_LOOP_TRAP) {
            branch = Blockly.JavaScript.INFINITE_LOOP_TRAP.replace(/%1/g,
                '\'' + block.id + '\'') + branch;
        }
        
        var returnValue = '';
        var args = [];
        for (var i = 0; i < block.arguments_.length; i++) {
            args[i] = Blockly.JavaScript.variableDB_.getName(block.arguments_[i],
                Blockly.Variables.NAME_TYPE);
        }
        
        var code = 'async function ' + funcName + '(' + args.join(', ') + ') {\n' +
            branch + returnValue + '}\n';
        code = Blockly.JavaScript.scrub_(block, code);
        
        // Add to list of user defined functions
        Blockly.JavaScript.definitions_[funcName] = code;
        return null;
    };

    // 関数定義のカスタマイズ（戻り値あり）
    Blockly.JavaScript['procedures_defreturn'] = function(block) {
        var funcName = Blockly.JavaScript.variableDB_.getName(
            block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
        var branch = Blockly.JavaScript.statementToCode(block, 'STACK');
        
        if (Blockly.JavaScript.STATEMENT_PREFIX) {
            var id = block.id.replace(/\$/g, '$$$$'); // Issue 251.
            branch = Blockly.JavaScript.prefixLines(
                Blockly.JavaScript.STATEMENT_PREFIX.replace(/%1/g,
                '\'' + id + '\''), Blockly.JavaScript.INDENT) + branch;
        }
        if (Blockly.JavaScript.INFINITE_LOOP_TRAP) {
            branch = Blockly.JavaScript.INFINITE_LOOP_TRAP.replace(/%1/g,
                '\'' + block.id + '\'') + branch;
        }
        
        var returnValue = Blockly.JavaScript.valueToCode(block, 'RETURN',
            Blockly.JavaScript.ORDER_NONE) || '';
        if (returnValue) {
            returnValue = Blockly.JavaScript.INDENT + 'return ' + returnValue + ';\n';
        }
        
        var args = [];
        for (var i = 0; i < block.arguments_.length; i++) {
            args[i] = Blockly.JavaScript.variableDB_.getName(block.arguments_[i],
                Blockly.Variables.NAME_TYPE);
        }
        
        var code = 'async function ' + funcName + '(' + args.join(', ') + ') {\n' +
            branch + returnValue + '}\n';
        code = Blockly.JavaScript.scrub_(block, code);
        
        // Add to list of user defined functions
        Blockly.JavaScript.definitions_[funcName] = code;
        return null;
    };

    // 関数呼び出しのカスタマイズ（戻り値なし）
    Blockly.JavaScript['procedures_callnoreturn'] = function(block) {
        var funcName = Blockly.JavaScript.variableDB_.getName(
            block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
        var args = [];
        for (var i = 0; i < block.arguments_.length; i++) {
            args[i] = Blockly.JavaScript.valueToCode(block, 'ARG' + i,
                Blockly.JavaScript.ORDER_COMMA) || 'null';
        }
        var code = 'await ' + funcName + '(' + args.join(', ') + ');\n';
        return code;
    };

    // 関数呼び出しのカスタマイズ（戻り値あり）
    Blockly.JavaScript['procedures_callreturn'] = function(block) {
        var funcName = Blockly.JavaScript.variableDB_.getName(
            block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
        var args = [];
        for (var i = 0; i < block.arguments_.length; i++) {
            args[i] = Blockly.JavaScript.valueToCode(block, 'ARG' + i,
                Blockly.JavaScript.ORDER_COMMA) || 'null';
        }
        var code = 'await ' + funcName + '(' + args.join(', ') + ')';
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
}

// Blocklyワークスペースの初期化
function initializeBlocklyWorkspace() {
    // 数学ブロックを先に初期化
    initializeMathBlocks();
    
    const toolbox = document.getElementById('toolbox');
    
    workspace = Blockly.inject('blocklyDiv', {
        toolbox: toolbox,
        theme: (Blockly.Themes && Blockly.Themes.Modern) ? Blockly.Themes.Modern : 'classic',
        zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
        },
        trashcan: true,
        sounds: true,
        grid: {
            spacing: 25,
            length: 3,
            colour: '#ccc',
            snap: true
        },
        move: {
            scrollbars: true,
            drag: true,
            wheel: false
        }
    });

    // 変数作成ボタンのコールバック
    workspace.registerButtonCallback('CREATE_VARIABLE', function() {
        if (Blockly.Variables && Blockly.Variables.createVariableButtonHandler) {
            Blockly.Variables.createVariableButtonHandler(workspace);
        }
    });

    // 関数作成ボタンのコールバック
    workspace.registerButtonCallback('CREATE_FUNCTION', function() {
        if (Blockly.Procedures && Blockly.Procedures.createProcedureDefCallback_) {
            Blockly.Procedures.createProcedureDefCallback_(workspace);
        }
    });

    // ワークスペース変更時のイベント
    workspace.addChangeListener(function(event) {
        if (event.type === Blockly.Events.BLOCK_CREATE || 
            event.type === Blockly.Events.BLOCK_DELETE ||
            event.type === Blockly.Events.BLOCK_MOVE) {
            // プログラムが変更されたときの処理
            updateProgramComplexity();
        }
        
        // 変数・関数の作成・削除をキャッチ
        if (event.type === Blockly.Events.VAR_CREATE ||
            event.type === Blockly.Events.VAR_DELETE ||
            event.type === Blockly.Events.VAR_RENAME ||
            event.type === Blockly.Events.BLOCK_CREATE ||
            event.type === Blockly.Events.BLOCK_DELETE) {
            // 少し遅らせて更新（Blocklyの内部更新後に実行）
            setTimeout(updateVariablesAndFunctionsList, 100);
        }
    });

    // 初期化時にも変数・関数リストを更新
    setTimeout(updateVariablesAndFunctionsList, 200);

    return workspace;
}

// プログラムの複雑度を計算
function updateProgramComplexity() {
    const allBlocks = workspace.getAllBlocks();
    const blockCount = allBlocks.length;
    
    // ブロック数に応じて難易度を表示
    let complexity = 'シンプル';
    if (blockCount > 10) complexity = '標準';
    if (blockCount > 20) complexity = '複雑';
    if (blockCount > 30) complexity = '上級';
    
    // UI更新（必要に応じて）
    console.log(`プログラム複雑度: ${complexity} (${blockCount}ブロック)`);
}

// 変数・関数リストの更新
function updateVariablesAndFunctionsList() {
    if (!workspace) return;
    
    // 変数リストの更新
    updateVariablesList();
    
    // 関数リストの更新
    updateFunctionsList();
}

// 変数リストの更新
function updateVariablesList() {
    const variablesList = document.getElementById('variablesList');
    if (!variablesList) return;
    
    const variables = workspace.getAllVariables();
    
    if (variables.length === 0) {
        variablesList.innerHTML = '<p class="empty-message">まだ変数が作成されていません</p>';
        return;
    }
    
    let html = '';
    variables.forEach(variable => {
        html += `
            <div class="variable-item">
                <span class="variable-name">📊 ${variable.name}</span>
                <span class="variable-type">変数</span>
            </div>
        `;
    });
    
    variablesList.innerHTML = html;
}

// 関数リストの更新
function updateFunctionsList() {
    const functionsList = document.getElementById('functionsList');
    if (!functionsList) return;
    
    // workspace内の関数定義ブロックを検索
    const allBlocks = workspace.getAllBlocks();
    const procedureBlocks = allBlocks.filter(block => 
        block.type === 'procedures_defnoreturn' || 
        block.type === 'procedures_defreturn'
    );
    
    if (procedureBlocks.length === 0) {
        functionsList.innerHTML = '<p class="empty-message">まだ関数が作成されていません</p>';
        return;
    }
    
    let html = '';
    procedureBlocks.forEach(block => {
        const functionName = block.getFieldValue('NAME') || '無名関数';
        const hasReturn = block.type === 'procedures_defreturn';
        const returnType = hasReturn ? '戻り値あり' : '戻り値なし';
        
        html += `
            <div class="function-item">
                <span class="function-name">🛠️ ${functionName}()</span>
                <span class="function-signature">${returnType}</span>
            </div>
        `;
    });
    
    functionsList.innerHTML = html;
}

// 初期ブロックの配置
function setInitialBlocks(stageType) {
    workspace.clear();
    
    // 関数定義もクリア
    if (typeof Blockly !== 'undefined' && Blockly.JavaScript && Blockly.JavaScript.definitions_) {
        Blockly.JavaScript.definitions_ = {};
    }
    
    let xmlText = '';
    
    switch (stageType) {
        case 'basic-movement':
            xmlText = `
                <xml xmlns="https://developers.google.com/blockly/xml">
                    <block type="move_forward" x="50" y="50"></block>
                </xml>`;
            break;
            
        case 'loops':
            xmlText = `
                <xml xmlns="https://developers.google.com/blockly/xml">
                    <block type="controls_repeat_ext" x="50" y="50">
                        <value name="TIMES">
                            <shadow type="math_number">
                                <field name="NUM">3</field>
                            </shadow>
                        </value>
                        <statement name="DO">
                            <block type="move_forward"></block>
                        </statement>
                    </block>
                </xml>`;
            break;
            
        case 'conditions':
            xmlText = `
                <xml xmlns="https://developers.google.com/blockly/xml">
                    <block type="controls_if" x="50" y="50">
                        <value name="IF0">
                            <block type="check_wall_ahead"></block>
                        </value>
                        <statement name="DO0">
                            <block type="turn_right"></block>
                        </statement>
                    </block>
                </xml>`;
            break;
            
        default:
            // デフォルトは空のワークスペース
            break;
    }
    
    if (xmlText) {
        try {
            let xml;
            // 新しいBlockly APIを試す
            if (Blockly.utils && Blockly.utils.xml && Blockly.utils.xml.textToDom) {
                xml = Blockly.utils.xml.textToDom(xmlText);
            } else if (Blockly.Xml && Blockly.Xml.textToDom) {
                // 古いAPIをフォールバック
                xml = Blockly.Xml.textToDom(xmlText);
            } else {
                // DOMParserを使用
                const parser = new DOMParser();
                xml = parser.parseFromString(xmlText, 'text/xml');
            }
            
            // ワークスペースに読み込み
            if (Blockly.Xml && Blockly.Xml.domToWorkspace) {
                Blockly.Xml.domToWorkspace(xml, workspace);
            }
        } catch (error) {
            console.error('初期ブロック設定エラー:', error);
        }
    }
}

// プログラム実行前の検証
function validateProgram() {
    const allBlocks = workspace.getAllBlocks();
    
    if (allBlocks.length === 0) {
        return {
            valid: false,
            message: 'プログラムにブロックを配置してください。'
        };
    }
    
    // トップレベルブロック（他のブロックに接続されていないブロック）を確認
    const topBlocks = workspace.getTopBlocks();
    
    if (topBlocks.length === 0) {
        return {
            valid: false,
            message: 'ブロックを正しく接続してください。'
        };
    }
    
    // ループブロックの中身が空でないかチェック
    const loopValidation = validateLoopBlocks(allBlocks);
    if (!loopValidation.valid) {
        return loopValidation;
    }
    
    // if文の中身が空でないかチェック
    const conditionalValidation = validateConditionalBlocks(allBlocks);
    if (!conditionalValidation.valid) {
        return conditionalValidation;
    }
    
    return {
        valid: true,
        message: 'プログラムは正常です。'
    };
}

// ループブロックのバリデーション（while文、for文、repeat文など）
function validateLoopBlocks(blocks) {
    for (let block of blocks) {
        let errorMessage = '';
        let doConnection = null;
        
        // 各種ループブロックをチェック
        if (block.type === 'controls_whileUntil' || 
            block.type === 'controls_while') {
            doConnection = block.getInput('DO');
            errorMessage = '⚠️ 繰り返し処理の中に実行するブロックを配置してください。\n空の繰り返し処理は無限ループを引き起こし、プログラムが停止しなくなります。\n\n「前に進む」を含めた動作ブロックを繰り返しブロックの中に配置してください。';
        }
        else if (block.type === 'controls_repeat_ext' ||
                 block.type === 'controls_repeat') {
            doConnection = block.getInput('DO');
            errorMessage = '⚠️ 繰り返しブロックの中に実行するブロックを配置してください。\n\n「前に進む」を含めた動作ブロックを繰り返しブロックの中に配置してください。';
        }
        else if (block.type === 'controls_for' ||
                 block.type === 'controls_forEach') {
            doConnection = block.getInput('DO');
            errorMessage = '⚠️ for文の中に実行するブロックを配置してください。\n\n「前に進む」を含めた動作ブロックを繰り返しブロックの中に配置してください。';
        }
        else if (block.type === 'repeat_until_goal') {
            doConnection = block.getInput('DO');
            errorMessage = '⚠️ 「ゴールに着くまで繰り返し」の中に実行するブロックを配置してください。\n\n「前に進む」を含めた動作ブロックを繰り返しブロックの中に配置してください。';
        }
        
        // ループブロックの中身をチェック
        if (doConnection) {
            const connectedBlock = doConnection.connection.targetBlock();
            
            // 中身が空の場合
            if (!connectedBlock) {
                return {
                    valid: false,
                    message: errorMessage
                };
            }
            
            // 中身があるかより詳細にチェック
            if (!hasExecutableContent(connectedBlock)) {
                return {
                    valid: false,
                    message: errorMessage.replace('配置してください。', '有効な処理ブロックを配置してください。')
                };
            }
            
            // whileブロック特有の厳密チェック
            if (block.type === 'controls_whileUntil' || block.type === 'controls_while') {
                if (!hasValidWhileContent(connectedBlock)) {
                    return {
                        valid: false,
                        message: '⚠️ 繰り返し処理には状況を変化させるブロックが必要です。\n現在の内容では無限ループになる可能性があります。\n\n「前に進む」を含めた動作ブロックを繰り返しブロックの中に配置してください。'
                    };
                }
            }
        }
    }
    
    return { valid: true };
}

// 条件分岐ブロックのバリデーション（if文など）
function validateConditionalBlocks(blocks) {
    for (let block of blocks) {
        if (block.type === 'controls_if' || block.type === 'controls_ifelse') {
            // if文の中身（DO部分）を取得
            const doConnection = block.getInput('DO0');
            if (doConnection) {
                const connectedBlock = doConnection.connection.targetBlock();
                
                // 中身が空の場合は警告程度に留める（if文は空でも意味がある場合がある）
                if (!connectedBlock || !hasExecutableContent(connectedBlock)) {
                    // 厳密にチェックしたい場合は以下のコメントアウトを外す
                    /*
                    return {
                        valid: false,
                        message: 'if文の中に実行するブロックを配置してください。'
                    };
                    */
                }
            }
            
            // else部分もチェック（controls_ifelseの場合）
            if (block.type === 'controls_ifelse') {
                const elseConnection = block.getInput('ELSE');
                if (elseConnection) {
                    const elseBlock = elseConnection.connection.targetBlock();
                    // else部分も同様に軽くチェック
                }
            }
        }
    }
    
    return { valid: true };
}

// ブロックに実行可能な内容があるかチェック
function hasExecutableContent(block) {
    if (!block) return false;
    
    // 実行可能なブロックタイプの一覧
    const executableTypes = [
        'move_forward', 'turn_left', 'turn_right', 'turn_around',
        'collect_item', 'place_item', 'wait_seconds',
        'controls_repeat_ext', 'controls_for', 'controls_forEach',
        'controls_whileUntil', 'controls_while',
        'controls_if', 'controls_ifelse',
        'procedures_callnoreturn', 'procedures_callreturn'  // 関数呼び出しを追加
    ];
    
    // 現在のブロックが実行可能かチェック
    if (executableTypes.includes(block.type)) {
        return true;
    }
    
    // 次に接続されているブロックもチェック
    const nextBlock = block.getNextBlock();
    if (nextBlock) {
        return hasExecutableContent(nextBlock);
    }
    
    return false;
}

// whileブロック内の内容が適切かチェック（無限ループ防止）
function hasValidWhileContent(block) {
    if (!block) return false;
    
    // 状況を変化させる可能性のあるブロックタイプ
    const actionTypes = [
        'move_forward',      // 前進（位置変化）
        // 'procedures_callnoreturn', 'procedures_callreturn'  // 関数呼び出しも状況を変化させる可能性
    ];
    
    // 現在のブロックをチェック
    if (actionTypes.includes(block.type)) {
        return true;
    }
    
    // 関数呼び出しの場合、その関数の定義内容もチェック
    if (block.type === 'procedures_callnoreturn' || block.type === 'procedures_callreturn') {
        const funcName = block.getFieldValue('NAME');
        if (funcName) {
            // その関数の定義ブロックを検索
            const allBlocks = workspace.getAllBlocks();
            const funcDefBlock = allBlocks.find(b => 
                (b.type === 'procedures_defnoreturn' || b.type === 'procedures_defreturn') &&
                b.getFieldValue('NAME') === funcName
            );
            
            if (funcDefBlock) {
                const stackConnection = funcDefBlock.getInput('STACK');
                if (stackConnection && stackConnection.connection.targetBlock()) {
                    // 関数の中身をチェック
                    return hasValidWhileContent(stackConnection.connection.targetBlock());
                }
            }
        }
        
        // 関数の中身が確認できない場合でも、一応有効とする
        return true;
    }
    
    // ネストされたループや条件分岐の中もチェック
    if (block.type === 'controls_if' || block.type === 'controls_ifelse') {
        const doConnection = block.getInput('DO0');
        if (doConnection && doConnection.connection.targetBlock()) {
            if (hasValidWhileContent(doConnection.connection.targetBlock())) {
                return true;
            }
        }
        
        // else部分もチェック
        if (block.type === 'controls_ifelse') {
            const elseConnection = block.getInput('ELSE');
            if (elseConnection && elseConnection.connection.targetBlock()) {
                if (hasValidWhileContent(elseConnection.connection.targetBlock())) {
                    return true;
                }
            }
        }
    }
    
    // 内側のループブロックもチェック
    if (block.type === 'controls_repeat_ext' || 
        block.type === 'controls_repeat' ||
        block.type === 'controls_for' ||
        block.type === 'controls_forEach') {
        const doConnection = block.getInput('DO');
        if (doConnection && doConnection.connection.targetBlock()) {
            if (hasValidWhileContent(doConnection.connection.targetBlock())) {
                return true;
            }
        }
    }
    
    // 次のブロックもチェック
    const nextBlock = block.getNextBlock();
    if (nextBlock) {
        return hasValidWhileContent(nextBlock);
    }
    
    return false;
}

// エクスポート用のグローバル変数
let workspace;

// 数学ブロックの初期化（Blocklyの標準ブロックが不完全な場合の補完）
function initializeMathBlocks() {
    // math_compare ブロックの定義（存在しない場合）
    if (!Blockly.Blocks['math_compare']) {
        Blockly.Blocks['math_compare'] = {
            init: function() {
                this.setColour(230);
                this.setOutput(true, 'Boolean');
                this.appendValueInput('A')
                    .setCheck('Number');
                this.appendDummyInput()
                    .appendField(new Blockly.FieldDropdown([
                        ['=', 'EQ'],
                        ['≠', 'NEQ'],
                        ['<', 'LT'],
                        ['≤', 'LTE'],
                        ['>', 'GT'],
                        ['≥', 'GTE']
                    ]), 'OP');
                this.appendValueInput('B')
                    .setCheck('Number');
                this.setInputsInline(true);
                this.setTooltip('2つの数値を比較します');
            }
        };
    }

    // math_arithmetic ブロックの定義（存在しない場合）
    if (!Blockly.Blocks['math_arithmetic']) {
        Blockly.Blocks['math_arithmetic'] = {
            init: function() {
                this.setColour(230);
                this.setOutput(true, 'Number');
                this.appendValueInput('A')
                    .setCheck('Number');
                this.appendDummyInput()
                    .appendField(new Blockly.FieldDropdown([
                        ['+', 'ADD'],
                        ['-', 'MINUS'],
                        ['×', 'MULTIPLY'],
                        ['÷', 'DIVIDE'],
                        ['^', 'POWER']
                    ]), 'OP');
                this.appendValueInput('B')
                    .setCheck('Number');
                this.setInputsInline(true);
                this.setTooltip('2つの数値で算術演算を行います');
            }
        };
    }

    // math_number ブロックの定義（存在しない場合）
    if (!Blockly.Blocks['math_number']) {
        Blockly.Blocks['math_number'] = {
            init: function() {
                this.setColour(230);
                this.appendDummyInput()
                    .appendField(new Blockly.FieldNumber(0), 'NUM');
                this.setOutput(true, 'Number');
                this.setTooltip('数値');
            }
        };
    }

    // 対応するJavaScriptコード生成器も追加
    initializeMathCodeGenerators();
}

// 数学ブロック用のJavaScriptコード生成器
function initializeMathCodeGenerators() {
    // math_compare用のコード生成器
    if (!Blockly.JavaScript['math_compare']) {
        Blockly.JavaScript['math_compare'] = function(block) {
            var OPERATORS = {
                'EQ': '==',
                'NEQ': '!=',
                'LT': '<',
                'LTE': '<=',
                'GT': '>',
                'GTE': '>='
            };
            var operator = OPERATORS[block.getFieldValue('OP')];
            var order = (operator == '==' || operator == '!=') ?
                Blockly.JavaScript.ORDER_EQUALITY : Blockly.JavaScript.ORDER_RELATIONAL;
            var argument0 = Blockly.JavaScript.valueToCode(block, 'A', order) || '0';
            var argument1 = Blockly.JavaScript.valueToCode(block, 'B', order) || '0';
            var code = argument0 + ' ' + operator + ' ' + argument1;
            return [code, order];
        };
    }

    // math_arithmetic用のコード生成器
    if (!Blockly.JavaScript['math_arithmetic']) {
        Blockly.JavaScript['math_arithmetic'] = function(block) {
            var OPERATORS = {
                'ADD': [' + ', Blockly.JavaScript.ORDER_ADDITION],
                'MINUS': [' - ', Blockly.JavaScript.ORDER_SUBTRACTION],
                'MULTIPLY': [' * ', Blockly.JavaScript.ORDER_MULTIPLICATION],
                'DIVIDE': [' / ', Blockly.JavaScript.ORDER_DIVISION],
                'POWER': [null, Blockly.JavaScript.ORDER_COMMA]
            };
            var tuple = OPERATORS[block.getFieldValue('OP')];
            var operator = tuple[0];
            var order = tuple[1];
            var argument0 = Blockly.JavaScript.valueToCode(block, 'A', order) || '0';
            var argument1 = Blockly.JavaScript.valueToCode(block, 'B', order) || '0';
            var code;
            if (!operator) {
                code = 'Math.pow(' + argument0 + ', ' + argument1 + ')';
                return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
            }
            code = argument0 + operator + argument1;
            return [code, order];
        };
    }

    // math_number用のコード生成器
    if (!Blockly.JavaScript['math_number']) {
        Blockly.JavaScript['math_number'] = function(block) {
            var code = parseFloat(block.getFieldValue('NUM'));
            return [code, Blockly.JavaScript.ORDER_ATOMIC];
        };
    }
}
