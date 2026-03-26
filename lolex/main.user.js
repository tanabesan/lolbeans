// ==UserScript==
// @name         LOL.ex ver0.81
// @namespace    http://tampermonkey.net/
// @version      0.81
// @description  LOLBeans extension - Fully refactored: XSS fixes, perf improvements, clean architecture
// @author       ユウキ / Yuki
// @match        https://lolbeans.io/*
// @match        https://bean.lol/*
// @match        https://obby.lol/*
// @grant        unsafeWindow
// @run-at       document-start
// @updateURL    https://tanabesan.github.io/lolbeans/lolex/main.user.js
// @downloadURL  https://tanabesan.github.io/lolbeans/lolex/main.user.js
// ==/UserScript==

(function () {
    'use strict';

    // ------------------------------------------------------------------------------------------------
    //                                  定数・設定
    // ------------------------------------------------------------------------------------------------

    const SCRIPT_VERSION = '0.81';

    // --- ストレージキー ---
    const STORAGE = {
        VIDEO:          'yt-videoId',
        PLAYLIST:       'yt-playlistId',
        TIME:           'yt-last-time',
        BACKGROUND:     'customBackgroundUrl',
        BG_LIST:        'customBackgroundList',
        IS_VISIBLE:     'yt-is-visible',
        LOOP:           'yt-loop',
        SHUFFLE:        'yt-shuffle',
        AIR_MOVE_AUTO:  'airMoveAutoSwitchEnabled',
        LANGUAGE:       'lolex-language',
        PRIMARY_COLOR:  'lolex-primary-color',
        SECONDARY_COLOR:'lolex-secondary-color',
        YT_COLLAPSED:   'yt-collapsed',
        VOLUME:         'yt-volume',
        BAR_VISIBLE:    'yt-card-visible',
        YT_HOTKEY:      'lolex-yt-hotkey',
        FLOAT_BTN:      'lolex-yt-float-btn',
    };

    const DEFAULT = {
        PRIMARY:   '#BB86FC',
        SECONDARY: '#03DAC6',
        BG_URLS: [
            'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1280&q=80',
            'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=1280&q=80',
            'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1280&q=80',
            'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1280&q=80',
            'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1280&q=80',
            'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1280&q=80',
        ],
    };

    // ------------------------------------------------------------------------------------------------
    //                                  ストレージ ユーティリティ
    // ------------------------------------------------------------------------------------------------

    const getStoredBool = (key, fallback = false) => {
        const v = localStorage.getItem(key);
        if (v === null) return fallback;
        return v === 'true';
    };

    const setStoredBool = (key, value) => localStorage.setItem(key, String(Boolean(value)));

    const getStoredFloat = (key, fallback = 0) => {
        const v = parseFloat(localStorage.getItem(key));
        return isNaN(v) ? fallback : v;
    };

    // ------------------------------------------------------------------------------------------------
    //                                  グローバル状態
    // ------------------------------------------------------------------------------------------------

    let player           = null;
    let isApiReady       = false;
    let saveTimeInterval = null;
    let initCompleted    = false;
    let currentVideoId   = localStorage.getItem(STORAGE.VIDEO);
    let lastTime         = getStoredFloat(STORAGE.TIME, 0);

    let _cachedLang = null;

    // ------------------------------------------------------------------------------------------------
    //                                  コースデータ
    // ------------------------------------------------------------------------------------------------

    const COURSES = [
        { id: 'beacon-bay',    keyword: 'BeaconBay',          message: '🚨 Beacon Bay 🚨',         displayName: 'Beacon Bay' },
        { id: 'boulder-hill',  keyword: 'BoulderHill',        message: '🐛 Boulder Hill 🐛',       displayName: 'Boulder Hill' },
        { id: 'circus-contest',keyword: 'CircusContest',      message: '🎪 Circus Contest 🎪',     displayName: 'Circus Contest' },
        { id: 'devils-trick',  keyword: 'DevilsTrick',        message: "👿 Devil's Trick 👿",      displayName: "Devils Trick" },
        { id: 'dash-cup',      keyword: 'FastRace',           message: '🏆 Dash Cup 🏆',           displayName: 'Dash Cup' },
        { id: 'escape-tsunami',keyword: 'EscapeTsunami',      message: '🌊 Escape Tsunami 🌊',     displayName: 'Escape Tsunami' },
        { id: 'gravity-gates', keyword: 'GravityGates',       message: '🌌 Gravity Gates 🌌',      displayName: 'Gravity Gates' },
        { id: 'hammer-ville',  keyword: 'HammerVille',        message: '🍩 Hammer Ville 🍩',       displayName: 'Hammer Ville' },
        { id: 'jungle-temple', keyword: 'JungleTemple',       message: '🐍 Jungle Temple 🐍',      displayName: 'Jungle Temple' },
        { id: 'kittie-kegs',   keyword: 'KittieKegs',         message: '🐱 Kittie Kegs 🙀',        displayName: 'Kittie Kegs' },
        { id: 'lava-lake',     keyword: 'FloorIsLava',        message: '🌋 Lava Lake 🌋',          displayName: 'Lava Lake' },
        { id: 'mecha-maze',    keyword: 'MechaMaze',          message: '🤖 Mecha Maze 🤖',         displayName: 'Mecha Maze' },
        { id: 'mill-valley',   keyword: 'MillValley',         message: '🌾 Mill Valley 🍃',        displayName: 'Mill Valley' },
        { id: 'monster-manor', keyword: 'MonsterManor',       message: '🎃 Monster Manor 💀',      displayName: 'Monster Manor' },
        { id: 'polar-path',    keyword: 'PolarPath',          message: '🧊 Polar Path 🧊',         displayName: 'Polar Path' },
        { id: '123-red-light', keyword: 'RedLightGreenLight', message: '🦑 1-2-3 Red Light 🦑',   displayName: '1-2-3 Red Light' },
        { id: 'nasty-seals',   keyword: 'NastySeals',         message: '🦑 Nasty Seals 🦑',        displayName: 'Nasty Seals' },
        { id: 'rickety-run',   keyword: 'RicketyRun',         message: '🟦 Rickety Run 🟪',        displayName: 'Rickety Run' },
        { id: 'risky-cliffs',  keyword: 'RiskyCliffs',        message: '🎅 Risky Cliffs 🎅',       displayName: 'Risky Cliffs' },
        { id: 'shark-park',    keyword: 'SharkPark',          message: '🦈 Shark Park 🦈',         displayName: 'Shark Park' },
        { id: 'silly-slide',   keyword: 'SillySlide',         message: '🛝 Silly Slide 🛝',        displayName: 'Silly Slide' },
        { id: 'spiky-slopes',  keyword: 'SpikySlopes',        message: '🔨 Spiky Slopes 🔨',       displayName: 'Spiky Slopes' },
        { id: 'splash-dash',   keyword: 'SplashDash',         message: '🏊 Splash Dash 🏊',        displayName: 'Splash Dash' },
        { id: 'tumble-town',   keyword: 'TumbleTown',         message: '✋ Tumble Town ✋',         displayName: 'Tumble Town' },
        { id: 'tricky-traps',  keyword: 'TrickyTraps',        message: '🎁 Tricky Traps 🎁',       displayName: 'Tricky Traps' },
        { id: 'ufo-attack',    keyword: 'UFOAttack',          message: '🛸 UFO Attack 🛸',         displayName: 'UFO Attack' },
    ];

    // ------------------------------------------------------------------------------------------------
    //                                  言語辞書
    // ------------------------------------------------------------------------------------------------

    const LANG_DATA = {
        ja: {
            tabTitle:            `LOL.ex v${SCRIPT_VERSION}`,
            discordInvite:       'Discordサーバーに参加する',
            latestUpdates:       '最新アップデート情報',
            updateInfo:          '・全体的なリファクタリングを実施しました。<br>・XSSリスクを修正しました。<br>・パフォーマンスと安定性を向上させました。<br>・背景編集UIをモーダルに変更しました。',
            language:            '言語',
            airMoveAutoSwitch:   'Air Move 自動切り替え全体制御',
            enableAutoSwitch:    'Air Move 自動切り替え機能を有効化',
            autoSwitchOff:       '[OFFの場合]: コースが変わってもAir Moveの状態は変わりません (手動設定を維持)。',
            autoSwitchOn:        '[ONの場合]: コースが変わるたびに「コース別設定」に基づいてAir Moveが自動で切り替わります。',
            courseSettings:      'コース別 Air Move ON/OFF設定',
            courseSettingLabel:  'の Air Move設定:',
            on:                  'ON',
            off:                 'OFF',
            visualCustomization: '視覚カスタマイズ',
            backgroundColor:     'カスタム背景画像のURLリスト',
            apply:               'リストからランダムに適用',
            resetToDefault:      'デフォルトのリストに戻す',
            shuffleBackground:   'ランダム背景を適用 (シャッフル)',
            resetColors:         'カラーをデフォルトに戻す',
            resetColorConfirm:   'UIカラー設定をデフォルトの紫・シアンに戻します。よろしいですか？',
            backgroundNote:      '「リストを編集」で管理されている画像がランダムに適用されます。「デフォルトに戻す」を押すと、リストがデフォルトにリセットされます。',
            primaryColor:        'UIメインカラー',
            secondaryColor:      'UIサブカラー',
            editList:            'リストを編集',
            modalTitle:          '背景URLリストの編集',
            addUrl:              '画像URLをここに入力...',
            add:                 '追加',
            save:                '保存して閉じる',
            close:               '閉じる',
            previewError:        'プレビュー不可',
            resetListConfirm:    'リストをデフォルトに戻します。よろしいですか？',
            ytSettings:          'YouTube BGMプレイヤー設定',
            ytHotkey:            '🎵 表示/非表示: 設定したキー',
            loop:                'ループ再生',
            shuffle:             'プレイリストをシャッフル',
            ytNote:              'ループ/シャッフル設定は、次回の動画/プレイリスト読み込み時に適用されます。',
            ytInputPlaceholder:  'YouTube URL or ID を入力して Enter',
            ytLoadButton:        'Load',
            ytInvalidUrl:        '無効なYouTube URLまたはIDです。',
            ytHotkeyLabel:       '音楽プレイヤー表示キー',
            ytHotkeyHint:        'キーを押して設定...',
            ytHotkeyNone:        '未設定',
            ytFloatBtn:          'フロートボタン',
            ytFloatBtnShow:      '表示',
            ytFloatBtnFaint:     '薄表示',
            ytFloatBtnHide:      '非表示',
            ytNowPlaying:        '再生中',
            ytNoTrack:           '--- 未読込 ---',
            ytVolume:            '音量',
            nextRound:           'Next Round...',
        },
        en: {
            tabTitle:            `LOL.ex v${SCRIPT_VERSION}`,
            discordInvite:       'Join Discord Server',
            latestUpdates:       'Latest Updates',
            updateInfo:          '・Full refactoring implemented.<br>・XSS risk fixed.<br>・Improved performance and stability.<br>・Changed background editing UI to a modal window.',
            language:            'Language',
            airMoveAutoSwitch:   'Air Move Auto Switch Control',
            enableAutoSwitch:    'Enable Air Move Auto Switch',
            autoSwitchOff:       '[OFF]: Air Move state remains unchanged when the course changes (maintains manual setting).',
            autoSwitchOn:        '[ON]: Air Move automatically switches based on "Course Settings" when the course changes.',
            courseSettings:      'Course Specific Air Move ON/OFF Settings',
            courseSettingLabel:  'Air Move Setting:',
            on:                  'ON',
            off:                 'OFF',
            visualCustomization: 'Visual Customization',
            backgroundColor:     'Custom Background Image URL List',
            apply:               'Apply Random from List',
            resetToDefault:      'Reset List to Default',
            shuffleBackground:   'Apply Random Background (Shuffle)',
            resetColors:         'Reset Colors to Default',
            resetColorConfirm:   'Are you sure you want to reset UI colors to default Purple and Cyan?',
            backgroundNote:      'A random image from the managed list will be applied. Resetting to default will restore the default list.',
            primaryColor:        'UI Primary Color',
            secondaryColor:      'UI Secondary Color',
            editList:            'Edit List',
            modalTitle:          'Edit Background URL List',
            addUrl:              'Enter Image URL here...',
            add:                 'Add',
            save:                'Save & Close',
            close:               'Close',
            previewError:        'Preview N/A',
            resetListConfirm:    'Are you sure you want to reset the list to default?',
            ytSettings:          'YouTube BGM Player Settings',
            ytHotkey:            '🎵 Toggle Bar: Configured Key',
            loop:                'Loop Playback',
            shuffle:             'Shuffle Playlist',
            ytNote:              'Loop/Shuffle settings are applied on the next video/playlist load.',
            ytInputPlaceholder:  'Enter YouTube URL or ID then press Enter',
            ytLoadButton:        'Load',
            ytInvalidUrl:        'Invalid YouTube URL or ID.',
            ytHotkeyLabel:       'Music Player Toggle Key',
            ytHotkeyHint:        'Press a key to set...',
            ytHotkeyNone:        'Not set',
            ytFloatBtn:          'Float Button',
            ytFloatBtnShow:      'Show',
            ytFloatBtnFaint:     'Faint',
            ytFloatBtnHide:      'Hide',
            ytNowPlaying:        'Now Playing',
            ytNoTrack:           '--- No Track ---',
            ytVolume:            'Volume',
            nextRound:           'Next Round...',
        },
    };

    // ================================================================
    //  ミニ DOM ユーティリティ（el / on / append / $）
    // ================================================================

    function el(tag, props = {}, style = {}) {
        const e = document.createElement(tag);
        Object.assign(e, props);
        Object.assign(e.style, style);
        return e;
    }
    function on(element, events, capture = false) {
        if (!element) return;
        Object.entries(events).forEach(([type, fn]) => element.addEventListener(type, fn, capture));
    }
    function append(parent, ...children) { children.forEach(c => parent.appendChild(c)); }
    const $ = id => document.getElementById(id);

    // ------------------------------------------------------------------------------------------------
    //                                  言語ユーティリティ
    // ------------------------------------------------------------------------------------------------

    function getLang() {
        if (!_cachedLang) {
            _cachedLang = localStorage.getItem(STORAGE.LANGUAGE) || 'ja';
        }
        return _cachedLang;
    }

    function invalidateLangCache() {
        _cachedLang = null;
    }

    function t(key) {
        const lang = getLang();
        return (LANG_DATA[lang] && LANG_DATA[lang][key]) || LANG_DATA['ja'][key] || `[${key}]`;
    }

    // ------------------------------------------------------------------------------------------------
    //                                  カラーユーティリティ
    // ------------------------------------------------------------------------------------------------

    const getPrimaryColor   = () => localStorage.getItem(STORAGE.PRIMARY_COLOR)   || DEFAULT.PRIMARY;
    const getSecondaryColor = () => localStorage.getItem(STORAGE.SECONDARY_COLOR) || DEFAULT.SECONDARY;

    function applyColorTheme(primary, secondary) {
        const root = document.documentElement.style;
        root.setProperty('--primary-color',   primary);
        root.setProperty('--secondary-color', secondary);
        applySiteTheme(primary, secondary);
    }

    function applySiteTheme(primary, secondary) {
        const styleId = 'lolex-site-theme';
        let style = document.getElementById(styleId);
        if (!style) {
            style    = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
        }

        const toRgb = hex => {
            const n = parseInt(hex.replace('#',''), 16);
            return [(n>>16)&255, (n>>8)&255, n&255];
        };
        const alpha = (hex, a) => {
            const [r,g,b] = toRgb(hex);
            return `rgba(${r},${g},${b},${a})`;
        };

        style.textContent = `
            #btn-play {
                background: ${primary} !important;
                color: #000 !important;
                box-shadow: 4px 4px 14px ${alpha(primary, 0.55)} !important;
            }
            #btn-play:hover { filter: brightness(1.1); }
            #select-gamemode-value {
                background-color: ${secondary} !important;
                color: #000 !important;
                box-shadow: 2px 2px 8px ${alpha(secondary, 0.45)} !important;
            }
            #btn-community-level {
                background: ${alpha(secondary, 0.8)} !important;
                color: #000 !important;
                box-shadow: 2px 2px 6px ${alpha(secondary, 0.35)} !important;
            }
            html body .primary-btn {
                background-color: rgba(255,255,255,0.70) !important;
                backdrop-filter: blur(6px) !important;
                -webkit-backdrop-filter: blur(6px) !important;
                color: #1a1a1a !important;
                border: 1px solid ${alpha(secondary, 0.55)} !important;
            }
            html body .primary-btn:hover {
                background-color: rgba(255,255,255,0.90) !important;
                color: #000 !important;
                border-color: ${secondary} !important;
                box-shadow: 0 0 8px ${alpha(secondary, 0.4)} !important;
            }
            html body .secondary-btn {
                background-color: rgba(255,255,255,0.62) !important;
                backdrop-filter: blur(6px) !important;
                -webkit-backdrop-filter: blur(6px) !important;
                color: #1a1a1a !important;
                border: 1px solid ${alpha(secondary, 0.4)} !important;
            }
            html body .secondary-btn:hover {
                background-color: rgba(255,255,255,0.88) !important;
                color: #000 !important;
                border-color: ${secondary} !important;
            }
            #party-mode-button {
                background-color: rgba(255,255,255,0.70) !important;
                backdrop-filter: blur(6px) !important;
                border: 1px solid ${alpha(secondary, 0.55)} !important;
                color: #1a1a1a !important;
            }
            #party-mode-button:hover {
                background-color: rgba(255,255,255,0.90) !important;
                border-color: ${secondary} !important;
                box-shadow: 0 0 8px ${alpha(secondary, 0.4)} !important;
            }
            #coins-balance-button {
                background-color: transparent !important;
                border: 1px solid ${alpha(secondary, 0.5)} !important;
                color: #fff !important;
            }
            #coins-plus-button {
                background-color: rgba(0,0,0,0.3) !important;
                border-left: 1px solid ${alpha(secondary, 0.5)} !important;
            }
            #coins-plus-button:hover {
                background-color: ${alpha(secondary, 0.35)} !important;
            }
            #settings-screen .center-panel .mid-section #tab1:checked ~ nav .tab1 label,
            #settings-screen .center-panel .mid-section #tab2:checked ~ nav .tab2 label,
            #settings-screen .center-panel .mid-section #tab3:checked ~ nav .tab3 label,
            #settings-screen .center-panel .mid-section #tab4:checked ~ nav .tab4 label {
                background: #fff !important;
                color: #111 !important;
                border-bottom: 3px solid ${primary} !important;
            }
            #settings-screen .center-panel .mid-section ul li label {
                background: #bbb !important;
                color: #333 !important;
            }
            #settings-screen .center-panel .mid-section ul li label:hover {
                background: #ddd !important;
            }
            #settings-screen .radio-toolbar label {
                background: #888 !important;
                color: #eee !important;
            }
            #settings-screen .radio-toolbar label:hover {
                background: #aaa !important;
                color: #000 !important;
            }
            #settings-screen .radio-toolbar input[type="radio"]:checked + label {
                background: ${secondary} !important;
                color: #000 !important;
            }
            #settings-screen-done-btn {
                background: rgba(0,0,0,0.42) !important;
                backdrop-filter: blur(6px) !important;
                color: #e8e8e8 !important;
                border: 1.5px solid ${alpha(secondary, 0.6)} !important;
            }
            #settings-screen-done-btn:hover {
                background: rgba(0,0,0,0.62) !important;
                color: #fff !important;
                border-color: ${secondary} !important;
                box-shadow: 0 0 10px ${alpha(secondary, 0.45)} !important;
            }
            .center-panel .mid-section .footer .ready-btn,
            .center-panel .mid-section .footer .new-game-btn,
            .center-panel .mid-section .footer .continue-btn {
                background: #d4c01a !important;
                color: #130033 !important;
                border: 1.5px solid ${alpha(secondary, 0.6)} !important;
                box-shadow: 4px 4px 12px rgba(0,0,0,0.45) !important;
            }
            .center-panel .mid-section .footer .ready-btn:hover,
            .center-panel .mid-section .footer .new-game-btn:hover,
            .center-panel .mid-section .footer .continue-btn:hover {
                background: #b8a716 !important;
                border-color: ${secondary} !important;
            }
            .secondary-btns .quit-btn,
            .secondary-btns .settings-btn {
                background: rgba(255,255,255,0.62) !important;
                backdrop-filter: blur(6px) !important;
                -webkit-backdrop-filter: blur(6px) !important;
                color: #000 !important;
                border: 1px solid ${alpha(secondary, 0.5)} !important;
            }
            .secondary-btns .quit-btn:hover,
            .secondary-btns .settings-btn:hover {
                background: rgba(255,255,255,0.88) !important;
                border-color: ${secondary} !important;
            }
            .scoreboard .score-rows-wrapper .row.local-player {
                background: rgba(0, 0, 0, 0.88) !important;
                color: #e8e8e8 !important;
                border-left: 3px solid ${primary} !important;
            }
            ::-webkit-scrollbar-thumb {
                background: ${alpha(secondary, 0.45)} !important;
                border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb:hover {
                background: ${secondary} !important;
            }
            ::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.18) !important;
            }
        `;
    }

    function saveTime() {
        if (!player) return;
        try {
            const time = player.getCurrentTime?.();
            if (typeof time === 'number' && !isNaN(time)) {
                localStorage.setItem(STORAGE.TIME, time);
                lastTime = time;
            }
        } catch (_) {}
    }

    function onPlayerReady(event) {
        try {
            event.target.unMute();
            const vol = parseInt(localStorage.getItem(STORAGE.VOLUME) ?? '80', 10);
            event.target.setVolume(vol);
            event.target.setLoop(getStoredBool(STORAGE.LOOP));
            if (localStorage.getItem(STORAGE.PLAYLIST)) {
                event.target.setShuffle(getStoredBool(STORAGE.SHUFFLE));
            }
            if (!localStorage.getItem(STORAGE.PLAYLIST) && lastTime > 0) {
                event.target.seekTo(lastTime, true);
            }
            updateBarTitle();
        } catch (e) {
            console.error('[LOL.ex] onPlayerReady error:', e);
        }
    }

    function onPlayerStateChange(event) {
        clearInterval(saveTimeInterval);
        saveTimeInterval = null;
        try {
            if (event.data === unsafeWindow.YT.PlayerState.PLAYING) {
                saveTimeInterval = setInterval(saveTime, 2000);
                updateBarTitle();
                updateBarPlayButton(true);
            } else if (event.data === unsafeWindow.YT.PlayerState.PAUSED) {
                updateBarPlayButton(false);
            } else if (event.data === unsafeWindow.YT.PlayerState.ENDED) {
                saveTime();
                updateBarPlayButton(false);
            }
        } catch (e) {
            console.error('[LOL.ex] onPlayerStateChange error:', e);
        }
    }

    function updateBarTitle() {
        if (!player) return;
        try {
            const data  = player.getVideoData?.() || {};
            const title = data.title  || '';
            const vidId = data.video_id || '';

            const titleEl = $('yt-card-title');
            if (titleEl) titleEl.textContent = title || t('ytNoTrack');

            const bg = $('yt-card');
            if (bg && vidId) {
                bg.style.backgroundImage =
                    `url('https://i.ytimg.com/vi/${vidId}/mqdefault.jpg')`;
            } else if (bg) {
                bg.style.backgroundImage = 'none';
            }
        } catch (_) {}
    }

    function updateBarPlayButton(isPlaying) {
        const btn = document.getElementById('yt-card-play');
        if (btn) btn.textContent = isPlaying ? '⏸' : '▶';
        if (isPlaying) {
            startEqAnimation();
        } else {
            stopEqAnimation();
        }
    }

    const EQ_COLS      = 14;
    const EQ_SEGS      = 7;
    const _eqTargets   = new Float32Array(EQ_COLS).fill(3);
    const _eqCurrents  = new Float32Array(EQ_COLS).fill(1);
    let   _eqNextChange = 0;
    let   _eqAnimId     = null;

    function startEqAnimation() {
        if (_eqAnimId) return;
        function frame(ts) {
            if (ts > _eqNextChange) {
                for (let i = 0; i < EQ_COLS; i++) {
                    const base = 1 + Math.random() * (EQ_SEGS - 1);
                    _eqTargets[i] = base;
                }
                _eqNextChange = ts + 80 + Math.random() * 120;
            }
            for (let i = 0; i < EQ_COLS; i++) {
                _eqCurrents[i] += (_eqTargets[i] - _eqCurrents[i]) * 0.22;
            }
            const cols = document.querySelectorAll('.yt-eq-col');
            cols.forEach((col, ci) => {
                const activeCount = Math.round(_eqCurrents[ci]);
                col.querySelectorAll('.yt-eq-seg').forEach((seg, si) => {
                    const segIdx = EQ_SEGS - 1 - si;
                    const visible = segIdx < activeCount;
                    seg.style.opacity = visible ? '1' : '0';
                });
            });
            _eqAnimId = requestAnimationFrame(frame);
        }
        _eqAnimId = requestAnimationFrame(frame);
    }

    function stopEqAnimation() {
        if (_eqAnimId) {
            cancelAnimationFrame(_eqAnimId);
            _eqAnimId = null;
        }
        document.querySelectorAll('.yt-eq-col').forEach(col => {
            col.querySelectorAll('.yt-eq-seg').forEach((seg, si) => {
                seg.style.opacity = si === EQ_SEGS - 1 ? '0.15' : '0';
            });
        });
    }

    // ------------------------------------------------------------------------------------------------
    //                                  Air Move ユーティリティ
    // ------------------------------------------------------------------------------------------------

    function clickAirMoveRadio(enabled) {
        const selector = enabled ? '#air-movement-on' : '#air-movement-off';
        const radio = document.querySelector(selector);
        if (radio && !radio.checked) radio.click();
    }

    function parseYouTubeInput(val) {
        let videoId    = null;
        let playlistId = null;
        try {
            const url = new URL(val);
            videoId    = url.searchParams.get('v') || null;
            playlistId = url.searchParams.get('list') || null;
            if (!videoId && url.hostname === 'youtu.be') {
                videoId = url.pathname.slice(1) || null;
            }
        } catch (_) {
            if (/^[A-Za-z0-9_-]{11}$/.test(val)) {
                videoId = val;
            } else if (/^PL[A-Za-z0-9_-]+$/.test(val)) {
                playlistId = val;
            }
        }
        return { videoId, playlistId };
    }

    function loadYouTube(inputVal) {
        if (!player || typeof player.loadPlaylist !== 'function') return;

        const val = (inputVal || '').trim();
        let videoId    = null;
        let playlistId = null;

        if (val.length > 0) {
            const ids = parseYouTubeInput(val);
            if (ids.playlistId) {
                playlistId = ids.playlistId;
                videoId    = ids.videoId;
            } else if (ids.videoId) {
                videoId = ids.videoId;
            } else {
                alert(t('ytInvalidUrl'));
                return;
            }
        }

        localStorage.setItem(STORAGE.VIDEO,    videoId    || '');
        localStorage.setItem(STORAGE.PLAYLIST, playlistId || '');
        localStorage.setItem(STORAGE.TIME,     0);
        lastTime       = 0;
        currentVideoId = videoId;

        const loop    = getStoredBool(STORAGE.LOOP);
        const shuffle = getStoredBool(STORAGE.SHUFFLE);

        try {
            if (playlistId) {
                player.loadPlaylist({ list: playlistId, listType: 'playlist', index: 0, startSeconds: 0 });
                player.setLoop(loop);
                player.setShuffle(shuffle);
                player.unMute();
                player.playVideo();
            } else if (videoId) {
                player.loadVideoById({ videoId, startSeconds: 0 });
                player.setLoop(loop);
                player.unMute();
                player.playVideo();
            } else {
                player.stopVideo();
            }
        } catch (e) {
            console.error('[LOL.ex] loadYouTube error:', e);
        }
    }

    // ------------------------------------------------------------------------------------------------
    //                                  背景カスタマイズ
    // ------------------------------------------------------------------------------------------------

    function getBackgroundList() {
        const raw = localStorage.getItem(STORAGE.BG_LIST) || '';
        const urls = raw.split('\n').map(u => u.trim()).filter(u => u.length > 0);
        return urls.length > 0 ? urls : [...DEFAULT.BG_URLS];
    }

    function applyCustomBackground(forceRandom = false) {
        try {
            const styleId = 'custom-background-style';
            const existing = document.getElementById(styleId);
            if (existing) existing.remove();

            const list = getBackgroundList();
            let imageUrl = localStorage.getItem(STORAGE.BACKGROUND);

            if (forceRandom || !imageUrl) {
                imageUrl = list[Math.floor(Math.random() * list.length)];
                localStorage.setItem(STORAGE.BACKGROUND, imageUrl);
            }

            if (!imageUrl) return;

            const isValidUrl = /^https?:\/\//.test(imageUrl);
            if (!isValidUrl) {
                console.warn('[LOL.ex] Invalid background URL skipped:', imageUrl);
                return;
            }

            const escapedUrl = imageUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

            const style = document.createElement('style');
            style.id    = styleId;
            style.textContent = `
                html body #screens #home-screen,
                html body #screens #profile-screen,
                html body #screens #shop-screen {
                    background-image: url('${escapedUrl}') !important;
                    background-size: cover !important;
                    background-position: center !important;
                }
            `;
            document.documentElement.appendChild(style);
        } catch (e) {
            console.error('[LOL.ex] Failed to apply custom background:', e);
        }
    }

    // ------------------------------------------------------------------------------------------------
    //                                  コースラベル更新
    // ------------------------------------------------------------------------------------------------

    function updateCourseLabels(targetId = null) {
        const targets = targetId
            ? COURSES.filter(c => c.id === targetId)
            : COURSES;

        targets.forEach(({ id, displayName }) => {
            const enabled  = getStoredBool(`stopAirMove_${id}`);
            const checkbox = document.getElementById(`courseAirMoveToggle_${id}`);
            if (!checkbox) return;
            const row = checkbox.closest('.lolex-setting-row');
            if (!row) return;
            const labelEl = row.querySelector('.setting-name');
            if (!labelEl) return;

            labelEl.innerHTML = '';
            const icon = document.createElement('i');
            icon.className = 'fas fa-bolt';

            const name = document.createTextNode(displayName);

            const badge = document.createElement('span');
            badge.style.cssText = `
                margin-left:6px; padding:1px 5px; border-radius:3px;
                font-size:0.72em; font-weight:700; letter-spacing:0.04em;
                background:${enabled ? 'rgba(3,218,198,0.15)' : 'rgba(187,134,252,0.12)'};
                color:${enabled ? 'var(--secondary-color)' : 'var(--col-muted)'};
                border:1px solid ${enabled ? 'rgba(3,218,198,0.3)' : 'rgba(255,255,255,0.08)'};
            `;
            badge.textContent = enabled ? t('on') : t('off');

            labelEl.appendChild(icon);
            labelEl.appendChild(name);
            labelEl.appendChild(badge);
        });
    }

    // ------------------------------------------------------------------------------------------------
    //                                  CSS注入
    // ------------------------------------------------------------------------------------------------

    function addModernStyleSheet() {
        applyColorTheme(getPrimaryColor(), getSecondaryColor());
        if (document.getElementById('lolex-modern-style')) return;

        const style = document.createElement('style');
        style.id    = 'lolex-modern-style';
        style.textContent = `
            #tab5:checked ~ nav + section > .tab5 { display: block !important; }
            .pc-tab section > .tab5 { display: none; }

            #settings-screen .pc-tab nav ul li.tab5 label[for="tab5"] {
                background-image: url('https://tanabesan.github.io/lolbeans/file/page/icon.png') !important;
                background-size: 20px 20px !important;
                background-repeat: repeat !important;
                background-position: center !important;
                color: #fff !important;
                font-weight: bold;
                text-shadow: 1px 1px 3px #000;
                padding: 0 14px !important;
                line-height: 40px !important;
                height: 40px !important;
                display: inline-block !important;
            }
            #tab5:checked + label[for="tab5"] {
                border-bottom-color: var(--primary-color) !important;
            }

            :root {
                --col-bg:      #0d0d14;
                --col-surface: #18181f;
                --col-border:  #2c2c3a;
                --col-text:    #dcdce8;
                --col-sub:     #9090aa;
                --background-color: #0d0d14;
                --card-color:       #18181f;
                --text-color-dark:  #dcdce8;
                --input-bg:         #1c1c26;
                --border-color:     #2c2c3a;
            }

            #settings-screen .pc-tab > section > div.tab5 {
                background: var(--col-bg) !important;
                color: var(--col-text) !important;
                padding: 10px 12px 18px;
                height: auto !important;
                max-height: none !important;
                overflow-y: visible !important;
            }
            #settings-screen .pc-tab > section {
                overflow-y: auto !important;
                max-height: calc(100vh - 160px) !important;
            }

            .lolex-settings fieldset {
                border: 1px solid var(--col-border);
                border-radius: 6px;
                padding: 0;
                margin-bottom: 8px;
                background: var(--col-surface);
                overflow: hidden;
                transition: border-color 0.2s;
            }
            .lolex-settings fieldset:hover { border-color: var(--primary-color); }

            .lolex-settings legend {
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
                background: rgba(0,0,0,0.35);
                color: var(--secondary-color);
                font-size: 0.80em;
                font-weight: 700;
                letter-spacing: 0.07em;
                text-transform: uppercase;
                padding: 6px 10px;
                margin: 0;
                box-sizing: border-box;
                border-bottom: 1px solid var(--col-border);
                cursor: pointer;
                user-select: none;
                transition: background 0.15s;
            }
            .lolex-settings legend:hover { background: rgba(255,255,255,0.04); }
            .lolex-settings legend .legend-left { display: flex; align-items: center; gap: 6px; }
            .lolex-settings legend .legend-arrow {
                font-size: 0.70em; opacity: 0.6;
                transition: transform 0.25s; margin-left: 4px;
            }
            .lolex-settings fieldset.lolex-collapsed legend .legend-arrow { transform: rotate(-90deg); }

            .lolex-fs-body {
                max-height: 2000px; overflow: hidden;
                transition: max-height 0.28s ease, opacity 0.2s ease;
                opacity: 1;
            }
            .lolex-settings fieldset.lolex-collapsed .lolex-fs-body { max-height: 0 !important; opacity: 0; }

            .lolex-setting-row {
                display: flex; justify-content: space-between; align-items: center;
                padding: 7px 10px; border-bottom: 1px solid rgba(255,255,255,0.04); gap: 8px;
            }
            .lolex-setting-row:last-child { border-bottom: none; }

            .lolex-setting-row .setting-name {
                display: flex; align-items: center; gap: 7px;
                font-size: 0.86em; color: var(--col-text); font-weight: 500;
                flex-grow: 1; line-height: 1.4;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            .lolex-setting-row .setting-name i { color: var(--primary-color); font-size: 0.88em; flex-shrink: 0; }
            .lolex-course-row .setting-name { white-space: normal; font-size: 0.84em; }

            .lolex-setting-row select,
            .lolex-setting-row input[type="text"] {
                padding: 4px 8px; border: 1px solid var(--col-border); border-radius: 4px;
                background: var(--input-bg); color: var(--col-text); font-size: 0.84em;
                transition: border-color 0.2s; box-sizing: border-box; flex-shrink: 0;
            }
            .lolex-setting-row select { min-width: 120px; }
            .lolex-setting-row select:focus,
            .lolex-setting-row input[type="text"]:focus { outline: none; border-color: var(--primary-color); }

            .lolex-setting-row input[type="color"] {
                -webkit-appearance: none; appearance: none;
                width: 28px; height: 28px; padding: 0; border: none; background: none;
                cursor: pointer; flex-shrink: 0;
            }
            .lolex-setting-row input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
            .lolex-setting-row input[type="color"]::-webkit-color-swatch {
                border: 2px solid var(--col-border); border-radius: 4px;
            }

            .switch { position: relative; display: inline-block; width: 38px; height: 22px; min-width: 38px; flex-shrink: 0; }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider-toggle {
                position: absolute; cursor: pointer; inset: 0;
                background: #3a3a50; transition: background 0.25s; border-radius: 22px;
            }
            .slider-toggle:before {
                content: ""; position: absolute; width: 15px; height: 15px;
                left: 3px; bottom: 3px; background: #888;
                transition: transform 0.25s, background 0.25s; border-radius: 50%;
            }
            input:checked + .slider-toggle { background: var(--secondary-color); }
            input:checked + .slider-toggle:before { transform: translateX(16px); background: #fff; }

            .lolex-setting-row button {
                background: var(--primary-color); color: #0d0d14; border: none;
                padding: 5px 10px; border-radius: 4px; cursor: pointer;
                font-size: 0.82em; font-weight: 700;
                transition: background 0.2s, transform 0.1s; white-space: nowrap; flex-shrink: 0;
            }
            .lolex-setting-row button:hover  { background: var(--secondary-color); }
            .lolex-setting-row button:active { transform: translateY(1px); }

            .lolex-update-text { font-size: 0.83em; color: var(--col-text); line-height: 1.7; padding: 8px 10px 6px; }
            .lolex-update-text p { margin: 0 0 2px; }
            .lolex-discord-banner {
                display: flex; align-items: center; gap: 10px;
                margin: 2px 10px 10px; padding: 9px 14px;
                background: rgba(88, 101, 242, 0.15); border: 1px solid rgba(88, 101, 242, 0.45);
                border-radius: 8px; color: #c9ccff; font-size: 0.83em; font-weight: 600;
                cursor: pointer; text-decoration: none;
                transition: background 0.2s, border-color 0.2s; letter-spacing: 0.02em;
            }
            .lolex-discord-banner:hover {
                background: rgba(88, 101, 242, 0.30); border-color: rgba(88, 101, 242, 0.75); color: #fff;
            }
            .lolex-discord-banner svg { flex-shrink: 0; opacity: 0.9; }
            .lolex-version-badge {
                display: inline-block; background: rgba(255,255,255,0.05);
                border: 1px solid var(--col-border); border-radius: 3px;
                font-size: 0.78em; color: var(--col-sub); padding: 1px 7px; margin-top: 5px;
            }

            .lolex-note { font-size: 0.79em; color: var(--col-sub); padding: 5px 10px 7px; line-height: 1.6; }
            .lolex-note span { color: var(--secondary-color); font-weight: 700; }

            .lolex-btn-group { display: flex; gap: 5px; padding: 6px 10px; }
            .lolex-btn-group button {
                flex: 1; background: var(--primary-color); color: #0d0d14; border: none;
                padding: 5px 6px; border-radius: 4px; cursor: pointer;
                font-size: 0.80em; font-weight: 700; transition: background 0.2s; white-space: nowrap;
            }
            .lolex-btn-group button:hover  { background: var(--secondary-color); }
            .lolex-btn-group button.muted  { background: #23232f; color: var(--col-text); border: 1px solid var(--col-border); }
            .lolex-btn-group button.muted:hover { background: #2e2e40; }
            .lolex-btn-group button.accent { background: var(--secondary-color); color: #0d0d14; }
            .lolex-btn-group button.danger { background: #2a1212; color: #ff7070; border: 1px solid #4a2020; }
            .lolex-btn-group button.danger:hover { background: #3e1818; }

            #yt-card       { border-color: var(--primary-color); }
            #yt-float-btn  { border-color: var(--primary-color); }
            #yt-url-panel  { border-color: var(--primary-color); }
            #yt-card-volume::-webkit-slider-thumb { background: var(--secondary-color); }
            #yt-card-volume::-moz-range-thumb     { background: var(--secondary-color); }
            #yt-load-button { background: var(--secondary-color) !important; color: #0d0d14 !important; }

            #lolex-bg-modal-overlay {
                position: fixed; inset: 0; background: rgba(0,0,0,0.78); z-index: 10000; display: none;
            }
            #lolex-bg-modal {
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                width: 90%; max-width: 560px; height: 76vh; max-height: 660px;
                background: var(--col-surface); color: var(--col-text);
                border: 1px solid var(--primary-color); border-radius: 8px;
                box-shadow: 0 12px 40px rgba(0,0,0,0.65); z-index: 10001; display: none; flex-direction: column;
            }
            #lolex-bg-modal-header {
                padding: 9px 13px; border-bottom: 1px solid var(--col-border);
                display: flex; justify-content: space-between; align-items: center;
                background: rgba(0,0,0,0.25); flex-shrink: 0;
            }
            #lolex-bg-modal-header h4 {
                margin: 0; color: var(--secondary-color); font-size: 0.88em; font-weight: 700; letter-spacing: 0.05em;
            }
            #lolex-bg-modal-close {
                background: none; border: none; color: var(--col-sub); font-size: 1.3em;
                cursor: pointer; padding: 0; line-height: 1; transition: color 0.2s;
            }
            #lolex-bg-modal-close:hover { color: #fff; }
            #lolex-bg-modal-body { padding: 9px 11px; overflow-y: auto; flex-grow: 1; }
            .lolex-bg-item {
                display: flex; align-items: center; gap: 7px; padding: 5px 7px;
                border: 1px solid var(--col-border); border-radius: 4px; margin-bottom: 5px;
                background: rgba(0,0,0,0.2); transition: border-color 0.2s;
            }
            .lolex-bg-item:hover { border-color: var(--primary-color); }
            .lolex-bg-preview {
                width: 60px; height: 38px; flex-shrink: 0; border-radius: 3px; background: #000;
                display: flex; align-items: center; justify-content: center;
                font-size: 9px; color: var(--col-sub); overflow: hidden;
            }
            .lolex-bg-preview img { width: 100%; height: 100%; object-fit: cover; }
            .lolex-bg-url { flex-grow: 1; word-break: break-all; font-size: 0.74em; color: var(--col-sub); max-height: 34px; overflow: hidden; }
            .lolex-bg-delete {
                background: rgba(180,0,30,0.65); color: #fff; border: none; border-radius: 50%;
                width: 20px; height: 20px; flex-shrink: 0; cursor: pointer; font-size: 0.82em;
                line-height: 20px; text-align: center; transition: background 0.2s;
            }
            .lolex-bg-delete:hover { background: #b0001e; }
            #lolex-bg-modal-footer {
                padding: 9px 11px; border-top: 1px solid var(--col-border); background: rgba(0,0,0,0.2); flex-shrink: 0;
            }
            #lolex-bg-add-area { display: flex; gap: 7px; margin-bottom: 7px; }
            #lolex-bg-new-url {
                flex-grow: 1; padding: 5px 9px; border: 1px solid var(--col-border);
                border-radius: 4px; background: var(--input-bg); color: var(--col-text); font-size: 0.82em;
            }
            #lolex-bg-new-url:focus { outline: none; border-color: var(--primary-color); }
            #lolex-bg-add-button, #lolex-bg-save-button {
                background: var(--primary-color); color: #0d0d14; border: none;
                padding: 5px 11px; border-radius: 4px; cursor: pointer; font-size: 0.82em; font-weight: 700; transition: background 0.2s;
            }
            #lolex-bg-add-button:hover, #lolex-bg-save-button:hover { background: var(--secondary-color); }
            #lolex-bg-save-button { width: 100%; margin-top: 2px; }

            @media (max-width: 768px) {
                .lolex-setting-row { flex-wrap: wrap; gap: 4px; }
                .lolex-setting-row .setting-name { flex-basis: 100%; white-space: normal; }
                .lolex-setting-row input[type="text"],
                .lolex-setting-row button,
                .lolex-setting-row select { width: 100%; }
                .lolex-setting-row .switch { margin-left: auto; }
                .lolex-setting-row input[type="color"] { align-self: flex-end; }
            }

            .tab5 h3, .tab5 .setting-section, .tab5 .youtube-container,
            .tab5 .youtube-input-group, .tab5 .setting-row { display: none !important; }
            .tab5 .lolex-settings { display: block !important; }
        `;
        document.head.appendChild(style);
    }

    function addYouTubeStyleSheet() {
        if (document.getElementById('lolex-yt-style')) return;
        const style = document.createElement('style');
        style.id    = 'lolex-yt-style';
        style.textContent = `
            #yt-hidden-player {
                position: fixed; width: 1px; height: 1px;
                bottom: 0; left: 0; opacity: 0; pointer-events: none; z-index: -1;
            }
            #yt-card {
                position: fixed; bottom: -240px; right: 18px;
                width: 200px; height: 200px; border-radius: 12px; overflow: hidden;
                z-index: 9999; background: #0d0d14 center/cover no-repeat;
                border: 1.5px solid var(--primary-color, #BB86FC);
                box-shadow: 0 8px 32px rgba(0,0,0,0.7); cursor: default;
                transition: bottom 0.38s cubic-bezier(.4,0,.2,1), box-shadow 0.2s;
                user-select: none;
            }
            #yt-card.yt-card-visible { bottom: 18px; }
            #yt-card:hover { box-shadow: 0 12px 40px rgba(0,0,0,0.85); }

            #yt-card-overlay {
                position: absolute; inset: 0;
                background: linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(5,5,12,0.55) 55%, rgba(5,5,12,0.92) 100%);
                display: flex; flex-direction: column; justify-content: flex-end; padding: 0 0 6px 0;
            }

            #yt-eq-row {
                display: flex; align-items: flex-end; justify-content: center;
                gap: 3px; height: 56px; padding: 0 8px; margin-bottom: 4px; overflow: hidden;
            }
            .yt-eq-col {
                display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
                gap: 2px; height: 100%; width: 10px; flex-shrink: 0; position: relative;
            }
            .yt-eq-seg { width: 100%; height: 5px; border-radius: 1px; flex-shrink: 0; opacity: 0; transition: opacity 0.1s; }
            .yt-eq-seg[data-level="0"] { background: var(--secondary-color, #03DAC6); }
            .yt-eq-seg[data-level="1"] { background: var(--secondary-color, #03DAC6); }
            .yt-eq-seg[data-level="2"] { background: var(--secondary-color, #03DAC6); }
            .yt-eq-seg[data-level="3"] { background: color-mix(in srgb, var(--secondary-color, #03DAC6) 60%, var(--primary-color, #BB86FC) 40%); }
            .yt-eq-seg[data-level="4"] { background: color-mix(in srgb, var(--secondary-color, #03DAC6) 30%, var(--primary-color, #BB86FC) 70%); }
            .yt-eq-seg[data-level="5"] { background: var(--primary-color, #BB86FC); }
            .yt-eq-seg[data-level="6"] { background: var(--primary-color, #BB86FC); }
            @supports not (color: color-mix(in srgb, red, blue)) {
                .yt-eq-seg[data-level="3"] { background: #5af0d0; }
                .yt-eq-seg[data-level="4"] { background: #8b7fe8; }
            }

            #yt-card-title {
                font-size: 0.72em; color: rgba(255,255,255,0.92);
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                padding: 0 10px; margin-bottom: 5px; letter-spacing: 0.02em;
                text-shadow: 0 1px 4px rgba(0,0,0,0.8);
            }
            #yt-card-controls {
                display: flex; align-items: center; justify-content: space-between; padding: 0 8px; gap: 2px;
            }
            .yt-card-btn {
                background: none; border: none; color: rgba(255,255,255,0.82); font-size: 14px;
                cursor: pointer; padding: 3px 5px; border-radius: 4px; flex-shrink: 0; line-height: 1;
                transition: color 0.12s, background 0.12s;
            }
            .yt-card-btn:hover { color: #fff; background: rgba(255,255,255,0.1); }
            #yt-card-play { font-size: 18px; padding: 3px 6px; }

            #yt-card-volume {
                -webkit-appearance: none; appearance: none; width: 52px; height: 3px;
                background: rgba(255,255,255,0.22); border-radius: 2px; outline: none; cursor: pointer; flex-shrink: 0;
            }
            #yt-card-volume::-webkit-slider-thumb {
                -webkit-appearance: none; width: 10px; height: 10px;
                background: var(--secondary-color, #03DAC6); border-radius: 50%;
            }
            #yt-card-volume::-moz-range-thumb {
                width: 10px; height: 10px; background: var(--secondary-color, #03DAC6); border-radius: 50%; border: none;
            }

            #yt-url-panel {
                position: fixed; right: 18px; bottom: 238px; width: 200px;
                background: rgba(8,8,16,0.96); border: 1.5px solid var(--primary-color, #BB86FC);
                border-radius: 10px; padding: 8px; display: flex; flex-direction: column; gap: 5px;
                z-index: 10001; box-shadow: 0 -2px 16px rgba(0,0,0,0.5); transition: opacity 0.2s, transform 0.2s;
            }
            #yt-url-panel.yt-url-hidden { opacity: 0; pointer-events: none; transform: translateY(8px); }
            #yt-url-panel input {
                width: 100%; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.14);
                border-radius: 4px; color: #fff; font-size: 0.78em; padding: 5px 7px; outline: none; box-sizing: border-box;
            }
            #yt-url-panel input:focus { border-color: var(--primary-color, #BB86FC); }
            #yt-url-panel button {
                width: 100%; background: var(--secondary-color, #03DAC6); color: #08080f; border: none;
                border-radius: 4px; padding: 5px; font-size: 0.78em; font-weight: 700; cursor: pointer; transition: opacity 0.15s;
            }
            #yt-url-panel button:hover { opacity: 0.82; }

            #yt-mobile-toggle-btn { display: none !important; }

            #yt-float-btn {
                position: fixed; right: 18px; bottom: 228px;
                width: 36px; height: 36px; border-radius: 50%;
                border: 1.5px solid var(--primary-color, #BB86FC);
                background: rgba(10,10,18,0.85); color: rgba(255,255,255,0.9); font-size: 16px;
                cursor: pointer; z-index: 9997; display: flex; align-items: center; justify-content: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.5);
                transition: background 0.2s, transform 0.1s, opacity 0.2s;
                backdrop-filter: blur(4px); line-height: 1; padding: 0; opacity: 1;
            }
            #yt-float-btn.lolex-float-faint { opacity: 0.18; }
            #yt-float-btn.lolex-float-faint:hover { opacity: 0.85; }
            #yt-float-btn.lolex-float-hidden { display: none !important; }
            #yt-float-btn:hover { background: var(--primary-color, #BB86FC); color: #000; transform: scale(1.1); }

            @media (max-width: 600px) {
                #yt-float-btn { right: 10px; bottom: 188px; }
                #yt-card { width: 160px; height: 160px; right: 10px; }
                #yt-card.yt-card-visible { bottom: 10px; }
                #yt-url-panel { width: 160px; right: 10px; bottom: 180px; }
            }
        `;
        document.head.appendChild(style);
    }

    // ------------------------------------------------------------------------------------------------
    //                                  YouTube プレイヤーUI
    // ------------------------------------------------------------------------------------------------

    function initYouTubePlayerUI() {
        if ($('yt-card')) return;
        addYouTubeStyleSheet();
        addModernStyleSheet();

        const isVisible = getStoredBool(STORAGE.BAR_VISIBLE, true);
        const volume    = parseInt(localStorage.getItem(STORAGE.VOLUME) ?? '80', 10);

        const hiddenDiv = el('div', { id: 'yt-hidden-player', innerHTML: '<div id="yt-player"></div>' });
        document.body.appendChild(hiddenDiv);

        const card = el('div', { id: 'yt-card' });
        if (isVisible) card.classList.add('yt-card-visible');
        document.body.appendChild(card);

        const overlay = el('div', { id: 'yt-card-overlay' });
        card.appendChild(overlay);

        const eqRow = el('div', { id: 'yt-eq-row' });
        for (let ci = 0; ci < EQ_COLS; ci++) {
            const col = el('div', { className: 'yt-eq-col' });
            for (let si = 0; si < EQ_SEGS; si++) {
                const seg = el('div', { className: 'yt-eq-seg' }, { opacity: '0' });
                seg.dataset.level = String(si);
                col.appendChild(seg);
            }
            eqRow.appendChild(col);
        }
        overlay.appendChild(eqRow);

        const titleEl  = el('div', { id: 'yt-card-title', textContent: t('ytNoTrack') });
        const controls = el('div', { id: 'yt-card-controls' });
        append(overlay, titleEl, controls);

        append(controls,
            el('button', { className: 'yt-card-btn', id: 'yt-bar-prev',       textContent: '⏮', title: 'Previous'     }),
            el('button', { className: 'yt-card-btn', id: 'yt-card-play',      textContent: '▶', title: 'Play / Pause' }),
            el('button', { className: 'yt-card-btn', id: 'yt-bar-next',       textContent: '⏭', title: 'Next'         }),
            el('input',  { type: 'range', id: 'yt-card-volume', min: '0', max: '100', value: String(volume), title: t('ytVolume') }),
            el('button', { className: 'yt-card-btn', id: 'yt-bar-url-toggle', textContent: '🔗', title: 'Set URL'      })
        );

        const urlPanel = el('div', { id: 'yt-url-panel' });
        urlPanel.classList.add('yt-url-hidden');
        append(urlPanel,
            el('input',  { type: 'text', id: 'yt-video-id-input', placeholder: t('ytInputPlaceholder') }),
            el('button', { id: 'yt-load-button', textContent: t('ytLoadButton') })
        );
        document.body.appendChild(urlPanel);

        const floatBtn = el('button', {
            id: 'yt-float-btn',
            title: 'Music Player (Ctrl+M)',
            textContent: '🎵',
        });
        document.body.appendChild(floatBtn);
        on(floatBtn, { click: toggleYouTubeVisibility });
        applyFloatBtnMode(localStorage.getItem(STORAGE.FLOAT_BTN) || 'show');

        updateUrlInput();
        bindYouTubeEventListeners();

        // YT IFrame API 初期化
        unsafeWindow.onYouTubeIframeAPIReady = function () {
            isApiReady = true;
            player = new unsafeWindow.YT.Player('yt-player', {
                height: '1',
                width: '1',
                videoId: currentVideoId || '',
                playerVars: {
                    autoplay: 1, controls: 0, disablekb: 1,
                    fs: 0, iv_load_policy: 3, modestbranding: 1, rel: 0,
                },
                events: {
                    onReady: onPlayerReady,
                    onStateChange: onPlayerStateChange,
                },
            });
        };

        if (!unsafeWindow.YT) {
            document.head.appendChild(el('script', { src: 'https://www.youtube.com/iframe_api' }));
        } else if (unsafeWindow.YT.Player) {
            unsafeWindow.onYouTubeIframeAPIReady();
        }
    }

    function updateUrlInput() {
        const input = $('yt-video-id-input');
        if (!input) return;
        const pl = localStorage.getItem(STORAGE.PLAYLIST);
        const vi = localStorage.getItem(STORAGE.VIDEO);
        input.value = pl
            ? `https://www.youtube.com/playlist?list=${pl}`
            : vi
            ? `https://www.youtube.com/watch?v=${vi}`
            : '';
    }

    function updateYouTubeUIText() {
        const urlInput  = $('yt-video-id-input');
        const loadBtn   = $('yt-load-button');
        const volSlider = $('yt-card-volume');
        const titleEl   = $('yt-card-title');
        if (urlInput)  urlInput.placeholder = t('ytInputPlaceholder');
        if (loadBtn)   loadBtn.textContent  = t('ytLoadButton');
        if (volSlider) volSlider.title      = t('ytVolume');
        if (titleEl && titleEl.textContent === '') titleEl.textContent = t('ytNoTrack');
    }

    function bindYouTubeEventListeners() {
        const hideUrl = () => $('yt-url-panel')?.classList.add('yt-url-hidden');

        on($('yt-card-play'), { click: () => {
            if (!player) return;
            try {
                player.getPlayerState() === unsafeWindow.YT.PlayerState.PLAYING
                    ? player.pauseVideo() : player.playVideo();
            } catch (_) {}
        }});
        on($('yt-bar-prev'), { click: () => { try { player?.previousVideo?.(); } catch (_) {} }});
        on($('yt-bar-next'), { click: () => { try { player?.nextVideo?.();     } catch (_) {} }});
        on($('yt-card-volume'), { input: e => {
            const vol = parseInt(e.target.value, 10);
            localStorage.setItem(STORAGE.VOLUME, vol);
            try { player?.setVolume?.(vol); } catch (_) {}
        }});

        // ★ 修正: yt-card-wrapper → yt-card に変更
        on($('yt-bar-url-toggle'), { click: () => {
            const panel = $('yt-url-panel');
            if (!panel) return;
            const card = $('yt-card');
            if (card && !card.classList.contains('yt-card-visible')) {
                card.classList.add('yt-card-visible');
                setStoredBool(STORAGE.BAR_VISIBLE, true);
            }
            const isNowHidden = panel.classList.toggle('yt-url-hidden');
            if (!isNowHidden) {
                setTimeout(() => $('yt-video-id-input')?.focus(), 50);
            }
        }});

        on($('yt-load-button'), { click: () => { loadYouTube($('yt-video-id-input')?.value || ''); hideUrl(); }});
        on($('yt-video-id-input'), { keydown: e => {
            if (e.key === 'Enter')  { loadYouTube(e.target.value); hideUrl(); }
            if (e.key === 'Escape') { hideUrl(); }
            e.stopPropagation();
        }});
    }

    // ------------------------------------------------------------------------------------------------
    //                                  背景モーダル
    // ------------------------------------------------------------------------------------------------

    function createBackgroundModal() {
        if (document.getElementById('lolex-bg-modal')) return;

        const overlay  = document.createElement('div');
        overlay.id     = 'lolex-bg-modal-overlay';
        document.body.appendChild(overlay);

        const modal    = document.createElement('div');
        modal.id       = 'lolex-bg-modal';
        modal.innerHTML = `
            <div id="lolex-bg-modal-header">
                <h4 id="lolex-bg-modal-title"></h4>
                <button id="lolex-bg-modal-close">&times;</button>
            </div>
            <div id="lolex-bg-modal-body"></div>
            <div id="lolex-bg-modal-footer">
                <div id="lolex-bg-add-area">
                    <input type="text" id="lolex-bg-new-url">
                    <button id="lolex-bg-add-button"></button>
                </div>
                <button id="lolex-bg-save-button"></button>
            </div>
        `;
        document.body.appendChild(modal);
        bindBackgroundModalEvents();
    }

    function renderBackgroundList() {
        const body = $('lolex-bg-modal-body');
        if (!body) return;

        const fragment = document.createDocumentFragment();
        const list     = getBackgroundList();

        list.forEach((url) => {
            const item = document.createElement('div');
            item.className   = 'lolex-bg-item';
            item.dataset.url = url;

            const preview  = document.createElement('div');
            preview.className = 'lolex-bg-preview';
            const img      = document.createElement('img');
            img.src        = url;
            img.alt        = t('previewError');
            const errSpan  = document.createElement('span');
            errSpan.style.display = 'none';
            errSpan.textContent   = t('previewError');
            img.addEventListener('error', () => {
                img.style.display     = 'none';
                errSpan.style.display = 'block';
            });
            preview.appendChild(img);
            preview.appendChild(errSpan);

            const urlSpan  = document.createElement('span');
            urlSpan.className   = 'lolex-bg-url';
            urlSpan.textContent = url;

            const delBtn   = document.createElement('button');
            delBtn.className    = 'lolex-bg-delete';
            delBtn.textContent  = '×';
            delBtn.title        = 'Delete';
            delBtn.addEventListener('click', () => { item.remove(); });

            item.appendChild(preview);
            item.appendChild(urlSpan);
            item.appendChild(delBtn);
            fragment.appendChild(item);
        });

        body.innerHTML = '';
        body.appendChild(fragment);
    }

    function bindBackgroundModalEvents() {
        const addItem = () => {
            const inp = $('lolex-bg-new-url');
            const url = inp?.value.trim();
            if (!url) return;
            const body     = $('lolex-bg-modal-body');
            const existing = Array.from(body.querySelectorAll('.lolex-bg-item')).map(e => e.dataset.url);
            if (!existing.includes(url)) {
                existing.push(url);
                localStorage.setItem(STORAGE.BG_LIST, existing.join('\n'));
                renderBackgroundList();
                body.scrollTop = body.scrollHeight;
            }
            inp.value = '';
        };
        on($('lolex-bg-modal-overlay'), { click: hideBackgroundModal });
        on($('lolex-bg-modal-close'),   { click: hideBackgroundModal });
        on($('lolex-bg-save-button'),   { click: () => { saveBackgroundListFromModal(); hideBackgroundModal(); }});
        on($('lolex-bg-add-button'),    { click: addItem });
        on($('lolex-bg-new-url'), { keydown: e => {
            if (e.key === 'Enter') { addItem(); e.preventDefault(); }
            e.stopPropagation();
        }});
    }

    function resetColors() {
        localStorage.removeItem(STORAGE.PRIMARY_COLOR);
        localStorage.removeItem(STORAGE.SECONDARY_COLOR);
        const p = DEFAULT.PRIMARY;
        const s = DEFAULT.SECONDARY;
        const pp = $('primary-color-picker');
        const sp = $('secondary-color-picker');
        if (pp) pp.value = p;
        if (sp) sp.value = s;
        applyColorTheme(p, s);
    }

    function applyFloatBtnMode(mode) {
        const btn = $('yt-float-btn');
        if (!btn) return;
        btn.classList.remove('lolex-float-faint', 'lolex-float-hidden');
        if (mode === 'faint') btn.classList.add('lolex-float-faint');
        if (mode === 'hide')  btn.classList.add('lolex-float-hidden');
    }

    function toggleYouTubeVisibility() {
        const card = $('yt-card');
        if (!card) return;
        const isVisible = card.classList.toggle('yt-card-visible');
        setStoredBool(STORAGE.BAR_VISIBLE, isVisible);
    }

    function showBackgroundModal() {
        if (!$('lolex-bg-modal')) createBackgroundModal();

        const title    = $('lolex-bg-modal-title');
        const newUrl   = $('lolex-bg-new-url');
        const addBtn   = $('lolex-bg-add-button');
        const saveBtn  = $('lolex-bg-save-button');
        const closeBtn = $('lolex-bg-modal-close');
        if (title)    title.textContent    = t('modalTitle');
        if (newUrl)   newUrl.placeholder   = t('addUrl');
        if (addBtn)   addBtn.textContent   = t('add');
        if (saveBtn)  saveBtn.textContent  = t('save');
        if (closeBtn) closeBtn.title       = t('close');

        renderBackgroundList();
        const overlay = $('lolex-bg-modal-overlay');
        const modal   = $('lolex-bg-modal');
        if (overlay) overlay.style.display = 'block';
        if (modal)   modal.style.display   = 'flex';
    }

    function hideBackgroundModal() {
        const overlay = $('lolex-bg-modal-overlay');
        const modal   = $('lolex-bg-modal');
        if (overlay) overlay.style.display = 'none';
        if (modal)   modal.style.display   = 'none';
    }

    function saveBackgroundListFromModal() {
        const body = $('lolex-bg-modal-body');
        if (!body) return;
        const urls = Array.from(body.querySelectorAll('.lolex-bg-item')).map(el => el.dataset.url);
        localStorage.setItem(STORAGE.BG_LIST, urls.join('\n'));
        applyCustomBackground(true);
    }

    // ------------------------------------------------------------------------------------------------
    //                                  設定画面 構築
    // ------------------------------------------------------------------------------------------------

    function makeCollapsibleFieldset(fs, sectionKey) {
        const storageKey = `lolex-collapsed-${sectionKey}`;
        if (sectionKey === 'update') localStorage.removeItem(storageKey);
        const isCollapsed = getStoredBool(storageKey, false);

        const legend = fs.querySelector('legend');
        if (!legend) return;

        const leftSpan = document.createElement('span');
        leftSpan.className = 'legend-left';
        while (legend.firstChild) leftSpan.appendChild(legend.firstChild);

        const arrow = document.createElement('span');
        arrow.className   = 'legend-arrow';
        arrow.textContent = '▼';

        legend.appendChild(leftSpan);
        legend.appendChild(arrow);

        const body = document.createElement('div');
        body.className = 'lolex-fs-body';
        const children = Array.from(fs.children).filter(e => e.tagName !== 'LEGEND');
        children.forEach(e => body.appendChild(e));
        fs.appendChild(body);

        if (isCollapsed) fs.classList.add('lolex-collapsed');

        legend.addEventListener('click', () => {
            const collapsed = fs.classList.toggle('lolex-collapsed');
            setStoredBool(storageKey, collapsed);
        });
    }

    function makeToggleRow(inputId, labelHtml, checked) {
        const row   = document.createElement('div');
        row.className = 'lolex-setting-row';

        const label = document.createElement('label');
        label.htmlFor   = inputId;
        label.className = 'setting-name';
        label.innerHTML = labelHtml;

        const sw    = document.createElement('label');
        sw.className = 'switch';
        const input = document.createElement('input');
        input.type  = 'checkbox';
        input.id    = inputId;
        if (checked) input.checked = true;
        const span  = document.createElement('span');
        span.className = 'slider-toggle';
        sw.appendChild(input);
        sw.appendChild(span);

        row.appendChild(label);
        row.appendChild(sw);
        return row;
    }

    function createSettings() {
        const tabContainer = document.querySelector('#settings-screen .pc-tab');
        if (!tabContainer) return;

        addModernStyleSheet();

        let tabInput = tabContainer.querySelector('#tab5');
        if (!tabInput) {
            tabInput      = document.createElement('input');
            tabInput.id   = 'tab5';
            tabInput.type = 'radio';
            tabInput.name = 'pct';
            tabContainer.insertBefore(tabInput, tabContainer.querySelector('nav'));
        }

        let li = tabContainer.querySelector('nav ul li.tab5');
        if (!li) {
            li           = document.createElement('li');
            li.className = 'tab5';
            tabContainer.querySelector('nav ul').appendChild(li);
        }
        li.innerHTML = '';
        const tabLabel   = document.createElement('label');
        tabLabel.htmlFor = 'tab5';
        tabLabel.textContent = t('tabTitle');
        li.appendChild(tabLabel);

        const section = tabContainer.querySelector('section');
        let panel = section.querySelector('div.tab5');
        if (!panel) {
            panel           = document.createElement('div');
            panel.className = 'tab5';
            section.appendChild(panel);
        }
        panel.innerHTML = '';

        const container     = document.createElement('div');
        container.id        = 'lolex-settings';
        container.className = 'lolex-settings';

        // ── 0. 最新アップデート情報 ──
        const updateFs = document.createElement('fieldset');
        updateFs.innerHTML = `
            <legend><i class="fas fa-info-circle"></i> ${t('latestUpdates')}</legend>
            <a class="lolex-discord-banner" href="https://discord.gg/Cpu8vFDmH3" target="_blank" rel="noopener noreferrer">
                <svg width="22" height="16" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.317 1.492a19.825 19.825 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.295 18.295 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 1.492a.07.07 0 0 0-.032.027C.533 6.093-.32 10.56.099 14.971a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 12.278c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" fill="#7289da"/>
                </svg>
                ${t('discordInvite')}
            </a>
            <div class="lolex-update-text">
                <p>${t('updateInfo')}</p>
                <span class="lolex-version-badge">v${SCRIPT_VERSION}</span>
            </div>
        `;
        container.appendChild(updateFs);

        // ── 1. 言語設定 ──
        const langFs     = document.createElement('fieldset');
        const currentLang = getLang();
        langFs.innerHTML = `
            <legend><i class="fas fa-language"></i> ${t('language')}</legend>
            <div class="lolex-setting-row">
                <label for="language-switcher" class="setting-name">
                    <i class="fas fa-globe"></i>${t('language')}
                </label>
                <select id="language-switcher">
                    <option value="ja" ${currentLang === 'ja' ? 'selected' : ''}>日本語</option>
                    <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English</option>
                </select>
            </div>
        `;
        container.appendChild(langFs);

        // ── 2. Air Move 全体制御 ──
        const autoSwitchEnabled = getStoredBool(STORAGE.AIR_MOVE_AUTO);
        const gameFs = document.createElement('fieldset');
        gameFs.innerHTML = `
            <legend><i class="fas fa-cogs"></i> ${t('airMoveAutoSwitch')}</legend>
            <div class="lolex-note">
                <span>[${t('off')}]</span> ${t('autoSwitchOff')}<br>
                <span>[${t('on')}]</span> ${t('autoSwitchOn')}
            </div>
        `;
        const autoRow = makeToggleRow(
            'airMoveAutoSwitchToggle',
            `<i class="fas fa-exchange-alt"></i>${t('enableAutoSwitch')}`,
            autoSwitchEnabled
        );
        gameFs.insertBefore(autoRow, gameFs.querySelector('.lolex-note'));
        container.appendChild(gameFs);

        // ── 3. コース別Air Move ──
        const courseFs = document.createElement('fieldset');
        const courseLegend = document.createElement('legend');
        courseLegend.innerHTML = `<i class="fas fa-map-signs"></i> ${t('courseSettings')}`;
        courseFs.appendChild(courseLegend);

        COURSES.forEach(({ id, displayName }) => {
            const enabled = getStoredBool(`stopAirMove_${id}`);
            const row     = makeToggleRow(
                `courseAirMoveToggle_${id}`,
                `<i class="fas fa-bolt"></i>${displayName}`,
                enabled
            );
            row.classList.add('lolex-course-row');
            row.querySelector('input').dataset.courseId = id;
            courseFs.appendChild(row);
        });
        container.appendChild(courseFs);
        updateCourseLabels();

        // ── 4. 視覚カスタマイズ ──
        const visualFs = document.createElement('fieldset');
        visualFs.innerHTML = `
            <legend><i class="fas fa-paint-brush"></i> ${t('visualCustomization')}</legend>
            <div class="lolex-setting-row">
                <label for="primary-color-picker" class="setting-name">
                    <i class="fas fa-circle" style="color:var(--primary-color);"></i>${t('primaryColor')}
                </label>
                <input type="color" id="primary-color-picker" value="${getPrimaryColor()}">
            </div>
            <div class="lolex-setting-row">
                <label for="secondary-color-picker" class="setting-name">
                    <i class="fas fa-circle" style="color:var(--secondary-color);"></i>${t('secondaryColor')}
                </label>
                <input type="color" id="secondary-color-picker" value="${getSecondaryColor()}">
            </div>
            <div class="lolex-setting-row" style="border-bottom:none;">
                <span class="setting-name"><i class="fas fa-image"></i>${t('backgroundColor')}</span>
            </div>
            <div class="lolex-btn-group">
                <button id="background-shuffle-button" class="accent">
                    <i class="fas fa-sync-alt"></i> ${t('shuffleBackground')}
                </button>
                <button id="lolex-bg-edit-list-button">${t('editList')}</button>
                <button id="background-reset-to-default-button" class="muted">${t('resetToDefault')}</button>
            </div>
            <div class="lolex-note">${t('backgroundNote')}</div>
            <div class="lolex-btn-group" style="border-top:1px solid var(--col-border); padding-top:8px; margin-top:4px;">
                <button id="color-reset-button" class="danger">
                    <i class="fas fa-undo"></i> ${t('resetColors')}
                </button>
            </div>
        `;
        container.appendChild(visualFs);

        // ── 5. YouTube設定 ──
        const ytFs = document.createElement('fieldset');
        const ytLegend = document.createElement('legend');
        ytLegend.innerHTML = `<i class="fab fa-youtube"></i> ${t('ytSettings')}`;
        ytFs.appendChild(ytLegend);

        // ホットキー設定行
        const hotkeyRow = document.createElement('div');
        hotkeyRow.className = 'lolex-setting-row';
        const hotkeyLabel_el = document.createElement('label');
        hotkeyLabel_el.className = 'setting-name';
        hotkeyLabel_el.innerHTML = `<i class="fas fa-keyboard"></i>${t('ytHotkeyLabel')}`;

        const hotkeyBtn = document.createElement('button');
        hotkeyBtn.id            = 'yt-hotkey-btn';
        hotkeyBtn.textContent   = hotkeyLabel();
        hotkeyBtn.style.cssText = 'min-width:90px; font-size:0.80em;';

        let _waitingHotkey = false;
        on(hotkeyBtn, { click: () => {
            if (_waitingHotkey) return;
            _waitingHotkey = true;
            hotkeyBtn.textContent      = t('ytHotkeyHint');
            hotkeyBtn.style.background = 'var(--secondary-color)';
            hotkeyBtn.style.color      = '#000';

            const onKey = (e) => {
                if (e.key === 'Escape') {
                    hotkeyBtn.textContent      = hotkeyLabel();
                    hotkeyBtn.style.background = '';
                    hotkeyBtn.style.color      = '';
                    _waitingHotkey = false;
                    document.removeEventListener('keydown', onKey, { capture: true });
                    return;
                }
                if (['Control','Alt','Shift','Meta'].includes(e.key)) return;
                e.preventDefault();
                e.stopImmediatePropagation();
                const cfg = { key: e.key, ctrlKey: e.ctrlKey, altKey: e.altKey, shiftKey: e.shiftKey };
                localStorage.setItem(STORAGE.YT_HOTKEY, JSON.stringify(cfg));
                applyHotkey();
                hotkeyBtn.textContent      = hotkeyLabel();
                hotkeyBtn.style.background = '';
                hotkeyBtn.style.color      = '';
                _waitingHotkey = false;
                document.removeEventListener('keydown', onKey, { capture: true });
            };
            document.addEventListener('keydown', onKey, { capture: true });
        }});

        hotkeyRow.appendChild(hotkeyLabel_el);
        hotkeyRow.appendChild(hotkeyBtn);
        ytFs.appendChild(hotkeyRow);

        // フロートボタン表示設定
        const floatRow = document.createElement('div');
        floatRow.className = 'lolex-setting-row';
        const floatLabel = document.createElement('label');
        floatLabel.className = 'setting-name';
        floatLabel.innerHTML = `<i class="fas fa-circle"></i>${t('ytFloatBtn')}`;

        const floatModes  = ['show', 'faint', 'hide'];
        const floatLabels = [t('ytFloatBtnShow'), t('ytFloatBtnFaint'), t('ytFloatBtnHide')];
        const curMode     = localStorage.getItem(STORAGE.FLOAT_BTN) || 'show';

        const floatGroup = document.createElement('div');
        floatGroup.style.cssText = 'display:flex; gap:4px;';
        floatModes.forEach((mode, i) => {
            const btn = document.createElement('button');
            btn.textContent   = floatLabels[i];
            btn.style.cssText = 'font-size:0.78em; padding:2px 8px;';
            if (mode === curMode) btn.style.fontWeight = '700';
            on(btn, { click: () => {
                localStorage.setItem(STORAGE.FLOAT_BTN, mode);
                applyFloatBtnMode(mode);
                floatGroup.querySelectorAll('button').forEach((b, j) => {
                    b.style.fontWeight = j === i ? '700' : '400';
                });
            }});
            floatGroup.appendChild(btn);
        });

        floatRow.appendChild(floatLabel);
        floatRow.appendChild(floatGroup);
        ytFs.appendChild(floatRow);

        const loopRow    = makeToggleRow('ytLoopToggle',    `<i class="fas fa-sync-alt"></i>${t('loop')}`,  getStoredBool(STORAGE.LOOP));
        const shuffleRow = makeToggleRow('ytShuffleToggle', `<i class="fas fa-random"></i>${t('shuffle')}`, getStoredBool(STORAGE.SHUFFLE));
        ytFs.appendChild(loopRow);
        ytFs.appendChild(shuffleRow);
        const ytNote = document.createElement('div');
        ytNote.className   = 'lolex-note';
        ytNote.textContent = t('ytNote');
        ytFs.appendChild(ytNote);
        container.appendChild(ytFs);

        [
            [updateFs, 'update'],
            [langFs,   'lang'],
            [gameFs,   'airmove'],
            [courseFs, 'course'],
            [visualFs, 'visual'],
            [ytFs,     'yt'],
        ].forEach(([fs, key]) => makeCollapsibleFieldset(fs, key));

        panel.appendChild(container);
        bindSettingsEvents();
    }

    function bindSettingsEvents() {
        $('language-switcher')?.addEventListener('change', (e) => {
            localStorage.setItem(STORAGE.LANGUAGE, e.target.value);
            invalidateLangCache();
            createSettings();
            updateYouTubeUIText();
        });

        $('airMoveAutoSwitchToggle')?.addEventListener('change', (e) => {
            setStoredBool(STORAGE.AIR_MOVE_AUTO, e.target.checked);
        });

        COURSES.forEach(({ id }) => {
            const cb = document.getElementById(`courseAirMoveToggle_${id}`);
            if (cb && !cb.dataset.lolexBound) {
                cb.addEventListener('change', (e) => {
                    setStoredBool(`stopAirMove_${id}`, e.target.checked);
                    updateCourseLabels(id);
                });
                cb.dataset.lolexBound = 'true';
            }
        });

        $('lolex-bg-edit-list-button')?.addEventListener('click', showBackgroundModal);

        $('background-reset-to-default-button')?.addEventListener('click', () => {
            if (!confirm(t('resetListConfirm'))) return;
            localStorage.setItem(STORAGE.BG_LIST, DEFAULT.BG_URLS.join('\n'));
            applyCustomBackground(true);
        });

        $('background-shuffle-button')?.addEventListener('click', () => {
            applyCustomBackground(true);
        });

        $('primary-color-picker')?.addEventListener('input', (e) => {
            localStorage.setItem(STORAGE.PRIMARY_COLOR, e.target.value);
            applyColorTheme(e.target.value, getSecondaryColor());
            updateCourseLabels();
        });

        $('secondary-color-picker')?.addEventListener('input', (e) => {
            localStorage.setItem(STORAGE.SECONDARY_COLOR, e.target.value);
            applyColorTheme(getPrimaryColor(), e.target.value);
            updateCourseLabels();
        });

        $('color-reset-button')?.addEventListener('click', resetColors);

        $('ytLoopToggle')?.addEventListener('change', (e) => {
            setStoredBool(STORAGE.LOOP, e.target.checked);
            try { if (player && typeof player.setLoop === 'function') player.setLoop(e.target.checked); } catch (_) {}
        });

        $('ytShuffleToggle')?.addEventListener('change', (e) => {
            setStoredBool(STORAGE.SHUFFLE, e.target.checked);
        });
    }

    // ------------------------------------------------------------------------------------------------
    //                                  コンソールフック（マップ検知）
    // ------------------------------------------------------------------------------------------------

    function hookConsoleLog() {
        const originalLog = unsafeWindow.console.log;
        if (originalLog._lolexHooked) return;

        unsafeWindow.console.log = function (...args) {
            try {
                if (args[0] === 'Loading map' && typeof args[1] === 'string') {
                    handleMapLoad(String(args[1]));
                }
            } catch (_) {}
            return originalLog.apply(unsafeWindow.console, args);
        };
        unsafeWindow.console.log._lolexHooked = true;
    }

    // ★ 次ラウンドラベルをグローバルに保持（DOM出現前でも対応できるよう）
    let _pendingNextRoundLabel = null;
    let _nextRoundObserver     = null;

    function handleMapLoad(mapName) {
        if (getStoredBool(STORAGE.AIR_MOVE_AUTO)) {
            const course = COURSES.find(c => mapName.toLowerCase().includes(c.keyword.toLowerCase()));
            const id     = course ? course.id : mapName.toLowerCase().replace(/\s+/g, '-');
            clickAirMoveRadio(getStoredBool(`stopAirMove_${id}`));
        }

        const course      = COURSES.find(c => mapName.toLowerCase().includes(c.keyword.toLowerCase()));
        const displayText = course ? course.message : mapName;
        const label       = `${t('nextRound')} ${displayText}`;

        // ラベルを保持しておく
        _pendingNextRoundLabel = label;

        // 既にDOMに出ていれば即挿入、なければMutationObserverで監視
        _tryInjectNextRoundLabel();
        _startNextRoundObserver();
    }

    /**
     * end-match-header / death-screen が既にDOMにあれば即座にラベルを挿入する
     */
    function _tryInjectNextRoundLabel() {
        if (!_pendingNextRoundLabel) return;

        const headerStyles = {
            fontSize: '14px', color: '#fff', marginTop: '8px', textAlign: 'center',
        };
        const deathStyles = {
            fontSize: '1.5rem', color: '#fff', textAlign: 'center',
            fontWeight: 'bold', paddingTop: '50px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
        };

        const header = document.getElementById('end-match-header');
        if (header) {
            _injectLabel(header, 'next-round-display-header', _pendingNextRoundLabel, headerStyles);
        }

        const deathSection = document.querySelector('#death-screen .top-section');
        if (deathSection) {
            _injectLabel(deathSection, 'next-round-display-death', _pendingNextRoundLabel, deathStyles);
        }
    }

    function _injectLabel(parent, id, text, styles) {
        let elem = document.getElementById(id);
        if (!elem) {
            elem = document.createElement('div');
            elem.id = id;
            Object.assign(elem.style, styles);
            parent.appendChild(elem);
        }
        elem.textContent = text;
    }

    /**
     * MutationObserverでend-match-headerやdeath-screenの出現を監視し、
     * 出現したら即ラベルを挿入する
     */
    function _startNextRoundObserver() {
        if (_nextRoundObserver) return; // 既に監視中

        _nextRoundObserver = new MutationObserver(() => {
            if (!_pendingNextRoundLabel) {
                _nextRoundObserver.disconnect();
                _nextRoundObserver = null;
                return;
            }
            _tryInjectNextRoundLabel();

            // 両方挿入済みなら監視終了
            if (document.getElementById('next-round-display-header') &&
                document.getElementById('next-round-display-death')) {
                _nextRoundObserver.disconnect();
                _nextRoundObserver = null;
            }
        });

        _nextRoundObserver.observe(document.body, { childList: true, subtree: true });
    }

    // ------------------------------------------------------------------------------------------------
    //                                  ホットキー
    // ------------------------------------------------------------------------------------------------

    let _hotkeyHandler = null;

    function setupHotkey() {
        applyHotkey();
    }

    function applyHotkey() {
        if (_hotkeyHandler) {
            document.removeEventListener('keydown', _hotkeyHandler, { capture: true });
            window.removeEventListener('keydown',   _hotkeyHandler, { capture: true });
            _hotkeyHandler = null;
        }

        const stored = localStorage.getItem(STORAGE.YT_HOTKEY);
        const cfg = stored ? JSON.parse(stored) : { key: 'm', ctrlKey: true, altKey: false, shiftKey: false };

        _hotkeyHandler = (e) => {
            const match =
                e.key.toLowerCase() === cfg.key.toLowerCase() &&
                !!e.ctrlKey  === !!cfg.ctrlKey  &&
                !!e.altKey   === !!cfg.altKey    &&
                !!e.shiftKey === !!cfg.shiftKey;
            if (!match) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            toggleYouTubeVisibility();
        };

        document.addEventListener('keydown', _hotkeyHandler, { capture: true });
        window.addEventListener('keydown',   _hotkeyHandler, { capture: true });
    }

    function hotkeyLabel() {
        const stored = localStorage.getItem(STORAGE.YT_HOTKEY);
        const cfg = stored ? JSON.parse(stored) : { key: 'm', ctrlKey: true, altKey: false, shiftKey: false };
        const mods = [
            cfg.ctrlKey  ? 'Ctrl'  : '',
            cfg.altKey   ? 'Alt'   : '',
            cfg.shiftKey ? 'Shift' : '',
        ].filter(Boolean);
        return [...mods, cfg.key.toUpperCase()].join('+') || t('ytHotkeyNone');
    }

    // ------------------------------------------------------------------------------------------------
    //                                  初期化
    // ------------------------------------------------------------------------------------------------

    function init() {
        if (!document.querySelector('#settings-screen .pc-tab')) return;

        if (initCompleted) {
            if (document.getElementById('lolex-settings')) bindSettingsEvents();
            return;
        }
        initCompleted = true;

        document.getElementById('yt-card')?.remove();
        document.getElementById('yt-hidden-player')?.remove();
        document.getElementById('yt-url-panel')?.remove();

        applyColorTheme(getPrimaryColor(), getSecondaryColor());
        applyCustomBackground(false);

        hookConsoleLog();
        setupHotkey();
        createSettings();
        createBackgroundModal();

        setTimeout(() => {
            initYouTubePlayerUI();
        }, 1000);

        window.addEventListener('beforeunload', saveTime);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') saveTime();
        });
    }

    function initializeScript() {
        if (document.body) init();

        const observer = new MutationObserver(() => {
            if (document.querySelector('#settings-screen .pc-tab')) {
                observer.disconnect();
                init();
            }
        });

        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                observer.observe(document.body, { childList: true, subtree: true });
                init();
            });
        }
    }

    // --- エントリーポイント ---
    initializeScript();

})();
