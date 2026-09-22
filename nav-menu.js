/**
 * nav-menu.js
 * LOLBeansツール群共通の左サイドメニュー。
 * 使い方: <script src="/nav-menu.js" defer></script> を各ページに1行追加するだけ。
 * (root直下のページ、library/配下のページ、どちらからでも同じ絶対パスで動く)
 *
 * 現在のページをハイライトしたい場合は、<body>タグに
 * data-nav-current="file-library" のように id を指定してください。
 * 対応する値: home, lolex, community, ranking, template, block-forge,
 *            file-library, submit, faq, contact,
 *            lolrank-home, lolrank-vote, lolrank-ranking, lolrank-submit
 *
 * ── 言語切り替え（サイト全体共有） ──
 * 画面右上に EN/JP トグルボタンを自動で表示します。選択した言語は
 * localStorage に保存され、サイト内のどのページに移動しても引き継がれます。
 *
 * ページ側で言語切り替えに対応させたい場合は、そのページのスクリプト内に
 * グローバル関数 `setLang(lang)` を定義してください（lang は 'jp' か 'en'）。
 * nav-menu.js はページ読み込み時・トグル操作時に自動で `window.setLang(lang)`
 * を呼び出します（すでに ranking.html はこの方式に対応済み）。
 *
 * setLang() を持たないページでも、以下のいずれかの方法で言語変更を検知できます:
 *   - document.addEventListener('lolbeans:langchange', e => { e.detail.lang })
 *   - window.lolbeansGetLang() で現在の言語（'jp'/'en'）を取得
 */
(function () {
    const BASE = "https://tanabesan.github.io/lolbeans/";
    const LANG_KEY = "lolbeans-lang";

    function getStoredLang() {
        try { return localStorage.getItem(LANG_KEY) || "jp"; }
        catch (e) { return "jp"; }
    }
    function storeLang(l) {
        try { localStorage.setItem(LANG_KEY, l); }
        catch (e) { /* localStorage不可の環境は無視 */ }
    }

    const links = [
        { id: "home", group: "ホーム", items: [
            { id: "home", label: "トップページ", href: BASE }
        ]},
        { id: "tools", group: "ツール", items: [
            { id: "template", label: "IMAGE → GLOL", href: BASE + "conversion/template.html" },
            { id: "block-forge", label: "BLOCK FORGE", href: BASE + "blockforge/programatic.html" }
        ]},
        { id: "community", group: "コミュニティ", items: [
            { id: "community", label: "コース一覧", href: BASE + "community/community.html" },
            { id: "ranking", label: "WRランキング", href: BASE + "community/ranking.html" }
        ]},
        { id: "lolrank", group: "ビーンズランク", items: [
            { id: "lolrank-home", label: "概要", href: BASE + "lolrank/index.html" },
            { id: "lolrank-vote", label: "評価する", href: BASE + "lolrank/lolrank.html" },
            { id: "lolrank-ranking", label: "ランキング", href: BASE + "lolrank/ranking-tier.html" },
            { id: "lolrank-submit", label: "プレイヤー登録申請", href: BASE + "lolrank/submit-player.html" }
        ]},
        { id: "lolex", group: "LOL.ex", items: [
            { id: "lolex", label: "LOL.ex", href: BASE + "lolex/lolex.html" },
            { id: "faq", label: "よくある質問", href: BASE + "lolex/faq.html" },
            { id: "contact", label: "お問い合わせ", href: BASE + "lolex/contact.html" }
        ]},
        { id: "library", group: "ファイルライブラリ", items: [
            { id: "file-library", label: "ファイルライブラリ", href: BASE + "library/file.html" },
            { id: "submit", label: "ファイルを投稿する", href: BASE + "library/submit.html" }
        ]}
    ];

    const css = `
        .nav-menu-toggle {
            position: fixed;
            top: 16px;
            left: 16px;
            width: 46px;
            height: 46px;
            background-color: rgba(23, 26, 41, 0.92);
            border: 2px solid var(--panel-line, #2c3044);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 1100;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .nav-menu-toggle:hover {
            border-color: var(--accent2, #00ffff);
            box-shadow: 0 0 12px rgba(0,255,255,0.35);
        }
        .nav-menu-toggle .bar-stack { width: 20px; height: 14px; position: relative; }
        .nav-menu-toggle .bar {
            position: absolute;
            left: 0;
            width: 100%;
            height: 2px;
            background: var(--accent2, #00ffff);
            transition: transform 0.25s ease, opacity 0.2s ease, top 0.25s ease, background 0.2s ease;
        }
        .nav-menu-toggle .bar:nth-child(1) { top: 0; }
        .nav-menu-toggle .bar:nth-child(2) { top: 6px; width: 70%; }
        .nav-menu-toggle .bar:nth-child(3) { top: 12px; }
        .nav-menu-toggle:hover .bar:nth-child(2) { width: 100%; }
        .nav-menu-toggle.open .bar { background: var(--accent, #ff00ff); }
        .nav-menu-toggle.open .bar:nth-child(1) { top: 6px; transform: rotate(45deg); }
        .nav-menu-toggle.open .bar:nth-child(2) { opacity: 0; }
        .nav-menu-toggle.open .bar:nth-child(3) { top: 6px; transform: rotate(-45deg); }

        .nav-menu-overlay {
            position: fixed;
            inset: 0;
            background: rgba(6,7,14,0.7);
            z-index: 1050;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
        }
        .nav-menu-overlay.open { opacity: 1; pointer-events: auto; }

        .nav-lang-toggle {
            position: fixed;
            top: 16px;
            right: 16px;
            height: 46px;
            min-width: 46px;
            padding: 0 16px;
            background-color: rgba(23, 26, 41, 0.92);
            border: 2px solid var(--panel-line, #2c3044);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            cursor: pointer;
            z-index: 1100;
            color: var(--accent2, #00ffff);
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 1px;
            transition: border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
        }
        .nav-lang-toggle:hover {
            border-color: var(--accent, #ff00ff);
            color: var(--accent, #ff00ff);
            box-shadow: 0 0 12px rgba(255,0,255,0.35);
        }
        .nav-lang-toggle .material-symbols-outlined,
        .nav-lang-toggle .ms { font-size: 16px; }

        .nav-side-menu {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: 260px;
            background: var(--panel, #171a29);
            border-right: 2px solid var(--panel-line, #2c3044);
            z-index: 1090;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            padding: 80px 0 20px;
            overflow-y: auto;
            font-family: 'JetBrains Mono', monospace;
        }
        .nav-side-menu.open { transform: translateX(0); }
        .nav-side-menu .menu-group-label {
            font-size: 10px;
            color: var(--text-dim, #6b7189);
            letter-spacing: 1px;
            padding: 16px 20px 8px;
            text-transform: uppercase;
        }
        .nav-side-menu a {
            display: block;
            padding: 11px 20px;
            color: var(--text, #d8dce8);
            text-decoration: none;
            font-size: 13px;
            border-left: 3px solid transparent;
            transition: border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease;
        }
        .nav-side-menu a:hover {
            border-left-color: var(--accent2, #00ffff);
            color: var(--accent2, #00ffff);
            background: rgba(0,255,255,0.05);
        }
        .nav-side-menu a.current {
            border-left-color: var(--accent, #ff00ff);
            color: var(--accent, #ff00ff);
        }
        @media (max-width: 768px) {
            .nav-side-menu { width: 220px; }
            .nav-lang-toggle { top: 16px; right: 12px; height: 40px; min-width: 40px; padding: 0 12px; font-size: 11px; }
        }
    `;

    function buildHtml() {
        const currentId = document.body.getAttribute('data-nav-current') || '';
        let linksHtml = '';
        links.forEach(group => {
            linksHtml += `<div class="menu-group-label">${group.group}</div>`;
            group.items.forEach(item => {
                const cls = item.id === currentId ? ' class="current"' : '';
                linksHtml += `<a href="${item.href}"${cls}>${item.label}</a>`;
            });
        });

        return `
            <div class="nav-menu-toggle" id="nav-menu-toggle">
                <div class="bar-stack">
                    <span class="bar"></span>
                    <span class="bar"></span>
                    <span class="bar"></span>
                </div>
            </div>
            <div class="nav-lang-toggle" id="nav-lang-toggle" title="Language / 言語切替">
                <span id="nav-lang-toggle-label">EN</span>
            </div>
            <div class="nav-menu-overlay" id="nav-menu-overlay"></div>
            <nav class="nav-side-menu" id="nav-side-menu">
                ${linksHtml}
            </nav>
        `;
    }

    function applyLang(l, opts) {
        opts = opts || {};
        storeLang(l);
        const label = document.getElementById('nav-lang-toggle-label');
        if (label) label.textContent = l === 'jp' ? 'EN' : 'JP';
        if (typeof window.setLang === 'function') {
            window.setLang(l);
        }
        if (!opts.silent) {
            document.dispatchEvent(new CustomEvent('lolbeans:langchange', { detail: { lang: l } }));
        }
    }

    function init() {
        const styleEl = document.createElement('style');
        styleEl.id = 'nav-menu-styles';
        styleEl.textContent = css;
        document.head.appendChild(styleEl);

        const wrapper = document.createElement('div');
        wrapper.innerHTML = buildHtml();
        while (wrapper.firstChild) {
            document.body.insertBefore(wrapper.firstChild, document.body.firstChild);
        }

        const toggle = document.getElementById('nav-menu-toggle');
        const overlay = document.getElementById('nav-menu-overlay');
        const sideMenu = document.getElementById('nav-side-menu');
        const langToggle = document.getElementById('nav-lang-toggle');

        toggle.addEventListener('click', () => {
            const isOpen = sideMenu.classList.toggle('open');
            overlay.classList.toggle('open', isOpen);
            toggle.classList.toggle('open', isOpen);
        });
        overlay.addEventListener('click', () => {
            sideMenu.classList.remove('open');
            overlay.classList.remove('open');
            toggle.classList.remove('open');
        });
        langToggle.addEventListener('click', () => {
            const next = getStoredLang() === 'jp' ? 'en' : 'jp';
            applyLang(next);
        });

        // ページ読み込み時、保存済みの言語設定を反映
        // (このページ独自の初期表示が終わったあとに上書きするため silent で適用)
        applyLang(getStoredLang(), { silent: true });

        window.lolbeansGetLang = getStoredLang;
        window.lolbeansSetLang = applyLang;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();