# lolbeans

[LOLBeans](https://lolbeans.io/) 関連の自作ツール・サイトをまとめたリポジトリです。GitHub Pagesで公開しています。

**公開URL**: https://tanabesan.github.io/lolbeans/

## ページ構成

```
lolbeans/
├── index.html          # トップページ(各ツールへのリンク集)
├── community.html       # コース一覧(ユーザー作成カスタムマップの検索・閲覧)
├── ranking.html         # WRランキング
├── template.html        # IMAGE → GLOL(画像をLOLBeansのピクセルアートに変換するツール)
├── programatic.html     # BLOCK FORGE(Programmatic式・変数式のビジュアルエディタ)
├── lolex.html           # LOL.ex本体ページ
├── faq.html             # よくある質問
├── contact.html         # お問い合わせ
└── library/             # ファイルライブラリ関連
    ├── file.html         # ファイルライブラリ(.lol / .glolファイルの一覧・ダウンロード)
    ├── submit.html        # ファイル投稿フォーム
    └── admin.html          # 投稿の承認/却下を行う管理画面
```

## ツール概要

### IMAGE → GLOL (`template.html`)
画像をLOLBeansの Solid Pane ブロックで再現するピクセルアートに変換するツール。

- グリッドサイズ・縦横比の自動維持に対応
- 同色が連続する部分は横長/縦長の1ブロックに自動統合し、ブロック数を削減
- 彩度・明度補正でゲーム内での見え方を調整可能
- ブラウザ完結、`.glol`ファイルをダウンロード

対応するPythonスクリプト版(`image_to_glol.py`)は別途配布。

### BLOCK FORGE (`programatic.html`)
LOLBeansレベルエディタの Programmatic 位置/回転式・VARIABLES式を、ブロックのドラッグ&ドロップで組み立てて出力できるビジュアルエディタ。

### ファイルライブラリ (`library/`)
ユーザーが `.lol` / `.glol` ファイルを投稿・共有できる仕組み。

- 誰でも `submit.html` からファイル・サムネイル・説明を添えて投稿できる
- 投稿は審査を経てから `file.html` に公開される
- ダウンロード数も表示

## デザイン

全ページ共通でダークテーマ + サイバーパンク/8bit系のビジュアル(`Press Start 2P` / `JetBrains Mono`フォント、マゼンタ `#ff00ff` とシアン `#00ffff` を基調色に使用)。

## 関連リポジトリ

- LOL.ex本体(Tampermonkeyスクリプト)
- lolex専用サイト: `tanabesan.github.io/lolex/`
