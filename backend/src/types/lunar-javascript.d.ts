declare module 'lunar-javascript' {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    static fromDate(date: Date): Solar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getLunar(): Lunar;
    getXingZuo(): string;
    toYmd(): string;
  }

  export class JieQi {
    getName(): string;
    getSolar(): Solar;
  }

  export class Lunar {
    static fromYmd(year: number, month: number, day: number): Lunar;
    static fromDate(date: Date): Lunar;
    static fromSolar(solar: Solar): Lunar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getYearInGanZhi(): string;
    getYearShengXiao(): string;
    getJieQi(): string;
    getPrevJieQi(wholeDay?: boolean): JieQi;
    getNextJieQi(wholeDay?: boolean): JieQi;
    getWuHou(): string;
    getSolar(): Solar;
    getJieQiTable(): Record<string, Solar>;
  }
}

