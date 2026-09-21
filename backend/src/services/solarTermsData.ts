export interface SolarTermDetail {
  name: string;
  season: '春' | '夏' | '秋' | '冬';
  summary: string;
  poem: string;
  author: string;
  phenology: string; // 三候
  traditionalColorName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  gradient: string;
}

export const SOLAR_TERMS_MAP: Record<string, SolarTermDetail> = {
  '立春': {
    name: '立春',
    season: '春',
    summary: '东风解冻，万物复苏',
    poem: '律回岁晚冰霜少，春到人间草木知',
    author: '宋·张栻',
    phenology: '一候东风解冻；二候蛰虫始振；三候鱼陟负冰',
    traditionalColorName: '黄栌 · 鞠衣',
    primaryColor: '#8ba364',
    secondaryColor: '#d1c750',
    accentColor: '#4f7942',
    gradient: 'linear-gradient(135deg, rgba(139, 163, 100, 0.15) 0%, rgba(209, 199, 80, 0.1) 100%)'
  },
  '雨水': {
    name: '雨水',
    season: '春',
    summary: '随风潜入夜，润物细无声',
    poem: '好雨知时节，当春乃发生',
    author: '唐·杜甫',
    phenology: '一候獭祭鱼；二候鸿雁来；三候草木萌动',
    traditionalColorName: '碧落 · 绿沉',
    primaryColor: '#62939a',
    secondaryColor: '#93b5cf',
    accentColor: '#2b6688',
    gradient: 'linear-gradient(135deg, rgba(98, 147, 154, 0.15) 0%, rgba(147, 181, 207, 0.12) 100%)'
  },
  '惊蛰': {
    name: '惊蛰',
    season: '春',
    summary: '春雷隐隐，草木萌发',
    poem: '微雨众卉新，一雷惊蛰始',
    author: '唐·韦应物',
    phenology: '一候桃始华；二候仓庚鸣；三候鹰化为鸠',
    traditionalColorName: '缃叶 · 苍葭',
    primaryColor: '#a8d8b9',
    secondaryColor: '#fed553',
    accentColor: '#38b48b',
    gradient: 'linear-gradient(135deg, rgba(168, 216, 185, 0.18) 0%, rgba(254, 213, 83, 0.12) 100%)'
  },
  '春分': {
    name: '春分',
    season: '春',
    summary: '日月阳和，草长莺飞',
    poem: '雨霁风光，春分天气，千花百草争明媚',
    author: '宋·欧阳修',
    phenology: '一候玄鸟至；二候雷乃发声；三候始电',
    traditionalColorName: '桃红 · 柳绿',
    primaryColor: '#f07c82',
    secondaryColor: '#88bf8f',
    accentColor: '#e03636',
    gradient: 'linear-gradient(135deg, rgba(240, 124, 130, 0.15) 0%, rgba(136, 191, 143, 0.12) 100%)'
  },
  '清明': {
    name: '清明',
    season: '春',
    summary: '桐始华，风清景明',
    poem: '清明时节雨纷纷，路上行人欲断魂',
    author: '唐·杜牧',
    phenology: '一候桐始华；二候田鼠化为鴽；三候虹始见',
    traditionalColorName: '水青 · 翠微',
    primaryColor: '#78cdd7',
    secondaryColor: '#9cd1ce',
    accentColor: '#2177b8',
    gradient: 'linear-gradient(135deg, rgba(120, 205, 215, 0.16) 0%, rgba(156, 209, 206, 0.12) 100%)'
  },
  '谷雨': {
    name: '谷雨',
    season: '春',
    summary: '雨生百谷，春将归去',
    poem: '杨花落尽子规啼，闻道龙标过五溪',
    author: '唐·李白',
    phenology: '一候萍始生；二候鸣鸠拂其羽；三候戴胜降于桑',
    traditionalColorName: '苍艾 · 绿碧',
    primaryColor: '#5d826a',
    secondaryColor: '#a1afc9',
    accentColor: '#305b4b',
    gradient: 'linear-gradient(135deg, rgba(93, 130, 106, 0.15) 0%, rgba(161, 175, 201, 0.12) 100%)'
  },
  '立夏': {
    name: '立夏',
    season: '夏',
    summary: '斗指东南，维为立夏',
    poem: '绿树阴浓夏日长，楼台倒影入池塘',
    author: '唐·高骈',
    phenology: '一候蝼蝈鸣；二候蚯蚓出；三候王瓜生',
    traditionalColorName: '朱樱 · 槐序',
    primaryColor: '#ea6153',
    secondaryColor: '#27ae60',
    accentColor: '#c0392b',
    gradient: 'linear-gradient(135deg, rgba(234, 97, 83, 0.15) 0%, rgba(39, 174, 96, 0.12) 100%)'
  },
  '小满': {
    name: '小满',
    season: '夏',
    summary: '物致于此，小得盈满',
    poem: '夜莺啼绿柳，皓月醒长空',
    author: '宋·欧阳修',
    phenology: '一候苦菜秀；二候靡草死；三候麦秋至',
    traditionalColorName: '黄丹 · 麦穗',
    primaryColor: '#e59866',
    secondaryColor: '#f9e79f',
    accentColor: '#b9770e',
    gradient: 'linear-gradient(135deg, rgba(229, 152, 102, 0.16) 0%, rgba(249, 231, 159, 0.14) 100%)'
  },
  '芒种': {
    name: '芒种',
    season: '夏',
    summary: '有芒之谷，至此可种',
    poem: '乙酉甲申雷雨惊，乘除却贺芒种晴',
    author: '宋·范成大',
    phenology: '一候螳螂生；二候鵙始鸣；三候反舌无声',
    traditionalColorName: '雄黄 · 蔚蓝',
    primaryColor: '#f39c12',
    secondaryColor: '#3498db',
    accentColor: '#d35400',
    gradient: 'linear-gradient(135deg, rgba(243, 156, 18, 0.15) 0%, rgba(52, 152, 219, 0.12) 100%)'
  },
  '夏至': {
    name: '夏至',
    season: '夏',
    summary: '日北至，日长之至',
    poem: '昼晷已云极，宵漏自此长',
    author: '唐·韦应物',
    phenology: '一候鹿角解；二候蝉始鸣；三候半夏生',
    traditionalColorName: '石榴红 · 碧山',
    primaryColor: '#e74c3c',
    secondaryColor: '#1abc9c',
    accentColor: '#962d3e',
    gradient: 'linear-gradient(135deg, rgba(231, 76, 60, 0.16) 0%, rgba(26, 188, 156, 0.12) 100%)'
  },
  '小暑': {
    name: '小暑',
    season: '夏',
    summary: '温风至，蟋蟀居宇',
    poem: '地盛夕阳红，微风动轻扇',
    author: '宋·晁补之',
    phenology: '一候温风至；二候蟋蟀居壁；三候鹰始挚',
    traditionalColorName: '彤霞 · 暮山紫',
    primaryColor: '#f1948a',
    secondaryColor: '#bb8fce',
    accentColor: '#ba4a00',
    gradient: 'linear-gradient(135deg, rgba(241, 148, 138, 0.16) 0%, rgba(187, 143, 206, 0.12) 100%)'
  },
  '大暑': {
    name: '大暑',
    season: '夏',
    summary: '大者，乃炎热之极也',
    poem: '赤日几时过，清风无处寻',
    author: '宋·曾几',
    phenology: '一候腐草为萤；二候土润溽暑；三候大雨时行',
    traditionalColorName: '赤金 · 炎晖',
    primaryColor: '#e67e22',
    secondaryColor: '#f4d03f',
    accentColor: '#b03a2e',
    gradient: 'linear-gradient(135deg, rgba(230, 126, 34, 0.18) 0%, rgba(244, 208, 63, 0.14) 100%)'
  },
  '立秋': {
    name: '立秋',
    season: '秋',
    summary: '凉风至，白露生',
    poem: '乳鸦啼散玉屏空，一枕新凉一扇风',
    author: '唐·刘翰',
    phenology: '一候凉风至；二候白露生；三候寒蝉鸣',
    traditionalColorName: '木槿 · 苍葭',
    primaryColor: '#c0392b',
    secondaryColor: '#f39c12',
    accentColor: '#7d6608',
    gradient: 'linear-gradient(135deg, rgba(192, 57, 43, 0.15) 0%, rgba(243, 156, 18, 0.14) 100%)'
  },
  '处暑': {
    name: '处暑',
    season: '秋',
    summary: '处，止也，暑气至此而止',
    poem: '四时俱可喜，最好新秋时',
    author: '宋·陆游',
    phenology: '一候鹰乃祭鸟；二候天地始肃；三候禾乃登',
    traditionalColorName: '黄栌 · 缃素',
    primaryColor: '#d4ac0d',
    secondaryColor: '#52be80',
    accentColor: '#7d6608',
    gradient: 'linear-gradient(135deg, rgba(212, 172, 13, 0.16) 0%, rgba(82, 190, 128, 0.12) 100%)'
  },
  '白露': {
    name: '白露',
    season: '秋',
    summary: '阴气渐重，露凝而白',
    poem: '蒹葭苍苍，白露为霜。所谓伊人，在水一方',
    author: '先秦·诗经',
    phenology: '一候鸿雁来；二候玄鸟归；三候群鸟养羞',
    traditionalColorName: '凝脂 · 竹月',
    primaryColor: '#7fb3d5',
    secondaryColor: '#d5dbdb',
    accentColor: '#2471a3',
    gradient: 'linear-gradient(135deg, rgba(127, 179, 213, 0.18) 0%, rgba(213, 219, 219, 0.15) 100%)'
  },
  '秋分': {
    name: '秋分',
    season: '秋',
    summary: '风清露冷秋期半，日光夜色两均长',
    poem: '漏钟仍夜浅，时节欲秋分。泉声喧后涧，竹色净幽轩',
    author: '唐·怀浚',
    phenology: '一候雷始收声；二候蛰虫坯户；三候水始涸',
    traditionalColorName: '琥珀 · 苍苍',
    primaryColor: '#d97706',
    secondaryColor: '#b45309',
    accentColor: '#78350f',
    gradient: 'linear-gradient(135deg, rgba(217, 119, 6, 0.16) 0%, rgba(180, 83, 9, 0.12) 100%)'
  },
  '寒露': {
    name: '寒露',
    season: '秋',
    summary: '露气寒冷，将凝结也',
    poem: '袅袅凉风动，凄凄寒露零',
    author: '唐·白居易',
    phenology: '一候鸿雁来宾；二候雀入大水为蛤；三候菊有黄华',
    traditionalColorName: '落栗 · 沧浪',
    primaryColor: '#af601a',
    secondaryColor: '#5499c7',
    accentColor: '#6e2c00',
    gradient: 'linear-gradient(135deg, rgba(175, 96, 26, 0.16) 0%, rgba(84, 153, 199, 0.13) 100%)'
  },
  '霜降': {
    name: '霜降',
    season: '秋',
    summary: '气肃而霜降，阴始凝也',
    poem: '霜降水痕收，浅碧鳞鳞露远洲',
    author: '宋·苏轼',
    phenology: '一候豺乃祭兽；二候草木黄落；三候蛰虫咸俯',
    traditionalColorName: '霜色 · 赭石',
    primaryColor: '#85929e',
    secondaryColor: '#c0392b',
    accentColor: '#2c3e50',
    gradient: 'linear-gradient(135deg, rgba(133, 146, 158, 0.18) 0%, rgba(192, 57, 43, 0.12) 100%)'
  },
  '立冬': {
    name: '立冬',
    season: '冬',
    summary: '水始冰，地始冻',
    poem: '冻笔新诗懒写，寒炉美酒时温',
    author: '唐·李白',
    phenology: '一候水始冰；二候地始冻；三候雉入大水为蜃',
    traditionalColorName: '玄青 · 寒青',
    primaryColor: '#34495e',
    secondaryColor: '#5dade2',
    accentColor: '#1b2631',
    gradient: 'linear-gradient(135deg, rgba(52, 73, 94, 0.18) 0%, rgba(93, 173, 226, 0.13) 100%)'
  },
  '小雪': {
    name: '小雪',
    season: '冬',
    summary: '气寒而将雪，地寒未甚',
    poem: '花雪随风不厌看，更多还肯失林峦',
    author: '唐·戴叔伦',
    phenology: '一候虹藏不见；二候天气上升地气下降；三候闭塞而成冬',
    traditionalColorName: '月白 · 霁青',
    primaryColor: '#aed6f1',
    secondaryColor: '#ebf5fb',
    accentColor: '#2874a6',
    gradient: 'linear-gradient(135deg, rgba(174, 214, 241, 0.2) 0%, rgba(235, 245, 251, 0.15) 100%)'
  },
  '大雪': {
    name: '大雪',
    season: '冬',
    summary: '大者，盛也，至此而雪盛矣',
    poem: '大雪江南见未曾，今年方始是严凝',
    author: '宋·陆游',
    phenology: '一候鹖鴠不鸣；二候虎始交；三候荔挺出',
    traditionalColorName: '素白 · 银朱',
    primaryColor: '#d6dbdf',
    secondaryColor: '#c0392b',
    accentColor: '#1c2833',
    gradient: 'linear-gradient(135deg, rgba(214, 219, 223, 0.22) 0%, rgba(192, 57, 43, 0.1) 100%)'
  },
  '冬至': {
    name: '冬至',
    season: '冬',
    summary: '日南之至，日短之至',
    poem: '天时人事日相催，冬至阳生春又来',
    author: '唐·杜甫',
    phenology: '一候蚯蚓结；二候麋角解；三候水泉动',
    traditionalColorName: '黛蓝 · 丹砂',
    primaryColor: '#2e4053',
    secondaryColor: '#cb4335',
    accentColor: '#17202a',
    gradient: 'linear-gradient(135deg, rgba(46, 64, 83, 0.2) 0%, rgba(203, 67, 53, 0.12) 100%)'
  },
  '小寒': {
    name: '小寒',
    season: '冬',
    summary: '冷气积久而寒，小者未至于极',
    poem: '小寒连大吕，欢鹊垒新巢',
    author: '唐·元稹',
    phenology: '一候雁北乡；二候鹊始巢；三候雉始雊',
    traditionalColorName: '雪青 · 寒烟',
    primaryColor: '#85929e',
    secondaryColor: '#d2b4de',
    accentColor: '#2c3e50',
    gradient: 'linear-gradient(135deg, rgba(133, 146, 158, 0.18) 0%, rgba(210, 180, 222, 0.14) 100%)'
  },
  '大寒': {
    name: '大寒',
    season: '冬',
    summary: '寒气之逆极，故谓大寒',
    poem: '大寒须已近，微暖自先回',
    author: '宋·陆游',
    phenology: '一候鸡始乳；二候征鸟厉疾；三候水泽腹坚',
    traditionalColorName: '苍水 · 缟羽',
    primaryColor: '#5dade2',
    secondaryColor: '#f2f4f4',
    accentColor: '#1b4f72',
    gradient: 'linear-gradient(135deg, rgba(93, 173, 226, 0.2) 0%, rgba(242, 244, 244, 0.15) 100%)'
  }
};
