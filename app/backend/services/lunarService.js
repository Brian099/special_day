"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateEvent = calculateEvent;
exports.getCurrentSolarTermInfo = getCurrentSolarTermInfo;
const lunar_javascript_1 = require("lunar-javascript");
function parseDateOnly(dateStr) {
    const parts = dateStr.split('-').map(Number);
    return { year: parts[0], month: parts[1], day: parts[2] };
}
function formatDate(year, month, day) {
    const m = month < 10 ? `0${month}` : `${month}`;
    const d = day < 10 ? `0${day}` : `${day}`;
    return `${year}-${m}-${d}`;
}
function diffDays(startDateStr, endDateStr) {
    const d1 = new Date(startDateStr + 'T00:00:00Z');
    const d2 = new Date(endDateStr + 'T00:00:00Z');
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.round((d2.getTime() - d1.getTime()) / msPerDay);
}
function calculateEvent(event, todayStr) {
    const now = new Date();
    const currentTodayStr = todayStr || formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const { year: curY, month: curM, day: curD } = parseDateOnly(currentTodayStr);
    const { year: origY, month: origM, day: origD } = parseDateOnly(event.target_date);
    const isLunar = event.calendar_type === 'lunar';
    const isLeap = Boolean(event.is_leap_month);
    const repeatType = event.repeat_type || 'none';
    const repeatInterval = Math.max(1, Number(event.repeat_interval) || 1);
    let nextSolarDateStr = event.target_date;
    let targetLunarString = '';
    // Get Lunar Info for the original base date
    if (isLunar) {
        try {
            const origLunar = lunar_javascript_1.Lunar.fromYmd(origY, origM, origD);
            targetLunarString = `农历 ${origLunar.getMonthInChinese()}月${origLunar.getDayInChinese()}`;
        }
        catch {
            targetLunarString = `农历 ${origM}月${origD}日`;
        }
    }
    else {
        try {
            const origSolar = lunar_javascript_1.Solar.fromYmd(origY, origM, origD);
            const origLunar = origSolar.getLunar();
            targetLunarString = `农历 ${origLunar.getMonthInChinese()}月${origLunar.getDayInChinese()}`;
        }
        catch {
            targetLunarString = '';
        }
    }
    if (repeatType === 'none') {
        if (isLunar) {
            try {
                const lunar = lunar_javascript_1.Lunar.fromYmd(origY, origM, origD);
                const solar = lunar.getSolar();
                nextSolarDateStr = formatDate(solar.getYear(), solar.getMonth(), solar.getDay());
            }
            catch {
                nextSolarDateStr = event.target_date;
            }
        }
        else {
            nextSolarDateStr = event.target_date;
        }
    }
    else if (repeatType === 'year') {
        // Annual repeat (Birthdays, Anniversaries)
        if (!isLunar) {
            // Solar Year repeat
            let targetY = curY;
            // Handle Feb 29 for non-leap years
            let d = origD;
            if (origM === 2 && origD === 29) {
                const isCurLeap = (targetY % 4 === 0 && targetY % 100 !== 0) || (targetY % 400 === 0);
                if (!isCurLeap)
                    d = 28;
            }
            let candidate = formatDate(targetY, origM, d);
            if (candidate < currentTodayStr) {
                targetY = curY + 1;
                d = origD;
                if (origM === 2 && origD === 29) {
                    const isNextLeap = (targetY % 4 === 0 && targetY % 100 !== 0) || (targetY % 400 === 0);
                    if (!isNextLeap)
                        d = 28;
                }
                candidate = formatDate(targetY, origM, d);
            }
            nextSolarDateStr = candidate;
        }
        else {
            // Lunar Year repeat
            // Search in current year, if passed search next year
            let foundSolar = null;
            for (let y = curY; y <= curY + 3; y++) {
                try {
                    // Lunar.fromYmd(year, month, day)
                    // If leap month requested, try with negative month if supported or check leap
                    const lunarCandidate = isLeap ? lunar_javascript_1.Lunar.fromYmd(y, -origM, origD) : lunar_javascript_1.Lunar.fromYmd(y, origM, origD);
                    const solar = lunarCandidate.getSolar();
                    const candidateStr = formatDate(solar.getYear(), solar.getMonth(), solar.getDay());
                    if (candidateStr >= currentTodayStr) {
                        foundSolar = candidateStr;
                        break;
                    }
                }
                catch {
                    // If leap month doesn't exist in this year, fallback to normal month
                    try {
                        const lunarFallback = lunar_javascript_1.Lunar.fromYmd(y, origM, origD);
                        const solar = lunarFallback.getSolar();
                        const candidateStr = formatDate(solar.getYear(), solar.getMonth(), solar.getDay());
                        if (candidateStr >= currentTodayStr) {
                            foundSolar = candidateStr;
                            break;
                        }
                    }
                    catch { }
                }
            }
            nextSolarDateStr = foundSolar || event.target_date;
        }
    }
    else if (repeatType === 'month') {
        // Monthly repeat (e.g. Period, Bill payment)
        if (!isLunar) {
            let targetY = curY;
            let targetM = curM;
            // Get max days in target month
            const maxDays = new Date(targetY, targetM, 0).getDate();
            const actualD = Math.min(origD, maxDays);
            let candidate = formatDate(targetY, targetM, actualD);
            if (candidate < currentTodayStr) {
                targetM += repeatInterval;
                while (targetM > 12) {
                    targetM -= 12;
                    targetY += 1;
                }
                const nextMaxDays = new Date(targetY, targetM, 0).getDate();
                candidate = formatDate(targetY, targetM, Math.min(origD, nextMaxDays));
            }
            nextSolarDateStr = candidate;
        }
        else {
            // Lunar monthly repeat
            let foundSolar = null;
            const curSolarObj = lunar_javascript_1.Solar.fromYmd(curY, curM, curD);
            const curLunarObj = curSolarObj.getLunar();
            let lY = curLunarObj.getYear();
            let lM = curLunarObj.getMonth();
            for (let i = 0; i < 12; i++) {
                try {
                    const lunar = lunar_javascript_1.Lunar.fromYmd(lY, lM, origD);
                    const sol = lunar.getSolar();
                    const cand = formatDate(sol.getYear(), sol.getMonth(), sol.getDay());
                    if (cand >= currentTodayStr) {
                        foundSolar = cand;
                        break;
                    }
                }
                catch { }
                lM += 1;
                if (lM > 12) {
                    lM = 1;
                    lY += 1;
                }
            }
            nextSolarDateStr = foundSolar || event.target_date;
        }
    }
    else if (repeatType === 'week') {
        // Weekly repeat (e.g. Flag raising on Monday)
        let weekdays = [1]; // default Monday
        if (event.repeat_weekdays) {
            try {
                weekdays = JSON.parse(event.repeat_weekdays);
            }
            catch {
                weekdays = [1];
            }
        }
        const todayObj = new Date(currentTodayStr + 'T00:00:00Z');
        let curDayOfWeek = todayObj.getUTCDay(); // 0 is Sunday, 1-6 is Mon-Sat
        if (curDayOfWeek === 0)
            curDayOfWeek = 7; // Convert Sunday to 7
        let minOffset = 999;
        for (const targetWeekday of weekdays) {
            let offset = targetWeekday - curDayOfWeek;
            if (offset < 0) {
                offset += 7 * repeatInterval;
            }
            if (offset < minOffset) {
                minOffset = offset;
            }
        }
        const nextDateObj = new Date(todayObj.getTime() + minOffset * 24 * 3600 * 1000);
        nextSolarDateStr = formatDate(nextDateObj.getUTCFullYear(), nextDateObj.getUTCMonth() + 1, nextDateObj.getUTCDate());
    }
    else if (repeatType === 'custom_days') {
        // Repeat every N days
        const origDateObj = new Date(event.target_date + 'T00:00:00Z');
        const todayDateObj = new Date(currentTodayStr + 'T00:00:00Z');
        const intervalMs = repeatInterval * 24 * 3600 * 1000;
        let targetTime = origDateObj.getTime();
        while (targetTime < todayDateObj.getTime()) {
            targetTime += intervalMs;
        }
        const nextDateObj = new Date(targetTime);
        nextSolarDateStr = formatDate(nextDateObj.getUTCFullYear(), nextDateObj.getUTCMonth() + 1, nextDateObj.getUTCDate());
    }
    const daysRemaining = diffDays(currentTodayStr, nextSolarDateStr);
    const isToday = daysRemaining === 0;
    const daysPassed = Math.max(0, diffDays(event.target_date, currentTodayStr));
    const { year: nY, month: nM, day: nD } = parseDateOnly(nextSolarDateStr);
    const nextSolar = lunar_javascript_1.Solar.fromYmd(nY, nM, nD);
    const nextLunar = nextSolar.getLunar();
    const yearsCount = Math.max(0, nY - origY);
    // Calculate zodiac (生肖) and constellation (星座) ONLY when type is Birthday (生日)
    const isBirthday = (typeof event.category_name === 'string' && (event.category_name.includes('生日') || event.category_name.includes('生'))) ||
        (typeof event.title === 'string' && (event.title.includes('生日') || event.title.includes('生')));
    const birthLunar = origY ? lunar_javascript_1.Lunar.fromYmd(origY, 1, 1) : nextLunar;
    return {
        nextDate: nextSolarDateStr,
        daysRemaining,
        isToday,
        daysPassed,
        yearsCount,
        targetDateFormatted: event.target_date,
        lunarFormatted: `农历 ${nextLunar.getYearInGanZhi()}年 ${nextLunar.getMonthInChinese()}月${nextLunar.getDayInChinese()}`,
        zodiac: isBirthday ? birthLunar.getYearShengXiao() : undefined,
        ganzhi: nextLunar.getYearInGanZhi(),
        constellation: isBirthday ? nextSolar.getXingZuo() : undefined,
        solarTerm: nextLunar.getJieQi() || undefined,
        targetLunarString: targetLunarString || undefined
    };
}
const solarTermsData_1 = require("./solarTermsData");
function getCurrentSolarTermInfo(date) {
    const now = date || new Date();
    const solar = lunar_javascript_1.Solar.fromDate(now);
    const lunar = solar.getLunar();
    // Current/Previous JieQi in effect
    const prevJie = lunar.getPrevJieQi(true);
    const prevName = prevJie ? prevJie.getName() : '秋分';
    const prevSolar = prevJie ? prevJie.getSolar() : solar;
    const prevDateStr = prevSolar.toYmd();
    // Next JieQi
    const nextJie = lunar.getNextJieQi(false);
    const nextName = nextJie ? nextJie.getName() : '寒露';
    const nextSolar = nextJie ? nextJie.getSolar() : solar;
    const nextDateStr = nextSolar.toYmd();
    const todayStr = solar.toYmd();
    const daysToNext = diffDays(todayStr, nextDateStr);
    const detail = solarTermsData_1.SOLAR_TERMS_MAP[prevName] || solarTermsData_1.SOLAR_TERMS_MAP['秋分'];
    return {
        ...detail,
        currentDate: todayStr,
        termStartDate: prevDateStr,
        nextTermName: nextName,
        nextTermDate: nextDateStr,
        nextTermDays: Math.max(0, daysToNext),
        wuHou: lunar.getWuHou() || detail.phenology
    };
}
