/**
 * 个人分析多场数据对比模块 - v4.0.0 (重构版)
 * 用于在个人分析全屏界面中展示多场数据的对比和波动比计算
 * 
 * 核心逻辑：
 * 1. 参战率：按游戏ID统计，不区分职业
 * 2. 趋势图/波动比：只显示同名同职业的数据
 */

const MULTI_BATTLE_CACHE_KEY = 'multiBattleCache_v4';

// 格式化大数值为带计量单位的字符串（亿/万/千）
function formatNumberCompact(num) {
    if (num === undefined || num === null || isNaN(num)) return '0';
    const n = Number(num);
    
    if (n >= 100000000) return (n / 100000000).toFixed(2) + '亿';
    if (n >= 10000) return (n / 10000).toFixed(2) + '万';
    if (n >= 1000) return (n / 1000).toFixed(1) + '千';
    
    return Math.round(n).toString();
}

// 格式化小数值（用于紧凑显示）
function formatSmallNumber(num) {
    if (num === undefined || num === null || isNaN(num)) return '0';
    const n = Number(num);
    
    if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿';
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    
    return Math.round(n).toString();
}

// ==================== 数据获取 ====================

/**
 * 获取多场缓存数据
 */
function getMultiBattleCache() {
    try {
        // 首先检查是否有导入的档案码数据
        const importedCache = localStorage.getItem('importedCardMultiCache');
        if (importedCache) {
            const parsed = JSON.parse(importedCache);
            if (parsed && parsed.length > 0) {
                return parsed;
            }
        }
        
        // 然后尝试从主系统的全局变量获取
        if (typeof multiBattleCache !== 'undefined' && multiBattleCache.length > 0) {
            return multiBattleCache;
        }
        
        // 否则从 localStorage 获取常规缓存
        const cache = localStorage.getItem(MULTI_BATTLE_CACHE_KEY);
        return cache ? JSON.parse(cache) : [];
    } catch (e) {
        console.error('读取多场缓存失败:', e);
        return [];
    }
}

/**
 * 获取指定玩家在多场中的数据（不过滤职业）
 * 用于参战率计算
 */
function getPlayerMultiBattleData(playerName) {
    const cache = getMultiBattleCache();
    const playerData = [];
    
    cache.forEach(battle => {
        const guilds = battle.guilds || battle.data || {};
        const guildNames = Object.keys(guilds);
        
        Object.entries(guilds).forEach(([rawGuildName, players], index) => {
            const player = players.find(p => p['玩家名字'] === playerName);
            if (player) {
                // 根据索引获取自定义名称
                let displayGuildName;
                if (index === 0 && battle.guild1Name) {
                    displayGuildName = battle.guild1Name;
                } else if (index === 1 && battle.guild2Name) {
                    displayGuildName = battle.guild2Name;
                } else {
                    displayGuildName = rawGuildName;
                }
                
                playerData.push({
                    battleTime: battle.dateTime || battle.battleTime,
                    timestamp: battle.timestamp,
                    guildName: displayGuildName,  // 使用自定义名称
                    guild1Name: battle.guild1Name || guildNames[0],
                    guild2Name: battle.guild2Name || guildNames[1],
                    ...player
                });
            }
        });
    });
    
    playerData.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    return playerData;
}

/**
 * 获取指定玩家的参战率信息（按ID统计，不区分职业）
 */
function getPlayerAttendanceInfo(playerName) {
    const cache = getMultiBattleCache();
    if (cache.length === 0) return null;
    
    let attended = 0;
    cache.forEach(battle => {
        const guilds = battle.guilds || battle.data || {};
        Object.values(guilds).forEach(players => {
            if (players.find(p => p['玩家名字'] === playerName)) {
                attended++;
            }
        });
    });
    
    return {
        total: cache.length,
        attended: attended,
        rate: Math.round((attended / cache.length) * 100)
    };
}

// ==================== 涨幅波动比计算 ====================

// 计算涨幅波动比：以平均数为基准，计算每个数据点相对于平均数的涨跌幅波动
function calculateFluctuationRatio(values) {
    if (values.length < 2) return { cv: 0, stability: 1, mean: values[0] || 0, avgChangeRate: 0 };
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return { cv: 0, stability: 1, mean: 0, avgChangeRate: 0 };
    
    // 计算每个数据点相对于平均数的涨跌幅（百分比）
    const changeRates = values.map(val => ((val - mean) / mean) * 100);
    
    // 计算涨跌幅的平均值（理论上接近0）
    const avgChangeRate = changeRates.reduce((a, b) => a + b, 0) / changeRates.length;
    
    // 计算涨跌幅的波动（标准差）
    const variance = changeRates.reduce((sum, rate) => sum + Math.pow(rate - avgChangeRate, 2), 0) / changeRates.length;
    const stdDev = Math.sqrt(variance);
    
    // CV基于涨跌幅的标准差（除以100将百分比转换为小数）
    const cv = stdDev / 100;
    
    // 稳定性：涨跌幅波动越小越稳定
    const stability = Math.max(0, Math.min(1, 1 - cv));
    
    return { cv, stability, mean, stdDev, avgChangeRate, changeRates };
}

function calculatePlayerFluctuations(multiData) {
    if (multiData.length < 2) return null;
    
    const metrics = ['对玩家伤害', '对建筑伤害', '击败', '助攻', '治疗值', '承受伤害', '重伤', '破泉', '化羽', '清泉'];
    const fluctuations = {};
    
    metrics.forEach(key => {
        const values = multiData.map(d => parseFloat(d[key]) || 0).filter(v => v > 0);
        if (values.length >= 2) {
            fluctuations[key] = calculateFluctuationRatio(values);
        }
    });
    
    return { battleCount: multiData.length, fluctuations };
}

// ==================== 图表渲染 ====================

function renderPlayerTimelineChart(canvasId, metricKey, metricName, color, multiData) {
    if (multiData.length < 1) return null;
    
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    
    const labels = multiData.map(d => {
        const date = new Date(d.battleTime || d.timestamp);
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    });
    
    const data = multiData.map(d => parseFloat(d[metricKey]) || 0);
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    
    // 销毁旧图表
    if (window.playerMultiCharts && window.playerMultiCharts[canvasId]) {
        window.playerMultiCharts[canvasId].destroy();
    }
    if (!window.playerMultiCharts) window.playerMultiCharts = {};
    
    window.playerMultiCharts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: metricName,
                data: data,
                borderColor: color,
                backgroundColor: color + '20',
                fill: true,
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: color,
                pointBorderColor: '#fff',
                pointBorderWidth: 1
            }, {
                label: '平均值',
                data: Array(data.length).fill(mean),
                borderColor: '#888',
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    display: true,
                    labels: { color: '#888', font: { size: 10 }, boxWidth: 10 }
                },
                datalabels: {
                    display: true,
                    align: 'top',
                    offset: 4,
                    color: color,
                    font: { size: 9 },
                    formatter: (value) => formatSmallNumber(value)
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: '#00d4aa',
                    bodyColor: '#e0e0e0',
                    borderColor: '#00d4aa',
                    borderWidth: 1,
                    callbacks: {
                        label: (context) => {
                            return `${context.dataset.label}: ${formatNumberCompact(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: { 
                    ticks: { color: '#666', font: { size: 9 } }, 
                    grid: { color: '#222' } 
                },
                y: { 
                    ticks: { 
                        color: '#666', 
                        font: { size: 9 },
                        callback: (val) => formatSmallNumber(val)
                    }, 
                    grid: { color: '#222' } 
                }
            }
        }
    });
    
    return window.playerMultiCharts[canvasId];
}

// ==================== UI渲染 ====================

function renderTrendCharts(multiData, activeMetrics) {
    const container = document.getElementById('playerMultiBattleTrendCharts');
    if (!container) return;

    // 清空容器
    container.innerHTML = '';

    if (activeMetrics.length === 0 || multiData.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-8 bg-gray-800/30 rounded">
                <i class="fas fa-info-circle text-2xl mb-2"></i>
                <p>暂无同职业多场数据</p>
                <p class="text-xs mt-1">需要至少2场相同职业的数据</p>
            </div>
        `;
        return;
    }

    // 生成图表网格
    let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
    activeMetrics.forEach(metric => {
        html += `
            <div class="bg-[#0d0d0d] border border-gray-800 rounded p-3">
                <h5 class="text-xs text-gray-500 mb-2">${metric.label}</h5>
                <div class="relative" style="height: 160px;">
                    <canvas id="playerTrendChart_${metric.key}"></canvas>
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;

    // 渲染图表
    setTimeout(() => {
        activeMetrics.forEach(metric => {
            renderPlayerTimelineChart(`playerTrendChart_${metric.key}`, metric.key, metric.label, metric.color, multiData);
        });
    }, 50);
}

function renderFluctuationPanel(multiData) {
    const container = document.getElementById('playerFluctuationPanel');
    if (!container) return;

    if (multiData.length < 2) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-info-circle text-2xl mb-3"></i>
                <p>该玩家同职业数据不足</p>
                <p class="text-xs mt-2">需要至少2场相同职业的数据</p>
            </div>
        `;
        return;
    }

    const result = calculatePlayerFluctuations(multiData);
    if (!result || Object.keys(result.fluctuations).length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-4">暂无波动数据</div>';
        return;
    }

    const { fluctuations, battleCount } = result;
    const sortedMetrics = Object.entries(fluctuations).sort((a, b) => b[1].stability - a[1].stability);

    let html = `
        <div class="mb-3 text-xs text-gray-400">
            <i class="fas fa-chart-line mr-1"></i>
            基于 ${battleCount} 场同职业数据
            <span class="ml-2 text-gray-500">| 以平均数为基准计算涨幅波动</span>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
    `;

    sortedMetrics.forEach(([metric, data]) => {
        const stabilityColor = data.stability >= 0.8 ? 'text-green-400' :
                              data.stability >= 0.6 ? 'text-yellow-400' : 'text-red-400';
        const bgColor = data.stability >= 0.8 ? 'bg-green-500/10 border-green-500/30' :
                       data.stability >= 0.6 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30';
        const badgeColor = data.stability >= 0.8 ? 'bg-green-500/20 text-green-400' :
                          data.stability >= 0.6 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400';

        const meanValue = formatNumberCompact(data.mean);
        // 涨跌幅的标准差（百分比）
        const changeRateStdDev = data.stdDev.toFixed(1);
        // 最大单边涨幅（估计值：均值 + 2倍标准差）
        const maxUpRate = (data.avgChangeRate + 2 * data.stdDev).toFixed(0);
        const maxDownRate = (data.avgChangeRate - 2 * data.stdDev).toFixed(0);

        html += `
            <div class="${bgColor} border rounded p-2 min-w-0">
                <div class="text-xs text-gray-400 mb-1 truncate" title="${metric}">${metric}</div>
                <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-bold text-gray-200 whitespace-nowrap">${meanValue}</span>
                    <span class="text-xs ${stabilityColor}">${(data.stability * 100).toFixed(0)}%</span>
                </div>
                <div class="flex items-center justify-between mb-1">
                    <span class="text-xs px-1.5 py-0.5 rounded ${badgeColor}">波动 ±${changeRateStdDev}%</span>
                </div>
                <div class="flex items-center justify-between text-xs">
                    <span class="text-gray-500">区间: ${maxDownRate}% ~ +${maxUpRate}%</span>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function renderMultiBattleTable(multiData, activeMetrics) {
    const container = document.getElementById('playerMultiBattleTable');
    if (!container) return;

    if (multiData.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-4">暂无同职业多场数据</div>';
        return;
    }

    const metrics = activeMetrics.length > 0 ? activeMetrics : [
        { key: '对玩家伤害', label: '伤害' },
        { key: '击败', label: '击败' },
        { key: '治疗值', label: '治疗' },
        { key: '对建筑伤害', label: '建筑' }
    ];

    let html = `
        <table class="w-full text-xs table-fixed">
            <thead class="text-gray-500 border-b border-gray-700">
                <tr>
                    <th class="text-left py-2" style="width: 60px;">时间</th>
                    <th class="text-left" style="width: 80px;">帮会</th>
                    ${metrics.map(m => `<th class="text-right" style="width: 70px;">${m.label}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
    `;

    multiData.forEach((data, index) => {
        const date = new Date(data.battleTime || data.timestamp);
        const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        const isLatest = index === multiData.length - 1;

        html += `
            <tr class="border-b border-gray-800 ${isLatest ? 'bg-jade/10' : ''}">
                <td class="py-2 text-gray-400 whitespace-nowrap">${dateStr}</td>
                <td class="text-gray-300 truncate" title="${data.guildName || '-'}">${data.guildName || '-'}</td>
                ${metrics.map(m => {
                    const val = parseFloat(data[m.key]) || 0;
                    return `<td class="text-right text-gray-300 whitespace-nowrap">${formatNumberCompact(val)}</td>`;
                }).join('')}
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function updateTimeRange(multiData) {
    const rangeEl = document.getElementById('playerMultiBattleTimeRange');
    if (!rangeEl || multiData.length === 0) {
        if (rangeEl) rangeEl.textContent = '';
        return;
    }
    
    const sorted = [...multiData].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    const first = new Date(sorted[0].battleTime || sorted[0].timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    const last = new Date(sorted[sorted.length - 1].battleTime || sorted[sorted.length - 1].timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    
    rangeEl.textContent = `${first} - ${last} · 共${multiData.length}场`;
}

// ==================== 主入口 ====================

const PlayerMultiAnalysis = {
    /**
     * 初始化个人多场分析
     * @param {string} playerName - 玩家名称
     * @param {string} currentProfession - 当前职业（用于过滤同名同职业数据）
     */
    init(playerName, currentProfession) {
        if (!playerName) return;

        // 1. 获取所有同名数据（用于参战率）
        const allData = getPlayerMultiBattleData(playerName);
        
        // 2. 按职业过滤，只保留同名同职业数据（用于趋势图/波动比）
        const sameProfessionData = currentProfession 
            ? allData.filter(d => (d['职业'] || '') === currentProfession)
            : allData;

        // 3. 定义所有指标
        const allMetrics = [
            { key: '对玩家伤害', label: '伤害', color: '#00d4aa' },
            { key: '击败', label: '击败', color: '#c9a227' },
            { key: '治疗值', label: '治疗', color: '#2E86DE' },
            { key: '对建筑伤害', label: '建筑', color: '#FF4757' },
            { key: '承受伤害', label: '承伤', color: '#9b59b6' },
            { key: '助攻', label: '助攻', color: '#e67e22' },
            { key: '重伤', label: '重伤', color: '#e74c3c' },
            { key: '化羽', label: '化羽', color: '#1abc9c' },
            { key: '破泉', label: '破泉', color: '#3498db' },
            { key: '清泉', label: '清泉', color: '#00bcd4' }
        ];

        // 4. 过滤出有非零数据的指标
        const activeMetrics = allMetrics.filter(metric => 
            sameProfessionData.some(d => (parseFloat(d[metric.key]) || 0) > 0)
        );

        // 5. 更新时间范围（显示同名同职业的数据范围）
        updateTimeRange(sameProfessionData);

        // 6. 渲染趋势图（只显示同名同职业数据）
        renderTrendCharts(sameProfessionData, activeMetrics);

        // 7. 渲染波动比面板（只显示同名同职业数据）
        renderFluctuationPanel(sameProfessionData);

        // 8. 渲染数据明细表（只显示同名同职业数据）
        renderMultiBattleTable(sameProfessionData, activeMetrics);
    },

    /**
     * 获取玩家参战率信息（按ID统计，不区分职业）
     */
    getAttendanceInfo(playerName) {
        return getPlayerAttendanceInfo(playerName);
    }
};

// 导出到全局
if (typeof window !== 'undefined') {
    window.PlayerMultiAnalysis = PlayerMultiAnalysis;
}
