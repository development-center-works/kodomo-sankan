/* global Blockly */

// ==============================
// 1) ブロック定義
// ==============================
function defineSlide(label, dir, dx, dy) {
  Blockly.Blocks[`slide_${dir}`] = {
    init() {
      this.appendDummyInput()
        .appendField(`${label}へすべる`);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(160);
    }
  };
  Blockly.JavaScript[`slide_${dir}`] = () => `await slide(${dx}, ${dy});\n`;
}

// 日本語ラベルをここで指定
defineSlide('上', 'up', 0, -1);
defineSlide('右', 'right', 1, 0);
defineSlide('下', 'down', 0, 1);
defineSlide('左', 'left', -1, 0);

Blockly.Blocks.if_stop_scope = {
  init() {
    this.appendStatementInput('DO')
      .appendField('⏸️で止まる');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(65);
  }
};
Blockly.JavaScript.if_stop_scope = (block) => {
  const inner = Blockly.JavaScript.statementToCode(block, 'DO');
  return `await withStop(async () => {\n${inner}});\n`;
};

// ==============================
// 2) ツールボックス組み立て
// ==============================
const contents = [
  { kind: 'block', type: 'slide_up' },
  { kind: 'block', type: 'slide_right' },
  { kind: 'block', type: 'slide_down' },
  { kind: 'block', type: 'slide_left' }
];

// ステージ5/6/11/12だけ if_stop_scope を出す
if (/stage5|stage6|stage11|stage12/.test(location.pathname)) {
  contents.push({ kind: 'block', type: 'if_stop_scope' });
}

const toolbox = {
  kind: 'flyoutToolbox',
  contents
};

// ==============================
// 3) ワークスペース初期化
// ==============================
const workspace = Blockly.inject('blocklyDiv', {
  media: 'https://unpkg.com/blockly/media/',
  toolbox,
  scrollbars: true,
  trashcan: true
});

window.workspace = workspace;



