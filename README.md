# kodomo-sankan
子ども参観日プログラミング体験

## 概要
2025年8月8日(金) エネコムこども参観日のプログラミング体験でチャレンジしていただいたゲームです。

Blockly(https://developers.google.com/blockly)を利用し作成しています。

## ディレクトリ構成
```
/
---maze/ : 迷路ゲーム
---skate/ : スケートゲーム
---paper-airplane/ : 紙飛行機シミュレーション
---robot-controller/ : ロボット制御プログラミング
---LISENSE : ライセンス
---README.md : このファイル
```

## 実行方法
```bash
# リポジトリをクローンし、ディレクトリへ移動
git clone https://github.com/development-center-works/kodomo-sankan.git
cd kodomo-sankan

# シンプルなHTTPサーバーを起動（Python 3の場合）
python -m http.server 8000

# ブラウザでアクセス
# http://localhost:8000/index.html
```

## バグ等
バグや新しいステージを作成したので登録してほしいなどの連絡はissuesにて報告してください。

## 著作権 (Copyright)

Apache License, Version 2.0  
詳細は `LICENSE` ファイルをご確認ください。