/**
 * lolrank-i18n.js
 * ビーンズランク各ページの英語表示(nav-menu.js の JP/EN 切り替えと連動)。
 * 各ページで nav-menu.js より前(または後)に <script src=".../lolrank/lolrank-i18n.js" defer></script> を読み込むだけ。
 * 日本語の文言をキーに辞書で置換し、後から動的に追加された文言も自動で翻訳します。
 */
(function () {
  const KEY = 'lolbeans-lang';
  const D = {
 "戦闘力が振り切れている。もはや名物と化した毒舌キャラ": "Off the charts. A sharp-tongued legend at this point",
 "喧嘩を売る速度が速すぎる。今日も誰かに絡んでいそう": "Picks fights way too fast. Probably starting one right now",
 "煽り耐性ゼロ、煽り性能は満点。日常的に火花を散らす": "Zero taunt resistance, max taunt power. Sparks fly daily",
 "口が悪い日の方が多い。油断すると刺してくる": "Foul-mouthed more days than not. Stabs when you're not looking",
 "普段は平和だが、スイッチが入ると牙をむくタイプ": "Usually peaceful, but bares fangs once switched on",
 "基本おだやかだが、たまに鋭い一言を挟んでくる": "Mostly mellow, with the occasional sharp remark",
 "滅多に見せない棘。あるとちょっと驚く": "Rarely shows thorns, so it's a surprise when they do",
 "平和主義寄り。ごく稀に本音が漏れる程度": "Leans pacifist. Only rarely lets the truth slip",
 "争いを知らない。むしろ丸すぎるまである": "Knows no conflict. Almost too gentle",
 "喋らせたら止まらない、場の空気を握るMC気質": "Unstoppable once talking: a born MC who owns the room",
 "一言ごとに笑いが起きる、雑談界のラスボス": "Every line gets laughs: the final boss of banter",
 "話を振れば必ず拾ってくれる安定の面白さ": "Always picks up what you throw. Reliably funny",
 "平均よりテンポがいい。会話のキャッチボールが上手": "Better tempo than average. Great at back-and-forth",
 "ノリよく反応してくれる、いい話し相手": "Responds with good energy. A great chat partner",
 "聞き役寄りだけど、たまに良いパンチラインを放つ": "More of a listener, but drops a great punchline now and then",
 "静かめだが、稀に核心を突く一言を言う": "Quiet, but occasionally nails the point",
 "聞き専気味。話しかければ普通に返してくれる": "Mostly listens, but replies normally when spoken to",
 "寡黙。雑談の主役に回ることはほぼない": "Reserved. Almost never the star of the chat",
 "次に何をするか誰にも予測できない、伝説級の変人": "Nobody can predict their next move. A legendary weirdo",
 "予測不能装置。想定の斜め上を平然と行く": "An unpredictability machine. Casually goes beyond expectations",
 "突飛な発想や行動が頻発、油断ならない存在": "Frequent wild ideas and moves. Never let your guard down",
 "時々変な引き出しが開く。目が離せないタイプ": "Odd drawers open sometimes. Impossible to look away",
 "たまに突拍子もないことを言い出す茶目っ気枠": "Playfully blurts out random things now and then",
 "基本常識人だが、たまにネジが外れる瞬間がある": "Basically sensible, with the occasional screw loose",
 "普段は真面目。稀に予想外の一面を見せる": "Normally serious. Rarely shows a surprising side",
 "ほぼ安定志向。意外性はごく僅か": "Mostly stable. Very little surprise",
 "堅実で読みやすい、安心感のあるタイプ": "Steady and predictable. Reassuring",
 "体を張って笑いを取りにいく、生粋のお笑い担当": "Goes all out for laughs. A born comedian",
 "自虐のネタ切れを知らない、ハプニング製造機": "Never runs out of self-deprecating material. A mishap generator",
 "自分がボケることを恐れない、頼れるギバー気質": "Not afraid to play the fool. A dependable giver",
 "平均よりネタに体を張りがち。損得より笑いを優先": "Tends to sacrifice for the bit. Laughs over gains",
 "たまに自分を犠牲にしてでも場を盛り上げる": "Sometimes sacrifices themselves to liven things up",
 "控えめだが、ここぞという時に自虐を挟む": "Modest, but throws in self-deprecation at the right moment",
 "あまり自分は犠牲にしないが、稀に一発かます": "Rarely sacrifices themselves, but occasionally goes for it",
 "堅実タイプ。自虐は滅多に見せない": "The steady type. Rarely self-deprecates",
 "自分の株は守る主義。自己犠牲とは無縁": "Protects their own image. No self-sacrifice here",
 "この人が言えば流行る。コミュニティのトレンド発信源": "If they say it, it catches on. The community's trend source",
 "発言の拡散力が高く、しばしば話題の中心になる": "Words spread fast; often the center of conversation",
 "一目置かれる存在。発言に説得力がある": "Respected. Their words carry weight",
 "平均より発言力あり。時々ノリが広がっていく": "More influential than average. Their vibes sometimes spread",
 "たまに発言がネタとして広がることがある": "Sometimes their remarks spread as memes",
 "控えめだが、たまに刺さる発言をする": "Low-key, but occasionally says something that lands",
 "目立たないが、稀に話題になる発言をする": "Unobtrusive, but rarely says something that gets talked about",
 "あまり表に出ないタイプ。存在感は控えめ": "Doesn't show up much. Subtle presence",
 "発言が広がることはほぼない、静かな存在": "Their words hardly ever spread. A quiet presence",
 "みんなの潤滑油。揉め事があれば自然と収まる": "Everyone's lubricant. Trouble settles down naturally",
 "場の空気を読むのが上手く、頼りにされる存在": "Great at reading the room. Relied upon",
 "仲裁役として信頼が厚い、まとめ役タイプ": "Trusted as a mediator. A natural organizer",
 "平均より場を落ち着かせる場面が多い": "Calms things down more often than average",
 "たまに空気を和ませたり、場を取り持ったりする": "Sometimes lightens the mood and smooths things over",
 "控えめだが、必要な時にはうまく間に入る": "Modest, but steps in skillfully when needed",
 "目立たないが、稀に場を和ませる一言を言う": "Unobtrusive, but rarely says something that eases the mood",
 "あまり調整役には回らない、マイペースタイプ": "Rarely plays mediator. Goes at their own pace",
 "調和役として動くことはほぼない": "Almost never acts as the peacemaker",
 "もはや公認変態。誰も驚かなくなったレベル": "An officially recognized pervert. Nobody's surprised anymore",
 "変態力が振り切れ気味。油断すると際どい発言が飛んでくる": "Lewdness maxed out. Risque remarks fly when you least expect",
 "隙あらば下ネタ・きわどい発言を挟んでくる": "Slips in dirty jokes at every chance",
 "平均よりやや際どい。たまにギリギリを攻める": "Slightly edgier than average. Sometimes pushes the limit",
 "たまに変態的な一面をのぞかせる": "Occasionally shows a perverted side",
 "控えめだが、たまに際どい発言をする": "Modest, but sometimes says risque things",
 "滅多に見せないが、稀に本性が出る": "Rarely shown, but their true nature slips out at times",
 "ほぼ紳士(淑女)寄り。ごく稀に片鱗が見える": "Nearly a gentleman/lady. Traces show only very rarely",
 "清廉潔白、変態要素はほぼ皆無": "Squeaky clean. Virtually no lewd traits",
 "相手に絡んで喧嘩を売る・毒舌を放つ頻度と強度": "How often and how intensely they pick fights or use a sharp tongue",
 "誰よりも頻繁かつ強烈に喧嘩を売る・毒を吐く。象徴的な存在": "Picks fights and spews venom more often and harder than anyone. An icon",
 "高い頻度で攻撃的な言動をする。煽り・毒舌が日常": "Frequently aggressive; taunts and sharp words are routine",
 "時々毒舌や煽りを見せる。標準的な攻撃性": "Sometimes shows sharp words or taunts. Standard aggression",
 "稀に強めの発言をする程度": "Only rarely says anything strong",
 "攻撃的な言動はほとんど見られない": "Hardly any aggressive behavior",
 "雑談の中での言い回し・ネタのセンスで場を沸かせる力": "Ability to liven up the room with phrasing and joke sense in chat",
 "発言のたびに笑いが起きる、雑談を支配する存在": "Gets laughs with every line and dominates the chat",
 "高い頻度で場を沸かせる面白い発言をする": "Often says funny things that liven up the room",
 "時々センスのいい発言で笑いを取る": "Sometimes gets laughs with good sense",
 "たまに面白いことを言う程度": "Occasionally says something funny",
 "雑談で目立つことはあまりない": "Rarely stands out in chat",
 "予測不能な言動・不気味さで存在感を残す力": "Leaves an impression through unpredictable behavior and eeriness",
 "常に読めない言動で強烈な印象を残す、掴みどころのない存在": "Always unreadable, leaves a strong impression. Elusive",
 "しばしば予測不能な行動を見せる": "Often shows unpredictable behavior",
 "時々変わった一面を見せる": "Sometimes shows an unusual side",
 "たまに独特な言動をする程度": "Occasionally acts uniquely",
 "言動は基本的に読みやすい": "Behavior is basically easy to read",
 "プライドを捨て、自虐やハプニングで笑いを提供する力": "Drops pride to provide laughs through self-deprecation and mishaps",
 "誰よりも体を張り、自虐やハプニングで常に笑いを提供するギバー": "Goes all out for laughs, a giver who always entertains with self-deprecation and mishaps",
 "頻繁に自虐やハプニングでネタを提供する": "Often provides material through self-deprecation and mishaps",
 "時々自分を犠牲にして笑いを取る": "Sometimes sacrifices themselves for laughs",
 "たまに自虐的なことを言う程度": "Occasionally says something self-deprecating",
 "自分を犠牲にする場面はほぼない": "Almost never sacrifices themselves",
 "発言が重い・その人発のノリが広がる力": "Weight of their words and ability to spread their own vibe",
 "発言やノリが必ずと言っていいほど広まる、流行の発信源": "Their words and vibes almost always spread. A trend source",
 "発言力が強く、しばしば周りに影響を与える": "Strong voice that often influences others",
 "時々その人発のネタが広がることがある": "Sometimes their jokes spread",
 "たまに発言が話題になる程度": "Occasionally their remarks become a topic",
 "発言が広がることはあまりない": "Their words rarely spread",
 "場に自然に馴染み、揉め事があれば収める力": "Blends in naturally and settles conflicts",
 "誰からも慕われ、揉め事を収める中心的存在": "Loved by all, a central figure who settles conflicts",
 "高い頻度で場を和ませたり仲裁したりする": "Often lightens the mood or mediates",
 "時々場を落ち着かせる役割を果たす": "Sometimes plays a calming role",
 "たまに調和的な行動を見せる程度": "Occasionally acts harmoniously",
 "調和役として目立つことはあまりない": "Rarely stands out as a peacemaker",
 "きわどい発言・行動でみんなをざわつかせる力": "Ability to stir everyone up with risque remarks and actions",
 "誰よりも際どい発言や行動を連発する、伝説級の変態": "Fires off risque remarks and actions like no one else. A legendary pervert",
 "高い頻度できわどい発言や行動をする": "Often makes risque remarks and actions",
 "時々変態的な一面を見せる": "Sometimes shows a perverted side",
 "稀にきわどい発言をする程度": "Rarely makes risque remarks",
 "変態的な言動はほとんど見られない": "Hardly any perverted behavior",
 "攻撃性": "Aggression",
 "雑談力": "Chat Skill",
 "狂気度": "Madness",
 "献身度": "Devotion",
 "影響力": "Influence",
 "調和力": "Harmony",
 "変態度": "Lewdness",
 "総合": "Overall",
 "狂暴": "Violent",
 "優しさ": "Kindness",
 "変態": "Lewd",
 "概要": "Overview",
 "LOLBeans ビーンズランク": "LOLBeans Bean Rank",
 "ビーンズランク": "Bean Rank",
 "ビーンズを評価": "Rate Beans",
 "プレイヤー登録申請": "Request Player Registration",
 "プレイヤー詳細": "Player Details",
 "ビーンズランク Tier List": "Bean Rank Tier List",
 "LOLBeansのプレイヤーを、みんなの評価で6項目・S〜Dランクで採点。": "Rate LOLBeans players on 6 items from S to D, based on everyone's votes.",
 "平均スコアでTierに振り分けて、総合・狂暴・優しさの3つのランキングを見ることができます。": "Players are sorted into Tiers by average score, with three rankings: Overall, Violent and Kindness.",
 "ビーンズを評価する": "Rate Beans",
 "気になるプレイヤーを選んで、6項目をS〜Dで評価しよう。何度でも上書きして修正できます。": "Pick a player and rate the 6 items from S to D. You can overwrite and fix your vote any time.",
 "ビーンズランクを見る": "View Bean Rank",
 "みんなの評価から算出されたTierリスト。総合・狂暴・優しさの3タブで見られます。": "A Tier list calculated from everyone's ratings, in 3 tabs: Overall, Violent and Kindness.",
 "評価される6項目": "The 6 rated items",
 "仕組み": "How it works",
 "プレイヤーを選んで、": "Pick a player and ",
 "6項目をS〜Dで評価": "rate the 6 items from S to D",
 "する": ".",
 "同じ相手には": "For the same player, you can ",
 "何度でも上書き投票": "overwrite your vote any number of times",
 "が可能(重複投票はIPで自動判定)": " (duplicate votes are detected by IP).",
 "3人以上": "3 or more people",
 "から評価が集まったプレイヤーだけ、ランキングに表示される": " must rate a player before they appear in the rankings.",
 "総合・狂暴・優しさ、3つの基準でTier(S+〜F)に振り分けて表示": "Players are sorted into Tiers (S+ to F) by three criteria: Overall, Violent and Kindness.",
 "LOLBeans非公式ファンサイト": "Unofficial LOLBeans fan site",
 "ビーンズランクにまだ登録されていない人を、評価対象として追加リクエストできます。": "Request to add someone who isn't registered in Bean Rank yet as a rating target.",
 "承認され次第、投票フォームの一覧に表示されます。": "Once approved, they will appear in the voting form list.",
 "登録したい人の名前": "Name of the person to register",
 "例: ぬーん": "e.g. Nuun",
 "アイコン画像(任意)": "Icon image (optional)",
 "＋ 画像を選択(未設定でも申請可)": "+ Choose an image (optional)",
 "申請を送信する": "Submit request",
 "※申請はすぐには反映されません。管理者が確認・承認した後、ランキングの評価対象として使えるようになります。": "* Requests are not applied immediately. After an admin reviews and approves it, the player becomes available for rating.",
 "※アイコンは2MBまで。": "* Icons up to 2MB.",
 "名前を入力してください": "Please enter a name",
 "アイコンのファイルサイズは2MB以内にしてください": "Icon file size must be 2MB or less",
 "送信中(アイコンをアップロード中)...": "Sending (uploading icon)...",
 "送信中...": "Sending...",
 "申請を送信しました。承認をお待ちください": "Request sent. Please wait for approval.",
 "送信に失敗しました。時間をおいて再度お試しください": "Failed to send. Please try again later.",
 "攻撃性・雑談力・狂気度・献身度・影響力・調和力の6項目をS〜Dで評価できます。": "Rate 6 items (Aggression, Chat Skill, Madness, Devotion, Influence, Harmony) from S to D.",
 "※評価した相手は、あなたを含めて": "Note: players you rate won't show up in the ranking until at least",
 "から評価されるまで": " (including you) have rated them in ",
 "のランキングには表示されません（少人数の偏った評価を防ぐため）。": ", to prevent bias from small samples.",
 "評価したい人の名前で検索...": "Search by name...",
 "評価済み(": "Rated (",
 "人) クリックで修正できます": ") Click to edit",
 "名前順": "By name",
 "更新順": "By update",
 "読み込み中...": "Loading...",
 "左のリストから評価したい相手を選んでください": "Select a player to rate from the list on the left",
 "プレイヤーが見つかりません": "No players found",
 "(playersコレクション未登録の場合は追加が必要です)": "(If the players collection is not registered, it needs to be added)",
 "合計": "Total",
 "未選択": "Not selected",
 "送信": "Submit",
 "全項目を選択してください": "Please select every item",
 "送信の準備ができました": "Ready to submit",
 "評価を更新しました": "Rating updated",
 "評価を送信しました": "Rating submitted",
 "ランキングに戻る": "Back to ranking",
 "プレイヤーが指定されていません": "No player specified",
 "パーソナリティチャート": "Personality chart",
 "項目別詳細": "Details by item",
 "読み込みに失敗しました": "Failed to load",
 "総合(7項目の尖り度)・攻撃性(狂暴)・調和力/献身度(優しさ)・変態度、4つの軸でTier分けするランキングです。": "A ranking split into Tiers on 4 axes: Overall (sharpness across 7 items), Aggression (Violent), Harmony/Devotion (Kindness) and Lewdness.",
 "※総合ランキングは「平均的(B)」より「極端(SまたはD)」な評価ほど高得点になります。": "* In the Overall ranking, extreme ratings (S or D) score higher than average ones (B).",
 "あなたも評価する": "Rate players too",
 "※3人以上から評価された人だけがランキングに表示されます(評価人数も併記)": "* Only players rated by 3 or more people appear in the ranking (rating count shown).",
 "総合ランキング": "Overall Ranking",
 "狂暴ランキング": "Violent Ranking",
 "優しさランキング": "Kindness Ranking",
 "変態ランキング": "Lewdness Ranking",
 "個別ページを開く": "Open player page",
 "閉じる": "Close",
 "まだ採点対象なし": "No rated players yet",
 "ランキングの読み込みに失敗しました": "Failed to load the ranking"
};
  const CAT = { '総合':'Overall', '狂暴':'Violent', '優しさ':'Kindness', '変態':'Lewd' };
  const RULES = [
    [/^(.+) さんを評価$/, 'Rate $1'],
    [/^\/ (\d+)　ランク$/, '/ $1  Rank'],
    [/^\(未選択 (\d+) 項目は0点として計算中\)$/, '($1 not selected: counted as 0)'],
    [/^あと(\d+)人以上の評価が集まると、Tier判定とランキングへの掲載が有効になります。$/, 'Once $1 more ratings come in, Tier judgment and ranking listing become available.'],
    [/^まだ(\d+)人以上から評価されたプレイヤーがいません$/, 'No players have been rated by $1 or more people yet'],
    [/^(総合|狂暴|優しさ|変態): /, (m, c) => CAT[c] + ': '],
    [/評価人数 (\d+)人/, 'Ratings: $1'],
    [/　(\d+)人$/, '  ·  $1 ratings']
  ];
  let lang = 'jp';
  try { lang = localStorage.getItem(KEY) === 'en' ? 'en' : 'jp'; } catch (e) {}
  const orig = new WeakMap(), done = new WeakMap();

  function tr(str) {
    const t = str.trim();
    if (!t) return null;
    if (t in D) return str.replace(t, D[t]);
    let out = t, hit = false;
    for (const [re, rep] of RULES) { const n = out.replace(re, rep); if (n !== out) { out = n; hit = true; } }
    return hit ? str.replace(t, out) : null;
  }
  const skip = el => el && el.closest && el.closest('script,style,#nav-side-menu,#nav-menu-toggle,#nav-menu-overlay');
  function doText(n) {
    if (lang !== 'en' || skip(n.parentElement) || done.get(n) === n.nodeValue) return;
    const r = tr(n.nodeValue);
    if (r !== null && r !== n.nodeValue) { orig.set(n, n.nodeValue); done.set(n, r); n.nodeValue = r; }
  }
  function doAttrs(el) {
    if (skip(el)) return;
    ['placeholder', 'title'].forEach(a => {
      if (!el.hasAttribute || !el.hasAttribute(a)) return;
      const key = 'data-jp-' + a;
      const jp = el.hasAttribute(key) ? el.getAttribute(key) : el.getAttribute(a);
      const r = tr(jp);
      if (r !== null) { el.setAttribute(key, jp); el.setAttribute(a, r); }
    });
  }
  function walk(root) {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1 || skip(root)) return;
    doAttrs(root);
    root.querySelectorAll('[placeholder],[title]').forEach(doAttrs);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) doText(n);
  }
  function restore() {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) {
      if (orig.has(n) && done.get(n) === n.nodeValue) { n.nodeValue = orig.get(n); done.delete(n); }
    }
    document.querySelectorAll('[data-jp-placeholder],[data-jp-title]').forEach(el => {
      ['placeholder', 'title'].forEach(a => { const k = 'data-jp-' + a; if (el.hasAttribute(k)) { el.setAttribute(a, el.getAttribute(k)); el.removeAttribute(k); } });
    });
  }
  function titleFix() {
    if (!document.body.dataset.jpTitle) document.body.dataset.jpTitle = document.title;
    const jp = document.body.dataset.jpTitle;
    document.title = lang === 'en' ? jp.split(' | ').map(p => D[p.trim()] || p).join(' | ') : jp;
  }
  function setLang(l) {
    lang = l === 'en' ? 'en' : 'jp';
    document.documentElement.lang = lang === 'en' ? 'en' : 'ja';
    if (lang === 'en') walk(document.body); else restore();
    titleFix();
  }
  window.setLang = setLang;
  new MutationObserver(ms => {
    if (lang !== 'en') return;
    for (const m of ms) {
      if (m.type === 'characterData') doText(m.target);
      else m.addedNodes.forEach(walk);
    }
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  const start = () => setLang(lang);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();