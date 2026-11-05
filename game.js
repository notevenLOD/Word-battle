/* ============================================================
   标点坦克 / Word 文档摸鱼版
   A small top-down tank game disguised as a dense Word document.
   ============================================================ */
(() => {
  "use strict";

  const PAGE_W = 1120;
  const PAGE_H = 792;
  const ARENA = { left: 58, right: 1062, top: 50, bottom: 733 };
  const PLAYER_BASE_SPEED = 154.4;
  const PLAYER_BASE_COOLDOWN = 0.33;
  const PLAYER_BASE_WIDTH = 20;

  const RED = "#a9372a";
  const RED_BRIGHT = "#c84a38";
  const BLUE = "#2b62bb";
  const FONT_DOC = '"SimSun", "宋体", "Songti SC", serif';
  const FONT_UI = '"Microsoft YaHei", "PingFang SC", sans-serif';

  // Exactly three points on each edge. Every enemy (boss included) starts
  // outside the red arena frame and walks in.
  const SPAWN_POINTS = [
    { x: 336, y: 38 }, { x: 560, y: 38 }, { x: 784, y: 38 },
    { x: 336, y: 756 }, { x: 560, y: 756 }, { x: 784, y: 756 },
    { x: 34, y: 356 }, { x: 34, y: 464 }, { x: 34, y: 571 },
    { x: 1086, y: 356 }, { x: 1086, y: 464 }, { x: 1086, y: 571 },
  ];

  const $ = (id) => document.getElementById(id);
  const page = $("page");
  const canvas = $("gameCanvas");
  const ctx = canvas.getContext("2d");
  const canvasArea = $("canvasArea");
  const workspace = $("workspace");
  const introComment = $("introComment");
  const tutorialCanvas = $("tutorialCanvas");
  const tutorialCtx = tutorialCanvas.getContext("2d");
  const tutorialStage = $("tutorialStage");
  const tutorialKeys = $("tutorialKeys");
  const tutorialText = $("tutorialText");
  const tutorialStep = $("tutorialStep");
  const tutorialDots = $("tutorialDots");
  const tutorialNextBtn = $("tutorialNextBtn");
  const tutorialPrevBtn = $("tutorialPrevBtn");
  const tutorialSkipBtn = $("tutorialSkipBtn");
  const pausePill = $("pausePill");
  const waveStamp = $("waveStamp");
  const waveStampText = $("waveStampText");
  const wordCountEl = $("wordCount");
  const proofingStatus = $("proofingStatus");
  const proofingText = $("proofingText");
  const waveNoEl = $("waveNo");
  const pageNoEl = $("pageNo");
  const toastEl = $("wordToast");
  const toastTitle = $("toastTitle");
  const toastText = $("toastText");
  const gameOverModal = $("gameOverModal");
  const finalClearModal = $("finalClearModal");
  const finalClearWaveEl = $("finalClearWave");
  const wordCountModal = $("wordCountModal");
  const cheatPanel = $("cheatPanel");
  const cheatInvincibleEl = $("cheatInvincible");
  const cheatLevelEl = $("cheatLevel");
  const cheatStyleEl = $("cheatStyle");
  const cheatMoveReadout = $("cheatMoveReadout");
  const cheatFireReadout = $("cheatFireReadout");
  const cheatRewardsEl = $("cheatRewards");
  const cheatHintEl = $("cheatHint");
  const zoomSlider = $("zoomSlider");
  const zoomValue = $("zoomValue");
  const muteBtn = $("muteBtn");
  const muteLabel = $("muteLabel");
  const articleColumns = $("articleColumns");
  const damageMeterEl = $("damageMeter");
  const fireRateMeterEl = $("fireRateMeter");
  const ownedCardStrip = $("ownedCardStrip");
  const pageLevelTop = $("pageLevelTop");
  const pageLevelBottom = $("pageLevelBottom");
  const pageEnemyLevel = $("pageEnemyLevel");
  const enemyLevelEl = $("enemyLevel");
  const enemyLevelChip = $("pageEnemyLevel");
  const rewardEnemyLevel = $("rewardEnemyLevel");
  const styleRewardWindow = $("styleRewardWindow");
  const styleRewardGrid = $("styleRewardGrid");
  const styleRewardKicker = $("styleRewardKicker");
  const stylesRibbonGroup = $("stylesRibbonGroup");
  const fragmentStatus = $("fragmentStatus");
  const fragmentPips = $("fragmentPips");
  const fragmentCountEl = $("fragmentCount");

  const MODE = {
    INTRO: "intro",
    PLAYING: "playing",
    PAUSED: "paused",
    DYING: "dying",
    GAMEOVER: "gameover",
    READING: "reading",
    REWARD: "reward",
    FINAL_CLEAR: "final-clear",
  };

  const FINAL_CLEAR_STEP = 40;
  const FINAL_BOSS_LINES = [
    "我是最终boss",
    "这一页由我终审",
    "全部修订成功？",
    "格式由我决定",
    "我不接受这次修改",
    "再改一遍试试",
  ];

  const TUTORIAL_PAGES = [
    { text: "按WASD移动", keys: "wasd" },
    { text: "按IJKL发射校对子弹", keys: "ijkl" },
    { text: "右侧蓝色圆圈是校对权限，也就是你的生命值。", keys: null },
    { text: "拾取黄色格式碎片获得格式奖励，拾取蓝色权限恢复生命值。", keys: null },
    { text: "选择格式奖励强化你的校对。", keys: null },
    { text: "生存到第十波最后击败最终审核吧。", keys: null },
  ];

  // Highlighter colour per article map.
  const WALL_PROFILES = [
    { hue: 47, sat: 94, light: 60 },
    { hue: 143, sat: 48, light: 51 },
    { hue: 213, sat: 58, light: 59 },
    { hue: 24, sat: 84, light: 55 },
    { hue: 279, sat: 46, light: 63 },
    { hue: 181, sat: 48, light: 48 },
  ];

  // Fixed highlighter layout for each of the six article maps, traced from the
  // annotated contact sheet. Coordinates are in the 1120 x 792 page space.
  const FIXED_WALLS = [
    [
      { x: 748, y: 196, w: 188, h: 16 },
      { x: 246, y: 214, w: 88, h: 16 },
      { x: 750, y: 296, w: 192, h: 18 },
      { x: 166, y: 506, w: 230, h: 16 },
      { x: 796, y: 572, w: 80, h: 16 },
      { x: 158, y: 646, w: 244, h: 16 },
    ],
    [
      { x: 520, y: 196, w: 34, h: 18 },
      { x: 516, y: 200, w: 30, h: 16 },
      { x: 522, y: 218, w: 24, h: 16 },
      { x: 512, y: 314, w: 32, h: 16 },
      { x: 510, y: 334, w: 32, h: 16 },
      { x: 510, y: 358, w: 36, h: 16 },
      { x: 766, y: 402, w: 208, h: 20 },
      { x: 140, y: 416, w: 186, h: 18 },
      { x: 574, y: 430, w: 36, h: 16 },
      { x: 574, y: 502, w: 34, h: 16 },
      { x: 576, y: 526, w: 30, h: 16 },
      { x: 574, y: 542, w: 32, h: 16 },
      { x: 572, y: 614, w: 30, h: 16 },
    ],
    [
      { x: 146, y: 196, w: 132, h: 16 },
      { x: 654, y: 212, w: 136, h: 23 },
      { x: 338, y: 292, w: 144, h: 20 },
      { x: 896, y: 296, w: 114, h: 16 },
      { x: 634, y: 364, w: 142, h: 20 },
      { x: 134, y: 424, w: 112, h: 20 },
      { x: 886, y: 452, w: 138, h: 16 },
      { x: 310, y: 530, w: 146, h: 23 },
      { x: 660, y: 540, w: 140, h: 16 },
      { x: 146, y: 602, w: 124, h: 16 },
      { x: 894, y: 614, w: 126, h: 16 },
    ],
    [
      { x: 634, y: 200, w: 336, h: 20 },
      { x: 364, y: 382, w: 186, h: 16 },
      { x: 576, y: 386, w: 198, h: 16 },
      { x: 106, y: 560, w: 356, h: 22 },
    ],
    [
      { x: 258, y: 196, w: 28, h: 16 },
      { x: 826, y: 196, w: 170, h: 16 },
      { x: 258, y: 198, w: 28, h: 16 },
      { x: 258, y: 218, w: 34, h: 16 },
      { x: 258, y: 260, w: 36, h: 16 },
      { x: 254, y: 312, w: 40, h: 16 },
      { x: 374, y: 422, w: 170, h: 16 },
      { x: 602, y: 430, w: 150, h: 16 },
      { x: 816, y: 478, w: 38, h: 16 },
      { x: 822, y: 500, w: 26, h: 16 },
      { x: 818, y: 524, w: 34, h: 16 },
      { x: 812, y: 554, w: 48, h: 16 },
      { x: 816, y: 572, w: 40, h: 16 },
      { x: 816, y: 590, w: 46, h: 16 },
      { x: 814, y: 614, w: 48, h: 16 },
      { x: 130, y: 622, w: 184, h: 16 },
    ],
    [
      { x: 324, y: 196, w: 58, h: 16 },
      { x: 870, y: 196, w: 78, h: 16 },
      { x: 378, y: 222, w: 78, h: 16 },
      { x: 676, y: 254, w: 94, h: 16 },
      { x: 160, y: 278, w: 122, h: 22 },
      { x: 864, y: 300, w: 86, h: 18 },
      { x: 588, y: 362, w: 90, h: 16 },
      { x: 916, y: 386, w: 84, h: 18 },
      { x: 294, y: 412, w: 148, h: 16 },
      { x: 152, y: 450, w: 120, h: 16 },
      { x: 706, y: 452, w: 98, h: 16 },
      { x: 386, y: 490, w: 86, h: 20 },
      { x: 182, y: 542, w: 104, h: 16 },
      { x: 818, y: 542, w: 114, h: 16 },
      { x: 616, y: 584, w: 96, h: 18 },
      { x: 352, y: 634, w: 100, h: 16 },
      { x: 816, y: 666, w: 126, h: 16 },
      { x: 242, y: 678, w: 112, h: 16 },
    ],
  ];

  const FIRE_DIRS = {
    KeyI: { x: 0, y: -1, angle: -Math.PI / 2, label: "上" },
    KeyJ: { x: -1, y: 0, angle: Math.PI, label: "左" },
    KeyK: { x: 0, y: 1, angle: Math.PI / 2, label: "下" },
    KeyL: { x: 1, y: 0, angle: 0, label: "右" },
  };

  const ENEMY_TYPES = {
    comma: {
      glyph: "，", name: "逗号", hp: 1, speed: 112, radius: 14,
      range: 0, fireRate: 0, wordValue: 7, color: "#873025",
      size: 33,
    },
    question: {
      glyph: "？", name: "问号", hp: 1, speed: 56, radius: 16,
      range: 305, fireRate: 1.65, wordValue: 17, color: "#a33227",
      size: 32, bulletSpeed: 178,
    },
    exclamation: {
      glyph: "！", name: "感叹号", hp: 2, speed: 39, radius: 17,
      range: 260, fireRate: 2.4, wordValue: 27, color: "#8f2a20",
      size: 33, bulletSpeed: 158, spread: 3,
    },
    semicolon: {
      glyph: "；", name: "分号", hp: 1, speed: 59, radius: 16,
      range: 370, fireRate: 2.35, wordValue: 22, color: "#b04732",
      size: 32, bulletSpeed: 335, sniper: true,
    },
    ellipsis: {
      glyph: "……", name: "长句", hp: 18, speed: 76, radius: 33,
      range: 420, fireRate: 1.8, wordValue: 210, color: "#811f18",
      size: 36, bulletSpeed: 155, boss: true,
    },
    bracket_l: {
      glyph: "[", name: "左方括号", hp: 12, speed: 74, radius: 26,
      range: 620, fireRate: 1.8, wordValue: 170, color: "#7b2230",
      size: 58, bulletSpeed: 185, boss: true, bracket: true, side: "left",
      bracketHalf: 31,
    },
    bracket_r: {
      glyph: "]", name: "右方括号", hp: 12, speed: 74, radius: 26,
      range: 620, fireRate: 1.8, wordValue: 170, color: "#7b2230",
      size: 58, bulletSpeed: 185, boss: true, bracket: true, side: "right",
      bracketHalf: 31,
    },
    at: {
      glyph: "@", name: "邮件符", hp: 20, speed: 152, radius: 23,
      range: 0, fireRate: 2, wordValue: 190, color: "#6d2348",
      size: 50, bulletSpeed: 180, boss: true, bouncer: true,
    },
    final: {
      glyph: "审", name: "终审修订框", hp: 180, speed: 58, radius: 56,
      range: 0, fireRate: 0, wordValue: 888, color: "#6e294e",
      size: 120, boss: true, finalBoss: true,
    },
    gold: {
      glyph: "¶", name: "金色格式符", hp: 3, speed: 96, radius: 20,
      range: 0, fireRate: 0, wordValue: 0, color: "#b88624",
      size: 42, gold: true, noContact: true,
    },
  };

  const RARITIES = {
    white: { label: "白色", tier: "普通", weight: 0.55 },
    blue: { label: "蓝色", tier: "精良", weight: 0.30 },
    red: { label: "红色", tier: "稀有", weight: 0.15 },
  };

  const REWARD_POOL = [
    {
      id: "fire_w", name: "快速校对 +30%", rarity: "white", kind: "fireRate", value: 0.30,
      glyph: "速", desc: "射速提升 30%。",
    },
    {
      id: "fire_b", name: "快速校对 +60%", rarity: "blue", kind: "fireRate", value: 0.60,
      glyph: "速", desc: "射速提升 60%。",
    },
    {
      id: "fire_r", name: "快速校对 +100%", rarity: "red", kind: "fireRate", value: 1.00,
      glyph: "速", desc: "射速提升 100%，可重复叠加。",
    },
    {
      id: "damage_w", name: "修正力度 +1", rarity: "white", kind: "damageAdd", value: 1,
      glyph: "力", desc: "修正力度 +1，每一级让自机造成的所有伤害提高 20%。",
    },
    {
      id: "damage_b", name: "修正力度 +2", rarity: "blue", kind: "damageAdd", value: 2,
      glyph: "力", desc: "修正力度 +2，每一级让自机造成的所有伤害提高 20%。",
    },
    {
      id: "damage_r", name: "修正力度 +3", rarity: "red", kind: "damageAdd", value: 3,
      glyph: "力", desc: "修正力度 +3，每一级让自机造成的所有伤害提高 20%。",
    },
    {
      id: "move_w", name: "轻快走位 +50%", rarity: "white", kind: "moveSpeed", value: 0.50,
      glyph: "步", desc: "移速提升 50%，上限为初始移速的 200%。",
    },
    {
      id: "move_b", name: "轻快走位 +100%", rarity: "blue", kind: "moveSpeed", value: 1.00,
      glyph: "步", desc: "移速提升 100%，上限为初始移速的 200%。",
    },
    {
      id: "shield_w", name: "扩宽背面盾", rarity: "white", kind: "shieldAdd", value: PLAYER_BASE_WIDTH / 2,
      glyph: "盾", desc: "背后盾宽增加半格，挡下来自背后的子弹。",
    },
    {
      id: "shield_b", name: "全宽背面盾", rarity: "blue", kind: "shieldSet", value: PLAYER_BASE_WIDTH,
      glyph: "盾", desc: "背后盾宽增加一格，挡下更多来自背后的子弹。",
    },
    {
      id: "spread_b", name: "注意分散", rarity: "blue", kind: "spread", value: 1,
      glyph: "散", desc: "获得向外散射的额外弹道，重复选取时在最大角度外各再加 1 条弹道。",
    },
    {
      id: "abundance_r", name: "格式繁多", rarity: "red", kind: "rewardOption", value: 1,
      glyph: "繁", desc: "获得格式奖励卡时从 3 个选项增加到 4 个选项；无法叠加。",
    },
    {
      id: "rapid_b", name: "急速修改", rarity: "blue", kind: "rapidEdit", value: 1,
      glyph: "疾", desc: "移动时向移动方向发射两列额外子弹，移速越高伤害越高。",
    },
    {
      id: "bullet_r", name: "增补弹丸 +1", rarity: "red", kind: "extraBullet", value: 1,
      glyph: "弹", desc: "每次射击额外发射 1 枚平行弹丸。",
    },
    {
      id: "laser_r", name: "激光审阅", rarity: "red", kind: "style", value: "laser",
      glyph: "光", desc: "攻击方式改为贯穿式激光，脉冲速度为攻击速度的 150%，单目标基础 DPS 为 150%。",
    },
    {
      id: "rocket_r", name: "火箭校对", rarity: "red", kind: "style", value: "rocket",
      glyph: "=", desc: "攻击方式改为火箭：深蓝色火箭弹单发伤害为原攻击的 300%，射速降为 50%，命中敌人后爆炸。",
    },
    {
      id: "trifurcate_r", name: "三叉", rarity: "red", kind: "style", value: "trifurcate",
      glyph: "三", desc: "将攻击方式替换为三向散弹；子弹显示为紫色短横线 -。",
    },
    {
      id: "orbit_b", name: "环绕脚注", rarity: "blue", kind: "orbiter", value: 2,
      glyph: "环", desc: "增加 2 颗大型环绕脚注，绕自机旋转、撞击敌人并拦截子弹。",
    },
    {
      id: "aura_b", name: "修订光环", rarity: "blue", kind: "aura", value: 1,
      glyph: "域", desc: "自机周围持续产生伤害光环，自动处理靠近的标点。",
    },
    {
      id: "resurrection_w", name: "死而后生", rarity: "white", kind: "healReward", value: 1,
      glyph: "生", desc: "每拾取四个修订，获得一张白色修正力度奖励卡。",
    },
    {
      id: "grit_r", name: "愈战愈勇", rarity: "red", kind: "killFireRate", value: 1,
      glyph: "勇", desc: "每击败一个敌人，攻击速度提升 1%。",
    },
    {
      id: "faith_r", name: "信心爆棚", rarity: "red", kind: "bossSpread", value: 1,
      glyph: "信", desc: "每击败一个 Boss，获得一张注意分散奖励卡。",
    },
    {
      id: "daydream_b", name: "白日梦", rarity: "blue", kind: "whiteDamage", value: 1,
      glyph: "梦", desc: "每拥有一张白色奖励卡，修正力度 +1；获得时按已有白卡立即结算。",
    },
    {
      id: "blueSea_r", name: "蓝海", rarity: "red", kind: "blueFireRate", value: 1,
      glyph: "海", desc: "每拥有一张蓝色奖励卡，攻击速度 +20%；获得时按已有蓝卡立即结算。",
    },
  ];

  const ARTICLE_VARIANTS = [
    {
      base: true,
      fileName: "Residual Attention_final(3).docx",
      date: "Working Paper · November 2024",
    },
    {
      title: "Marginal Syntax",
      subtitle: "Notes on the Small Type of Institutional Life",
      byline: "Mei Lin　·　Program in Media Studies, Dongchuan University",
      fileName: "Marginal_Syntax_clean.docx",
      date: "Working Paper · March 2025",
      offset: 3,
      abstract: "This essay follows the small type of institutional life: the margin note, the footnote, the form field, and the line reserved for a signature. These are places where the official document lowers its voice. Drawing on printed forms, software templates, and interviews with clerks, the paper argues that margins are not empty leftovers but delegated spaces in which discretion is exercised. To read the margin is to see how an institution distributes permission without ever stating that it has done so.",
      keywords: "margins; footnotes; institutional design; small print; discretion",
      sections: [
        "I. The Margin as Workplace",
        "II. Footnotes and Discretion",
        "III. The Shape of a Form",
        "IV. Invisible Labor",
        "V. Coda",
      ],
      uniques: [
        "Every form carries a small architecture of permission. A box marked “other” may be the only place where a clerk can describe what actually happened; a line for a signature transforms a person into an accountable surface. The margin is where the form admits that its categories are incomplete.",
        "Footnotes are often treated as subordinate prose, yet they carry the practical intelligence of a document: exceptions, warnings, qualifications, and the names of people who did the work. To move an argument into a footnote is not to banish it. It is to change the audience and lower the light.",
      ],
      quote: "The margin is not outside the page; it is where the page admits that it has an edge.",
      extraRef: "Lin, M. (2025). The small print of institutional care. <em>Journal of Form Studies</em>, 12(2), 41–67.",
      ack: "Acknowledgements: The author thanks the records office for permission to read the margins of forms that were never meant to be read.",
    },
    {
      title: "The Quiet Ledger",
      subtitle: "Accounting for Time in the Open-Plan Office",
      byline: "Jiaheng Wu　·　School of Management, Dongchuan University",
      fileName: "The_Quiet_Ledger_v4.docx",
      date: "Working Paper · June 2024",
      offset: 7,
      abstract: "This paper listens to the spreadsheet as a workplace artifact. Cells, formulas, frozen panes, and audit trails organize not only money but also the tempo of attention. Through a study of monthly reporting in three offices, it shows how the ledger converts uncertainty into columns and how workers learn to live with the small anxieties that remain outside the sum. The spreadsheet is less a record of the past than a machine for making the next hour accountable.",
      keywords: "spreadsheets; accounting; office time; audit trails; uncertainty",
      sections: [
        "I. Time as a Column",
        "II. The Spreadsheet Gaze",
        "III. Recalculation",
        "IV. Quiet Errors",
        "V. Closing the Book",
      ],
      uniques: [
        "A spreadsheet is a promise that the past can be rearranged. Each cell holds a number, but also a relation; drag a formula and the whole office quietly recomputes. The work of the ledger lies less in the sum than in the confidence that the sum will remain available.",
        "Audit trails are written in a language of small consequences: who opened the file, when a figure changed, which version was saved. The ledger does not remember the argument in the corridor, but it remembers the moment a cell was overwritten. That is enough to reconstruct a working day.",
      ],
      quote: "The total is not the end of the calculation; it is the point at which the office agrees to stop looking.",
      extraRef: "Wu, J. (2024). Recalculation and the moral economy of the monthly report. <em>Office Studies Quarterly</em>, 9(1), 5–29.",
      ack: "Acknowledgements: The author is grateful to the finance team for explaining which errors are allowed to remain visible.",
    },
    {
      title: "Drafting Daylight",
      subtitle: "Window Light, Task Light, and the Fiction of the Workday",
      byline: "Suyin Han　·　Department of Architecture, Dongchuan University",
      fileName: "Drafting_Daylight_review.docx",
      date: "Working Paper · September 2025",
      offset: 11,
      abstract: "Daylight enters the office as both a material and a schedule. It determines where a desk is placed, when a screen becomes unreadable, and how the afternoon acquires its shape. This essay follows light across an open-plan floor, from the first glare on a monitor to the last reflection in a window at dusk. It argues that the workday is not only measured by clocks but also drafted by the changing angle of the sun.",
      keywords: "daylight; office architecture; glare; temporality; atmosphere",
      sections: [
        "I. The Window Seat",
        "II. Light as Schedule",
        "III. Afternoon Architecture",
        "IV. The Glare",
        "V. Dusk",
      ],
      uniques: [
        "The window seat is never only a seat. It is a claim on warmth, a view of the weather, and a slightly different relationship to the clock. Those who sit near the glass learn the movement of the sun before they learn the movement of the manager; the room announces its hours in reflections.",
        "Artificial light promises continuity, but daylight introduces negotiation. A blind is lowered by one person and raised by another; a screen is tilted; a chair migrates six inches to the left. The office is never fully lit, only repeatedly adjusted.",
      ],
      quote: "A room is never finished while the sun still has something to say about it.",
      extraRef: "Han, S. (2025). The glare at four o’clock. <em>Journal of Spatial Practice</em>, 7(3), 88–104.",
      ack: "Acknowledgements: The author thanks the east-facing staff for their patience with a year of light measurements.",
    },
    {
      title: "The Office of Small Errors",
      subtitle: "Correction, Repetition, and the Maintenance of Composure",
      byline: "Qiao Tang　·　Writing Program, Dongchuan University",
      fileName: "Office_of_Small_Errors.docx",
      date: "Working Paper · January 2025",
      offset: 5,
      abstract: "Small errors are the daily weather of office work. A misplaced comma, a wrong date, a name spelled two ways in the same document: each demands a correction that must be performed without disturbing the impression of competence. This paper examines the labor of repair in administrative writing. It argues that composure is not the absence of error but a disciplined way of managing its visibility, and that the correction is often more instructive than the mistake.",
      keywords: "error; correction; composure; administrative writing; repair",
      sections: [
        "I. The Typo",
        "II. Repetition",
        "III. Composure",
        "IV. The Final Pass",
        "V. Erasure",
      ],
      uniques: [
        "A typo is a small breach in the surface of authority. It may be invisible to everyone except the person who sent the message, but that person will carry it through the afternoon. The correction is usually quiet: a new file, a brief apology, a sentence that asks the recipient to disregard the previous version.",
        "Tracked changes turn repair into a visible performance. Insertions glow in one color, deletions in another; a document can display its own hesitation. When the changes are finally accepted, the record of uncertainty disappears, leaving a clean page that looks as if it had never been otherwise.",
      ],
      quote: "The clean copy is not a page without errors; it is a page whose errors have learned where to stand.",
      extraRef: "Tang, Q. (2025). Please disregard the previous version. <em>Written Communication Review</em>, 18(4), 201–219.",
      ack: "Acknowledgements: The author thanks every colleague who has ever said “that was my mistake” in a meeting.",
    },
    {
      title: "After the Cursor",
      subtitle: "Interface Memory and the Afterlife of Edits",
      byline: "Yun Chen　·　Department of English, Dongchuan University",
      fileName: "After_the_Cursor_final.docx",
      date: "Working Paper · April 2025",
      offset: 13,
      abstract: "What remains after an edit is finished? This essay examines the afterlife of small textual actions in word processors: the undo stack, the autosave history, the cursor that returns to a sentence long after it was abandoned. It proposes that software remembers in a different register from people, preserving traces without understanding them. Reading those traces reveals a quiet form of interface memory, one that shapes how writers imagine their own continuity.",
      keywords: "interface memory; undo; autosave; revision; cursor",
      sections: [
        "I. The Trace",
        "II. Undo",
        "III. Interface Memory",
        "IV. The Last Edit",
        "V. Afterimage",
      ],
      uniques: [
        "Undo is a temporal technology disguised as a button. It promises that the last action can be withdrawn, but it also teaches the writer to think of time as a stack of reversible states. The confidence to experiment grows in proportion to the belief that nothing is final.",
        "Autosave produces a second, quieter document beneath the visible one. It records versions that no one intends to read and preserves the exact moment before a sentence was ruined. To open the version history is to meet a former self who was almost finished but not quite.",
      ],
      quote: "The cursor blinks because the interface cannot decide whether the sentence is over.",
      extraRef: "Chen, Y. (2025). Version history and the poetics of the almost-final. <em>Digital Writing Studies</em>, 4(2), 71–90.",
      ack: "Acknowledgements: The author thanks the many drafts that were never deleted and the cursor that waited for them.",
    },
  ];

  /* ---------------- audio ---------------- */
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.master = null;
    }
    ensure() {
      if (this.muted) return null;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!this.ctx) {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.42;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
      return this.ctx;
    }
    tone(freq, duration, type = "sine", volume = 0.025, slide = 0, delay = 0) {
      const ac = this.ensure();
      if (!ac) return;
      const now = ac.currentTime + delay;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freq), now);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), now + duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + duration + 0.03);
    }
    noise(duration = 0.12, volume = 0.035, cutoff = 900) {
      const ac = this.ensure();
      if (!ac) return;
      const length = Math.floor(ac.sampleRate * duration);
      const buffer = ac.createBuffer(1, length, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const source = ac.createBufferSource();
      source.buffer = buffer;
      const filter = ac.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = cutoff;
      const gain = ac.createGain();
      gain.gain.setValueAtTime(volume, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      source.start();
    }
    shoot() {
      this.tone(920, 0.038, "triangle", 0.013, -360);
      this.noise(0.032, 0.009, 2300);
    }
    enemyShoot() {
      this.tone(280, 0.07, "sawtooth", 0.01, -90);
    }
    hit() {
      this.tone(510, 0.045, "square", 0.012, 150);
    }
    explode(big = false) {
      this.noise(big ? 0.32 : 0.13, big ? 0.18 : 0.075, big ? 380 : 760);
      this.tone(big ? 92 : 145, big ? 0.32 : 0.12, "sine", big ? 0.09 : 0.04, -45);
    }
    hurt() {
      this.noise(0.16, 0.11, 420);
      this.tone(170, 0.2, "sawtooth", 0.055, -85);
    }
    laser() {
      this.tone(1280, 0.11, "sawtooth", 0.018, -620);
      this.tone(640, 0.1, "sine", 0.016, -180, 0.015);
    }
    rocket() {
      this.noise(0.075, 0.04, 1200);
      this.tone(150, 0.11, "sawtooth", 0.03, 170);
    }
    shieldBlock() {
      this.tone(720, 0.055, "triangle", 0.014, 260);
      this.noise(0.035, 0.012, 1800);
    }
    heal() {
      this.tone(620, 0.1, "sine", 0.023, 130);
      this.tone(930, 0.14, "sine", 0.018, 90, 0.06);
    }
    reward() {
      this.tone(523, 0.1, "sine", 0.025);
      this.tone(659, 0.12, "sine", 0.021, 0, 0.07);
      this.tone(784, 0.16, "sine", 0.018, 0, 0.14);
    }
    rare() {
      this.tone(880, 0.1, "sine", 0.02, 220);
      this.tone(1320, 0.16, "triangle", 0.016, 260, 0.08);
    }
    roar() {
      this.noise(0.7, 0.15, 260);
      this.tone(72, 0.68, "sawtooth", 0.085, 28);
      this.tone(118, 0.52, "square", 0.038, -42, 0.04);
      this.tone(196, 0.34, "sawtooth", 0.026, -95, 0.08);
    }
    escape() {
      this.tone(540, 0.16, "sine", 0.02, -240);
      this.tone(300, 0.2, "triangle", 0.016, -120, 0.1);
    }
    start() {
      this.tone(440, 0.09, "sine", 0.025);
      this.tone(660, 0.13, "sine", 0.02, 0, 0.08);
    }
  }
  const sound = new SoundEngine();

  /* ---------------- state ---------------- */
  let mode = MODE.INTRO;
  let modeBeforeReading = MODE.INTRO;
  let tutorialPage = 0;
  let tutorialTime = 0;
  let animationTime = 0;
  let dimensionDpr = 0;
  let walls = [];
  let enemies = [];
  let bullets = [];
  let particles = [];
  let floaters = [];
  let pickups = [];
  let player = null;
  let keys = new Set();
  let fireOrder = [];
  let aimAngle = -Math.PI / 2;
  let wave = 1;
  let spawnQueue = [];
  let spawnTimer = 0;
  let wavePhase = "idle";
  let waveKills = 0;
  let intermission = 0;
  let shake = 0;
  let hitFlash = 0;
  let dyingTimer = 0;
  let combo = 0;
  let comboTimer = 0;
  let toastTimeout = 0;
  let fitScale = 0.84;
  let zoomMode = "fit";
  let customZoom = 84;
  let lastFrame = performance.now();
  let modalPausedGame = false;
  let baseWords = 1286;
  let highRecord = { words: 0 };
  let lastHudWords = -1;
  let displayWords = baseWords;
  let bossesCleared = 0;
  let rewardChoices = [];
  let formatFragments = 0;
  let bonusRewardCharges = 0;
  let rareWillSpawn = false;
  let rareSpawnAt = 0;
  let waveSpawnTotal = 0;
  let waveSpawned = 0;
  let waveSmallTotal = 0;
  let waveSmallSpawned = 0;
  let rareSpawnedThisWave = false;
  let pendingArticleSwap = false;
  let currentArticleIndex = 0;
  let currentRewardSource = "boss";
  let currentBossKind = "sentence";
  let finalMilestoneWave = 0;
  let cheatInvincible = false;
  let finalIntroActive = false;
  let finalIntroTimer = 0;
  let finalVictoryDelay = 0;
  let finalBossFlash = 0;
  let cheatOpenOnStart = false;
  let lastBossKind = null;
  let baseArticleSnapshot = null;

  const stats = {
    words: baseWords,
    kills: 0,
    elapsed: 0,
  };

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const rand = (min, max) => min + Math.random() * (max - min);
  const choose = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist2 = (x1, y1, x2, y2) => {
    const dx = x2 - x1, dy = y2 - y1;
    return dx * dx + dy * dy;
  };
  const pointInRect = (x, y, r, pad = 0) =>
    x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;

  function fmtTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  /* ---------------- page text / initial data ---------------- */
  function countArticle() {
    if (!articleColumns) return { words: 1286, chars: 7014 };
    const text = articleColumns.textContent.replace(/\s+/g, " ").trim();
    const chars = (text.match(/[^\s]/g) || []).length;
    const words = (text.match(/[A-Za-z0-9]+(?:[’'-][A-Za-z0-9]+)*/g) || []).length;
    return { words: Math.max(600, words), chars: Math.max(3000, chars) };
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[ch]));
  }

  function rotateArray(items, offset) {
    if (!items.length) return [];
    const n = ((offset % items.length) + items.length) % items.length;
    return [...items.slice(n), ...items.slice(0, n)];
  }

  function captureArticleBase() {
    if (baseArticleSnapshot) return;
    const documentEl = document.querySelector(".document");
    const paragraphs = [...articleColumns.querySelectorAll("p")]
      .filter((p) => !p.classList.contains("keywords") && !p.classList.contains("ref") && !p.classList.contains("ack"))
      .map((p) => p.outerHTML);
    const refs = [...articleColumns.querySelectorAll("p.ref")].map((p) => p.outerHTML);
    baseArticleSnapshot = {
      title: documentEl.querySelector("h1").textContent,
      subtitle: documentEl.querySelector(".subtitle").textContent,
      byline: documentEl.querySelector(".byline").textContent,
      fileName: $("docTitle").textContent,
      columnsHTML: articleColumns.innerHTML,
      paragraphs,
      refs,
    };
  }

  function applyArticleVariant(index, options = {}) {
    if (!baseArticleSnapshot) return null;
    const variant = ARTICLE_VARIANTS[index];
    if (!variant) return null;
    const documentEl = document.querySelector(".document");
    const useBase = !!variant.base;
    const title = useBase ? baseArticleSnapshot.title : variant.title;
    const subtitle = useBase ? baseArticleSnapshot.subtitle : variant.subtitle;
    const byline = useBase ? baseArticleSnapshot.byline : variant.byline;
    const fileName = useBase ? baseArticleSnapshot.fileName : variant.fileName;

    documentEl.querySelector("h1").textContent = title;
    documentEl.querySelector(".subtitle").textContent = subtitle;
    documentEl.querySelector(".byline").textContent = byline;
    const docTitleEl = $("docTitle");
    if (docTitleEl) docTitleEl.textContent = fileName;
    document.title = `${fileName} - Word`;

    if (useBase) {
      articleColumns.innerHTML = baseArticleSnapshot.columnsHTML;
    } else {
      const rotated = rotateArray(baseArticleSnapshot.paragraphs, variant.offset || 0);
      const body = rotated.slice(0, 15);
      body[0] = `<p>${escapeHtml(variant.uniques[0])}</p>`;
      body.splice(7, 0, `<p>${escapeHtml(variant.uniques[1])}</p>`);
      body.splice(12, 0, `<blockquote>${escapeHtml(variant.quote)}</blockquote>`);
      const sectionSizes = [3, 4, 3, 3, 4];
      let cursor = 0;
      const sectionsHTML = variant.sections.map((heading, sectionIndex) => {
        const chunk = body.slice(cursor, cursor + sectionSizes[sectionIndex]);
        cursor += sectionSizes[sectionIndex];
        return `<h2>${escapeHtml(heading)}</h2>\n${chunk.join("\n")}`;
      }).join("\n");
      const refs = rotateArray(baseArticleSnapshot.refs, variant.offset || 0);
      const refsHTML = [...refs, `<p class="ref">${variant.extraRef}</p>`].join("\n");
      articleColumns.innerHTML = [
        `<div class="abstract"><strong>Abstract</strong>　${escapeHtml(variant.abstract)}</div>`,
        `<p class="keywords"><strong>Keywords</strong>　${escapeHtml(variant.keywords)}</p>`,
        sectionsHTML,
        "<h2>References</h2>",
        refsHTML,
        `<p class="ack">${escapeHtml(variant.ack)}</p>`,
      ].join("\n");
    }
    currentArticleIndex = index;
    if (!options.silent) {
      lastHudWords = -1;
    }
    return title;
  }

  function relocatePlayerAfterMap() {
    if (!player) return;
    if (!collidesWall(player.x, player.y, player.radius + 5)) {
      player.vx = 0;
      player.vy = 0;
      return;
    }
    const startX = player.x;
    const startY = player.y;
    for (let radius = 26; radius <= 210; radius += 16) {
      for (let step = 0; step < 12; step++) {
        const angle = (Math.PI * 2 * step) / 12;
        const x = clamp(startX + Math.cos(angle) * radius, ARENA.left + 26, ARENA.right - 26);
        const y = clamp(startY + Math.sin(angle) * radius, ARENA.top + 26, ARENA.bottom - 26);
        if (!collidesWall(x, y, player.radius + 5)) {
          player.x = x;
          player.y = y;
          player.vx = 0;
          player.vy = 0;
          player.bob = 0;
          return;
        }
      }
    }
    player.x = 558;
    player.y = 455;
    player.vx = 0;
    player.vy = 0;
    player.bob = 0;
  }

  function switchArticleMap() {
    if (!baseArticleSnapshot || ARTICLE_VARIANTS.length < 2) return null;
    let next = Math.floor(Math.random() * ARTICLE_VARIANTS.length);
    if (next === currentArticleIndex) {
      next = (next + 1 + Math.floor(Math.random() * (ARTICLE_VARIANTS.length - 1))) % ARTICLE_VARIANTS.length;
    }
    const title = applyArticleVariant(next);
    const wordBonus = Math.max(0, stats.words - baseWords);
    const counts = countArticle();
    baseWords = counts.words;
    stats.words = baseWords + wordBonus;
    displayWords = stats.words;
    lastHudWords = -1;
    makeWalls();
    relocatePlayerAfterMap();
    bullets = [];
    particles = [];
    floaters = [];
    pickups = [];
    if (player) {
      player.vx = 0;
      player.vy = 0;
      player.laserLife = 0;
      player.laserRays = [];
      player.invuln = Math.max(player.invuln, 0.9);
    }
    updateHud();
    return title;
  }

  function isFinalWave(n) {
    return n > 0 && n % FINAL_CLEAR_STEP === 0;
  }

  function enemyLevel() {
    return bossesCleared + 1;
  }

  // Enemy fire rate still tightens by 5% per level; health uses its own curve.
  function enemyRateScale() {
    return 1 + bossesCleared * 0.05;
  }

  function enemyHealthScale() {
    if (bossesCleared <= 0) return 1;
    const earlyLevels = Math.min(bossesCleared, 2);
    const lateLevels = Math.max(0, bossesCleared - 2);
    return Math.pow(1.10, earlyLevels) * Math.pow(1.20, lateLevels);
  }

  function enemyHpFor(key) {
    if (key === "final") return Math.max(1, enemyHpFor("ellipsis") * 10);
    const def = ENEMY_TYPES[key];
    const level = enemyLevel();
    // Normal enemies, rare enemies, elites and all three regular bosses share
    // the same growth model: Lv.1 base HP + one HP per level, then the global
    // level curve. Elite HP is multiplied by 1.2 after this calculation.
    return Math.max(1, Math.round((def.hp + Math.max(0, level - 1)) * enemyHealthScale()));
  }

  function enemyFireDelay(base) {
    return base / enemyRateScale();
  }

  function playerFireCooldown() {
    const attackRate = player.firingStyle === "rocket"
      ? 0.5
      : player.firingStyle === "laser" ? 1.5 : 1;
    return PLAYER_BASE_COOLDOWN / ((1 + player.fireRateBonus) * attackRate);
  }

  function playerDamageMultiplier() {
    return 1 + Math.max(0, (player?.damageLevel || 1) - 1) * 0.2;
  }

  function updateDamageMeter() {
    if (damageMeterEl) {
      const level = Math.max(1, Math.round(player?.damageLevel || 1));
      damageMeterEl.textContent = `修正力度：${"I".repeat(level)}`;
    }
    if (fireRateMeterEl) {
      const rate = Math.round((1 + (player?.fireRateBonus || 0)) * 100);
      fireRateMeterEl.textContent = `修订攻速：${rate}%`;
    }
  }

  function renderOwnedCardsRibbon() {
    if (!ownedCardStrip) return;
    const counts = player?.cardCounts || {};
    const owned = REWARD_POOL.filter((card) => (counts[card.id] || 0) > 0);
    if (!owned.length) {
      ownedCardStrip.innerHTML = '<span class="owned-empty">暂无</span>';
      return;
    }
    ownedCardStrip.innerHTML = owned.map((card) => {
      const count = counts[card.id] || 0;
      return `<span class="owned-chip ${card.rarity}" title="${card.name}${count > 1 ? ` ×${count}` : ""}"><b>${card.glyph}</b>${count > 1 ? `<em>×${count}</em>` : ""}</span>`;
    }).join("");
  }

  function stageHintText() {
    const stage = Math.floor((Math.max(1, wave) - 1) / 4) + 1;
    if (isFinalWave(wave)) return `第 ${stage} 关 · 终审`;
    const stageWave = ((Math.max(1, wave) - 1) % 4) + 1;
    return `第 ${stage} 关 · 第 ${stageWave} 波`;
  }

  function updatePageHint() {
    const hint = stageHintText();
    if (pageLevelTop) pageLevelTop.textContent = hint;
    if (pageLevelBottom) pageLevelBottom.textContent = hint;
  }

  function updateEnemyLevelHud(bump = false) {
    const level = enemyLevel();
    if (enemyLevelEl) enemyLevelEl.textContent = String(level);
    rewardEnemyLevel.textContent = `敌人 Lv. ${level}`;
    if (bump && enemyLevelChip) {
      enemyLevelChip.classList.remove("bump");
      void enemyLevelChip.offsetWidth;
      enemyLevelChip.classList.add("bump");
    }
  }

  function updateFragmentHud(pulse = false) {
    if (!fragmentStatus || !fragmentCountEl) return;
    fragmentCountEl.textContent = String(formatFragments);
    const pips = fragmentPips ? [...fragmentPips.children] : [];
    pips.forEach((pip, index) => pip.classList.toggle("filled", index < formatFragments));
    fragmentStatus.classList.toggle("has-fragments", formatFragments > 0);
    if (pulse) {
      fragmentStatus.classList.remove("bump");
      void fragmentStatus.offsetWidth;
      fragmentStatus.classList.add("bump");
    }
  }

  function loadHighRecord() {
    try {
      const raw = localStorage.getItem("word-tank-high-v3");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && Number.isFinite(parsed.words)) highRecord = parsed;
    } catch (_) { /* file:// may disallow storage */ }
  }

  function saveHighRecord() {
    try {
      localStorage.setItem("word-tank-high-v3", JSON.stringify(highRecord));
    } catch (_) { /* ignore */ }
  }

  /* ---------------- page fit / zoom ---------------- */
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.25);
    if (dpr !== dimensionDpr) {
      dimensionDpr = dpr;
      canvas.width = Math.round(PAGE_W * dpr);
      canvas.height = Math.round(PAGE_H * dpr);
    }
  }

  function ensureScale() {
    resizeCanvas();
    const availableW = Math.max(220, canvasArea.clientWidth - 54);
    const availableH = Math.max(180, canvasArea.clientHeight - 40);
    fitScale = Math.min(availableW / PAGE_W, availableH / PAGE_H, 1.08);
    fitScale = Math.max(0.26, fitScale);
    let scale = zoomMode === "fit" ? fitScale : customZoom / 100;
    scale = clamp(scale, 0.3, 1.32);
    document.documentElement.style.setProperty("--page-scale", scale.toFixed(4));
    document.documentElement.style.setProperty("--page-display-w", `${Math.round(PAGE_W * scale)}px`);
    document.documentElement.style.setProperty("--page-display-h", `${Math.round(PAGE_H * scale)}px`);
    // margin comments behave like screen UI in Word: they stay readable when zooming.
    document.documentElement.style.setProperty("--comment-scale", clamp(1 / scale, 0.92, 1.65).toFixed(4));
    const percent = Math.round(scale * 100);
    zoomValue.textContent = `${percent}%`;
    zoomSlider.value = String(clamp(percent, Number(zoomSlider.min), Number(zoomSlider.max)));
    if (zoomMode === "fit") customZoom = percent;
  }

  function setZoom(next, fromFit = false) {
    zoomMode = fromFit ? "fit" : "custom";
    customZoom = clamp(next, 30, 132);
    ensureScale();
  }

  /* ---------------- geometry ---------------- */
  function textLineBoxes() {
    if (!articleColumns) return [];
    const pageRect = page.getBoundingClientRect();
    const scale = pageRect.width / PAGE_W;
    if (!scale || !Number.isFinite(scale)) return [];
    const blocks = articleColumns.querySelectorAll("p:not(.keywords), .abstract, blockquote");
    const dedupe = new Set();
    const lines = [];
    for (const block of blocks) {
      const range = document.createRange();
      range.selectNodeContents(block);
      const rects = range.getClientRects();
      for (const rect of rects) {
        if (rect.width < 168 || rect.height < 7) continue;
        const x = (rect.left - pageRect.left) / scale;
        const y = (rect.top - pageRect.top) / scale;
        const w = rect.width / scale;
        const h = rect.height / scale;
        if (x < 46 || x > ARENA.right - 190) continue;
        if (y < ARENA.top + 8 || y + h > ARENA.bottom - 26) continue;
        const key = `${Math.round(x / 3)}:${Math.round(y / 3)}`;
        if (dedupe.has(key)) continue;
        dedupe.add(key);
        lines.push({ x, y, w, h, centerY: y + h / 2, column: x + w / 2 < PAGE_W / 2 ? 0 : 1 });
      }
    }
    return lines;
  }

  function wallCoversSpawn(wall) {
    return SPAWN_POINTS.some((point) => pointInRect(point.x, point.y, wall, 36));
  }

  function makeWalls() {
    const profile = WALL_PROFILES[currentArticleIndex] || WALL_PROFILES[0];
    const layout = FIXED_WALLS[currentArticleIndex] || FIXED_WALLS[0];
    const tint = { hue: profile.hue, sat: profile.sat, light: profile.light };
    walls = layout.map((rect, index) => {
      const h = clamp(rect.h, 16, 23);
      const w = clamp(rect.w, 20, ARENA.right - ARENA.left - 8);
      const x = clamp(rect.x, ARENA.left, ARENA.right - w - 2);
      const y = clamp(rect.y, ARENA.top + 2, ARENA.bottom - h - 2);
      return {
        x: +x.toFixed(1), y: +y.toFixed(1),
        w: +w.toFixed(1), h: +h.toFixed(1),
        id: index, flash: 0, ...tint,
      };
    });
  }

  function collidesWall(x, y, radius) {
    for (const w of walls) {
      const cx = clamp(x, w.x, w.x + w.w);
      const cy = clamp(y, w.y, w.y + w.h);
      if (dist2(x, y, cx, cy) <= radius * radius) return w;
    }
    return null;
  }

  function blockedAhead(x, y, angle, distance, radius) {
    return !!collidesWall(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, radius + 2);
  }

  function lineBlocked(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return false;
    const steps = Math.ceil(dist / 16);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = x1 + dx * t;
      const y = y1 + dy * t;
      for (const w of walls) {
        if (x > w.x - 1 && x < w.x + w.w + 1 && y > w.y - 1 && y < w.y + w.h + 1) return true;
      }
    }
    return false;
  }

  function moveWithWalls(entity, dx, dy, radius) {
    let collided = false;
    const wasInside =
      entity.x >= ARENA.left + radius && entity.x <= ARENA.right - radius &&
      entity.y >= ARENA.top + radius && entity.y <= ARENA.bottom - radius;
    if (dx) {
      const nx = entity.x + dx;
      if (!wasInside || !collidesWall(nx, entity.y, radius)) entity.x = nx;
      else collided = true;
    }
    if (dy) {
      const ny = entity.y + dy;
      if (!wasInside || !collidesWall(entity.x, ny, radius)) entity.y = ny;
      else collided = true;
    }
    if (wasInside) {
      entity.x = clamp(entity.x, ARENA.left + radius, ARENA.right - radius);
      entity.y = clamp(entity.y, ARENA.top + radius, ARENA.bottom - radius);
      if (entity.x <= ARENA.left + radius + 0.1 || entity.x >= ARENA.right - radius - 0.1) collided = true;
      if (entity.y <= ARENA.top + radius + 0.1 || entity.y >= ARENA.bottom - radius - 0.1) collided = true;
    }
    return collided;
  }

  /* ---------------- entities ---------------- */
  function makePlayer() {
    return {
      x: 558, y: 455, vx: 0, vy: 0, radius: 14, speed: PLAYER_BASE_SPEED,
      hp: 4, maxHp: 4, angle: -Math.PI / 2, invuln: 0,
      cooldown: 0, bob: 0, moving: false, ringFlash: 0,
      fireRateBonus: 0, moveBonus: 0, extraBullets: 0, damageLevel: 1,
      whiteCards: 0, blueCards: 0, redCards: 0, cardCounts: {},
      resurrectionStacks: 0, healPickupProgress: 0,
      gritStacks: 0, faithStacks: 0, daydreamStacks: 0, blueSeaStacks: 0,
      formatAbundance: false, rapidEditStacks: 0, moveShotTimer: 0, moveAngle: 0,
      backShieldWidth: 0, shieldFlash: 0,
      firingStyle: "default", spreadUnlocked: false, spreadPairs: 0,
      orbiters: 0, orbitPhase: 0,
      orbCooldowns: new Map(), aura: 0, auraTimer: 0,
      laserLife: 0, laserAngle: 0, laserLength: 0, laserRays: [],
    };
  }

  function makeEnemy(key, x, y, options = {}) {
    const def = ENEMY_TYPES[key];
    const hp = enemyHpFor(key);
    const initialAim = cardinalAim(player.x - x, player.y - y);
    const angle = options.angle ?? initialAim.angle;
    const eliteEligible = !def.boss && !def.gold && !options.idle && enemyLevel() > 1;
    const elite = options.elite === true || (options.elite !== false && eliteEligible && Math.random() < 0.2);
    const e = {
      key, ...def, x, y, hp, maxHp: hp, elite,
      turretAngle: angle, baseAngle: angle,
      spawnT: options.instant ? 0 : 0.7,
      flash: 0, charge: 0, chargeAngle: angle, chargeDir: initialAim,
      fireTimer: enemyFireDelay(def.bracket ? rand(0.55, 1.05) : def.boss ? rand(1.3, 2.4) : rand(0.9, 1.8)),
      strafeDir: Math.random() < 0.5 ? -1 : 1,
      strafeTimer: rand(1.3, 3.2),
      avoidT: 0, avoidDir: Math.random() < 0.5 ? -1 : 1,
      seed: rand(0, 10),
      patternIndex: 0,
      bossSeekTimer: rand(0.3, 0.7),
      bossOrbitDir: Math.random() < 0.5 ? -1 : 1,
      bossOrbitRadius: rand(150, 280),
      idle: !!options.idle,
      glyphWidth: 28,
    };
    if (elite) {
      e.hp *= 1.2;
      e.maxHp = e.hp;
    }
    if (def.bracket) {
      e.anchorX = def.side === "left"
        ? ARENA.left + def.radius + 12
        : ARENA.right - def.radius - 12;
    }
    if (def.bouncer) e.fireTimer = def.fireRate ? 1 / def.fireRate : 1;
    if (def.finalBoss) {
      e.finalTimer = rand(1.2, 1.8);
      e.finalAddTimer = 5;
      e.finalCharge = 0;
      e.finalChargeAngle = 0;
      e.finalInvulnerable = true;
      e.finalShieldFlash = 0;
      e.finalRoared = false;
      e.finalTextIndex = 0;
      e.finalTextTimer = 0;
      e.finalOrbitDir = Math.random() < 0.5 ? -1 : 1;
    }
    return e;
  }

  function placePlayerSafely() {
    player = makePlayer();
    renderOwnedCardsRibbon();
    if (!collidesWall(player.x, player.y, player.radius + 4)) return;
    for (let r = 30; r <= 150; r += 18) {
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8 + Math.PI / 8;
        const x = 558 + Math.cos(a) * r;
        const y = 455 + Math.sin(a) * r;
        if (x < ARENA.left + 30 || x > ARENA.right - 30 || y < ARENA.top + 30 || y > ARENA.bottom - 30) continue;
        if (!collidesWall(x, y, player.radius + 4)) {
          player.x = x;
          player.y = y;
          return;
        }
      }
    }
  }

  function seedIntroScene() {
    makeWalls();
    placePlayerSafely();
    bossesCleared = 0;
    updateEnemyLevelHud();
    player.angle = -Math.PI / 2;
    enemies = [
      makeEnemy("question", 336, 334, { instant: true, idle: true }),
      makeEnemy("comma", 772, 650, { instant: true, idle: true }),
    ];
    for (const e of enemies) {
      const aim = cardinalAim(player.x - e.x, player.y - e.y);
      e.turretAngle = aim.angle;
      e.baseAngle = aim.angle;
    }
    bullets = [];
    particles = [];
    floaters = [];
    pickups = [];
    wave = 1;
    waveNoEl.textContent = "1";
  }

  function resetGameWorld() {
    applyArticleVariant(0, { silent: true });
    const counts = countArticle();
    baseWords = counts.words;
    makeWalls();
    placePlayerSafely();
    enemies = [];
    bullets = [];
    particles = [];
    floaters = [];
    pickups = [];
    wave = 1;
    spawnQueue = [];
    spawnTimer = 0;
    wavePhase = "idle";
    waveKills = 0;
    intermission = 0;
    shake = 0;
    hitFlash = 0;
    dyingTimer = 0;
    combo = 0;
    comboTimer = 0;
    bossesCleared = 0;
    formatFragments = 0;
    bonusRewardCharges = 0;
    rareWillSpawn = false;
    rareSpawnAt = 0;
    pendingArticleSwap = false;
    currentRewardSource = "boss";
    currentBossKind = "sentence";
    lastBossKind = null;
    finalMilestoneWave = 0;
    finalIntroActive = false;
    finalIntroTimer = 0;
    finalVictoryDelay = 0;
    finalBossFlash = 0;
    finalClearModal.hidden = true;
    rewardChoices = [];
    hideStyleReward();
    clearInput();
    stats.words = baseWords;
    stats.kills = 0;
    stats.elapsed = 0;
    displayWords = baseWords;
    lastHudWords = -1;
    aimAngle = -Math.PI / 2;
    pageNoEl.textContent = "1";
    updateEnemyLevelHud();
    updateFragmentHud();
    updateHud();
  }

  function entryPathClear(point, radius) {
    const targetX = (ARENA.left + ARENA.right) / 2;
    const targetY = (ARENA.top + ARENA.bottom) / 2;
    const angle = Math.atan2(targetY - point.y, targetX - point.x);
    for (let distance = 0; distance <= 190; distance += 8) {
      const x = point.x + Math.cos(angle) * distance;
      const y = point.y + Math.sin(angle) * distance;
      if (collidesWall(x, y, radius + 2)) return false;
    }
    return true;
  }

  function spawnPointFor(enemyKey) {
    const def = ENEMY_TYPES[enemyKey];
    const r = def.radius + 5;
    const points = [...SPAWN_POINTS].sort(() => Math.random() - 0.5);
    for (const point of points) {
      if (dist2(point.x, point.y, player.x, player.y) < (r + 42) ** 2) continue;
      if (collidesWall(point.x, point.y, r + 2)) continue;
      if (!entryPathClear(point, r)) continue;
      const occupied = enemies.some((e) => dist2(point.x, point.y, e.x, e.y) < (r + e.radius + 12) ** 2);
      if (occupied) continue;
      return { x: point.x, y: point.y };
    }
    const fallback = points[Math.floor(Math.random() * points.length)];
    return { x: fallback.x, y: fallback.y };
  }

  function chooseBossKind() {
    const kinds = ["sentence", "brackets", "at"];
    const pool = lastBossKind ? kinds.filter((kind) => kind !== lastBossKind) : kinds;
    currentBossKind = choose(pool);
    lastBossKind = currentBossKind;
    return currentBossKind;
  }

  function bossDefeatedTitle(kind = currentBossKind) {
    if (kind === "brackets") return "方括号已拆解";
    if (kind === "at") return "邮件符已拆解";
    if (kind === "final") return "终审修订框已拆解";
    return "长句已拆解";
  }

  function pickBracketSpawn(side) {
    const points = SPAWN_POINTS.filter((p) =>
      side === "left" ? p.x < ARENA.left + 50 : p.x > ARENA.right - 50);
    points.sort((a, b) => Math.abs(a.y - player.y) - Math.abs(b.y - player.y));
    for (const point of points) {
      if (collidesWall(point.x, point.y, 29)) continue;
      if (!entryPathClear(point, 29)) continue;
      return point;
    }
    const fallbackX = side === "left" ? ARENA.left - 34 : ARENA.right + 34;
    for (const offset of [0, -36, 36, -72, 72, -108, 108]) {
      const y = clamp(player.y + offset, ARENA.top + 80, ARENA.bottom - 80);
      if (entryPathClear({ x: fallbackX, y }, 29)) return { x: fallbackX, y };
    }
    return {
      x: fallbackX,
      y: clamp(player.y, ARENA.top + 80, ARENA.bottom - 80),
    };
  }

  function spawnBracketPair() {
    const leftPos = pickBracketSpawn("left");
    const rightPos = pickBracketSpawn("right");
    const left = makeEnemy("bracket_l", leftPos.x, leftPos.y);
    const right = makeEnemy("bracket_r", rightPos.x, rightPos.y);
    enemies.push(left, right);
    currentBossKind = "brackets";
    shake = Math.max(shake, 10);
    sound.rare();
    showToast("方括号警告", "一对括号从页面左右两端出现，正在向中央传播错误。", "warn");
    return left;
  }

  function spawnAtBoss() {
    const pos = spawnPointFor("at");
    const e = makeEnemy("at", pos.x, pos.y);
    const toCenterX = (ARENA.left + ARENA.right) / 2 - pos.x;
    const toCenterY = (ARENA.top + ARENA.bottom) / 2 - pos.y;
    const sx = Math.sign(toCenterX) || (Math.random() < 0.5 ? -1 : 1);
    const sy = Math.sign(toCenterY) || (Math.random() < 0.5 ? -1 : 1);
    e.vx = sx * e.speed * 0.7071;
    e.vy = sy * e.speed * 0.7071;
    e.bounceCount = 0;
    e.bounceCooldown = 0;
    e.trailTimer = 0;
    enemies.push(e);
    currentBossKind = "at";
    shake = Math.max(shake, 9);
    sound.rare();
    showToast("邮件符警告", "一个 @ 正在页面上斜向弹跳，碰到荧光笔会 90° 转向。", "warn");
    return e;
  }

  function beginFinalBossIntro() {
    if (finalIntroActive || enemies.some((e) => e.finalBoss)) return;
    finalIntroActive = true;
    finalIntroTimer = 2.4;
    currentBossKind = "final";
    clearInput();
    shake = Math.max(shake, 7);
    sound.rare();
    showToast("终审修订框", "页面顶部传来密集的修订声，整篇文档开始震动。", "warn");
  }

  function updateFinalIntro(dt) {
    if (!finalIntroActive || mode !== MODE.PLAYING) return;
    finalIntroTimer -= dt;
    const progress = 1 - clamp(finalIntroTimer / 2.4, 0, 1);
    shake = Math.max(shake, 4 + progress * 11);
    if (finalIntroTimer <= 0) {
      finalIntroActive = false;
      spawnFinalBoss();
    }
  }

  function spawnFinalBoss() {
    const e = makeEnemy(
      "final",
      (ARENA.left + ARENA.right) / 2,
      ARENA.top - ENEMY_TYPES.final.radius - 8
    );
    e.spawnT = 0.9;
    enemies.push(e);
    currentBossKind = "final";
    shake = Math.max(shake, 10);
    sound.rare();
    showToast("终审修订框", "最终修订框从页面顶部缓缓压入文档。", "warn");
    return e;
  }

  function spawnEnemy(key) {
    if (key === "__bracket_pair") return spawnBracketPair();
    if (key === "__at_boss") return spawnAtBoss();
    if (key === "__final_boss") { beginFinalBossIntro(); return null; }
    const def = ENEMY_TYPES[key];
    const pos = spawnPointFor(key);
    const e = makeEnemy(key, pos.x, pos.y);
    if (def.bouncer) {
      const toCenterX = (ARENA.left + ARENA.right) / 2 - pos.x;
      const toCenterY = (ARENA.top + ARENA.bottom) / 2 - pos.y;
      e.vx = (Math.sign(toCenterX) || 1) * e.speed * 0.7071;
      e.vy = (Math.sign(toCenterY) || 1) * e.speed * 0.7071;
      e.bounceCooldown = 0;
      e.trailTimer = 0;
    }
    enemies.push(e);
    if (def.boss) {
      shake = Math.max(shake, 9);
      showToast(
        def.bouncer ? "邮件符警告" : def.bracket ? "方括号警告" : "长句警告",
        def.bouncer
          ? "一个 @ 正在页面上斜向弹跳。"
          : def.bracket
            ? "方括号从页面边缘压了过来。"
            : "一个绕不过去的长句进入了文档。",
        "warn"
      );
    }
    return e;
  }

  function spawnRareEnemy() {
    const pos = spawnPointFor("gold");
    const e = makeEnemy("gold", pos.x, pos.y);
    e.fleeTimer = 11.5;
    e.maxFlee = 11.5;
    enemies.push(e);
    sound.rare();
    showToast("发现金色格式符", "击破它会掉落一个永久格式碎片；约 12 秒后它会从文档中逃走。", "warn");
    return e;
  }

  function updateRareSpawn() {
    if (mode !== MODE.PLAYING || !rareWillSpawn || rareSpawnedThisWave) return;
    if (waveSmallSpawned < rareSpawnAt) return;
    if (enemies.some((e) => e.gold)) return;
    spawnRareEnemy();
    rareSpawnedThisWave = true;
  }

  function waveQueueFor(n) {
    if (isFinalWave(n)) {
      currentBossKind = "final";
      return ["__final_boss"];
    }
    const queue = [];
    const bossWave = n % 4 === 0;
    const isBoss = bossWave && n >= 4;
    let smallCount = Math.min(5 + n, 16);
    if (isBoss) smallCount = Math.min(4 + Math.floor(n * 0.8), 12);
    for (let i = 0; i < smallCount; i++) {
      const pool = [{ key: "comma", weight: Math.max(2, 6 - n * 0.25) }];
      if (n >= 1) pool.push({ key: "question", weight: 2 + n * 0.18 });
      if (n >= 2) pool.push({ key: "semicolon", weight: 0.7 + n * 0.16 });
      if (n >= 3) pool.push({ key: "exclamation", weight: 0.55 + n * 0.13 });
      let total = pool.reduce((a, p) => a + p.weight, 0);
      let pick = Math.random() * total;
      let chosen = pool[0].key;
      for (const p of pool) {
        pick -= p.weight;
        if (pick <= 0) { chosen = p.key; break; }
      }
      queue.push(chosen);
    }
    if (isBoss) {
      const bossKey = currentBossKind === "brackets"
        ? "__bracket_pair"
        : currentBossKind === "at" ? "__at_boss" : "ellipsis";
      // Normal bosses enter only after at least half of the small enemies
      // have already appeared.
      queue.splice(Math.ceil(smallCount / 2), 0, bossKey);
    }
    // avoid too many identical units in a row, for visual variety
    for (let i = 2; i < queue.length - 1; i++) {
      if (queue[i] === queue[i - 1] && queue[i] === queue[i - 2] && queue[i] !== "ellipsis") {
        const alt = queue[i] === "comma" ? "question" : "comma";
        queue[i] = alt;
      }
    }
    return queue;
  }

  function maxActiveEnemies() {
    return Math.min(3 + Math.floor(wave / 2), 7);
  }

  function startWave(n) {
    wave = n;
    waveNoEl.textContent = String(n);
    if (isFinalWave(n)) currentBossKind = "final";
    else if (n >= 4 && n % 4 === 0) chooseBossKind();
    spawnQueue = waveQueueFor(n);
    waveSpawnTotal = spawnQueue.length;
    waveSpawned = 0;
    const bossKeys = new Set(["ellipsis", "__bracket_pair", "__at_boss", "__final_boss"]);
    waveSmallTotal = spawnQueue.filter((key) => !bossKeys.has(key)).length;
    waveSmallSpawned = 0;
    rareSpawnedThisWave = false;
    rareWillSpawn = n > 1 && (n === 2 || Math.random() < 0.33);
    rareSpawnAt = rareWillSpawn && waveSmallTotal > 0
      ? Math.floor(Math.random() * (Math.floor(waveSmallTotal / 2) + 1))
      : 0;
    wavePhase = "spawning";
    spawnTimer = 0.42;
    waveKills = 0;
    intermission = 0;
    if (n > 1) showWaveStamp(`第 ${n} 轮修订`);
    updateHud();
  }

  function completeWave() {
    if (mode !== MODE.PLAYING || wavePhase === "intermission") return;
    wavePhase = "intermission";
    intermission = 2.35;
    const bossRound = wave % 4 === 0;
    const finalRound = isFinalWave(wave);
    bullets = bullets.filter((b) => b.fromPlayer);
    for (const b of bullets) b.life = Math.min(b.life, 0.5);
    player.invuln = Math.max(player.invuln, 0.65);
    player.orbCooldowns.clear();
    if (bossRound) {
      bossesCleared += 1;
      updateEnemyLevelHud(true);
      if (finalRound) {
        pendingArticleSwap = false;
        intermission = 0;
        showFinalClear();
        updateHud();
        return;
      }
      pendingArticleSwap = true;
      intermission = 1.25;
      showToast(
        bossDefeatedTitle(),
        "格式奖励已送达。请从上方“格式”窗口选择一项，敌人等级 +1。",
        ""
      );
      openStyleReward("boss");
    } else {
      showToast(
        "本轮修订完成",
        `已经处理 ${waveKills} 处标点。第 ${wave + 1} 轮即将开始。`,
        ""
      );
    }
    updateHud();
  }

  /* ---------------- post-boss style rewards ---------------- */
  function rewardEligible(reward) {
    if (reward.kind === "rewardOption") return !player.formatAbundance;
    if (reward.kind === "moveSpeed") return player.moveBonus < 0.9999;
    if (reward.kind === "shieldSet") return player.backShieldWidth < reward.value;
    if (reward.kind === "shieldAdd") return true;
    if (reward.kind === "spread") return true;
    if (reward.kind === "style" && reward.value === "laser") return player.firingStyle !== "laser";
    if (reward.kind === "style" && reward.value === "rocket") return player.firingStyle !== "rocket";
    if (reward.kind === "style" && reward.value === "trifurcate") return player.firingStyle !== "trifurcate";
    if (reward.kind === "extraBullet") return true;
    if (reward.kind === "rapidEdit") return player.rapidEditStacks <= 0;
    if (reward.kind === "orbiter") return player.orbiters < 16;
    if (reward.kind === "aura") return player.aura <= 0;
    if (reward.kind === "healReward") return player.resurrectionStacks <= 0;
    if (reward.kind === "killFireRate") return player.gritStacks <= 0;
    if (reward.kind === "bossSpread") return player.faithStacks <= 0;
    if (reward.kind === "whiteDamage") return player.daydreamStacks <= 0;
    if (reward.kind === "blueFireRate") return player.blueSeaStacks <= 0;
    return true;
  }

  function rewardCardWeight(reward) {
    if (reward.kind !== "style") return 1;
    return player.firingStyle === "default" ? 2 : 0.25;
  }

  function pickWeightedReward(pool) {
    if (!pool.length) return null;
    const groups = {};
    for (const key of Object.keys(RARITIES)) groups[key] = [];
    for (const reward of pool) groups[reward.rarity].push(reward);
    const available = Object.keys(RARITIES).filter((key) => groups[key].length);
    if (!available.length) return null;
    const total = available.reduce((sum, key) => sum + RARITIES[key].weight, 0);
    let roll = Math.random() * total;
    let rarity = available[available.length - 1];
    for (const key of available) {
      roll -= RARITIES[key].weight;
      if (roll <= 0) { rarity = key; break; }
    }
    const cards = groups[rarity];
    const cardTotal = cards.reduce((sum, reward) => sum + rewardCardWeight(reward), 0);
    let cardRoll = Math.random() * cardTotal;
    let chosen = cards[cards.length - 1];
    for (const reward of cards) {
      cardRoll -= rewardCardWeight(reward);
      if (cardRoll <= 0) { chosen = reward; break; }
    }
    return chosen;
  }

  function shuffleInPlace(items) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  function sampleRewardChoices(count = 3, options = {}) {
    const chosen = [];
    const usedIds = new Set();
    const sourcePool = options.allRed
      ? REWARD_POOL.filter((reward) => reward.rarity === "red")
      : REWARD_POOL;
    const available = () => sourcePool.filter((reward) => !usedIds.has(reward.id) && rewardEligible(reward));

    // Draw at the requested 55/30/15 rarity weights first. This keeps the
    // ordinary rarity odds close to 30% blue and 15% red.
    while (chosen.length < count) {
      const reward = pickWeightedReward(available());
      if (!reward) break;
      chosen.push(reward);
      usedIds.add(reward.id);
    }
    // If a restrictive upper bound removed too many cards, fill from the
    // remaining always-valid styles rather than offering an empty slot.
    while (chosen.length < count) {
      const filler = available()[0];
      if (!filler) break;
      chosen.push(filler);
      usedIds.add(filler.id);
    }

    // The ordinary guarantee: no roll may consist only of white/red cards.
    if (!options.allRed && chosen.length && !chosen.some((reward) => reward.rarity === "blue")) {
      const bluePool = REWARD_POOL.filter((reward) =>
        reward.rarity === "blue" && rewardEligible(reward) && !chosen.some((picked) => picked.id === reward.id));
      if (bluePool.length) {
        let replaceIndex = chosen.findIndex((reward) => reward.rarity === "white");
        if (replaceIndex < 0) replaceIndex = chosen.findIndex((reward) => reward.rarity === "red");
        if (replaceIndex < 0) replaceIndex = 0;
        chosen[replaceIndex] = choose(bluePool);
      }
    }
    return shuffleInPlace(chosen).slice(0, count);
  }

  function renderStyleRewardChoices() {
    styleRewardGrid.replaceChildren();
    rewardChoices.forEach((reward, index) => {
      const rarity = RARITIES[reward.rarity];
      const card = document.createElement("button");
      card.type = "button";
      card.className = `format-style-option rarity-${reward.rarity}`;
      card.dataset.rewardIndex = String(index);
      card.setAttribute("aria-label", `${rarity.label}${rarity.tier}：${reward.name}。${reward.desc}`);

      const preview = document.createElement("span");
      preview.className = "format-style-preview";
      const glyph = document.createElement("b");
      glyph.textContent = reward.glyph;
      const lines = document.createElement("span");
      lines.className = "format-style-lines";
      lines.append(document.createElement("i"), document.createElement("i"), document.createElement("i"));
      preview.append(glyph, lines);

      const copy = document.createElement("span");
      copy.className = "format-style-copy";
      const line = document.createElement("span");
      line.className = "format-style-line";
      const name = document.createElement("span");
      name.className = "format-style-name";
      name.textContent = reward.name;
      const rarityTag = document.createElement("span");
      rarityTag.className = "format-style-rarity";
      rarityTag.textContent = `${rarity.label} · ${rarity.tier}`;
      line.append(name, rarityTag);
      const desc = document.createElement("span");
      desc.className = "format-style-desc";
      desc.textContent = reward.desc;
      copy.append(line, desc);

      const shortcut = document.createElement("span");
      shortcut.className = "format-style-key";
      const key = document.createElement("kbd");
      key.textContent = String(index + 1);
      shortcut.append(key, document.createElement("em"));
      shortcut.querySelector("em").textContent = "应用";

      card.append(preview, copy, shortcut);
      styleRewardGrid.append(card);
    });
  }

  function positionStyleReward() {
    if (styleRewardWindow.hidden) return;
    const area = workspace.getBoundingClientRect();
    let anchorX = area.left + area.width / 2;
    if (stylesRibbonGroup) {
      const styleRect = stylesRibbonGroup.getBoundingClientRect();
      if (styleRect.width > 0 && getComputedStyle(stylesRibbonGroup).display !== "none") {
        anchorX = styleRect.left + styleRect.width / 2;
      }
    }
    const width = styleRewardWindow.offsetWidth || 430;
    const left = clamp(anchorX - area.left - width / 2, 10, Math.max(10, area.width - width - 10));
    styleRewardWindow.style.left = `${left}px`;
    styleRewardWindow.style.top = "8px";
  }

  function rewardOptionCount() {
    return player && player.formatAbundance ? 4 : 3;
  }

  function openStyleReward(source = "boss") {
    if (mode === MODE.REWARD) return;
    currentRewardSource = source;
    mode = MODE.REWARD;
    page.classList.remove("playing");
    pausePill.classList.remove("show");
    clearInput();
    // Freeze the page completely: no residual screen shake, wall flashes or
    // hit vignette behind the floating format window.
    shake = 0;
    hitFlash = 0;
    for (const w of walls) w.flash = 0;
    const allRed = source === "final-boss";
    const choiceCount = rewardOptionCount();
    rewardChoices = sampleRewardChoices(choiceCount, { allRed });
    renderStyleRewardChoices();
    updateEnemyLevelHud();
    styleRewardKicker.textContent = source === "fragments"
      ? "格式碎片已集齐"
      : allRed ? `终审完成 · ${choiceCount} 项红色格式` : bossDefeatedTitle();
    styleRewardWindow.classList.toggle("from-fragments", source === "fragments");
    styleRewardWindow.hidden = false;
    positionStyleReward();
    requestAnimationFrame(() => styleRewardWindow.classList.add("show"));
    stylesRibbonGroup?.classList.add("reward-active");
  }

  function hideStyleReward() {
    styleRewardWindow.classList.remove("show", "from-fragments");
    styleRewardWindow.hidden = true;
    stylesRibbonGroup?.classList.remove("reward-active");
    rewardChoices = [];
  }

  function applyStyleReward(reward) {
    if (!player || !reward) return;
    switch (reward.kind) {
      case "fireRate":
        player.fireRateBonus += reward.value;
        break;
      case "damageAdd":
        player.damageLevel += reward.value;
        break;
      case "moveSpeed":
        player.moveBonus = Math.min(1, player.moveBonus + reward.value);
        player.speed = PLAYER_BASE_SPEED * (1 + player.moveBonus);
        break;
      case "shieldAdd":
        player.backShieldWidth += reward.value;
        player.shieldFlash = 0.35;
        break;
      case "shieldSet":
        player.backShieldWidth = Math.max(player.backShieldWidth, reward.value);
        player.shieldFlash = 0.35;
        break;
      case "extraBullet":
        player.extraBullets += reward.value;
        break;
      case "spread":
        if (!player.spreadUnlocked) {
          player.spreadUnlocked = true;
          player.spreadPairs = 0;
        } else {
          player.spreadPairs += 1;
        }
        break;
      case "rewardOption":
        player.formatAbundance = true;
        break;
      case "rapidEdit":
        player.rapidEditStacks += reward.value;
        break;
      case "style":
        player.firingStyle = reward.value;
        player.laserLife = 0;
        player.laserRays = [];
        break;
      case "orbiter":
        player.orbiters = Math.min(16, player.orbiters + reward.value);
        break;
      case "aura":
        player.aura = Math.max(player.aura, reward.value);
        player.auraTimer = 0;
        break;
      case "healReward":
        if (player.resurrectionStacks <= 0) player.healPickupProgress = 0;
        player.resurrectionStacks += reward.value;
        break;
      case "killFireRate":
        player.gritStacks += reward.value;
        break;
      case "bossSpread":
        player.faithStacks += reward.value;
        break;
      case "whiteDamage":
        player.daydreamStacks += reward.value;
        player.damageLevel += player.whiteCards * reward.value;
        break;
      case "blueFireRate":
        player.blueSeaStacks += reward.value;
        player.fireRateBonus += player.blueCards * 0.2 * reward.value;
        break;
      default:
        break;
    }

    // Track acquired cards by rarity, then let already-owned passive cards
    // settle for this new acquisition. The new passive itself has already
    // settled against the cards that existed before it was picked.
    if (reward.rarity === "white") {
      player.whiteCards += 1;
      if (player.daydreamStacks > 0) player.damageLevel += player.daydreamStacks;
    } else if (reward.rarity === "blue") {
      player.blueCards += 1;
      if (player.blueSeaStacks > 0) player.fireRateBonus += player.blueSeaStacks * 0.2;
    } else if (reward.rarity === "red") {
      player.redCards += 1;
    }
    player.cardCounts[reward.id] = (player.cardCounts[reward.id] || 0) + 1;
    renderOwnedCardsRibbon();

    updateDamageMeter();
    if (!cheatPanel.hidden) syncCheatPanel();
  }

  function grantRewardCardById(id, options = {}) {
    const reward = REWARD_POOL.find((card) => card.id === id);
    if (!reward || !player) return null;
    applyStyleReward(reward);
    updateHud();
    if (!options.silent) {
      showToast(options.title || "额外格式", `获得一张「${reward.name}」奖励卡。`, "");
    }
    return reward;
  }

  function handleHealPickup() {
    if (!player || player.resurrectionStacks <= 0) return;
    player.healPickupProgress += 1;
    if (player.healPickupProgress < 4) return;
    player.healPickupProgress -= 4;
    for (let i = 0; i < player.resurrectionStacks; i++) {
      grantRewardCardById("damage_w", { title: "死而后生" });
    }
  }

  function handleDefeatedEnemy(e) {
    if (!player || !e) return;
    if (player.gritStacks > 0) {
      player.fireRateBonus += 0.01 * player.gritStacks;
      updateDamageMeter();
    }
    if (e.boss && player.faithStacks > 0) {
      for (let i = 0; i < player.faithStacks; i++) {
        grantRewardCardById("spread_b", { silent: true });
      }
      floaters.push({
        x: e.x, y: e.y - e.radius - 18, text: "+注意分散",
        life: 1.15, maxLife: 1.15, color: "#2b62bb", size: 10,
      });
    }
  }

  function chooseStyleReward(index) {
    if (mode !== MODE.REWARD) return;
    const reward = rewardChoices[index];
    if (!reward) return;
    applyStyleReward(reward);
    const rarity = RARITIES[reward.rarity];
    hideStyleReward();
    const swappedTitle = pendingArticleSwap ? switchArticleMap() : null;
    pendingArticleSwap = false;
    mode = MODE.PLAYING;
    page.classList.add("playing");
    intermission = Math.min(intermission, 1.2);
    updateHud();
    if (swappedTitle) {
      showToast("格式已应用 · 稿件已切换", `${rarity.label} · ${reward.name}；下一张地图《${swappedTitle}》已载入。`, "");
    } else {
      showToast("格式已应用", `${rarity.label} · ${reward.name}，已写入当前文档。`, "");
    }
    sound.reward();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  /* ---------------- input ---------------- */
  const MOVE_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD"]);

  function onKeyDown(event) {
    const code = event.code;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.repeat) return;
    if (code === "F2") {
      event.preventDefault();
      toggleCheatPanel();
      return;
    }

    if (code === "Enter" && mode === MODE.INTRO) {
      event.preventDefault();
      const active = document.activeElement;
      if (active && active.tagName === "BUTTON" && introComment.contains(active)) {
        active.click();
      } else if (tutorialPage < TUTORIAL_PAGES.length - 1) {
        setTutorialPage(tutorialPage + 1);
      } else {
        startGame();
      }
      return;
    }
    if (code === "Escape") {
      if (!gameOverModal.hidden) { closeGameOver("read"); return; }
      if (!wordCountModal.hidden) { closeWordCount(); return; }
      if (mode === MODE.READING) { toggleReading(); return; }
      if (mode === MODE.PLAYING || mode === MODE.PAUSED) {
        event.preventDefault();
        togglePause();
        return;
      }
    }
    if (!finalClearModal.hidden) return;
    if (code === "KeyB") {
      event.preventDefault();
      toggleReading();
      return;
    }
    if (!gameOverModal.hidden) {
      if (code === "KeyR" || code === "Enter") { event.preventDefault(); restartGame(); }
      return;
    }
    if (!wordCountModal.hidden) return;
    if (!finalClearModal.hidden) return;
    if (code === "KeyP") {
      if (mode === MODE.PLAYING || mode === MODE.PAUSED) {
        event.preventDefault();
        togglePause();
      }
      return;
    }
    if (code === "KeyM") {
      event.preventDefault();
      toggleMute();
      return;
    }
    if (mode === MODE.REWARD) {
      const rewardKeys = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 };
      if (rewardKeys[code] !== undefined) {
        event.preventDefault();
        chooseStyleReward(rewardKeys[code]);
      }
      return;
    }
    if (mode === MODE.READING) return;
    if (mode !== MODE.PLAYING) return;

    if (MOVE_KEYS.has(code) || FIRE_DIRS[code]) {
      event.preventDefault();
      if (!keys.has(code)) {
        keys.add(code);
        if (FIRE_DIRS[code]) {
          fireOrder.push(code);
          player.aimAngle = FIRE_DIRS[code].angle;
          aimAngle = FIRE_DIRS[code].angle;
          if (player.cooldown <= 0) firePlayer();
        }
      }
    }
  }

  function onKeyUp(event) {
    keys.delete(event.code);
    fireOrder = fireOrder.filter((code) => code !== event.code);
  }

  function clearInput() {
    keys.clear();
    fireOrder = [];
  }

  function togglePause() {
    if (mode === MODE.PLAYING) {
      mode = MODE.PAUSED;
      page.classList.remove("playing");
      pausePill.classList.add("show");
      clearInput();
    } else if (mode === MODE.PAUSED) {
      mode = MODE.PLAYING;
      page.classList.add("playing");
      pausePill.classList.remove("show");
    }
  }

  function toggleReading() {
    if (!finalClearModal.hidden) return;
    if (mode === MODE.READING) {
      leaveReading();
      return;
    }
    if (mode === MODE.DYING) return;
    if (!wordCountModal.hidden) closeWordCount();
    if (!gameOverModal.hidden) gameOverModal.hidden = true;
    modeBeforeReading = mode;
    mode = MODE.READING;
    document.body.classList.add("reading");
    page.classList.remove("playing");
    pausePill.classList.remove("show");
    clearInput();
    proofingStatus.classList.remove("bad");
    proofingText.textContent = "校对：无问题";
    const editingBadge = document.querySelector(".editing-badge");
    if (editingBadge) editingBadge.textContent = "只读";
    updateHud();
    requestAnimationFrame(ensureScale);
  }

  function leaveReading() {
    if (mode !== MODE.READING) return;
    document.body.classList.remove("reading");
    mode = modeBeforeReading;
    const editingBadge = document.querySelector(".editing-badge");
    if (editingBadge) editingBadge.textContent = "编辑";
    if (mode === MODE.PLAYING) {
      page.classList.add("playing");
    } else if (mode === MODE.PAUSED) {
      pausePill.classList.add("show");
    } else if (mode === MODE.GAMEOVER) {
      openGameOverModal();
    } else if (mode === MODE.REWARD) {
      requestAnimationFrame(positionStyleReward);
    }
    updateHud();
    requestAnimationFrame(ensureScale);
  }

  /* ---------------- shooting ---------------- */
  function spawnBullet(x, y, angle, speed, fromPlayer, options = {}) {
    bullets.push({
      x, y, prevX: x, prevY: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: options.radius ?? (fromPlayer ? 2.7 : 3.4),
      fromPlayer, damage: options.damage ?? 1,
      life: options.life ?? 2.7,
      color: options.color ?? (fromPlayer ? BLUE : RED),
      boss: !!options.boss,
      rocket: !!options.rocket,
      trifurcate: !!options.trifurcate,
      rapidEdit: !!options.rapidEdit,
    });
  }

  function playerMuzzle(angle, perpendicularOffset = 0) {
    const mx = player.x + Math.cos(angle) * 23 - Math.sin(angle) * perpendicularOffset;
    const my = player.y + Math.sin(angle) * 23 + Math.cos(angle) * perpendicularOffset;
    return { x: mx, y: my };
  }

  function playerShotOffsets() {
    if (!player || !player.spreadUnlocked) return [0];
    const step = Math.PI / 6;
    const offsets = [-step, 0, step];
    for (let pair = 1; pair <= player.spreadPairs; pair++) {
      const outer = step * (1 + pair);
      offsets.push(-outer, outer);
    }
    return offsets;
  }

  function laserRayGeometry(angle, perpendicularOffset = 0) {
    const origin = playerMuzzle(angle, perpendicularOffset);
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let length = 0;
    for (let s = 0; s <= 760; s += 3) {
      const x = origin.x + dx * s;
      const y = origin.y + dy * s;
      if (x < ARENA.left || x > ARENA.right || y < ARENA.top || y > ARENA.bottom) break;
      if (walls.some((w) => pointInRect(x, y, w, 2))) break;
      length = s;
    }
    return { angle, x0: origin.x, y0: origin.y, dx, dy, length, offset: perpendicularOffset };
  }

  function buildLaserRays() {
    const rays = [];
    const raysPerLane = 1 + player.extraBullets;
    for (const laneOffset of playerShotOffsets()) {
      const angle = aimAngle + laneOffset;
      for (let i = 0; i < raysPerLane; i++) {
        const offset = raysPerLane === 1 ? 0 : (i - (raysPerLane - 1) / 2) * 9;
        const ray = laserRayGeometry(angle, offset);
        rays.push({ ...ray, life: 0.13 });
      }
    }
    return rays;
  }

  function fireLaser() {
    const hitRadiusBonus = 7;
    const laserDamage = 1;
    player.laserRays = buildLaserRays();
    for (const ray of player.laserRays) {
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (!e || e.spawnT > 0) continue;
        const t = (e.x - ray.x0) * ray.dx + (e.y - ray.y0) * ray.dy;
        if (t < 8 || t > ray.length) continue;
        const px = ray.x0 + ray.dx * t;
        const py = ray.y0 + ray.dy * t;
        if (dist2(e.x, e.y, px, py) <= (e.radius + hitRadiusBonus) ** 2) {
          damageEnemy(e, laserDamage, px, py);
        }
      }
    }
    const primary = player.laserRays[0];
    player.laserLife = 0.13;
    player.laserAngle = primary ? primary.angle : aimAngle;
    player.laserLength = primary ? primary.length : 18;
    const muzzle = playerMuzzle(aimAngle);
    for (let i = 0; i < 6; i++) {
      particles.push({
        type: "spark", x: muzzle.x, y: muzzle.y,
        vx: Math.cos(aimAngle) * rand(20, 80) + rand(-24, 24),
        vy: Math.sin(aimAngle) * rand(20, 80) + rand(-24, 24),
        life: rand(.08, .2), maxLife: .2, size: rand(1, 2.2),
        color: i % 3 === 0 ? "rgba(255,255,255,.9)" : "rgba(53,115,222,.8)",
      });
    }
    shake = Math.max(shake, 2.6);
    sound.laser();
  }

  function fireRocketVolley() {
    const angles = playerShotOffsets().map((offset) => aimAngle + offset);
    const bulletsPerRay = 1 + player.extraBullets;
    for (const angle of angles) {
      for (let i = 0; i < bulletsPerRay; i++) {
        const offset = bulletsPerRay === 1 ? 0 : (i - (bulletsPerRay - 1) / 2) * 9;
        const muzzle = playerMuzzle(angle, offset);
        spawnBullet(muzzle.x, muzzle.y, angle, 335, true, {
          rocket: true, radius: 5.4, damage: 3, life: 3.1, color: "#1b3f6b",
        });
      }
    }
    const flash = playerMuzzle(aimAngle);
    for (let i = 0; i < 6; i++) {
      particles.push({
        type: "spark", x: flash.x, y: flash.y,
        vx: Math.cos(aimAngle) * rand(35, 120) + rand(-24, 24),
        vy: Math.sin(aimAngle) * rand(35, 120) + rand(-24, 24),
        life: rand(0.09, 0.24), maxLife: 0.24,
        size: rand(1, 2.4), color: i % 2 ? "rgba(214,119,48,.9)" : "rgba(255,235,196,.9)",
      });
    }
    shake = Math.max(shake, 4.2);
    sound.rocket();
  }

  function fireTrifurcateVolley() {
    const lanes = playerShotOffsets();
    const bulletsPerRay = 1 + player.extraBullets;
    const subSpread = Math.PI / 18;
    for (const lane of lanes) {
      for (let i = 0; i < bulletsPerRay; i++) {
        const parallel = bulletsPerRay === 1 ? 0 : (i - (bulletsPerRay - 1) / 2) * 6.2;
        for (const sub of [-subSpread, 0, subSpread]) {
          const angle = aimAngle + lane + sub;
          const muzzle = playerMuzzle(angle, parallel);
          spawnBullet(muzzle.x, muzzle.y, angle, 610, true, {
            damage: 0.8, radius: 2.5, color: "#6a4cb2", trifurcate: true,
          });
        }
      }
    }
    const flash = playerMuzzle(aimAngle);
    for (let i = 0; i < 5; i++) {
      particles.push({
        type: "spark", x: flash.x, y: flash.y,
        vx: Math.cos(aimAngle) * rand(30, 105) + rand(-20, 20),
        vy: Math.sin(aimAngle) * rand(30, 105) + rand(-20, 20),
        life: rand(0.08, 0.2), maxLife: 0.2,
        size: rand(1, 2.1), color: "rgba(106,76,178,.85)",
      });
    }
    shake = Math.max(shake, 2.1);
    sound.shoot();
  }

  function explodeRocket(x, y, directEnemy = null) {
    const radius = 72;
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (!e || e === directEnemy || e.spawnT > 0) continue;
      if (dist2(x, y, e.x, e.y) <= (radius + e.radius) ** 2) {
        damageEnemy(e, 2, e.x, e.y);
      }
    }
    for (let i = 0; i < 12; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(45, 180);
      particles.push({
        type: i % 3 === 0 ? "glyph" : "spark",
        char: "=",
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: rand(-1, 1), vr: rand(-5, 5),
        life: rand(0.18, 0.5), maxLife: 0.5,
        size: rand(5, 11), color: i % 2 ? "rgba(216,119,45,.9)" : "rgba(255,220,158,.9)",
      });
    }
    particles.push({
      type: "ring", x, y, vx: 0, vy: 0,
      life: 0.28, maxLife: 0.28,
      size: 6, targetSize: radius,
      color: "rgba(213,115,43,.42)",
    });
    shake = Math.max(shake, 5.5);
    sound.explode(false);
  }

  function rapidEditBulletDamage() {
    const ratio = clamp(player.speed / PLAYER_BASE_SPEED, 1, 2);
    return 0.25 + (ratio - 1) * 1.75;
  }

  function fireRapidEdit() {
    const stacks = Math.max(1, player.rapidEditStacks);
    const columns = stacks * 2;
    const damage = rapidEditBulletDamage();
    for (let i = 0; i < columns; i++) {
      const offset = (i - (columns - 1) / 2) * PLAYER_BASE_WIDTH;
      const muzzle = playerMuzzle(player.moveAngle, offset);
      spawnBullet(muzzle.x, muzzle.y, player.moveAngle, 610, true, {
        damage, radius: 1.5, color: "#4a2a1b", rapidEdit: true,
      });
    }
  }

  function firePlayer() {
    if (!player || player.cooldown > 0) return;
    player.cooldown = playerFireCooldown();
    if (player.firingStyle === "laser") {
      fireLaser();
      return;
    }
    if (player.firingStyle === "rocket") {
      fireRocketVolley();
      return;
    }
    if (player.firingStyle === "trifurcate") {
      fireTrifurcateVolley();
      return;
    }
    const baseAngles = playerShotOffsets().map((offset) => aimAngle + offset);
    const bulletsPerRay = 1 + player.extraBullets;
    for (const angle of baseAngles) {
      for (let i = 0; i < bulletsPerRay; i++) {
        const offset = bulletsPerRay === 1 ? 0 : (i - (bulletsPerRay - 1) / 2) * 6.2;
        const muzzle = playerMuzzle(angle, offset);
        spawnBullet(muzzle.x, muzzle.y, angle, 610, true);
      }
    }
    shake = Math.max(shake, 1.8);
    const flash = playerMuzzle(aimAngle);
    for (let i = 0; i < 3; i++) {
      particles.push({
        type: "spark", x: flash.x, y: flash.y,
        vx: Math.cos(aimAngle) * rand(35, 125) + rand(-18, 18),
        vy: Math.sin(aimAngle) * rand(35, 125) + rand(-18, 18),
        life: rand(0.08, 0.18), maxLife: 0.18,
        size: rand(1, 2), color: "rgba(42,91,175,.8)",
      });
    }
    sound.shoot();
  }

  function damagePlayer(amount = 1) {
    if (!player || cheatInvincible || player.invuln > 0 || mode !== MODE.PLAYING) return;
    player.hp -= amount;
    player.invuln = 1.35;
    player.ringFlash = 0.55;
    shake = 13;
    hitFlash = 1;
    sound.hurt();
    updateHud();
    if (player.hp <= 0) {
      startDying();
    } else if (player.hp <= 2) {
      showToast("校对权限不足", `只够再改 ${player.hp} 处了。按 B 可以先装作在读稿。`, "danger");
    }
  }

  function startDying() {
    mode = MODE.DYING;
    dyingTimer = 1.15;
    clearInput();
    page.classList.remove("playing");
    explosion(player.x, player.y, 1.7, "player");
    showToast("修订中断", "这一页暂时没有可用的修订权限。", "danger");
    updateHud();
  }

  function gameOver() {
    mode = MODE.GAMEOVER;
    clearInput();
    page.classList.remove("playing");
    displayWords = stats.words;
    lastHudWords = -1;
    const elapsed = stats.elapsed;
    $("statWave").textContent = String(wave);
    $("statWords").textContent = fmt(stats.words);
    $("statTime").textContent = fmtTime(elapsed);
    const isRecord = stats.words > highRecord.words;
    if (isRecord) {
      highRecord = { words: stats.words, wave, seconds: Math.round(elapsed) };
      saveHighRecord();
    }
    $("statBest").textContent = highRecord.words ? `${fmt(highRecord.words)} 词` : "—";
    openGameOverModal();
    updateHud();
  }

  function openGameOverModal() {
    gameOverModal.hidden = false;
    window.setTimeout(() => $("restartBtn").focus({ preventScroll: true }), 30);
  }

  function closeGameOver(action = "read") {
    gameOverModal.hidden = true;
    if (action === "read") {
      if (mode === MODE.GAMEOVER) {
        modeBeforeReading = MODE.GAMEOVER;
        mode = MODE.READING;
        document.body.classList.add("reading");
        clearInput();
        const editingBadge = document.querySelector(".editing-badge");
        if (editingBadge) editingBadge.textContent = "只读";
        updateHud();
        requestAnimationFrame(ensureScale);
      }
    }
  }

  function showFinalClear() {
    finalMilestoneWave = wave;
    mode = MODE.FINAL_CLEAR;
    clearInput();
    page.classList.remove("playing");
    shake = 0;
    hitFlash = 0;
    finalClearWaveEl.textContent = `第 ${wave} 波`;
    finalClearModal.hidden = false;
    updateHud();
    window.setTimeout(() => $("finalContinueBtn").focus({ preventScroll: true }), 30);
  }

  function continueFinalClear() {
    if (mode !== MODE.FINAL_CLEAR) return;
    finalClearModal.hidden = true;
    pendingArticleSwap = true;
    intermission = 1.2;
    showToast(
      "终审完成",
      "请选择一项红色格式；随后会按普通 Boss 结算并载入下一张稿件。",
      ""
    );
    openStyleReward("final-boss");
  }

  function stopFinalClear() {
    if (mode !== MODE.FINAL_CLEAR) return;
    finalClearModal.hidden = true;
    modeBeforeReading = MODE.PLAYING;
    mode = MODE.READING;
    page.classList.remove("playing");
    document.body.classList.add("reading");
    const editingBadge = document.querySelector(".editing-badge");
    if (editingBadge) editingBadge.textContent = "只读";
    clearInput();
    updateHud();
    requestAnimationFrame(ensureScale);
  }

  function syncCheatPanel() {
    cheatInvincibleEl.checked = cheatInvincible;
    const stage = clamp(Math.floor((Math.max(1, wave) - 1) / 4) + 1, 1, 40);
    cheatLevelEl.value = String(stage);
    if (player) {
      cheatStyleEl.value = player.firingStyle;
      cheatMoveReadout.textContent = `${Math.round((player.speed / PLAYER_BASE_SPEED) * 100)}%`;
      cheatFireReadout.textContent = `${Math.round((1 + player.fireRateBonus) * 100)}%`;
    } else {
      cheatMoveReadout.textContent = "—";
      cheatFireReadout.textContent = "—";
    }
  }

  function toggleCheatPanel() {
    cheatPanel.hidden = !cheatPanel.hidden;
    if (!cheatPanel.hidden) {
      syncCheatPanel();
      cheatHintEl.textContent = "无敌、跳关和攻击方式会立即生效；移速与攻速实时显示。";
    }
  }

  function cheatJump(toBoss = false) {
    if (!player) return;
    const level = clamp(Number(cheatLevelEl.value) || 1, 1, 40);
    const targetWave = toBoss ? level * 4 : (level - 1) * 4 + 1;
    hideStyleReward();
    finalClearModal.hidden = true;
    gameOverModal.hidden = true;
    wordCountModal.hidden = true;
    pausePill.classList.remove("show");
    document.body.classList.remove("reading");
    const editingBadge = document.querySelector(".editing-badge");
    if (editingBadge) editingBadge.textContent = "编辑";
    page.classList.add("playing");
    mode = MODE.PLAYING;
    clearInput();
    bossesCleared = level - 1;
    currentBossKind = "sentence";
    lastBossKind = null;
    pendingArticleSwap = false;
    finalMilestoneWave = 0;
    finalIntroActive = false;
    finalIntroTimer = 0;
    finalVictoryDelay = 0;
    finalBossFlash = 0;
    bonusRewardCharges = 0;
    enemies = [];
    bullets = [];
    pickups = [];
    particles = [];
    floaters = [];
    spawnQueue = [];
    spawnTimer = 0;
    wavePhase = "idle";
    waveKills = 0;
    intermission = 0;
    combo = 0;
    comboTimer = 0;
    player.hp = player.maxHp;
    player.invuln = Math.max(player.invuln, 1);
    startWave(targetWave);
    updateEnemyLevelHud(true);
    updateFragmentHud();
    updateHud();
    cheatHintEl.textContent = `已跳到第 ${level} 关 · 第 ${targetWave} 波${toBoss ? "（关底）" : ""}。`;
  }

  function grantCheatReward(reward) {
    if (!player || !reward) return;
    applyStyleReward(reward);
    updateHud();
    syncCheatPanel();
    cheatHintEl.textContent = `已获得：${reward.name}。`;
  }

  function clearCheatRewards() {
    if (!player) return;
    player.fireRateBonus = 0;
    player.damageLevel = 1;
    player.moveBonus = 0;
    player.speed = PLAYER_BASE_SPEED;
    player.backShieldWidth = 0;
    player.shieldFlash = 0;
    player.extraBullets = 0;
    player.spreadUnlocked = false;
    player.spreadPairs = 0;
    player.formatAbundance = false;
    player.rapidEditStacks = 0;
    player.whiteCards = 0;
    player.blueCards = 0;
    player.redCards = 0;
    player.cardCounts = {};
    renderOwnedCardsRibbon();
    player.resurrectionStacks = 0;
    player.healPickupProgress = 0;
    player.gritStacks = 0;
    player.faithStacks = 0;
    player.daydreamStacks = 0;
    player.blueSeaStacks = 0;
    player.moveShotTimer = 0;
    player.firingStyle = "default";
    player.laserLife = 0;
    player.laserRays = [];
    player.orbiters = 0;
    if (player.orbitCooldowns) player.orbitCooldowns.clear();
    player.orbitPhase = 0;
    player.aura = 0;
    player.auraTimer = 0;
    player.cooldown = 0;
    player.ringFlash = 0;
    updateDamageMeter();
    updateHud();
    syncCheatPanel();
    cheatHintEl.textContent = "已清除全部已获得奖励卡。";
  }

  function setupCheatPanel() {
    for (let level = 1; level <= 40; level++) {
      const option = document.createElement("option");
      option.value = String(level);
      option.textContent = `第 ${level} 关`;
      cheatLevelEl.append(option);
    }
    cheatRewardsEl.replaceChildren();
    for (const reward of REWARD_POOL) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `cheat-reward-btn rarity-${reward.rarity}`;
      button.title = reward.desc;
      button.dataset.rewardId = reward.id;
      const glyph = document.createElement("b");
      glyph.textContent = reward.glyph;
      const label = document.createElement("span");
      label.textContent = reward.name;
      button.append(glyph, label);
      button.addEventListener("click", () => grantCheatReward(reward));
      cheatRewardsEl.append(button);
    }
    $("cheatClearRewards").addEventListener("click", clearCheatRewards);
    $("cheatClose").addEventListener("click", () => { cheatPanel.hidden = true; });
    cheatInvincibleEl.addEventListener("change", () => {
      cheatInvincible = cheatInvincibleEl.checked;
      if (cheatInvincible && player) player.hp = player.maxHp;
      updateHud();
      cheatHintEl.textContent = cheatInvincible ? "无敌模式已开启。" : "无敌模式已关闭。";
    });
    cheatStyleEl.addEventListener("change", () => {
      if (!player) return;
      player.firingStyle = cheatStyleEl.value;
      player.laserLife = 0;
      player.laserRays = [];
      updateHud();
      cheatHintEl.textContent = `攻击方式：${cheatStyleEl.options[cheatStyleEl.selectedIndex].textContent}。`;
    });
    $("cheatJumpStart").addEventListener("click", () => cheatJump(false));
    $("cheatJumpBoss").addEventListener("click", () => cheatJump(true));
  }

  function restartGame() {
    gameOverModal.hidden = true;
    finalClearModal.hidden = true;
    if (mode === MODE.READING) {
      document.body.classList.remove("reading");
      const editingBadge = document.querySelector(".editing-badge");
      if (editingBadge) editingBadge.textContent = "编辑";
    }
    mode = MODE.INTRO;
    dismissIntro(true);
    resetGameWorld();
    mode = MODE.PLAYING;
    page.classList.add("playing");
    startWave(1);
    showWaveStamp("第 1 轮修订");
    pausePill.classList.remove("show");
    updateHud();
    sound.start();
  }

  function tutorialKeypad(keys) {
    const rows = keys === "wasd"
      ? [["", "W", ""], ["A", "S", "D"]]
      : [["", "I", ""], ["J", "K", "L"]];
    return `<div class="tutorial-keypad">${rows.flat().map((key) =>
      key ? `<kbd data-key="${key}">${key}</kbd>` : '<span class="key-slot"></span>'
    ).join("")}</div>`;
  }

  function setTutorialPage(index) {
    tutorialPage = clamp(Math.round(index), 0, TUTORIAL_PAGES.length - 1);
    tutorialTime = 0;
    const page = TUTORIAL_PAGES[tutorialPage];
    const finalPage = tutorialPage === TUTORIAL_PAGES.length - 1;
    introComment.classList.toggle("final", finalPage);
    tutorialStage.hidden = finalPage;
    tutorialSkipBtn.hidden = finalPage;
    tutorialNextBtn.hidden = finalPage;
    tutorialPrevBtn.hidden = finalPage || tutorialPage === 0;
    $("startGameBtn").hidden = !finalPage;
    tutorialStep.textContent = `${String(tutorialPage + 1).padStart(2, "0")} / 06`;
    tutorialText.textContent = page.text;
    tutorialKeys.innerHTML = page.keys ? tutorialKeypad(page.keys) : "";
    tutorialStage.classList.toggle("no-keys", !page.keys);
    tutorialDots.querySelectorAll("i").forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === tutorialPage);
    });
    const focusTarget = finalPage ? $("startGameBtn") : tutorialNextBtn;
    window.setTimeout(() => focusTarget.focus({ preventScroll: true }), 20);
  }

  function setupTutorial() {
    tutorialNextBtn.addEventListener("click", () => {
      if (tutorialPage < TUTORIAL_PAGES.length - 1) setTutorialPage(tutorialPage + 1);
    });
    tutorialPrevBtn.addEventListener("click", () => {
      if (tutorialPage > 0) setTutorialPage(tutorialPage - 1);
    });
    tutorialSkipBtn.addEventListener("click", () => setTutorialPage(TUTORIAL_PAGES.length - 1));
    setTutorialPage(0);
  }

  function tutorialRoundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function tutorialBackground(c) {
    c.clearRect(0, 0, 540, 320);
    c.fillStyle = "#fffdf8";
    c.fillRect(0, 0, 540, 320);
    c.strokeStyle = "rgba(176, 164, 143, .14)";
    c.lineWidth = 1;
    for (let x = 20; x < 540; x += 36) {
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 320); c.stroke();
    }
    for (let y = 18; y < 320; y += 36) {
      c.beginPath(); c.moveTo(0, y); c.lineTo(540, y); c.stroke();
    }
    c.strokeStyle = "rgba(43, 87, 154, .18)";
    c.setLineDash([4, 6]);
    c.strokeRect(14, 14, 512, 292);
    c.setLineDash([]);
  }

  function tutorialPlayer(c, x, y, alpha = 1, hit = false) {
    c.save();
    c.globalAlpha = alpha;
    c.translate(x, y);
    // Same white, dark-edged Windows pointer silhouette as the in-game player.
    c.beginPath();
    c.moveTo(-9, -15);
    c.lineTo(-9, 6);
    c.lineTo(-3, 1);
    c.lineTo(1, 10);
    c.lineTo(5, 8);
    c.lineTo(1, -1);
    c.lineTo(9, -1);
    c.closePath();
    c.shadowColor = "rgba(0,0,0,.24)";
    c.shadowBlur = 2.5;
    c.shadowOffsetY = 1.2;
    c.fillStyle = hit ? "#fff4ef" : "#fbfaf6";
    c.fill();
    c.shadowColor = "transparent";
    c.shadowBlur = 0;
    c.shadowOffsetY = 0;
    c.strokeStyle = "#252321";
    c.lineWidth = 1.45;
    c.lineJoin = "round";
    c.stroke();
    c.fillStyle = "#252321";
    c.beginPath();
    c.arc(-8.3, -13.5, 0.9, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function tutorialHealthRing(c, x, y, hp, maxHp, hit = false) {
    const radius = 9.6;
    const gap = 0.14;
    const span = (Math.PI * 2) / maxHp - gap;
    const rotation = tutorialTime * 2.1 - Math.PI / 2;
    c.save();
    for (let i = 0; i < maxHp; i++) {
      const start = rotation + i * (Math.PI * 2 / maxHp);
      c.strokeStyle = "rgba(255,255,255,.76)";
      c.lineWidth = 5.2;
      c.lineCap = "round";
      c.beginPath();
      c.arc(x, y, radius, start, start + span);
      c.stroke();
    }
    for (let i = 0; i < maxHp; i++) {
      const start = rotation + i * (Math.PI * 2 / maxHp);
      const alive = i < hp;
      c.strokeStyle = alive
        ? (hit ? "rgba(190,53,40,.98)" : "rgba(44,100,198,.96)")
        : "rgba(84,85,88,.18)";
      c.lineWidth = alive ? 3.1 : 1.8;
      c.lineCap = "round";
      c.beginPath();
      c.arc(x, y, radius, start, start + span);
      c.stroke();
    }
    const lead = rotation + Math.min(hp, maxHp) * (Math.PI * 2 / maxHp) - gap / 2;
    c.fillStyle = hit ? "rgba(255,226,220,.95)" : "rgba(238,247,255,.96)";
    c.beginPath();
    c.arc(x + Math.cos(lead) * radius, y + Math.sin(lead) * radius, 1.25, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function tutorialEnemy(c, x, y, glyph, alpha = 1, scale = 1) {
    c.save();
    c.globalAlpha = alpha;
    c.translate(x, y);
    c.scale(scale, scale);
    c.fillStyle = "rgba(164, 55, 40, .1)";
    c.beginPath();
    c.arc(0, 0, 20, 0, Math.PI * 2);
    c.fill();
    c.font = `700 25px ${FONT_DOC}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.lineWidth = 4;
    c.strokeStyle = "rgba(255, 252, 246, .95)";
    c.strokeText(glyph, 0, 1);
    c.fillStyle = "#993a2d";
    c.fillText(glyph, 0, 1);
    c.restore();
  }

  function tutorialEnemyBreak(c, x, y, progress) {
    const p = clamp(progress, 0, 1);
    c.save();
    c.globalAlpha = 1 - p;
    c.strokeStyle = "rgba(180, 67, 52, .72)";
    c.lineWidth = 2.2;
    c.beginPath();
    c.arc(x, y, 16 + p * 28, 0, Math.PI * 2);
    c.stroke();
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + 0.2;
      const r0 = 12 + p * 22;
      const r1 = 22 + p * 36;
      c.strokeStyle = i % 2 ? "rgba(215, 166, 58, .8)" : "rgba(151, 55, 42, .8)";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(x + Math.cos(angle) * r0, y + Math.sin(angle) * r0);
      c.lineTo(x + Math.cos(angle) * r1, y + Math.sin(angle) * r1);
      c.stroke();
    }
    c.fillStyle = "rgba(255, 247, 222, .82)";
    c.font = `700 ${16 + p * 8}px ${FONT_DOC}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("×", x, y);
    c.restore();
  }

  function tutorialPickup(c, x, y, kind, bob = 0) {
    c.save();
    c.translate(x, y + bob);
    const gold = kind === "fragment";
    c.fillStyle = gold ? "rgba(188, 139, 35, .12)" : "rgba(43, 98, 190, .12)";
    c.beginPath();
    c.arc(0, 0, 28, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = gold ? "rgba(174, 124, 23, .48)" : "rgba(44, 105, 196, .48)";
    c.lineWidth = 1.2;
    c.setLineDash([3, 4]);
    c.beginPath();
    c.arc(0, 0, 19, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = "#fffdf7";
    c.beginPath();
    c.arc(0, 0, 13, 0, Math.PI * 2);
    c.fill();
    if (gold) {
      c.font = `700 19px ${FONT_DOC}`;
      c.fillStyle = "#9c6c14";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("¶", 0, 1);
    } else {
      c.fillStyle = "#2b62bb";
      c.beginPath(); c.arc(0, 0, 8, 0, Math.PI * 2); c.fill();
      c.fillStyle = "rgba(255,255,255,.85)";
      c.beginPath(); c.arc(-2, -2, 2, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }

  function drawTutorial() {
    const c = tutorialCtx;
    if (!c || tutorialPage >= TUTORIAL_PAGES.length - 1) return;
    tutorialBackground(c);
    let activeKey = null;

    if (tutorialPage === 0) {
      const cx = 270, cy = 160;
      const path = [
        { dx: 0, dy: -1, key: "W", angle: -Math.PI / 2 },
        { dx: 1, dy: 0, key: "D", angle: 0 },
        { dx: 0, dy: 1, key: "S", angle: Math.PI / 2 },
        { dx: -1, dy: 0, key: "A", angle: Math.PI },
      ];
      const seg = Math.floor(tutorialTime / 0.9) % path.length;
      const local = (tutorialTime % 0.9) / 0.9;
      const amount = Math.sin(local * Math.PI) * 78;
      const p = path[seg];
      activeKey = p.key;
      c.save();
      c.setLineDash([4, 6]);
      c.strokeStyle = "rgba(43, 87, 154, .3)";
      c.beginPath();
      c.moveTo(cx, cy);
      c.lineTo(cx + p.dx * 92, cy + p.dy * 92);
      c.stroke();
      c.setLineDash([]);
      c.restore();
      tutorialPlayer(c, cx + p.dx * amount, cy + p.dy * amount);
      c.fillStyle = "rgba(67, 60, 50, .58)";
      c.font = `600 11px ${FONT_UI}`;
      c.textAlign = "center";
      c.fillText(`${p.key} · ${p.dy < 0 ? "上" : p.dy > 0 ? "下" : p.dx < 0 ? "左" : "右"}`, cx, 294);
    } else if (tutorialPage === 1) {
      const cx = 270, cy = 158;
      const dirs = [
        { dx: 0, dy: -1, key: "I", x: 270, y: 61 },
        { dx: -1, dy: 0, key: "J", x: 86, y: 160 },
        { dx: 0, dy: 1, key: "K", x: 270, y: 259 },
        { dx: 1, dy: 0, key: "L", x: 454, y: 160 },
      ];
      const stepDuration = 0.64;
      const shotIndex = Math.floor(tutorialTime / stepDuration) % dirs.length;
      const local = tutorialTime % stepDuration;
      activeKey = dirs[shotIndex].key;
      tutorialPlayer(c, cx, cy);
      dirs.forEach((d, index) => {
        const enemyDist = Math.hypot(d.x - cx, d.y - cy);
        if (index < shotIndex) return;
        if (index === shotIndex) {
          if (local < 0.18) {
            const dist = 42 + (local / 0.18) * (enemyDist - 52);
            c.fillStyle = "#2b62bb";
            c.beginPath();
            c.arc(cx + d.dx * dist, cy + d.dy * dist, 2.8, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = "rgba(42, 91, 177, .42)";
            c.lineWidth = 2.2;
            c.beginPath();
            c.moveTo(cx + d.dx * (dist - 14), cy + d.dy * (dist - 14));
            c.lineTo(cx + d.dx * dist, cy + d.dy * dist);
            c.stroke();
            tutorialEnemy(c, d.x, d.y, ["，", "？", "！", "；"][index]);
          } else if (local < 0.62) {
            tutorialEnemyBreak(c, d.x, d.y, (local - 0.18) / 0.44);
          }
        } else {
          tutorialEnemy(c, d.x, d.y, ["，", "？", "！", "；"][index]);
        }
      });
      c.fillStyle = "rgba(67, 60, 50, .58)";
      c.font = `600 11px ${FONT_UI}`;
      c.textAlign = "center";
      c.fillText("按顺序四向校对", 270, 294);
    } else if (tutorialPage === 2) {
      const cx = 246, cy = 158;
      const cycle = 3.2;
      const t = tutorialTime % cycle;
      const hp = t < 1.05 ? 4 : 3;
      const hit = t > 1.0 && t < 1.35;
      const travel = clamp((t - 0.18) / 0.82, 0, 1);
      if (t < 1.02) {
        const bx = cx + 150 - travel * 142;
        c.strokeStyle = "rgba(151, 47, 35, .32)";
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(bx + 22, cy);
        c.lineTo(bx + 4, cy);
        c.stroke();
        c.fillStyle = "rgba(166, 47, 35, .16)";
        c.beginPath();
        c.arc(bx, cy, 6, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#9c3d2e";
        c.beginPath();
        c.arc(bx, cy, 3, 0, Math.PI * 2);
        c.fill();
      } else if (t < 1.4) {
        const p = (t - 1.0) / 0.4;
        c.strokeStyle = `rgba(178, 58, 43, ${0.7 * (1 - p)})`;
        c.lineWidth = 2;
        c.beginPath();
        c.arc(cx + 1, cy, 7 + p * 20, 0, Math.PI * 2);
        c.stroke();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 * i) / 6;
          c.beginPath();
          c.moveTo(cx + Math.cos(angle) * (7 + p * 12), cy + Math.sin(angle) * (7 + p * 12));
          c.lineTo(cx + Math.cos(angle) * (15 + p * 20), cy + Math.sin(angle) * (15 + p * 20));
          c.stroke();
        }
      }
      tutorialPlayer(c, cx, cy, 1, hit);
      tutorialHealthRing(c, cx + 17, cy + 11, hp, 4, hit);
      c.fillStyle = "rgba(67, 60, 50, .58)";
      c.font = `600 11px ${FONT_UI}`;
      c.textAlign = "center";
      c.fillText("校对权限减少", 270, 294);
    } else if (tutorialPage === 3) {
      const bob = Math.sin(tutorialTime * 3) * 4;
      tutorialPlayer(c, 210, 160);
      c.strokeStyle = "rgba(43, 87, 154, .2)";
      c.lineWidth = 1.5;
      c.setLineDash([4, 5]);
      c.beginPath(); c.moveTo(236, 152); c.lineTo(345, 103); c.stroke();
      c.beginPath(); c.moveTo(236, 168); c.lineTo(345, 225); c.stroke();
      c.setLineDash([]);
      tutorialPickup(c, 382, 96, "fragment", bob);
      tutorialPickup(c, 382, 224, "heal", -bob);
      c.font = `600 11px ${FONT_UI}`;
      c.textAlign = "center";
      c.fillStyle = "#8e6210";
      c.fillText("格式奖励", 382, 143);
      c.fillStyle = "#2859a8";
      c.fillText("恢复生命", 382, 271);
    } else if (tutorialPage === 4) {
      const cards = [
        { x: 130, glyph: "速", color: "#4e83c8", label: "射速" },
        { x: 270, glyph: "散", color: "#4e83c8", label: "散射" },
        { x: 410, glyph: "力", color: "#b44334", label: "力度" },
      ];
      c.fillStyle = "#2d2923";
      c.font = `700 18px ${FONT_UI}`;
      c.textAlign = "left";
      c.fillText("格式", 38, 42);
      c.strokeStyle = "#c9c2b7";
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(38, 54); c.lineTo(502, 54); c.stroke();
      cards.forEach((card, index) => {
        const selected = Math.floor(tutorialTime / 0.9) % cards.length === index;
        c.save();
        c.translate(card.x, 158);
        if (selected) c.scale(1.06, 1.06);
        tutorialRoundRect(c, -60, -58, 120, 116, 4);
        c.fillStyle = selected ? "#eef6ff" : "#fffefa";
        c.fill();
        c.strokeStyle = selected ? card.color : "#d9d2c7";
        c.lineWidth = selected ? 2 : 1;
        c.stroke();
        c.fillStyle = card.color;
        c.font = `700 30px ${FONT_DOC}`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText(card.glyph, 0, -12);
        c.fillStyle = "#5d554a";
        c.font = `600 11px ${FONT_UI}`;
        c.fillText(card.label, 0, 32);
        c.restore();
      });
      c.fillStyle = "rgba(67, 60, 50, .58)";
      c.font = `600 11px ${FONT_UI}`;
      c.textAlign = "center";
      c.fillText("点击一种格式应用", 270, 294);
    }

    tutorialKeys.querySelectorAll("kbd").forEach((key) => {
      key.classList.toggle("active", key.dataset.key === activeKey);
    });
  }

  function startGame() {
    if (mode !== MODE.INTRO) return;
    sound.ensure();
    sound.start();
    introComment.classList.add("hide");
    window.setTimeout(() => { introComment.style.display = "none"; }, 230);
    resetGameWorld();
    mode = MODE.PLAYING;
    page.classList.add("playing");
    startWave(1);
    showWaveStamp("第 1 轮修订");
    pausePill.classList.remove("show");
    updateHud();
    if (cheatOpenOnStart) {
      cheatOpenOnStart = false;
      cheatPanel.hidden = false;
      syncCheatPanel();
    }
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  function dismissIntro(instant = false) {
    introComment.classList.add("hide");
    if (instant) introComment.style.display = "none";
    else window.setTimeout(() => { introComment.style.display = "none"; }, 220);
  }

  /* ---------------- player update ---------------- */
  function updatePlayer(dt) {
    if (!player) return;
    player.invuln = Math.max(0, player.invuln - dt);
    player.cooldown = Math.max(0, player.cooldown - dt);
    player.moveShotTimer = Math.max(0, player.moveShotTimer - dt);
    player.ringFlash = Math.max(0, player.ringFlash - dt);
    player.shieldFlash = Math.max(0, player.shieldFlash - dt);
    for (const ray of player.laserRays) ray.life -= dt;
    player.laserRays = player.laserRays.filter((ray) => ray.life > 0);
    player.laserLife = player.laserRays.length
      ? Math.max(...player.laserRays.map((ray) => ray.life))
      : 0;

    let ix = 0, iy = 0;
    if (keys.has("KeyW")) iy -= 1;
    if (keys.has("KeyS")) iy += 1;
    if (keys.has("KeyA")) ix -= 1;
    if (keys.has("KeyD")) ix += 1;
    const len = Math.hypot(ix, iy) || 1;
    ix /= len; iy /= len;
    const targetVx = ix * player.speed;
    const targetVy = iy * player.speed;
    const accel = Math.min(1, dt * 17);
    player.vx = lerp(player.vx, targetVx, accel);
    player.vy = lerp(player.vy, targetVy, accel);
    player.moving = Math.hypot(player.vx, player.vy) > 20;
    const moveInput = ix !== 0 || iy !== 0;
    if (moveInput) player.moveAngle = Math.atan2(iy, ix);
    if (player.moving) {
      moveWithWalls(player, player.vx * dt, player.vy * dt, player.radius);
      player.bob = Math.sin(animationTime * 19) * 0.9;
    } else {
      player.vx *= Math.pow(0.0007, dt);
      player.vy *= Math.pow(0.0007, dt);
      player.bob = lerp(player.bob, 0, Math.min(1, dt * 12));
    }

    if (player.rapidEditStacks > 0 && player.moving && moveInput) {
      if (player.moveShotTimer <= 0) {
        fireRapidEdit();
        player.moveShotTimer = playerFireCooldown();
      }
    } else {
      player.moveShotTimer = 0;
    }

    const activeFire = fireOrder.length ? fireOrder[fireOrder.length - 1] : null;
    if (activeFire && FIRE_DIRS[activeFire]) {
      aimAngle = FIRE_DIRS[activeFire].angle;
      if (player.cooldown <= 0) firePlayer();
    }
    if (player.firingStyle === "laser" && activeFire && FIRE_DIRS[activeFire]) {
      // Keep the beams visually continuous while the trigger is held; damage
      // still pulses at the fire-rate cooldown inside fireLaser().
      player.laserRays = buildLaserRays();
      const primary = player.laserRays[0];
      player.laserLife = 0.13;
      player.laserAngle = primary ? primary.angle : aimAngle;
      player.laserLength = primary ? primary.length : 18;
    }
    player.angle = aimAngle;
  }

  function orbiterPositions() {
    if (!player || player.orbiters <= 0) return [];
    const positions = [];
    const count = Math.min(16, player.orbiters);
    for (let i = 0; i < count; i++) {
      const angle = player.orbitPhase + (Math.PI * 2 * i) / count;
      positions.push({
        x: player.x + Math.cos(angle) * 57,
        y: player.y + Math.sin(angle) * 57,
        angle,
      });
    }
    return positions;
  }

  function updatePlayerUpgrades(dt) {
    if (!player) return;
    if (player.orbiters > 0) {
      player.orbitPhase += dt * 3.15;
      const orbs = orbiterPositions();
      for (const orb of orbs) {
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          if (b.fromPlayer) continue;
          if (dist2(orb.x, orb.y, b.x, b.y) < (b.radius + 13) ** 2) {
            bullets.splice(i, 1);
            spawnHitSparks(orb.x, orb.y, false);
            player.shieldFlash = Math.max(player.shieldFlash, 0.16);
            sound.shieldBlock();
          }
        }
      }
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (!e || e.spawnT > 0) continue;
        let touched = false;
        for (const orb of orbs) {
          if (dist2(orb.x, orb.y, e.x, e.y) < (e.radius + 16) ** 2) { touched = true; break; }
        }
        if (!touched) continue;
        const ready = player.orbCooldowns.get(e) || 0;
        if (ready > 0) continue;
        player.orbCooldowns.set(e, 0.32);
        damageEnemy(e, 2, e.x, e.y);
      }
      for (const [enemy, timer] of player.orbCooldowns) {
        if (!enemies.includes(enemy)) player.orbCooldowns.delete(enemy);
        else if (timer > 0) player.orbCooldowns.set(enemy, Math.max(0, timer - dt));
      }
      if (player.orbCooldowns.size > 60) player.orbCooldowns.clear();
    }
    if (player.aura > 0) {
      player.auraTimer -= dt;
      if (player.auraTimer <= 0) {
        player.auraTimer = 0.46;
        const radius = 74;
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i];
          if (!e || e.spawnT > 0) continue;
          if (dist2(player.x, player.y, e.x, e.y) <= (radius + e.radius) ** 2) {
            damageEnemy(e, 1, e.x, e.y);
            particles.push({
              type: "ring", x: e.x, y: e.y, vx: 0, vy: 0,
              life: 0.22, maxLife: 0.22, size: 3, targetSize: 18,
              color: "rgba(50,116,207,.28)",
            });
          }
        }
      }
    }
  }

  /* ---------------- enemy update ---------------- */
  function cardinalAim(dx, dy) {
    if (Math.abs(dx) >= Math.abs(dy)) {
      const sign = dx >= 0 ? 1 : -1;
      return { x: sign, y: 0, angle: sign > 0 ? 0 : Math.PI, axis: "x" };
    }
    const sign = dy >= 0 ? 1 : -1;
    return { x: 0, y: sign, angle: sign > 0 ? Math.PI / 2 : -Math.PI / 2, axis: "y" };
  }

  function axialGap(e, aim) {
    return aim.axis === "x" ? Math.abs(e.y - player.y) : Math.abs(e.x - player.x);
  }

  function enemyMuzzle(e, aim, perpendicularOffset = 0) {
    const px = -aim.y;
    const py = aim.x;
    return {
      x: e.x + aim.x * (e.radius + 6) + px * perpendicularOffset,
      y: e.y + aim.y * (e.radius + 6) + py * perpendicularOffset,
    };
  }

  function updateGoldEnemy(e, dt) {
    e.fleeTimer -= dt;
    if (e.fleeTimer <= 0) {
      escapeGoldEnemy(e);
      return;
    }
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    const radial = Math.atan2(e.y - player.y, e.x - player.x);
    e.strafeTimer -= dt;
    if (e.strafeTimer <= 0) {
      e.strafeDir *= -1;
      e.strafeTimer = rand(0.7, 1.5);
    }
    let desiredAngle;
    const insideArena =
      e.x >= ARENA.left + e.radius && e.x <= ARENA.right - e.radius &&
      e.y >= ARENA.top + e.radius && e.y <= ARENA.bottom - e.radius;
    if (!insideArena) {
      desiredAngle = Math.atan2(
        (ARENA.top + ARENA.bottom) / 2 - e.y,
        (ARENA.left + ARENA.right) / 2 - e.x
      );
    } else if (dist < 176) desiredAngle = radial;
    else if (dist > 328) desiredAngle = Math.atan2(player.y - e.y, player.x - e.x);
    else desiredAngle = radial + e.strafeDir * 0.9 + Math.sin(animationTime * 2.4 + e.seed) * 0.22;
    if (blockedAhead(e.x, e.y, desiredAngle, 30, e.radius)) {
      for (const turn of [0.6, -0.6, 1.15, -1.15, 1.65, -1.65]) {
        if (!blockedAhead(e.x, e.y, desiredAngle + turn, 34, e.radius)) {
          desiredAngle += turn;
          break;
        }
      }
    }
    const urgency = e.fleeTimer < 2.4 ? 1.45 : 1;
    moveWithWalls(e, Math.cos(desiredAngle) * e.speed * urgency * dt, Math.sin(desiredAngle) * e.speed * urgency * dt, e.radius);
    e.turretAngle = cardinalAim(dx, dy).angle;
    e.trailTimer = (e.trailTimer || 0) - dt;
    if (e.trailTimer <= 0) {
      e.trailTimer = 0.08;
      particles.push({
        type: "spark", x: e.x + rand(-9, 9), y: e.y + rand(-9, 9),
        vx: rand(-12, 12), vy: rand(-12, 12),
        life: 0.35, maxLife: 0.35, size: rand(1, 2.2),
        color: "rgba(196,148,45,.55)",
      });
    }
  }

  function updateBracketEnemy(e, dt) {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    e.turretAngle = Math.atan2(dy, dx);
    const targetY = clamp(
      player.y + Math.sin(animationTime * 0.85 + e.seed) * 22,
      ARENA.top + e.radius + 34,
      ARENA.bottom - e.radius - 34
    );
    const targetX = e.anchorX;
    const toX = targetX - e.x;
    const toY = targetY - e.y;
    const distance = Math.hypot(toX, toY) || 1;
    let desiredAngle = Math.atan2(toY, toX);
    let desiredSpeed = e.speed;
    if (distance < 20) desiredSpeed *= 0.08;
    else if (distance < 80) desiredSpeed *= 0.42;

    if (blockedAhead(e.x, e.y, desiredAngle, 30, e.radius)) {
      for (const turn of [0.62, -0.62, 1.15, -1.15, Math.PI / 2, -Math.PI / 2]) {
        if (!blockedAhead(e.x, e.y, desiredAngle + turn, 34, e.radius)) {
          desiredAngle += turn;
          break;
        }
      }
    }
    moveWithWalls(e, Math.cos(desiredAngle) * desiredSpeed * dt, Math.sin(desiredAngle) * desiredSpeed * dt, e.radius);

    e.fireTimer -= dt;
    const isInside = e.x >= ARENA.left && e.x <= ARENA.right && e.y >= ARENA.top && e.y <= ARENA.bottom;
    const nearSide = e.side === "left"
      ? e.x < ARENA.left + 150
      : e.x > ARENA.right - 150;
    if (isInside && nearSide && e.fireTimer <= 0) {
      const sideSign = e.side === "left" ? 1 : -1;
      const mouthX = e.x + sideSign * e.radius * 0.74;
      for (const mouthY of [e.y - e.bracketHalf, e.y + e.bracketHalf]) {
        const angle = Math.atan2(player.y - mouthY, player.x - mouthX);
        spawnBullet(mouthX, mouthY, angle, e.bulletSpeed, false, {
          radius: 3.8, color: "#8d2b38", life: 3.5, boss: true,
        });
      }
      e.fireTimer = enemyFireDelay(rand(1.35, 1.95));
      shake = Math.max(shake, 3.2);
      sound.enemyShoot();
    }

    if (dist < e.radius + player.radius + 1 && player.invuln <= 0) {
      damagePlayer(1);
    }
  }

  function updateBounceBoss(e, dt) {
    if (!Number.isFinite(e.vx) || !Number.isFinite(e.vy) || (!e.vx && !e.vy)) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      e.vx = dir * e.speed * 0.7071;
      e.vy = (Math.random() < 0.5 ? -1 : 1) * e.speed * 0.7071;
    }
    const speed = Math.hypot(e.vx, e.vy) || 1;
    e.vx = (e.vx / speed) * e.speed;
    e.vy = (e.vy / speed) * e.speed;
    e.bounceCooldown = Math.max(0, (e.bounceCooldown || 0) - dt);
    e.bounceFlash = Math.max(0, (e.bounceFlash || 0) - dt * 5);

    const wasInside =
      e.x >= ARENA.left + e.radius && e.x <= ARENA.right - e.radius &&
      e.y >= ARENA.top + e.radius && e.y <= ARENA.bottom - e.radius;
    let bounced = false;
    if (!wasInside) {
      // Spawned beyond the arena frame: travel straight in before bouncing.
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    } else {
      const nx = e.x + e.vx * dt;
      if (collidesWall(nx, e.y, e.radius)) {
        e.vx *= -1;
        bounced = true;
      } else {
        e.x = nx;
      }
      if (e.x < ARENA.left + e.radius) {
        e.x = ARENA.left + e.radius;
        e.vx = Math.abs(e.vx);
        bounced = true;
      } else if (e.x > ARENA.right - e.radius) {
        e.x = ARENA.right - e.radius;
        e.vx = -Math.abs(e.vx);
        bounced = true;
      }

      const ny = e.y + e.vy * dt;
      if (collidesWall(e.x, ny, e.radius)) {
        e.vy *= -1;
        bounced = true;
      } else {
        e.y = ny;
      }
      if (e.y < ARENA.top + e.radius) {
        e.y = ARENA.top + e.radius;
        e.vy = Math.abs(e.vy);
        bounced = true;
      } else if (e.y > ARENA.bottom - e.radius) {
        e.y = ARENA.bottom - e.radius;
        e.vy = -Math.abs(e.vy);
        bounced = true;
      }
    }

    e.turretAngle = Math.atan2(e.vy, e.vx);
    e.fireTimer -= dt;
    const canShoot =
      e.x >= ARENA.left && e.x <= ARENA.right &&
      e.y >= ARENA.top && e.y <= ARENA.bottom;
    if (canShoot && e.fireTimer <= 0) {
      e.fireTimer = e.fireRate ? 1 / e.fireRate : 1;
      spawnBullet(e.x, e.y, rand(0, Math.PI * 2), e.bulletSpeed || 180, false, {
        radius: 3.4, color: "#8d2b38", life: 3.6, boss: true,
      });
      sound.enemyShoot();
    }
    e.trailTimer = (e.trailTimer || 0) - dt;
    if (e.trailTimer <= 0) {
      e.trailTimer = 0.065;
      particles.push({
        type: Math.random() < 0.35 ? "glyph" : "spark",
        char: "@", x: e.x + rand(-8, 8), y: e.y + rand(-8, 8),
        vx: -e.vx * 0.08 + rand(-10, 10),
        vy: -e.vy * 0.08 + rand(-10, 10),
        rot: rand(-1, 1), vr: rand(-3, 3),
        life: rand(0.16, 0.4), maxLife: 0.4,
        size: rand(5, 10), color: "rgba(116,39,77,.45)",
      });
    }
    if (bounced && e.bounceCooldown <= 0) {
      e.bounceCooldown = 0.1;
      e.bounceFlash = 1;
      e.bounceCount = (e.bounceCount || 0) + 1;
      shake = Math.max(shake, 3.2);
      sound.hit();
      particles.push({
        type: "ring", x: e.x, y: e.y, vx: 0, vy: 0,
        life: 0.22, maxLife: 0.22, size: 8, targetSize: 34,
        color: "rgba(135,47,88,.32)",
      });
    }

    if (dist2(e.x, e.y, player.x, player.y) < (e.radius + player.radius + 1) ** 2 && player.invuln <= 0) {
      damagePlayer(1);
    }
  }

  function finalBossRoar(e) {
    for (let wave = 0; wave < 3; wave++) {
      particles.push({
        type: "ring", x: e.x, y: e.y, vx: 0, vy: 0,
        life: 0.32 + wave * 0.12, maxLife: 0.32 + wave * 0.12,
        size: 24 + wave * 10, targetSize: 190 + wave * 70,
        color: wave % 2 ? "rgba(204,72,54,.5)" : "rgba(210,163,54,.55)",
      });
    }
    for (let i = 0; i < 30; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(55, 230);
      particles.push({
        type: "glyph", char: choose(["吼", "！", "审", "!"]),
        x: e.x, y: e.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(0, 60),
        rot: rand(-1, 1), vr: rand(-6, 6),
        life: rand(0.42, 0.95), maxLife: 0.95,
        size: rand(14, 30),
        color: i % 3 === 0 ? "#f2cf70" : i % 2 ? "#b23f35" : "#7d315f",
      });
    }
    for (let i = 0; i < 24; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(75, 300);
      particles.push({
        type: "spark", x: e.x, y: e.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: rand(0.18, 0.5), maxLife: 0.5,
        size: rand(1.2, 3.2),
        color: i % 2 ? "rgba(214,77,49,.9)" : "rgba(245,201,91,.9)",
      });
    }
    floaters.push({
      x: e.x, y: e.y - 62, text: "吼——",
      life: 1.05, maxLife: 1.05, color: "#a33b2d", size: 34,
    });
    e.finalShieldFlash = 0.45;
    finalBossFlash = Math.max(finalBossFlash, 0.5);
    shake = Math.max(shake, 21);
    sound.roar();
    showToast("终审咆哮", "无敌即将解除，它要开始攻击了。", "warn");
  }

  function moveFinalBoss(e, dx, dy) {
    e.x = clamp(e.x + dx, ARENA.left + e.radius, ARENA.right - e.radius);
    e.y = clamp(e.y + dy, ARENA.top + e.radius, ARENA.bottom - e.radius);
  }

  function advanceFinalBossText(e) {
    e.finalTextIndex = ((e.finalTextIndex || 0) + 1) % FINAL_BOSS_LINES.length;
  }

  function updateFinalBoss(e, dt) {
    e.finalShieldFlash = Math.max(0, (e.finalShieldFlash || 0) - dt);
    if (e.finalInvulnerable && !e.finalRoared && e.finalTimer <= 0.55) {
      e.finalRoared = true;
      finalBossRoar(e);
    }
    e.finalAddTimer = (e.finalAddTimer ?? 5) - dt;
    if (e.finalAddTimer <= 0) {
      e.finalAddTimer = 5;
      const minions = enemies.filter((other) => other !== e && !other.finalBoss && !other.gold).length;
      if (minions < 3) {
        spawnEnemy(choose(["comma", "question", "semicolon", "exclamation"]));
        showToast("终审增援", "修订框又拖来了一个随机小标点。", "warn");
        sound.rare();
      }
    }

    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    e.turretAngle = Math.atan2(dy, dx);
    e.finalTimer = (e.finalTimer || 0) - dt;

    if (e.finalCharge > 0) {
      e.finalCharge -= dt;
      const step = e.speed * 4.4 * dt;
      moveFinalBoss(e, Math.cos(e.finalChargeAngle) * step, Math.sin(e.finalChargeAngle) * step);
    } else if (e.finalTimer <= 0) {
      e.finalTimer = rand(1.35, 2.05);
      const action = choose(["random", "aim", "charge"]);
      e.finalInvulnerable = false;
      if (action === "random") {
        advanceFinalBossText(e);
        for (let i = 0; i < 10; i++) {
          spawnBullet(e.x, e.y, rand(0, Math.PI * 2), 178, false, {
            radius: 3.7, color: "#9a3150", life: 3.8, boss: true,
          });
        }
        shake = Math.max(shake, 4);
        sound.enemyShoot();
      } else if (action === "aim") {
        advanceFinalBossText(e);
        const base = Math.atan2(dy, dx);
        for (const offset of [-0.2, -0.1, 0, 0.1, 0.2]) {
          spawnBullet(e.x, e.y, base + offset, 255, false, {
            radius: 3.8, color: "#a52f43", life: 3.6, boss: true,
          });
        }
        shake = Math.max(shake, 5);
        sound.enemyShoot();
      } else {
        e.finalCharge = 0.58;
        e.finalChargeAngle = Math.atan2(dy, dx);
        shake = Math.max(shake, 8);
        sound.hit();
      }
    } else {
      let desired;
      if (dist > 270) desired = Math.atan2(dy, dx);
      else if (dist < 170) desired = Math.atan2(-dy, -dx);
      else desired = Math.atan2(dy, dx) + e.finalOrbitDir * 1.1;
      moveFinalBoss(e, Math.cos(desired) * e.speed * 0.82 * dt, Math.sin(desired) * e.speed * 0.82 * dt);
    }

    if (dist < e.radius + player.radius + 2 && player.invuln <= 0) {
      damagePlayer(1);
      if (e.finalCharge <= 0) {
        const away = Math.atan2(e.y - player.y, e.x - player.x);
        moveFinalBoss(e, Math.cos(away) * 24, Math.sin(away) * 24);
      }
    }
  }

  function enemyFullyInside(e) {
    return e.x - e.radius >= ARENA.left &&
      e.x + e.radius <= ARENA.right &&
      e.y - e.radius >= ARENA.top &&
      e.y + e.radius <= ARENA.bottom;
  }

  function updateEnemyEntry(e, dt) {
    // Before the collision box is completely inside, the only allowed action
    // is a straight walk to the nearest interior point. No AI, firing, contact
    // or bounce behavior runs during this phase.
    const inset = e.radius + 6;
    const targetX = clamp(e.x, ARENA.left + inset, ARENA.right - inset);
    const targetY = clamp(e.y, ARENA.top + inset, ARENA.bottom - inset);
    let dx = targetX - e.x;
    let dy = targetY - e.y;
    if (Math.hypot(dx, dy) < 0.5) {
      dx = (ARENA.left + ARENA.right) / 2 - e.x;
      dy = (ARENA.top + ARENA.bottom) / 2 - e.y;
    }
    const distance = Math.hypot(dx, dy) || 1;
    const entrySpeed = e.finalBoss ? e.speed * 0.55 : e.speed * 1.15;
    const step = Math.min(distance, entrySpeed * dt);
    e.x += (dx / distance) * step;
    e.y += (dy / distance) * step;
    e.turretAngle = Math.atan2(dy, dx);
  }

  function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (!e) continue;
      e.flash = Math.max(0, e.flash - dt);
      if (e.spawnT > 0) {
        e.spawnT = Math.max(0, e.spawnT - dt);
        e.turretAngle = e.bracket
          ? Math.atan2(player.y - e.y, player.x - e.x)
          : e.bouncer
            ? Math.atan2(e.vy || 0, e.vx || 1)
            : cardinalAim(player.x - e.x, player.y - e.y).angle;
        continue;
      }
      if (!enemyFullyInside(e)) {
        updateEnemyEntry(e, dt);
        continue;
      }
      e.x = clamp(e.x, ARENA.left + e.radius, ARENA.right - e.radius);
      e.y = clamp(e.y, ARENA.top + e.radius, ARENA.bottom - e.radius);
      if (e.finalBoss) {
        updateFinalBoss(e, dt);
        continue;
      }
      if (e.gold) {
        updateGoldEnemy(e, dt);
        continue;
      }
      if (e.bracket) {
        updateBracketEnemy(e, dt);
        continue;
      }
      if (e.bouncer) {
        updateBounceBoss(e, dt);
        continue;
      }

      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      const targetAngle = Math.atan2(dy, dx);
      const los = !lineBlocked(e.x, e.y, player.x, player.y);
      const aim = cardinalAim(dx, dy);
      let desiredAngle = targetAngle;
      let desiredSpeed = e.speed;

      if (e.boss) {
        // The long sentence hunts: quick, frequent repositioning rather than
        // standing at a polite distance like the smaller marks.
        e.bossSeekTimer -= dt;
        if (e.bossSeekTimer <= 0) {
          e.bossSeekTimer = rand(0.45, 0.95);
          e.bossOrbitDir = Math.random() < 0.5 ? -1 : 1;
          e.bossOrbitRadius = rand(145, 285);
        }
        if (!los || dist > 380) {
          desiredAngle = targetAngle;
          desiredSpeed = e.speed * 1.18;
        } else {
          const radial = Math.atan2(e.y - player.y, e.x - player.x);
          const orbitAngle = radial + e.bossOrbitDir * 0.7;
          const targetX = player.x + Math.cos(orbitAngle) * e.bossOrbitRadius;
          const targetY = player.y + Math.sin(orbitAngle) * e.bossOrbitRadius;
          desiredAngle = Math.atan2(targetY - e.y, targetX - e.x);
          desiredSpeed = e.speed;
        }
      } else if (e.range > 0) {
        if (!los) {
          desiredAngle = targetAngle;
        } else {
          const preferred = clamp(e.range * (e.key === "semicolon" ? 0.7 : 0.56), 128, 318);
          const sway = Math.sin(animationTime * 0.75 + e.seed) * (e.sniper ? 3 : 8);
          if (aim.axis === "x") {
            const side = Math.sign(dx) || e.strafeDir;
            const targetX = player.x - side * preferred;
            const targetY = player.y + sway;
            desiredAngle = Math.atan2(targetY - e.y, targetX - e.x);
            desiredSpeed *= Math.hypot(targetX - e.x, targetY - e.y) < 12 ? 0.18 : 0.72;
          } else {
            const side = Math.sign(dy) || e.strafeDir;
            const targetY = player.y - side * preferred;
            const targetX = player.x + sway;
            desiredAngle = Math.atan2(targetY - e.y, targetX - e.x);
            desiredSpeed *= Math.hypot(targetX - e.x, targetY - e.y) < 12 ? 0.18 : 0.72;
          }
        }
      } else if (dist < 31) {
        desiredSpeed *= 0.18;
      }

      e.strafeTimer -= dt;
      if (e.strafeTimer <= 0) {
        e.strafeDir *= -1;
        e.strafeTimer = rand(1.6, 3.8);
      }

      if (e.avoidT > 0) {
        e.avoidT -= dt;
        desiredAngle = targetAngle + (Math.PI / 2) * e.avoidDir * 1.15;
        desiredSpeed *= 1.05;
      }

      // local wall avoidance: try mild turns before resigning to a collision
      if (blockedAhead(e.x, e.y, desiredAngle, 28, e.radius)) {
        const turns = [0.55, -0.55, 1.02, -1.02, 1.48, -1.48];
        for (const turn of turns) {
          if (!blockedAhead(e.x, e.y, desiredAngle + turn, 31, e.radius)) {
            desiredAngle += turn;
            break;
          }
        }
      }

      let sepX = 0, sepY = 0;
      for (const other of enemies) {
        if (other === e) continue;
        const ox = e.x - other.x;
        const oy = e.y - other.y;
        const d = Math.hypot(ox, oy);
        const minD = e.radius + other.radius + 12;
        if (d > 0.01 && d < minD) {
          const push = (minD - d) / minD;
          sepX += (ox / d) * push * 85;
          sepY += (oy / d) * push * 85;
        }
      }

      const wobble = Math.sin(animationTime * 1.15 + e.seed) * 0.045;
      const vx = Math.cos(desiredAngle + wobble) * desiredSpeed + sepX;
      const vy = Math.sin(desiredAngle + wobble) * desiredSpeed + sepY;
      const collided = moveWithWalls(e, vx * dt, vy * dt, e.radius);
      if (collided) {
        if (e.avoidT <= 0) {
          e.avoidT = rand(0.36, 0.7);
          e.avoidDir = Math.random() < 0.5 ? -1 : 1;
        }
      }

      e.turretAngle = e.charge > 0 ? e.chargeAngle : aim.angle;
      updateEnemyFire(e, dt, dist, los, aim);

      if (dist < e.radius + player.radius + 1 && player.invuln <= 0) {
        damagePlayer(1);
        if (!e.boss) {
          const pushAngle = Math.atan2(e.y - player.y, e.x - player.x);
          moveWithWalls(e, Math.cos(pushAngle) * 18, Math.sin(pushAngle) * 18, e.radius);
        }
        if (e.key === "comma" && mode !== MODE.DYING) {
          destroyEnemy(e, false);
        }
      }
    }
  }

  function updateEnemyFire(e, dt, dist, los, aim) {
    if (e.x < ARENA.left || e.x > ARENA.right || e.y < ARENA.top || e.y > ARENA.bottom) return;
    e.fireTimer -= dt;

    if (e.charge > 0) {
      e.charge -= dt;
      e.turretAngle = e.chargeAngle;
      if (e.charge <= 0) {
        const muzzle = enemyMuzzle(e, e.chargeDir);
        spawnBullet(
          muzzle.x, muzzle.y, e.chargeAngle,
          e.bulletSpeed || 300, false,
          { radius: 3.1, color: RED_BRIGHT, life: 3 }
        );
        sound.enemyShoot();
        shake = Math.max(shake, 3.5);
      }
      return;
    }

    if (!e.fireRate || dist > e.range || !los) return;
    const aligned = e.boss || axialGap(e, aim) < (e.sniper ? 12 : e.key === "exclamation" ? 23 : 19);

    if (e.boss) {
      if (e.fireTimer > 0) return;
      e.patternIndex += 1;
      if (e.patternIndex % 2 === 1) {
        const cross = [FIRE_DIRS.KeyI, FIRE_DIRS.KeyJ, FIRE_DIRS.KeyK, FIRE_DIRS.KeyL];
        for (const dir of cross) {
          for (const offset of [-4, 4]) {
            const px = -dir.y, py = dir.x;
            const x = e.x + dir.x * (e.radius + 6) + px * offset;
            const y = e.y + dir.y * (e.radius + 6) + py * offset;
            spawnBullet(x, y, dir.angle, 112 + wave * 2, false, {
              radius: 3.5, color: "#9b2c20", life: 3.4, boss: true,
            });
          }
        }
      } else {
        const px = -aim.y, py = aim.x;
        for (const offset of [-9, 0, 9]) {
          const x = e.x + aim.x * (e.radius + 6) + px * offset;
          const y = e.y + aim.y * (e.radius + 6) + py * offset;
          spawnBullet(x, y, aim.angle, (e.bulletSpeed || 155) + wave * 2, false, {
            radius: 3.7, color: "#8d291f", life: 3.2, boss: true,
          });
        }
      }
      // 70% of the boss's old firing frequency: same patterns, longer breath.
      e.fireTimer = enemyFireDelay(Math.max(1.15, e.fireRate - wave * 0.025) / 0.7);
      sound.enemyShoot();
      shake = Math.max(shake, 4);
      return;
    }

    if (e.fireTimer > 0 || !aligned) return;

    if (e.sniper) {
      e.charge = 0.68;
      e.chargeAngle = aim.angle;
      e.chargeDir = { x: aim.x, y: aim.y, angle: aim.angle, axis: aim.axis };
      e.fireTimer = enemyFireDelay(e.fireRate * rand(0.88, 1.12));
      return;
    }

    const spread = e.spread || 1;
    for (let i = 0; i < spread; i++) {
      const offset = spread === 1 ? 0 : (i - (spread - 1) / 2) * 8;
      const muzzle = enemyMuzzle(e, aim, offset);
      spawnBullet(
        muzzle.x, muzzle.y, aim.angle, e.bulletSpeed || 170, false,
        { radius: e.key === "exclamation" ? 3.6 : 3.1, color: e.key === "exclamation" ? "#b53a29" : RED }
      );
    }
    e.fireTimer = enemyFireDelay(e.fireRate * rand(0.86, 1.17));
    sound.enemyShoot();
  }

  function goldBurst(x, y, scale = 1) {
    for (let i = 0; i < 18; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(40, 170) * scale;
      particles.push({
        type: "glyph", char: i % 3 === 0 ? "¶" : "·",
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(10, 50),
        rot: rand(-1, 1), vr: rand(-4, 4),
        life: rand(0.35, 0.85), maxLife: 0.85,
        size: rand(10, 18) * scale,
        color: i % 3 === 0 ? "rgba(200,154,48,.95)" : "rgba(170,119,31,.8)",
      });
    }
    particles.push({
      type: "ring", x, y, vx: 0, vy: 0,
      life: 0.38, maxLife: 0.38,
      size: 8 * scale, targetSize: 52 * scale,
      color: "rgba(192,143,39,.45)",
    });
  }

  function escapeGoldEnemy(e) {
    const idx = enemies.indexOf(e);
    if (idx < 0) return;
    enemies.splice(idx, 1);
    goldBurst(e.x, e.y, 0.9);
    floaters.push({
      x: e.x, y: e.y - 28, text: "金色格式符逃走了",
      life: 1.2, maxLife: 1.2, color: "#a57a1d", size: 10,
    });
    showToast("金色格式符逃走了", "它没有留下格式碎片，下次再试。", "warn");
    sound.escape();
  }

  function collectFormatFragment(x, y) {
    formatFragments = Math.min(3, formatFragments + 1);
    floaters.push({
      x, y: y - 20,
      text: `格式碎片 ${formatFragments}/3`,
      life: 1.45, maxLife: 1.45, color: "#a87818", size: 11,
    });
    updateFragmentHud(true);
    if (formatFragments >= 3) {
      formatFragments = 0;
      bonusRewardCharges += 1;
      updateFragmentHud(true);
      showToast("格式碎片已集齐", "额外格式奖励已解锁，马上打开格式窗口。", "");
    } else {
      showToast("获得格式碎片", `格式碎片 ${formatFragments}/3。集满三张可额外选择一次格式。`, "");
    }
  }

  function dropFormatFragmentPickup(x, y) {
    pickups.push({
      x, y,
      vx: 0, vy: 0,
      radius: 14.5, kind: "fragment", persistent: true,
      seed: rand(0, 10),
    });
  }

  function dropElitePickup(x, y) {
    pickups.push({
      x, y,
      vx: 0, vy: 0,
      radius: 14.5, kind: "heal", life: 7, maxLife: 7,
      seed: rand(0, 10),
    });
  }

  function updatePickups(dt) {
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      if (p.persistent) {
        p.life = 0;
      } else {
        p.life -= dt;
        if (p.life <= 0) { pickups.splice(i, 1); continue; }
      }
      p.vx *= Math.pow(0.018, dt);
      p.vy *= Math.pow(0.018, dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.x = clamp(p.x, ARENA.left + 14, ARENA.right - 14);
      p.y = clamp(p.y, ARENA.top + 14, ARENA.bottom - 14);
      const dx = player.x - p.x;
      const dy = player.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      const canCollect = p.kind === "fragment" || player.hp < player.maxHp;
      if (canCollect && d < 112) {
        p.x += (dx / d) * 82 * dt;
        p.y += (dy / d) * 82 * dt;
      }
      if (canCollect && d < player.radius + p.radius) {
        pickups.splice(i, 1);
        if (p.kind === "fragment") {
          collectFormatFragment(p.x, p.y);
          sound.rare();
        } else {
          player.hp = Math.min(player.maxHp, player.hp + 1);
          player.ringFlash = 0.4;
          handleHealPickup();
          floaters.push({
            x: player.x, y: player.y - 27, text: "+1 修订",
            life: 1.1, maxLife: 1.1, color: "#2b62bb", size: 10,
          });
          sound.heal();
          updateHud();
        }
      }
    }
  }

  function damageEnemy(e, amount, hitX, hitY) {
    if (!e || e.spawnT > 0) return;
    if (e.finalBoss && e.finalInvulnerable) {
      e.finalShieldFlash = 0.18;
      spawnHitSparks(hitX ?? e.x, hitY ?? e.y, false);
      return;
    }
    e.hp -= amount * playerDamageMultiplier();
    e.flash = 0.16;
    shake = Math.max(shake, 1.5);
    spawnHitSparks(hitX ?? e.x, hitY ?? e.y, !!e.boss);
    sound.hit();
    if (e.hp <= 0) destroyEnemy(e, true);
  }

  function destroyEnemy(e, credited) {
    const idx = enemies.indexOf(e);
    if (idx < 0) return;
    enemies.splice(idx, 1);
    if (credited) handleDefeatedEnemy(e);
    if (credited && e.finalBoss) {
      // The final boss takes the whole page with it: all summoned minions die
      // immediately so the victory screen cannot be delayed by stragglers.
      for (const other of enemies.slice()) {
        if (!other.finalBoss) destroyEnemy(other, true);
      }
      finalVictoryDelay = 1.8;
      finalBossFlash = 1;
      bullets = bullets.filter((b) => b.fromPlayer);
      player.invuln = Math.max(player.invuln, 2);
    }
    if (credited && e.elite && Math.random() < 0.5) dropElitePickup(e.x, e.y);
    if (e.gold) {
      if (credited) {
        stats.kills += 1;
        dropFormatFragmentPickup(e.x, e.y);
      }
      goldBurst(e.x, e.y, 1.1);
      sound.explode(false);
      updateHud();
      return;
    }
    waveKills += 1;
    if (credited) {
      stats.kills += 1;
      combo = comboTimer > 0 ? combo + 1 : 1;
      comboTimer = 2.5;
      const multiplier = Math.min(3, 1 + Math.floor((combo - 1) / 2));
      const gained = Math.round(e.wordValue * multiplier);
      stats.words += gained;
      floaters.push({
        x: e.x, y: e.y - e.radius - 8,
        text: `+${gained} 词${multiplier > 1 ? `  ×${multiplier}` : ""}`,
        life: 1.25, maxLife: 1.25,
        color: multiplier > 1 ? RED : "#77716a",
        size: e.boss ? 12 : 9.5,
      });
      if (e.boss) {
        showToast(
          e.finalBoss ? "终审修订框已拆解" : e.bouncer ? "邮件符已拆解" : e.bracket ? "方括号已拆解" : "长句已拆解",
          e.finalBoss ? "全文终于可以定稿了。" : `这一段的 ${fmt(gained)} 个词终于能读通了。`,
          ""
        );
        shake = Math.max(shake, 18);
      }
    }
    if (e.finalBoss) {
      finalBossExplosion(e.x, e.y);
    } else {
      explosion(e.x, e.y, e.boss ? 2.3 : 0.95, e.boss ? "boss" : "enemy", e);
      sound.explode(!!e.boss);
    }
    updateHud();
  }

  /* ---------------- bullets / particles ---------------- */
  function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.prevX = b.x;
      b.prevY = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      if (b.life <= 0 || b.x < ARENA.left || b.x > ARENA.right || b.y < ARENA.top || b.y > ARENA.bottom) {
        bullets.splice(i, 1);
        continue;
      }

      let hitWall = false;
      for (const w of walls) {
        if (pointInRect(b.x, b.y, w, b.radius)) {
          w.flash = 1;
          spawnHitSparks(b.x, b.y, false);
          hitWall = true;
          break;
        }
      }
      if (hitWall) {
        bullets.splice(i, 1);
        continue;
      }

      if (b.fromPlayer) {
        let consumed = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
          const e = enemies[j];
          if (e.spawnT > 0) continue;
          if (dist2(b.x, b.y, e.x, e.y) < (e.radius + b.radius) ** 2) {
            bullets.splice(i, 1);
            damageEnemy(e, b.damage, b.x, b.y);
            if (b.rocket) explodeRocket(b.x, b.y, e);
            consumed = true;
            break;
          }
        }
        if (consumed) continue;
      } else {
        if (player.backShieldWidth > 0) {
          const back = aimAngle + Math.PI;
          const bx = Math.cos(back);
          const by = Math.sin(back);
          const along = (b.x - player.x) * bx + (b.y - player.y) * by;
          const lateral = -(b.x - player.x) * by + (b.y - player.y) * bx;
          const incoming = b.vx * bx + b.vy * by < 0;
          if (incoming && along > 5 && along < 24 && Math.abs(lateral) < player.backShieldWidth / 2 + b.radius) {
            bullets.splice(i, 1);
            player.shieldFlash = 0.22;
            spawnHitSparks(b.x, b.y, false);
            sound.shieldBlock();
            continue;
          }
        }
        if (dist2(b.x, b.y, player.x, player.y) < (player.radius + b.radius) ** 2) {
          bullets.splice(i, 1);
          damagePlayer(1);
          spawnHitSparks(b.x, b.y, false);
        }
      }
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      if (p.type === "glyph") {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 19 * dt;
        p.vx *= Math.pow(0.3, dt);
        p.rot += p.vr * dt;
      } else if (p.type === "spark") {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= Math.pow(0.1, dt);
        p.vy *= Math.pow(0.1, dt);
      }
    }
    if (particles.length > 330) particles.splice(0, particles.length - 330);
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.life -= dt;
      f.y -= 18 * dt;
      if (f.life <= 0) floaters.splice(i, 1);
    }
  }

  function spawnHitSparks(x, y, big) {
    const n = big ? 10 : 5;
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const speed = rand(35, 125);
      particles.push({
        type: "spark", x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: rand(0.12, 0.32), maxLife: 0.32,
        size: rand(0.8, 2.2),
        color: i % 3 === 0 ? "rgba(44,93,180,.85)" : "rgba(171,55,42,.8)",
      });
    }
  }

  function explosion(x, y, scale = 1, kind = "enemy", source = null) {
    const glyphs = source && source.boss ? ["…", "…", "。", "？", "；"] : ["、", "。", "，", "；", "？", "！", "·"];
    const count = kind === "boss" ? 18 : kind === "player" ? 16 : 8;
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const speed = rand(35, 145) * scale;
      particles.push({
        type: "glyph",
        char: choose(glyphs),
        x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - rand(0, 48),
        rot: rand(-1, 1), vr: rand(-4, 4),
        life: rand(0.35, 0.9), maxLife: 0.9,
        size: rand(11, 19) * (kind === "boss" ? 1.2 : 1),
        color: i % 4 === 0 ? "rgba(42,82,155,.8)" : "rgba(75,64,53,.75)",
      });
    }
    for (let i = 0; i < Math.round(13 * scale); i++) {
      const a = rand(0, Math.PI * 2);
      const speed = rand(45, 220) * scale;
      particles.push({
        type: "spark", x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: rand(0.12, 0.38), maxLife: 0.38,
        size: rand(1, 2.6) * scale,
        color: i % 3 === 0 ? "rgba(43,90,171,.8)" : "rgba(166,48,36,.88)",
      });
    }
    particles.push({
      type: "ring", x, y,
      vx: 0, vy: 0,
      life: 0.32, maxLife: 0.32,
      size: 10 * scale, targetSize: 52 * scale,
      color: "rgba(172,61,45,.32)",
    });
    if (particles.length > 330) particles.splice(0, particles.length - 330);
  }

  function finalBossExplosion(x, y) {
    const palette = ["#f0c45a", "#d96b3f", "#a63b74", "#6b4b9c", "#fff1c7"];
    for (let wave = 0; wave < 5; wave++) {
      particles.push({
        type: "ring", x, y, vx: 0, vy: 0,
        life: 0.42 + wave * 0.13, maxLife: 0.42 + wave * 0.13,
        size: 12 + wave * 8, targetSize: 150 + wave * 58,
        color: wave % 2 ? "rgba(214,100,54,.48)" : "rgba(190,142,38,.5)",
      });
    }
    for (let i = 0; i < 92; i++) {
      const a = rand(0, Math.PI * 2);
      const speed = rand(90, 430);
      particles.push({
        type: "spark", x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: rand(0.28, 0.95), maxLife: 0.95,
        size: rand(1.2, 4.2),
        color: palette[i % palette.length],
      });
    }
    const glyphs = ["✓", "终", "审", "！", "×", "¶", "…", "—"];
    for (let i = 0; i < 36; i++) {
      const a = rand(0, Math.PI * 2);
      const speed = rand(55, 245);
      particles.push({
        type: "glyph",
        char: glyphs[i % glyphs.length],
        x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - rand(20, 110),
        rot: rand(-1.4, 1.4), vr: rand(-7, 7),
        life: rand(0.8, 1.9), maxLife: 1.9,
        size: rand(14, 34),
        color: i % 5 === 0 ? "#f7df9c" : i % 3 === 0 ? "#a53c5d" : "#7b4b91",
      });
    }
    floaters.push({
      x, y: y - 72, text: "终审通过",
      life: 2.2, maxLife: 2.2, color: "#b37b18", size: 30,
    });
    floaters.push({
      x, y: y - 42, text: "全部修订成功",
      life: 2.05, maxLife: 2.05, color: "#9a4c2f", size: 14,
    });
    if (particles.length > 330) particles.splice(0, particles.length - 330);
    shake = Math.max(shake, 32);
    finalBossFlash = 1;
    sound.explode(true);
    sound.rare();
  }

  /* ---------------- game update ---------------- */
  function updateWorld(dt) {
    if (!player) return;
    if (mode === MODE.DYING) {
      dyingTimer -= dt;
      updateParticles(dt);
      shake *= Math.pow(0.04, dt);
      hitFlash = Math.max(0, hitFlash - dt * 1.6);
      if (dyingTimer <= 0) gameOver();
      return;
    }
    if (mode !== MODE.PLAYING) return;

    stats.elapsed += dt;
    comboTimer = Math.max(0, comboTimer - dt);
    if (comboTimer === 0) combo = 0;
    shake *= Math.pow(0.018, dt);
    hitFlash = Math.max(0, hitFlash - dt * 2.2);
    finalVictoryDelay = Math.max(0, finalVictoryDelay - dt);
    finalBossFlash = Math.max(0, finalBossFlash - dt * 1.8);
    for (const w of walls) w.flash = Math.max(0, w.flash - dt * 4);

    updatePlayer(dt);
    updatePlayerUpgrades(dt);
    updateFinalIntro(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updatePickups(dt);
    updateParticles(dt);
    updateWave(dt);
    updateRareSpawn();

    if (mode === MODE.PLAYING && bonusRewardCharges > 0 && styleRewardWindow.hidden && finalVictoryDelay <= 0 && !finalIntroActive) {
      bonusRewardCharges -= 1;
      openStyleReward("fragments");
      return;
    }

    // update word count gently, like Word recalculating as you type
    const target = stats.words;
    if (Math.abs(displayWords - target) < 0.7) displayWords = target;
    else displayWords = lerp(displayWords, target, Math.min(1, dt * 7));
    const rounded = Math.round(displayWords);
    if (rounded !== lastHudWords) {
      lastHudWords = rounded;
      wordCountEl.textContent = fmt(rounded);
    }
  }

  function updateWave(dt) {
    if (wavePhase === "intermission") {
      intermission -= dt;
      if (intermission <= 0 && mode === MODE.PLAYING) startWave(wave + 1);
      return;
    }
    if (wavePhase === "spawning") {
      spawnTimer -= dt;
      const active = enemies.length;
      if (spawnQueue.length && spawnTimer <= 0 && active < maxActiveEnemies()) {
        const key = spawnQueue.shift();
        spawnEnemy(key);
        waveSpawned += 1;
        if (!["ellipsis", "__bracket_pair", "__at_boss", "__final_boss"].includes(key)) {
          waveSmallSpawned += 1;
        }
        spawnTimer = Math.max(0.48, 1.1 - wave * 0.045);
      }
      if (!spawnQueue.length) wavePhase = "active";
    }
    if ((wavePhase === "active" || wavePhase === "spawning") && !spawnQueue.length && enemies.length === 0 && !finalIntroActive && finalVictoryDelay <= 0) {
      completeWave();
    }
  }

  /* ---------------- HUD ---------------- */
  function updateHud() {
    if (!player) return;
    pageNoEl.textContent = "1";
    waveNoEl.textContent = String(wave);
    updatePageHint();
    updateDamageMeter();
    const inReading = mode === MODE.READING;
    const bad = !inReading && player.hp < player.maxHp;
    proofingStatus.classList.toggle("bad", bad);
    proofingText.textContent = inReading
      ? "校对：无问题"
      : bad
        ? `校对：${player.maxHp - player.hp} 处待处理`
        : "校对：无问题";
    if (mode !== MODE.READING && Math.round(displayWords) !== lastHudWords) {
      lastHudWords = Math.round(displayWords);
      wordCountEl.textContent = fmt(displayWords);
    }
  }

  function showToast(title, text, kind = "") {
    toastTitle.textContent = title;
    toastText.textContent = text;
    toastEl.classList.remove("warn", "danger");
    if (kind) toastEl.classList.add(kind);
    toastEl.classList.add("show");
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => toastEl.classList.remove("show"), 3000);
  }

  function showWaveStamp(text) {
    waveStampText.textContent = text;
    waveStamp.classList.remove("show");
    // restart CSS animation
    void waveStamp.offsetWidth;
    waveStamp.classList.add("show");
  }

  /* ---------------- drawing ---------------- */
  function drawWavyLine(x1, x2, y, amplitude, color, width = 1.1, phase = 0) {
    const length = x2 - x1;
    if (length <= 0) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    const step = 2.2;
    for (let x = 0; x <= length; x += step) {
      const yy = y + Math.sin((x / 3.7) * Math.PI + phase) * amplitude;
      if (x === 0) ctx.moveTo(x1 + x, yy);
      else ctx.lineTo(x1 + x, yy);
    }
    ctx.stroke();
    ctx.restore();
  }

  function roundRectPath(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawWalls() {
    for (const w of walls) {
      ctx.save();
      const flash = w.flash || 0;
      const hue = w.hue ?? 47;
      const sat = w.sat ?? 94;
      const light = w.light ?? 60;
      const grad = ctx.createLinearGradient(w.x, w.y, w.x, w.y + w.h);
      grad.addColorStop(0, `hsla(${hue}, ${sat}%, ${Math.min(88, light + 13)}%, ${0.56 + flash * 0.17})`);
      grad.addColorStop(0.55, `hsla(${hue}, ${sat}%, ${Math.min(90, light + 5)}%, ${0.46 + flash * 0.16})`);
      grad.addColorStop(1, `hsla(${hue}, ${sat}%, ${Math.max(24, light - 8)}%, ${0.38 + flash * 0.18})`);
      ctx.fillStyle = grad;
      roundRectPath(w.x, w.y, w.w, w.h, 2);
      ctx.fill();
      ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${Math.max(20, light - 26)}%, ${0.43 + flash * 0.28})`;
      ctx.lineWidth = 0.9;
      roundRectPath(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1, 2);
      ctx.stroke();
      // slight marker-cap at both ends
      ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${Math.max(22, light - 18)}%, ${0.5 + flash * 0.3})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(w.x + 1.2, w.y + 4);
      ctx.lineTo(w.x + 1.2, w.y + w.h - 4);
      ctx.moveTo(w.x + w.w - 1.2, w.y + 3.5);
      ctx.lineTo(w.x + w.w - 1.2, w.y + w.h - 3);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawSniperLines() {
    if (mode !== MODE.PLAYING && mode !== MODE.PAUSED) return;
    for (const e of enemies) {
      if (e.charge <= 0) continue;
      const a = e.chargeAngle;
      const dx = Math.cos(a), dy = Math.sin(a);
      let distance = 700;
      for (let s = 20; s < 780; s += 8) {
        const x = e.x + dx * s, y = e.y + dy * s;
        if (x < ARENA.left || x > ARENA.right || y < ARENA.top || y > ARENA.bottom) { distance = s; break; }
        let blocked = false;
        for (const w of walls) {
          if (x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h) { blocked = true; break; }
        }
        if (blocked) { distance = s; break; }
      }
      ctx.save();
      ctx.globalAlpha = clamp(e.charge / 0.68, 0.1, 0.9);
      ctx.strokeStyle = "rgba(168,47,37,.55)";
      ctx.lineWidth = 0.9;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(e.x + dx * (e.radius + 3), e.y + dy * (e.radius + 3));
      ctx.lineTo(e.x + dx * distance, e.y + dy * distance);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(e.x + dx * distance, e.y + dy * distance, 3.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawBracketEnemy(e) {
    const bob = Math.sin(animationTime * 1.8 + e.seed) * 0.8;
    const flash = e.flash > 0;
    const alpha = e.spawnT > 0 ? clamp(1 - e.spawnT / 0.7, 0, 0.72) : 1;
    const half = e.bracketHalf || 31;
    const sideSign = e.side === "left" ? 1 : -1;
    const portX = sideSign * e.radius * 0.74;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(e.x, e.y + bob);

    const glow = ctx.createRadialGradient(0, 0, 6, 0, 0, half + 18);
    glow.addColorStop(0, "rgba(140,35,48,.18)");
    glow.addColorStop(0.68, "rgba(122,28,41,.06)");
    glow.addColorStop(1, "rgba(122,28,41,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, half + 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(126,31,44,.045)";
    roundRectPath(-18, -half - 5, 36, half * 2 + 10, 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(144,42,54,.25)";
    ctx.lineWidth = 0.8;
    ctx.stroke();

    const stemX = e.side === "left" ? -e.size * 0.18 : e.size * 0.18;
    const armX = stemX + (e.side === "left" ? e.size * 0.30 : -e.size * 0.30);
    const bracketPath = () => {
      ctx.beginPath();
      ctx.moveTo(armX, -half);
      ctx.lineTo(stemX, -half);
      ctx.lineTo(stemX, half);
      ctx.lineTo(armX, half);
    };
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";
    ctx.strokeStyle = "rgba(255,255,255,.94)";
    ctx.lineWidth = 9;
    bracketPath();
    ctx.stroke();
    ctx.strokeStyle = flash ? "#d44a3b" : "#5e1724";
    ctx.lineWidth = 5;
    bracketPath();
    ctx.stroke();

    for (const y of [-half, half]) {
      ctx.fillStyle = flash ? "rgba(238,92,70,.98)" : "rgba(142,37,50,.95)";
      ctx.beginPath();
      ctx.arc(portX, y, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.74)";
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }

    const label = e.side === "left" ? "左括号" : "右括号";
    ctx.font = `600 9px ${FONT_UI}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const labelW = ctx.measureText(label).width;
    ctx.fillStyle = "rgba(255,252,246,.94)";
    ctx.strokeStyle = "rgba(156,73,72,.55)";
    ctx.lineWidth = 0.8;
    roundRectPath(-labelW / 2 - 4, -half - 20, labelW + 8, 13, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(125,55,60,.95)";
    ctx.fillText(label, 0, -half - 13.5);

    const pct = clamp(e.hp / e.maxHp, 0, 1);
    ctx.fillStyle = "rgba(142,43,52,.17)";
    roundRectPath(-29, half + 7, 58, 1.8, 1);
    ctx.fill();
    ctx.fillStyle = "rgba(141,36,48,.82)";
    roundRectPath(-29, half + 7, 58 * pct, 1.8, 1);
    ctx.fill();
    ctx.restore();
  }

  function drawFinalBoss(e) {
    const boxW = 218;
    const boxH = 72;
    const alpha = e.spawnT > 0 ? clamp(1 - e.spawnT / 0.9, 0, 0.82) : 1;
    const charging = (e.finalCharge || 0) > 0;
    const invulnerable = !!e.finalInvulnerable;
    const shieldFlash = (e.finalShieldFlash || 0) > 0;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(e.x, e.y);

    const glow = ctx.createRadialGradient(0, 0, 8, 0, 0, 128);
    glow.addColorStop(0, charging
      ? "rgba(190,45,70,.2)"
      : invulnerable ? "rgba(192,148,35,.18)" : "rgba(112,38,82,.12)");
    glow.addColorStop(1, "rgba(112,38,82,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 128, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.shadowColor = "rgba(52,35,42,.22)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = flashTint(e) ? "#fff8f4" : "#fffdf9";
    roundRectPath(-boxW / 2, -boxH / 2, boxW, boxH, 8);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = shieldFlash
      ? "rgba(224,177,54,.98)"
      : charging ? "rgba(183,38,65,.95)" : invulnerable ? "rgba(184,143,39,.82)" : "rgba(142,45,86,.7)";
    ctx.lineWidth = shieldFlash ? 3.2 : charging ? 2.6 : invulnerable ? 2.2 : 1.8;
    roundRectPath(-boxW / 2, -boxH / 2, boxW, boxH, 8);
    ctx.stroke();

    if (invulnerable) {
      ctx.save();
      ctx.strokeStyle = `rgba(198,153,44,${0.34 + Math.sin(animationTime * 4.5) * 0.12})`;
      ctx.lineWidth = 1.1;
      ctx.setLineDash([5, 4]);
      roundRectPath(-boxW / 2 - 7, -boxH / 2 - 7, boxW + 14, boxH + 14, 10);
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = "rgba(115,38,82,.94)";
    roundRectPath(-boxW / 2, -boxH / 2, boxW, 20, 8);
    ctx.fill();
    ctx.fillStyle = "rgba(255,252,248,.96)";
    ctx.font = `600 10px ${FONT_UI}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("修订", -boxW / 2 + 10, -boxH / 2 + 10);
    ctx.textAlign = "right";
    ctx.fillText("终审 · 不接受修改", boxW / 2 - 10, -boxH / 2 + 10);

    ctx.fillStyle = "rgba(169,45,79,.9)";
    roundRectPath(-boxW / 2 + 9, -boxH / 2 + 28, 3, 31, 1.5);
    ctx.fill();

    const line = FINAL_BOSS_LINES[e.finalTextIndex || 0] || FINAL_BOSS_LINES[0];
    ctx.save();
    ctx.beginPath();
    ctx.rect(-boxW / 2 + 18, -boxH / 2 + 25, boxW - 36, 30);
    ctx.clip();
    ctx.font = `600 15px ${FONT_UI}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#453a3d";
    ctx.fillText(line, -boxW / 2 + 20, -boxH / 2 + 42);
    const textW = ctx.measureText(line).width;
    if (Math.sin(animationTime * 7) > 0) {
      ctx.fillStyle = "rgba(147,38,73,.8)";
      ctx.fillRect(-boxW / 2 + 24 + textW, -boxH / 2 + 34, 1.4, 16);
    }
    ctx.strokeStyle = "rgba(176,52,83,.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-boxW / 2 + 20, -boxH / 2 + 53);
    ctx.lineTo(-boxW / 2 + 20 + Math.min(textW, boxW - 44), -boxH / 2 + 53);
    ctx.stroke();
    ctx.restore();

    const label = invulnerable ? "终审修订框 · 准备中" : "终审修订框";
    ctx.font = `600 9px ${FONT_UI}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const labelW = ctx.measureText(label).width;
    ctx.fillStyle = "rgba(255,252,247,.96)";
    ctx.strokeStyle = "rgba(142,64,103,.55)";
    ctx.lineWidth = 0.8;
    roundRectPath(-labelW / 2 - 5, -boxH / 2 - 18, labelW + 10, 13, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(101,33,70,.96)";
    ctx.fillText(label, 0, -boxH / 2 - 11.5);

    if (invulnerable) {
      ctx.fillStyle = "rgba(142,103,29,.82)";
      ctx.font = `600 8.5px ${FONT_UI}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("无敌 · 准备中", 0, boxH / 2 + 11);
    } else {
      const pct = clamp(e.hp / e.maxHp, 0, 1);
      ctx.fillStyle = "rgba(120,46,86,.15)";
      roundRectPath(-boxW / 2 + 16, boxH / 2 + 9, boxW - 32, 2.2, 1);
      ctx.fill();
      ctx.fillStyle = "rgba(142,42,78,.88)";
      roundRectPath(-boxW / 2 + 16, boxH / 2 + 9, (boxW - 32) * pct, 2.2, 1);
      ctx.fill();
    }
    ctx.restore();
  }

  function flashTint(e) {
    return !!e && e.flash > 0;
  }

  function drawAtBoss(e) {
    const flash = e.flash > 0;
    const bounce = e.bounceFlash || 0;
    const alpha = e.spawnT > 0 ? clamp(1 - e.spawnT / 0.7, 0, 0.72) : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(e.x, e.y);

    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 48);
    glow.addColorStop(0, `rgba(126,39,83,${0.18 + bounce * 0.12})`);
    glow.addColorStop(0.64, "rgba(111,34,75,.07)");
    glow.addColorStop(1, "rgba(111,34,75,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(111,36,77,${0.4 + bounce * 0.35})`;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, e.radius + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const speed = Math.hypot(e.vx || 0, e.vy || 0) || 1;
    ctx.strokeStyle = "rgba(119,39,82,.28)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-(e.vx / speed) * 14, -(e.vy / speed) * 14);
    ctx.lineTo(-(e.vx / speed) * 42, -(e.vy / speed) * 42);
    ctx.stroke();

    ctx.font = `700 ${e.size}px "Times New Roman", "SimSun", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 7;
    ctx.strokeStyle = "rgba(255,255,255,.94)";
    ctx.strokeText("@", 0, 1);
    ctx.fillStyle = flash ? "#d95686" : "#642044";
    ctx.fillText("@", 0, 1);

    const label = "邮件符";
    ctx.font = `600 9px ${FONT_UI}`;
    const labelW = ctx.measureText(label).width;
    ctx.fillStyle = "rgba(255,252,247,.95)";
    ctx.strokeStyle = "rgba(142,64,103,.58)";
    ctx.lineWidth = 0.8;
    roundRectPath(-labelW / 2 - 4, -e.radius - 26, labelW + 8, 13, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(101,33,70,.95)";
    ctx.fillText(label, 0, -e.radius - 19.5);

    const pct = clamp(e.hp / e.maxHp, 0, 1);
    ctx.fillStyle = "rgba(120,46,86,.17)";
    roundRectPath(-29, e.radius + 8, 58, 1.8, 1);
    ctx.fill();
    ctx.fillStyle = "rgba(121,44,86,.84)";
    roundRectPath(-29, e.radius + 8, 58 * pct, 1.8, 1);
    ctx.fill();
    ctx.restore();
  }

  function drawEnemy(e) {
    if (!e) return;
    if (e.finalBoss) {
      drawFinalBoss(e);
      return;
    }
    if (e.gold) {
      drawGoldEnemy(e);
      return;
    }
    if (e.bracket) {
      drawBracketEnemy(e);
      return;
    }
    if (e.bouncer) {
      drawAtBoss(e);
      return;
    }
    ctx.save();
    if (e.spawnT > 0) {
      const blink = Math.sin(animationTime * 28) > 0;
      if (blink) {
        ctx.strokeStyle = "rgba(162,48,37,.7)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(e.x + 4, e.y - 12);
        ctx.lineTo(e.x + 4, e.y + 10);
        ctx.stroke();
      }
      ctx.globalAlpha = clamp(1 - e.spawnT / 0.7, 0, 0.75);
    } else {
      ctx.globalAlpha = 1;
    }
    const flash = e.flash > 0;
    const isBoss = e.key === "ellipsis";
    const size = e.size || 32;
    const glyph = e.glyph;
    const bob = Math.sin(animationTime * 2.2 + e.seed) * 0.5;

    ctx.translate(e.x, e.y + bob);
    const underlineY = size * 0.56 + 2;
    const underlineWidth = Math.min(isBoss ? 74 : 32, size * (e.maxHp > 1 ? 0.72 + 0.4 * (e.hp / e.maxHp) : 1));
    const yOff = isBoss ? 3 : 1;

    if (e.elite) {
      const eliteGlow = ctx.createRadialGradient(0, 0, 5, 0, 0, e.radius + 16);
      eliteGlow.addColorStop(0, "rgba(207,45,32,.21)");
      eliteGlow.addColorStop(0.65, "rgba(197,43,31,.09)");
      eliteGlow.addColorStop(1, "rgba(197,43,31,0)");
      ctx.fillStyle = eliteGlow;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius + 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(200,43,31,.8)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(0, 0, e.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = `700 8px ${FONT_UI}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255,255,255,.9)";
      ctx.strokeText("精英", 0, -e.radius - 11);
      ctx.fillStyle = "rgba(181,39,29,.98)";
      ctx.fillText("精英", 0, -e.radius - 11);
    }

    // a faint proofing tint makes the moving punctuation readable at a glance
    ctx.fillStyle = e.elite ? "rgba(193,45,33,.07)" : "rgba(179,56,41,.024)";
    roundRectPath(-(isBoss ? 44 : 21), -(isBoss ? 25 : 21), isBoss ? 88 : 42, isBoss ? 52 : 42, 2);
    ctx.fill();

    // the tank's “barrel” is a rotated proofing line
    if (e.range > 0 && !e.idle) {
      ctx.save();
      ctx.rotate(e.turretAngle);
      ctx.strokeStyle = flash ? "rgba(143,30,22,.98)" : "rgba(129,36,27,.9)";
      ctx.lineWidth = isBoss ? 3 : 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(e.radius + (isBoss ? 15 : 10), 0);
      ctx.stroke();
      ctx.fillStyle = "rgba(135,41,31,.92)";
      ctx.beginPath();
      ctx.arc(e.radius + (isBoss ? 15 : 10), 0, isBoss ? 3 : 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // a light halo separates the mobile punctuation from the article text
    ctx.font = `${size}px ${FONT_DOC}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = isBoss ? 6.5 : 5;
    ctx.strokeStyle = "rgba(255,255,255,.88)";
    ctx.strokeText(glyph, 0, yOff);
    ctx.fillStyle = flash
      ? "#d94836"
      : e.elite ? "#b72b20" : (isBoss ? "#4d1b17" : "#5a241d");
    ctx.fillText(glyph, 0, yOff);

    const wavyColor = e.elite
      ? (flash ? "rgba(226,66,46,1)" : "rgba(201,48,34,.98)")
      : (flash ? "rgba(204,45,30,1)" : "rgba(164,43,31,.96)");
    drawWavyLine(-underlineWidth / 2, underlineWidth / 2, underlineY, isBoss ? 1.9 : 1.35, wavyColor, isBoss ? 1.9 : 1.35, animationTime * 1.7 + e.seed);

    if (isBoss || e.maxHp > 2) {
      const pct = clamp(e.hp / e.maxHp, 0, 1);
      const barW = isBoss ? 74 : 24;
      const barY = underlineY + 3.5;
      ctx.fillStyle = "rgba(158,49,38,.18)";
      roundRectPath(-barW / 2, barY, barW, 1.6, 1);
      ctx.fill();
      ctx.fillStyle = "rgba(154,43,33,.75)";
      roundRectPath(-barW / 2, barY, barW * pct, 1.6, 1);
      ctx.fill();
    }

    if (isBoss) {
      ctx.font = `8.5px ${FONT_UI}`;
      ctx.fillStyle = "rgba(142,66,55,.8)";
      ctx.fillText("长句", 0, -28);
    }
    ctx.restore();
  }

  function drawGoldEnemy(e) {
    const bob = Math.sin(animationTime * 2.2 + e.seed) * 0.8;
    const urgent = e.fleeTimer < 2.4;
    const flash = e.flash > 0;
    const alpha = e.spawnT > 0 ? clamp(1 - e.spawnT / 0.7, 0, 0.7) : (urgent && Math.sin(animationTime * 18) > 0 ? 0.65 : 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(e.x, e.y + bob);

    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 34);
    glow.addColorStop(0, "rgba(221,179,76,.24)");
    glow.addColorStop(0.6, "rgba(205,151,42,.085)");
    glow.addColorStop(1, "rgba(205,151,42,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.fill();

    const fleePct = clamp(e.fleeTimer / e.maxFlee, 0, 1);
    ctx.strokeStyle = "rgba(183,134,36,.28)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, 27, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = urgent ? "rgba(193,74,37,.95)" : "rgba(190,143,38,.95)";
    ctx.lineWidth = 2.8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, 27, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fleePct);
    ctx.stroke();

    ctx.font = `${e.size}px ${FONT_DOC}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(255,251,237,.94)";
    ctx.strokeText(e.glyph, 0, 1);
    ctx.fillStyle = flash ? "#e4bd55" : "#a97a1f";
    ctx.fillText(e.glyph, 0, 1);

    const label = urgent ? "即将逃走" : "稀有 · 格式碎片";
    ctx.font = `600 10.5px ${FONT_UI}`;
    const labelWidth = ctx.measureText(label).width;
    ctx.fillStyle = "#fffaf0";
    ctx.strokeStyle = "rgba(191,153,75,.9)";
    ctx.lineWidth = 0.9;
    roundRectPath(-labelWidth / 2 - 4, -51, labelWidth + 8, 15, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = urgent ? "#a53f27" : "#815b14";
    ctx.fillText(label, 0, -43);

    const pct = clamp(e.hp / e.maxHp, 0, 1);
    ctx.fillStyle = "rgba(154,113,31,.18)";
    ctx.fillRect(-18, 30, 36, 1.8);
    ctx.fillStyle = "rgba(173,126,31,.9)";
    ctx.fillRect(-18, 30, 36 * pct, 1.8);
    ctx.restore();
  }

  function drawHealthRing(cx, cy, hp, maxHp) {
    const radius = 9.6;
    const segments = maxHp;
    const gap = 0.14;
    const span = (Math.PI * 2) / segments - gap;
    const rotation = animationTime * 2.1 - Math.PI / 2;
    const flashing = player.ringFlash > 0;

    ctx.save();
    // A thin white underlay keeps the busy ring legible over dense text.
    for (let i = 0; i < segments; i++) {
      const start = rotation + i * (Math.PI * 2 / segments);
      ctx.strokeStyle = "rgba(255,255,255,.76)";
      ctx.lineWidth = 5.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(cx, cy, radius, start, start + span);
      ctx.stroke();
    }
    for (let i = 0; i < segments; i++) {
      const start = rotation + i * (Math.PI * 2 / segments);
      const alive = i < hp;
      ctx.strokeStyle = alive
        ? (flashing ? "rgba(190,53,40,.98)" : "rgba(44,100,198,.96)")
        : "rgba(84,85,88,.18)";
      ctx.lineWidth = alive ? 3.1 : 1.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(cx, cy, radius, start, start + span);
      ctx.stroke();
    }
    // A small white notch on the leading segment makes it read as a loader.
    const lead = rotation + Math.min(hp, segments) * (Math.PI * 2 / segments) - gap / 2;
    ctx.fillStyle = flashing ? "rgba(255,226,220,.95)" : "rgba(238,247,255,.96)";
    ctx.beginPath();
    ctx.arc(cx + Math.cos(lead) * radius, cy + Math.sin(lead) * radius, 1.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPlayer() {
    if (!player || player.hp <= 0) return;
    if (holeBlink()) return;
    const blink = player.invuln > 0 && Math.sin(animationTime * 34) > 0.15;
    const firing = fireOrder.length > 0;
    const x = player.x;
    const y = player.y + player.bob;

    ctx.save();
    ctx.globalAlpha = blink ? 0.34 : 1;

    // a short proofing guide shows the current fire direction / fan
    const guideOffsets = playerShotOffsets();
    for (const guideOffset of guideOffsets) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(player.angle + guideOffset);
      ctx.strokeStyle = firing ? "rgba(35,86,178,.72)" : "rgba(35,86,178,.31)";
      ctx.lineWidth = 1.15;
      ctx.setLineDash([2.2, 3]);
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(31, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = firing ? "rgba(35,86,178,.85)" : "rgba(35,86,178,.45)";
      ctx.beginPath();
      ctx.arc(32.5, 0, firing ? 1.5 : 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // the Windows pointer arrow itself: a white, dark-edged cursor
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(-9, -15);
    ctx.lineTo(-9, 6);
    ctx.lineTo(-3, 1);
    ctx.lineTo(1, 10);
    ctx.lineTo(5, 8);
    ctx.lineTo(1, -1);
    ctx.lineTo(9, -1);
    ctx.closePath();
    ctx.shadowColor = "rgba(0,0,0,.24)";
    ctx.shadowBlur = 2.5;
    ctx.shadowOffsetY = 1.2;
    ctx.fillStyle = player.ringFlash > 0 ? "#fff4ef" : "#fbfaf6";
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = "#252321";
    ctx.lineWidth = 1.45;
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.fillStyle = "#252321";
    ctx.beginPath();
    ctx.arc(-8.3, -13.5, 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (player.backShieldWidth > 0) {
      const half = player.backShieldWidth / 2;
      const shieldFlash = player.shieldFlash > 0;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(player.angle + Math.PI);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const shieldLine = () => {
        ctx.beginPath();
        ctx.moveTo(22.5, -half);
        ctx.lineTo(22.5, half);
        ctx.moveTo(22.5, -half);
        ctx.lineTo(18.8, -half);
        ctx.moveTo(22.5, half);
        ctx.lineTo(18.8, half);
      };
      ctx.strokeStyle = shieldFlash ? "rgba(255,255,255,.95)" : "rgba(55,121,207,.32)";
      ctx.lineWidth = 7;
      shieldLine();
      ctx.stroke();
      ctx.strokeStyle = shieldFlash ? "rgba(255,255,255,.98)" : "rgba(42,103,190,.86)";
      ctx.lineWidth = 2.2;
      shieldLine();
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    drawHealthRing(x + 17, y + 11, Math.max(0, player.hp), player.maxHp);
  }

  function drawPlayerAura() {
    if (!player || player.hp <= 0 || player.aura <= 0) return;
    const x = player.x;
    const y = player.y + player.bob;
    const pulse = 1 + Math.sin(animationTime * 3.2) * 0.035;
    const radius = 74 * pulse;
    ctx.save();
    const glow = ctx.createRadialGradient(x, y, 10, x, y, radius + 10);
    glow.addColorStop(0, "rgba(54,121,210,.02)");
    glow.addColorStop(0.58, "rgba(54,121,210,.08)");
    glow.addColorStop(1, "rgba(54,121,210,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius + 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(50,112,199,.45)";
    ctx.lineWidth = 1.15;
    ctx.setLineDash([3, 5]);
    ctx.lineDashOffset = -animationTime * 12;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(255,255,255,.58)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(x, y, radius + 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawPlayerLaser() {
    if (!player || player.hp <= 0 || !player.laserRays.length) return;
    ctx.save();
    ctx.lineCap = "round";
    for (const ray of player.laserRays) {
      const alpha = clamp(ray.life / 0.13, 0, 1);
      const x = ray.x0 ?? player.x;
      const y = (ray.y0 ?? player.y) + player.bob;
      const ex = x + Math.cos(ray.angle) * ray.length;
      const ey = y + Math.sin(ray.angle) * ray.length;
      ctx.globalAlpha = alpha * 0.30;
      ctx.strokeStyle = "#3a79df";
      ctx.lineWidth = 13;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "rgba(34,83,176,.96)";
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.globalAlpha = alpha * 0.92;
      ctx.strokeStyle = "rgba(255,255,255,.96)";
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.95)";
      ctx.beginPath();
      ctx.arc(ex, ey, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawOrbiters() {
    if (!player || player.hp <= 0 || player.orbiters <= 0) return;
    const orbs = orbiterPositions();
    ctx.save();
    ctx.strokeStyle = "rgba(50,109,192,.17)";
    ctx.lineWidth = 0.8;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.arc(player.x, player.y + player.bob, 57, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < orbs.length; i++) {
      const orb = orbs[i];
      const oy = orb.y + player.bob;
      const glyph = i % 2 === 0 ? "†" : "‡";
      ctx.font = '600 26px "Times New Roman", Georgia, serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 4.2;
      ctx.strokeStyle = "rgba(255,255,255,.95)";
      ctx.strokeText(glyph, orb.x, oy + 0.8);
      ctx.fillStyle = "rgba(37,88,170,.96)";
      ctx.fillText(glyph, orb.x, oy + 0.8);
    }
    ctx.restore();
  }

  function holeBlink() {
    return mode === MODE.DYING && dyingTimer < 0.85 && Math.sin(animationTime * 36) > 0;
  }

  function drawBullets() {
    for (const b of bullets) {
      ctx.save();
      if (b.fromPlayer) {
        if (b.rocket) {
          const speed = Math.hypot(b.vx, b.vy) || 1;
          const tx = b.vx / speed;
          const ty = b.vy / speed;
          const flame = ctx.createLinearGradient(
            b.x - tx * 22, b.y - ty * 22, b.x - tx * 5, b.y - ty * 5
          );
          flame.addColorStop(0, "rgba(27,63,107,0)");
          flame.addColorStop(0.55, "rgba(38,94,160,.4)");
          flame.addColorStop(1, "rgba(177,216,255,.9)");
          ctx.strokeStyle = flame;
          ctx.lineWidth = 7;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(b.x - tx * 24, b.y - ty * 24);
          ctx.lineTo(b.x - tx * 5, b.y - ty * 5);
          ctx.stroke();
          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.rotate(Math.atan2(b.vy, b.vx));
          ctx.font = '700 17px "Times New Roman", "SimSun", serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.lineWidth = 4;
          ctx.strokeStyle = "rgba(235,246,255,.96)";
          ctx.strokeText("=", 0, 0.5);
          ctx.fillStyle = b.flash ? "#cfe8ff" : "#183b66";
          ctx.fillText("=", 0, 0.5);
          ctx.restore();
        } else if (b.rapidEdit) {
          ctx.strokeStyle = "rgba(91,57,35,.5)";
          ctx.lineWidth = 1.5;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(b.x - b.vx * 0.012, b.y - b.vy * 0.012);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.fillStyle = b.flash ? "#c79a72" : "#4a2a1b";
          ctx.beginPath();
          ctx.arc(b.x, b.y, 1.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(196,153,113,.92)";
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.arc(b.x, b.y, 1.6, 0, Math.PI * 2);
          ctx.stroke();
        } else if (b.trifurcate) {
          ctx.strokeStyle = "rgba(106,76,178,.5)";
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(b.x - b.vx * 0.017, b.y - b.vy * 0.017);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.font = '700 20px "Times New Roman", "SimSun", serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.lineWidth = 3.4;
          ctx.strokeStyle = "rgba(255,250,244,.96)";
          ctx.strokeText("-", b.x, b.y + 0.5);
          ctx.fillStyle = b.flash ? "#cbb8ff" : "#6a4cb2";
          ctx.fillText("-", b.x, b.y + 0.5);
        } else {
          ctx.strokeStyle = "rgba(42,91,177,.58)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(b.x - b.vx * 0.021, b.y - b.vy * 0.021);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.fillStyle = "rgba(42,91,177,.98)";
          ctx.beginPath();
          ctx.arc(b.x, b.y, 2.3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = b.boss ? "rgba(137,34,25,.18)" : "rgba(166,47,35,.15)";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius + 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(139,38,27,.26)";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(b.x - b.vx * 0.022, b.y - b.vy * 0.022);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius + 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawPickups() {
    for (const p of pickups) {
      const fragment = p.kind === "fragment";
      const bob = Math.sin(animationTime * 4 + p.seed) * 2.2;
      const fade = fragment ? 1 : p.life < 2 ? (Math.sin(animationTime * 18) > 0 ? 0.55 : 1) : 1;
      ctx.save();
      ctx.globalAlpha = fragment ? 1 : fade * clamp(p.life / 1.2, 0, 1);
      ctx.translate(p.x, p.y + bob);
      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 23);
      glow.addColorStop(0, fragment ? "rgba(180,132,28,.28)" : "rgba(43,98,190,.24)");
      glow.addColorStop(1, fragment ? "rgba(180,132,28,0)" : "rgba(43,98,190,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 23, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = fragment ? "rgba(161,113,20,.62)" : "rgba(44,105,196,.5)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2.5, 3.5]);
      ctx.beginPath();
      ctx.arc(0, 0, 14.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      if (fragment) {
        ctx.fillStyle = "rgba(255,249,226,.98)";
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(165,116,23,.7)";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = `700 12px ${FONT_DOC}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#9b6b12";
        ctx.fillText("¶", 0, 0.5);
      } else {
        ctx.fillStyle = "rgba(255,255,255,.96)";
        ctx.beginPath();
        ctx.arc(0, 0, 8.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2b62bb";
        ctx.beginPath();
        ctx.arc(0, 0, 6.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.78)";
        ctx.beginPath();
        ctx.arc(-1.8, -2, 1.25, 0, Math.PI * 2);
        ctx.fill();
      }

      const label = fragment ? "格式碎片" : "修订 +1";
      ctx.font = `700 8.5px ${FONT_UI}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const labelW = ctx.measureText(label).width;
      ctx.fillStyle = fragment ? "rgba(255,250,232,.97)" : "rgba(247,251,255,.95)";
      ctx.strokeStyle = fragment ? "rgba(155,107,18,.62)" : "rgba(47,102,183,.58)";
      ctx.lineWidth = 0.8;
      roundRectPath(-labelW / 2 - 3, -29, labelW + 6, 12, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = fragment ? "#8e6210" : "#2859a8";
      ctx.fillText(label, 0, -22.5);
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const p of particles) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      if (p.type === "glyph") {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.font = `${p.size}px ${FONT_DOC}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = p.color;
        ctx.fillText(p.char, 0, 0);
      } else if (p.type === "spark") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.018, p.y - p.vy * 0.018);
        ctx.stroke();
      } else if (p.type === "ring") {
        const t = 1 - p.life / p.maxLife;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5 * (1 - t) + 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, lerp(p.size, p.targetSize, t), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    for (const f of floaters) {
      const alpha = clamp(f.life / f.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `600 ${f.size}px ${FONT_UI}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "rgba(255,255,255,.88)";
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  }

  function render() {
    resizeCanvas();
    ctx.setTransform(dimensionDpr, 0, 0, dimensionDpr, 0, 0);
    ctx.clearRect(0, 0, PAGE_W, PAGE_H);
    if (document.body.classList.contains("reading")) return;

    ctx.save();
    if (shake > 0.1 && mode !== MODE.REWARD) {
      ctx.translate(rand(-shake, shake) * 0.5, rand(-shake, shake) * 0.5);
    }
    drawWalls();
    drawSniperLines();
    drawPlayerAura();
    for (const e of enemies) drawEnemy(e);
    drawPickups();
    drawPlayerLaser();
    drawPlayer();
    drawOrbiters();
    drawBullets();
    drawParticles();
    ctx.restore();

    if (finalBossFlash > 0 && mode !== MODE.REWARD) {
      ctx.save();
      ctx.fillStyle = `rgba(255,247,217,${finalBossFlash * 0.34})`;
      ctx.fillRect(0, 0, PAGE_W, PAGE_H);
      ctx.strokeStyle = `rgba(210,155,41,${finalBossFlash * 0.55})`;
      ctx.lineWidth = 12;
      ctx.strokeRect(6, 6, PAGE_W - 12, PAGE_H - 12);
      ctx.restore();
    }
    if (hitFlash > 0 && mode !== MODE.REWARD) {
      ctx.save();
      ctx.strokeStyle = `rgba(172,46,34,${hitFlash * 0.26})`;
      ctx.lineWidth = 9;
      ctx.strokeRect(4, 4, PAGE_W - 8, PAGE_H - 8);
      ctx.restore();
    }
  }

  /* ---------------- main loop ---------------- */
  function frame(now) {
    const raw = Math.max(0, (now - lastFrame) / 1000);
    lastFrame = now;
    const dt = Math.min(raw, 0.034);
    if (mode !== MODE.REWARD) animationTime += Math.min(raw, 0.08);
    if (mode === MODE.PLAYING || mode === MODE.DYING) {
      updateWorld(dt);
    } else if (mode === MODE.INTRO) {
      tutorialTime += Math.min(raw, 0.08);
      drawTutorial();
    } else if (mode === MODE.PAUSED || mode === MODE.GAMEOVER) {
      // keep transient decorations from freezing mid-air while the document is paused
      if (shake > 0.1) shake *= Math.pow(0.05, dt);
      if (hitFlash > 0) hitFlash = Math.max(0, hitFlash - dt * 1.8);
    }
    render();
    requestAnimationFrame(frame);
  }

  /* ---------------- UI wiring ---------------- */
  function openWordCount() {
    const counts = countArticle();
    $("countWords").textContent = fmt(stats.words);
    $("countChars").textContent = fmt(counts.chars);
    wordCountModal.hidden = false;
    if (mode === MODE.PLAYING) {
      modalPausedGame = true;
      mode = MODE.PAUSED;
      page.classList.remove("playing");
      clearInput();
    }
  }

  function closeWordCount() {
    wordCountModal.hidden = true;
    if (modalPausedGame && mode === MODE.PAUSED) {
      mode = MODE.PLAYING;
      page.classList.add("playing");
    }
    modalPausedGame = false;
  }

  function toggleMute() {
    sound.muted = !sound.muted;
    muteBtn.classList.toggle("muted", sound.muted);
    muteLabel.textContent = sound.muted ? "静音" : "音效";
    muteBtn.title = sound.muted ? "开启音效" : "静音";
    if (!sound.muted) sound.ensure();
  }

  function wireUi() {
    $("startGameBtn").addEventListener("click", (event) => {
      event.stopPropagation();
      startGame();
    });
    introComment.addEventListener("pointerdown", (event) => event.stopPropagation());
    introComment.addEventListener("click", (event) => event.stopPropagation());

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", () => {
      clearInput();
    });
    styleRewardGrid.addEventListener("click", (event) => {
      const card = event.target.closest("[data-reward-index]");
      if (!card) return;
      chooseStyleReward(Number(card.dataset.rewardIndex));
    });

    $("restartBtn").addEventListener("click", restartGame);
    $("viewDocumentBtn").addEventListener("click", () => closeGameOver("read"));
    $("finalContinueBtn").addEventListener("click", continueFinalClear);
    $("finalStopBtn").addEventListener("click", stopFinalClear);
    $("gameOverClose").addEventListener("click", () => closeGameOver("read"));
    $("exitReadingBtn").addEventListener("click", toggleReading);
    $("statusReadingBtn").addEventListener("click", toggleReading);
    $("readingModeBtn").addEventListener("click", toggleReading);
    $("zoomBtn").addEventListener("click", () => {
      zoomMode = "fit";
      ensureScale();
    });
    $("muteBtn").addEventListener("click", toggleMute);
    $("readAloudBtn").addEventListener("click", toggleMute);
    $("zoomSlider").addEventListener("input", () => {
      zoomMode = "custom";
      customZoom = Number(zoomSlider.value);
      ensureScale();
    });
    $("zoomInBtn").addEventListener("click", () => {
      setZoom(Number(zoomValue.textContent.replace("%", "")) + 5);
    });
    $("zoomOutBtn").addEventListener("click", () => {
      setZoom(Number(zoomValue.textContent.replace("%", "")) - 5);
    });

    $("wordCountBtn").addEventListener("click", openWordCount);
    $("wordCountClose").addEventListener("click", closeWordCount);
    $("wordCountOk").addEventListener("click", closeWordCount);
    $("spellCheckBtn").addEventListener("click", () => {
      const n = enemies.length + (mode === MODE.INTRO ? 0 : 0);
      showToast(
        n ? "拼写检查完成" : "拼写检查完成",
        n ? `发现 ${n} 个标点正在偏离原来的位置。` : "当前页面没有发现移动中的标点。",
        n ? "warn" : ""
      );
    });
    if ($("newCommentBtn")) {
      $("newCommentBtn").addEventListener("click", () => {
        showToast("批注已折叠", "李华的批注仍停在这篇稿子的右上角。", "");
      });
    }
    if ($("trackChangesBtn")) {
      $("trackChangesBtn").addEventListener("click", () => {
        showToast("修订模式", "移动的标点已用红色波浪线标出。", "");
      });
    }

    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.tab;
        document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
        document.querySelectorAll(".ribbon-pane").forEach((pane) => {
          pane.classList.toggle("active", pane.dataset.pane === target);
        });
        if (workspace && document.body.classList.contains("ribbon-collapsed")) {
          document.body.classList.remove("ribbon-collapsed");
          setTimeout(ensureScale, 160);
        }
      });
    });

    const collapse = document.querySelector(".ribbon-collapse");
    if (collapse) {
      collapse.addEventListener("click", () => {
        document.body.classList.toggle("ribbon-collapsed");
        setTimeout(ensureScale, 160);
      });
    }

    const reflow = () => {
      window.clearTimeout(window.__wordTankResize);
      window.__wordTankResize = window.setTimeout(() => {
        ensureScale();
        if (mode === MODE.REWARD) positionStyleReward();
      }, 80);
    };
    window.addEventListener("resize", reflow);
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(reflow);
      ro.observe(canvasArea);
    }
  }

  /* ---------------- boot ---------------- */
  function init() {
    captureArticleBase();
    const counts = countArticle();
    baseWords = counts.words;
    displayWords = baseWords;
    stats.words = baseWords;
    loadHighRecord();
    seedIntroScene();
    wireUi();
    setupTutorial();
    setupCheatPanel();
    const cheatQuery = new URLSearchParams(window.location.search).get("cheat");
    if (cheatQuery === "1") cheatOpenOnStart = true;
    ensureScale();
    updateFragmentHud();
    updateHud();
    wordCountEl.textContent = fmt(baseWords);
    zoomMode = "fit";
    ensureScale();
    lastFrame = performance.now();
    requestAnimationFrame(frame);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (mode === MODE.INTRO) makeWalls();
        setTimeout(ensureScale, 80);
      }).catch(() => {});
    }
    window.setTimeout(() => {
      if (mode === MODE.INTRO) tutorialNextBtn.focus({ preventScroll: true });
    }, 350);
  }

  init();

  // A deliberately quiet debug hatch, useful when tuning the game locally.
  if (new URLSearchParams(location.search).get("debug") === "1") {
    window.__wordTank = {
      snapshot: () => ({
        mode, wave, wavePhase, spawnRemaining: spawnQueue.length,
        waveSpawnTotal, waveSpawned, waveSmallTotal, waveSmallSpawned,
        rareWillSpawn, rareSpawnAt, rareSpawnedThisWave,
        cheatInvincible, finalIntroActive, finalIntroTimer: +finalIntroTimer.toFixed(2),
        finalVictoryDelay: +finalVictoryDelay.toFixed(2), finalBossFlash: +finalBossFlash.toFixed(2),
        hp: player?.hp, words: stats.words, kills: stats.kills,
        bossesCleared, enemyLevel: enemyLevel(),
        stageHint: stageHintText(), bossKind: currentBossKind,
        elapsed: +stats.elapsed.toFixed(2),
        formatFragments, bonusRewardCharges,
        shake: +shake.toFixed(2), hitFlash: +hitFlash.toFixed(2),
        articleIndex: currentArticleIndex, articleTitle: document.querySelector(".document h1")?.textContent,
        currentRewardSource, pendingArticleSwap,
        damageMeter: damageMeterEl?.textContent,
        pickups: pickups.map((p) => ({
          x: +p.x.toFixed(1), y: +p.y.toFixed(1), radius: +p.radius.toFixed(1),
          kind: p.kind || "heal", persistent: !!p.persistent,
          life: p.persistent ? null : +(p.life || 0).toFixed(1),
        })),
        rewardChoices: rewardChoices.map((r) => ({ id: r.id, name: r.name, rarity: r.rarity, kind: r.kind })),
        player: player ? {
          x: +player.x.toFixed(1), y: +player.y.toFixed(1),
          aimAngle: +aimAngle.toFixed(3),
          firingStyle: player.firingStyle,
          spreadUnlocked: player.spreadUnlocked,
          spreadPairs: player.spreadPairs,
          extraBullets: player.extraBullets,
          rapidEditStacks: player.rapidEditStacks,
          whiteCards: player.whiteCards, blueCards: player.blueCards, redCards: player.redCards,
          resurrectionStacks: player.resurrectionStacks, healPickupProgress: player.healPickupProgress,
          gritStacks: player.gritStacks, faithStacks: player.faithStacks,
          daydreamStacks: player.daydreamStacks, blueSeaStacks: player.blueSeaStacks,
          moving: player.moving,
          moveShotTimer: +player.moveShotTimer.toFixed(3),
          moveAngle: +player.moveAngle.toFixed(3),
          laserRays: player.laserRays.length,
          damageLevel: player.damageLevel,
          damageMultiplier: +playerDamageMultiplier().toFixed(2),
          fireRateBonus: +player.fireRateBonus.toFixed(2),
          cooldown: +player.cooldown.toFixed(3),
          fireCooldown: +playerFireCooldown().toFixed(3),
          moveBonus: +player.moveBonus.toFixed(2),
          speed: +player.speed.toFixed(1),
          backShieldWidth: player.backShieldWidth,
          orbiters: player.orbiters,
          aura: player.aura,
          laserLife: +player.laserLife.toFixed(3),
          laserLength: +player.laserLength.toFixed(1),
          laserRays: player.laserRays.map((ray) => ({
            angle: +ray.angle.toFixed(3), length: +ray.length.toFixed(1), life: +ray.life.toFixed(3),
          })),
        } : null,
        enemies: enemies.map((e) => ({
          key: e.key, x: +e.x.toFixed(1), y: +e.y.toFixed(1), hp: e.hp,
          spawnT: +e.spawnT.toFixed(2), turret: +e.turretAngle.toFixed(3),
          fireTimer: +e.fireTimer.toFixed(2), speed: e.speed,
          gold: !!e.gold, elite: !!e.elite, boss: !!e.boss, bouncer: !!e.bouncer,
          vx: e.bouncer && Number.isFinite(e.vx) ? +e.vx.toFixed(1) : undefined,
          vy: e.bouncer && Number.isFinite(e.vy) ? +e.vy.toFixed(1) : undefined,
          bounceCount: e.bouncer ? e.bounceCount : undefined,
          bracketSide: e.bracket ? e.side : undefined,
          fleeTimer: e.gold ? +e.fleeTimer.toFixed(1) : undefined,
          finalTextIndex: e.finalBoss ? e.finalTextIndex : undefined,
          finalTimer: e.finalBoss ? +(e.finalTimer || 0).toFixed(2) : undefined,
          finalInvulnerable: e.finalBoss ? !!e.finalInvulnerable : undefined,
          finalRoared: e.finalBoss ? !!e.finalRoared : undefined,
        })),
        bullets: bullets.map((b) => ({
          x: +b.x.toFixed(1), y: +b.y.toFixed(1),
          vx: +b.vx.toFixed(2), vy: +b.vy.toFixed(2), fromPlayer: b.fromPlayer,
          rocket: !!b.rocket, trifurcate: !!b.trifurcate, rapidEdit: !!b.rapidEdit,
          radius: +b.radius.toFixed(1), damage: b.damage,
        })),
        walls: walls.map((w) => ({
          x: +w.x.toFixed(1), y: +w.y.toFixed(1), w: +w.w.toFixed(1), h: +w.h.toFixed(1),
          hue: w.hue ?? 47,
        })),
        fireKeys: fireOrder.slice(),
      }),
      spawnBoss: () => { const e = spawnEnemy("ellipsis"); return e.key; },
      spawnBrackets: () => { spawnBracketPair(); return enemies.filter((e) => e.bracket).map((e) => e.side); },
      spawnAtBoss: () => { const e = spawnAtBoss(); return { key: e.key, x: e.x, y: e.y, vx: e.vx, vy: e.vy }; },
      planBoss: (kind) => {
        if (!["sentence", "brackets", "at"].includes(kind)) return currentBossKind;
        currentBossKind = kind;
        if (lastBossKind === kind) lastBossKind = null;
        return currentBossKind;
      },
      spawnElite: (key = "question") => {
        const pos = spawnPointFor(key);
        const e = makeEnemy(key, pos.x, pos.y, { elite: true });
        enemies.push(e);
        return { key: e.key, hp: e.hp, maxHp: e.maxHp, elite: e.elite };
      },
      spawnGold: () => { const e = spawnRareEnemy(); return { key: e.key, x: e.x, y: e.y, fleeTimer: e.fleeTimer }; },
      hitGold: () => {
        const gold = enemies.find((e) => e.gold);
        if (!gold) return false;
        gold.spawnT = 0;
        damageEnemy(gold, 99, gold.x, gold.y);
        return true;
      },
      setGoldFlee: (seconds) => {
        const gold = enemies.find((e) => e.gold);
        if (!gold) return false;
        gold.fleeTimer = Math.max(0.05, seconds);
        return true;
      },
      spawn: (key) => { const e = spawnEnemy(key); return { key: e.key, x: e.x, y: e.y, hp: e.hp }; },
      spawnAt: (key, x, y) => {
        const e = makeEnemy(key, x, y, { instant: true });
        if (e.gold) { e.fleeTimer = 11.5; e.maxFlee = 11.5; }
        enemies.push(e);
        return e.key;
      },
      movePlayer: (x, y) => { player.x = x; player.y = y; },
      setHealth: (hp) => { player.hp = clamp(hp, 0, player.maxHp); player.invuln = 0; updateHud(); },
      nextWave: () => { startWave(wave + 1); },
      hurt: () => damagePlayer(1),
      openReward: (source = "boss") => openStyleReward(source),
      chooseReward: (index) => chooseStyleReward(index),
      peekRewards: () => sampleRewardChoices(3).map((r) => ({ rarity: r.rarity, id: r.id, name: r.name })),
      textCatalog: () => ({
        rewards: REWARD_POOL.map(({ id, name, rarity, kind, value, glyph, desc }) => ({
          id, name, rarity, kind, value, glyph, desc,
        })),
        enemies: Object.entries(ENEMY_TYPES).map(([key, def]) => ({
          key, glyph: def.glyph, name: def.name, hp: def.hp, wordValue: def.wordValue,
          boss: !!def.boss, gold: !!def.gold, bracket: !!def.bracket, bouncer: !!def.bouncer,
        })),
        articles: ARTICLE_VARIANTS.map((article, index) => ({
          index,
          title: article.title || baseArticleSnapshot?.title || "",
          fileName: article.fileName || baseArticleSnapshot?.fileName || "",
        })),
        wallProfiles: WALL_PROFILES.map((profile, index) => ({
          count: [(FIXED_WALLS[index] || []).length, (FIXED_WALLS[index] || []).length],
          hue: profile.hue, sat: profile.sat, light: profile.light,
        })),
        arena: { ...ARENA }, page: { width: PAGE_W, height: PAGE_H },
      }),
      addFragment: () => {
        formatFragments += 1;
        if (formatFragments >= 3) { formatFragments = 0; bonusRewardCharges += 1; }
        updateFragmentHud(true);
        return { formatFragments, bonusRewardCharges };
      },
      nextArticle: () => switchArticleMap(),
      restart: () => { restartGame(); return window.__wordTank.snapshot(); },
      enemyBullet: (x, y, angle, speed = 200) => spawnBullet(x, y, angle, speed, false),
      clearWalls: () => { walls = []; },
      clearEnemies: () => { enemies = []; bullets = []; pickups = []; },
      clearPickups: () => { pickups = []; },
      setDamageLevel: (level) => {
        player.damageLevel = Math.max(1, Math.round(level));
        updateDamageMeter();
        return player.damageLevel;
      },
      dropHealAt: (x, y) => { dropElitePickup(x, y); return pickups.length; },
      dropFragmentAt: (x, y) => { dropFormatFragmentPickup(x, y); return pickups.length; },
      setRareTrigger: (value) => {
        rareWillSpawn = true;
        rareSpawnAt = clamp(Math.round(Number(value) || 0), 0, Math.floor(waveSmallTotal / 2));
        return rareSpawnAt;
      },
      hitFirst: (amount = 1) => {
        const e = enemies[0];
        if (!e) return null;
        e.spawnT = 0;
        damageEnemy(e, amount, e.x, e.y);
        return { key: e.key, hp: e.hp, maxHp: e.maxHp, elite: !!e.elite };
      },
      startWaveAt: (n) => { startWave(Math.max(1, Math.round(n))); return wave; },
      giveReward: (id) => {
        const reward = REWARD_POOL.find((r) => r.id === id);
        if (reward) applyStyleReward(reward);
        return reward?.name ?? null;
      },
      setEnemyLevel: (level) => {
        bossesCleared = clamp(Math.round(level) - 1, 0, 40);
        updateEnemyLevelHud(true);
        return enemyLevel();
      },
      finishWave: () => {
        enemies = [];
        bullets = [];
        wavePhase = "clearing";
        completeWave();
      },
    };
  }
})();
