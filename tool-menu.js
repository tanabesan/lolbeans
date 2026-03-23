/* ================================================================
   tool-menu.js — LOLBeans ツール共通メニュー
   https://tanabesan.github.io/lolbeans/tool-menu.js

   各ページの </body> 直前に1行追加するだけで動く:
   <script src="https://tanabesan.github.io/lolbeans/tool-menu.js"></script>

   言語切替を持つページは window.TM_LANG_HOOK に関数を登録する:
   window.TM_LANG_HOOK = (lang) => { applyLanguage(lang); };
   ================================================================ */

(function () {
  /* ── ツール定義（追加・変更はここだけ） ── */
  const TOOLS = [
    {
      id:   'ranking',
      icon: '🏆',
      ja:   'WRランキング',
      en:   'WR Ranking',
      url:  'https://tanabesan.github.io/lolbeans/ranking.html',
    },
    {
      id:   'community',
      icon: '🗺️',
      ja:   'コース一覧',
      en:   'Course List',
      url:  'https://tanabesan.github.io/lolbeans/community.html',
    },
  ];

  /* ── 現在のページを判定 ── */
  function currentToolId() {
    const path = location.pathname;
    if (path.endsWith('ranking.html'))  return 'ranking';
    if (path.endsWith('community.html')) return 'community';
    return '';
  }

  /* ── 言語取得・保存 ── */
  function getLang() {
    return localStorage.getItem('language') || 'ja';
  }
  function setLang(lang) {
    localStorage.setItem('language', lang);
  }

  /* ── メニューHTML構築 ── */
  function buildMenu() {
    const lang    = getLang();
    const current = currentToolId();

    const bar = document.createElement('div');
    bar.id = 'tool-menu';
    bar.setAttribute('role', 'navigation');
    bar.setAttribute('aria-label', 'Tool Navigation');

    /* ツールボタン */
    TOOLS.forEach((tool, i) => {
      const a = document.createElement('a');
      a.className  = 'tm-btn' + (tool.id === current ? ' tm-active' : '');
      a.href       = tool.url;
      // 現在ページ以外は新しいタブ
      if (tool.id !== current) a.target = '_blank';
      a.setAttribute('aria-current', tool.id === current ? 'page' : '');

      const icon = document.createElement('span');
      icon.className   = 'tm-icon';
      icon.textContent = tool.icon;
      icon.setAttribute('aria-hidden', 'true');

      const label = document.createElement('span');
      label.className         = 'tm-label';
      label.dataset.toolId    = tool.id;
      label.textContent       = lang === 'ja' ? tool.ja : tool.en;

      a.appendChild(icon);
      a.appendChild(label);
      bar.appendChild(a);

      /* ツール間の区切り */
      if (i < TOOLS.length - 1) {
        const sep = document.createElement('div');
        sep.className = 'tm-sep';
        bar.appendChild(sep);
      }
    });

    /* 言語トグルの区切り */
    const sep2 = document.createElement('div');
    sep2.className = 'tm-sep';
    bar.appendChild(sep2);

    /* 言語トグル */
    const langWrap = document.createElement('div');
    langWrap.className = 'tm-lang';

    ['ja', 'en'].forEach(l => {
      const btn = document.createElement('button');
      btn.className   = 'tm-lang-btn' + (lang === l ? ' tm-lang-active' : '');
      btn.textContent = l === 'ja' ? 'JP' : 'EN';
      btn.dataset.lang = l;
      btn.addEventListener('click', () => switchLang(l));
      langWrap.appendChild(btn);
    });

    bar.appendChild(langWrap);
    document.body.appendChild(bar);
  }

  /* ── 言語切替 ── */
  function switchLang(lang) {
    setLang(lang);

    /* ラベル更新 */
    document.querySelectorAll('.tm-label').forEach(el => {
      const tool = TOOLS.find(t => t.id === el.dataset.toolId);
      if (tool) el.textContent = lang === 'ja' ? tool.ja : tool.en;
    });

    /* ボタンのアクティブ状態更新 */
    document.querySelectorAll('.tm-lang-btn').forEach(btn => {
      btn.classList.toggle('tm-lang-active', btn.dataset.lang === lang);
    });

    /* ページ側の言語切替関数を呼ぶ（登録されていれば） */
    if (typeof window.TM_LANG_HOOK === 'function') {
      window.TM_LANG_HOOK(lang);
    }
  }

  /* ── ページ読み込み後に挿入 ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildMenu);
  } else {
    buildMenu();
  }
})();
