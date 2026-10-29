// ==UserScript==
// @name         LOL.ex ver0.91
// @namespace    http://tampermonkey.net/
// @version      0.91
// @description  LOLBeans extension
// @author       ユウキ / Yuki
// @match        https://lolbeans.io/*
// @match        https://bean.lol/*
// @match        https://obby.lol/*
// @match        https://s.lolbeans.io/*
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @connect      s.lolbeans.io
// @connect      translate.googleapis.com
// @run-at       document-start
// @updateURL    https://tanabesan.github.io/lolbeans/lolex/main.user.js
// @downloadURL  https://tanabesan.github.io/lolbeans/lolex//main.user.js
// ==/UserScript==

(function () {
    'use strict';

    const SCRIPT_VERSION = '0.91';

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
        YT_ENABLED:     'lolex-yt-enabled',
        // ★ キー表示機能
        KEYDISPLAY_ENABLED: 'lolex-keydisplay-enabled',
        KEYDISPLAY_KEYS:    'lolex-keydisplay-keys',
        KEYDISPLAY_POS:     'lolex-keydisplay-pos',
        // ★ チャット自動翻訳
        CHAT_TR:            'lolex-chat-translate',
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
        // ★ キー表示機能のデフォルトキー一覧 (WASD + Space + マウス左右)
        KEYDISPLAY_KEYS: [
            { code: 'KeyW',      label: 'W' },
            { code: 'KeyA',      label: 'A' },
            { code: 'KeyS',      label: 'S' },
            { code: 'KeyD',      label: 'D' },
            { code: 'Space',     label: 'SPACE' },
            { code: 'MouseLeft', label: 'L' },
            { code: 'MouseRight',label: 'R' },
        ],
    };

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
        { id: 'neon-city',     keyword: 'NeonCity',           message: '🏢 Neon City 👾',          displayName: 'Neon City' },
        { id: 'polar-path',    keyword: 'PolarPath',          message: '🧊 Polar Path 🧊',         displayName: 'Polar Path' },
        { id: '123-red-light', keyword: 'RedLightGreenLight', message: '🦑 1-2-3 Red Light 🦑',    displayName: '1-2-3 Red Light' },
        { id: 'nasty-seals',   keyword: 'NastySeals',         message: '🦑 Nasty Seals 🦑',        displayName: 'Nasty Seals' },
        { id: 'rickety-run',   keyword: 'RicketyRun',         message: '🟦 Rickety Run 🟪',        displayName: 'Rickety Run' },
        { id: 'risky-cliffs',  keyword: 'RiskyCliffs',        message: '🎅 Risky Cliffs 🎅',       displayName: 'Risky Cliffs' },
        { id: 'shark-park',    keyword: 'SharkPark',          message: '🦈 Shark Park 🦈',         displayName: 'Shark Park' },
        { id: 'silly-slide',   keyword: 'SillySlide',         message: '🛝 Silly Slide 🛝',        displayName: 'Silly Slide' },
        { id: 'spiky-slopes',  keyword: 'SpikySlopes',        message: '🔨 Spiky Slopes 🔨',       displayName: 'Spiky Slopes' },
        { id: 'splash-dash',   keyword: 'SplashDash',         message: '🏊 Splash Dash 🏊',        displayName: 'Splash Dash' },
        { id: 'tumble-town',   keyword: 'TumbleTown',         message: '✋ Tumble Town ✋',        displayName: 'Tumble Town' },
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
            updateInfo:          '・簡易メニューを追加しました(PC: Alt+Q / スマホ: 画面右端から左へスワイプ)。<br>・YouTube BGMプレイヤーの機能自体をオフにできるようにしました。<br>・スマホでも使いやすいように、設定画面とプレイヤーの表示を調整しました。<br>・常に保存がオフのとき、録画の開始と停止保存を手動でできるようにしました。<br>・一人称視点は固定設定のON/OFFのみになりました(FOV変更は廃止)。<br>・設定画面をカード形式に刷新し、カテゴリ別のタブに整理しました。<br>・ベストタイム計算とサムネイル付きタイム一覧のPNG保存に対応しています。',
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
            ytEnable:            'YouTube BGMプレイヤーを使う',
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
            // ★ キー表示機能
            keyDisplaySettings:  'キー/マウス入力表示',
            keyDisplayEnable:    '入力表示を有効化',
            keyDisplayEnableNote:'ゲーム画面に押しているキー・マウスボタンをリアルタイム表示します。',
            keyDisplayKeysLabel: '表示するキー一覧',
            keyDisplayAddKey:    'キーを追加',
            keyDisplayWaiting:   'キー入力待ち... (Escで中止)',
            keyDisplayMouseHint: 'マウスの左右クリックもキーの代わりに登録できます。',
            keyDisplayResetDefault: 'デフォルトに戻す',
            keyDisplayPosition:  '表示位置',
            posBottomLeft:       '左下',
            posBottomRight:      '右下',
            posTopLeft:          '左上',
            posTopRight:         '右上',
            // ★ ゲーム演出 (v0.86)
            modsViewTitle:       '視点',
            modsFpv:             '一人称視点',
            modsFpvEye:          '目の高さ',
            modsFpvFwd:          '目の前後位置',
            modsFpvHideHead:     '自分の頭を隠す',
            modsFovOn:           'FOV制限を解除して指定値を使う',
            modsViewNote:        '見た目だけの機能で、自分の画面にしか反映されません。Alt+V でも切り替えできます。',
            modsFxTitle:         '画面演出・キャラ',
            modsFlipX:           '画面を左右反転',
            modsFlipY:           '画面を上下反転',
            modsRot:             '画面の回転',
            modsSpin:            'ぐるぐる回転 (度/秒)',
            modsFilter:          '色フィルター',
            modsFNone:           'なし',
            modsFGray:           '白黒',
            modsFSepia:          'セピア',
            modsFNeon:           'ネオン',
            modsFInvert:         '反転色',
            modsFCold:           '寒色',
            modsFPsyche:         'サイケ',
            modsFDrunk:          '酔っぱらい',
            modsPixel:           'ドット絵 (描画解像度)',
            modsTarget:          'キャラ拡大の対象',
            modsTargetMe:        '自分だけ',
            modsTargetAll:       '全員',
            modsHead:            '頭の大きさ',
            modsHand:            '手の大きさ',
            modsFoot:            '足の大きさ',
            modsFxReset:         '演出をリセット',
            modsFxNote:          '画面の反転・回転・色フィルターは録画には入りません(ドット絵は入ります)。',
            modsReplayTitle:     'インスタントリプレイ',
            modsReplayEnable:    '常に直近の映像を録画しておく',
            modsReplayMin:       '最低保持秒数',
            modsReplayBitrate:   '画質 (ビットレート)',
            modsReplayUI:        'ゲームのUIも映像に合成する',
            modsReplayStatus:    '状態',
            modsReplaySave:      '今すぐ保存',
            modsReplayStart:     '録画を開始',
            modsReplayStopSave:  '録画を停止して保存',
            modsReplayRecStarted:'リプレイ: 録画を開始しました',
            modsReplayNote:      'Alt+S で「さっきの映像」をWebMで保存します。保存される長さは 最低保持秒数〜その2倍 です。常に保存がオフのときは、Alt+S / ボタンで録画の開始・停止保存ができます。音は入りません。',
            modsReplayNotRec:    'リプレイ: 録画していません',
            modsReplaySaved:     'リプレイ保存',
            // ★ 設定カテゴリ (v0.87)
            catInfo:             '情報・言語',
            catGame:             'ゲーム補助',
            catLook:             '見た目・表示',
            chatTrTitle:         'チャット自動翻訳',
            chatTrEnable:        'チャットを自動翻訳する',
            chatTrNote:          '選択中の言語(日本語 / English)以外の発言を、その言語に翻訳して発言の下に表示します。すでにその言語の発言は翻訳しません。翻訳にはGoogle翻訳を利用します。',
            catMusic:            '音楽',
            catView:             '視点・演出',
            catRec:              '録画',
            catHelp:             '使い方',
        },
        en: {
            tabTitle:            `LOL.ex v${SCRIPT_VERSION}`,
            discordInvite:       'Join Discord Server',
            latestUpdates:       'Latest Updates',
            updateInfo:          '・Added a quick menu (PC: Alt+Q / mobile: swipe left from the right screen edge).<br>・The YouTube BGM player can now be turned off entirely.<br>・Settings and the player were adjusted to work better on phones.<br>・With always-on replay off, you can start and stop-save a recording manually.<br>・First-person view is now a fixed ON/OFF setting (FOV option removed).<br>・Settings were redesigned as cards and organized into category tabs.<br>・Best time calculator and PNG export of the time list with thumbnails are supported.',
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
            ytEnable:            'Enable YouTube BGM player',
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
            // ★ Key display feature
            keyDisplaySettings:  'Key / Mouse Input Display',
            keyDisplayEnable:    'Enable Input Display',
            keyDisplayEnableNote:'Shows the keys and mouse buttons you press in real time on screen.',
            keyDisplayKeysLabel: 'Keys to Display',
            keyDisplayAddKey:    'Add Key',
            keyDisplayWaiting:   'Waiting for input... (Esc to cancel)',
            keyDisplayMouseHint: 'You can also register left/right mouse clicks instead of a key.',
            keyDisplayResetDefault: 'Reset to Default',
            keyDisplayPosition:  'Display Position',
            posBottomLeft:       'Bottom Left',
            posBottomRight:      'Bottom Right',
            posTopLeft:          'Top Left',
            posTopRight:         'Top Right',
            // ★ Game effects (v0.86)
            modsViewTitle:       'View',
            modsFpv:             'First-person view',
            modsFpvEye:          'Eye height',
            modsFpvFwd:          'Eye forward offset',
            modsFpvHideHead:     'Hide own head',
            modsFovOn:           'Unlock FOV limit and use the value below',
            modsViewNote:        'Visual only; affects your own screen only. Alt+V also toggles it.',
            modsFxTitle:         'Screen effects & Character',
            modsFlipX:           'Flip screen horizontally',
            modsFlipY:           'Flip screen vertically',
            modsRot:             'Screen rotation',
            modsSpin:            'Spin (deg/sec)',
            modsFilter:          'Color filter',
            modsFNone:           'None',
            modsFGray:           'Grayscale',
            modsFSepia:          'Sepia',
            modsFNeon:           'Neon',
            modsFInvert:         'Invert',
            modsFCold:           'Cold',
            modsFPsyche:         'Psychedelic',
            modsFDrunk:          'Drunk',
            modsPixel:           'Pixel art (render resolution)',
            modsTarget:          'Character scaling target',
            modsTargetMe:        'Me only',
            modsTargetAll:       'Everyone',
            modsHead:            'Head size',
            modsHand:            'Hand size',
            modsFoot:            'Foot size',
            modsFxReset:         'Reset effects',
            modsFxNote:          'Flip / rotation / color filters are not included in recordings (pixel art is).',
            modsReplayTitle:     'Instant Replay',
            modsReplayEnable:    'Keep recording the most recent footage',
            modsReplayMin:       'Minimum kept length',
            modsReplayBitrate:   'Quality (bitrate)',
            modsReplayUI:        'Include game UI in the video',
            modsReplayStatus:    'Status',
            modsReplaySave:      'Save now',
            modsReplayStart:     'Start recording',
            modsReplayStopSave:  'Stop & save',
            modsReplayRecStarted:'Replay: recording started',
            modsReplayNote:      'Alt+S saves the recent footage as WebM. Saved length is between the minimum and twice that. When always-on is off, Alt+S / the button starts and stops a manual recording. No audio.',
            modsReplayNotRec:    'Replay: not recording',
            modsReplaySaved:     'Replay saved',
            // ★ Settings categories (v0.87)
            catInfo:             'Info',
            catGame:             'Game Helpers',
            catLook:             'Appearance',
            chatTrTitle:         'Chat Auto-Translate',
            chatTrEnable:        'Auto-translate chat messages',
            chatTrNote:          'Messages written in a language other than the one selected above (English / 日本語) are translated into it and shown under the message. Messages already in that language are left alone. Uses Google Translate.',
            catMusic:            'Music',
            catView:             'View & Effects',
            catRec:              'Recording',
            catHelp:             'Guide',
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

    // ── 共通化: ベストタイム取得 & 表示更新 ──
    // displayEl に結果テキストを表示し、buttonEl の disabled/textContent を制御する
    function fetchAndDisplayBestTimes(displayEl, buttonEl) {
        const sessionId = getSessionId();
        const setState = (text, color) => { if (displayEl) { displayEl.textContent = text; displayEl.style.color = color; } };

        if (!sessionId) { setState(t('bestTimesNoSession'), '#f87171'); return; }

        if (buttonEl) { buttonEl.disabled = true; buttonEl.textContent = t('bestTimesLoading'); }
        setState(t('bestTimesLoading'), '#94a3b8');

        GM_xmlhttpRequest({
            method: 'GET',
            url: `https://s.lolbeans.io/my-stats?s=${encodeURIComponent(sessionId)}`,
            onload: (res) => {
                if (buttonEl) { buttonEl.disabled = false; buttonEl.textContent = t('bestTimesCalc'); }
                if (res.status !== 200) { setState(`${t('bestTimesError')} HTTP ${res.status}`, '#f87171'); return; }
                let json;
                try { json = JSON.parse(res.responseText); } catch { setState(t('bestTimesError'), '#f87171'); return; }
                if (!json.records || !Array.isArray(json.records)) { setState(t('bestTimesError'), '#f87171'); return; }
                const best  = getBestTimes(json.records);
                const total = Object.values(best).reduce((s, d) => s + d.time, 0);
                const count = Object.keys(best).length;
                setState(`${t('bestTimesTotal')}: ${total.toFixed(3)}s（${count} maps）`, '#4ade80');
            },
            onerror: () => {
                if (buttonEl) { buttonEl.disabled = false; buttonEl.textContent = t('bestTimesCalc'); }
                setState(t('bestTimesError'), '#f87171');
            },
        });
    }

    // ── 共通化: サムネイル付きベストタイム画像を生成してダウンロード ──
    // totalText には表示中の合計テキスト (displayEl.textContent 相当) を渡す
    async function renderBestTimesImage(totalText) {
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

        ctx.fillStyle = '#0f172a'; ctx.fillRect(0, H - FOOTER_H, W, FOOTER_H);
        ctx.fillStyle = '#4ade80'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(totalText || '---', W / 2, H - 16);

        const images = await Promise.all(thumbs.map(th => th.imgSrc ? loadImage(th.imgSrc) : Promise.resolve(null)));

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
    }

    // ── 共通化: 保存ボタンのクリックハンドラ本体 (disabled/textContent制御込み) ──
    async function saveTimesAsImage(buttonEl, totalText) {
        if (buttonEl) { buttonEl.disabled = true; buttonEl.textContent = t('bestTimesSaving'); }
        await renderBestTimesImage(totalText);
        if (buttonEl) { buttonEl.disabled = false; buttonEl.textContent = t('bestTimesSave'); }
    }

    function fetchBestTimes() {
        fetchAndDisplayBestTimes($('lb-total-display'), $('lb-calc-btn'));
    }

    // ------------------------------------------------------------------------------------------------
    //  ★ キー/マウス入力表示機能
    // ------------------------------------------------------------------------------------------------
    function getKeyDisplayKeys() {
        try {
            const raw = localStorage.getItem(STORAGE.KEYDISPLAY_KEYS);
            if (!raw) return DEFAULT.KEYDISPLAY_KEYS.map(k => ({ ...k }));
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            return DEFAULT.KEYDISPLAY_KEYS.map(k => ({ ...k }));
        } catch (_) { return DEFAULT.KEYDISPLAY_KEYS.map(k => ({ ...k })); }
    }

    function setKeyDisplayKeys(list) {
        localStorage.setItem(STORAGE.KEYDISPLAY_KEYS, JSON.stringify(list));
    }

    function getKeyDisplayPos() { return localStorage.getItem(STORAGE.KEYDISPLAY_POS) || 'bottom-left'; }

    // code(KeyboardEvent.code / 'MouseLeft' / 'MouseRight' / 'MouseMiddle') → 表示ラベル
    function labelForCode(code) {
        if (code === 'MouseLeft')   return 'L';
        if (code === 'MouseRight')  return 'R';
        if (code === 'MouseMiddle') return 'M';
        if (code === 'Space')       return 'SPACE';
        if (code.startsWith('Key'))   return code.slice(3);
        if (code.startsWith('Digit')) return code.slice(5);
        if (code.startsWith('Arrow')) return { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' }[code] || code;
        const map = {
            ShiftLeft: 'SHIFT', ShiftRight: 'SHIFT', ControlLeft: 'CTRL', ControlRight: 'CTRL',
            AltLeft: 'ALT', AltRight: 'ALT', Tab: 'TAB', Enter: 'ENTER', Escape: 'ESC',
            CapsLock: 'CAPS', Backquote: '`',
        };
        return map[code] || code.replace(/^Key|^Digit/, '').toUpperCase();
    }

    function isMouseCode(code) { return code === 'MouseLeft' || code === 'MouseRight' || code === 'MouseMiddle'; }

    // ★ 実際のキーボード配列に近い座標テーブル (row: 段, col: 列 [1キー=1単位, 段ズレ込み], w: 幅[単位])
    const KEY_GRID_POS = (() => {
        const map = {};
        const set = (code, row, col, w = 1) => { map[code] = { row, col, w }; };
        // 数字段
        ['Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','Digit0'].forEach((c, i) => set(c, 0, i));
        // QWERTY段
        ['KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP'].forEach((c, i) => set(c, 1, 0.5 + i));
        // ASDF段
        ['KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL'].forEach((c, i) => set(c, 2, 0.8 + i));
        // ZXCV段
        ['KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM'].forEach((c, i) => set(c, 3, 1.3 + i));
        // モディファイア・特殊キー
        set('Tab',         1, -0.8, 1.3);
        set('CapsLock',    2, -0.5, 1.5);
        set('Enter',       2, 9.3,  1.6);
        set('ShiftLeft',   3, -0.7, 1.6);
        set('ShiftRight',  3, 8.3,  1.6);
        set('ControlLeft', 4, -0.7, 1.2);
        set('AltLeft',     4, 0.7,  1.2);
        set('AltRight',    4, 5.5,  1.2);
        set('ControlRight',4, 6.9,  1.2);
        set('Space',       4, 2.1,  6);
        set('Backquote',   0, -1.2, 1);
        set('Minus',       0, 10,   1);
        set('Equal',       0, 11,   1);
        set('Escape',      -1, -0.8, 1.2);
        // 矢印キー (右下クラスタ)
        set('ArrowUp',    3, 13.6, 1);
        set('ArrowLeft',  4, 12.6, 1);
        set('ArrowDown',  4, 13.6, 1);
        set('ArrowRight', 4, 14.6, 1);
        return map;
    })();

    function addKeyDisplayStyleSheet() {
        if (document.getElementById('lolex-keydisplay-style')) return;
        const style = document.createElement('style');
        style.id = 'lolex-keydisplay-style';
        style.textContent = `
            #lolex-keydisplay { position: fixed; z-index: 9996; display: flex; gap: 14px; align-items: flex-end; pointer-events: none; user-select: none; }
            #lolex-keydisplay.pos-bottom-left  { left: 18px; bottom: 18px; }
            #lolex-keydisplay.pos-bottom-right { right: 18px; bottom: 18px; flex-direction: row-reverse; }
            #lolex-keydisplay.pos-top-left     { left: 18px; top: 70px; }
            #lolex-keydisplay.pos-top-right    { right: 18px; top: 70px; flex-direction: row-reverse; }
            #lolex-keydisplay.lolex-kd-hidden  { display: none !important; }

            #lolex-kd-grid { position: relative; }
            #lolex-kd-loose { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; max-width: 120px; }

            .lolex-key-box {
                position: absolute; box-sizing: border-box; border-radius: 7px;
                background: rgba(10,10,18,0.72); border: 1.5px solid rgba(255,255,255,0.18);
                color: rgba(255,255,255,0.72); font-family: 'Segoe UI', sans-serif; font-weight: 800;
                font-size: 12px; display: flex; align-items: center; justify-content: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.45); backdrop-filter: blur(3px);
                transition: transform 0.08s ease, background 0.08s ease, border-color 0.08s ease, box-shadow 0.08s ease, color 0.08s ease;
            }
            .lolex-key-box.lolex-key-loose { position: static; min-width: 30px; height: 30px; padding: 0 5px; }
            .lolex-key-box.lolex-key-pressed {
                background: var(--secondary-color, #03DAC6); color: #05050a;
                border-color: var(--secondary-color, #03DAC6); transform: scale(0.90) translateY(2px);
                box-shadow: 0 0 14px var(--secondary-color, #03DAC6), 0 0 2px #fff inset;
            }

            /* マウス型シルエット表示 */
            .lolex-mouse-body {
                position: relative; width: 46px; height: 68px; border-radius: 23px 23px 12px 12px;
                background: rgba(10,10,18,0.55); border: 1.5px solid rgba(255,255,255,0.18);
                box-shadow: 0 2px 8px rgba(0,0,0,0.45); backdrop-filter: blur(3px);
                display: flex; overflow: hidden;
            }
            .lolex-mouse-half {
                flex: 1; display: flex; align-items: flex-start; justify-content: center;
                padding-top: 7px; color: rgba(255,255,255,0.6); font-weight: 800; font-size: 11px;
                font-family: 'Segoe UI', sans-serif; transition: background 0.08s ease, color 0.08s ease;
            }
            .lolex-mouse-half.lolex-key-pressed { background: var(--secondary-color, #03DAC6); color: #05050a; }
            .lolex-mouse-half:first-child { border-right: 1px solid rgba(255,255,255,0.14); border-radius: 23px 0 0 0; }
            .lolex-mouse-half:last-child  { border-radius: 0 23px 0 0; }
            .lolex-mouse-wheel { position: absolute; top: 6px; left: 50%; transform: translateX(-50%); width: 6px; height: 14px; border-radius: 3px; background: rgba(255,255,255,0.25); transition: background 0.08s ease; }
            .lolex-mouse-wheel.lolex-key-pressed { background: var(--secondary-color, #03DAC6); }
        `;
        document.head.appendChild(style);
    }

    const _keyDisplayPressed = new Set();

    const KD_UNIT_X = 34, KD_UNIT_Y = 34, KD_GAP = 3;

    function buildKeyDisplayUI() {
        addKeyDisplayStyleSheet();
        let container = $('lolex-keydisplay');
        if (container) container.remove();
        container = el('div', { id: 'lolex-keydisplay' });
        container.classList.add('pos-' + getKeyDisplayPos());
        if (!getStoredBool(STORAGE.KEYDISPLAY_ENABLED, true)) container.classList.add('lolex-kd-hidden');

        const keys = getKeyDisplayKeys();
        const mouseKeys = keys.filter(k => isMouseCode(k.code));
        const gridKeys  = keys.filter(k => !isMouseCode(k.code) && KEY_GRID_POS[k.code]);
        const looseKeys = keys.filter(k => !isMouseCode(k.code) && !KEY_GRID_POS[k.code]);

        // ── キーボード配列クラスター ──
        if (gridKeys.length > 0) {
            const positions = gridKeys.map(k => ({ k, pos: KEY_GRID_POS[k.code] }));
            const minCol = Math.min(...positions.map(p => p.pos.col));
            const minRow = Math.min(...positions.map(p => p.pos.row));
            const maxColEdge = Math.max(...positions.map(p => p.pos.col + p.pos.w));
            const maxRow = Math.max(...positions.map(p => p.pos.row));
            const gridEl = el('div', { id: 'lolex-kd-grid' }, {
                width: `${(maxColEdge - minCol) * KD_UNIT_X}px`,
                height: `${(maxRow - minRow + 1) * KD_UNIT_Y}px`,
            });
            positions.forEach(({ k, pos }) => {
                const box = el('div', { className: 'lolex-key-box', textContent: k.label }, {
                    left:   `${(pos.col - minCol) * KD_UNIT_X}px`,
                    top:    `${(pos.row - minRow) * KD_UNIT_Y}px`,
                    width:  `${pos.w * KD_UNIT_X - KD_GAP}px`,
                    height: `${KD_UNIT_Y - KD_GAP}px`,
                });
                box.dataset.code = k.code;
                if (_keyDisplayPressed.has(k.code)) box.classList.add('lolex-key-pressed');
                gridEl.appendChild(box);
            });
            container.appendChild(gridEl);
        }

        // ── マウス型クラスター ──
        if (mouseKeys.length > 0) {
            const mouseBody = el('div', { className: 'lolex-mouse-body' });
            const hasMiddle = mouseKeys.some(k => k.code === 'MouseMiddle');
            const left = mouseKeys.find(k => k.code === 'MouseLeft');
            const right = mouseKeys.find(k => k.code === 'MouseRight');
            if (left) {
                const half = el('div', { className: 'lolex-mouse-half', textContent: left.label });
                half.dataset.code = 'MouseLeft';
                if (_keyDisplayPressed.has('MouseLeft')) half.classList.add('lolex-key-pressed');
                mouseBody.appendChild(half);
            }
            if (hasMiddle) {
                const wheelK = mouseKeys.find(k => k.code === 'MouseMiddle');
                const wheel = el('div', { className: 'lolex-mouse-wheel' });
                wheel.dataset.code = 'MouseMiddle';
                if (_keyDisplayPressed.has('MouseMiddle')) wheel.classList.add('lolex-key-pressed');
                mouseBody.appendChild(wheel);
            }
            if (right) {
                const half = el('div', { className: 'lolex-mouse-half', textContent: right.label });
                half.dataset.code = 'MouseRight';
                if (_keyDisplayPressed.has('MouseRight')) half.classList.add('lolex-key-pressed');
                mouseBody.appendChild(half);
            }
            container.appendChild(mouseBody);
        }

        // ── 配列表に無いキー (フォールバック: 横並び) ──
        if (looseKeys.length > 0) {
            const looseEl = el('div', { id: 'lolex-kd-loose' });
            looseKeys.forEach(k => {
                const box = el('div', { className: 'lolex-key-box lolex-key-loose', textContent: k.label });
                box.dataset.code = k.code;
                if (_keyDisplayPressed.has(k.code)) box.classList.add('lolex-key-pressed');
                looseEl.appendChild(box);
            });
            container.appendChild(looseEl);
        }

        document.body.appendChild(container);
    }

    function refreshKeyDisplayVisibility() {
        const el2 = $('lolex-keydisplay'); if (!el2) return;
        el2.classList.toggle('lolex-kd-hidden', !getStoredBool(STORAGE.KEYDISPLAY_ENABLED, true));
    }

    function refreshKeyDisplayPosition() {
        const el2 = $('lolex-keydisplay'); if (!el2) return;
        el2.className = '';
        el2.classList.add('pos-' + getKeyDisplayPos());
        if (!getStoredBool(STORAGE.KEYDISPLAY_ENABLED, true)) el2.classList.add('lolex-kd-hidden');
    }

    function setKeyPressedVisual(code, pressed) {
        if (pressed) _keyDisplayPressed.add(code); else _keyDisplayPressed.delete(code);
        const box = document.querySelector(`#lolex-keydisplay [data-code="${CSS.escape(code)}"]`);
        if (box) box.classList.toggle('lolex-key-pressed', pressed);
    }

    let _keyDisplayListenersBound = false;
    function bindKeyDisplayInputListeners() {
        if (_keyDisplayListenersBound) return;
        _keyDisplayListenersBound = true;
        const mouseCodeForButton = (btn) => btn === 0 ? 'MouseLeft' : btn === 2 ? 'MouseRight' : btn === 1 ? 'MouseMiddle' : null;
        document.addEventListener('keydown', e => { if (e.code) setKeyPressedVisual(e.code, true); }, true);
        document.addEventListener('keyup',   e => { if (e.code) setKeyPressedVisual(e.code, false); }, true);
        document.addEventListener('mousedown', e => { const c = mouseCodeForButton(e.button); if (c) setKeyPressedVisual(c, true); }, true);
        document.addEventListener('mouseup',   e => { const c = mouseCodeForButton(e.button); if (c) setKeyPressedVisual(c, false); }, true);
        window.addEventListener('blur', () => { _keyDisplayPressed.forEach(code => setKeyPressedVisual(code, false)); });
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
                background: #000 !important; background-image: none !important;
                color: var(--primary-color) !important; font-weight: bold; text-shadow: none !important;
                border: 1.5px solid var(--primary-color) !important; border-radius: 6px !important;
                box-sizing: border-box; padding: 0 14px !important; line-height: 37px !important;
                height: 40px !important; display: inline-block !important; transition: background 0.2s;
            }
            #tab5:checked ~ nav ul li.tab5 label[for="tab5"], #settings-screen .pc-tab nav ul li.tab5 label[for="tab5"]:hover {
                background: color-mix(in srgb, var(--primary-color) 18%, #000) !important;
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
            .lolex-kd-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 10px 4px; }
            .lolex-kd-chip { display: flex; align-items: center; gap: 5px; background: var(--input-bg); border: 1px solid var(--col-border); border-radius: 14px; padding: 3px 6px 3px 10px; font-size: 0.78em; font-weight: 700; color: var(--col-text); }
            .lolex-kd-chip button { background: rgba(180,0,30,0.65); color: #fff; border: none; border-radius: 50%; width: 16px; height: 16px; flex-shrink: 0; cursor: pointer; font-size: 0.72em; line-height: 16px; text-align: center; padding: 0; }
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

    function ytDestroy() {
        try { saveTime(); } catch (_) {}
        try { clearInterval(saveTimeInterval); } catch (_) {}
        try { cancelAnimationFrame(_eqAnimId); } catch (_) {}
        try { if (player) { player.stopVideo?.(); player.destroy?.(); } } catch (_) {}
        player = null;
        try { isApiReady = false; } catch (_) {}
        ['yt-card', 'yt-hidden-player', 'yt-url-panel', 'yt-float-btn'].forEach(id => document.getElementById(id)?.remove());
    }
    function ytSetEnabled(v) {
        setStoredBool(STORAGE.YT_ENABLED, v);
        if (v) initYouTubePlayerUI(); else ytDestroy();
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
    //  ★ キー表示 設定UI 描画
    // ------------------------------------------------------------------------------------------------
    let _kdWaitingForInput = false;
    let _kdCaptureHandlerKey = null;
    let _kdCaptureHandlerMouse = null;

    function renderKeyDisplayChips() {
        const wrap = $('lolex-kd-chips'); if (!wrap) return;
        wrap.innerHTML = '';
        getKeyDisplayKeys().forEach((k, idx) => {
            const chip = document.createElement('div'); chip.className = 'lolex-kd-chip';
            const span = document.createElement('span'); span.textContent = k.label;
            const del = document.createElement('button'); del.textContent = '×';
            del.addEventListener('click', () => {
                const list = getKeyDisplayKeys(); list.splice(idx, 1);
                setKeyDisplayKeys(list); renderKeyDisplayChips(); buildKeyDisplayUI();
            });
            chip.appendChild(span); chip.appendChild(del); wrap.appendChild(chip);
        });
    }

    function stopKdCapture(addBtn) {
        _kdWaitingForInput = false;
        if (_kdCaptureHandlerKey)   document.removeEventListener('keydown', _kdCaptureHandlerKey, true);
        if (_kdCaptureHandlerMouse) document.removeEventListener('mousedown', _kdCaptureHandlerMouse, true);
        _kdCaptureHandlerKey = null; _kdCaptureHandlerMouse = null;
        if (addBtn) addBtn.textContent = t('keyDisplayAddKey');
    }

    function startKdCapture(addBtn) {
        if (_kdWaitingForInput) return;
        _kdWaitingForInput = true;
        addBtn.textContent = t('keyDisplayWaiting');
        _kdCaptureHandlerKey = (e) => {
            if (e.key === 'Escape') { stopKdCapture(addBtn); return; }
            e.preventDefault(); e.stopImmediatePropagation();
            const code = e.code;
            const list = getKeyDisplayKeys();
            if (!list.find(k => k.code === code)) { list.push({ code, label: labelForCode(code) }); setKeyDisplayKeys(list); renderKeyDisplayChips(); buildKeyDisplayUI(); }
            stopKdCapture(addBtn);
        };
        _kdCaptureHandlerMouse = (e) => {
            e.preventDefault(); e.stopImmediatePropagation();
            const code = e.button === 0 ? 'MouseLeft' : e.button === 2 ? 'MouseRight' : e.button === 1 ? 'MouseMiddle' : null;
            if (code) {
                const list = getKeyDisplayKeys();
                if (!list.find(k => k.code === code)) { list.push({ code, label: labelForCode(code) }); setKeyDisplayKeys(list); renderKeyDisplayChips(); buildKeyDisplayUI(); }
            }
            stopKdCapture(addBtn);
        };
        document.addEventListener('keydown', _kdCaptureHandlerKey, true);
        document.addEventListener('mousedown', _kdCaptureHandlerMouse, true);
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
            <div class="lolex-update-text">
                <div class="lolex-upd-head"><span class="lolex-version-badge">v${SCRIPT_VERSION}</span></div>
                <ul class="lolex-upd-list">${t('updateInfo').split('<br>').map(x => x.replace(/^・/, '').trim()).filter(Boolean).map(x => `<li>${x}</li>`).join('')}</ul>
            </div>
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

        // ── 5. キー/マウス入力表示 ──
        const kdFs = document.createElement('fieldset');
        const kdLegend = document.createElement('legend'); kdLegend.innerHTML = `<i class="fas fa-keyboard"></i> ${t('keyDisplaySettings')}`;
        kdFs.appendChild(kdLegend);

        const kdEnableRow = makeToggleRow('keyDisplayEnableToggle', `<i class="fas fa-eye"></i>${t('keyDisplayEnable')}`, getStoredBool(STORAGE.KEYDISPLAY_ENABLED, true));
        kdFs.appendChild(kdEnableRow);

        const kdPosRow = document.createElement('div'); kdPosRow.className = 'lolex-setting-row';
        const kdPosLabel = document.createElement('label'); kdPosLabel.className = 'setting-name'; kdPosLabel.innerHTML = `<i class="fas fa-arrows-alt"></i>${t('keyDisplayPosition')}`;
        const kdPosSelect = document.createElement('select'); kdPosSelect.id = 'keyDisplayPosSelect';
        [['bottom-left', t('posBottomLeft')], ['bottom-right', t('posBottomRight')], ['top-left', t('posTopLeft')], ['top-right', t('posTopRight')]].forEach(([val, label]) => {
            const opt = document.createElement('option'); opt.value = val; opt.textContent = label;
            if (getKeyDisplayPos() === val) opt.selected = true;
            kdPosSelect.appendChild(opt);
        });
        kdPosRow.appendChild(kdPosLabel); kdPosRow.appendChild(kdPosSelect); kdFs.appendChild(kdPosRow);

        const kdKeysLabelRow = document.createElement('div'); kdKeysLabelRow.className = 'lolex-setting-row'; kdKeysLabelRow.style.borderBottom = 'none';
        kdKeysLabelRow.innerHTML = `<span class="setting-name"><i class="fas fa-list"></i>${t('keyDisplayKeysLabel')}</span>`;
        kdFs.appendChild(kdKeysLabelRow);

        const kdChips = document.createElement('div'); kdChips.id = 'lolex-kd-chips'; kdChips.className = 'lolex-kd-chips';
        kdFs.appendChild(kdChips);

        const kdBtnGroup = document.createElement('div'); kdBtnGroup.className = 'lolex-btn-group';
        const kdAddBtn = document.createElement('button'); kdAddBtn.id = 'keyDisplayAddBtn'; kdAddBtn.className = 'accent'; kdAddBtn.textContent = t('keyDisplayAddKey');
        const kdResetBtn = document.createElement('button'); kdResetBtn.id = 'keyDisplayResetBtn'; kdResetBtn.className = 'muted'; kdResetBtn.textContent = t('keyDisplayResetDefault');
        kdBtnGroup.appendChild(kdAddBtn); kdBtnGroup.appendChild(kdResetBtn);
        kdFs.appendChild(kdBtnGroup);

        const kdNote = document.createElement('div'); kdNote.className = 'lolex-note';
        kdNote.innerHTML = `${t('keyDisplayEnableNote')}<br>${t('keyDisplayMouseHint')}`;
        kdFs.appendChild(kdNote);

        container.appendChild(kdFs);

        // ── 6. YouTube ──
        const ytFs = document.createElement('fieldset');
        const ytLegend = document.createElement('legend'); ytLegend.innerHTML = `<i class="fab fa-youtube"></i> ${t('ytSettings')}`;
        ytFs.appendChild(ytLegend);
        const ytOn = getStoredBool(STORAGE.YT_ENABLED, true);
        const ytMasterRow = makeToggleRow('ytEnableToggle', `<i class="fas fa-power-off"></i>${t('ytEnable')}`, ytOn);
        ytMasterRow.classList.add('lolex-yt-master'); ytFs.appendChild(ytMasterRow);
        if (!ytOn) ytFs.classList.add('lolex-yt-off');

        const hotkeyRow = document.createElement('div'); hotkeyRow.className = 'lolex-setting-row lolex-hk-row';
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

        // ── 7. ベストタイム計算 ──
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

        // ── チャット自動翻訳 ──
        const chatFs = document.createElement('fieldset');
        const chatLegend = document.createElement('legend'); chatLegend.innerHTML = `<i class="fas fa-language"></i> ${t('chatTrTitle')}`; chatFs.appendChild(chatLegend);
        chatFs.appendChild(makeToggleRow('chatTrToggle', `<i class="fas fa-comments"></i>${t('chatTrEnable')}`, getStoredBool(STORAGE.CHAT_TR, true)));
        const chatNote = document.createElement('div'); chatNote.className = 'lolex-note'; chatNote.textContent = t('chatTrNote'); chatFs.appendChild(chatNote);
        container.appendChild(chatFs);

        const modsList = modsBuildSettings(container);
        const fsList = [[updateFs,'update'],[langFs,'lang'],[gameFs,'airmove'],[courseFs,'course'],[visualFs,'visual'],[kdFs,'keydisplay'],[ytFs,'yt'],[btFs,'besttimes'],[chatFs,'chattr'],...modsList,...lolexBuildHelp(container)];
        fsList.forEach(([fs, key]) => makeCollapsibleFieldset(fs, key));
        lolexApplySettingsCategories(container, fsList);

        panel.appendChild(container);
        renderKeyDisplayChips();
        bindSettingsEvents();
    }

    function bindSettingsEvents() {
        $('language-switcher')?.addEventListener('change', (e) => { localStorage.setItem(STORAGE.LANGUAGE, e.target.value); invalidateLangCache(); createSettings(); updateProfileUILang(); chatTrReset(); });
        $('chatTrToggle')?.addEventListener('change', (e) => { setStoredBool(STORAGE.CHAT_TR, e.target.checked); chatTrApply(); });
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
        // ★ キー表示
        $('keyDisplayEnableToggle')?.addEventListener('change', (e) => { setStoredBool(STORAGE.KEYDISPLAY_ENABLED, e.target.checked); refreshKeyDisplayVisibility(); });
        $('keyDisplayPosSelect')?.addEventListener('change', (e) => { localStorage.setItem(STORAGE.KEYDISPLAY_POS, e.target.value); refreshKeyDisplayPosition(); });
        $('keyDisplayAddBtn')?.addEventListener('click', (e) => { startKdCapture(e.target); });
        $('keyDisplayResetBtn')?.addEventListener('click', () => {
            setKeyDisplayKeys(DEFAULT.KEYDISPLAY_KEYS.map(k => ({ ...k })));
            renderKeyDisplayChips(); buildKeyDisplayUI();
        });
        $('ytLoopToggle')?.addEventListener('change', (e) => { setStoredBool(STORAGE.LOOP, e.target.checked); try { if (player) player.setLoop(e.target.checked); } catch (_) {} });
        $('ytShuffleToggle')?.addEventListener('change', (e) => { setStoredBool(STORAGE.SHUFFLE, e.target.checked); });
        const ytEn = $('ytEnableToggle');
        if (ytEn && !ytEn.dataset.lxBound) {
            ytEn.dataset.lxBound = '1';
            ytEn.addEventListener('change', (e) => { ytSetEnabled(e.target.checked); e.target.closest('fieldset')?.classList.toggle('lolex-yt-off', !e.target.checked); });
        }
        modsBindSettings();
        $('lb-calc-btn')?.addEventListener('click', fetchBestTimes);
        $('lb-save-btn')?.addEventListener('click', () => { saveTimesAsImage($('lb-save-btn'), $('lb-total-display')?.textContent || ''); });
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

    // ── 共通化: YouTubeホットキー設定の取得 ──
    function getHotkeyConfig() {
        const stored = localStorage.getItem(STORAGE.YT_HOTKEY);
        return stored ? JSON.parse(stored) : { key: 'm', ctrlKey: true, altKey: false, shiftKey: false };
    }

    let _hotkeyHandler = null;
    function setupHotkey() { applyHotkey(); }
    function applyHotkey() {
        if (_hotkeyHandler) { document.removeEventListener('keydown', _hotkeyHandler, { capture: true }); window.removeEventListener('keydown', _hotkeyHandler, { capture: true }); _hotkeyHandler = null; }
        const cfg = getHotkeyConfig();
        _hotkeyHandler = (e) => {
            if (!getStoredBool(STORAGE.YT_ENABLED, true)) return;
            const match = e.key.toLowerCase() === cfg.key.toLowerCase() && !!e.ctrlKey === !!cfg.ctrlKey && !!e.altKey === !!cfg.altKey && !!e.shiftKey === !!cfg.shiftKey;
            if (!match) return;
            e.preventDefault(); e.stopImmediatePropagation(); toggleYouTubeVisibility();
        };
        document.addEventListener('keydown', _hotkeyHandler, { capture: true });
        window.addEventListener('keydown',   _hotkeyHandler, { capture: true });
    }

    function hotkeyLabel() {
        const cfg = getHotkeyConfig();
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
        buildKeyDisplayUI();
        bindKeyDisplayInputListeners();
        setTimeout(() => { if (getStoredBool(STORAGE.YT_ENABLED, true)) initYouTubePlayerUI(); }, 1000);
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

        calcBtn.addEventListener('click', () => { fetchAndDisplayBestTimes(totalEl, calcBtn); });

        saveBtn.addEventListener('click', () => {
            saveTimesAsImage(saveBtn, totalEl.textContent || '');
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

    // ================================================================================================
    //  ★ ゲーム演出モジュール (v0.86)
    //     一人称視点 / FOV制限解除 / 画面エフェクト / キャラの頭・手・足スケール / インスタントリプレイ
    //     すべて「自分の画面だけ」の見た目の機能です(サーバーには何も送りません)
    // ================================================================================================
    const MODS_KEY = 'lolex-mods';
    const M = {
        fpv: false, fpvEyeY: 0.35, fpvFwd: 0.18, fpvHideHead: true,
        fovOn: false, fov: 100,
        flipX: false, flipY: false, rot: 0, spin: 0, filter: 'none', pixel: 100,
        target: 'me', head: 1, hand: 1, foot: 1,
        replayOn: true, replayMin: 60, replayMbps: 4, replayUI: true,
    };
    try { Object.assign(M, JSON.parse(localStorage.getItem(MODS_KEY) || '{}')); } catch (_) {}
    // 一人称視点は固定設定(ON/OFFのみ)・FOVはゲーム標準のまま
    Object.assign(M, { fpvEyeY: 0.53, fpvFwd: 0.35, fpvHideHead: true, fovOn: false });
    const modsSave = () => { try { localStorage.setItem(MODS_KEY, JSON.stringify(M)); } catch (_) {} };

    const MW = unsafeWindow;            // ページ本体の window
    let modsT = null;                   // THREE
    const modsRenderers = new Set();
    const modsBasePR = new WeakMap();   // ゲームが指定したピクセル比
    // ---------- 簡易メニュー (Alt+Q) : 設定画面の入力欄を直接操作するのでUIと常に同期 ----------
    const QM_SECTIONS = [
        { title: () => t('modsViewTitle'), icon: 'fa-eye', rows: [
            ['check', 'modsFpvToggle'] ] },
        { title: () => t('modsFxTitle'), icon: 'fa-magic', rows: [
            ['check', 'modsFlipX'], ['check', 'modsFlipY'], ['select', 'modsFilter'], ['range', 'modsRot'] ] },
        { title: () => (getLang() === 'ja' ? '表示' : 'Display'), icon: 'fa-keyboard', rows: [
            ['check', 'keyDisplayEnableToggle'], ['fn', () => toggleYouTubeVisibility(), () => t('ytSettings')] ] },
        { title: () => t('modsReplayTitle'), icon: 'fa-video', rows: [
            ['check', 'modsReplayOn'], ['btn', 'modsReplaySave'] ] },
    ];

    function qmEnsureStyle() {
        if (document.getElementById('lolex-qm-style')) return;
        const st = document.createElement('style'); st.id = 'lolex-qm-style';
        st.textContent = [
            '#lolex-qm{position:fixed;top:16px;right:16px;width:300px;max-height:calc(100vh - 32px);overflow-y:auto;z-index:100001;background:rgba(13,13,20,.96);color:var(--col-text,#dcdce8);border:1px solid var(--col-border,#2c2c3a);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.55);font-size:13px;transform:translateX(calc(100% + 24px));transition:transform .22s ease;}',
            '#lolex-qm.qm-open{transform:none;}',
            '#lolex-qm .qm-head{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--col-border,#2c2c3a);background:color-mix(in srgb,var(--primary-color) 13%,transparent);position:sticky;top:0;}',
            '#lolex-qm .qm-title{font-weight:800;flex:1;}',
            '#lolex-qm .qm-key{font-size:.8em;color:var(--col-sub,#9090aa);border:1px solid var(--col-border,#2c2c3a);border-radius:4px;padding:1px 6px;}',
            '#lolex-qm .qm-x{cursor:pointer;color:var(--col-sub,#9090aa);font-size:16px;line-height:1;padding:2px 4px;}',
            '#lolex-qm .qm-x:hover{color:#fff;}',
            '#lolex-qm .qm-sec{padding:8px 12px 2px;font-size:.78em;font-weight:700;color:var(--col-sub,#9090aa);}',
            '#lolex-qm .qm-sec i{color:var(--primary-color);margin-right:4px;}',
            '#lolex-qm .qm-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 12px;}',
            '#lolex-qm .qm-row:hover{background:rgba(255,255,255,.035);}',
            '#lolex-qm .qm-name{flex:1;line-height:1.35;}',
            '#lolex-qm .qm-name i{color:var(--col-sub,#9090aa);width:1.25em;text-align:center;margin-right:4px;}',
            '#lolex-qm input[type=range]{width:110px;accent-color:var(--primary-color);}',
            '#lolex-qm .qm-val{min-width:44px;text-align:right;font-variant-numeric:tabular-nums;color:var(--col-sub,#9090aa);}',
            '#lolex-qm select{height:26px;max-width:130px;background:var(--input-bg,#1c1c26);color:inherit;border:1px solid var(--col-border,#2c2c3a);border-radius:6px;}',
            '#lolex-qm button.qm-btn{background:transparent;color:var(--primary-color);border:1px solid var(--primary-color);border-radius:6px;padding:5px 10px;font-weight:700;cursor:pointer;font-size:.92em;}',
            '#lolex-qm button.qm-btn:hover{background:var(--primary-color);color:#0d0d14;}',
            '#lolex-qm button.qm-btn.qm-rec{color:#ff7070;border-color:#ff7070;}',
            '#lolex-qm .qm-foot{padding:8px 12px 10px;font-size:.78em;color:var(--col-sub,#9090aa);}',
            '#lolex-qm-bd{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.35);}',
            '#lolex-qm-handle{position:fixed;right:0;top:45%;width:8px;height:64px;border-radius:8px 0 0 8px;background:var(--primary-color);opacity:.35;z-index:99999;}',
            '#lolex-qm-handle:before{content:"";position:absolute;inset:-14px -4px -14px -22px;}',
            '@media (pointer:coarse){#lolex-qm .qm-key{display:none;} #lolex-qm .qm-row{padding:10px 14px;} #lolex-qm .qm-x{font-size:20px;padding:6px 10px;} #lolex-qm select{height:34px;max-width:150px;font-size:16px;} #lolex-qm input[type=range]{width:120px;height:30px;} #lolex-qm button.qm-btn{padding:8px 12px;}}',
            '@media (max-width:700px){#lolex-qm{top:8px;right:8px;width:min(330px,88vw);max-height:calc(100vh - 16px);}}'
        ].join(' ');
        document.head.appendChild(st);
    }

    function qmRow(kind, a, b) {
        const row = document.createElement('div'); row.className = 'qm-row';
        const name = document.createElement('span'); name.className = 'qm-name';
        const send = (src, type) => src.dispatchEvent(new Event(type, { bubbles: true }));
        if (kind === 'fn') {
            if (!getStoredBool(STORAGE.YT_ENABLED, true)) return null;
            const btn = document.createElement('button'); btn.className = 'qm-btn'; btn.type = 'button';
            name.textContent = b(); btn.innerHTML = '<i class="fas fa-music"></i>'; btn.addEventListener('click', a);
            row.appendChild(name); row.appendChild(btn); return row;
        }
        const src = document.getElementById(a); if (!src) return null;
        const lab = document.querySelector(`label[for="${a}"]`);
        if (kind === 'btn') {
            const btn = document.createElement('button'); btn.className = 'qm-btn'; btn.type = 'button';
            const sync = () => { btn.innerHTML = src.innerHTML; btn.classList.toggle('qm-rec', src.classList.contains('danger')); };
            sync(); btn.addEventListener('click', () => src.click());
            const ob = new MutationObserver(sync); ob.observe(src, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
            (qmObs = qmObs || []).push(ob);
            row.style.justifyContent = 'flex-end'; row.appendChild(btn); return row;
        }
        name.innerHTML = lab ? lab.innerHTML : a; row.appendChild(name);
        if (kind === 'check') {
            const sw = document.createElement('label'); sw.className = 'switch';
            const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = src.checked;
            const sp = document.createElement('span'); sp.className = 'slider-toggle';
            cb.addEventListener('change', () => { src.checked = cb.checked; send(src, 'change'); });
            sw.appendChild(cb); sw.appendChild(sp); row.appendChild(sw);
        } else if (kind === 'range') {
            const box = document.createElement('div'); box.style.cssText = 'display:flex;align-items:center;gap:6px;';
            const r = document.createElement('input'); r.type = 'range'; r.min = src.min; r.max = src.max; r.step = src.step; r.value = src.value;
            const v = document.createElement('span'); v.className = 'qm-val'; v.textContent = modsFmt(src.value, src.dataset.fmt);
            r.addEventListener('input', () => { v.textContent = modsFmt(parseFloat(r.value), src.dataset.fmt); src.value = r.value; send(src, 'input'); });
            box.appendChild(r); box.appendChild(v); row.appendChild(box);
        } else if (kind === 'select') {
            const sel = document.createElement('select');
            Array.from(src.options).forEach(o => { const n = document.createElement('option'); n.value = o.value; n.textContent = o.textContent; sel.appendChild(n); });
            sel.value = src.value;
            sel.addEventListener('change', () => { src.value = sel.value; send(src, 'change'); });
            row.appendChild(sel);
        }
        return row;
    }

    let qmObs = null;
    const qmIsTouch = () => { try { return matchMedia('(pointer:coarse)').matches; } catch (_) { return false; } };
    const qmIsOpen = () => { const e = document.getElementById('lolex-qm'); return !!e && !e.classList.contains('qm-closing'); };
    function qmClose(immediate) {
        if (qmObs) { qmObs.forEach(o => o.disconnect()); qmObs = null; }
        const bd = document.getElementById('lolex-qm-bd'); if (bd) bd.remove();
        const el = document.getElementById('lolex-qm'); if (!el) return;
        if (immediate === true) { el.remove(); return; }
        el.classList.remove('qm-open'); el.classList.add('qm-closing');
        setTimeout(() => el.remove(), 230);
    }
    function qmOpen() {
        qmEnsureStyle(); qmClose(true);
        const el = document.createElement('div'); el.id = 'lolex-qm';
        const head = document.createElement('div'); head.className = 'qm-head';
        head.innerHTML = `<span class="qm-title"><i class="fas fa-sliders-h"></i> ${getLang() === 'ja' ? '簡易メニュー' : 'Quick Menu'}</span><span class="qm-key">Alt+Q</span><span class="qm-x" title="Esc">✕</span>`;
        head.querySelector('.qm-x').addEventListener('click', () => qmClose());
        el.appendChild(head);
        QM_SECTIONS.forEach(sec => {
            const rows = sec.rows.map(r => qmRow(r[0], r[1], r[2])).filter(Boolean);
            if (!rows.length) return;
            const h = document.createElement('div'); h.className = 'qm-sec'; h.innerHTML = `<i class="fas ${sec.icon}"></i>${sec.title()}`;
            el.appendChild(h); rows.forEach(r => el.appendChild(r));
        });
        const foot = document.createElement('div'); foot.className = 'qm-foot';
        const ja = getLang() === 'ja';
        foot.textContent = qmIsTouch()
            ? (ja ? '右にスワイプ・✕・外側タップで閉じる' : 'Swipe right, tap ✕ or outside to close')
            : (ja ? 'Alt+Q / Esc で閉じる ・ 詳細は設定画面' : 'Alt+Q / Esc to close · More in Settings');
        el.appendChild(foot);
        ['keydown', 'keyup', 'mousedown', 'mouseup', 'wheel'].forEach(ev => el.addEventListener(ev, e => e.stopPropagation()));
        // 右へスワイプで閉じる(スライダー/セレクト操作中は除く)
        let sx = null;
        el.addEventListener('touchstart', e => { sx = (e.touches.length === 1 && !(e.target.closest && e.target.closest('input,select'))) ? e.touches[0].clientX : null; }, { passive: true });
        el.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (dx > 70) qmClose(); }, { passive: true });
        if (qmIsTouch()) {
            const bd = document.createElement('div'); bd.id = 'lolex-qm-bd';
            bd.addEventListener('click', () => qmClose());
            document.body.appendChild(bd);
        }
        document.body.appendChild(el);
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('qm-open')));
        try { if (document.exitPointerLock) document.exitPointerLock(); } catch (_) {}
    }
    window.addEventListener('keydown', (e) => {
        if (e.altKey && !e.ctrlKey && !e.shiftKey && e.code === 'KeyQ') {
            qmIsOpen() ? qmClose() : qmOpen();
            e.preventDefault(); e.stopImmediatePropagation();
        } else if (e.code === 'Escape' && qmIsOpen()) {
            qmClose(); e.preventDefault(); e.stopImmediatePropagation();
        }
    }, true);
    // 画面右端から左へスワイプで開く(スマホ)
    (function qmEdgeSwipe() {
        const EDGE = 28; let st = null;
        window.addEventListener('touchstart', (e) => {
            const p = e.touches[0];
            st = (e.touches.length === 1 && !qmIsOpen() && p.clientX >= window.innerWidth - EDGE) ? { x: p.clientX, y: p.clientY, t: Date.now() } : null;
        }, { capture: true, passive: true });
        window.addEventListener('touchcancel', () => { st = null; }, { capture: true, passive: true });
        window.addEventListener('touchend', (e) => {
            if (!st) return;
            const p = e.changedTouches[0], dx = p.clientX - st.x, dy = p.clientY - st.y, dt = Date.now() - st.t;
            st = null;
            if (dx < -50 && Math.abs(dy) < Math.abs(dx) * 0.8 && dt < 800) qmOpen();
        }, { capture: true, passive: true });
        // 端のスワイプが効かない端末向けの小さなつまみ(タッチ端末のみ)
        const mk = () => {
            if (!qmIsTouch() || document.getElementById('lolex-qm-handle')) return;
            qmEnsureStyle();
            const h = document.createElement('div'); h.id = 'lolex-qm-handle';
            h.addEventListener('click', () => { qmIsOpen() ? qmClose() : qmOpen(); });
            document.body.appendChild(h);
        };
        if (document.body) mk(); else document.addEventListener('DOMContentLoaded', mk);
    })();

    const modsLastF = new WeakMap();    // 最後に掛けた倍率
    const modsT0 = performance.now();

    function modsToast(msg) {
        let tt = document.getElementById('lolex-mods-toast');
        if (!tt) {
            tt = document.createElement('div'); tt.id = 'lolex-mods-toast';
            tt.style.cssText = 'position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:100000;background:rgba(0,0,0,.75);color:#fff;font:14px sans-serif;padding:8px 14px;border-radius:8px;pointer-events:none;transition:opacity .4s;';
            document.body.appendChild(tt);
        }
        tt.textContent = msg; tt.style.opacity = 1;
        clearTimeout(tt._h); tt._h = setTimeout(() => { tt.style.opacity = 0; }, 2500);
    }

    // ---------- メインキャンバス ----------
    let _mainCanvasCache = null, _mainCanvasAt = 0;
    function modsMainCanvas() {
        const now = performance.now();
        if (_mainCanvasCache && _mainCanvasCache.isConnected && now - _mainCanvasAt < 500) return _mainCanvasCache;
        let best = null, area = 0;
        document.querySelectorAll('canvas').forEach(c => {
            const a = c.clientWidth * c.clientHeight;
            if (a > area && c.clientWidth > 300) { area = a; best = c; }
        });
        _mainCanvasCache = best; _mainCanvasAt = now;
        return best;
    }
    const modsIsMain = r => r.domElement && r.domElement.isConnected && r.domElement.clientWidth >= window.innerWidth * 0.8;

    // ---------- 自分のプレイヤーを特定 ----------
    function modsLocalPlayer(scene, camera) {
        const T = modsT, off = new T.Vector3(), v = new T.Vector3();
        let best = null, bestErr = 1.5;
        for (const o of scene.children) {
            if (!o.isPlayer || !o.input || !o.input.direction) continue;
            v.set(0, 3, -7).applyEuler(o.input.direction);          // ゲームの三人称カメラのオフセット
            off.copy(camera.position).sub(o.position);
            const err = off.distanceTo(v);
            if (err < bestErr) { bestErr = err; best = o; }
        }
        if (best) return best;
        let bd = 1.5;                                                  // 一人称などでカメラが体の近くにある場合
        for (const o of scene.children) {
            if (!o.isPlayer) continue;
            const d = o.position.distanceTo(camera.position);
            if (d < bd) { bd = d; best = o; }
        }
        return best;
    }

    // ---------- 一人称視点 ----------
    const FPV_FOV = 100;   // 一人称視点のときのFOV
    let _fpvWasOn = false, _fpvNearSet = false;
    function modsApplyFPV(p, camera) {
        const T = modsT, dir = p.input.direction;
        const flat = new T.Vector3(0, 0, 1).applyEuler(new T.Euler(0, dir.y, 0, 'YXZ'));
        camera.position.copy(p.position);
        camera.position.y += M.fpvEyeY;
        camera.position.addScaledVector(flat, M.fpvFwd);
        const look = camera.position.clone().add(new T.Vector3(0, 0, 1).applyEuler(dir));
        camera.up.set(0, 1, 0);
        camera.lookAt(look);
        if (camera.near !== 0.03 || camera.fov !== FPV_FOV) { camera.near = 0.03; camera.fov = FPV_FOV; camera.updateProjectionMatrix(); }
        _fpvNearSet = true;
    }

    // ---------- FOV ----------
    function modsApplyFOV(camera) {
        if (M.fovOn) {
            const f = Math.max(10, Math.min(170, M.fov));
            if (camera.fov !== f) { camera.fov = f; camera.updateProjectionMatrix(); }
        } else if (_fovWasOn) {
            let g = 75; try { g = parseFloat(localStorage.getItem('FOV')) || 75; } catch (_) {}
            camera.fov = g; camera.updateProjectionMatrix();
        }
        _fovWasOn = M.fovOn;
    }
    let _fovWasOn = false;

    // ---------- 骨スケール(頭・手・足) ----------
    const MODS_GROUPS = [['head', /head$/i], ['hand', /hand$/i], ['foot', /foot$/i]];
    let _bonesEver = false;
    function modsBoneGroups(p) {
        if (p.__lolexBones) return p.__lolexBones;
        const g = { head: [], hand: [], foot: [] };
        const bones = (p.skeleton && p.skeleton.bones) || [];
        for (const b of bones) for (const [k, re] of MODS_GROUPS) if (re.test(b.name)) g[k].push(b);
        p.__lolexBones = g;
        return g;
    }
    function modsSetBone(b, f) {
        let base;
        if (b.__lxLast && b.scale.equals(b.__lxLast)) base = b.__lxBase;   // アニメが上書きしていなければ前回の元値
        else base = b.scale.clone();
        b.__lxBase = base;
        b.scale.copy(base).multiplyScalar(f);
        b.__lxLast = b.scale.clone();
        b.updateMatrixWorld(true);
    }
    function modsApplyBones(scene, lp) {
        const fpvHead = M.fpv && M.fpvHideHead;
        const active = M.head !== 1 || M.hand !== 1 || M.foot !== 1 || fpvHead || _fpvWasOn;
        if (!active && !_bonesEver) return;
        let list;
        if (M.target === 'all') list = scene.children.filter(o => o.isPlayer && o.skeleton);
        else list = lp && lp.skeleton ? [lp] : [];
        for (const p of list) {
            const g = modsBoneGroups(p);
            const isMe = p === lp;
            for (const k of ['head', 'hand', 'foot']) {
                const f = (k === 'head' && fpvHead && isMe) ? 0.001 : M[k];
                for (const b of g[k]) if (f !== 1 || b.__lxLast) modsSetBone(b, f);
            }
        }
        if (active) _bonesEver = true;
    }
    MW.lolexBoneNames = () => {
        const p = MW.__lolexPlayer;
        if (!p || !p.skeleton) { console.log('[LOL.ex] プレイヤー未検出。試合に入ってから実行してください'); return; }
        console.log('[LOL.ex] bones:', p.skeleton.bones.map(b => b.name));
    };

    // ---------- 画面エフェクト(CSS) + ドット絵 ----------
    const MODS_FILTERS = {
        none: () => '',
        gray: () => 'grayscale(1)',
        sepia: () => 'sepia(1)',
        neon: () => 'saturate(2.4) contrast(1.25) brightness(1.05)',
        invert: () => 'invert(1)',
        cold: () => 'hue-rotate(180deg) saturate(1.4)',
        psyche: tt => `hue-rotate(${(tt * 90) % 360}deg) saturate(2.2)`,
        drunk: tt => `blur(${(1.2 + Math.sin(tt * 1.3)).toFixed(2)}px) hue-rotate(${Math.sin(tt * 0.7) * 25}deg)`,
    };
    function modsApplyStyle() {
        const c = modsMainCanvas();
        if (!c) return;
        const tt = (performance.now() - modsT0) / 1000;
        let ang = M.rot + (M.spin ? tt * M.spin : 0);
        if (M.filter === 'drunk') ang += Math.sin(tt * 0.9) * 4;
        let tf = '';
        if (M.flipX) tf += ' scaleX(-1)';
        if (M.flipY) tf += ' scaleY(-1)';
        if (ang) {
            const rad = ang * Math.PI / 180, cs = Math.abs(Math.cos(rad)), sn = Math.abs(Math.sin(rad));
            const W = window.innerWidth, H = window.innerHeight;
            const k = Math.max(cs + (W / H) * sn, cs + (H / W) * sn);
            tf += ` rotate(${ang}deg) scale(${k.toFixed(3)})`;
        }
        tf = tf.trim();
        const fl = (MODS_FILTERS[M.filter] || MODS_FILTERS.none)(tt);
        const px = M.pixel < 100 ? 'pixelated' : '';
        if (c.style.transform !== tf) c.style.transform = tf;
        if (c.style.filter !== fl) c.style.filter = fl;
        if (c.style.imageRendering !== px) c.style.imageRendering = px;
    }
    (function modsLoop() { try { modsApplyStyle(); } catch (_) {} requestAnimationFrame(modsLoop); })();

    const modsPixelFactor = () => Math.max(0.03, Math.min(1, M.pixel / 100));
    function modsSyncPixel() {
        for (const r of modsRenderers) {
            if (!modsBasePR.has(r) || !r.domElement || !r.domElement.isConnected) continue;
            const want = modsIsMain(r) ? modsPixelFactor() : 1;
            if (modsLastF.get(r) !== want) r.setPixelRatio(modsBasePR.get(r));
        }
    }
    setInterval(modsSyncPixel, 500);

    // ---------- インスタントリプレイ ----------
    const rp = { canvas: null, stream: null, comp: null, cctx: null, ov: null, octx: null, lastOv: 0,
                 compose: false, frames: 0, startedAt: 0, slots: [], stagger: null, tick: null };
    const RP_FPS = 60, RP_OV_FPS = 20;
    const rpMime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
        .find(m => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m));

    function rpEffOpacity(e0) {
        let o = 1;
        for (let e = e0; e && e.nodeType === 1; e = e.parentElement) { const v = parseFloat(getComputedStyle(e).opacity); if (!isNaN(v)) o *= v; }
        return o;
    }
    function rpVisible(e) {
        if (e.checkVisibility) return e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, opacityProperty: true, visibilityProperty: true });
        const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden';
    }
    const rpIgnored = e => e.tagName === 'CANVAS' || e.tagName === 'SCRIPT' || e.tagName === 'STYLE' || e.id === 'lolex-mods-toast';
    function rpSameOrigin(src) {
        try { const u = new URL(src, location.href); return u.origin === location.origin || u.protocol === 'data:' || u.protocol === 'blob:'; } catch (_) { return false; }
    }
    function rpDrawText(n, cs, k) {
        const o = rp.octx, range = document.createRange(); range.selectNodeContents(n);
        const rects = range.getClientRects(); if (!rects.length) return;
        const r = rects[0];
        let text = n.textContent.replace(/\s+/g, ' ').trim();
        if (cs.textTransform === 'uppercase') text = text.toUpperCase(); else if (cs.textTransform === 'lowercase') text = text.toLowerCase();
        o.font = `${cs.fontStyle} ${cs.fontWeight} ${parseFloat(cs.fontSize) * k.sx}px ${cs.fontFamily}`;
        try { o.letterSpacing = ((parseFloat(cs.letterSpacing) || 0) * k.sx) + 'px'; } catch (_) {}
        o.fillStyle = cs.color; o.textBaseline = 'middle'; o.textAlign = 'left';
        const sh = /(rgba?\([^)]+\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px(?:\s+(-?[\d.]+)px)?/.exec(cs.textShadow || '');
        if (sh) { o.shadowColor = sh[1]; o.shadowOffsetX = parseFloat(sh[2]) * k.sx; o.shadowOffsetY = parseFloat(sh[3]) * k.sy; o.shadowBlur = (parseFloat(sh[4]) || 0) * k.sx; }
        o.fillText(text, (r.left - k.ox) * k.sx, ((r.top + r.bottom) / 2 - k.oy) * k.sy);
        o.shadowColor = 'transparent'; o.shadowBlur = 0; o.shadowOffsetX = o.shadowOffsetY = 0;
    }
    function rpWalk(e, k) {
        const o = rp.octx;
        if (rpIgnored(e) || !rpVisible(e)) return;
        const rect = e.getBoundingClientRect(), cs = getComputedStyle(e);
        const op = Math.max(0, Math.min(1, rpEffOpacity(e)));
        if (op > 0 && (rect.width > 0 || rect.height > 0)) {
            o.globalAlpha = op;
            const x = (rect.left - k.ox) * k.sx, y = (rect.top - k.oy) * k.sy, w = rect.width * k.sx, h = rect.height * k.sy;
            const rad = (parseFloat(cs.borderTopLeftRadius) || 0) * k.sx;
            const bg = cs.backgroundColor;
            if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)' && !(rp.canvas && e.contains(rp.canvas))) {
                o.fillStyle = bg; o.beginPath(); if (o.roundRect) o.roundRect(x, y, w, h, rad); else o.rect(x, y, w, h); o.fill();
            }
            const bw = parseFloat(cs.borderTopWidth) || 0;
            if (bw > 0 && cs.borderTopStyle !== 'none' && cs.borderTopColor !== 'rgba(0, 0, 0, 0)') {
                o.strokeStyle = cs.borderTopColor; o.lineWidth = bw * k.sx; o.beginPath();
                if (o.roundRect) o.roundRect(x + bw * k.sx / 2, y + bw * k.sy / 2, w - bw * k.sx, h - bw * k.sy, rad); else o.rect(x, y, w, h);
                o.stroke();
            }
            if (e.tagName === 'IMG' && e.complete && e.naturalWidth && rpSameOrigin(e.currentSrc || e.src)) { try { o.drawImage(e, x, y, w, h); } catch (_) {} }
            for (const n of e.childNodes) if (n.nodeType === 3 && n.textContent.trim()) rpDrawText(n, cs, k);
            o.globalAlpha = 1;
        }
        for (const c of e.children) rpWalk(c, k);
    }
    function rpUpdateOverlay() {
        const c = rp.canvas, w = c.width, h = c.height;
        if (rp.ov.width !== w || rp.ov.height !== h) { rp.ov.width = w; rp.ov.height = h; }
        rp.octx.clearRect(0, 0, w, h);
        const br = c.getBoundingClientRect();
        const k = { sx: w / br.width, sy: h / br.height, ox: br.left, oy: br.top };
        Array.from(document.body.children).forEach(el => rpWalk(el, k));
    }
    function rpComposeFrame() {
        const c = rp.canvas, w = c.width, h = c.height;
        if (rp.comp.width !== w || rp.comp.height !== h) { rp.comp.width = w; rp.comp.height = h; }
        rp.cctx.drawImage(c, 0, 0);                    // 描画直後なのでWebGLの中身が読める
        if (M.replayUI) {
            const now = performance.now();
            if (now - rp.lastOv >= 1000 / RP_OV_FPS) { rp.lastOv = now; rpUpdateOverlay(); }
            rp.cctx.drawImage(rp.ov, 0, 0);
        }
        rp.frames++;
    }
    function rpStartSlot() {
        const chunks = [];
        const rec = new MediaRecorder(rp.stream, { mimeType: rpMime, videoBitsPerSecond: M.replayMbps * 1e6 });
        rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
        rec.start(1000);
        const slot = { rec, chunks, start: performance.now() };
        rp.slots.push(slot);
        return slot;
    }
    function rpStopSlot(s) {
        try { s.rec.ondataavailable = null; if (s.rec.state !== 'inactive') s.rec.stop(); } catch (_) {}
        rp.slots = rp.slots.filter(x => x !== s);
    }
    function rpStopAll() {
        clearTimeout(rp.stagger); clearInterval(rp.tick);
        rp.slots.slice().forEach(rpStopSlot);
        if (rp.stream) { rp.stream.getTracks().forEach(x => x.stop()); rp.stream = null; }
        rp.canvas = null;
    }
    function rpStartAll() {
        if ((!M.replayOn && !rp.manual) || !rpMime) return;
        rp.canvas = modsMainCanvas();
        if (!rp.canvas) { rp.stagger = setTimeout(rpStartAll, 1000); return; }
        try {
            if (rp.compose) {
                rp.comp = rp.comp || document.createElement('canvas'); rp.cctx = rp.cctx || rp.comp.getContext('2d');
                rp.ov = rp.ov || document.createElement('canvas'); rp.octx = rp.octx || rp.ov.getContext('2d');
                rp.comp.width = rp.canvas.width; rp.comp.height = rp.canvas.height; rp.frames = 0;
                rp.stream = rp.comp.captureStream(RP_FPS);
            } else {
                rp.stream = rp.canvas.captureStream(RP_FPS);
            }
        } catch (e) { console.error('[LOL.ex replay]', e); return; }
        rp.startedAt = performance.now();
        rpStartSlot();
        if (!rp.manual) rp.stagger = setTimeout(() => { if (M.replayOn) rpStartSlot(); }, M.replayMin * 1000);
        rp.tick = setInterval(rpTick, 1000);
    }
    function rpRestart() { rpStopAll(); rp.compose = true; rpStartAll(); }
    function rpTick() {
        if (!rp.canvas || !rp.canvas.isConnected) { if (rp.manual) { rpManualStop(true); } else rpRestart(); return; }
        if (rp.compose && rp.frames === 0 && performance.now() - rp.startedAt > 5000) {
            console.warn('[LOL.ex replay] 合成フレームが来ないため、キャンバスのみ録画に切り替えます');
            rpStopAll(); rp.compose = false; rpStartAll(); return;
        }
        const now = performance.now();
        if (!rp.manual) for (const s of rp.slots.slice()) if (now - s.start >= M.replayMin * 2000) { rpStopSlot(s); rpStartSlot(); }
        modsUpdateReplayStatus();
    }
    async function rpSave() {
        if (!rp.slots.length) { modsToast(t('modsReplayNotRec')); return; }
        const slot = rp.slots.reduce((a, b) => (a.start <= b.start ? a : b));
        const sec = Math.round((performance.now() - slot.start) / 1000);
        await new Promise(res => {
            const prev = slot.rec.ondataavailable;
            slot.rec.ondataavailable = e => { prev && prev(e); slot.rec.ondataavailable = prev; res(); };
            try { slot.rec.requestData(); } catch (_) { res(); }
            setTimeout(res, 1500);
        });
        const blob = new Blob(slot.chunks, { type: 'video/webm' });
        const d = new Date(), p2 = n => String(n).padStart(2, '0');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `lolbeans-replay-${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}.webm`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 30000);
        modsToast(`${t('modsReplaySaved')}: ${sec}s (${(blob.size / 1048576).toFixed(1)}MB)`);
    }
    // 常に保存オフ時の手動録画
    function rpManualStart() {
        if (M.replayOn || rp.manual) return;
        if (!rpMime) { modsToast('MediaRecorder/WebM 非対応'); return; }
        rp.manual = true; rp.compose = true; rpStartAll();
        modsToast(t('modsReplayRecStarted')); modsUpdateReplayStatus();
    }
    async function rpManualStop(save) {
        if (!rp.manual) return;
        try { if (save) await rpSave(); } finally { rp.manual = false; rpStopAll(); modsUpdateReplayStatus(); }
    }
    function rpAction() { if (M.replayOn) rpSave(); else if (rp.manual) rpManualStop(true); else rpManualStart(); }
    function modsSyncReplayButton() {
        const b = document.getElementById('modsReplaySave'); if (!b) return;
        const mode = M.replayOn ? 'save' : (rp.manual ? 'stop' : 'start');
        if (b.dataset.mode === mode) return; b.dataset.mode = mode;
        const icon = mode === 'save' ? 'fa-save' : (mode === 'stop' ? 'fa-stop' : 'fa-circle');
        const label = mode === 'save' ? t('modsReplaySave') : (mode === 'stop' ? t('modsReplayStopSave') : t('modsReplayStart'));
        b.innerHTML = `<i class="fas ${icon}"></i> ${label}<span class="lolex-hk"> (Alt+S)</span>`;
        b.classList.toggle('danger', mode === 'stop'); b.classList.toggle('accent', mode !== 'stop');
    }
    function modsUpdateReplayStatus() {
        modsSyncReplayButton();
        const s = document.getElementById('modsReplayStatus');
        if (!s) return;
        if (rp.manual) { const st = rp.slots.length ? Math.round((performance.now() - rp.slots[0].start) / 1000) : 0; s.textContent = `REC — ${st}s`; return; }
        if (!M.replayOn) { s.textContent = 'OFF'; return; }
        const oldest = rp.slots.length ? Math.round((performance.now() - Math.min(...rp.slots.map(x => x.start))) / 1000) : 0;
        s.textContent = `ON — ${oldest}s${rp.compose ? ' (UI)' : ''}`;
    }

    // ---------- レンダラーを包む(render はインスタンスごとに定義されるためコンストラクタごと) ----------
    function modsHookRenderer(r) {
        const spr = r.setPixelRatio;
        if (typeof spr === 'function' && !spr.__lolex) {
            const w = function (v) {
                modsBasePR.set(r, v);
                const f = modsIsMain(r) ? modsPixelFactor() : 1;
                modsLastF.set(r, f);
                return spr.call(this, v * f);
            };
            w.__lolex = true; r.setPixelRatio = w;
        }
        const orig = r.render;
        if (typeof orig === 'function' && !orig.__lolex) {
            const rw = function (scene, camera) {
                try {
                    if (camera && camera.isPerspectiveCamera && camera.rotation.order === 'YXZ' && scene && scene.children) {
                        const lp = modsLocalPlayer(scene, camera);
                        if (lp) MW.__lolexPlayer = lp;
                        if (M.fpv && lp) { modsApplyFPV(lp, camera); _fpvWasOn = true; }
                        else if (_fpvWasOn) { _fpvWasOn = false; if (_fpvNearSet) { camera.near = 0.1; let g = 75; try { g = parseFloat(localStorage.getItem('FOV')) || 75; } catch (_) {} camera.fov = g; camera.updateProjectionMatrix(); _fpvNearSet = false; } }
                        modsApplyFOV(camera);
                        modsApplyBones(scene, lp);
                    }
                } catch (e) { console.error('[LOL.ex mods]', e); }
                const res = orig.apply(this, arguments);
                try { if (rp.stream && rp.compose && rp.canvas && r.domElement === rp.canvas) rpComposeFrame(); } catch (e) { console.error('[LOL.ex replay]', e); }
                return res;
            };
            rw.__lolex = true; r.render = rw;
        }
        modsRenderers.add(r);
    }
    function modsInstall() {
        const T = MW.THREE;
        if (!T || !T.WebGLRenderer) return false;
        if (T.WebGLRenderer.__lolexHooked) return true;
        modsT = T;
        const Orig = T.WebGLRenderer;
        const Wrapped = function (...args) {
            const r = Reflect.construct(Orig, args, new.target || Wrapped);
            modsHookRenderer(r);
            return r;
        };
        Wrapped.prototype = Orig.prototype;
        Object.setPrototypeOf(Wrapped, Orig);
        Wrapped.__lolexHooked = true;
        T.WebGLRenderer = Wrapped;
        console.log('[LOL.ex] game hooks installed');
        return true;
    }
    const _modsHookTimer = setInterval(() => { if (modsInstall()) clearInterval(_modsHookTimer); }, 20);

    // ---------- ホットキー ----------
    window.addEventListener('keydown', (e) => {
        if (!e.altKey) return;
        if (e.code === 'KeyV') {
            M.fpv = !M.fpv; modsSave();
            const cb = document.getElementById('modsFpvToggle'); if (cb) cb.checked = M.fpv;
            modsToast(`${t('modsFpv')}: ${M.fpv ? 'ON' : 'OFF'}`);
            e.preventDefault(); e.stopImmediatePropagation();
        } else if (e.code === 'KeyS') {
            rpAction(); e.preventDefault(); e.stopImmediatePropagation();
        }
    }, true);

    // ---------- 起動 ----------
    (function modsBoot() {
        if (!rpMime) { console.warn('[LOL.ex replay] MediaRecorder/WebM 非対応'); return; }
        const go = () => { rp.compose = true; rpStartAll(); };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
    })();

    // ---------- 設定UI ----------
    function modsRangeRow(id, labelHtml, min, max, step, value, fmt) {
        const row = document.createElement('div'); row.className = 'lolex-setting-row';
        const label = document.createElement('label'); label.htmlFor = id; label.className = 'setting-name'; label.innerHTML = labelHtml;
        const box = document.createElement('div'); box.style.cssText = 'display:flex;align-items:center;gap:8px;';
        const input = document.createElement('input'); input.type = 'range'; input.id = id; input.min = min; input.max = max; input.step = step; input.value = value;
        input.dataset.fmt = fmt || '';
        const val = document.createElement('span'); val.className = 'lolex-range-val'; val.id = id + 'Val';
        val.textContent = modsFmt(value, fmt);
        box.appendChild(input); box.appendChild(val); row.appendChild(label); row.appendChild(box);
        return row;
    }
    function modsFmt(v, fmt) {
        if (fmt === 'x') return '×' + Number(v).toFixed(1);
        if (fmt === 'deg') return Math.round(v) + '°';
        if (fmt === 'pct') return Math.round(v) + '%';
        return String(v);
    }
    function modsSelectRow(id, labelHtml, options, value) {
        const row = document.createElement('div'); row.className = 'lolex-setting-row';
        const label = document.createElement('label'); label.htmlFor = id; label.className = 'setting-name'; label.innerHTML = labelHtml;
        const sel = document.createElement('select'); sel.id = id;
        options.forEach(([v, text]) => { const o = document.createElement('option'); o.value = v; o.textContent = text; if (String(v) === String(value)) o.selected = true; sel.appendChild(o); });
        row.appendChild(label); row.appendChild(sel);
        return row;
    }

    // ---------- 使い方ガイド ----------
    function lolexBuildHelp(container) {
        const ja = getLang() === 'ja';
        const T = [
            ['help_basic', 'fas fa-book', ja ? '基本' : 'Basics', ja ? [
                "画面上のタブ「LOL.ex」から設定を開き、上のカテゴリタブで切り替えます。",
                "カードの見出しをタップ(クリック)すると、折りたためます。",
                "設定は自動で保存され、再読み込みしても残ります。",
                "見た目に関する機能は、自分の画面にだけ反映されます。"
            ] : [
                "Open the LOL.ex tab at the top and switch pages with the category tabs.",
                "Tap (click) a card header to collapse it.",
                "Settings are saved automatically and stay after reloading.",
                "Visual features only affect your own screen."
            ]],
            ['help_quick', 'fas fa-bolt', ja ? '簡易メニュー' : 'Quick Menu', ja ? [
                "PC: Alt+Q で開閉します(Esc・✕でも閉じます)。",
                "スマホ: 画面の右端から左へスワイプ、または右端のつまみをタップで開きます。右へスワイプ・✕・外側タップで閉じます。",
                "一人称視点・反転・フィルター・回転・キー表示・音楽・録画を、設定画面を開かずにすぐ切り替えられます。"
            ] : [
                "PC: Alt+Q toggles it (Esc or the X also closes it).",
                "Mobile: swipe left from the right screen edge, or tap the small handle on the right edge. Swipe right, tap X or tap outside to close.",
                "Quickly switch first-person view, flips, filter, rotation, key display, music and recording without opening Settings."
            ]],
            ['help_game', 'fas fa-flag-checkered', ja ? 'ゲーム補助' : 'Game Helpers', ja ? [
                "Air Move 自動切り替えをONにすると、コースが変わるたびに「コース別設定」に従ってAir Moveが自動で切り替わります。OFFなら手動設定のままです。",
                "ベストタイム計算: 「タイムを計算」でAPIからベストタイムを取得して合計を出します(同名コースは最速タイムのみ)。「保存」でサムネイル付きの一覧をPNGで保存できます。"
            ] : [
                "With Air Move auto-switch on, Air Move changes automatically on each course change based on the per-course settings. When off, your manual setting is kept.",
                "Best times: press Calculate to fetch your best times from the API and total them (only the fastest time per course name). Save exports the list with thumbnails as a PNG."
            ]],
            ['help_look', 'fas fa-paint-brush', ja ? '見た目・表示' : 'Appearance', ja ? [
                "UIメイン/サブカラーでテーマ色を変えられます。背景画像はURLリストからランダムに適用でき、「リストを編集」で管理します。",
                "キー/マウス入力表示: 押しているキーやマウスボタンをゲーム画面に表示します。表示するキーの追加と表示位置の変更ができます。"
            ] : [
                "Change the theme colors with the UI main/sub color pickers. Background images are applied at random from a URL list you manage with Edit list.",
                "Key/mouse input display: shows the keys and mouse buttons you press on the game screen. You can add keys and change its position."
            ]],
            ['help_music', 'fas fa-music', ja ? '音楽 (YouTube)' : 'Music (YouTube)', ja ? [
                "YouTubeのURLまたはIDを入力してEnterで読み込みます。再生・曲送り・音量はプレイヤーのカードで操作します。",
                "プレイヤーの表示/非表示は、設定した表示キー(初期設定 Ctrl+M)か、右下のフロートボタンで切り替えます。",
                "「YouTube BGMプレイヤーを使う」をオフにすると、プレイヤー機能ごと無効になります。"
            ] : [
                "Enter a YouTube URL or ID and press Enter to load it. Play, skip and volume are on the player card.",
                "Show or hide the player with the toggle key (default Ctrl+M) or the floating button at the bottom right.",
                "Turning off Enable YouTube BGM player disables the whole player feature."
            ]],
            ['help_view', 'fas fa-eye', ja ? '視点・演出' : 'View & Effects', ja ? [
                "一人称視点: ON/OFFで切り替えます(PCは Alt+V でも可)。位置は固定です。",
                "演出: 左右・上下の反転、回転、フィルター、ピクセル化、頭・手・足の拡大に対応しています。対象は「自分だけ」か「全員」を選べ、「リセット」で元に戻せます。"
            ] : [
                "First-person view: toggle ON/OFF (PC: Alt+V also works). Its position is fixed.",
                "Effects: horizontal/vertical flip, rotation, filters, pixelation and head/hand/foot scaling. Choose yourself only or everyone, and use Reset to restore defaults."
            ]],
            ['help_rec', 'fas fa-video', ja ? '録画 (リプレイ)' : 'Recording', ja ? [
                "「常に保存」がオン: 直近の映像を常に保持します。Alt+S か「今すぐ保存」で保存します(長さは最低保持秒数〜その2倍)。",
                "「常に保存」がオフ: ボタンか Alt+S で録画を開始し、もう一度押すと停止して保存します。",
                "保存形式はWebMで、音は入りません。"
            ] : [
                "Always-on ON: the most recent footage is always kept. Alt+S or Save now saves it (length is between the minimum and twice that).",
                "Always-on OFF: the button or Alt+S starts a recording; press again to stop and save.",
                "Files are saved as WebM, without audio."
            ]]
        ];
        return T.map(([key, icon, title, items]) => {
            const fs = document.createElement('fieldset');
            fs.innerHTML = `<legend><i class="${icon}"></i> ${title}</legend><div class="lolex-update-text"><ul class="lolex-upd-list">${items.map(x => `<li>${x}</li>`).join('')}</ul></div>`;
            container.appendChild(fs);
            return [fs, key];
        });
    }

    function modsBuildSettings(container) {
        if (!document.getElementById('lolex-mods-style')) {
            const st = document.createElement('style'); st.id = 'lolex-mods-style';
            st.textContent = '.lolex-setting-row input[type=range]{width:150px;accent-color:var(--primary-color);} .lolex-range-val{min-width:46px;text-align:right;font-variant-numeric:tabular-nums;}';
            document.head.appendChild(st);
        }
        const out = [];

        // ── 視点・FOV ──
        const viewFs = document.createElement('fieldset');
        const vl = document.createElement('legend'); vl.innerHTML = `<i class="fas fa-eye"></i> ${t('modsViewTitle')}`; viewFs.appendChild(vl);
        viewFs.appendChild(makeToggleRow('modsFpvToggle', `<i class="fas fa-user"></i>${t('modsFpv')}<span class="lolex-hk"> (Alt+V)</span>`, M.fpv));
        const vn = document.createElement('div'); vn.className = 'lolex-note'; vn.textContent = t('modsViewNote'); viewFs.appendChild(vn);
        container.appendChild(viewFs); out.push([viewFs, 'modsview']);

        // ── 画面演出・キャラ ──
        const fxFs = document.createElement('fieldset');
        const fl = document.createElement('legend'); fl.innerHTML = `<i class="fas fa-magic"></i> ${t('modsFxTitle')}`; fxFs.appendChild(fl);
        fxFs.appendChild(makeToggleRow('modsFlipX', `<i class="fas fa-arrows-alt-h"></i>${t('modsFlipX')}`, M.flipX));
        fxFs.appendChild(makeToggleRow('modsFlipY', `<i class="fas fa-arrows-alt-v"></i>${t('modsFlipY')}`, M.flipY));
        fxFs.appendChild(modsRangeRow('modsRot', `<i class="fas fa-redo"></i>${t('modsRot')}`, -180, 180, 1, M.rot, 'deg'));
        fxFs.appendChild(modsRangeRow('modsSpin', `<i class="fas fa-sync"></i>${t('modsSpin')}`, -180, 180, 5, M.spin, 'deg'));
        fxFs.appendChild(modsSelectRow('modsFilter', `<i class="fas fa-palette"></i>${t('modsFilter')}`, [
            ['none', t('modsFNone')], ['gray', t('modsFGray')], ['sepia', t('modsFSepia')], ['neon', t('modsFNeon')],
            ['invert', t('modsFInvert')], ['cold', t('modsFCold')], ['psyche', t('modsFPsyche')], ['drunk', t('modsFDrunk')]], M.filter));
        fxFs.appendChild(modsRangeRow('modsPixel', `<i class="fas fa-th"></i>${t('modsPixel')}`, 3, 100, 1, M.pixel, 'pct'));
        fxFs.appendChild(modsSelectRow('modsTarget', `<i class="fas fa-users"></i>${t('modsTarget')}`, [['me', t('modsTargetMe')], ['all', t('modsTargetAll')]], M.target));
        fxFs.appendChild(modsRangeRow('modsHead', `<i class="fas fa-smile"></i>${t('modsHead')}`, 0.2, 5, 0.1, M.head, 'x'));
        fxFs.appendChild(modsRangeRow('modsHand', `<i class="fas fa-hand-paper"></i>${t('modsHand')}`, 0.2, 5, 0.1, M.hand, 'x'));
        fxFs.appendChild(modsRangeRow('modsFoot', `<i class="fas fa-shoe-prints"></i>${t('modsFoot')}`, 0.2, 5, 0.1, M.foot, 'x'));
        const fg = document.createElement('div'); fg.className = 'lolex-btn-group';
        fg.innerHTML = `<button id="modsFxReset" class="danger"><i class="fas fa-undo"></i> ${t('modsFxReset')}</button>`;
        fxFs.appendChild(fg);
        const fn = document.createElement('div'); fn.className = 'lolex-note'; fn.textContent = t('modsFxNote'); fxFs.appendChild(fn);
        container.appendChild(fxFs); out.push([fxFs, 'modsfx']);

        // ── インスタントリプレイ ──
        const rpFs = document.createElement('fieldset');
        const rl = document.createElement('legend'); rl.innerHTML = `<i class="fas fa-video"></i> ${t('modsReplayTitle')}`; rpFs.appendChild(rl);
        rpFs.appendChild(makeToggleRow('modsReplayOn', `<i class="fas fa-circle"></i>${t('modsReplayEnable')}`, M.replayOn));
        rpFs.appendChild(modsSelectRow('modsReplayMin', `<i class="fas fa-clock"></i>${t('modsReplayMin')}`, [[30, '30s'], [60, '60s'], [90, '90s'], [120, '120s']], M.replayMin));
        rpFs.appendChild(modsSelectRow('modsReplayMbps', `<i class="fas fa-tachometer-alt"></i>${t('modsReplayBitrate')}`, [[2, '2 Mbps'], [4, '4 Mbps'], [6, '6 Mbps'], [8, '8 Mbps']], M.replayMbps));
        rpFs.appendChild(makeToggleRow('modsReplayUI', `<i class="fas fa-layer-group"></i>${t('modsReplayUI')}`, M.replayUI));
        const sr = document.createElement('div'); sr.className = 'lolex-setting-row';
        sr.innerHTML = `<span class="setting-name"><i class="fas fa-info-circle"></i>${t('modsReplayStatus')}</span><span id="modsReplayStatus" class="lolex-range-val" style="min-width:90px"></span>`;
        rpFs.appendChild(sr);
        const rg = document.createElement('div'); rg.className = 'lolex-btn-group';
        rg.innerHTML = `<button id="modsReplaySave" class="accent"><i class="fas fa-save"></i> ${t('modsReplaySave')}<span class="lolex-hk"> (Alt+S)</span></button>`;
        rpFs.appendChild(rg);
        const rn = document.createElement('div'); rn.className = 'lolex-note'; rn.textContent = t('modsReplayNote'); rpFs.appendChild(rn);
        container.appendChild(rpFs); out.push([rpFs, 'modsreplay']);
        setTimeout(modsUpdateReplayStatus, 0);
        return out;
    }

    // ---------- 設定画面をカテゴリ(タブ)で分ける ----------
    const LOLEX_CATS = [
        { id: 'info',  icon: 'fa-info-circle', label: 'catInfo',  keys: ['update', 'lang'] },
        { id: 'game',  icon: 'fa-flag-checkered', label: 'catGame', keys: ['airmove', 'course', 'besttimes', 'chattr'] },
        { id: 'look',  icon: 'fa-paint-brush', label: 'catLook',  keys: ['visual', 'keydisplay'] },
        { id: 'music', icon: 'fa-music',       label: 'catMusic', keys: ['yt'] },
        { id: 'view',  icon: 'fa-eye',         label: 'catView',  keys: ['modsview', 'modsfx'] },
        { id: 'rec',   icon: 'fa-video',       label: 'catRec',   keys: ['modsreplay'] },
        { id: 'help',  icon: 'fa-question-circle', label: 'catHelp', keys: ['help_basic', 'help_quick', 'help_game', 'help_look', 'help_music', 'help_view', 'help_rec'] },
    ];
    // Google Fonts の Material Symbols を読み込む(読み込み完了後にだけアイコンを表示)
    function lolexEnsureMaterialFont() {
        if (document.getElementById('lolex-ms-font')) return;
        const l = document.createElement('link'); l.id = 'lolex-ms-font'; l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,500,1,0&display=block';
        l.onload = () => {
            try {
                document.fonts.load('20px "Material Symbols Rounded"', 'language')
                    .then(() => document.documentElement.classList.add('lolex-ms-ready'))
                    .catch(() => {});
            } catch (_) {}
        };
        (document.head || document.documentElement).appendChild(l);
    }
    const LOLEX_MS_ICONS = {
        update: 'info', lang: 'language', airmove: 'swap_horiz', course: 'flag', besttimes: 'timer', chattr: 'translate',
        visual: 'palette', keydisplay: 'keyboard', yt: 'music_note',
        modsview: 'visibility', modsfx: 'auto_fix_high', modsreplay: 'videocam',
        help_basic: 'menu_book', help_quick: 'bolt', help_game: 'flag', help_look: 'palette', help_music: 'music_note', help_view: 'visibility', help_rec: 'videocam'
    };
    function lolexApplySettingsCategories(container, fsList) {
        lolexEnsureMaterialFont();
        if (!document.getElementById('lolex-cat-style')) {
            const st = document.createElement('style'); st.id = 'lolex-cat-style';
            st.textContent = [
                /* ===== カテゴリタブ(下線タイプ・フラット) ===== */
                '.lolex-cat-bar{display:flex;flex-wrap:wrap;gap:2px;margin:0 0 14px;position:sticky;top:0;z-index:5;padding:0;background:var(--col-bg);border-bottom:1px solid var(--col-border);}',
                '.lolex-cat-bar button{padding:9px 14px;border:none;border-bottom:2px solid transparent;border-radius:0;background:transparent;color:var(--col-sub);cursor:pointer;font-size:.88em;font-weight:600;margin-bottom:-1px;transition:color .15s,border-color .15s;}',
                '.lolex-cat-bar button i{margin-right:5px;opacity:.8;}',
                '.lolex-cat-bar button:hover{color:var(--col-text);}',
                '.lolex-cat-bar button.active{color:var(--primary-color);border-bottom-color:var(--primary-color);background:transparent;font-weight:700;}',
                /* ===== カード配置(1行に複数) ===== */
                '#lolex-settings{display:grid !important;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;align-items:start;}',
                '#lolex-settings > :not(fieldset){grid-column:1/-1;}',
                '#lolex-settings > fieldset{min-width:0;margin:0;border:1px solid var(--col-border);border-radius:10px;background:var(--col-surface);box-shadow:none;}',
                '#lolex-settings > fieldset:hover{border-color:var(--col-border);}',
                /* ===== カード見出し(塗りなし・フラット) ===== */
                /* legendがfieldsetの枠線にまたがる標準描画をやめ、カード内の通常ヘッダーにする */
                '#lolex-settings legend{float:left;width:100%;box-sizing:border-box;padding:10px 12px;font-size:.86em;font-weight:700;letter-spacing:0;text-transform:none;color:var(--col-text);background:rgba(255,255,255,.05);background:color-mix(in srgb,var(--primary-color) 13%,transparent);border-bottom:1px solid var(--col-border);border-radius:0;}',
                '#lolex-settings legend + *{clear:both;}',
                '#lolex-settings fieldset.lolex-collapsed legend{border-bottom-color:transparent;}',
                '#lolex-settings legend i{color:var(--primary-color);margin-right:2px;}',
                '#lolex-settings legend .legend-arrow{opacity:.45;}',
                '#lolex-settings legend:hover .legend-arrow{opacity:.9;}',
                /* ===== 設定行(ラベル左・操作右・ホバーで行ハイライト) ===== */
                '#lolex-settings .lolex-setting-row{padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.05);transition:background .12s;}',
                '#lolex-settings .lolex-setting-row:hover{background:rgba(255,255,255,.035);}',
                '#lolex-settings .lolex-setting-row .setting-name{white-space:normal;overflow:visible;text-overflow:clip;line-height:1.4;}',
                /* ラベルのアイコンは控えめに(色付きドットなど個別指定のものは除外) */
                '#lolex-settings .lolex-setting-row .setting-name i:not([style]){color:var(--col-sub);width:1.25em;text-align:center;}',
                /* ===== 操作部品を統一 ===== */
                '#lolex-settings .lolex-setting-row select,#lolex-settings .lolex-setting-row input[type=text]{min-width:0;max-width:150px;height:28px;padding:0 8px;border-radius:6px;}',
                '#lolex-settings .lolex-setting-row input[type=range]{width:120px;}',
                '#lolex-settings .lolex-setting-row button{background:transparent;color:var(--primary-color);border:1px solid var(--primary-color);}',
                '#lolex-settings .lolex-setting-row button:hover{background:var(--primary-color);color:#0d0d14;}',
                /* ===== ボタン群:通常は枠線、強調だけ塗り ===== */
                '#lolex-settings .lolex-btn-group{padding:8px 12px;flex-wrap:wrap;}',
                '#lolex-settings .lolex-btn-group button:not(.accent):not(.danger):not(.muted){background:transparent;color:var(--primary-color);border:1px solid var(--primary-color);}',
                '#lolex-settings .lolex-btn-group button:not(.accent):not(.danger):not(.muted):hover{background:var(--primary-color);color:#0d0d14;}',
                /* ===== 補足文は控えめに ===== */
                '#lolex-settings .lolex-note{color:var(--col-sub);padding:6px 12px 8px;}',
                '#lolex-settings .lolex-update-text{padding:10px 12px 6px;}',
                /* ===== カード見出しのGoogleアイコン(Material Symbols)。読み込めた時だけ表示、失敗時は従来アイコン ===== */
                '.lolex-ic{display:none;font-family:"Material Symbols Rounded";font-weight:400;font-style:normal;font-size:20px;line-height:1;letter-spacing:normal;text-transform:none;white-space:nowrap;direction:ltr;-webkit-font-feature-settings:"liga";font-feature-settings:"liga";-webkit-font-smoothing:antialiased;color:var(--primary-color);}',
                '.lolex-ms-ready .lolex-ic{display:inline-block;}',
                '.lolex-ms-ready #lolex-settings legend > i,.lolex-ms-ready #lolex-settings legend .legend-left > i{display:none;}',
                /* ===== 最新アップデート情報(箇条書きカード・横幅いっぱい) ===== */
                '#lolex-settings[data-cat="info"]{grid-template-columns:repeat(2,minmax(0,1fr));}',
                '#lolex-settings .lolex-update-text{padding:10px 14px 8px;}',
                '#lolex-settings .lolex-upd-head{margin-bottom:4px;}',
                '#lolex-settings .lolex-version-badge{margin:0;padding:2px 10px;color:var(--primary-color);border-color:var(--primary-color);font-weight:700;font-size:.8em;}',
                '#lolex-settings .lolex-upd-list{list-style:none;margin:0;padding:0;}',
                '#lolex-settings .lolex-upd-list li{position:relative;padding:8px 0 8px 18px;font-size:.9em;line-height:1.6;border-bottom:1px solid rgba(255,255,255,.07);}',
                '#lolex-settings .lolex-upd-list li:last-child{border-bottom:none;}',
                '#lolex-settings .lolex-upd-list li:before{content:"";position:absolute;left:4px;top:1.1em;width:6px;height:6px;border-radius:50%;background:var(--primary-color);}',
                /* ===== YouTubeプレイヤー機能オフ時は親トグル以外を隠す ===== */
                '#lolex-settings fieldset.lolex-yt-off .lolex-setting-row:not(.lolex-yt-master),#lolex-settings fieldset.lolex-yt-off .lolex-note{display:none;}',
                /* ===== スマホ対応 ===== */
                '@media (pointer:coarse){.lolex-hk,#lolex-settings .lolex-hk-row{display:none !important;} #lolex-settings .switch{transform:scale(1.15);margin-right:3px;}}',
                '@media (max-width:700px){',
                '#lolex-settings,#lolex-settings[data-cat]{grid-template-columns:minmax(0,1fr);gap:10px;}',
                '.lolex-cat-bar{flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;}',
                '.lolex-cat-bar::-webkit-scrollbar{display:none;}',
                '.lolex-cat-bar button{white-space:nowrap;flex:0 0 auto;padding:11px 14px;}',
                '#lolex-settings legend{padding:13px 12px;}',
                '#lolex-settings .lolex-setting-row{padding:11px 12px;min-height:46px;}',
                '#lolex-settings .lolex-setting-row select,#lolex-settings .lolex-setting-row input[type=text]{height:34px;max-width:150px;font-size:16px;}',
                '#lolex-settings .lolex-setting-row input[type=range]{width:100px;}',
                '#lolex-settings .lolex-setting-row button{padding:8px 12px;}',
                '#lolex-settings .lolex-btn-group button{padding:10px 12px;}',
                'html #yt-card{width:150px;height:150px;right:10px;bottom:-200px;}',
                'html #yt-card.yt-card-visible{bottom:10px;}',
                'html #yt-url-panel{right:10px;bottom:178px;width:min(240px,calc(100vw - 20px));}',
                'html #yt-url-panel input{font-size:16px;}',
                'html #yt-float-btn{right:10px;bottom:170px;width:44px;height:44px;}',
                'html .yt-card-btn{padding:8px 6px;font-size:16px;}',
                'html #yt-card-volume{width:40px;}',
                '}'
            ].join(' ');
            document.head.appendChild(st);
        }
        const keyToCat = {};
        LOLEX_CATS.forEach(c => c.keys.forEach(k => { keyToCat[k] = c.id; }));
        fsList.forEach(([fs, key]) => { fs.dataset.lolexCat = keyToCat[key] || 'info'; });
        fsList.forEach(([fs, key]) => {
            fs.dataset.lolexKey = key;
            const name = LOLEX_MS_ICONS[key]; const lg = fs.querySelector(':scope > legend');
            if (!name || !lg || lg.querySelector('.lolex-ic')) return;
            const sp = document.createElement('span'); sp.className = 'lolex-ic'; sp.textContent = name;
            const host = lg.querySelector('.legend-left') || lg;
            host.insertBefore(sp, host.firstChild);
        });
        let cur = null; try { cur = localStorage.getItem('lolex-settings-cat'); } catch (_) {}
        if (!LOLEX_CATS.some(c => c.id === cur)) cur = 'info';
        const bar = document.createElement('div'); bar.className = 'lolex-cat-bar';
        const show = (id) => {
            container.dataset.cat = id;
            container.querySelectorAll(':scope > fieldset').forEach(fs => { fs.style.display = fs.dataset.lolexCat === id ? '' : 'none'; });
            bar.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.cat === id));
            try { localStorage.setItem('lolex-settings-cat', id); } catch (_) {}
        };
        LOLEX_CATS.forEach(c => {
            const b = document.createElement('button'); b.type = 'button'; b.dataset.cat = c.id;
            b.innerHTML = `<i class="fas ${c.icon}"></i> ${t(c.label)}`;
            b.addEventListener('click', () => show(c.id));
            bar.appendChild(b);
        });
        container.insertBefore(bar, container.firstChild);
        show(cur);
    }

    function modsBindSettings() {
        const bindRange = (id, apply) => {
            const el = document.getElementById(id); if (!el || el.dataset.lxBound) return; el.dataset.lxBound = '1';
            el.addEventListener('input', () => {
                const v = parseFloat(el.value);
                const lab = document.getElementById(id + 'Val'); if (lab) lab.textContent = modsFmt(v, el.dataset.fmt);
                apply(v); modsSave();
            });
        };
        const bindCheck = (id, apply) => {
            const el = document.getElementById(id); if (!el || el.dataset.lxBound) return; el.dataset.lxBound = '1';
            el.addEventListener('change', () => { apply(el.checked); modsSave(); });
        };
        const bindSel = (id, apply) => {
            const el = document.getElementById(id); if (!el || el.dataset.lxBound) return; el.dataset.lxBound = '1';
            el.addEventListener('change', () => { apply(el.value); modsSave(); });
        };
        bindCheck('modsFpvToggle', v => { M.fpv = v; });
        bindCheck('modsFlipX', v => { M.flipX = v; });
        bindCheck('modsFlipY', v => { M.flipY = v; });
        bindRange('modsRot', v => { M.rot = v; });
        bindRange('modsSpin', v => { M.spin = v; });
        bindSel('modsFilter', v => { M.filter = v; });
        bindRange('modsPixel', v => { M.pixel = v; modsSyncPixel(); });
        bindSel('modsTarget', v => { M.target = v; });
        bindRange('modsHead', v => { M.head = v; _bonesEver = true; });
        bindRange('modsHand', v => { M.hand = v; _bonesEver = true; });
        bindRange('modsFoot', v => { M.foot = v; _bonesEver = true; });
        const reset = document.getElementById('modsFxReset');
        if (reset && !reset.dataset.lxBound) {
            reset.dataset.lxBound = '1';
            reset.addEventListener('click', () => {
                Object.assign(M, { flipX: false, flipY: false, rot: 0, spin: 0, filter: 'none', pixel: 100, target: 'me', head: 1, hand: 1, foot: 1 });
                modsSave(); modsSyncPixel(); createSettings();
            });
        }
        bindCheck('modsReplayOn', async v => { if (v && rp.manual) await rpManualStop(true); M.replayOn = v; if (v) { rp.compose = true; rpStartAll(); } else rpStopAll(); modsUpdateReplayStatus(); });
        bindSel('modsReplayMin', v => { M.replayMin = parseInt(v); rpRestart(); });
        bindSel('modsReplayMbps', v => { M.replayMbps = parseInt(v); rpRestart(); });
        bindCheck('modsReplayUI', v => { M.replayUI = v; });
        const sv = document.getElementById('modsReplaySave');
        if (sv && !sv.dataset.lxBound) { sv.dataset.lxBound = '1'; sv.addEventListener('click', rpAction); }
    }

    // ================================================================================================
    //  ★ チャット自動翻訳
    //     選択中の言語(getLang)を翻訳先にして、それ以外の言語の発言を発言の下に表示します。
    //     言語の判定はGoogle翻訳の自動判定なので、日本語・韓国語・中国語に限らず全言語が対象です。
    //     ※ゲームは #feed / #feed-history の中身を innerHTML で丸ごと作り直すため、
    //       DOMの変化を監視して、作り直されるたびに翻訳を付け直しています。
    // ================================================================================================
    const CT = { cache: new Map(), pending: new Set(), queue: [], running: 0, targets: [], obs: null, timer: null, booted: false };
    const CT_MAX_CONCURRENT = 2, CT_CACHE_LIMIT = 500;
    const chatTrOn = () => getStoredBool(STORAGE.CHAT_TR, true);
    const chatTrTarget = () => (getLang() === 'en' ? 'en' : 'ja');

    function chatTrHttpGet(url) {
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest === 'function') {
                GM_xmlhttpRequest({
                    method: 'GET', url, timeout: 8000,
                    onload: (r) => (r.status >= 200 && r.status < 300 ? resolve(r.responseText) : reject(new Error('HTTP ' + r.status))),
                    onerror: () => reject(new Error('network')),
                    ontimeout: () => reject(new Error('timeout')),
                });
            } else {
                fetch(url).then(r => (r.ok ? r.text() : Promise.reject(new Error('HTTP ' + r.status)))).then(resolve, reject);
            }
        });
    }

    // 翻訳先 tl に翻訳。発言がすでに tl の言語、または翻訳結果が原文と同じなら null(=表示しない)
    async function chatTrTranslate(text, tl) {
        const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' +
            encodeURIComponent(tl) + '&dt=t&q=' + encodeURIComponent(text);
        const data = JSON.parse(await chatTrHttpGet(url));
        const detected = String(data[2] || '').toLowerCase();
        const out = (data[0] || []).map(s => (s && s[0]) || '').join('');
        if (detected === tl) return null;
        if (!out || out.trim().toLowerCase() === text.trim().toLowerCase()) return null;
        return out;
    }

    function chatTrSetCache(key, val) {
        CT.cache.set(key, val);
        if (CT.cache.size > CT_CACHE_LIMIT) CT.cache.delete(CT.cache.keys().next().value);
    }

    function chatTrPump() {
        while (CT.running < CT_MAX_CONCURRENT && CT.queue.length) {
            const job = CT.queue.shift();
            CT.running++;
            chatTrTranslate(job.text, job.tl)
                .then(out => chatTrSetCache(job.key, out))
                .catch(() => chatTrSetCache(job.key, null))   // 失敗した発言は何も表示しない
                .finally(() => { CT.pending.delete(job.key); CT.running--; chatTrScheduleScan(); chatTrPump(); });
        }
    }

    function chatTrEnqueue(text, tl, key) {
        if (CT.pending.has(key)) return;
        CT.pending.add(key);
        CT.queue.push({ text, tl, key });
        chatTrPump();
    }

    function chatTrEnsureStyle() {
        if (document.getElementById('lolex-chat-tr-style')) return;
        const st = document.createElement('style'); st.id = 'lolex-chat-tr-style';
        st.textContent = '.lolex-chat-tr{display:block;font-size:.85em;opacity:.9;color:#8fd3ff;padding-left:1vh;word-break:break-word;}';
        (document.head || document.documentElement).appendChild(st);
    }

    function chatTrExtract(msg) {
        const name = msg.querySelector('.namelabel');
        if (!name) return '';
        const clone = msg.cloneNode(true);
        clone.querySelectorAll('.lolex-chat-tr').forEach(n => n.remove());
        return (clone.textContent || '').slice((name.textContent || '').length).replace(/^\s*:\s*/, '').trim();
    }

    function chatTrAnnotate(root, tl) {
        root.querySelectorAll('.chatmsg').forEach(msg => {
            if (msg.querySelector('.lolex-chat-tr')) return;
            const text = chatTrExtract(msg);
            if (text.length < 2 || !/\p{L}/u.test(text)) return;
            const key = tl + '\u0000' + text;
            if (!CT.cache.has(key)) { chatTrEnqueue(text, tl, key); return; }
            const out = CT.cache.get(key);
            if (!out) return;
            const span = document.createElement('span');
            span.className = 'lolex-chat-tr';
            span.textContent = '↳ ' + out;
            msg.appendChild(span);
        });
    }

    function chatTrObserve() { CT.targets.forEach(tg => CT.obs.observe(tg, { childList: true, subtree: true })); }
    function chatTrScheduleScan() { if (CT.timer) return; CT.timer = setTimeout(() => { CT.timer = null; chatTrScan(); }, 30); }

    function chatTrScan() {
        if (!CT.booted || !chatTrOn()) return;
        CT.obs.disconnect();   // 自分の変更で再発火しないようにする
        try {
            const tl = chatTrTarget();
            CT.targets.forEach(tg => chatTrAnnotate(tg, tl));
            const h = document.getElementById('feed-history');
            if (h && h.dataset.lolexTrStick === '1') h.scrollTop = h.scrollHeight;
        } finally { chatTrObserve(); }
    }

    function chatTrRemoveAll() { document.querySelectorAll('.lolex-chat-tr').forEach(n => n.remove()); }
    function chatTrApply() { if (chatTrOn()) chatTrScan(); else chatTrRemoveAll(); }
    function chatTrReset() { chatTrRemoveAll(); chatTrScan(); }   // 言語を切り替えたとき

    function chatTrBoot() {
        const tryBoot = () => {
            const feed = document.getElementById('feed'), hist = document.getElementById('feed-history');
            if (!feed && !hist) return false;
            chatTrEnsureStyle();
            [feed, hist].filter(Boolean).forEach(tg => CT.targets.push(tg));
            if (hist) hist.addEventListener('scroll', () => {
                hist.dataset.lolexTrStick = hist.scrollTop + hist.clientHeight >= hist.scrollHeight - 8 ? '1' : '0';
            });
            CT.obs = new MutationObserver(() => chatTrScheduleScan());
            CT.booted = true;
            chatTrObserve();
            chatTrScan();
            return true;
        };
        if (tryBoot()) return;
        const iv = setInterval(() => { if (tryBoot()) clearInterval(iv); }, 500);
        setTimeout(() => clearInterval(iv), 300000);
    }

    chatTrBoot();
    initializeScript();

})();