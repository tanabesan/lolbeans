// ==UserScript==
// @name         LOL.ex
// @namespace    http://tampermonkey.net/
// @version      0.51
// @description  LOLBeans Extension
// @author       yuki
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

    // ─── コース設定一覧 ───────────────────────────────────────────
    const courses = [
        { id: 'beacon-bay',      keyword: 'BeaconBay',          message: '🚨 Beacon Bay 🚨',      displayName: 'Beacon Bay' },
        { id: 'boulder-hill',    keyword: "BoulderHill",        message: "🐛 Boulder Hill 🐛",      displayName: "Boulder Hill" },
        { id: 'circus-contest',  keyword: "CircusContest",      message: "🎪 Circus Contest 🎪",    displayName: "Circus Contest" },
        { id: 'devils-trick',    keyword: "DevilsTrick",        message: "👿 Devil's Trick 👿",    displayName: "Devil's Trick" },
        { id: 'dash-cup',        keyword: "FastRace",           message: "🏆 Dash Cup 🏆",         displayName: "Dash Cup" },
        { id: 'gravity-gates',   keyword: "GravityGates",       message: "🌌 Gravity Gates 🌌",     displayName: "Gravity Gates" },
        { id: 'hammer-ville',    keyword: "HammerVille",        message: "🍩 Hammer Ville 🍩",     displayName: "Hammer Ville" },
        { id: 'jungle-temple',   keyword: "JungleTemple",       message: "🐍 Jungle Temple 🐍",     displayName: "Jungle Temple" },
        { id: 'kittie-kegs',     keyword: "KittieKegs",         message: "🐱 Kittie Kegs 🙀",     displayName: "Kittie Kegs" },
        { id: 'lava-lake',       keyword: "FloorIsLava",        message: "🌋 Lava Lake 🌋",       displayName: "Lava Lake" },
        { id: 'mecha-maze',      keyword: "MechaMaze",          message: "🤖 MechaMaze 🤖",        displayName: "Mecha Maze" },
        { id: 'mill-valley',     keyword: "MillValley",         message: "🌾 Mill Valley 🍃",     displayName: "Mill Valley" },
        { id: 'monster-manor',   keyword: "MonsterManor",       message: "🎃 Monster Manor 💀",   displayName: "Monster Manor" },
        { id: 'polar-path',      keyword: "PolarPath",          message: "🧊 Polar Path 🧊",      displayName: "Polar Path" },
        { id: '123-red-light',   keyword: "RedLightGreenLight", message: "🦑 1-2-3 Red Light 🦑",  displayName: "1-2-3 Red Light" },
        { id: 'nasty-seals',     keyword: "NastySeals",         message: "🦑 Nasty Seals 🦑",      displayName: "Nasty Seals" },
        { id: 'rickety-run',     keyword: "RicketyRun",         message: "🟦 Rickety Run 🟪",      displayName: "Rickety Run" },
        { id: 'risky-cliffs',    keyword: "RiskyCliffs",        message: "🎅 Risky Cliffs 🎅",    displayName: "Risky Cliffs" },
        { id: 'shark-park',      keyword: "SharkPark",          message: "🦈 SharkPark 🦈",        displayName: "Shark Park" },
        { id: 'silly-slide',     keyword: "SillySlide",         message: "🛝 Silly Slide 🛝",      displayName: "Silly Slide" },
        { id: 'spiky-slopes',    keyword: "SpikySlopes",        message: "🔨 Spiky Slopes 🔨",    displayName: "Spiky Slopes" },
        { id: 'splash-dash',     keyword: "SplashDash",         message: "🏊 Splash Dash 🏊",      displayName: "Splash Dash" },
        { id: 'tumble-town',     keyword: "TumbleTown",         message: "✋ Tunble Town ✋",      displayName: "Tumble Town" },
        { id: 'tricky-traps',    keyword: "TrickyTraps",        message: "🎁 Tricky Traps 🎁",    displayName: "Tricky Traps" },
        { id: 'ufo-attack',      keyword: 'UFOAttack',          message: '🛸 UFO Attack 🛸',      displayName: 'UFO Attack' }
    ];

    // ─── キーボードEnterイベント生成 ─────────────────────────────
    function createEnterEvent(type) {
        return new KeyboardEvent(type, { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13, which: 13 });
    }

    // ─── チャット送信 ────────────────────────────────────────────
    function sendChatByEnter(message) {
        const input = document.getElementById('chat-input');
        if (!input) return;
        for (let i = 0; i < 2; i++) {
            input.focus();
            input.value = message;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            ['keydown','keypress','keyup'].forEach(type => {
                input.dispatchEvent(createEnterEvent(type));
            });
        }
    }

    // ─── StopAirMoveラジオクリック ─────────────────────────────────
    function clickAirMovementRadio(enabled) {
        const selector = enabled ? '#air-movement-on' : '#air-movement-off';
        const radio = document.querySelector(selector);
        if (radio && !radio.checked) radio.click();
    }

    // ─── 保存済みStopAirMove適用 ───────────────────────────────────
    function applyStoredAirMovement() {
        const stored = localStorage.getItem('stopAirMove');
        if (stored !== null) clickAirMovementRadio(stored === 'true');
    }

    // ─── 保存済みBot送信設定取得（デフォルト：オフ） ───────────────────────────────
    function getStoredBotEnabled() {
        const stored = localStorage.getItem('enableBot');
        // stored が 'true' のときのみ有効、null（未設定）や 'false' の場合はオフ
        return stored === 'true';
    }

    // ─── YouTube URLから動画IDと再生リストIDを抽出する関数 ───────────
    function extractIds(input) {
        const urlRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|watch)\/|.*[?&]v=)|youtu\.be\/|youtube\.googleapis\.com\/v\/)([a-zA-Z0-9_-]{11})/;
        const playlistRegex = /[?&]list=([a-zA-Z0-9_-]+)/;
        const videoMatch = input.match(urlRegex);
        const playlistMatch = input.match(playlistRegex);
        return {
            videoId: videoMatch ? videoMatch[1] : null,
            playlistId: playlistMatch ? playlistMatch[1] : null,
        };
    }

    // ─── 設定UIタブ追加 ───────────────────────────────────────────
    function createSettingsTab() {
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
              .youtube-player-wrapper { position: relative; width: 100%; padding-top: 56.25%; }
              .youtube-player-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        `;
        tabContainer.appendChild(style);

        const input = document.createElement('input');
        input.id = 'tab5'; input.type = 'radio'; input.name = 'pct';
        tabContainer.insertBefore(input, tabContainer.querySelector('nav'));
        const li = document.createElement('li');
        li.className = 'tab5'; li.innerHTML = '<label for="tab5">Extensions</label>';
        tabContainer.querySelector('nav ul').appendChild(li);

        const section = tabContainer.querySelector('section');
        const panel = document.createElement('div');
        panel.className = 'tab5';
        section.appendChild(panel);

        // Bot設定セクション
        const botSection = document.createElement('div');
        botSection.className = 'setting-section';
        botSection.innerHTML = `<h3>Bot Settings</h3>
            <div class="setting-row">
                <div class="setting-name">Send Map Name Bot</div>
                <div class="setting-radio">
                    <label><input type="radio" name="enable-bot" value="false"> Off</label>
                    <label><input type="radio" name="enable-bot" value="true"> On</label>
                </div>
            </div>`;
        panel.appendChild(botSection);
        const botEnabled = getStoredBotEnabled();
        botSection.querySelectorAll('input[name="enable-bot"]').forEach(radio => {
            if (String(botEnabled) === radio.value) radio.checked = true;
            radio.addEventListener('change', () => localStorage.setItem('enableBot', radio.value));
        });

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

        // YouTube設定セクションの追加
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
                <div class="youtube-player-wrapper">
                    <iframe id="yt-player" src="" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                </div>
            </div>`;
        panel.appendChild(ytSection);

        const videoIdInput = document.getElementById('yt-video-id-input');
        const loadButton = document.getElementById('yt-load-button');
        const player = document.getElementById('yt-player');
        const loopRadios = document.querySelectorAll('input[name="yt-loop"]');

        const buildAndLoadPlayer = () => {
            const loopEnabled = localStorage.getItem('yt-loop') === 'true';
            const storedVideoId = localStorage.getItem('yt-videoId');
            const storedPlaylistId = localStorage.getItem('yt-playlistId');
            let embedUrl = '';

            if (storedPlaylistId) {
                // 再生リストのURLを構築
                const params = new URLSearchParams({ list: storedPlaylistId, autoplay: '1' });
                if (loopEnabled) params.append('loop', '1');
                embedUrl = `https://www.youtube.com/embed/videoseries?${params.toString()}`;
            } else if (storedVideoId) {
                // 単一動画のURLを構築
                const params = new URLSearchParams({ autoplay: '1', enablejsapi: '1' });
                if (loopEnabled) {
                    params.append('loop', '1');
                    params.append('playlist', storedVideoId);
                }
                embedUrl = `https://www.youtube.com/embed/${storedVideoId}?${params.toString()}`;
            }

            if (embedUrl) {
                player.src = embedUrl;
                // ローカルストレージの値に基づいて入力欄を更新
                if(storedPlaylistId) {
                    videoIdInput.value = `https://www.youtube.com/playlist?list=${storedPlaylistId}`;
                } else if (storedVideoId) {
                    videoIdInput.value = `https://www.youtube.com/watch?v=${storedVideoId}`;
                }
            }
        };

        // ループ設定の読み込みとイベントリスナー
        const savedLoop = localStorage.getItem('yt-loop') === 'true';
        document.querySelector(`input[name="yt-loop"][value="${savedLoop}"]`).checked = true;
        loopRadios.forEach(radio => radio.addEventListener('change', (e) => {
            localStorage.setItem('yt-loop', e.target.value);
            buildAndLoadPlayer();
        }));

        // 読み込みボタンのクリックイベント
        loadButton.addEventListener('click', () => {
            const inputVal = videoIdInput.value.trim();
            const ids = extractIds(inputVal);

            if (ids.playlistId) {
                localStorage.setItem('yt-playlistId', ids.playlistId);
                localStorage.removeItem('yt-videoId');
            } else if (ids.videoId) {
                localStorage.setItem('yt-videoId', ids.videoId);
                localStorage.removeItem('yt-playlistId');
            } else {
                return alert('Invalid YouTube URL or ID.');
            }
            buildAndLoadPlayer();
        });

        // 初期読み込み
        buildAndLoadPlayer();
    }

    // ─── 既存UIバインド ─────────────────────────────────────────
    function bindExistingUI() {
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
                clickAirMovementRadio(i.value === 'true');
            });
        });
    }

    // ─── マップ読み込み検知と処理 ─────────────────────────────────
    const rules = courses.map(c => ({ keyword: c.keyword, id: c.id, message: c.message }));
    function buildChatMessage(mapName) {
        const r = rules.find(r => mapName.toLowerCase().includes(r.keyword.toLowerCase()));
        return r ? `Next Map... ${r.message}` : `Next Round... ${mapName}`;
    }

    window.addEventListener('message', e => {
        if (e.data?.source !== 'console_proxy') return;
        const [tag, mapName] = e.data.args;
        if (tag === 'Loading map' && typeof mapName === 'string') {
            if (getStoredBotEnabled()) sendChatByEnter(buildChatMessage(mapName));
            const rule = rules.find(r => mapName.toLowerCase().includes(r.keyword.toLowerCase()));
            const id = rule ? rule.id : mapName.toLowerCase().replace(/\s+/g, '-');
            const enabled = localStorage.getItem(`stopAirMove_${id}`) === 'true';
            clickAirMovementRadio(enabled);

            const displayText = rule ? rule.message : mapName;
            const header = document.getElementById('end-match-header');
            if (header) {
                const prev = document.getElementById('next-round-display');
                if (prev) prev.remove();
                const el = document.createElement('div');
                el.id = 'next-round-display';
                el.textContent = `Next Round... ${displayText}`;
                el.style.cssText = 'font-size:14px; color:#fff; margin-top:8px; text-align:center;';
                header.appendChild(el);
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

    // ─── 初期化 ─────────────────────────────────────────────────
    applyStoredAirMovement();
    createSettingsTab();
    bindExistingUI();
    new MutationObserver(() => {
        createSettingsTab();
        bindExistingUI();
    }).observe(document.body, { childList: true, subtree: true });

})();
