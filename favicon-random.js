/**
 * favicon-random.js
 * ページを開くたびに、色と表情がランダムなビーンズのファビコンに差し替える。
 * 使い方: <head> 内の既存の <link rel="icon"> より後ろに
 *   <script src="/lolbeans/favicon-random.js"></script>
 * を1行足すだけ。JSが無効なときは元の <link rel="icon"> がそのまま使われる。
 * 色や表情を増やすときは PALS / FACES に足す。
 */
(function () {
    // 体(16x16)。P=本体 L=ハイライト S=影。目や口は FACES で重ねる。
    const BODY = [
        "................",
        "................",
        ".....PPPPPPPP...",
        "....PPPPPPPPPP..",
        "...PPLLPPPPPPPP.",
        "...PPLPPPPPPPPP.",
        "...PPPPPPPPPPPP.",
        "...PPPPPPPPPPPP.",
        "...PPPPPPPPPPPP.",
        "...PPPPPPPPPPPP.",
        "...PPPPPPPPPPSS.",
        "...PPPPPPPPPPSS.",
        "...PPPPPPPPSSSS.",
        "....PPPPPPPSSS..",
        ".....PPPPSSSS...",
        "................"
    ];
    // [本体, ハイライト, 影]
    const PALS = [
        ["#c77dff", "#f1d4ff", "#8a3fc4"], // 紫
        ["#4cc9f0", "#d3f4ff", "#2a8fb0"], // 水色
        ["#ff5d8f", "#ffd0de", "#c23a66"], // ピンク
        ["#ffd23f", "#fff3b8", "#c9a01c"], // 黄
        ["#2ee6a6", "#c9fbe9", "#1ba87a"], // 緑
        ["#ff8a3d", "#ffd9bf", "#c4601c"]  // オレンジ
    ];
    // 目・口のピクセル座標 [x, y]
    const FACES = {
        normal:    [[6,7],[7,7],[6,8],[7,8],[10,7],[11,7],[10,8],[11,8]],
        happy:     [[6,7],[5,8],[7,8],[11,7],[10,8],[12,8]],
        wink:      [[6,7],[7,7],[6,8],[7,8],[10,8],[11,8],[12,8]],
        sleepy:    [[5,8],[6,8],[7,8],[10,8],[11,8],[12,8]],
        surprised: [[6,6],[7,6],[6,7],[7,7],[6,8],[7,8],[10,6],[11,6],[10,7],[11,7],[10,8],[11,8],[8,11],[9,11],[8,12],[9,12]]
    };
    const BG = "#0b0c16";

    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

    function make(pal, faceName) {
        let r = "";
        const px = (x, y, c) => { r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${c}"/>`; };
        BODY.forEach((row, y) => [...row].forEach((ch, x) => {
            if (ch === "P") px(x, y, pal[0]);
            else if (ch === "L") px(x, y, pal[1]);
            else if (ch === "S") px(x, y, pal[2]);
        }));
        FACES[faceName].forEach(([x, y]) => px(x, y, BG));
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">` +
               `<rect width="16" height="16" rx="3" fill="${BG}"/>${r}</svg>`;
    }

    function randomFavicon() {
        if (typeof document === "undefined") return;
        const pal = pick(PALS);
        const face = pick(Object.keys(FACES));
        const svg = make(pal, face);
        document.querySelectorAll('link[rel~="icon"]').forEach(l => l.remove());
        const link = document.createElement("link");
        link.rel = "icon";
        link.type = "image/svg+xml";
        link.href = "data:image/svg+xml," + encodeURIComponent(svg);
        document.head.appendChild(link);
        return { pal: pal, face: face };
    }

    if (typeof window !== "undefined") window.randomFavicon = randomFavicon;
    if (typeof module !== "undefined") module.exports = { make, PALS, FACES };
    randomFavicon();
})();
