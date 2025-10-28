// ==UserScript==
// @name          LOL.ex Lite ver0.60
// @namespace     http://tampermonkey.net/
// @version       0.60
// @description   LOLBeans extension
// @author        ユウキ / Yuki
// @match         https://lolbeans.io/*
// @match         https://bean.lol/*
// @match         https://obby.lol/*
// @grant         unsafeWindow
// @run-at        document-start
// ==/UserScript==

(function () {
    'use strict';

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeScript);
    } else {
        initializeScript();
        }

    let player;
    let isApiReady = false;
    let saveTimeInterval;
    let initCompleted = false;
    let currentVideoId = null;

    const STORAGE_VIDEO_KEY = 'yt-videoId';
    const STORAGE_PLAYLIST_KEY = 'yt-playlistId';
    const STORAGE_TIME_KEY = 'yt-last-time';
    const STORAGE_BACKGROUND_KEY = 'customBackgroundUrl';
    const STORAGE_IS_VISIBLE = 'yt-is-visible';

    let lastTime = parseFloat(localStorage.getItem(STORAGE_TIME_KEY)) || 0;
    currentVideoId = localStorage.getItem(STORAGE_VIDEO_KEY);

    // エアムーブ関連の関数を削除（clickAirMoveRadio, applyStoredAirMove, bindUI）

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
            } catch (e) {
            }
        }
    }

    function updateUrlInput(urlInput) {
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
        if (!playerDiv || !isApiReady || player) {
            return;
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
            // 再生リストが設定されている場合、リストとしてロード
            playerVars.listType = 'playlist';
            playerVars.list = playlistId;
            targetVideoId = ''; // リストロード時はvideoIdを空にするか、リスト内の最初の動画IDにする
            playerVars.start = 0; // リストロード時は開始時間は無効化
        } else {
            // 単一動画の場合
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

        // ロード後はリセット
        lastTime = 0;
        localStorage.setItem(STORAGE_TIME_KEY, 0);
    }

    function onPlayerReady(event) {
        event.target.unMute();

        const loopEnabled = localStorage.getItem('yt-loop') === 'true';
        const shuffleEnabled = localStorage.getItem('yt-shuffle') === 'true';
        event.target.setLoop(loopEnabled);

        const playlistId = localStorage.getItem(STORAGE_PLAYLIST_KEY);

        if (playlistId) {
             event.target.setShuffle(shuffleEnabled);
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
                if(autoplay) alert('Invalid YouTube URL or ID.');
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

        const loopEnabled = localStorage.getItem('yt-loop') === 'true';
        const shuffleEnabled = localStorage.getItem('yt-shuffle') === 'true';
        const startTime = 0;

        if (targetPlaylistId) {
            // プレイリストのロード
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
            // 単一動画のロード
            player.loadVideoById({ videoId: targetVideoId, startSeconds: startTime });
            player.setLoop(loopEnabled);
            player.unMute();
            player.playVideo();
        } else {
            // ストップ
            if (player && typeof player.stopVideo === 'function') {
                player.stopVideo();
            }
        }
    }

    function addCustomStyleSheet() {
        if (document.getElementById('lolex-custom-style')) return;
        const style = document.createElement('style');
        style.id = 'lolex-custom-style';
        style.textContent = `
        .youtube-input-group { display: flex; align-items: center; gap: 0.5em; }
        .youtube-input-group input { flex-grow: 1; padding: 0.5em; border: 1px solid #ccc; background: #222; color: #fff; }
        .youtube-input-group button { padding: 0.5em 1em; cursor: pointer; border: none; border-radius: 4px; }

        #yt-fixed-container {
            position: fixed;
            bottom: 10px;
            right: -500px;
            width: 480px;
            height: 300px;
            z-index: 9999;
            background: #000;
            border: 2px solid #555;
            display: flex;
            flex-direction: column;
            transition: right 0.3s ease-in-out;
        }
        #yt-fixed-container.yt-visible {
            right: 10px;
        }
        #yt-fixed-container.yt-collapsed {
            height: 260px !important;
        }

        #yt-fixed-container #yt-collapse-toggle {
            position: absolute;
            top: 0;
            left: 0;
            right: auto;
            background: rgba(0,0,0,0.5);
            color: white;
            border: none;
            cursor: pointer;
            padding: 4px 8px;
            z-index: 10001;
        }

        #yt-fixed-container .yt-input-area {
            height: 40px;
            padding: 4px 4px 4px 75px !important;
        }

        #yt-mobile-toggle-btn {
            position: fixed;
            bottom: 10px;
            left: 10px;
            width: 40px;
            height: 40px;
            z-index: 10000;
            cursor: pointer;
            background: rgba(255, 0, 0, 0.01);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 4px;
            display: none;
            box-shadow: 0 0 5px rgba(255, 0, 0, 0.2);
        }

        @media (max-width: 768px) {
             #yt-fixed-container {
                width: 320px;
                height: 200px;
                right: -330px;
             }
             #yt-fixed-container.yt-visible {
                right: 10px;
             }
             #yt-fixed-container.yt-collapsed {
                height: 160px !important;
             }
             #yt-mobile-toggle-btn {
                display: block;
             }
             #yt-fixed-container .yt-input-area {
                padding: 4px 4px 4px 75px !important;
             }
        }
    `;
        document.head.appendChild(style);
    }

    function initYouTubePlayer() {
        if (document.getElementById('yt-fixed-container')) return;

        addCustomStyleSheet();

        let ytContainer = document.createElement('div');
        ytContainer.id = 'yt-fixed-container';

        const isCollapsed = localStorage.getItem('yt-collapsed') === 'true';
        const isVisible = localStorage.getItem(STORAGE_IS_VISIBLE) === 'true';

        if (isCollapsed) ytContainer.classList.add('yt-collapsed');
        if (isVisible) ytContainer.classList.add('yt-visible');

        ytContainer.innerHTML = `
            <div id="yt-input-area" class="youtube-input-group yt-input-area" style="background: #333; display: ${isCollapsed ? 'none' : 'flex'};">
                <input type="text" id="yt-video-id-input" placeholder="YouTube URL or ID" style="flex-grow: 1; padding: 4px; border: 1px solid #555; background: #222; color: #fff;">
                <button id="yt-load-button" style="padding: 4px 8px; cursor: pointer; background: #4CAF50; color: white;">Load & Save</button>
            </div>
            <div class="youtube-player-wrapper" style="flex-grow: 1; position: relative; width: 100%; height: 260px;">
                <div id="yt-player"></div>
            </div>
            <button id="yt-collapse-toggle" style="">
                ${isCollapsed ? '▲ Open' : '▼ Close'}
            </button>
        `;
        document.body.appendChild(ytContainer);
        setupYouTubeCoreEventListeners(ytContainer);
        updateUrlInput(ytContainer.querySelector('#yt-video-id-input'));

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

        toggleButton.addEventListener('click', () => {
            const isCollapsed = ytContainer.classList.toggle('yt-collapsed');
            inputArea.style.display = isCollapsed ? 'none' : 'flex';
            toggleButton.innerHTML = isCollapsed ? '▼ Open' : '▲ Close';
            localStorage.setItem('yt-collapsed', isCollapsed);
        });

        const urlInput = ytContainer.querySelector('#yt-video-id-input');
        const loadButton = ytContainer.querySelector('#yt-load-button');

        loadButton.addEventListener('click', () => {
            loadYouTube(true, urlInput.value.trim());
        });

        urlInput.addEventListener('keydown', (e) => {
            if(e.key === 'Enter') {
                loadYouTube(true, urlInput.value.trim());
            }
            e.stopPropagation();
        });
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

    function applyCustomBackground() {
        const customStyleId = 'custom-background-style';
        const existingStyle = document.getElementById(customStyleId);
        if (existingStyle) { existingStyle.remove(); }

        const imageUrl = localStorage.getItem(STORAGE_BACKGROUND_KEY);

        if (imageUrl) {
            const css = `
             html body #screens #home-screen,
             html body #screens #profile-screen,
             html body #screens #shop-screen {
               background-image: url('${imageUrl}') !important;
               background-size: cover !important;
               background-position: center !important;
             }
            `;
            const style = document.createElement('style');
            style.id = customStyleId;
            document.documentElement.appendChild(style);
            style.textContent = css;
        }
    }

    function createSettings() {
        const tabContainer = document.querySelector('#settings-screen .pc-tab');
        if (!tabContainer || document.getElementById('tab5')) return;

        const style = document.createElement('style');
        style.textContent = `
                         .tab5 h3 { font-size: 1.25rem; font-weight: 500; margin-bottom: 0.75em; letter-spacing: 0.5px; line-height: 1.3; }
                         #tab5:checked ~ nav + section > .tab5 { display: block !important; }
                         .pc-tab section > .tab5 { display: none; }
                         .setting-section { padding: 1em; border-bottom: 1px solid rgba(0,0,0,0.2); }
                         .setting-row { display: flex; align-items: center; justify-content: space-between; max-width: 480px; margin: 0.5em 0; }
                         .setting-name { font-weight: bold; }
                         .setting-radio { display: flex; gap: 1em; }
                         .youtube-container { display: flex; flex-direction: column; gap: 1em; }
                         .tab5 ul { padding-left: 20px; }
                         .tab5 li { margin-bottom: 0.5em; }
        `;
        tabContainer.appendChild(style);


        const input = document.createElement('input');
        input.id = 'tab5'; input.type = 'radio'; input.name = 'pct';
        tabContainer.insertBefore(input, tabContainer.querySelector('nav'));
        const li = document.createElement('li');
        li.className = 'tab5'; li.innerHTML = '<label for="tab5">LOL.ex Lite ver0.60</label>';
        tabContainer.querySelector('nav ul').appendChild(li);

        const section = tabContainer.querySelector('section');
        const panel = document.createElement('div');
        panel.className = 'tab5';
        section.appendChild(panel);

        const ytSection = document.createElement('div');
        ytSection.className = 'setting-section';
        ytSection.innerHTML = `
            <h3>YouTube Player Settings</h3>

            <p style="font-size: 0.9em; font-weight: bold; margin-bottom: 1em; color: #fff;">
                🚨 表示・非表示の切り替え方法 🚨<br>
                <b>PCの場合:</b> <span style="background: #222; padding: 2px 4px; border-radius: 3px; color: #fff;">Ctrl + Y</span> または <span style="background: #222; padding: 2px 4px; border-radius: 3px; color: #fff;">Command + Y</span><br>
                <b>モバイルの場合:</b> 画面左下の 小さく透明なボタン をタップ
            </p>

            <p style="font-size: 0.8em; margin-bottom: 1em; color: #fff;">
                ✅ プレイヤーが画面外に隠れている状態でも<b>音声は流れ続け</b>、クリップへの映り込みを防ぎます。
            </p>

            <p style="font-size: 0.8em; color: #555; margin-bottom: 1em;">現在の再生位置: ${lastTime.toFixed(1)}秒</p>

            <div class="youtube-container">
                <div class="setting-row">
                    <div class="setting-name">Loop Video/Playlist</div>
                    <div class="setting-radio">
                        <label><input type="radio" name="yt-loop" value="false"> Off</label>
                        <label><input type="radio" name="yt-loop" value="true"> On</label>
                    </div>
                </div>
                <div class="setting-row">
                    <div class="setting-name">Shuffle Playlist</div>
                    <div class="setting-radio">
                        <label><input type="radio" name="yt-shuffle" value="false"> Off</label>
                        <label><input type="radio" name="yt-shuffle" value="true"> On</label>
                    </div>
                </div>
            </div>`;
        panel.appendChild(ytSection);

        const bgSection = document.createElement('div');
        bgSection.className = 'setting-section';
        bgSection.innerHTML = `
        <h3>Custom Background Image</h3>
        <div class="youtube-container">
            <div class="youtube-input-group">
                <input type="text" id="background-url-input" placeholder="Enter image URL" value="${localStorage.getItem(STORAGE_BACKGROUND_KEY) || ''}">
                <button id="background-apply-button">Apply</button>
                <button id="background-reset-button">Reset</button>
            </div>
        </div>
        <p style="font-size: 0.8em; margin-top: 0.5em; color: #555;">画像URLを入力後「Apply」で適用します。空にしてApply/Resetするとデフォルトに戻ります。</p>
    `;
        panel.appendChild(bgSection);

        const updatesSection = document.createElement('div');
        updatesSection.className = 'setting-section';
        updatesSection.innerHTML = `
            <h3>Latest Updates ver0.60</h3>
            <ul style="list-style-type: disc; margin-left: 20px;">
                <li style="margin-bottom: 0.5em;">youtube再生リストが使いやすいように最適化されました。</li>
                <li style="margin-bottom: 0.5em;">Liteバージョンでは、YouTubeとカスタム背景機能のみが含まれています。</li>
            </ul>`;
        panel.appendChild(updatesSection);

        setupYouTubeUI();
        setupBackgroundUI();

        setTimeout(() => {
            const tabInput = document.getElementById('tab5');
            if (tabInput && !tabInput.checked) {
                tabInput.checked = true;
            }
        }, 100);
    }

    function setupYouTubeUI() {
        const loopRadios = document.querySelectorAll('input[name="yt-loop"]');
        const shuffleRadios = document.querySelectorAll('input[name="yt-shuffle"]');

        const savedLoop = localStorage.getItem('yt-loop') === 'true';
        const loopRadio = document.querySelector(`input[name="yt-loop"][value="${savedLoop}"]`);
        if(loopRadio) loopRadio.checked = true;

        loopRadios.forEach(radio => radio.addEventListener('change', (e) => {
            localStorage.setItem('yt-loop', e.target.value);
            if (player) player.setLoop(e.target.value === 'true');
        }));

        const savedShuffle = localStorage.getItem('yt-shuffle') === 'true';
        const shuffleRadio = document.querySelector(`input[name="yt-shuffle"][value="${savedShuffle}"]`);
        if(shuffleRadio) shuffleRadio.checked = true;

        shuffleRadios.forEach(radio => radio.addEventListener('change', (e) => {
            localStorage.setItem('yt-shuffle', e.target.value);
            if (player) player.setShuffle(e.target.value === 'true');
        }));
    }

    function setupBackgroundUI() {
        const urlInput = document.getElementById('background-url-input');
        const applyButton = document.getElementById('background-apply-button');
        const resetButton = document.getElementById('background-reset-button');

        if (!urlInput || !applyButton || !resetButton) return;

        applyButton.addEventListener('click', () => {
            const newUrl = urlInput.value.trim();
            if (newUrl) {
                localStorage.setItem(STORAGE_BACKGROUND_KEY, newUrl);
            } else {
                localStorage.removeItem(STORAGE_BACKGROUND_KEY);
            }
            applyCustomBackground();
        });

        resetButton.addEventListener('click', () => {
            urlInput.value = '';
            localStorage.removeItem(STORAGE_BACKGROUND_KEY);
            applyCustomBackground();
        });
    }

    function init() {
        if (initCompleted || document.getElementById('tab5')) return;
        initCompleted = true;

        const residualContainer = document.getElementById('yt-fixed-container');
        if (residualContainer) {
            residualContainer.remove();
        }

        setTimeout(() => {
            initYouTubePlayer();
        }, 1000);

        setupHotkey();
        // applyStoredAirMove() は削除
        applyCustomBackground();

        createSettings();
        // bindUI() は削除

        window.addEventListener('beforeunload', saveTime);
    }

    // console.logフックとメッセージリスナーを削除

    function initializeScript() {
        new MutationObserver((mutations, observer) => {
            if (document.querySelector('#settings-screen .pc-tab')) {
                observer.disconnect();
                init();
            }
        }).observe(document.body, { childList: true, subtree: true });
    }

})();
