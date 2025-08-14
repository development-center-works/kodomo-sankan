// ブロック定義とコード生成器を確実に登録する関数
function initializeCustomBlocks() {
    console.log('カスタムブロックを初期化しています...');

    // 紙飛行機の角度設定ブロック
    Blockly.Blocks['set_angle'] = {
        init: function () {
            this.appendValueInput("ANGLE")
                .setCheck("Number")
                .appendField("投げる角度を");
            this.appendDummyInput()
                .appendField("度に設定");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(120);
            this.setTooltip("紙飛行機を投げる角度を設定します（0-90度）");
            this.setHelpUrl("");
        }
    };

    // 紙飛行機の強さ設定ブロック
    Blockly.Blocks['set_power'] = {
        init: function () {
            this.appendValueInput("POWER")
                .setCheck("Number")
                .appendField("投げる強さを");
            this.appendDummyInput()
                .appendField("に設定");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(120);
            this.setTooltip("紙飛行機を投げる強さを設定します（1-100の範囲）");
            this.setHelpUrl("");
        }
    };

    // 紙飛行機の重心設定ブロック
    Blockly.Blocks['set_balance'] = {
        init: function () {
            this.appendValueInput("BALANCE")
                .setCheck("Number")
                .appendField("重心を");
            this.appendDummyInput()
                .appendField("に設定");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(120);
            this.setTooltip("紙飛行機の重心位置を設定します（1-10、5が中央）");
            this.setHelpUrl("");
        }
    };

    // 紙飛行機を飛ばすブロック
    Blockly.Blocks['throw_airplane'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("紙飛行機を飛ばす");
            this.setPreviousStatement(true, null);
            this.setColour(160);
            this.setTooltip("設定した角度と強さで紙飛行機を飛ばします");
            this.setHelpUrl("");
        }
    };

    // 指定回数ループブロック
    Blockly.Blocks['loop_count'] = {
        init: function () {
            this.appendValueInput("COUNT")
                .setCheck("Number")
                .appendField("繰り返し回数:");
            this.appendStatementInput("DO")
                .setCheck(null)
                .appendField("実行する");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(300);
            this.setTooltip("指定した回数だけ処理を繰り返します（最大16回）");
            this.setHelpUrl("");
        }
    };

    // 飛距離条件ループブロック
    Blockly.Blocks['loop_until_distance'] = {
        init: function () {
            this.appendValueInput("DISTANCE")
                .setCheck("Number")
                .appendField("飛距離が")
                .appendField("m以上になるまで繰り返し:");
            this.appendStatementInput("DO")
                .setCheck(null)
                .appendField("実行する");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(300);
            this.setTooltip("指定した飛距離以上になるまで処理を繰り返します（最大16回）");
            this.setHelpUrl("");
        }
    };

    // 条件が真になるまで繰り返しブロック
    Blockly.Blocks['loop_until_true'] = {
        init: function () {
            this.appendValueInput("CONDITION")
                .setCheck("Boolean")
                .appendField("条件が真になるまで繰り返し:");
            this.appendStatementInput("DO")
                .setCheck(null)
                .appendField("実行する");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(300);
            this.setTooltip("指定した条件が真になるまで処理を繰り返します（最大50回）");
            this.setHelpUrl("");
        }
    };

    // 鳥イベント発生チェックブロック
    Blockly.Blocks['bird_event_occurred'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("鳥イベントが発生した");
            this.setOutput(true, "Boolean");
            this.setColour(65);
            this.setTooltip("鳥イベントが発生していればtrueを返します");
            this.setHelpUrl("");
        }
    };

    // 飛距離条件チェックブロック
    Blockly.Blocks['distance_greater_than'] = {
        init: function () {
            this.appendValueInput("DISTANCE")
                .setCheck("Number")
                .appendField("飛距離が");
            this.appendDummyInput()
                .appendField("m以上");
            this.setOutput(true, "Boolean");
            this.setColour(65);
            this.setTooltip("最後の飛行距離が指定した値以上であればtrueを返します");
            this.setHelpUrl("");
        }
    };

    console.log('ブロック定義が完了しました');

    // コード生成器を登録
    registerJavaScriptGenerators();
}

function registerJavaScriptGenerators() {
    console.log('JavaScript コード生成器を登録しています...');

    // Blockly v12の正しい方法でコード生成器を登録
    if (typeof Blockly.JavaScript !== 'undefined') {
        console.log('Blockly.JavaScript でコード生成器を登録');

        // JavaScriptジェネレーターのインスタンスを取得
        const generator = Blockly.JavaScript;

        // forBlockマップが存在しない場合は作成
        if (!generator.forBlock) {
            generator.forBlock = Object.create(null);
        }

        // set_angle ブロックのコード生成
        generator.forBlock['set_angle'] = function (block, generator) {
            console.log('set_angle コード生成関数が呼び出されました');
            var value_angle = generator.valueToCode(block, 'ANGLE', generator.ORDER_ATOMIC);
            if (!value_angle) {
                value_angle = '45';
            }
            var code = 'setAngle(' + value_angle + ');\n';
            console.log('生成されたコード:', code);
            return code;
        };

        // set_power ブロックのコード生成
        generator.forBlock['set_power'] = function (block, generator) {
            console.log('set_power コード生成関数が呼び出されました');
            var value_power = generator.valueToCode(block, 'POWER', generator.ORDER_ATOMIC);
            if (!value_power) {
                value_power = '50';
            }
            var code = 'setPower(' + value_power + ');\n';
            console.log('生成されたコード:', code);
            return code;
        };

        // set_balance ブロックのコード生成
        generator.forBlock['set_balance'] = function (block, generator) {
            console.log('set_balance コード生成関数が呼び出されました');
            var value_balance = generator.valueToCode(block, 'BALANCE', generator.ORDER_ATOMIC);
            if (!value_balance) {
                value_balance = '5';
            }
            var code = 'setBalance(' + value_balance + ');\n';
            console.log('生成されたコード:', code);
            return code;
        };

        // throw_airplane ブロックのコード生成
        generator.forBlock['throw_airplane'] = function (block, generator) {
            console.log('throw_airplane コード生成関数が呼び出されました');
            var code = 'throwAirplane();\n';
            console.log('生成されたコード:', code);
            return code;
        };

        // loop_count ブロックのコード生成
        generator.forBlock['loop_count'] = function (block, generator) {
            console.log('loop_count コード生成関数が呼び出されました');
            var value_count = generator.valueToCode(block, 'COUNT', generator.ORDER_ATOMIC) || '1';
            var statements_do = generator.statementToCode(block, 'DO');
            var code = 'loopCount(' + value_count + ', function() {\n' + statements_do + '});\n';
            console.log('生成されたコード:', code);
            return code;
        };

        // loop_until_distance ブロックのコード生成
        generator.forBlock['loop_until_distance'] = function (block, generator) {
            console.log('loop_until_distance コード生成関数が呼び出されました');
            var value_distance = generator.valueToCode(block, 'DISTANCE', generator.ORDER_ATOMIC) || '100';
            var statements_do = generator.statementToCode(block, 'DO');
            var code = 'loopUntilDistance(' + value_distance + ', function() {\n' + statements_do + '});\n';
            console.log('生成されたコード:', code);
            return code;
        };

        // loop_until_true ブロックのコード生成
        generator.forBlock['loop_until_true'] = function (block, generator) {
            console.log('loop_until_true コード生成関数が呼び出されました');
            var value_condition = generator.valueToCode(block, 'CONDITION', generator.ORDER_ATOMIC) || 'false';
            var statements_do = generator.statementToCode(block, 'DO');
            var code = 'loopUntilTrue(function() { return ' + value_condition + '; }, function() {\n' + statements_do + '});\n';
            console.log('生成されたコード:', code);
            return code;
        };

        // bird_event_occurred ブロックのコード生成
        generator.forBlock['bird_event_occurred'] = function (block, generator) {
            console.log('bird_event_occurred コード生成関数が呼び出されました');
            var code = 'isBirdEventOccurred()';
            console.log('生成されたコード:', code);
            return [code, generator.ORDER_FUNCTION_CALL];
        };

        // distance_greater_than ブロックのコード生成
        generator.forBlock['distance_greater_than'] = function (block, generator) {
            console.log('distance_greater_than コード生成関数が呼び出されました');
            var value_distance = generator.valueToCode(block, 'DISTANCE', generator.ORDER_ATOMIC) || '0';
            var code = 'isDistanceGreaterThan(' + value_distance + ')';
            console.log('生成されたコード:', code);
            return [code, generator.ORDER_FUNCTION_CALL];
        };

        // 古い形式でも登録（後方互換性）
        generator['set_angle'] = generator.forBlock['set_angle'];
        generator['set_power'] = generator.forBlock['set_power'];
        generator['set_balance'] = generator.forBlock['set_balance'];
        generator['throw_airplane'] = generator.forBlock['throw_airplane'];
        generator['loop_count'] = generator.forBlock['loop_count'];
        generator['loop_until_distance'] = generator.forBlock['loop_until_distance'];
        generator['loop_until_true'] = generator.forBlock['loop_until_true'];
        generator['bird_event_occurred'] = generator.forBlock['bird_event_occurred'];
        generator['distance_greater_than'] = generator.forBlock['distance_greater_than'];

        // 登録確認
        console.log('コード生成器の登録確認:');
        console.log('- forBlock.set_angle:', typeof generator.forBlock['set_angle']);
        console.log('- forBlock.set_power:', typeof generator.forBlock['set_power']);
        console.log('- forBlock.set_balance:', typeof generator.forBlock['set_balance']);
        console.log('- forBlock.throw_airplane:', typeof generator.forBlock['throw_airplane']);
        console.log('- set_angle:', typeof generator['set_angle']);
        console.log('- set_power:', typeof generator['set_power']);
        console.log('- set_balance:', typeof generator['set_balance']);
        console.log('- throw_airplane:', typeof generator['throw_airplane']);

        console.log('Blockly.JavaScript での登録完了');
    }

    // 新しいAPI (javascript) も試す
    if (typeof Blockly.javascript !== 'undefined') {
        console.log('Blockly.javascript でもコード生成器を登録');

        const jsGenerator = Blockly.javascript;

        if (!jsGenerator.forBlock) {
            jsGenerator.forBlock = Object.create(null);
        }

        jsGenerator.forBlock['set_angle'] = function (block, generator) {
            var value_angle = generator.valueToCode(block, 'ANGLE', generator.ORDER_ATOMIC) || '45';
            return 'setAngle(' + value_angle + ');\n';
        };

        jsGenerator.forBlock['set_power'] = function (block, generator) {
            var value_power = generator.valueToCode(block, 'POWER', generator.ORDER_ATOMIC) || '50';
            return 'setPower(' + value_power + ');\n';
        };

        jsGenerator.forBlock['set_balance'] = function (block, generator) {
            var value_balance = generator.valueToCode(block, 'BALANCE', generator.ORDER_ATOMIC) || '5';
            return 'setBalance(' + value_balance + ');\n';
        };

        jsGenerator.forBlock['throw_airplane'] = function (block, generator) {
            return 'throwAirplane();\n';
        };

        jsGenerator.forBlock['loop_count'] = function (block, generator) {
            var value_count = generator.valueToCode(block, 'COUNT', generator.ORDER_ATOMIC) || '1';
            var statements_do = generator.statementToCode(block, 'DO');
            return 'loopCount(' + value_count + ', function() {\n' + statements_do + '});\n';
        };

        jsGenerator.forBlock['loop_until_distance'] = function (block, generator) {
            var value_distance = generator.valueToCode(block, 'DISTANCE', generator.ORDER_ATOMIC) || '100';
            var statements_do = generator.statementToCode(block, 'DO');
            return 'loopUntilDistance(' + value_distance + ', function() {\n' + statements_do + '});\n';
        };

        jsGenerator.forBlock['loop_until_true'] = function (block, generator) {
            var value_condition = generator.valueToCode(block, 'CONDITION', generator.ORDER_ATOMIC) || 'false';
            var statements_do = generator.statementToCode(block, 'DO');
            return 'loopUntilTrue(function() { return ' + value_condition + '; }, function() {\n' + statements_do + '});\n';
        };

        jsGenerator.forBlock['bird_event_occurred'] = function (block, generator) {
            var code = 'isBirdEventOccurred()';
            return [code, generator.ORDER_FUNCTION_CALL];
        };

        jsGenerator.forBlock['distance_greater_than'] = function (block, generator) {
            var value_distance = generator.valueToCode(block, 'DISTANCE', generator.ORDER_ATOMIC) || '0';
            var code = 'isDistanceGreaterThan(' + value_distance + ')';
            return [code, generator.ORDER_FUNCTION_CALL];
        };

        console.log('Blockly.javascript での登録完了');
    }

    console.log('JavaScript コード生成器の登録が完了しました');
}
