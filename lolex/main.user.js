// ==UserScript==
// @name         LOL.ex ver0.56 α
// @namespace    http://tampermonkey.net/
// @version      0.56
// @description  LOLBeans.io Extension
// @author       ユウキ / Yuki
// @match        https://lolbeans.io/*
// @match        https://bean.lol/*
// @match        https://obby.lol/*
// @grant        unsafeWindow
// @run-at       document-idle
// @updateURL    https://tanabesan.github.io/lolbeans/lolex/main.user.js
// @downloadURL  https://tanabesan.github.io/lolbeans/lolex/main.user.js
// ==/UserScript==

(function () {
    'use strict';

    // ─── グローバル変数 (YouTube Player) ──────────────────────────
    let player;
    let isApiReady = false;

    // ─── コース設定一覧 ───────────────────────────────────────────
    const courses = [
        { id: 'beacon-bay', keyword: 'BeaconBay', message: '🚨 Beacon Bay 🚨', displayName: 'Beacon Bay' },
        { id: 'boulder-hill', keyword: "BoulderHill", message: "🐛 Boulder Hill 🐛", displayName: "Boulder Hill" },
        { id: 'circus-contest', keyword: "CircusContest", message: "🎪 Circus Contest 🎪", displayName: "Circus Contest" },
        { id: 'devils-trick', keyword: "DevilsTrick", message: "👿 Devil's Trick 👿", displayName: "Devil's Trick" },
        { id: 'dash-cup', keyword: "FastRace", message: "🏆 Dash Cup 🏆", displayName: "Dash Cup" },
        { id: 'gravity-gates', keyword: "GravityGates", message: "🌌 Gravity Gates 🌌", displayName: "Gravity Gates" },
        { id: 'hammer-ville', keyword: "HammerVille", message: "🍩 Hammer Ville 🍩", displayName: "Hammer Ville" },
        { id: 'jungle-temple', keyword: "JungleTemple", message: "🐍 Jungle Temple 🐍", displayName: "Jungle Temple" },
        { id: 'kittie-kegs', keyword: "KittieKegs", message: "🐱 Kittie Kegs 🙀", displayName: "Kittie Kegs" },
        { id: 'lava-lake', keyword: "FloorIsLava", message: "🌋 Lava Lake 🌋", displayName: "Lava Lake" },
        { id: 'mecha-maze', keyword: "MechaMaze", message: "🤖 MechaMaze 🤖", displayName: "Mecha Maze" },
        { id: 'mill-valley', keyword: "MillValley", message: "🌾 Mill Valley 🍃", displayName: "Mill Valley" },
        { id: 'monster-manor', keyword: "MonsterManor", message: "🎃 Monster Manor 💀", displayName: "Monster Manor" },
        { id: 'polar-path', keyword: "PolarPath", message: "🧊 Polar Path 🧊", displayName: "Polar Path" },
        { id: '123-red-light', keyword: "RedLightGreenLight", message: "🦑 1-2-3 Red Light 🦑", displayName: "1-2-3 Red Light" },
        { id: 'nasty-seals', keyword: "NastySeals", message: "🦑 Nasty Seals 🦑", displayName: "Nasty Seals" },
        { id: 'rickety-run', keyword: "RicketyRun", message: "🟦 Rickety Run 🟪", displayName: "Rickety Run" },
        { id: 'risky-cliffs', keyword: "RiskyCliffs", message: "🎅 Risky Cliffs 🎅", displayName: "Risky Cliffs" },
        { id: 'shark-park', keyword: "SharkPark", message: "🦈 SharkPark 🦈", displayName: "Shark Park" },
        { id: 'silly-slide', keyword: "SillySlide", message: "🛝 Silly Slide 🛝", displayName: "Silly Slide" },
        { id: 'spiky-slopes', keyword: "SpikySlopes", message: "🔨 Spiky Slopes 🔨", displayName: "Spiky Slopes" },
        { id: 'splash-dash', keyword: "SplashDash", message: "🏊 Splash Dash 🏊", displayName: "Splash Dash" },
        { id: 'tumble-town', keyword: "TumbleTown", message: "✋ Tunble Town ✋", displayName: "Tumble Town" },
        { id: 'tricky-traps', keyword: "TrickyTraps", message: "🎁 Tricky Traps 🎁", displayName: "Tricky Traps" },
        { id: 'ufo-attack', keyword: 'UFOAttack', message: '🛸 UFO Attack 🛸', displayName: 'UFO Attack' }
    ];

    // ─── StopAirMoveラジオクリック ─────────────────────────────────
    function clickAirMoveRadio(enabled) {
        const selector = enabled ? '#air-movement-on' : '#air-movement-off';
        const radio = document.querySelector(selector);
        if (radio && !radio.checked) radio.click();
    }

    // ─── 保存済みStopAirMove適用 ───────────────────────────────────
    function applyStoredAirMove() {
        const stored = localStorage.getItem('stopAirMove');
        if (stored !== null) clickAirMoveRadio(stored === 'true');
    }

    // ─── YouTube URLパーサー ──────────────────────────────────────
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

    // ─── YouTube API ローダー ────────────────────────────────────
    const apiScript = document.createElement('script');
    apiScript.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(apiScript);

    // ─── YouTube API 対応関数 ────────────────────────────────────
    unsafeWindow.onYouTubeIframeAPIReady = function() {
        isApiReady = true;
        player = new YT.Player('yt-player', {
            height: '100%',
            width: '100%',
            playerVars: {
                'playsinline': 1,
                'autoplay': 0
            },
            events: {
                'onReady': onPlayerReady
            }
        });
    }

    function onPlayerReady(event) {
        loadYouTube();
    }

    function loadYouTube() {
        if (!player || typeof player.loadPlaylist !== 'function') {
            return;
        }

        const storedVideoId = localStorage.getItem('yt-videoId');
        const storedPlaylistId = localStorage.getItem('yt-playlistId');
        const loopEnabled = localStorage.getItem('yt-loop') === 'true';
        const shuffleEnabled = localStorage.getItem('yt-shuffle') === 'true';
        const playerWrapper = document.querySelector('.youtube-player-wrapper');

        if (storedPlaylistId) {
            playerWrapper.style.display = 'block';
            player.loadPlaylist({
                list: storedPlaylistId,
                listType: 'playlist',
                index: 0,
                startSeconds: 0,
                suggestedQuality: 'large'
            });

            setTimeout(() => {
                player.setLoop(loopEnabled);
                player.setShuffle(shuffleEnabled);
                player.playVideo();
            }, 1000);

        } else if (storedVideoId) {
            playerWrapper.style.display = 'block';
            player.loadVideoById(storedVideoId);
            setTimeout(() => {
                player.setLoop(loopEnabled);
                player.playVideo();
            }, 1000);

        } else {
            if (player && typeof player.stopVideo === 'function') {
                player.stopVideo();
            }
            if(playerWrapper) playerWrapper.style.display = 'none';
        }
    }

    // ─── カスタム背景画像適用 ──────────────────────────────────
    function applyCustomBackground() {
        const customStyleId = 'custom-background-style';
        const existingStyle = document.getElementById(customStyleId);
        if (existingStyle) {
            existingStyle.remove(); // 既存のスタイルを削除
        }

        const imageUrl = localStorage.getItem('customBackgroundUrl');

        // URLが設定されている場合のみ新しいスタイルを適用
        if (imageUrl) {
            const css = `
              html body #screens #home-screen,
              html body #screens #profile-screen,
              html body #screens #shop-screen {
                background-image: url('${imageUrl}') !important;
              }
            `;
            const style = document.createElement('style');
            style.id = customStyleId;
            style.textContent = css;
            document.documentElement.appendChild(style);
        }
    }

    // ─── 設定UIタブ追加 ───────────────────────────────────────────
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
                    .youtube-input-group { display: flex; align-items: center; gap: 0.5em; }
                    .youtube-input-group input { flex-grow: 1; padding: 0.5em; border: 1px solid #ccc; background: #fff; }
                    .youtube-input-group button { padding: 0.5em 1em; cursor: pointer; }
                    .youtube-player-wrapper { position: relative; width: 100%; padding-top: 56.25%; display: none; }
                    .youtube-player-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
                    .tab5 ul { padding-left: 20px; }
                    .tab5 li { margin-bottom: 0.5em; }
        `;
        tabContainer.appendChild(style);

        const input = document.createElement('input');
        input.id = 'tab5'; input.type = 'radio'; input.name = 'pct';
        tabContainer.insertBefore(input, tabContainer.querySelector('nav'));
        const li = document.createElement('li');
        li.className = 'tab5'; li.innerHTML = '<label for="tab5">LOL.ex ver0.56</label>';
        tabContainer.querySelector('nav ul').appendChild(li);

        const section = tabContainer.querySelector('section');
        const panel = document.createElement('div');
        panel.className = 'tab5';
        section.appendChild(panel);

        // コース設定セクション
        const courseSection = document.createElement('div');
        courseSection.className = 'setting-section';
        courseSection.innerHTML = '<h3>Course Stop Air Move Settings</h3>';
        courses.forEach(({ id, displayName }) => {
            const key = `stopAirMove_${id}`;
            const current = localStorage.getItem(key) || 'false';
            const row = document.createElement('div');
            row.className = 'setting-row';
            row.innerHTML = `<div class="setting-name">${displayName}</div>
                    <div class="setting-radio">
                        <label><input type="radio" name="stopair-${id}" value="false"> Off</label>
                        <label><input type="radio" name="stopair-${id}" value="true"> On</label>
                    </div>`;
            courseSection.appendChild(row);
            row.querySelectorAll('input').forEach(radio => {
                if (radio.value === current) radio.checked = true;
                radio.addEventListener('change', () => localStorage.setItem(key, radio.value));
            });
        });
        panel.appendChild(courseSection);

        // YouTube設定セクション
        const ytSection = document.createElement('div');
        ytSection.className = 'setting-section';
        ytSection.innerHTML = `
                <h3>YouTube Player</h3>
                <div class="youtube-container">
                    <div class="youtube-input-group">
                        <input type="text" id="yt-video-id-input" placeholder="Enter YouTube video or playlist URL">
                        <button id="yt-load-button">Load</button>
                    </div>
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
                    <div class="youtube-player-wrapper">
                        <div id="yt-player"></div>
                    </div>
                </div>`;
        panel.appendChild(ytSection);

        // 背景設定セクション
        const bgSection = document.createElement('div');
        bgSection.className = 'setting-section';
        bgSection.innerHTML = `
            <h3>Custom Background Image</h3>
            <div class="youtube-container">
                <div class="youtube-input-group">
                    <input type="text" id="background-url-input" placeholder="Enter image URL">
                    <button id="background-apply-button">Apply</button>
                    <button id="background-reset-button">Reset</button>
                </div>
            </div>
            <p style="font-size: 0.8em; margin-top: 0.5em; color: #555;">Leave empty and click Apply/Reset to restore the default background.</p>
        `;
        panel.appendChild(bgSection);

        // 最新アップデートセクション
        const updatesSection = document.createElement('div');
        updatesSection.className = 'setting-section';
        updatesSection.innerHTML = `
                <h3>Latest Updates ver0.56 α</h3>
                <ul style="list-style-type: disc; margin-left: 20px;">
                    <li style="margin-bottom: 0.5em;"><b>New : </b>背景画像を自由に変更できる機能を追加しました。</li>
                </ul>`;
        panel.appendChild(updatesSection);

        // UIイベントリスナー設定
        setupYouTubeUI();
        setupBackgroundUI();
    }

    function setupYouTubeUI() {
        const videoIdInput = document.getElementById('yt-video-id-input');
        const loadButton = document.getElementById('yt-load-button');
        const loopRadios = document.querySelectorAll('input[name="yt-loop"]');
        const shuffleRadios = document.querySelectorAll('input[name="yt-shuffle"]');

        const storedPlaylistId = localStorage.getItem('yt-playlistId');
        const storedVideoId = localStorage.getItem('yt-videoId');
        if (storedPlaylistId) {
            videoIdInput.value = `https://www.youtube.com/playlist?list=${storedPlaylistId}`;
        } else if (storedVideoId) {
            videoIdInput.value = `https://www.youtube.com/watch?v=${storedVideoId}`;
        }

        const savedLoop = localStorage.getItem('yt-loop') === 'true';
        document.querySelector(`input[name="yt-loop"][value="${savedLoop}"]`).checked = true;
        loopRadios.forEach(radio => radio.addEventListener('change', (e) => {
            localStorage.setItem('yt-loop', e.target.value);
            if (player) player.setLoop(e.target.value === 'true');
        }));

        const savedShuffle = localStorage.getItem('yt-shuffle') === 'true';
        document.querySelector(`input[name="yt-shuffle"][value="${savedShuffle}"]`).checked = true;
        shuffleRadios.forEach(radio => radio.addEventListener('change', (e) => {
            localStorage.setItem('yt-shuffle', e.target.value);
            if (player) player.setShuffle(e.target.value === 'true');
        }));

        loadButton.addEventListener('click', () => {
            const inputVal = videoIdInput.value.trim();
            if (inputVal === '') {
                localStorage.removeItem('yt-videoId');
                localStorage.removeItem('yt-playlistId');
            } else {
                const ids = getYouTubeIds(inputVal);
                if (ids.playlistId) {
                    localStorage.setItem('yt-playlistId', ids.playlistId);
                    localStorage.removeItem('yt-videoId');
                } else if (ids.videoId) {
                    localStorage.setItem('yt-videoId', ids.videoId);
                    localStorage.removeItem('yt-playlistId');
                } else {
                    return alert('Invalid YouTube URL or ID.');
                }
            }
            loadYouTube();
        });
    }

    function setupBackgroundUI() {
        const urlInput = document.getElementById('background-url-input');
        const applyButton = document.getElementById('background-apply-button');
        const resetButton = document.getElementById('background-reset-button');

        const savedUrl = localStorage.getItem('customBackgroundUrl');
        if (savedUrl) {
            urlInput.value = savedUrl;
        }

        applyButton.addEventListener('click', () => {
            const newUrl = urlInput.value.trim();
            if (newUrl) {
                localStorage.setItem('customBackgroundUrl', newUrl);
            } else {
                localStorage.removeItem('customBackgroundUrl');
            }
            applyCustomBackground();
        });

        resetButton.addEventListener('click', () => {
            urlInput.value = '';
            localStorage.removeItem('customBackgroundUrl');
            applyCustomBackground();
        });
    }

    // ─── 既存UIバインド ─────────────────────────────────────────
    function bindUI() {
        const container = document.getElementById('air-movement-settings');
        if (!container) return;
        const stored = localStorage.getItem('stopAirMove');
        if (stored !== null) {
            container.querySelectorAll('input[name="air-movement-option"]').forEach(i => {
                i.checked = (i.value === stored);
            });
        }
        container.querySelectorAll('input[name="air-movement-option"]').forEach(i => {
            i.addEventListener('change', () => {
                localStorage.setItem('stopAirMove', i.value);
                clickAirMoveRadio(i.value === 'true');
            });
        });
    }

    // ─── マップ読み込み検知と処理 ─────────────────────────────────
    const rules = courses.map(c => ({ keyword: c.keyword, id: c.id, message: c.message }));

    window.addEventListener('message', e => {
        if (e.data?.source !== 'console_proxy') return;
        const [tag, mapName] = e.data.args;
        if (tag === 'Loading map' && typeof mapName === 'string') {
            const rule = rules.find(r => mapName.toLowerCase().includes(r.keyword.toLowerCase()));
            const id = rule ? rule.id : mapName.toLowerCase().replace(/\s+/g, '-');
            const enabled = localStorage.getItem(`stopAirMove_${id}`) === 'true';
            clickAirMoveRadio(enabled);

            const displayText = rule ? rule.message : mapName;

            // --- ラウンドリザルト画面 (end-match-header) の表示 ---
            const header = document.getElementById('end-match-header');
            if (header) {
                const prev = document.getElementById('next-round-display-header');
                if (prev) prev.remove();

                const el = document.createElement('div');
                el.id = 'next-round-display-header';
                el.textContent = `Next Round... ${displayText}`;
                el.style.cssText = 'font-size:14px; color:#fff; margin-top:8px; text-align:center;';
                header.appendChild(el);
            }

            // --- death-screen の表示 ---
            const targetContainer = document.querySelector('#death-screen .top-section');
            if (targetContainer) {
                const prev = document.getElementById('next-round-display-death');
                if (prev) prev.remove();

                const el = document.createElement('div');
                el.id = 'next-round-display-death';
                el.textContent = `Next Round... ${displayText}`;
                el.style.cssText = 'font-size: 1.5rem; color: #fff; text-align: center; font-weight: bold; padding-top: 50px; text-shadow: 2px 2px 4px rgba(0,0,0,0.7);';
                targetContainer.appendChild(el);
            }
        }
    });

    // ─── console.log フック ───────────────────────────────────────
    const hook = document.createElement('script');
    hook.textContent = `
        (function(){
            const o = console.log;
            console.log = function(...a){
                window.postMessage({source:'console_proxy', args:a},'*');
                return o.apply(console,a);
            };
        })();
    `;
    document.documentElement.appendChild(hook);

    // ─── 初期化処理 ──────────────────────────────────────────
    function init() {
        if (document.getElementById('tab5')) return;

        applyStoredAirMove();
        applyCustomBackground(); // <-- 追加
        createSettings();
        bindUI();
    }

    // ─── DOM監視と初期化実行 ─────────────────────────────────────
    new MutationObserver((mutations, observer) => {
        if (document.querySelector('#settings-screen .pc-tab')) {
            init();
        }
    }).observe(document.body, { childList: true, subtree: true });

})();
