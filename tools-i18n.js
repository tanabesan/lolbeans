/**
 * tools-i18n.js
 * ツール(IMAGE→GLOL / BLOCK FORGE)の英語表示(nav-menu.js の JP/EN 切り替えと連動)。
 * 各ページで nav-menu.js より前(または後)に <script src=".../tools-i18n.js" defer></script> を読み込むだけ。
 * 日本語の文言をキーに辞書で置換し、後から動的に追加された文言も自動で翻訳します。
 */
(function () {
  const KEY = 'lolbeans-lang';
  const D = {
 "🎲 VARIABLES モード": "🎲 VARIABLES mode",
 "📈 PROGRAMMATIC モード": "📈 PROGRAMMATIC mode",
 "保存されている内容を消して最初からやり直します": "Erases saved content and starts over",
 "🗑 最初からやり直す": "🗑 Start over",
 "ブロックをドラッグして右の枠に置いてね": "Drag blocks into the frame on the right",
 "はじめての方へ 👋": "New here? 👋",
 "たたむ": "Collapse",
 "左のパレットから、青い「数値・定数」ブロックを下の点線の枠に": "From the palette on the left, take a blue “Number / Constant” block and place it in the dotted frame below by",
 "ドラッグ＆ドロップ": "drag & drop",
 "してみましょう。": ".",
 "ブロックの中の数字はクリックすると書き換えられます。": "You can edit the numbers inside blocks by clicking them.",
 "もっと複雑な式にしたいときは、オレンジの「計算」ブロックなどを枠にドロップすると、その中にさらにブロックを入れられます（入れ子）。": "For a more complex expression, drop an orange “Math” block etc. into the frame, and you can nest more blocks inside it.",
 "右側に、今組み立てた式がLOLBeansにそのままコピペできる形で表示されます。": "On the right, the expression you built is shown in a form you can paste straight into LOLBeans.",
 "🎲 サンプルを読み込んで見てみる（3つのドアからランダムに1つ開ける）": "🎲 Load a sample (open one of 3 doors at random)",
 "＋ 変数を追加": "+ Add variable",
 "出力コード": "Output code",
 "Programmatic 全体式": "Programmatic full expression",
 "全体をコピー": "Copy all",
 "使い方": "How to use",
 "左のブロックを右の枠（スロット）にドラッグ＆ドロップして式を組み立てます。": "Build an expression by dragging & dropping blocks from the left into the frames (slots) on the right.",
 "数値・変数名はブロック内をクリックして直接編集できます。": "Click inside a block to edit numbers and variable names directly.",
 ": LOLBeansの「EDIT VARIABLES」パネル用。各行が1つの変数（名前＝式）。上の行の変数名は下の行から参照できます。": ": For LOLBeans' “EDIT VARIABLES” panel. Each line is one variable (name = expression). Variables in upper lines can be referenced from lower lines.",
 ": Programmatic オブジェクトの position/rotation 式。複数行を": ": A position/rotation expression for a Programmatic object. Join multiple lines with",
 "でつなぎ、最後の行が戻り値になります。": ", and the last line becomes the return value.",
 "が使えます。": "can be used.",
 "① 数値・定数": "① Number / Constant",
 "まずはここから。数字や PI, E, true/false などの「そのままの値」です。": "Start here. Plain values such as numbers, PI, E, true/false.",
 "② ほかの変数を使う": "② Use other variables",
 "上の行で作った変数の名前をここで呼び出せます（例：さっき作った DoorNumber をもう一度使う）。": "Call a variable defined in an upper line by name (e.g. reuse the DoorNumber you made earlier).",
 "③ 最初から用意された変数 (Programmatic専用)": "③ Built-in variables (Programmatic only)",
 "time（経過秒数）や開始位置など、LOLBeans側が自動で用意してくれる値です。": "Values LOLBeans prepares automatically, such as time (elapsed seconds) and the start position.",
 "④ 計算する（＋－×÷など）": "④ Calculate (+ − × ÷ etc.)",
 "2つの値を計算して1つの値にします。": "Calculates two values into one value.",
 "⑤ 比べる（＝や＞など）": "⑤ Compare (= or > etc.)",
 "2つの値を比べて「true / false」を作ります。ifブロックの条件に使います。": "Compares two values to make true / false. Used for the condition of an if block.",
 "⑥ 条件分岐・論理": "⑥ Branching / Logic",
 "true/false を組み合わせたり、「もし〜なら〜」を作ります。": "Combine true/false, or build “if … then …”.",
 "⑦ 便利な関数": "⑦ Handy functions",
 "ランダムな数を出したり、三角関数・四捨五入などLOLBeansが用意している便利な計算です。": "Handy calculations provided by LOLBeans, such as random numbers, trigonometry and rounding.",
 "数値 #": "Number #",
 "そのままの数（例：10、3.5）を表します。クリックして数字を変更できます。": "Represents a plain number (e.g. 10, 3.5). Click to change it.",
 "円周率 PI": "Pi PI",
 "円周率 3.14159… を表す決まった値です。": "The fixed value of pi, 3.14159…",
 "ネイピア数 E": "Euler's number E",
 "自然対数の底 2.71828… を表す決まった値です。": "The fixed value of the base of natural logarithms, 2.71828…",
 "true（はい）": "true (yes)",
 "「オン／はい」を表す値。チェックボックス系のプロパティに使います。": "A value meaning “on / yes”. Use it for checkbox-type properties.",
 "false（いいえ）": "false (no)",
 "「オフ／いいえ」を表す値。チェックボックス系のプロパティに使います。": "A value meaning “off / no”. Use it for checkbox-type properties.",
 "◆ 変数の名前で呼び出す": "◆ Call by variable name",
 "上の行で定義した変数の名前を入力すると、その値をここで使えます。": "Enter the name of a variable defined in an upper line to use its value here.",
 "time（経過秒数）": "time (elapsed seconds)",
 "ラウンド開始（またはトリガー起動）からの経過時間（秒）。": "Time elapsed (seconds) since the round started (or the trigger fired).",
 "duration（ループ時間）": "duration (loop time)",
 "ブロックの「Loop Duration」プロパティの値です。": "The value of the block's “Loop Duration” property.",
 "startPositionX（開始X座標）": "startPositionX (start X position)",
 "このブロックが最初にあったX位置。": "The X position this block was originally at.",
 "startPositionY（開始Y座標）": "startPositionY (start Y position)",
 "このブロックが最初にあったY位置。": "The Y position this block was originally at.",
 "startPositionZ（開始Z座標）": "startPositionZ (start Z position)",
 "このブロックが最初にあったZ位置。": "The Z position this block was originally at.",
 "startRotationX（開始X回転）": "startRotationX (start X rotation)",
 "このブロックが最初にあったX回転角度。": "The X rotation angle this block originally had.",
 "startRotationY（開始Y回転）": "startRotationY (start Y rotation)",
 "このブロックが最初にあったY回転角度。": "The Y rotation angle this block originally had.",
 "startRotationZ（開始Z回転）": "startRotationZ (start Z rotation)",
 "このブロックが最初にあったZ回転角度。": "The Z rotation angle this block originally had.",
 "足し算　A ＋ B": "Add　A ＋ B",
 "2つの値を足します。": "Adds two values.",
 "引き算　A － B": "Subtract　A － B",
 "AからBを引きます。": "Subtracts B from A.",
 "かけ算　A × B": "Multiply　A × B",
 "2つの値をかけます。": "Multiplies two values.",
 "わり算　A ÷ B": "Divide　A ÷ B",
 "AをBで割ります。": "Divides A by B.",
 "あまり　A ％ B": "Remainder　A ％ B",
 "AをBで割った「あまり」を求めます。": "Finds the remainder of A divided by B.",
 "べき乗　A ^ B": "Power　A ^ B",
 "AのB乗を計算します（例：2^3＝8）。": "Calculates A to the power of B (e.g. 2^3 = 8).",
 "マイナスにする　－A": "Negate　－A",
 "値の符号を反転します（プラスをマイナスに）。": "Flips the sign of a value (plus to minus).",
 "階乗　A！": "Factorial　A！",
 "A × (A-1) × (A-2) × … × 1 を計算します。": "Calculates A × (A-1) × (A-2) × … × 1.",
 "等しい　A ＝＝ B": "Equal　A ＝＝ B",
 "AとBが同じなら true、違えば false。": "true if A and B are the same, false if not.",
 "等しくない　A ≠ B": "Not equal　A ≠ B",
 "AとBが違えば true、同じなら false。": "true if A and B differ, false if the same.",
 "より大きい　A ＞ B": "Greater than　A ＞ B",
 "AがBより大きいなら true。": "true if A is greater than B.",
 "より小さい　A ＜ B": "Less than　A ＜ B",
 "AがBより小さいなら true。": "true if A is less than B.",
 "以上　A ≧ B": "Greater or equal　A ≧ B",
 "AがB以上なら true。": "true if A is at least B.",
 "以下　A ≦ B": "Less or equal　A ≦ B",
 "AがB以下なら true。": "true if A is at most B.",
 "かつ（AND）": "AND",
 "AとBが両方 true のときだけ true。": "true only when both A and B are true.",
 "または（OR）": "OR",
 "AとBのどちらかが true なら true。": "true when either A or B is true.",
 "反対にする（NOT）": "NOT",
 "trueとfalseを入れ替えます。": "Swaps true and false.",
 "もし〜なら〜でなければ〜": "If … then … else …",
 "条件がtrueなら1つ目の値、falseなら2つ目の値を選びます。ドアの開閉などランダム分岐の基本形です。": "Picks the first value if the condition is true, the second if false. The basic form of random branching such as opening doors.",
 "絶対値 abs(A)": "Absolute value abs(A)",
 "符号を取り除いた値（マイナスをプラスに）。": "The value with its sign removed (minus to plus).",
 "平方根 sqrt(A)": "Square root sqrt(A)",
 "Aの平方根を求めます。": "Finds the square root of A.",
 "サイン sin(A)": "Sine sin(A)",
 "三角関数のサイン（A はラジアン）。揺れる動きなどに。": "Trigonometric sine (A in radians). Good for swaying motion.",
 "コサイン cos(A)": "Cosine cos(A)",
 "三角関数のコサイン（A はラジアン）。": "Trigonometric cosine (A in radians).",
 "タンジェント tan(A)": "Tangent tan(A)",
 "三角関数のタンジェント（A はラジアン）。": "Trigonometric tangent (A in radians).",
 "切り捨て floor(A)": "Round down floor(A)",
 "Aを超えない一番大きい整数にします。": "The largest integer not exceeding A.",
 "切り上げ ceil(A)": "Round up ceil(A)",
 "Aより小さくない一番小さい整数にします。": "The smallest integer not less than A.",
 "四捨五入 round(A)": "Round round(A)",
 "一番近い整数にします。": "Rounds to the nearest integer.",
 "整数部分 trunc(A)": "Integer part trunc(A)",
 "小数点以下を切り捨てて整数部分だけ残します。": "Drops the decimals and keeps only the integer part.",
 "符号 sign(A)": "Sign sign(A)",
 "プラスなら1、マイナスなら-1、0なら0を返します。": "Returns 1 if positive, -1 if negative, 0 if zero.",
 "自然対数 ln(A)": "Natural log ln(A)",
 "Aの自然対数を求めます。": "Finds the natural logarithm of A.",
 "常用対数 log10(A)": "Common log log10(A)",
 "Aの底10の対数を求めます。": "Finds the base-10 logarithm of A.",
 "2進対数 log2(A)": "Binary log log2(A)",
 "Aの底2の対数を求めます。": "Finds the base-2 logarithm of A.",
 "指数関数 exp(A)": "Exponential exp(A)",
 "eのA乗を求めます。": "Finds e to the power of A.",
 "小さい方 min(A, B)": "Smaller min(A, B)",
 "AとBのうち小さい方を返します。": "Returns the smaller of A and B.",
 "大きい方 max(A, B)": "Larger max(A, B)",
 "AとBのうち大きい方を返します。": "Returns the larger of A and B.",
 "斜辺の長さ hypot(A, B)": "Hypotenuse hypot(A, B)",
 "直角三角形の斜辺の長さ（√(A²+B²)）。": "Length of a right triangle's hypotenuse (√(A²+B²)).",
 "べき乗 pow(A, B)": "Power pow(A, B)",
 "AのB乗（^演算子と同じ）。": "A to the power of B (same as the ^ operator).",
 "角度を求める atan2(Y, X)": "Find angle atan2(Y, X)",
 "(0,0)から(X,Y)への角度（ラジアン）を求めます。": "Finds the angle (radians) from (0,0) to (X,Y).",
 "桁数を指定して丸める roundTo(A, 桁数)": "Round to digits roundTo(A, digits)",
 "Aを指定した小数点以下の桁数に丸めます。": "Rounds A to the given number of decimal places.",
 "ランダムな小数 random(N)": "Random decimal random(N)",
 "0以上N未満のランダムな小数を返します。": "Returns a random decimal from 0 up to (not including) N.",
 "ランダムな整数 randomInt(最小, 最大)": "Random integer randomInt(min, max)",
 "最小〜最大の範囲でランダムな整数を1つ選びます。「3つのドアから1つ選ぶ」等の基本ブロックです。": "Picks one random integer between min and max. The basic block for “pick 1 of 3 doors”.",
 "条件で値を選ぶ if(条件, 真, 偽)": "Choose by condition if(cond, true, false)",
 "条件がtrueなら2番目、falseなら3番目の値を返します（もし〜なら〜と同じ意味）。": "Returns the 2nd value if the condition is true, the 3rd if false (same meaning as “if … then …”).",
 "式": "Expression",
 "もし": "If",
 "条件": "Condition",
 "なら": "then",
 "真の時": "When true",
 "でなければ": "else",
 "偽の時": "When false",
 "桁数": "Digits",
 "真": "True",
 "偽": "False",
 "戻り値": "Return value",
 "変数": "Variable",
 "このブロックの位置／回転として最終的に使われる式です": "The expression finally used as this block's position / rotation",
 "名前をつけて、あとで再利用できる値です": "A value you can name and reuse later",
 "戻り値の式": "Return value expression",
 "この行を削除": "Delete this line",
 "👈 左のパレットからブロックをここにドラッグ＆ドロップ": "👈 Drag & drop a block from the palette on the left here",
 "削除": "Delete",
 "変数名未設定": "Unnamed variable",
 "この式をコピー": "Copy this expression",
 "コピーしました ✓": "Copied ✓",
 "保存済み ✓": "Saved ✓",
 "保存できませんでした（ブラウザの設定をご確認ください）": "Could not save (please check your browser settings)",
 "「EDIT VARIABLES」パネル用：名前つき変数を1行ずつ定義": "For the “EDIT VARIABLES” panel: define named variables, one per line",
 "Programmatic オブジェクト用：time等の定義済み変数と複数行の式が使える": "For Programmatic objects: predefined variables like time and multi-line expressions can be used",
 "＋ 中間変数を追加": "+ Add intermediate variable",
 "開く": "Open",
 "保存されている内容をすべて消して最初からやり直します。よろしいですか？": "This erases all saved content and starts over. Are you sure?",
 "前回の続きから復元しました ✓": "Restored from last time ✓",
 "画像をLOLBeansのSolid Paneピクセルアートに変換する": "Convert an image into LOLBeans Solid Pane pixel art",
 "入力画像": "Input image",
 "クリック or ドラッグ&ドロップ": "Click or drag & drop",
 "グリッドサイズ (ブロック数)": "Grid size (number of blocks)",
 "元画像の縦横比に合わせる": "Match the original aspect ratio",
 "グループ名": "Group name",
 "彩度 / 明度 補正(薄く見える場合の調整)": "Saturation / brightness correction (adjust if it looks faded)",
 "彩度": "Saturation",
 "明度": "Brightness",
 "透明ピクセルもブロック化する": "Also turn transparent pixels into blocks",
 "変換する": "Convert",
 "画像を選択するとここにピクセル化プレビューが表示されます": "Choose an image to see the pixelated preview here",
 ".glol をダウンロード": "Download .glol",
 "画像とグリッドサイズを正しく指定してください": "Please specify a valid image and grid size",
 "ブロック数:": "Blocks:",
 "グリッド:": "Grid:"
};
  const RULES = [
    [/^\((\d+)ピクセル中\)$/, '(out of $1 pixels)']
  ];
  let lang = 'jp';
  try { lang = localStorage.getItem(KEY) === 'en' ? 'en' : 'jp'; } catch (e) {}
  const orig = new WeakMap(), done = new WeakMap();

  function tr(str) {
    const t = str.trim();
    if (!t) return null;
    if (t in D) return str.replace(t, D[t]);
    let out = t, hit = false;
    for (const [re, rep] of RULES) { const n = out.replace(re, rep); if (n !== out) { out = n; hit = true; } }
    return hit ? str.replace(t, out) : null;
  }
  const skip = el => el && el.closest && el.closest('script,style,#nav-side-menu,#nav-menu-toggle,#nav-menu-overlay');
  function doText(n) {
    if (lang !== 'en' || skip(n.parentElement) || done.get(n) === n.nodeValue) return;
    const r = tr(n.nodeValue);
    if (r !== null && r !== n.nodeValue) { orig.set(n, n.nodeValue); done.set(n, r); n.nodeValue = r; }
  }
  function doAttrs(el) {
    if (skip(el)) return;
    ['placeholder', 'title'].forEach(a => {
      if (!el.hasAttribute || !el.hasAttribute(a)) return;
      const key = 'data-jp-' + a;
      const jp = el.hasAttribute(key) ? el.getAttribute(key) : el.getAttribute(a);
      const r = tr(jp);
      if (r !== null) { el.setAttribute(key, jp); el.setAttribute(a, r); }
    });
  }
  function walk(root) {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1 || skip(root)) return;
    doAttrs(root);
    root.querySelectorAll('[placeholder],[title]').forEach(doAttrs);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) doText(n);
  }
  function restore() {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) {
      if (orig.has(n) && done.get(n) === n.nodeValue) { n.nodeValue = orig.get(n); done.delete(n); }
    }
    document.querySelectorAll('[data-jp-placeholder],[data-jp-title]').forEach(el => {
      ['placeholder', 'title'].forEach(a => { const k = 'data-jp-' + a; if (el.hasAttribute(k)) { el.setAttribute(a, el.getAttribute(k)); el.removeAttribute(k); } });
    });
  }
  function titleFix() {
    if (!document.body.dataset.jpTitle) document.body.dataset.jpTitle = document.title;
    const jp = document.body.dataset.jpTitle;
    document.title = lang === 'en' ? jp.split(' | ').map(p => D[p.trim()] || p).join(' | ') : jp;
  }
  function setLang(l) {
    lang = l === 'en' ? 'en' : 'jp';
    document.documentElement.lang = lang === 'en' ? 'en' : 'ja';
    if (lang === 'en') walk(document.body); else restore();
    titleFix();
  }
  window.setLang = setLang;
  new MutationObserver(ms => {
    if (lang !== 'en') return;
    for (const m of ms) {
      if (m.type === 'characterData') doText(m.target);
      else m.addedNodes.forEach(walk);
    }
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  const start = () => setLang(lang);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();