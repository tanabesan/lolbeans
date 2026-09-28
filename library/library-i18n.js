/**
 * library-i18n.js
 * ファイルライブラリ(投稿ページ・管理画面)の英語表示(nav-menu.js の JP/EN 切り替えと連動)。
 * 各ページで nav-menu.js より前(または後)に <script src=".../library/library-i18n.js" defer></script> を読み込むだけ。
 * 日本語の文言をキーに辞書で置換し、後から動的に追加された文言も自動で翻訳します。
 */
(function () {
  const KEY = 'lolbeans-lang';
  const D = {
 "ファイルを投稿": "Submit a File",
 "あなたの.lol / .glolファイルをライブラリに投稿しよう": "Submit your .lol / .glol files to the library",
 "タイトル": "Title",
 "例: サイバーパンク street map": "e.g. Cyberpunk street map",
 "作者名": "Author name",
 "表示される名前": "Displayed name",
 "説明": "Description",
 "どんなファイルか簡単に説明してください": "Briefly describe the file",
 "ファイル種別": "File type",
 "ヘッダー画像(サムネイル・任意)": "Header image (thumbnail, optional)",
 "クリック or ドラッグ&ドロップ (画像)": "Click or drag & drop (image)",
 "未指定の場合はデフォルト画像が使われます。最大 3MB。": "If not specified, a default image is used. Max 3MB.",
 "ファイル (.lol / .glol)": "File (.lol / .glol)",
 "クリック or ドラッグ&ドロップ": "Click or drag & drop",
 "最大 2MB。": "Max 2MB.",
 "投稿する(審査待ちになります)": "Submit (pending review)",
 "← ファイルライブラリに戻る": "← Back to File Library",
 "画像ファイルを選んでください": "Please choose an image file",
 "サムネイル画像が3MBを超えています": "The thumbnail image exceeds 3MB",
 ".lol または .glol ファイルを選んでください": "Please choose a .lol or .glol file",
 "ファイルサイズが2MBを超えています": "The file size exceeds 2MB",
 "タイトル・作者名・ファイルは必須です": "Title, author name and file are required",
 "アップロード中...": "Uploading...",
 "投稿ありがとうございます!審査後に公開されます。": "Thank you for your submission! It will be published after review.",
 "投稿しました!審査後に公開されます。": "Submitted! It will be published after review.",
 "投稿に失敗しました。時間をおいて再度お試しください": "Failed to submit. Please try again later.",
 "管理画面": "Admin Panel",
 "管理者メールアドレス": "Admin email address",
 "パスワード": "Password",
 "ログイン": "Login",
 "ログアウト": "Logout",
 "ログインに失敗しました。メールアドレス/パスワードを確認してください": "Login failed. Please check your email/password.",
 "読み込み中...": "Loading...",
 "審査待ちの投稿はありません": "No submissions pending review",
 "ファイルを確認する →": "Check the file →",
 "承認する": "Approve",
 "却下する": "Reject",
 "承認中...": "Approving...",
 "却下中...": "Rejecting..."
};
  const RULES = [];
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