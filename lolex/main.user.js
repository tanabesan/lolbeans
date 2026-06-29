// ==UserScript==
// @name         LOL.ex ver0.83
// @namespace    http://tampermonkey.net/
// @version      0.83
// @description  LOLBeans extension - Added: Best time calculator & PNG save
// @author       ユウキ / Yuki
// @match        https://lolbeans.io/*
// @match        https://bean.lol/*
// @match        https://obby.lol/*
// @match        https://s.lolbeans.io/*
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @connect      s.lolbeans.io
// @run-at       document-start
// @updateURL    https://tanabesan.github.io//lolex/extension/main.user.js
// @downloadURL  https://tanabesan.github.io/lolex/extension/main.user.js
// ==/UserScript==

(function () {
    'use strict';

    const SCRIPT_VERSION = '0.83';

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

    const LOLEX_KEYS = [
        'yt-videoId','yt-playlistId','yt-last-time','customBackgroundUrl','customBackgroundList',
        'yt-is-visible','yt-loop','yt-shuffle','airMoveAutoSwitchEnabled','lolex-language',
        'lolex-primary-color','lolex-secondary-color','yt-collapsed','yt-volume','yt-card-visible',
        'lolex-yt-hotkey','lolex-yt-float-btn',
    ];
    ['beacon-bay','boulder-hill','circus-contest','devils-trick','dash-cup','escape-tsunami',
     'gravity-gates','hammer-ville','jungle-temple','kittie-kegs','lava-lake','mecha-maze',
     'mill-valley','monster-manor','polar-path','123-red-light','nasty-seals','rickety-run',
     'risky-cliffs','shark-park','silly-slide','spiky-slopes','splash-dash','tumble-town',
     'tricky-traps','ufo-attack'
    ].forEach(id => LOLEX_KEYS.push('stopAirMove_' + id));

    // ------------------------------------------------------------------------------------------------
    //  ユーティリティ
    // ------------------------------------------------------------------------------------------------
    const getStoredBool  = (key, fallback = false) => { const v = localStorage.getItem(key); return v === null ? fallback : v === 'true'; };
    const setStoredBool  = (key, value) => localStorage.setItem(key, String(Boolean(value)));
    const getStoredFloat = (key, fallback = 0) => { const v = parseFloat(localStorage.getItem(key)); return isNaN(v) ? fallback : v; };

    let player           = null;
    let isApiReady       = false;
    let saveTimeInterval = null;
    let initCompleted    = false;
    let currentVideoId   = localStorage.getItem(STORAGE.VIDEO);
    let lastTime         = getStoredFloat(STORAGE.TIME, 0);
    let _cachedLang      = null;

    // ------------------------------------------------------------------------------------------------
    //  コースデータ
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
    //  言語辞書
    // ------------------------------------------------------------------------------------------------
    const LANG_DATA = {
        ja: {
            tabTitle:            `LOL.ex v${SCRIPT_VERSION}`,
            discordInvite:       'Discordサーバーに参加する',
            latestUpdates:       '最新アップデート情報',
            updateInfo:          '・ベストタイム計算機能を追加しました。<br>・サムネイル付きタイム一覧のPNG保存機能を追加しました。<br>・全体的な安定性を向上させました。',
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
            backgroundNote:      '「リストを編集」で管理されている画像がランダムに適用されます。',
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
            bestTimes:           'ベストタイム計算',
            bestTimesCalc:       'タイムを計算',
            bestTimesSave:       '保存',
            bestTimesTotal:      '合計タイム',
            bestTimesLoading:    '取得中...',
            bestTimesError:      '取得エラー',
            bestTimesNoSession:  'sessionID不明',
            bestTimesSaving:     '生成中...',
            bestTimesNote:       'APIからベストタイムを取得して合計を計算します。同名コースは最速タイムのみ使用。',
        },
        en: {
            tabTitle:            `LOL.ex v${SCRIPT_VERSION}`,
            discordInvite:       'Join Discord Server',
            latestUpdates:       'Latest Updates',
            updateInfo:          '・Added best time calculator feature.<br>・Added PNG save for time list with thumbnails.<br>・Improved overall stability.',
            language:            'Language',
            airMoveAutoSwitch:   'Air Move Auto Switch Control',
            enableAutoSwitch:    'Enable Air Move Auto Switch',
            autoSwitchOff:       '[OFF]: Air Move state remains unchanged when the course changes.',
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
            resetColorConfirm:   'Are you sure you want to reset UI colors to default?',
            backgroundNote:      'A random image from the managed list will be applied.',
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
            bestTimes:           'Best Times',
            bestTimesCalc:       'Calc Times',
            bestTimesSave:       'Save',
            bestTimesTotal:      'Total',
            bestTimesLoading:    'Loading...',
            bestTimesError:      'Fetch Error',
            bestTimesNoSession:  'Session not found',
            bestTimesSaving:     'Generating...',
            bestTimesNote:       'Fetches best times from API. For duplicate courses, only the fastest time is used.',
        },
    };

    // ----------------------------------------------------------------
    //  DOM ユーティリティ
    // ----------------------------------------------------------------
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

    function getLang() { if (!_cachedLang) _cachedLang = localStorage.getItem(STORAGE.LANGUAGE) || 'ja'; return _cachedLang; }
    function invalidateLangCache() { _cachedLang = null; }
    function t(key) { const lang = getLang(); return (LANG_DATA[lang] && LANG_DATA[lang][key]) || LANG_DATA['ja'][key] || `[${key}]`; }

    const getPrimaryColor   = () => localStorage.getItem(STORAGE.PRIMARY_COLOR)   || DEFAULT.PRIMARY;
    const getSecondaryColor = () => localStorage.getItem(STORAGE.SECONDARY_COLOR) || DEFAULT.SECONDARY;

    function applyColorTheme(primary, secondary) {
        document.documentElement.style.setProperty('--primary-color',   primary);
        document.documentElement.style.setProperty('--secondary-color', secondary);
        applySiteTheme(primary, secondary);
    }

    function applySiteTheme(primary, secondary) {
        const styleId = 'lolex-site-theme';
        let style = document.getElementById(styleId);
        if (!style) { style = document.createElement('style'); style.id = styleId; document.head.appendChild(style); }
        const toRgb = hex => { const n = parseInt(hex.replace('#',''), 16); return [(n>>16)&255, (n>>8)&255, n&255]; };
        const alpha = (hex, a) => { const [r,g,b] = toRgb(hex); return `rgba(${r},${g},${b},${a})`; };
        style.textContent = `
            #btn-play { background: ${primary} !important; color: #000 !important; box-shadow: 4px 4px 14px ${alpha(primary, 0.55)} !important; }
            #btn-play:hover { filter: brightness(1.1); }
            #select-gamemode-value { background-color: ${secondary} !important; color: #000 !important; }
            #btn-community-level { background: ${alpha(secondary, 0.8)} !important; color: #000 !important; }
            html body .primary-btn { background-color: rgba(255,255,255,0.70) !important; color: #1a1a1a !important; border: 1px solid ${alpha(secondary, 0.55)} !important; }
            html body .primary-btn:hover { background-color: rgba(255,255,255,0.90) !important; border-color: ${secondary} !important; }
            html body .secondary-btn { background-color: rgba(255,255,255,0.62) !important; color: #1a1a1a !important; border: 1px solid ${alpha(secondary, 0.4)} !important; }
            .scoreboard .score-rows-wrapper .row.local-player { background: rgba(0,0,0,0.88) !important; border-left: 3px solid ${primary} !important; }
            .scoreboard .score-rows-wrapper .row.local-player * { color: #ffffff !important; }
            ::-webkit-scrollbar-thumb { background: ${alpha(secondary, 0.45)} !important; border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: ${secondary} !important; }
        `;
    }

    function saveTime() {
        if (!player) return;
        try { const time = player.getCurrentTime?.(); if (typeof time === 'number' && !isNaN(time)) { localStorage.setItem(STORAGE.TIME, time); lastTime = time; } } catch (_) {}
    }

    function onPlayerReady(event) {
        try {
            event.target.unMute();
            const vol = parseInt(localStorage.getItem(STORAGE.VOLUME) ?? '80', 10);
            event.target.setVolume(vol);
            event.target.setLoop(getStoredBool(STORAGE.LOOP));
            if (localStorage.getItem(STORAGE.PLAYLIST)) event.target.setShuffle(getStoredBool(STORAGE.SHUFFLE));
            if (!localStorage.getItem(STORAGE.PLAYLIST) && lastTime > 0) event.target.seekTo(lastTime, true);
            updateBarTitle();
        } catch (e) { console.error('[LOL.ex] onPlayerReady error:', e); }
    }

    function onPlayerStateChange(event) {
        clearInterval(saveTimeInterval); saveTimeInterval = null;
        try {
            if (event.data === unsafeWindow.YT.PlayerState.PLAYING) { saveTimeInterval = setInterval(saveTime, 2000); updateBarTitle(); updateBarPlayButton(true); }
            else if (event.data === unsafeWindow.YT.PlayerState.PAUSED) { updateBarPlayButton(false); }
            else if (event.data === unsafeWindow.YT.PlayerState.ENDED) { saveTime(); updateBarPlayButton(false); }
        } catch (e) { console.error('[LOL.ex] onPlayerStateChange error:', e); }
    }

    function updateBarTitle() {
        if (!player) return;
        try {
            const data = player.getVideoData?.() || {};
            const title = data.title || '', vidId = data.video_id || '';
            const titleEl = $('yt-card-title');
            if (titleEl) titleEl.textContent = title || t('ytNoTrack');
            const bg = $('yt-card');
            if (bg && vidId) bg.style.backgroundImage = `url('https://i.ytimg.com/vi/${vidId}/mqdefault.jpg')`;
            else if (bg) bg.style.backgroundImage = 'none';
        } catch (_) {}
    }

    function updateBarPlayButton(isPlaying) {
        const btn = $('yt-card-play');
        if (btn) btn.textContent = isPlaying ? '⏸' : '▶';
        if (isPlaying) startEqAnimation(); else stopEqAnimation();
    }

    const EQ_COLS = 14, EQ_SEGS = 7;
    const _eqTargets = new Float32Array(EQ_COLS).fill(3);
    const _eqCurrents = new Float32Array(EQ_COLS).fill(1);
    let _eqNextChange = 0, _eqAnimId = null;

    function startEqAnimation() {
        if (_eqAnimId) return;
        function frame(ts) {
            if (ts > _eqNextChange) { for (let i = 0; i < EQ_COLS; i++) _eqTargets[i] = 1 + Math.random() * (EQ_SEGS - 1); _eqNextChange = ts + 80 + Math.random() * 120; }
            for (let i = 0; i < EQ_COLS; i++) _eqCurrents[i] += (_eqTargets[i] - _eqCurrents[i]) * 0.22;
            document.querySelectorAll('.yt-eq-col').forEach((col, ci) => {
                const activeCount = Math.round(_eqCurrents[ci]);
                col.querySelectorAll('.yt-eq-seg').forEach((seg, si) => { seg.style.opacity = (EQ_SEGS - 1 - si) < activeCount ? '1' : '0'; });
            });
            _eqAnimId = requestAnimationFrame(frame);
        }
        _eqAnimId = requestAnimationFrame(frame);
    }

    function stopEqAnimation() {
        if (_eqAnimId) { cancelAnimationFrame(_eqAnimId); _eqAnimId = null; }
        document.querySelectorAll('.yt-eq-col').forEach(col => { col.querySelectorAll('.yt-eq-seg').forEach((seg, si) => { seg.style.opacity = si === EQ_SEGS - 1 ? '0.15' : '0'; }); });
    }

    function clickAirMoveRadio(enabled) {
        const radio = document.querySelector(enabled ? '#air-movement-on' : '#air-movement-off');
        if (radio && !radio.checked) radio.click();
    }

    function parseYouTubeInput(val) {
        let videoId = null, playlistId = null;
        try {
            const url = new URL(val);
            videoId    = url.searchParams.get('v') || null;
            playlistId = url.searchParams.get('list') || null;
            if (!videoId && url.hostname === 'youtu.be') videoId = url.pathname.slice(1) || null;
        } catch (_) {
            if (/^[A-Za-z0-9_-]{11}$/.test(val)) videoId = val;
            else if (/^PL[A-Za-z0-9_-]+$/.test(val)) playlistId = val;
        }
        return { videoId, playlistId };
    }

    function loadYouTube(inputVal) {
        if (!player || typeof player.loadPlaylist !== 'function') return;
        const val = (inputVal || '').trim();
        let videoId = null, playlistId = null;
        if (val.length > 0) {
            const ids = parseYouTubeInput(val);
            if (ids.playlistId) { playlistId = ids.playlistId; videoId = ids.videoId; }
            else if (ids.videoId) { videoId = ids.videoId; }
            else { alert(t('ytInvalidUrl')); return; }
        }
        localStorage.setItem(STORAGE.VIDEO, videoId || '');
        localStorage.setItem(STORAGE.PLAYLIST, playlistId || '');
        localStorage.setItem(STORAGE.TIME, 0);
        lastTime = 0; currentVideoId = videoId;
        const loop = getStoredBool(STORAGE.LOOP), shuffle = getStoredBool(STORAGE.SHUFFLE);
        try {
            if (playlistId) { player.loadPlaylist({ list: playlistId, listType: 'playlist', index: 0, startSeconds: 0 }); player.setLoop(loop); player.setShuffle(shuffle); player.unMute(); player.playVideo(); }
            else if (videoId) { player.loadVideoById({ videoId, startSeconds: 0 }); player.setLoop(loop); player.unMute(); player.playVideo(); }
            else { player.stopVideo(); }
        } catch (e) { console.error('[LOL.ex] loadYouTube error:', e); }
    }

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
            if (forceRandom || !imageUrl) { imageUrl = list[Math.floor(Math.random() * list.length)]; localStorage.setItem(STORAGE.BACKGROUND, imageUrl); }
            if (!imageUrl || !/^https?:\/\//.test(imageUrl)) return;
            const escapedUrl = imageUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            const style = document.createElement('style');
            style.id = styleId;
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
        } catch (e) { console.error('[LOL.ex] Failed to apply custom background:', e); }
    }

    function updateCourseLabels(targetId = null) {
        const targets = targetId ? COURSES.filter(c => c.id === targetId) : COURSES;
        targets.forEach(({ id, displayName }) => {
            const enabled = getStoredBool(`stopAirMove_${id}`);
            const checkbox = document.getElementById(`courseAirMoveToggle_${id}`);
            if (!checkbox) return;
            const row = checkbox.closest('.lolex-setting-row');
            if (!row) return;
            const labelEl = row.querySelector('.setting-name');
            if (!labelEl) return;
            labelEl.innerHTML = '';
            const icon = document.createElement('i'); icon.className = 'fas fa-bolt';
            const name = document.createTextNode(displayName);
            const badge = document.createElement('span');
            badge.style.cssText = `margin-left:6px;padding:1px 5px;border-radius:3px;font-size:0.72em;font-weight:700;background:${enabled ? 'rgba(3,218,198,0.15)' : 'rgba(187,134,252,0.12)'};color:${enabled ? 'var(--secondary-color)' : 'var(--col-muted)'};border:1px solid ${enabled ? 'rgba(3,218,198,0.3)' : 'rgba(255,255,255,0.08)'};`;
            badge.textContent = enabled ? t('on') : t('off');
            labelEl.appendChild(icon); labelEl.appendChild(name); labelEl.appendChild(badge);
        });
    }

    // ------------------------------------------------------------------------------------------------
    //  ★ ベストタイム機能
    // ------------------------------------------------------------------------------------------------
    function getSessionId() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.toLowerCase().includes('session')) return localStorage.getItem(key);
        }
        for (let i = 0; i < localStorage.length; i++) {
            const val = localStorage.getItem(localStorage.key(i));
            if (val && /^[a-zA-Z0-9_\-]{20,}$/.test(val)) return val;
        }
        return null;
    }

    function normalizeMap(mapStr) { return mapStr.replace(/-v[\d.]+$/i, '').toLowerCase(); }

    function getBestTimes(records) {
        const best = {};
        for (const r of records) {
            const key = normalizeMap(r.map);
            if (!(key in best) || r.time < best[key].time) best[key] = { time: r.time };
        }
        return best;
    }

    function loadImage(src) {
        return new Promise(resolve => {
            const img = new Image(); img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img); img.onerror = () => resolve(null);
            img.src = src;
        });
    }

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function collectThumbnails() {
        return Array.from(document.querySelectorAll('#best-times-wrapper .map-thumbnail')).map(el => {
            const style = el.style.backgroundImage;
            const match = style.match(/url\(["']?(.+?)["']?\)/);
            return {
                imgSrc: match ? new URL(match[1], location.href).href : null,
                name: el.querySelector('.map-name')?.textContent.trim() || '',
                time: el.querySelector('.record')?.textContent.trim() || '',
            };
        });
    }

    async function saveTimesAsImage() {
        const saveBtn = $('lb-save-btn');
        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = t('bestTimesSaving'); }

        const thumbs = collectThumbnails();
        const COLS = 4, CARD_W = 200, CARD_H = 130, THUMB_H = 90, PAD = 12, HEADER_H = 60, FOOTER_H = 50;
        const ROWS = Math.ceil(thumbs.length / COLS);
        const W = COLS * CARD_W + (COLS + 1) * PAD;
        const H = HEADER_H + ROWS * (CARD_H + PAD) + PAD + FOOTER_H;

        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#f97316'; ctx.fillRect(0, 0, W, HEADER_H);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('🏆 LolBeans Best Times', W / 2, 38);

        const totalText = $('lb-total-display')?.textContent || '';
        ctx.fillStyle = '#0f172a'; ctx.fillRect(0, H - FOOTER_H, W, FOOTER_H);
        ctx.fillStyle = '#4ade80'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(totalText || '---', W / 2, H - 16);

        const images = await Promise.all(thumbs.map(t => t.imgSrc ? loadImage(t.imgSrc) : Promise.resolve(null)));

        thumbs.forEach((thumb, i) => {
            const col = i % COLS, row = Math.floor(i / COLS);
            const x = PAD + col * (CARD_W + PAD), y = HEADER_H + PAD + row * (CARD_H + PAD);
            ctx.fillStyle = '#334155'; roundRect(ctx, x, y, CARD_W, CARD_H, 8); ctx.fill();
            const img = images[i];
            if (img) {
                ctx.save(); roundRect(ctx, x, y, CARD_W, THUMB_H, 8); ctx.clip();
                const scale = Math.max(CARD_W / img.width, THUMB_H / img.height);
                ctx.drawImage(img, x + (CARD_W - img.width * scale) / 2, y + (THUMB_H - img.height * scale) / 2, img.width * scale, img.height * scale);
                ctx.restore();
            } else {
                ctx.fillStyle = '#475569'; ctx.fillRect(x, y, CARD_W, THUMB_H);
            }
            ctx.fillStyle = 'rgba(15,23,42,0.85)'; ctx.fillRect(x, y + THUMB_H, CARD_W, CARD_H - THUMB_H);
            ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(thumb.name, x + CARD_W / 2, y + THUMB_H + 16, CARD_W - 8);
            ctx.fillStyle = '#fbbf24'; ctx.font = '13px monospace';
            ctx.fillText(thumb.time, x + CARD_W / 2, y + THUMB_H + 34, CARD_W - 8);
        });

        const link = document.createElement('a');
        link.download = 'lolbeans-best-times.png';
        link.href = canvas.toDataURL('image/png');
        link.click();

        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = t('bestTimesSave'); }
    }

    function fetchBestTimes() {
        const calcBtn   = $('lb-calc-btn');
        const resultDiv = $('lb-total-display');
        const sessionId = getSessionId();

        if (!sessionId) {
            if (resultDiv) { resultDiv.textContent = t('bestTimesNoSession'); resultDiv.style.color = '#f87171'; }
            return;
        }

        if (calcBtn) { calcBtn.disabled = true; calcBtn.textContent = t('bestTimesLoading'); }
        if (resultDiv) { resultDiv.textContent = t('bestTimesLoading'); resultDiv.style.color = '#94a3b8'; }

        GM_xmlhttpRequest({
            method: 'GET',
            url: `https://s.lolbeans.io/my-stats?s=${encodeURIComponent(sessionId)}`,
            onload: (res) => {
                if (calcBtn) { calcBtn.disabled = false; calcBtn.textContent = t('bestTimesCalc'); }
                if (res.status !== 200) {
                    if (resultDiv) { resultDiv.textContent = `${t('bestTimesError')} HTTP ${res.status}`; resultDiv.style.color = '#f87171'; }
                    return;
                }
                let json;
                try { json = JSON.parse(res.responseText); } catch {
                    if (resultDiv) { resultDiv.textContent = t('bestTimesError'); resultDiv.style.color = '#f87171'; }
                    return;
                }
                if (!json.records || !Array.isArray(json.records)) {
                    if (resultDiv) { resultDiv.textContent = t('bestTimesError'); resultDiv.style.color = '#f87171'; }
                    return;
                }
                const best  = getBestTimes(json.records);
                const total = Object.values(best).reduce((s, d) => s + d.time, 0);
                const count = Object.keys(best).length;
                if (resultDiv) {
                    resultDiv.textContent = `${t('bestTimesTotal')}: ${total.toFixed(3)}s（${count} maps）`;
                    resultDiv.style.color = '#4ade80';
                }
            },
            onerror: () => {
                if (calcBtn) { calcBtn.disabled = false; calcBtn.textContent = t('bestTimesCalc'); }
                if (resultDiv) { resultDiv.textContent = t('bestTimesError'); resultDiv.style.color = '#f87171'; }
            },
        });
    }

    // ------------------------------------------------------------------------------------------------
    //  スタイルシート
    // ------------------------------------------------------------------------------------------------
    function addModernStyleSheet() {
        applyColorTheme(getPrimaryColor(), getSecondaryColor());
        if (document.getElementById('lolex-modern-style')) return;
        const style = document.createElement('style');
        style.id = 'lolex-modern-style';
        style.textContent = `
            #tab5:checked ~ nav + section > .tab5 { display: block !important; }
            .pc-tab section > .tab5 { display: none; }
            #settings-screen .pc-tab nav ul li.tab5 label[for="tab5"] {
                background-image: url('https://tanabesan.github.io/lolbeans/file/page/icon.png') !important;
                background-size: 20px 20px !important; background-repeat: repeat !important;
                background-position: center !important; color: #fff !important; font-weight: bold;
                text-shadow: 1px 1px 3px #000; padding: 0 14px !important; line-height: 40px !important;
                height: 40px !important; display: inline-block !important;
            }
            :root { --col-bg:#0d0d14; --col-surface:#18181f; --col-border:#2c2c3a; --col-text:#dcdce8; --col-sub:#9090aa; --col-muted:#9090aa; --background-color:#0d0d14; --card-color:#18181f; --text-color-dark:#dcdce8; --input-bg:#1c1c26; --border-color:#2c2c3a; }
            #settings-screen .pc-tab > section > div.tab5 { background: var(--col-bg) !important; color: var(--col-text) !important; padding: 10px 12px 18px; height: auto !important; max-height: none !important; overflow-y: visible !important; }
            #settings-screen .pc-tab > section { overflow-y: auto !important; max-height: calc(100vh - 160px) !important; }
            .lolex-settings fieldset { border: 1px solid var(--col-border); border-radius: 6px; padding: 0; margin-bottom: 8px; background: var(--col-surface); overflow: hidden; transition: border-color 0.2s; }
            .lolex-settings fieldset:hover { border-color: var(--primary-color); }
            .lolex-settings legend { display: flex; align-items: center; justify-content: space-between; width: 100%; background: rgba(0,0,0,0.35); color: var(--secondary-color); font-size: 0.80em; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; padding: 6px 10px; margin: 0; box-sizing: border-box; border-bottom: 1px solid var(--col-border); cursor: pointer; user-select: none; }
            .lolex-settings legend .legend-left { display: flex; align-items: center; gap: 6px; }
            .lolex-settings legend .legend-arrow { font-size: 0.70em; opacity: 0.6; transition: transform 0.25s; margin-left: 4px; }
            .lolex-settings fieldset.lolex-collapsed legend .legend-arrow { transform: rotate(-90deg); }
            .lolex-fs-body { max-height: 2000px; overflow: hidden; transition: max-height 0.28s ease, opacity 0.2s ease; opacity: 1; }
            .lolex-settings fieldset.lolex-collapsed .lolex-fs-body { max-height: 0 !important; opacity: 0; }
            .lolex-setting-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 10px; border-bottom: 1px solid rgba(255,255,255,0.04); gap: 8px; }
            .lolex-setting-row:last-child { border-bottom: none; }
            .lolex-setting-row .setting-name { display: flex; align-items: center; gap: 7px; font-size: 0.86em; color: var(--col-text); font-weight: 500; flex-grow: 1; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .lolex-setting-row .setting-name i { color: var(--primary-color); font-size: 0.88em; flex-shrink: 0; }
            .lolex-setting-row select, .lolex-setting-row input[type="text"] { padding: 4px 8px; border: 1px solid var(--col-border); border-radius: 4px; background: var(--input-bg); color: var(--col-text); font-size: 0.84em; transition: border-color 0.2s; box-sizing: border-box; flex-shrink: 0; }
            .lolex-setting-row select { min-width: 120px; }
            .lolex-setting-row input[type="color"] { -webkit-appearance: none; appearance: none; width: 28px; height: 28px; padding: 0; border: none; background: none; cursor: pointer; flex-shrink: 0; }
            .lolex-setting-row input[type="color"]::-webkit-color-swatch { border: 2px solid var(--col-border); border-radius: 4px; }
            .switch { position: relative; display: inline-block; width: 38px; height: 22px; min-width: 38px; flex-shrink: 0; }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider-toggle { position: absolute; cursor: pointer; inset: 0; background: #3a3a50; transition: background 0.25s; border-radius: 22px; }
            .slider-toggle:before { content: ""; position: absolute; width: 15px; height: 15px; left: 3px; bottom: 3px; background: #888; transition: transform 0.25s, background 0.25s; border-radius: 50%; }
            input:checked + .slider-toggle { background: var(--secondary-color); }
            input:checked + .slider-toggle:before { transform: translateX(16px); background: #fff; }
            .lolex-setting-row button { background: var(--primary-color); color: #0d0d14; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.82em; font-weight: 700; transition: background 0.2s, transform 0.1s; white-space: nowrap; flex-shrink: 0; }
            .lolex-setting-row button:hover { background: var(--secondary-color); }
            .lolex-setting-row button:active { transform: translateY(1px); }
            .lolex-update-text { font-size: 0.83em; color: var(--col-text); line-height: 1.7; padding: 8px 10px 6px; }
            .lolex-discord-banner { display: flex; align-items: center; gap: 10px; margin: 2px 10px 10px; padding: 9px 14px; background: rgba(88,101,242,0.15); border: 1px solid rgba(88,101,242,0.45); border-radius: 8px; color: #c9ccff; font-size: 0.83em; font-weight: 600; cursor: pointer; text-decoration: none; transition: background 0.2s; }
            .lolex-discord-banner:hover { background: rgba(88,101,242,0.30); color: #fff; }
            .lolex-version-badge { display: inline-block; background: rgba(255,255,255,0.05); border: 1px solid var(--col-border); border-radius: 3px; font-size: 0.78em; color: var(--col-sub); padding: 1px 7px; margin-top: 5px; }
            .lolex-note { font-size: 0.79em; color: var(--col-sub); padding: 5px 10px 7px; line-height: 1.6; }
            .lolex-note span { color: var(--secondary-color); font-weight: 700; }
            .lolex-btn-group { display: flex; gap: 5px; padding: 6px 10px; }
            .lolex-btn-group button { flex: 1; background: var(--primary-color); color: #0d0d14; border: none; padding: 5px 6px; border-radius: 4px; cursor: pointer; font-size: 0.80em; font-weight: 700; transition: background 0.2s; white-space: nowrap; }
            .lolex-btn-group button:hover { background: var(--secondary-color); }
            .lolex-btn-group button.muted { background: #23232f; color: var(--col-text); border: 1px solid var(--col-border); }
            .lolex-btn-group button.accent { background: var(--secondary-color); color: #0d0d14; }
            .lolex-btn-group button.danger { background: #2a1212; color: #ff7070; border: 1px solid #4a2020; }
            .lolex-btn-group button:disabled { opacity: 0.55; cursor: default; }
            .lb-total-display { font-size: 0.88em; font-weight: 700; padding: 6px 10px 4px; min-height: 22px; }
            .tab5 h3, .tab5 .setting-section, .tab5 .youtube-container, .tab5 .youtube-input-group, .tab5 .setting-row { display: none !important; }
            .tab5 .lolex-settings { display: block !important; }
        `;
        document.head.appendChild(style);
    }

    function addYouTubeStyleSheet() {
        if (document.getElementById('lolex-yt-style')) return;
        const style = document.createElement('style');
        style.id = 'lolex-yt-style';
        style.textContent = `
            #yt-hidden-player { position: fixed; width: 1px; height: 1px; bottom: 0; left: 0; opacity: 0; pointer-events: none; z-index: -1; }
            #yt-card { position: fixed; bottom: -240px; right: 18px; width: 200px; height: 200px; border-radius: 12px; overflow: hidden; z-index: 9999; background: #0d0d14 center/cover no-repeat; border: 1.5px solid var(--primary-color, #BB86FC); box-shadow: 0 8px 32px rgba(0,0,0,0.7); cursor: default; transition: bottom 0.38s cubic-bezier(.4,0,.2,1); user-select: none; }
            #yt-card.yt-card-visible { bottom: 18px; }
            #yt-card-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(5,5,12,0.55) 55%, rgba(5,5,12,0.92) 100%); display: flex; flex-direction: column; justify-content: flex-end; padding: 0 0 6px 0; }
            #yt-eq-row { display: flex; align-items: flex-end; justify-content: center; gap: 3px; height: 56px; padding: 0 8px; margin-bottom: 4px; overflow: hidden; }
            .yt-eq-col { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 2px; height: 100%; width: 10px; flex-shrink: 0; }
            .yt-eq-seg { width: 100%; height: 5px; border-radius: 1px; flex-shrink: 0; opacity: 0; transition: opacity 0.1s; background: var(--secondary-color, #03DAC6); }
            #yt-card-title { font-size: 0.72em; color: rgba(255,255,255,0.92); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 10px; margin-bottom: 5px; text-shadow: 0 1px 4px rgba(0,0,0,0.8); }
            #yt-card-controls { display: flex; align-items: center; justify-content: space-between; padding: 0 8px; gap: 2px; }
            .yt-card-btn { background: none; border: none; color: rgba(255,255,255,0.82); font-size: 14px; cursor: pointer; padding: 3px 5px; border-radius: 4px; flex-shrink: 0; line-height: 1; transition: color 0.12s; }
            .yt-card-btn:hover { color: #fff; background: rgba(255,255,255,0.1); }
            #yt-card-play { font-size: 18px; padding: 3px 6px; }
            #yt-card-volume { -webkit-appearance: none; appearance: none; width: 52px; height: 3px; background: rgba(255,255,255,0.22); border-radius: 2px; outline: none; cursor: pointer; flex-shrink: 0; }
            #yt-card-volume::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 10px; background: var(--secondary-color, #03DAC6); border-radius: 50%; }
            #yt-url-panel { position: fixed; right: 18px; bottom: 238px; width: 200px; background: rgba(8,8,16,0.96); border: 1.5px solid var(--primary-color, #BB86FC); border-radius: 10px; padding: 8px; display: flex; flex-direction: column; gap: 5px; z-index: 10001; }
            #yt-url-panel.yt-url-hidden { opacity: 0; pointer-events: none; transform: translateY(8px); }
            #yt-url-panel input { width: 100%; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.14); border-radius: 4px; color: #fff; font-size: 0.78em; padding: 5px 7px; outline: none; box-sizing: border-box; }
            #yt-url-panel button { width: 100%; background: var(--secondary-color, #03DAC6); color: #08080f; border: none; border-radius: 4px; padding: 5px; font-size: 0.78em; font-weight: 700; cursor: pointer; }
            #yt-float-btn { position: fixed; right: 18px; bottom: 228px; width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid var(--primary-color, #BB86FC); background: rgba(10,10,18,0.85); color: rgba(255,255,255,0.9); font-size: 16px; cursor: pointer; z-index: 9997; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(0,0,0,0.5); transition: background 0.2s, opacity 0.2s; backdrop-filter: blur(4px); line-height: 1; padding: 0; opacity: 1; }
            #yt-float-btn.lolex-float-faint { opacity: 0.18; }
            #yt-float-btn.lolex-float-faint:hover { opacity: 0.85; }
            #yt-float-btn.lolex-float-hidden { display: none !important; }
            #yt-float-btn:hover { background: var(--primary-color, #BB86FC); color: #000; }
        `;
        document.head.appendChild(style);
    }

    // ------------------------------------------------------------------------------------------------
    //  YouTube UI
    // ------------------------------------------------------------------------------------------------
    function initYouTubePlayerUI() {
        if ($('yt-card')) return;
        addYouTubeStyleSheet(); addModernStyleSheet();
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
            for (let si = 0; si < EQ_SEGS; si++) { const seg = el('div', { className: 'yt-eq-seg' }, { opacity: '0' }); seg.dataset.level = String(si); col.appendChild(seg); }
            eqRow.appendChild(col);
        }
        overlay.appendChild(eqRow);
        const titleEl = el('div', { id: 'yt-card-title', textContent: t('ytNoTrack') });
        const controls = el('div', { id: 'yt-card-controls' });
        append(overlay, titleEl, controls);
        append(controls,
            el('button', { className: 'yt-card-btn', id: 'yt-bar-prev',       textContent: '⏮' }),
            el('button', { className: 'yt-card-btn', id: 'yt-card-play',      textContent: '▶' }),
            el('button', { className: 'yt-card-btn', id: 'yt-bar-next',       textContent: '⏭' }),
            el('input',  { type: 'range', id: 'yt-card-volume', min: '0', max: '100', value: String(volume) }),
            el('button', { className: 'yt-card-btn', id: 'yt-bar-url-toggle', textContent: '🔗' })
        );
        const urlPanel = el('div', { id: 'yt-url-panel' }); urlPanel.classList.add('yt-url-hidden');
        append(urlPanel, el('input', { type: 'text', id: 'yt-video-id-input', placeholder: t('ytInputPlaceholder') }), el('button', { id: 'yt-load-button', textContent: t('ytLoadButton') }));
        document.body.appendChild(urlPanel);
        const floatBtn = el('button', { id: 'yt-float-btn', textContent: '🎵' });
        document.body.appendChild(floatBtn);
        on(floatBtn, { click: toggleYouTubeVisibility });
        applyFloatBtnMode(localStorage.getItem(STORAGE.FLOAT_BTN) || 'show');
        bindYouTubeEventListeners();
        unsafeWindow.onYouTubeIframeAPIReady = function () {
            isApiReady = true;
            player = new unsafeWindow.YT.Player('yt-player', {
                height: '1', width: '1', videoId: currentVideoId || '',
                playerVars: { autoplay: 1, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, modestbranding: 1, rel: 0 },
                events: { onReady: onPlayerReady, onStateChange: onPlayerStateChange },
            });
        };
        if (!unsafeWindow.YT) document.head.appendChild(el('script', { src: 'https://www.youtube.com/iframe_api' }));
        else if (unsafeWindow.YT.Player) unsafeWindow.onYouTubeIframeAPIReady();
    }

    function bindYouTubeEventListeners() {
        const hideUrl = () => $('yt-url-panel')?.classList.add('yt-url-hidden');
        on($('yt-card-play'),      { click: () => { if (!player) return; try { player.getPlayerState() === unsafeWindow.YT.PlayerState.PLAYING ? player.pauseVideo() : player.playVideo(); } catch (_) {} }});
        on($('yt-bar-prev'),       { click: () => { try { player?.previousVideo?.(); } catch (_) {} }});
        on($('yt-bar-next'),       { click: () => { try { player?.nextVideo?.();     } catch (_) {} }});
        on($('yt-card-volume'),    { input: e => { const vol = parseInt(e.target.value, 10); localStorage.setItem(STORAGE.VOLUME, vol); try { player?.setVolume?.(vol); } catch (_) {} }});
        on($('yt-bar-url-toggle'), { click: () => {
            const panel = $('yt-url-panel'); if (!panel) return;
            const card = $('yt-card');
            if (card && !card.classList.contains('yt-card-visible')) { card.classList.add('yt-card-visible'); setStoredBool(STORAGE.BAR_VISIBLE, true); }
            const isNowHidden = panel.classList.toggle('yt-url-hidden');
            if (!isNowHidden) setTimeout(() => $('yt-video-id-input')?.focus(), 50);
        }});
        on($('yt-load-button'),    { click: () => { loadYouTube($('yt-video-id-input')?.value || ''); hideUrl(); }});
        on($('yt-video-id-input'), { keydown: e => { if (e.key === 'Enter') { loadYouTube(e.target.value); hideUrl(); } if (e.key === 'Escape') hideUrl(); e.stopPropagation(); }});
    }

    // ------------------------------------------------------------------------------------------------
    //  背景モーダル
    // ------------------------------------------------------------------------------------------------
    function createBackgroundModal() {
        if (document.getElementById('lolex-bg-modal')) return;
        const overlay = document.createElement('div'); overlay.id = 'lolex-bg-modal-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:10000;display:none;';
        document.body.appendChild(overlay);
        const modal = document.createElement('div'); modal.id = 'lolex-bg-modal';
        modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:90%;max-width:560px;height:76vh;max-height:660px;background:var(--col-surface);color:var(--col-text);border:1px solid var(--primary-color);border-radius:8px;box-shadow:0 12px 40px rgba(0,0,0,0.65);z-index:10001;display:none;flex-direction:column;';
        modal.innerHTML = `
            <div style="padding:9px 13px;border-bottom:1px solid var(--col-border);display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,0.25);flex-shrink:0;">
                <h4 id="lolex-bg-modal-title" style="margin:0;color:var(--secondary-color);font-size:0.88em;font-weight:700;"></h4>
                <button id="lolex-bg-modal-close" style="background:none;border:none;color:var(--col-sub);font-size:1.3em;cursor:pointer;">&times;</button>
            </div>
            <div id="lolex-bg-modal-body" style="padding:9px 11px;overflow-y:auto;flex-grow:1;"></div>
            <div style="padding:9px 11px;border-top:1px solid var(--col-border);background:rgba(0,0,0,0.2);flex-shrink:0;">
                <div style="display:flex;gap:7px;margin-bottom:7px;">
                    <input type="text" id="lolex-bg-new-url" style="flex-grow:1;padding:5px 9px;border:1px solid var(--col-border);border-radius:4px;background:var(--input-bg);color:var(--col-text);font-size:0.82em;">
                    <button id="lolex-bg-add-button" style="background:var(--primary-color);color:#0d0d14;border:none;padding:5px 11px;border-radius:4px;cursor:pointer;font-size:0.82em;font-weight:700;"></button>
                </div>
                <button id="lolex-bg-save-button" style="width:100%;background:var(--primary-color);color:#0d0d14;border:none;padding:5px;border-radius:4px;cursor:pointer;font-size:0.82em;font-weight:700;"></button>
            </div>
        `;
        document.body.appendChild(modal);
        on(overlay, { click: hideBackgroundModal });
        on($('lolex-bg-modal-close'), { click: hideBackgroundModal });
        on($('lolex-bg-save-button'), { click: () => { saveBackgroundListFromModal(); hideBackgroundModal(); }});
        on($('lolex-bg-add-button'),  { click: addBgItem });
        on($('lolex-bg-new-url'),     { keydown: e => { if (e.key === 'Enter') { addBgItem(); e.preventDefault(); } e.stopPropagation(); }});
    }

    function addBgItem() {
        const inp = $('lolex-bg-new-url'), url = inp?.value.trim();
        if (!url) return;
        const body = $('lolex-bg-modal-body');
        const existing = Array.from(body.querySelectorAll('.lolex-bg-item')).map(e => e.dataset.url);
        if (!existing.includes(url)) { existing.push(url); localStorage.setItem(STORAGE.BG_LIST, existing.join('\n')); renderBackgroundList(); body.scrollTop = body.scrollHeight; }
        inp.value = '';
    }

    function renderBackgroundList() {
        const body = $('lolex-bg-modal-body'); if (!body) return;
        body.innerHTML = '';
        getBackgroundList().forEach(url => {
            const item = document.createElement('div'); item.className = 'lolex-bg-item'; item.dataset.url = url;
            item.style.cssText = 'display:flex;align-items:center;gap:7px;padding:5px 7px;border:1px solid var(--col-border);border-radius:4px;margin-bottom:5px;background:rgba(0,0,0,0.2);';
            const preview = document.createElement('div'); preview.style.cssText = 'width:60px;height:38px;flex-shrink:0;border-radius:3px;background:#000;overflow:hidden;';
            const img = document.createElement('img'); img.src = url; img.alt = ''; img.style.cssText = 'width:100%;height:100%;object-fit:cover;'; preview.appendChild(img);
            const urlSpan = document.createElement('span'); urlSpan.style.cssText = 'flex-grow:1;word-break:break-all;font-size:0.74em;color:var(--col-sub);max-height:34px;overflow:hidden;'; urlSpan.textContent = url;
            const delBtn = document.createElement('button'); delBtn.style.cssText = 'background:rgba(180,0,30,0.65);color:#fff;border:none;border-radius:50%;width:20px;height:20px;flex-shrink:0;cursor:pointer;font-size:0.82em;line-height:20px;text-align:center;'; delBtn.textContent = '×'; delBtn.addEventListener('click', () => item.remove());
            item.appendChild(preview); item.appendChild(urlSpan); item.appendChild(delBtn); body.appendChild(item);
        });
    }

    function showBackgroundModal() {
        if (!$('lolex-bg-modal')) createBackgroundModal();
        const title = $('lolex-bg-modal-title'), newUrl = $('lolex-bg-new-url'), addBtn = $('lolex-bg-add-button'), saveBtn = $('lolex-bg-save-button');
        if (title) title.textContent   = t('modalTitle');
        if (newUrl) newUrl.placeholder  = t('addUrl');
        if (addBtn) addBtn.textContent  = t('add');
        if (saveBtn) saveBtn.textContent = t('save');
        renderBackgroundList();
        const overlay = $('lolex-bg-modal-overlay'), modal = $('lolex-bg-modal');
        if (overlay) overlay.style.display = 'block';
        if (modal)   modal.style.display   = 'flex';
    }

    function hideBackgroundModal() {
        const overlay = $('lolex-bg-modal-overlay'), modal = $('lolex-bg-modal');
        if (overlay) overlay.style.display = 'none';
        if (modal)   modal.style.display   = 'none';
    }

    function saveBackgroundListFromModal() {
        const body = $('lolex-bg-modal-body'); if (!body) return;
        const urls = Array.from(body.querySelectorAll('.lolex-bg-item')).map(el => el.dataset.url);
        localStorage.setItem(STORAGE.BG_LIST, urls.join('\n'));
        applyCustomBackground(true);
    }

    function resetColors() {
        localStorage.removeItem(STORAGE.PRIMARY_COLOR); localStorage.removeItem(STORAGE.SECONDARY_COLOR);
        const pp = $('primary-color-picker'), sp = $('secondary-color-picker');
        if (pp) pp.value = DEFAULT.PRIMARY; if (sp) sp.value = DEFAULT.SECONDARY;
        applyColorTheme(DEFAULT.PRIMARY, DEFAULT.SECONDARY);
    }

    function applyFloatBtnMode(mode) {
        const btn = $('yt-float-btn'); if (!btn) return;
        btn.classList.remove('lolex-float-faint', 'lolex-float-hidden');
        if (mode === 'faint') btn.classList.add('lolex-float-faint');
        if (mode === 'hide')  btn.classList.add('lolex-float-hidden');
    }

    function toggleYouTubeVisibility() {
        const card = $('yt-card'); if (!card) return;
        const isVisible = card.classList.toggle('yt-card-visible');
        setStoredBool(STORAGE.BAR_VISIBLE, isVisible);
    }

    function makeCollapsibleFieldset(fs, sectionKey) {
        const storageKey = `lolex-collapsed-${sectionKey}`;
        if (sectionKey === 'update') localStorage.removeItem(storageKey);
        const isCollapsed = getStoredBool(storageKey, false);
        const legend = fs.querySelector('legend'); if (!legend) return;
        const leftSpan = document.createElement('span'); leftSpan.className = 'legend-left';
        while (legend.firstChild) leftSpan.appendChild(legend.firstChild);
        const arrow = document.createElement('span'); arrow.className = 'legend-arrow'; arrow.textContent = '▼';
        legend.appendChild(leftSpan); legend.appendChild(arrow);
        const body = document.createElement('div'); body.className = 'lolex-fs-body';
        Array.from(fs.children).filter(e => e.tagName !== 'LEGEND').forEach(e => body.appendChild(e));
        fs.appendChild(body);
        if (isCollapsed) fs.classList.add('lolex-collapsed');
        legend.addEventListener('click', () => { const c = fs.classList.toggle('lolex-collapsed'); setStoredBool(storageKey, c); });
    }

    function makeToggleRow(inputId, labelHtml, checked) {
        const row = document.createElement('div'); row.className = 'lolex-setting-row';
        const label = document.createElement('label'); label.htmlFor = inputId; label.className = 'setting-name'; label.innerHTML = labelHtml;
        const sw = document.createElement('label'); sw.className = 'switch';
        const input = document.createElement('input'); input.type = 'checkbox'; input.id = inputId; if (checked) input.checked = true;
        const span = document.createElement('span'); span.className = 'slider-toggle';
        sw.appendChild(input); sw.appendChild(span); row.appendChild(label); row.appendChild(sw);
        return row;
    }

    // ------------------------------------------------------------------------------------------------
    //  設定画面 構築
    // ------------------------------------------------------------------------------------------------
    function createSettings() {
        const tabContainer = document.querySelector('#settings-screen .pc-tab');
        if (!tabContainer) return;
        addModernStyleSheet();

        let tabInput = tabContainer.querySelector('#tab5');
        if (!tabInput) { tabInput = document.createElement('input'); tabInput.id = 'tab5'; tabInput.type = 'radio'; tabInput.name = 'pct'; tabContainer.insertBefore(tabInput, tabContainer.querySelector('nav')); }
        let li = tabContainer.querySelector('nav ul li.tab5');
        if (!li) { li = document.createElement('li'); li.className = 'tab5'; tabContainer.querySelector('nav ul').appendChild(li); }
        li.innerHTML = '';
        const tabLabel = document.createElement('label'); tabLabel.htmlFor = 'tab5'; tabLabel.textContent = t('tabTitle');
        li.appendChild(tabLabel);

        const section = tabContainer.querySelector('section');
        let panel = section.querySelector('div.tab5');
        if (!panel) { panel = document.createElement('div'); panel.className = 'tab5'; section.appendChild(panel); }
        panel.innerHTML = '';

        const container = document.createElement('div');
        container.id = 'lolex-settings'; container.className = 'lolex-settings';

        // ── 0. アップデート ──
        const updateFs = document.createElement('fieldset');
        updateFs.innerHTML = `
            <legend><i class="fas fa-info-circle"></i> ${t('latestUpdates')}</legend>
            <a class="lolex-discord-banner" href="https://discord.gg/Cpu8vFDmH3" target="_blank" rel="noopener noreferrer">
                <svg width="22" height="16" viewBox="0 0 24 18" fill="none"><path d="M20.317 1.492a19.825 19.825 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.295 18.295 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 1.492a.07.07 0 0 0-.032.027C.533 6.093-.32 10.56.099 14.971a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 12.278c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" fill="#7289da"/></svg>
                ${t('discordInvite')}
            </a>
            <div class="lolex-update-text"><p>${t('updateInfo')}</p><span class="lolex-version-badge">v${SCRIPT_VERSION}</span></div>
        `;
        container.appendChild(updateFs);

        // ── 1. 言語 ──
        const langFs = document.createElement('fieldset');
        const currentLang = getLang();
        langFs.innerHTML = `
            <legend><i class="fas fa-language"></i> ${t('language')}</legend>
            <div class="lolex-setting-row">
                <label for="language-switcher" class="setting-name"><i class="fas fa-globe"></i>${t('language')}</label>
                <select id="language-switcher">
                    <option value="ja" ${currentLang === 'ja' ? 'selected' : ''}>日本語</option>
                    <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English</option>
                </select>
            </div>
        `;
        container.appendChild(langFs);

        // ── 2. Air Move ──
        const autoSwitchEnabled = getStoredBool(STORAGE.AIR_MOVE_AUTO);
        const gameFs = document.createElement('fieldset');
        gameFs.innerHTML = `
            <legend><i class="fas fa-cogs"></i> ${t('airMoveAutoSwitch')}</legend>
            <div class="lolex-note"><span>[${t('off')}]</span> ${t('autoSwitchOff')}<br><span>[${t('on')}]</span> ${t('autoSwitchOn')}</div>
        `;
        const autoRow = makeToggleRow('airMoveAutoSwitchToggle', `<i class="fas fa-exchange-alt"></i>${t('enableAutoSwitch')}`, autoSwitchEnabled);
        gameFs.insertBefore(autoRow, gameFs.querySelector('.lolex-note'));
        container.appendChild(gameFs);

        // ── 3. コース別Air Move ──
        const courseFs = document.createElement('fieldset');
        const courseLegend = document.createElement('legend'); courseLegend.innerHTML = `<i class="fas fa-map-signs"></i> ${t('courseSettings')}`;
        courseFs.appendChild(courseLegend);
        COURSES.forEach(({ id, displayName }) => {
            const enabled = getStoredBool(`stopAirMove_${id}`);
            const row = makeToggleRow(`courseAirMoveToggle_${id}`, `<i class="fas fa-bolt"></i>${displayName}`, enabled);
            row.classList.add('lolex-course-row'); row.querySelector('input').dataset.courseId = id;
            courseFs.appendChild(row);
        });
        container.appendChild(courseFs);
        updateCourseLabels();

        // ── 4. 視覚カスタマイズ ──
        const visualFs = document.createElement('fieldset');
        visualFs.innerHTML = `
            <legend><i class="fas fa-paint-brush"></i> ${t('visualCustomization')}</legend>
            <div class="lolex-setting-row">
                <label for="primary-color-picker" class="setting-name"><i class="fas fa-circle" style="color:var(--primary-color);"></i>${t('primaryColor')}</label>
                <input type="color" id="primary-color-picker" value="${getPrimaryColor()}">
            </div>
            <div class="lolex-setting-row">
                <label for="secondary-color-picker" class="setting-name"><i class="fas fa-circle" style="color:var(--secondary-color);"></i>${t('secondaryColor')}</label>
                <input type="color" id="secondary-color-picker" value="${getSecondaryColor()}">
            </div>
            <div class="lolex-setting-row" style="border-bottom:none;">
                <span class="setting-name"><i class="fas fa-image"></i>${t('backgroundColor')}</span>
            </div>
            <div class="lolex-btn-group">
                <button id="background-shuffle-button" class="accent"><i class="fas fa-sync-alt"></i> ${t('shuffleBackground')}</button>
                <button id="lolex-bg-edit-list-button">${t('editList')}</button>
                <button id="background-reset-to-default-button" class="muted">${t('resetToDefault')}</button>
            </div>
            <div class="lolex-note">${t('backgroundNote')}</div>
            <div class="lolex-btn-group" style="border-top:1px solid var(--col-border);padding-top:8px;margin-top:4px;">
                <button id="color-reset-button" class="danger"><i class="fas fa-undo"></i> ${t('resetColors')}</button>
            </div>
        `;
        container.appendChild(visualFs);

        // ── 5. YouTube ──
        const ytFs = document.createElement('fieldset');
        const ytLegend = document.createElement('legend'); ytLegend.innerHTML = `<i class="fab fa-youtube"></i> ${t('ytSettings')}`;
        ytFs.appendChild(ytLegend);

        const hotkeyRow = document.createElement('div'); hotkeyRow.className = 'lolex-setting-row';
        const hotkeyLabel_el = document.createElement('label'); hotkeyLabel_el.className = 'setting-name'; hotkeyLabel_el.innerHTML = `<i class="fas fa-keyboard"></i>${t('ytHotkeyLabel')}`;
        const hotkeyBtn = document.createElement('button'); hotkeyBtn.id = 'yt-hotkey-btn'; hotkeyBtn.textContent = hotkeyLabel(); hotkeyBtn.style.cssText = 'min-width:90px;font-size:0.80em;';
        let _waitingHotkey = false;
        on(hotkeyBtn, { click: () => {
            if (_waitingHotkey) return; _waitingHotkey = true;
            hotkeyBtn.textContent = t('ytHotkeyHint'); hotkeyBtn.style.background = 'var(--secondary-color)'; hotkeyBtn.style.color = '#000';
            const onKey = (e) => {
                if (e.key === 'Escape') { hotkeyBtn.textContent = hotkeyLabel(); hotkeyBtn.style.background = ''; hotkeyBtn.style.color = ''; _waitingHotkey = false; document.removeEventListener('keydown', onKey, { capture: true }); return; }
                if (['Control','Alt','Shift','Meta'].includes(e.key)) return;
                e.preventDefault(); e.stopImmediatePropagation();
                localStorage.setItem(STORAGE.YT_HOTKEY, JSON.stringify({ key: e.key, ctrlKey: e.ctrlKey, altKey: e.altKey, shiftKey: e.shiftKey }));
                applyHotkey(); hotkeyBtn.textContent = hotkeyLabel(); hotkeyBtn.style.background = ''; hotkeyBtn.style.color = ''; _waitingHotkey = false;
                document.removeEventListener('keydown', onKey, { capture: true });
            };
            document.addEventListener('keydown', onKey, { capture: true });
        }});
        hotkeyRow.appendChild(hotkeyLabel_el); hotkeyRow.appendChild(hotkeyBtn); ytFs.appendChild(hotkeyRow);

        const floatRow = document.createElement('div'); floatRow.className = 'lolex-setting-row';
        const floatLabel = document.createElement('label'); floatLabel.className = 'setting-name'; floatLabel.innerHTML = `<i class="fas fa-circle"></i>${t('ytFloatBtn')}`;
        const floatModes = ['show','faint','hide'], floatLabels = [t('ytFloatBtnShow'),t('ytFloatBtnFaint'),t('ytFloatBtnHide')];
        const curMode = localStorage.getItem(STORAGE.FLOAT_BTN) || 'show';
        const floatGroup = document.createElement('div'); floatGroup.style.cssText = 'display:flex;gap:4px;';
        floatModes.forEach((mode, i) => {
            const btn = document.createElement('button'); btn.textContent = floatLabels[i]; btn.style.cssText = 'font-size:0.78em;padding:2px 8px;';
            if (mode === curMode) btn.style.fontWeight = '700';
            on(btn, { click: () => { localStorage.setItem(STORAGE.FLOAT_BTN, mode); applyFloatBtnMode(mode); floatGroup.querySelectorAll('button').forEach((b, j) => { b.style.fontWeight = j === i ? '700' : '400'; }); }});
            floatGroup.appendChild(btn);
        });
        floatRow.appendChild(floatLabel); floatRow.appendChild(floatGroup); ytFs.appendChild(floatRow);

        ytFs.appendChild(makeToggleRow('ytLoopToggle',    `<i class="fas fa-sync-alt"></i>${t('loop')}`,    getStoredBool(STORAGE.LOOP)));
        ytFs.appendChild(makeToggleRow('ytShuffleToggle', `<i class="fas fa-random"></i>${t('shuffle')}`,   getStoredBool(STORAGE.SHUFFLE)));
        const ytNote = document.createElement('div'); ytNote.className = 'lolex-note'; ytNote.textContent = t('ytNote'); ytFs.appendChild(ytNote);
        container.appendChild(ytFs);

        // ── 6. ベストタイム計算 ──
        const btFs = document.createElement('fieldset');
        const btLegend = document.createElement('legend'); btLegend.innerHTML = `<i class="fas fa-stopwatch"></i> ${t('bestTimes')}`;
        btFs.appendChild(btLegend);

        const totalDisplay = document.createElement('div');
        totalDisplay.id = 'lb-total-display'; totalDisplay.className = 'lb-total-display';
        btFs.appendChild(totalDisplay);

        const btBtnGroup = document.createElement('div'); btBtnGroup.className = 'lolex-btn-group';
        const calcBtn = document.createElement('button'); calcBtn.id = 'lb-calc-btn'; calcBtn.className = 'accent'; calcBtn.textContent = t('bestTimesCalc');
        const saveBtn = document.createElement('button'); saveBtn.id = 'lb-save-btn'; saveBtn.textContent = t('bestTimesSave');
        btBtnGroup.appendChild(calcBtn); btBtnGroup.appendChild(saveBtn);
        btFs.appendChild(btBtnGroup);

        const btNote = document.createElement('div'); btNote.className = 'lolex-note'; btNote.textContent = t('bestTimesNote');
        btFs.appendChild(btNote);
        container.appendChild(btFs);

        [[updateFs,'update'],[langFs,'lang'],[gameFs,'airmove'],[courseFs,'course'],[visualFs,'visual'],[ytFs,'yt'],[btFs,'besttimes']].forEach(([fs, key]) => makeCollapsibleFieldset(fs, key));

        panel.appendChild(container);
        bindSettingsEvents();
    }

    function bindSettingsEvents() {
        $('language-switcher')?.addEventListener('change', (e) => { localStorage.setItem(STORAGE.LANGUAGE, e.target.value); invalidateLangCache(); createSettings(); updateProfileUILang(); });
        $('airMoveAutoSwitchToggle')?.addEventListener('change', (e) => { setStoredBool(STORAGE.AIR_MOVE_AUTO, e.target.checked); });
        COURSES.forEach(({ id }) => {
            const cb = document.getElementById(`courseAirMoveToggle_${id}`);
            if (cb && !cb.dataset.lolexBound) { cb.addEventListener('change', (e) => { setStoredBool(`stopAirMove_${id}`, e.target.checked); updateCourseLabels(id); }); cb.dataset.lolexBound = 'true'; }
        });
        $('lolex-bg-edit-list-button')?.addEventListener('click', showBackgroundModal);
        $('background-reset-to-default-button')?.addEventListener('click', () => { if (!confirm(t('resetListConfirm'))) return; localStorage.setItem(STORAGE.BG_LIST, DEFAULT.BG_URLS.join('\n')); applyCustomBackground(true); });
        $('background-shuffle-button')?.addEventListener('click', () => { applyCustomBackground(true); });
        $('primary-color-picker')?.addEventListener('input', (e) => { localStorage.setItem(STORAGE.PRIMARY_COLOR, e.target.value); applyColorTheme(e.target.value, getSecondaryColor()); updateCourseLabels(); });
        $('secondary-color-picker')?.addEventListener('input', (e) => { localStorage.setItem(STORAGE.SECONDARY_COLOR, e.target.value); applyColorTheme(getPrimaryColor(), e.target.value); updateCourseLabels(); });
        $('color-reset-button')?.addEventListener('click', resetColors);
        $('ytLoopToggle')?.addEventListener('change', (e) => { setStoredBool(STORAGE.LOOP, e.target.checked); try { if (player) player.setLoop(e.target.checked); } catch (_) {} });
        $('ytShuffleToggle')?.addEventListener('change', (e) => { setStoredBool(STORAGE.SHUFFLE, e.target.checked); });
        $('lb-calc-btn')?.addEventListener('click', fetchBestTimes);
        $('lb-save-btn')?.addEventListener('click', saveTimesAsImage);
    }

    // ------------------------------------------------------------------------------------------------
    //  console.log フック / マップロード処理
    // ------------------------------------------------------------------------------------------------
    function hookConsoleLog() {
        const originalLog = unsafeWindow.console.log;
        if (originalLog._lolexHooked) return;
        unsafeWindow.console.log = function (...args) {
            try { if (args[0] === 'Loading map' && typeof args[1] === 'string') handleMapLoad(String(args[1])); } catch (_) {}
            return originalLog.apply(unsafeWindow.console, args);
        };
        unsafeWindow.console.log._lolexHooked = true;
    }

    let _pendingNextRoundLabel = null, _nextRoundObserver = null;

    function handleMapLoad(mapName) {
        if (getStoredBool(STORAGE.AIR_MOVE_AUTO)) {
            const course = COURSES.find(c => mapName.toLowerCase().includes(c.keyword.toLowerCase()));
            const id = course ? course.id : mapName.toLowerCase().replace(/\s+/g, '-');
            clickAirMoveRadio(getStoredBool(`stopAirMove_${id}`));
        }
        const course = COURSES.find(c => mapName.toLowerCase().includes(c.keyword.toLowerCase()));
        _pendingNextRoundLabel = `${t('nextRound')} ${course ? course.message : mapName}`;
        _tryInjectNextRoundLabel();
        _startNextRoundObserver();
    }

    function _tryInjectNextRoundLabel() {
        if (!_pendingNextRoundLabel) return;
        const header = document.getElementById('end-match-header');
        if (header) _injectLabel(header, 'next-round-display-header', _pendingNextRoundLabel, { fontSize: '14px', color: '#fff', marginTop: '8px', textAlign: 'center' });
        const deathSection = document.querySelector('#death-screen .top-section');
        if (deathSection) _injectLabel(deathSection, 'next-round-display-death', _pendingNextRoundLabel, { fontSize: '1.5rem', color: '#fff', textAlign: 'center', fontWeight: 'bold', paddingTop: '50px', textShadow: '2px 2px 4px rgba(0,0,0,0.7)' });
    }

    function _injectLabel(parent, id, text, styles) {
        let elem = document.getElementById(id);
        if (!elem) { elem = document.createElement('div'); elem.id = id; Object.assign(elem.style, styles); parent.appendChild(elem); }
        elem.textContent = text;
    }

    function _startNextRoundObserver() {
        if (_nextRoundObserver) return;
        _nextRoundObserver = new MutationObserver(() => {
            if (!_pendingNextRoundLabel) { _nextRoundObserver.disconnect(); _nextRoundObserver = null; return; }
            _tryInjectNextRoundLabel();
            if (document.getElementById('next-round-display-header') && document.getElementById('next-round-display-death')) { _nextRoundObserver.disconnect(); _nextRoundObserver = null; }
        });
        _nextRoundObserver.observe(document.body, { childList: true, subtree: true });
    }

    let _hotkeyHandler = null;
    function setupHotkey() { applyHotkey(); }
    function applyHotkey() {
        if (_hotkeyHandler) { document.removeEventListener('keydown', _hotkeyHandler, { capture: true }); window.removeEventListener('keydown', _hotkeyHandler, { capture: true }); _hotkeyHandler = null; }
        const stored = localStorage.getItem(STORAGE.YT_HOTKEY);
        const cfg = stored ? JSON.parse(stored) : { key: 'm', ctrlKey: true, altKey: false, shiftKey: false };
        _hotkeyHandler = (e) => {
            const match = e.key.toLowerCase() === cfg.key.toLowerCase() && !!e.ctrlKey === !!cfg.ctrlKey && !!e.altKey === !!cfg.altKey && !!e.shiftKey === !!cfg.shiftKey;
            if (!match) return;
            e.preventDefault(); e.stopImmediatePropagation(); toggleYouTubeVisibility();
        };
        document.addEventListener('keydown', _hotkeyHandler, { capture: true });
        window.addEventListener('keydown',   _hotkeyHandler, { capture: true });
    }

    function hotkeyLabel() {
        const stored = localStorage.getItem(STORAGE.YT_HOTKEY);
        const cfg = stored ? JSON.parse(stored) : { key: 'm', ctrlKey: true, altKey: false, shiftKey: false };
        const mods = [cfg.ctrlKey ? 'Ctrl' : '', cfg.altKey ? 'Alt' : '', cfg.shiftKey ? 'Shift' : ''].filter(Boolean);
        return [...mods, cfg.key.toUpperCase()].join('+') || t('ytHotkeyNone');
    }

    // ------------------------------------------------------------------------------------------------
    //  初期化
    // ------------------------------------------------------------------------------------------------
    function init() {
        if (!document.querySelector('#settings-screen .pc-tab')) return;
        if (initCompleted) { if (document.getElementById('lolex-settings')) bindSettingsEvents(); return; }
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
        setTimeout(() => { initYouTubePlayerUI(); }, 1000);
        window.addEventListener('beforeunload', saveTime);
        document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveTime(); });
    }

    // ------------------------------------------------------------------------------------------------
    //  プロフィール画面 ベストタイムUI (profile-panel への直接挿入)
    // ------------------------------------------------------------------------------------------------
    function insertProfileUI() {
        const panel = document.getElementById('profile-panel');
        if (!panel || document.getElementById('lb-profile-calc-btn')) return;

        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;gap:6px;justify-content:center;margin:8px 0 4px;';

        const calcBtn = document.createElement('button');
        calcBtn.id = 'lb-profile-calc-btn';
        calcBtn.textContent = t('bestTimesCalc');
        calcBtn.style.cssText = 'padding:5px 12px;font-weight:700;font-size:12px;border:none;border-radius:6px;cursor:pointer;background:linear-gradient(135deg,#f97316,#fb923c);color:#fff;white-space:nowrap;';

        const saveBtn = document.createElement('button');
        saveBtn.id = 'lb-profile-save-btn';
        saveBtn.textContent = t('bestTimesSave');
        saveBtn.style.cssText = 'padding:5px 12px;font-weight:700;font-size:12px;border:none;border-radius:6px;cursor:pointer;background:linear-gradient(135deg,#3b82f6,#60a5fa);color:#fff;white-space:nowrap;';

        btnRow.appendChild(calcBtn);
        btnRow.appendChild(saveBtn);

        const totalEl = document.createElement('div');
        totalEl.id = 'lb-profile-total';
        totalEl.style.cssText = 'text-align:center;font-size:13px;font-weight:bold;color:#4ade80;margin:2px 0 6px;min-height:18px;';

        const wrapper = document.getElementById('best-times-wrapper');
        if (wrapper) {
            panel.insertBefore(totalEl,  wrapper);
            panel.insertBefore(btnRow,   totalEl);
        } else {
            panel.appendChild(btnRow);
            panel.appendChild(totalEl);
        }

        calcBtn.addEventListener('click', () => {
            const sessionId = getSessionId();
            if (!sessionId) { totalEl.style.color = '#f87171'; totalEl.textContent = t('bestTimesNoSession'); return; }
            calcBtn.disabled = true; calcBtn.textContent = t('bestTimesLoading');
            totalEl.style.color = '#94a3b8'; totalEl.textContent = t('bestTimesLoading');
            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://s.lolbeans.io/my-stats?s=${encodeURIComponent(sessionId)}`,
                onload: (res) => {
                    calcBtn.disabled = false; calcBtn.textContent = t('bestTimesCalc');
                    if (res.status !== 200) { totalEl.style.color = '#f87171'; totalEl.textContent = `${t('bestTimesError')} HTTP ${res.status}`; return; }
                    let json; try { json = JSON.parse(res.responseText); } catch { totalEl.style.color = '#f87171'; totalEl.textContent = t('bestTimesError'); return; }
                    if (!json.records || !Array.isArray(json.records)) { totalEl.style.color = '#f87171'; totalEl.textContent = t('bestTimesError'); return; }
                    const best  = getBestTimes(json.records);
                    const total = Object.values(best).reduce((s, d) => s + d.time, 0);
                    totalEl.style.color = '#4ade80';
                    totalEl.textContent = `${t('bestTimesTotal')}: ${total.toFixed(3)}s（${Object.keys(best).length} maps）`;
                },
                onerror: () => { calcBtn.disabled = false; calcBtn.textContent = t('bestTimesCalc'); totalEl.style.color = '#f87171'; totalEl.textContent = t('bestTimesError'); },
            });
        });

        saveBtn.addEventListener('click', () => {
            saveBtn.disabled = true; saveBtn.textContent = t('bestTimesSaving');
            // collectThumbnails / saveTimesAsImage を流用（lb-total-display の代わりに lb-profile-total を参照）
            (async () => {
                const thumbs = collectThumbnails();
                const COLS=4,CARD_W=200,CARD_H=130,THUMB_H=90,PAD=12,HEADER_H=60,FOOTER_H=50;
                const ROWS=Math.ceil(thumbs.length/COLS);
                const W=COLS*CARD_W+(COLS+1)*PAD, H=HEADER_H+ROWS*(CARD_H+PAD)+PAD+FOOTER_H;
                const canvas=document.createElement('canvas'); canvas.width=W; canvas.height=H;
                const ctx=canvas.getContext('2d');
                ctx.fillStyle='#1e293b'; ctx.fillRect(0,0,W,H);
                ctx.fillStyle='#f97316'; ctx.fillRect(0,0,W,HEADER_H);
                ctx.fillStyle='#fff'; ctx.font='bold 22px sans-serif'; ctx.textAlign='center';
                ctx.fillText('🏆 LolBeans Best Times',W/2,38);
                const totalText = totalEl.textContent || '';
                ctx.fillStyle='#0f172a'; ctx.fillRect(0,H-FOOTER_H,W,FOOTER_H);
                ctx.fillStyle='#4ade80'; ctx.font='bold 18px sans-serif'; ctx.textAlign='center';
                ctx.fillText(totalText||'---',W/2,H-16);
                const images=await Promise.all(thumbs.map(th=>th.imgSrc?loadImage(th.imgSrc):Promise.resolve(null)));
                thumbs.forEach((thumb,i)=>{
                    const col=i%COLS,row=Math.floor(i/COLS);
                    const x=PAD+col*(CARD_W+PAD),y=HEADER_H+PAD+row*(CARD_H+PAD);
                    ctx.fillStyle='#334155'; roundRect(ctx,x,y,CARD_W,CARD_H,8); ctx.fill();
                    const img=images[i];
                    if(img){ctx.save();roundRect(ctx,x,y,CARD_W,THUMB_H,8);ctx.clip();const scale=Math.max(CARD_W/img.width,THUMB_H/img.height);ctx.drawImage(img,x+(CARD_W-img.width*scale)/2,y+(THUMB_H-img.height*scale)/2,img.width*scale,img.height*scale);ctx.restore();}
                    else{ctx.fillStyle='#475569';ctx.fillRect(x,y,CARD_W,THUMB_H);}
                    ctx.fillStyle='rgba(15,23,42,0.85)';ctx.fillRect(x,y+THUMB_H,CARD_W,CARD_H-THUMB_H);
                    ctx.fillStyle='#e2e8f0';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText(thumb.name,x+CARD_W/2,y+THUMB_H+16,CARD_W-8);
                    ctx.fillStyle='#fbbf24';ctx.font='13px monospace';ctx.fillText(thumb.time,x+CARD_W/2,y+THUMB_H+34,CARD_W-8);
                });
                const link=document.createElement('a'); link.download='lolbeans-best-times.png'; link.href=canvas.toDataURL('image/png'); link.click();
                saveBtn.disabled=false; saveBtn.textContent=t('bestTimesSave');
            })();
        });
    }

    function updateProfileUILang() {
        const cb = document.getElementById('lb-profile-calc-btn');
        const sb = document.getElementById('lb-profile-save-btn');
        if (cb) cb.textContent = t('bestTimesCalc');
        if (sb) sb.textContent = t('bestTimesSave');
    }

        function tryInsertProfileUI() {
        if (document.getElementById('profile-panel')) { insertProfileUI(); return; }
        const obs = new MutationObserver(() => {
            if (document.getElementById('profile-panel')) { obs.disconnect(); insertProfileUI(); }
        });
        obs.observe(document.body, { childList: true, subtree: true });
    }

    function initializeScript() {
        if (document.body) { init(); tryInsertProfileUI(); }
        const observer = new MutationObserver(() => {
            if (document.querySelector('#settings-screen .pc-tab')) { observer.disconnect(); init(); }
        });
        if (document.body) observer.observe(document.body, { childList: true, subtree: true });
        else document.addEventListener('DOMContentLoaded', () => { observer.observe(document.body, { childList: true, subtree: true }); init(); tryInsertProfileUI(); });
    }

    initializeScript();

})();
