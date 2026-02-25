// ==UserScript==
// @name         LOL.ex ver0.70 beta
// @namespace    http://tampermonkey.net/
// @version      0.70
// @description  LOLBeans extension with modal UI, icon tab, and update section. (TDZ fix)
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
    //                                  グローバル変数と定数
    // ------------------------------------------------------------------------------------------------

    const SCRIPT_VERSION = '0.70'; //バージョン


    let player;
    let isApiReady = false;
    let saveTimeInterval;
    let initCompleted = false; 
    let currentVideoId = null;

    // --- ストレージキー ---
    const STORAGE_VIDEO_KEY = 'yt-videoId';
    const STORAGE_PLAYLIST_KEY = 'yt-playlistId';
    const STORAGE_TIME_KEY = 'yt-last-time';
    const STORAGE_BACKGROUND_KEY = 'customBackgroundUrl';
    const STORAGE_CUSTOM_BG_LIST_KEY = 'customBackgroundList';
    const STORAGE_IS_VISIBLE = 'yt-is-visible';
    const STORAGE_LOOP = 'yt-loop';
    const STORAGE_SHUFFLE = 'yt-shuffle';
    const STORAGE_AIR_MOVE_AUTOSWITCH = 'airMoveAutoSwitchEnabled';
    const STORAGE_LANGUAGE_KEY = 'lolex-language';
    const STORAGE_PRIMARY_COLOR = 'lolex-primary-color';
    const STORAGE_SECONDARY_COLOR = 'lolex-secondary-color';
    const STORAGE_BG_SHUFFLE_KEY = 'customBackgroundShuffleIndex';

    // --- デフォルト値 ---
    const DEFAULT_PRIMARY = '#BB86FC';
    const DEFAULT_SECONDARY = '#03DAC6';
    const DEFAULT_BG_URLS = [
        'https://cdn.pixabay.com/photo/2020/05/23/16/27/night-5211029_1280.jpg',
        'https://cdn.pixabay.com/photo/2016/10/26/19/00/geometric-1772412_1280.jpg',
        'https://cdn.pixabay.com/photo/2016/11/22/19/27/abstract-1850119_1280.jpg',
        'https://cdn.pixabay.com/photo/2017/08/10/12/36/space-2621021_1280.jpg',
        'https://cdn.pixabay.com/photo/2019/12/11/04/00/abstract-4686127_1280.jpg',
        'https://cdn.pixabay.com/photo/2016/09/24/18/14/background-1692390_1280.jpg'
    ];

    // ★★★ 修正ここまで ★★★

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeScript);
    } else {
        initializeScript();
    }

    // (元の変数が宣言されていた場所から移動)
    let lastTime = parseFloat(localStorage.getItem(STORAGE_TIME_KEY)) || 0;
    currentVideoId = localStorage.getItem(STORAGE_VIDEO_KEY);

    // --- コースデータ ---
    const courses = [
        { id: 'beacon-bay', keyword: 'BeaconBay', message: '🚨 Beacon Bay 🚨', displayName: 'Beacon Bay' },
        { id: 'boulder-hill', keyword: "BoulderHill", message: "🐛 Boulder Hill 🐛", displayName: "Boulder Hill" },
        { id: 'circus-contest', keyword: "CircusContest", message: "🎪 Circus Contest 🎪", displayName: "Circus Contest" },
        { id: 'devils-trick', keyword: "DevilsTrick", message: "👿 Devil's Trick 👿", displayName: "Devils Trick" },
        { id: 'dash-cup', keyword: 'FastRace', message: '🏆 Dash Cup 🏆', displayName: 'Dash Cup' },
        { id: 'gravity-gates', keyword: "GravityGates", message: "🌌 Gravity Gates 🌌", displayName: "Gravity Gates" },
        { id: 'hammer-ville', keyword: "HammerVille", message: "🍩 Hammer Ville 🍩", displayName: "Hammer Ville" },
        { id: 'jungle-temple', keyword: "JungleTemple", message: "🐍 Jungle Temple 🐍", displayName: "Jungle Temple" },
        { id: 'kittie-kegs', keyword: "KittieKegs", message: "🐱 Kittie Kegs 🙀", displayName: "Kittie Kegs" },
        { id: 'lava-lake', keyword: "FloorIsLava", message: "🌋 Lava Lake 🌋", displayName: "Lava Lake" },
        { id: 'mecha-maze', keyword: "MechaMaze", message: "🤖 Mecha Maze 🤖", displayName: "Mecha Maze" },
        { id: 'mill-valley', keyword: "MillValley", message: "🌾 Mill Valley 🍃", displayName: "Mill Valley" },
        { id: 'monster-manor', keyword: "MonsterManor", message: "🎃 Monster Manor 💀", displayName: "Monster Manor" },
        { id: 'polar-path', keyword: "PolarPath", message: "🧊 Polar Path 🧊", displayName: "Polar Path" },
        { id: '123-red-light', keyword: "RedLightGreenLight", message: "🦑 1-2-3 Red Light 🦑", displayName: "1-2-3 Red Light" },
        { id: 'nasty-seals', keyword: "NastySeals", message: "🦑 Nasty Seals 🦑", displayName: "Nasty Seals" },
        { id: 'rickety-run', keyword: "RicketyRun", message: "🟦 Rickety Run 🟪", displayName: "Rickety Run" },
        { id: 'risky-cliffs', keyword: "RiskyCliffs", message: "🎅 Risky Cliffs 🎅", displayName: "Risky Cliffs" },
        { id: 'shark-park', keyword: "SharkPark", message: "🦈 Shark Park 🦈", displayName: "Shark Park" },
        { id: 'silly-slide', keyword: "SillySlide", message: "🛝 Silly Slide 🛝", displayName: "Silly Slide" },
        { id: 'spiky-slopes', keyword: "SpikySlopes", message: "🔨 Spiky Slopes 🔨", displayName: "Spiky Slopes" },
        { id: 'splash-dash', keyword: "SplashDash", message: "🏊 Splash Dash 🏊", displayName: "Splash Dash" },
        { id: 'tumble-town', keyword: "TumbleTown", message: "✋ Tumble Town ✋", displayName: "Tumble Town" },
        { id: 'tricky-traps', keyword: "TrickyTraps", message: "🎁 Tricky Traps 🎁", displayName: "Tricky Traps" },
        { id: 'ufo-attack', keyword: 'UFOAttack', message: '🛸 UFO Attack 🛸', displayName: 'UFO Attack' }
    ];

    // --- 言語辞書 ---
    const langData = {
        ja: {
            tabTitle: `LOL.ex ver...`, // タブのテキスト
            latestUpdates: '最新アップデート情報',
            updateInfo: '・背景編集UIをモーダルに変更しました。<br>・タブの背景をアイコンパターンに変更しました。<br>・リロード時にも背景がランダムで切り替わるように修正。',
            language: '言語',
            languageName: '日本語',
            airMoveAutoSwitch: 'Air Move 自動切り替え全体制御',
            enableAutoSwitch: 'Air Move 自動切り替え機能を有効化',
            autoSwitchOff: '[OFFの場合]: コースが変わってもAir Moveの状態は変わりません (手動設定を維持)。',
            autoSwitchOn: '[ONの場合]: コースが変わるたびに「コース別設定」に基づいてAir Moveが自動で切り替わります。',
            courseSettings: 'コース別 Air Move ON/OFF設定',
            courseSettingLabel: ' の Air Move設定:',
            on: 'ON',
            off: 'OFF',
            visualCustomization: '視覚カスタマイズ',
            backgroundColor: 'カスタム背景画像のURLリスト',
            apply: 'リストからランダムに適用',
            resetToDefault: 'デフォルトのリストに戻す',
            shuffleBackground: 'ランダム背景を適用 (シャッフル)',
            resetColors: 'カラーをデフォルトに戻す',
            resetColorConfirm: 'UIカラー設定をデフォルトの紫・シアンに戻します。よろしいですか？',
            backgroundNote: '「リストを編集」で管理されている画像がランダムに適用されます。「デフォルトに戻す」を押すと、リストがデフォルトにリセットされます。',
            primaryColor: 'UIメインカラー',
            secondaryColor: 'UIサブカラー',
            editList: 'リストを編集',
            modalTitle: '背景URLリストの編集',
            addUrl: '画像URLをここに入力...',
            add: '追加',
            save: '保存して閉じる',
            close: '閉じる',
            previewError: 'プレビュー不可',
            resetListConfirm: 'リストをデフォルトに戻します。よろしいですか？',
            ytSettings: 'YouTubeプレイヤー設定',
            ytHotkey: '🚨 表示/非表示: Ctrl + Y / 左下ボタン(📱)',
            loop: 'ループ再生',
            shuffle: 'プレイリストをシャッフル',
            ytNote: 'ループ/シャッフル設定は、次回の動画/プレイリスト読み込み時に適用されます。',
            ytInputPlaceholder: 'YouTube URL or ID',
            ytLoadButton: 'Load & Save',
            ytCollapseOpen: '▼ Open',
            ytCollapseClose: '▲ Close',
            ytInvalidUrl: 'Invalid YouTube URL or ID.',
            nextRound: 'Next Round...',
        },
        en: {
            tabTitle: `LOL.ex ver...`, // タブのテキスト
            latestUpdates: 'Latest Updates',
            updateInfo: '・Changed background editing UI to a modal window.<br>・Changed tab background to icon pattern.<br>・Fixed background to randomize on page reload.',
            language: 'Language',
            languageName: 'English',
            airMoveAutoSwitch: 'Air Move Auto Switch Control',
            enableAutoSwitch: 'Enable Air Move Auto Switch',
            autoSwitchOff: '[OFF]: Air Move state remains unchanged when the course changes (maintains manual setting).',
            autoSwitchOn: '[ON]: Air Move automatically switches based on "Course Settings" when the course changes.',
            courseSettings: 'Course Specific Air Move ON/OFF Settings',
            courseSettingLabel: ' Air Move Setting:',
            on: 'ON',
            off: 'OFF',
            visualCustomization: 'Visual Customization',
            backgroundColor: 'Custom Background Image URL List',
            apply: 'Apply Random from List',
            resetToDefault: 'Reset List to Default',
            shuffleBackground: 'Apply Random Background (Shuffle)',
            resetColors: 'Reset Colors to Default',
            resetColorConfirm: 'Are you sure you want to reset UI colors to default Purple and Cyan?',
            backgroundNote: 'A random image from the managed list will be applied. Resetting to default will restore the default list.',
            primaryColor: 'UI Primary Color',
            secondaryColor: 'UI Secondary Color',
            editList: 'Edit List',
            modalTitle: 'Edit Background URL List',
            addUrl: 'Enter Image URL here...',
            add: 'Add',
            save: 'Save & Close',
            close: 'Close',
            previewError: 'Preview N/A',
            resetListConfirm: 'Are you sure you want to reset the list to default?',
            ytSettings: 'YouTube Player Settings',
            ytHotkey: '🚨 Toggle Visibility: Ctrl + Y / Bottom Left Button(📱)',
            loop: 'Loop Playback',
            shuffle: 'Shuffle Playlist',
            ytNote: 'Loop/Shuffle settings are applied on the next video/playlist load.',
            ytInputPlaceholder: 'YouTube URL or ID',
            ytLoadButton: 'Load & Save',
            ytCollapseOpen: '▼ Open',
            ytCollapseClose: '▲ Close',
            ytInvalidUrl: 'Invalid YouTube URL or ID.',
            nextRound: 'Next Round...',
        }
    };


    // ------------------------------------------------------------------------------------------------
    //                                  ユーティリティ関数
    // ------------------------------------------------------------------------------------------------

    function getLang() {
        return localStorage.getItem(STORAGE_LANGUAGE_KEY) || 'ja';
    }
    function getLangText(key) {
        const lang = getLang();
        return langData[lang][key] || langData['ja'][key] || `[${key}]`;
    }

    function getPrimaryColor() {
        return localStorage.getItem(STORAGE_PRIMARY_COLOR) || DEFAULT_PRIMARY;
    }
    function getSecondaryColor() {
        return localStorage.getItem(STORAGE_SECONDARY_COLOR) || DEFAULT_SECONDARY;
    }
    function applyColorTheme(primary, secondary) {
        const root = document.documentElement.style;
        root.setProperty('--primary-color', primary);
        root.setProperty('--secondary-color', secondary);
    }

    function resetColors() {
        if (confirm(getLangText('resetColorConfirm'))) {
            localStorage.setItem(STORAGE_PRIMARY_COLOR, DEFAULT_PRIMARY);
            localStorage.setItem(STORAGE_SECONDARY_COLOR, DEFAULT_SECONDARY);
            applyColorTheme(DEFAULT_PRIMARY, DEFAULT_SECONDARY);
            const primaryPicker = document.getElementById('primary-color-picker');
            const secondaryPicker = document.getElementById('secondary-color-picker');
            if (primaryPicker) primaryPicker.value = DEFAULT_PRIMARY;
            if (secondaryPicker) secondaryPicker.value = DEFAULT_SECONDARY;
            updateCourseLabels();
        }
    }

    function clickAirMoveRadio(enabled) {
        const selector = enabled ? '#air-movement-on' : '#air-movement-off';
        const radio = document.querySelector(selector);
        if (radio && !radio.checked) radio.click();
    }

    function applyStoredAirMove() {}

    function getYouTubeIds(input) {
        const urlRegex = /(?:youtube\.com\/(?:live\/|[^\/]+\/.+\/|(?:v|e(?:mbed)?|watch)\/|.*[?&]v=)|youtu\.be\/|youtube\.googleapis\.com\/v\/)([a-zA-Z0-9_-]{11})/;
        const playlistRegex = /[?&]list=([a-zA-Z0-9_-]+)/;
        const videoMatch = input.match(urlRegex);
        const playlistMatch = input.match(playlistRegex);
        return {
            videoId: videoMatch ? videoMatch[1] : null,
            playlistId: playlistMatch ? playlistMatch[1] : null,
        };
    }

    function saveTime() {
        if (player && typeof player.getCurrentTime === 'function') {
            try {
                const t = player.getCurrentTime();
                if (!isNaN(t) && t >= 0) {
                    lastTime = t;
                    localStorage.setItem(STORAGE_TIME_KEY, lastTime);
                }
            } catch (e) { /* ignore */ }
        }
    }

    function updateUrlInput(ytContainer) {
        const urlInput = ytContainer.querySelector('#yt-video-id-input');
        const storedPlaylistId = localStorage.getItem(STORAGE_PLAYLIST_KEY);
        const storedVideoId = localStorage.getItem(STORAGE_VIDEO_KEY);
        if (storedPlaylistId) {
            urlInput.value = `https://www.youtube.com/playlist?list=${storedPlaylistId}`;
        } else if (storedVideoId) {
            urlInput.value = `https://www.youtube.com/watch?v=${storedVideoId}`;
        } else {
            urlInput.value = '';
        }
    }
    function toggleYouTubeVisibility() {
        const ytContainer = document.getElementById('yt-fixed-container');
        if (ytContainer) {
            const isVisible = ytContainer.classList.toggle('yt-visible');
            localStorage.setItem(STORAGE_IS_VISIBLE, isVisible);
        }
    }
    unsafeWindow.onYouTubeIframeAPIReady = function() {
        isApiReady = true;
        if (document.getElementById('yt-player')) {
            initializePlayer();
        }
    }
    function initializePlayer() {
        const playerDiv = document.getElementById('yt-player');
        if (!playerDiv || !isApiReady) {
            return;
        }
        if (player) {
             player.destroy();
             player = null;
        }
        const playlistId = localStorage.getItem(STORAGE_PLAYLIST_KEY);
        const initialVideoId = localStorage.getItem(STORAGE_VIDEO_KEY);
        lastTime = parseFloat(localStorage.getItem(STORAGE_TIME_KEY)) || 0;
        let targetVideoId = initialVideoId;
        let startSeconds = Math.max(0, Math.floor(lastTime));
        let playerVars = {
            'playsinline': 1,
            'autoplay': 1,
            'mute': 1,
            'start': startSeconds
        };
        if (playlistId) {
            playerVars.listType = 'playlist';
            playerVars.list = playlistId;
            targetVideoId = '';
            playerVars.start = 0;
        } else {
            targetVideoId = initialVideoId || '';
        }
        player = new YT.Player('yt-player', {
            height: '100%',
            width: '100%',
            videoId: targetVideoId,
            playerVars: playerVars,
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
        lastTime = 0;
        localStorage.setItem(STORAGE_TIME_KEY, 0);
    }
    function onPlayerReady(event) {
        event.target.unMute();
        const loopEnabled = localStorage.getItem(STORAGE_LOOP) === 'true';
        const shuffleEnabled = localStorage.getItem(STORAGE_SHUFFLE) === 'true';
        event.target.setLoop(loopEnabled);
        const playlistId = localStorage.getItem(STORAGE_PLAYLIST_KEY);
        if (playlistId) {
             event.target.setShuffle(shuffleEnabled);
        }
        if (!playlistId && lastTime > 0) {
            event.target.seekTo(lastTime, true);
        }
    }
    function onPlayerStateChange(event) {
        clearInterval(saveTimeInterval);
        saveTimeInterval = null;
        if (event.data === YT.PlayerState.PLAYING) {
            if (!saveTimeInterval) saveTimeInterval = setInterval(saveTime, 1000);
        } else if (event.data === YT.PlayerState.ENDED) {
            saveTime();
        }
    }
    function loadYouTube(autoplay = true, loadUrl = null) {
        if (!player || typeof player.loadPlaylist !== 'function') {
            return;
        }
        const urlInput = document.getElementById('yt-video-id-input');
        const inputVal = (typeof loadUrl === 'string') ? loadUrl.trim() : (urlInput ? urlInput.value.trim() : '');
        let targetVideoId = null;
        let targetPlaylistId = null;
        if (inputVal && inputVal.length > 0) {
            const ids = getYouTubeIds(inputVal);
            if (ids.playlistId) {
                targetPlaylistId = ids.playlistId;
                targetVideoId = ids.videoId;
            } else if (ids.videoId) {
                targetVideoId = ids.videoId;
            } else {
                if(autoplay) alert(getLangText('ytInvalidUrl'));
                return;
            }
        } else if (typeof loadUrl === 'string' && loadUrl === '') {
            localStorage.removeItem(STORAGE_VIDEO_KEY);
            localStorage.removeItem(STORAGE_PLAYLIST_KEY);
            targetVideoId = null;
            targetPlaylistId = null;
        }
        localStorage.setItem(STORAGE_VIDEO_KEY, targetVideoId || '');
        localStorage.setItem(STORAGE_PLAYLIST_KEY, targetPlaylistId || '');
        localStorage.setItem(STORAGE_TIME_KEY, 0);
        lastTime = 0;
        currentVideoId = targetVideoId;
        const loopEnabled = localStorage.getItem(STORAGE_LOOP) === 'true';
        const shuffleEnabled = localStorage.getItem(STORAGE_SHUFFLE) === 'true';
        const startTime = 0;
        if (targetPlaylistId) {
            player.loadPlaylist({
                list: targetPlaylistId,
                listType: 'playlist',
                index: 0,
                startSeconds: startTime,
                suggestedQuality: 'large'
            });
            player.setLoop(loopEnabled);
            player.setShuffle(shuffleEnabled);
            player.unMute();
            player.playVideo();
        } else if (targetVideoId) {
            player.loadVideoById({ videoId: targetVideoId, startSeconds: startTime });
            player.setLoop(loopEnabled);
            player.unMute();
            player.playVideo();
        } else {
            if (player && typeof player.stopVideo === 'function') {
                player.stopVideo();
            }
        }
    }

    // (v0.70.3) try...catch と URLエスケープ
    function applyCustomBackground(selectRandomFromList = false, urlListOverride = null) {
        try {
            const customStyleId = 'custom-background-style';
            const existingStyle = document.getElementById(customStyleId);
            if (existingStyle) { existingStyle.remove(); }

            const customListStr = urlListOverride !== null ? urlListOverride : (localStorage.getItem(STORAGE_CUSTOM_BG_LIST_KEY) || '');
            let customList = customListStr.split('\n')
                .map(url => url.trim())
                .filter(url => url.length > 0);

            const availableUrls = customList.length > 0 ? customList : DEFAULT_BG_URLS;

            let imageUrl = localStorage.getItem(STORAGE_BACKGROUND_KEY);

            if (selectRandomFromList && availableUrls.length > 0) {
                const index = Math.floor(Math.random() * availableUrls.length);
                imageUrl = availableUrls[index];
                localStorage.setItem(STORAGE_BACKGROUND_KEY, imageUrl);
            } else if (!imageUrl && availableUrls.length > 0) {
                const index = Math.floor(Math.random() * availableUrls.length);
                imageUrl = availableUrls[index];
                localStorage.setItem(STORAGE_BACKGROUND_KEY, imageUrl);
            } else if (availableUrls.length === 0) {
                imageUrl = null;
                localStorage.removeItem(STORAGE_BACKGROUND_KEY);
            }

            if (imageUrl) {
                const safeImageUrl = imageUrl.replace(/['"\\]/g, '\\$&');
                const css = `
                  html body #screens #home-screen,
                  html body #screens #profile-screen,
                  html body #screens #shop-screen {
                    background-image: url('${safeImageUrl}') !important;
                    background-size: cover !important;
                    background-position: center !important;
                  }
                `;
                const style = document.createElement('style');
                style.id = customStyleId;
                document.documentElement.appendChild(style);
                style.textContent = css;
            } else {
                if (document.getElementById(customStyleId)) document.getElementById(customStyleId).remove();
            }
        } catch (e) {
            console.error('[LOL.ex] Failed to apply custom background:', e);
        }
    }


    function addModernStyleSheet() {
        applyColorTheme(getPrimaryColor(), getSecondaryColor());

        if (document.getElementById('lolex-modern-style')) return;
        const style = document.createElement('style');
        style.id = 'lolex-modern-style';
        style.textContent = `
            #tab5:checked ~ nav + section > .tab5 {
                display: block !important;
            }
            .pc-tab section > .tab5 {
                display: none;
            }

            /* ★ タブアイコン（タイル状背景） ★ */
            #settings-screen .pc-tab nav ul li.tab5 label[for="tab5"] {
                background-image: url('https://tanabesan.github.io/lolbeans/file/page/icon.png') !important;
                background-size: 20px 20px !important;
                background-repeat: repeat !important;
                background-position: center center !important;
                color: #fff !important;
                font-weight: bold;
                text-shadow: 1px 1px 2px #000, -1px 1px 2px #000, 1px -1px 2px #000, -1px -1px 2px #000;
                padding: 0 15px !important;
                line-height: 40px !important;
                height: 40px !important;
                display: inline-block !important;
            }
            #tab5:checked + label[for="tab5"] {
                 border-bottom-color: var(--primary-color) !important;
            }

            :root {
                --background-color: #121212;
                --card-color: #1F1F1F;
                --text-color-dark: #E0E0E0;
                --input-bg: #2b2b2b;
                --border-color: #444444;
            }

            #settings-screen .pc-tab > section > div.tab5 {
                background-color: var(--background-color) !important;
                color: var(--text-color-dark) !important;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
                max-height: calc(100vh - 200px);
                overflow-y: auto;
            }
             #settings-screen .pc-tab section > .tab5 h3 {
                 color: var(--primary-color);
                 border-bottom: 1px solid var(--border-color);
                 padding-bottom: 10px;
             }

            .lolex-settings fieldset {
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 25px;
                transition: border-color 0.3s;
            }
            .lolex-settings fieldset:hover { border-color: var(--primary-color); }
            .lolex-settings legend {
                color: var(--secondary-color);
                font-size: 1.1em; font-weight: 600;
                padding: 0 10px; margin-left: -5px;
            }

            .lolex-setting-row {
                display: flex; justify-content: space-between; align-items: center;
                padding: 10px 0;
                border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
                min-height: 30px;
            }
            .lolex-setting-row:last-child { border-bottom: none; }
            .lolex-setting-row .setting-name {
                font-weight: 400; margin-right: 20px; flex-grow: 1;
                color: var(--text-color-dark); display: flex; align-items: center;
            }
            .lolex-setting-row .setting-name i {
                margin-right: 10px; color: var(--primary-color);
            }
             .lolex-setting-row .setting-name span {
                 margin-left: 5px;
             }

            .lolex-setting-row select {
                padding: 8px 12px; border: 1px solid var(--border-color);
                border-radius: 4px; background-color: var(--input-bg);
                color: var(--text-color-dark);
                transition: border-color 0.3s;
                min-width: 150px;
            }
            .lolex-setting-row input[type="color"] {
                -webkit-appearance: none; -moz-appearance: none; appearance: none;
                width: 30px; height: 30px;
                padding: 0; border: none; background: none; cursor: pointer;
            }
            .lolex-setting-row input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
            .lolex-setting-row input[type="color"]::-webkit-color-swatch {
                border: 2px solid var(--border-color); border-radius: 4px;
            }

            .lolex-setting-row input[type="text"],
            .lolex-setting-row textarea {
                padding: 8px 12px; border: 1px solid var(--border-color);
                border-radius: 4px; background-color: var(--input-bg);
                color: var(--text-color-dark);
                transition: border-color 0.3s, box-shadow 0.3s;
                min-width: 200px; box-sizing: border-box; font-size: 14px;
            }
            .lolex-setting-row input[type="text"]:focus,
            .lolex-setting-row textarea:focus {
                outline: none; border-color: var(--primary-color);
                box-shadow: 0 0 5px rgba(187, 134, 252, 0.5);
            }

            .switch {
                position: relative; display: inline-block;
                width: 45px; height: 25px; min-width: 45px;
            }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider-toggle {
                position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
                background-color: var(--border-color);
                transition: .4s; border-radius: 25px;
            }
            .slider-toggle:before {
                position: absolute; content: ""; height: 17px; width: 17px;
                left: 4px; bottom: 4px; background-color: var(--text-color-dark);
                transition: .4s; border-radius: 50%;
            }
            input:checked + .slider-toggle { background-color: var(--secondary-color); }
            input:checked + .slider-toggle:before {
                transform: translateX(20px);
                background-color: var(--card-color);
            }

            .lolex-setting-row button {
                background-color: var(--primary-color);
                color: var(--background-color);
                border: none; padding: 8px 15px; border-radius: 4px;
                cursor: pointer; font-weight: 600;
                transition: background-color 0.3s, transform 0.1s;
            }
            .lolex-setting-row button:hover { background-color: var(--secondary-color); color: var(--background-color); }
            .lolex-setting-row button:active { transform: translateY(1px); }

             #yt-fixed-container {
                 border: 2px solid var(--primary-color);
                 border-radius: 8px;
                 box-shadow: 0 4px 15px rgba(0, 0, 0, 0.7);
                 background-color: rgba(0, 0, 0, 0.8);
             }
             #yt-fixed-container #yt-load-button {
                 background: var(--secondary-color) !important;
                 color: var(--background-color) !important;
             }

            #background-list-textarea { resize: vertical; }

            #yt-mobile-toggle-btn {
                background: rgba(187, 86, 252, 0.5);
                border: 1px solid rgba(3, 218, 198, 0.5);
                box-shadow: 0 0 5px rgba(187, 86, 252, 0.2);
            }

            @media (max-width: 768px) {
                 .lolex-setting-row { flex-direction: column; align-items: flex-start; gap: 5px;}
                 .lolex-setting-row .setting-name { margin-bottom: 5px; }
                 .lolex-setting-row input[type="text"], .lolex-setting-row button, .lolex-setting-row select, .lolex-setting-row textarea { width: 100%; min-width: 100%;}
                 .lolex-setting-row .switch { margin-left: auto; }
                 .lolex-setting-row input[type="color"] { align-self: flex-end; }
            }

            .tab5 h3, .tab5 .setting-section, .tab5 .youtube-container,
            .tab5 .youtube-input-group, .tab5 .setting-row {
                display: none !important;
            }
            .tab5 .lolex-settings { display: block !important; }

            /* 背景編集モーダル */
            #lolex-bg-modal-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.7);
                z-index: 10000;
                display: none;
            }
            #lolex-bg-modal {
                position: fixed; top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 90%; max-width: 600px;
                height: 80vh; max-height: 700px;
                background: var(--card-color, #1F1F1F);
                color: var(--text-color-dark, #E0E0E0);
                border: 2px solid var(--primary-color, #BB86FC);
                border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                z-index: 10001;
                display: none;
                flex-direction: column;
            }
            #lolex-bg-modal-header {
                padding: 15px; border-bottom: 1px solid var(--border-color, #444);
                display: flex; justify-content: space-between; align-items: center;
                background: var(--background-color, #121212);
            }
            #lolex-bg-modal-header h4 { margin: 0; color: var(--secondary-color, #03DAC6); }
            #lolex-bg-modal-close {
                background: none; border: none; color: #fff; font-size: 1.5em; cursor: pointer;
                line-height: 1; padding: 0;
            }
            #lolex-bg-modal-body {
                padding: 15px; overflow-y: auto; flex-grow: 1;
            }
            .lolex-bg-item {
                display: flex; align-items: center; gap: 10px;
                padding: 10px; border: 1px solid var(--border-color, #444);
                border-radius: 4px; margin-bottom: 10px;
                background: var(--background-color, #121212);
            }
            .lolex-bg-preview {
                width: 80px; height: 50px;
                flex-shrink: 0;
                border-radius: 4px; background-color: #000;
                display: flex; align-items: center; justify-content: center;
                font-size: 10px; color: #888; text-align: center;
                overflow: hidden;
            }
            .lolex-bg-preview img {
                width: 100%; height: 100%;
                object-fit: cover;
            }
            .lolex-bg-url {
                flex-grow: 1; word-break: break-all;
                font-size: 0.9em; color: var(--text-color-dark, #E0E0E0);
                max-height: 40px; overflow-y: hidden;
            }
            .lolex-bg-delete {
                background: #B00020;
                color: white; border: none;
                border-radius: 50%; width: 25px; height: 25px;
                cursor: pointer; font-weight: bold; flex-shrink: 0;
                line-height: 25px; text-align: center;
            }
            #lolex-bg-modal-footer {
                padding: 15px; border-top: 1px solid var(--border-color, #444);
                background: var(--background-color, #121212);
            }
            #lolex-bg-add-area { display: flex; gap: 10px; margin-bottom: 10px; }
            #lolex-bg-new-url {
                flex-grow: 1;
                padding: 8px 12px; border: 1px solid var(--border-color);
                border-radius: 4px; background-color: var(--input-bg);
                color: var(--text-color-dark); font-size: 14px;
            }
            #lolex-bg-new-url:focus {
                outline: none; border-color: var(--primary-color);
            }
            #lolex-bg-add-button, #lolex-bg-save-button {
                background-color: var(--primary-color);
                color: var(--background-color);
                border: none; padding: 8px 15px; border-radius: 4px;
                cursor: pointer; font-weight: 600;
            }
            #lolex-bg-add-button:hover, #lolex-bg-save-button:hover {
                 background-color: var(--secondary-color); color: var(--background-color);
            }
            #lolex-bg-save-button { width: 100%; }
        `;
        document.head.appendChild(style);
    }
    function addCustomStyleSheet() {
        if (document.getElementById('lolex-custom-style')) return;
        const style = document.createElement('style');
        style.id = 'lolex-custom-style';
        style.textContent = `
        #yt-fixed-container {
            position: fixed; bottom: 10px; right: -500px;
            width: 480px; height: 300px; z-index: 9999;
            background: #000; border: 2px solid #555;
            display: flex; flex-direction: column;
            transition: right 0.3s ease-in-out;
        }
        #yt-fixed-container.yt-visible { right: 10px; }
        #yt-fixed-container.yt-collapsed { height: 260px !important; }
        #yt-fixed-container #yt-collapse-toggle {
            position: absolute; top: 0; left: 0; right: auto;
            background: rgba(0,0,0,0.5); color: white;
            border: none; cursor: pointer; padding: 4px 8px;
            z-index: 10001;
        }
        #yt-fixed-container .yt-input-area {
            height: 40px; padding: 4px 4px 4px 75px !important;
            display: flex; align-items: center; gap: 0.5em;
            background: #333;
        }
         #yt-fixed-container .yt-input-area input {
             flex-grow: 1; padding: 0.5em; border: 1px solid #555;
             background: #222; color: #fff;
         }
         #yt-fixed-container .yt-input-area button {
             padding: 0.5em 1em; cursor: pointer; border: none; border-radius: 4px;
             background: #4CAF50; color: white;
         }
         .youtube-player-wrapper {
             flex-grow: 1; position: relative; width: 100%; height: 260px;
         }
        #yt-mobile-toggle-btn {
            position: fixed; bottom: 10px; left: 10px;
            width: 40px; height: 40px; z-index: 10000;
            cursor: pointer; background: rgba(255, 0, 0, 0.01);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 4px; display: none;
            box-shadow: 0 0 5px rgba(255, 0, 0, 0.2);
        }
        @media (max-width: 768px) {
             #yt-fixed-container {
                width: 320px; height: 200px; right: -330px;
             }
             #yt-fixed-container.yt-visible { right: 10px; }
             #yt-fixed-container.yt-collapsed { height: 160px !important; }
             #yt-mobile-toggle-btn { display: block; }
             #yt-fixed-container .yt-input-area { padding: 4px 4px 4px 75px !important; }
        }
    `;
        document.head.appendChild(style);
    }
    function initYouTubePlayer() {
        if (document.getElementById('yt-fixed-container')) return;

        addCustomStyleSheet();
        addModernStyleSheet();

        let ytContainer = document.createElement('div');
        ytContainer.id = 'yt-fixed-container';

        const isCollapsed = localStorage.getItem('yt-collapsed') === 'true';
        const isVisible = localStorage.getItem(STORAGE_IS_VISIBLE) === 'true';

        if (isCollapsed) ytContainer.classList.add('yt-collapsed');
        if (isVisible) ytContainer.classList.add('yt-visible');

        ytContainer.innerHTML = `
            <div id="yt-input-area" class="youtube-input-group yt-input-area" style="display: ${isCollapsed ? 'none' : 'flex'};">
                <input type="text" id="yt-video-id-input" placeholder="${getLangText('ytInputPlaceholder')}">
                <button id="yt-load-button">${getLangText('ytLoadButton')}</button>
            </div>
            <div class="youtube-player-wrapper">
                <div id="yt-player"></div>
            </div>
            <button id="yt-collapse-toggle">
                ${isCollapsed ? getLangText('ytCollapseOpen') : getLangText('ytCollapseClose')}
            </button>
        `;
        document.body.appendChild(ytContainer);
        setupYouTubeCoreEventListeners(ytContainer);
        updateUrlInput(ytContainer);

        let mobileBtn = document.getElementById('yt-mobile-toggle-btn');
        if (!mobileBtn) {
            mobileBtn = document.createElement('button');
            mobileBtn.id = 'yt-mobile-toggle-btn';
            mobileBtn.title = 'Toggle YouTube Player (Mobile Only)';
            document.body.appendChild(mobileBtn);
            mobileBtn.addEventListener('click', toggleYouTubeVisibility);
        }

        if (!unsafeWindow.YT) {
            const apiScript = document.createElement('script');
            apiScript.src = "https://www.youtube.com/iframe_api";
            document.head.appendChild(apiScript);
        } else {
            unsafeWindow.onYouTubeIframeAPIReady();
        }
    }
    function setupYouTubeCoreEventListeners(ytContainer) {
        const inputArea = ytContainer.querySelector('#yt-input-area');
        const toggleButton = ytContainer.querySelector('#yt-collapse-toggle');
        const urlInput = ytContainer.querySelector('#yt-video-id-input');
        const loadButton = ytContainer.querySelector('#yt-load-button');

        urlInput.placeholder = getLangText('ytInputPlaceholder');
        loadButton.textContent = getLangText('ytLoadButton');
        const isCollapsed = ytContainer.classList.contains('yt-collapsed');
        toggleButton.innerHTML = isCollapsed ? getLangText('ytCollapseOpen') : getLangText('ytCollapseClose');

        if (!toggleButton.hasAttribute('data-lolex-bound')) {
            toggleButton.addEventListener('click', () => {
                const isCollapsed = ytContainer.classList.toggle('yt-collapsed');
                inputArea.style.display = isCollapsed ? 'none' : 'flex';
                toggleButton.innerHTML = isCollapsed ? getLangText('ytCollapseOpen') : getLangText('ytCollapseClose');
                localStorage.setItem('yt-collapsed', isCollapsed);
            });
            toggleButton.setAttribute('data-lolex-bound', 'true');
        }

        if (!loadButton.hasAttribute('data-lolex-bound')) {
            loadButton.addEventListener('click', () => {
                loadYouTube(true, urlInput.value.trim());
            });
            loadButton.setAttribute('data-lolex-bound', 'true');
        }

        if (!urlInput.hasAttribute('data-lolex-bound')) {
             urlInput.addEventListener('keydown', (e) => {
                 if(e.key === 'Enter') {
                     loadYouTube(true, urlInput.value.trim());
                 }
                 e.stopPropagation();
             });
             urlInput.setAttribute('data-lolex-bound', 'true');
        }
    }

    function setupHotkey() {
        if (window.innerWidth <= 768) return;
        document.addEventListener('keydown', (e) => {
            if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                toggleYouTubeVisibility();
            }
        });
    }

    function updateCourseLabels() {
        courses.forEach(({ id }) => {
            const key = `stopAirMove_${id}`;
            const isEnableEnabled = localStorage.getItem(key) === 'true';
            const checkbox = document.getElementById(`courseAirMoveToggle_${id}`);

            if (checkbox) {
                const label = checkbox.closest('.lolex-setting-row').querySelector('.setting-name');
                const displayName = courses.find(c => c.id === id).displayName;
                const statusText = isEnableEnabled ? getLangText('on') : getLangText('off');
                const statusColor = isEnableEnabled ? 'var(--secondary-color)' : 'var(--primary-color)';
                label.innerHTML = `<i class="fas fa-bolt"></i> ${displayName} ${getLangText('courseSettingLabel')} <span style="font-weight: bold; color: ${statusColor};">${statusText}</span>`;
            }
        });
    }


    // ------------------------------------------------------------------------------------------------
    //                                  ★ 背景モーダル関連関数
    // ------------------------------------------------------------------------------------------------

    function createBackgroundModal() {
        if (document.getElementById('lolex-bg-modal')) return;

        const overlay = document.createElement('div');
        overlay.id = 'lolex-bg-modal-overlay';
        document.body.appendChild(overlay);

        const modal = document.createElement('div');
        modal.id = 'lolex-bg-modal';
        modal.innerHTML = `
            <div id="lolex-bg-modal-header">
                <h4 id="lolex-bg-modal-title">${getLangText('modalTitle')}</h4>
                <button id="lolex-bg-modal-close" title="${getLangText('close')}">&times;</button>
            </div>
            <div id="lolex-bg-modal-body">
                </div>
            <div id="lolex-bg-modal-footer">
                <div id="lolex-bg-add-area">
                    <input type="text" id="lolex-bg-new-url" placeholder="${getLangText('addUrl')}">
                    <button id="lolex-bg-add-button">${getLangText('add')}</button>
                </div>
                <button id="lolex-bg-save-button">${getLangText('save')}</button>
            </div>
        `;
        document.body.appendChild(modal);
        bindModalUI();
    }

    function renderBackgroundList() {
        const body = document.getElementById('lolex-bg-modal-body');
        if (!body) return;

        body.innerHTML = '';
        const listStr = localStorage.getItem(STORAGE_CUSTOM_BG_LIST_KEY) || DEFAULT_BG_URLS.join('\n');
        const urls = listStr.split('\n').map(u => u.trim()).filter(u => u.length > 0);

        urls.forEach((url, index) => {
            const item = document.createElement('div');
            item.className = 'lolex-bg-item';
            item.dataset.url = url;
            item.innerHTML = `
                <div class="lolex-bg-preview">
                    <img src="${url}" alt="${getLangText('previewError')}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <span style="display:none;">${getLangText('previewError')}</span>
                </div>
                <span class="lolex-bg-url">${url}</span>
                <button class="lolex-bg-delete" data-index="${index}" title="Delete">&times;</button>
            `;
            body.appendChild(item);
        });
    }

    function bindModalUI() {
        const modal = document.getElementById('lolex-bg-modal');
        const overlay = document.getElementById('lolex-bg-modal-overlay');
        const closeBtn = document.getElementById('lolex-bg-modal-close');
        const saveBtn = document.getElementById('lolex-bg-save-button');
        const addBtn = document.getElementById('lolex-bg-add-button');
        const addInput = document.getElementById('lolex-bg-new-url');
        const body = document.getElementById('lolex-bg-modal-body');

        const closeHandler = () => hideBackgroundModal();
        closeBtn.addEventListener('click', closeHandler);
        overlay.addEventListener('click', closeHandler);

        saveBtn.addEventListener('click', () => {
            saveBackgroundList();
            hideBackgroundModal();
        });

        body.addEventListener('click', (e) => {
            if (e.target.classList.contains('lolex-bg-delete')) {
                e.target.closest('.lolex-bg-item').remove();
            }
        });

        const addItem = () => {
            const url = addInput.value.trim();
            if (url.length === 0) return;
            const items = Array.from(body.querySelectorAll('.lolex-bg-item'));
            const existingUrls = items.map(item => item.dataset.url);
            if (!existingUrls.includes(url)) {
                 existingUrls.push(url);
            }
            localStorage.setItem(STORAGE_CUSTOM_BG_LIST_KEY, existingUrls.join('\n'));
            renderBackgroundList();
            addInput.value = '';
            body.scrollTop = body.scrollHeight;
        };

        addBtn.addEventListener('click', addItem);
        addInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                addItem();
                e.preventDefault();
            }
            e.stopPropagation();
        });
    }

    function showBackgroundModal() {
        document.getElementById('lolex-bg-modal-title').textContent = getLangText('modalTitle');
        document.getElementById('lolex-bg-modal-close').title = getLangText('close');
        document.getElementById('lolex-bg-new-url').placeholder = getLangText('addUrl');
        document.getElementById('lolex-bg-add-button').textContent = getLangText('add');
        document.getElementById('lolex-bg-save-button').textContent = getLangText('save');
        renderBackgroundList();
        document.getElementById('lolex-bg-modal-overlay').style.display = 'block';
        document.getElementById('lolex-bg-modal').style.display = 'flex';
    }

    function hideBackgroundModal() {
        document.getElementById('lolex-bg-modal-overlay').style.display = 'none';
        document.getElementById('lolex-bg-modal').style.display = 'none';
    }

    function saveBackgroundList() {
        const body = document.getElementById('lolex-bg-modal-body');
        const items = body.querySelectorAll('.lolex-bg-item');
        const urls = Array.from(items).map(item => item.dataset.url);
        const newListStr = urls.join('\n');
        localStorage.setItem(STORAGE_CUSTOM_BG_LIST_KEY, newListStr);
        applyCustomBackground(true, newListStr);
    }


    // ------------------------------------------------------------------------------------------------
    //                                  設定画面とUIバインディング
    // ------------------------------------------------------------------------------------------------

    function createSettings() {
        const tabContainer = document.querySelector('#settings-screen .pc-tab');
        if (!tabContainer) return;

        addModernStyleSheet();

        let input = tabContainer.querySelector('#tab5');
        if (!input) {
            input = document.createElement('input');
            input.id = 'tab5'; input.type = 'radio'; input.name = 'pct';
            tabContainer.insertBefore(input, tabContainer.querySelector('nav'));
        }
        let li = tabContainer.querySelector('nav ul li.tab5');
        if (!li) {
            li = document.createElement('li');
            li.className = 'tab5';
            tabContainer.querySelector('nav ul').appendChild(li);
        }
        li.innerHTML = `<label for="tab5">${getLangText('tabTitle')}</label>`;

        const section = tabContainer.querySelector('section');
        let panel = section.querySelector('div.tab5');
        if (!panel) {
            panel = document.createElement('div');
            panel.className = 'tab5';
            section.appendChild(panel);
        } else {
             panel.innerHTML = '';
        }

        const container = document.createElement('div');
        container.id = 'lolex-settings';
        container.className = 'lolex-settings';

        // 0. 最新アップデート情報
        const updateFieldset = document.createElement('fieldset');
        updateFieldset.innerHTML = `
            <legend><i class="fas fa-info-circle"></i> ${getLangText('latestUpdates')}</legend>
            <div class="lolex-setting-row" style="display: block; border-bottom: none;">
                <p style="font-size: 0.9em; color: var(--text-color-dark); line-height: 1.6;">
                    ${getLangText('updateInfo')}
                </p>
                <p style="font-size: 0.8em; color: var(--border-color); margin-top: 10px;">
                    (Version: ${SCRIPT_VERSION})
                </p>
            </div>
        `;
        container.appendChild(updateFieldset);


        // 1. 言語設定
        const langFieldset = document.createElement('fieldset');
        const currentLang = getLang();
        langFieldset.innerHTML = `
            <legend><i class="fas fa-language"></i> ${getLangText('language')}</legend>
            <div class="lolex-setting-row">
                <label for="language-switcher" class="setting-name">
                    ${getLangText('language')}
                </label>
                <select id="language-switcher">
                    <option value="ja" ${currentLang === 'ja' ? 'selected' : ''}>日本語 (Japanese)</option>
                    <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English (英語)</option>
                </select>
            </div>
        `;
        container.appendChild(langFieldset);


        // 2. Air Move 自動切り替え全体制御
        const gameplayFieldset = document.createElement('fieldset');
        const autoSwitchEnabled = localStorage.getItem(STORAGE_AIR_MOVE_AUTOSWITCH) === 'true';
        gameplayFieldset.innerHTML = `
            <legend><i class="fas fa-cogs"></i> ${getLangText('airMoveAutoSwitch')}</legend>
            <div class="lolex-setting-row">
                <label for="airMoveAutoSwitchToggle" class="setting-name">
                    <i class="fas fa-exchange-alt"></i> ${getLangText('enableAutoSwitch')}
                </label>
                <label class="switch">
                    <input type="checkbox" id="airMoveAutoSwitchToggle" ${autoSwitchEnabled ? 'checked' : ''}>
                    <span class="slider-toggle"></span>
                </label>
            </div>
            <p style="font-size: 0.8em; color: var(--text-color-dark); margin-top: 5px; padding-left: 20px;">
                <span style="color: var(--secondary-color); font-weight: bold;">[${getLangText('off')}]:</span> ${getLangText('autoSwitchOff')}<br>
                <span style="color: var(--secondary-color); font-weight: bold;">[${getLangText('on')}]:</span> ${getLangText('autoSwitchOn')}
            </p>
        `;
        container.appendChild(gameplayFieldset);


        // 3. コース別Air Move設定
        const courseFieldset = document.createElement('fieldset');
        courseFieldset.innerHTML = `<legend><i class="fas fa-map-signs"></i> ${getLangText('courseSettings')}</legend>`;
        courses.forEach(({ id, displayName }) => {
            const key = `stopAirMove_${id}`;
            const isEnableEnabled = localStorage.getItem(key) === 'true';
            const statusColor = isEnableEnabled ? 'var(--secondary-color)' : 'var(--primary-color)';
            const statusText = isEnableEnabled ? getLangText('on') : getLangText('off');
            courseFieldset.innerHTML += `
                <div class="lolex-setting-row">
                    <label for="courseAirMoveToggle_${id}" class="setting-name">
                        <i class="fas fa-bolt"></i> ${displayName} ${getLangText('courseSettingLabel')} <span style="font-weight: bold; color: ${statusColor};">${statusText}</span>
                    </label>
                    <label class="switch">
                        <input type="checkbox" id="courseAirMoveToggle_${id}" data-course-id="${id}" ${isEnableEnabled ? 'checked' : ''}>
                        <span class="slider-toggle"></span>
                    </label>
                </div>
            `;
        });
        container.appendChild(courseFieldset);


        // 4. 視覚カスタマイズの設定
        const visualFieldset = document.createElement('fieldset');
        const currentPrimary = getPrimaryColor();
        const currentSecondary = getSecondaryColor();
        visualFieldset.innerHTML = `
            <legend><i class="fas fa-paint-brush"></i> ${getLangText('visualCustomization')}</legend>
            <div class="lolex-setting-row">
                <label for="primary-color-picker" class="setting-name"><i class="fas fa-tint"></i> ${getLangText('primaryColor')}</label>
                <input type="color" id="primary-color-picker" value="${currentPrimary}">
            </div>
            <div class="lolex-setting-row">
                <label for="secondary-color-picker" class="setting-name"><i class="fas fa-tint"></i> ${getLangText('secondaryColor')}</label>
                <input type="color" id="secondary-color-picker" value="${currentSecondary}">
            </div>
            <div class="lolex-setting-row" style="border-bottom: none; flex-wrap: wrap; margin-top: 15px;">
                <label class="setting-name" style="flex-basis: 100%; margin-bottom: 5px;"><i class="fas fa-image"></i> ${getLangText('backgroundColor')}</label>
                <div style="display: flex; gap: 5px; margin-top: 5px; width: 100%;">
                    <button id="lolex-bg-edit-list-button" style="flex-grow: 1;">${getLangText('editList')}</button>
                    <button id="background-reset-to-default-button" style="flex-grow: 1; background-color: #333;">${getLangText('resetToDefault')}</button>
                </div>
            </div>
            <div class="lolex-setting-row" style="border-bottom: 1px dashed rgba(255, 255, 255, 0.05); padding-bottom: 15px;">
                 <button id="background-shuffle-button" style="width: 100%; background-color: var(--secondary-color);">
                    <i class="fas fa-sync-alt"></i> ${getLangText('shuffleBackground')}
                 </button>
            </div>
            <p style="font-size: 0.8em; color: var(--border-color); margin-top: 5px; margin-bottom: 10px;">${getLangText('backgroundNote')}</p>
            <div class="lolex-setting-row" style="border-top: 1px solid var(--border-color); padding-top: 15px; margin-top: 15px; border-bottom: none;">
                <button id="color-reset-button" style="width: 100%; background-color: #555; color: #fff;">
                    <i class="fas fa-undo"></i> ${getLangText('resetColors')}
                </button>
            </div>
        `;
        container.appendChild(visualFieldset);


        // 5. YouTubeプレイヤーの設定
        const ytFieldset = document.createElement('fieldset');
        const loopEnabled = localStorage.getItem(STORAGE_LOOP) === 'true';
        const shuffleEnabled = localStorage.getItem(STORAGE_SHUFFLE) === 'true';
        ytFieldset.innerHTML = `
            <legend><i class="fab fa-youtube"></i> ${getLangText('ytSettings')}</legend>
             <p style="font-size: 0.9em; font-weight: bold; margin-bottom: 1em; color: var(--text-color-dark);">
                ${getLangText('ytHotkey')}
             </p>
            <div class="lolex-setting-row">
                <label for="ytLoopToggle" class="setting-name"><i class="fas fa-sync-alt"></i> ${getLangText('loop')}</label>
                <label class="switch">
                    <input type="checkbox" id="ytLoopToggle" ${loopEnabled ? 'checked' : ''}>
                    <span class="slider-toggle"></span>
                </label>
            </div>
            <div class="lolex-setting-row">
                <label for="ytShuffleToggle" class="setting-name"><i class="fas fa-random"></i> ${getLangText('shuffle')}</label>
                <label class="switch">
                    <input type="checkbox" id="ytShuffleToggle" ${shuffleEnabled ? 'checked' : ''}>
                    <span class="slider-toggle"></span>
                </label>
            </div>
            <p style="font-size: 0.8em; color: var(--border-color); margin-top: 5px;">
                ${getLangText('ytNote')}
            </p>
        `;
        container.appendChild(ytFieldset);

        panel.appendChild(container);
        bindUI();
    }

    function bindUI() {

        // 1. 言語切り替え
        document.getElementById('language-switcher')?.addEventListener('change', (e) => {
            localStorage.setItem(STORAGE_LANGUAGE_KEY, e.target.value);
            createSettings();
            const ytContainer = document.getElementById('yt-fixed-container');
            if(ytContainer) setupYouTubeCoreEventListeners(ytContainer);
        });

        // 2. 自動切り替え
        document.getElementById('airMoveAutoSwitchToggle')?.addEventListener('change', (e) => {
            localStorage.setItem(STORAGE_AIR_MOVE_AUTOSWITCH, String(e.target.checked));
            createSettings();
        });

        // 3. コース別設定
        courses.forEach(({ id }) => {
            const checkbox = document.getElementById(`courseAirMoveToggle_${id}`);
            if (checkbox && !checkbox.hasAttribute('data-lolex-bound')) {
                checkbox.addEventListener('change', (e) => {
                    localStorage.setItem(`stopAirMove_${id}`, String(e.target.checked));
                    updateCourseLabels();
                });
                checkbox.setAttribute('data-lolex-bound', 'true');
            }
        });
        updateCourseLabels();

        // 4. 視覚カスタマイズ
        document.getElementById('lolex-bg-edit-list-button')?.addEventListener('click', () => {
            showBackgroundModal();
        });

        document.getElementById('background-reset-to-default-button')?.addEventListener('click', () => {
            if (confirm(getLangText('resetListConfirm'))) {
                const defaultListStr = DEFAULT_BG_URLS.join('\n');
                localStorage.setItem(STORAGE_CUSTOM_BG_LIST_KEY, defaultListStr);
                applyCustomBackground(true, defaultListStr);
            }
        });

        document.getElementById('background-shuffle-button')?.addEventListener('click', () => {
            applyCustomBackground(true);
        });

        document.getElementById('primary-color-picker')?.addEventListener('input', (e) => {
            localStorage.setItem(STORAGE_PRIMARY_COLOR, e.target.value);
            applyColorTheme(e.target.value, getSecondaryColor());
            updateCourseLabels();
            const ytContainer = document.getElementById('yt-fixed-container');
            if(ytContainer) setupYouTubeCoreEventListeners(ytContainer);
        });

        document.getElementById('secondary-color-picker')?.addEventListener('input', (e) => {
            localStorage.setItem(STORAGE_SECONDARY_COLOR, e.target.value);
            applyColorTheme(getPrimaryColor(), e.target.value);
            updateCourseLabels();
            const ytContainer = document.getElementById('yt-fixed-container');
            if(ytContainer) setupYouTubeCoreEventListeners(ytContainer);
        });

        document.getElementById('color-reset-button')?.addEventListener('click', resetColors);


        // 5. YouTubeプレイヤー設定
        document.getElementById('ytLoopToggle')?.addEventListener('change', (e) => {
            const loopEnabled = e.target.checked;
            localStorage.setItem(STORAGE_LOOP, String(loopEnabled));
            if (player && typeof player.setLoop === 'function') {
                try { player.setLoop(loopEnabled); } catch(err) { /* ignore */ }
            }
        });

        document.getElementById('ytShuffleToggle')?.addEventListener('change', (e) => {
            localStorage.setItem(STORAGE_SHUFFLE, String(e.target.checked));
        });
    }


    // --- コンソールフックとイベントリスナー ---
    const rules = courses.map(c => ({ keyword: c.keyword, id: c.id, message: c.message }));
    window.addEventListener('message', e => {
        if (e.data?.source !== 'console_proxy') return;
        const [tag, mapName] = e.data.args;

        if (tag === 'Loading map' && typeof mapName === 'string') {

            const autoSwitchEnabled = localStorage.getItem(STORAGE_AIR_MOVE_AUTOSWITCH) === 'true';

            if (autoSwitchEnabled) {
                const rule = rules.find(r => mapName.toLowerCase().includes(r.keyword.toLowerCase()));
                const id = rule ? rule.id : mapName.toLowerCase().replace(/\s+/g, '-');
                const courseSpecificEnable = localStorage.getItem(`stopAirMove_${id}`) === 'true';
                clickAirMoveRadio(courseSpecificEnable);
            }

            const rule = rules.find(r => mapName.toLowerCase().includes(r.keyword.toLowerCase()));
            const displayText = rule ? rule.message : mapName;
            const nextRoundText = getLangText('nextRound');

            const endMatchHeader = document.getElementById('end-match-header');
            if (endMatchHeader) {
                let nextRoundDisplay = document.getElementById('next-round-display-header');
                if (!nextRoundDisplay) {
                    nextRoundDisplay = document.createElement('div');
                    nextRoundDisplay.id = 'next-round-display-header';
                    nextRoundDisplay.style.cssText = 'font-size:14px; color:#fff; margin-top:8px; text-align:center;';
                    endMatchHeader.appendChild(nextRoundDisplay);
                }
                nextRoundDisplay.textContent = `${nextRoundText} ${displayText}`;
            }

            const deathScreenTop = document.querySelector('#death-screen .top-section');
            if (deathScreenTop) {
                let nextRoundDisplay = document.getElementById('next-round-display-death');
                 if (!nextRoundDisplay) {
                    nextRoundDisplay = document.createElement('div');
                    nextRoundDisplay.id = 'next-round-display-death';
                    nextRoundDisplay.style.cssText = 'font-size: 1.5rem; color: #fff; text-align: center; font-weight: bold; padding-top: 50px; text-shadow: 2px 2px 4px rgba(0,0,0,0.7);';
                    deathScreenTop.appendChild(nextRoundDisplay);
                 }
                 nextRoundDisplay.textContent = `${nextRoundText} ${displayText}`;
            }
        }
    });
    const hook = document.createElement('script');
    hook.textContent = `
    (function(){
        if (window.console && console.log && !console.log.toString().includes('console_proxy')) {
            const o = console.log;
            console.log = function(...a){
                try {
                    const args = a.map(arg => {
                        try { return String(arg); } catch (e) { return '[Unserializable]'; }
                    });
                    window.postMessage({source:'console_proxy', args: args },'*');
                } catch(e) {}
                return o.apply(console,a);
            };
        }
    })();
`;
    document.documentElement.appendChild(hook);


    // --- 初期化処理 ---
    function init() {
        if (initCompleted || document.getElementById('tab5')) {
             if (document.getElementById('lolex-settings')) {
                 bindUI();
             }
             return;
        }

        if (!document.querySelector('#settings-screen .pc-tab')) {
            return;
        }

        initCompleted = true;

        const residualContainer = document.getElementById('yt-fixed-container');
        if (residualContainer) {
            residualContainer.remove();
        }

        applyColorTheme(getPrimaryColor(), getSecondaryColor());

        setTimeout(() => {
            initYouTubePlayer();
            createBackgroundModal();
        }, 1000);

        setupHotkey();

        // (v0.70.4) 初期ロード時にもランダム選択を強制
        applyCustomBackground(true);

        createSettings();

        window.addEventListener('beforeunload', saveTime);
    }



    function initializeScript() {
        new MutationObserver((mutations, observer) => {
            if (document.querySelector('#settings-screen .pc-tab')) {
                observer.disconnect();
                init();
            }
        }).observe(document.body, { childList: true, subtree: true });

        if (document.readyState === 'interactive' || document.readyState === 'complete') {
            init();
        }
    }

})();
