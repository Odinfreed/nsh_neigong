/**
 * 装备内功打造CSV数据导入器
 * 专门处理装备内功打造.csv格式的数据
 */

class EquipmentCSVImporter {
    constructor() {
        this.csvData = [];
        this.parsedData = [];
    }

    /**
     * 解析CSV文本
     * @param {string} csvText - CSV文件内容
     * @returns {Array} 解析后的数据
     */
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];

        // 解析标题行
        const headers = this.parseCSVLine(lines[0]);
        const data = [];

        // 解析数据行
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = this.parseCSVLine(lines[i]);
                const row = {};
                headers.forEach((header, index) => {
                    if (values[index] !== undefined) {
                        row[header] = values[index];
                    }
                });
                data.push(row);
            }
        }

        return data;
    }

    /**
     * 解析单行CSV（处理引号和逗号）
     * @param {string} line - CSV行
     * @returns {Array} 字段数组
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current.trim());
        return result;
    }

    /**
     * 提取装备评分
     * @param {Object} row - CSV数据行
     * @returns {number} 装备评分
     */
    calculateEquipmentScore(row) {
        let totalScore = 0;
        let itemCount = 0;

        // 装备类型和等级的映射关系
        const equipmentColumns = [
            { typeCol: '武器类型', levelCol: '武器类等级' },
            { typeCol: '头饰类型', levelCol: '头饰类等级' },
            { typeCol: '护腕类型', levelCol: '护腕类等级' },
            { typeCol: '衣服类型', levelCol: '衣服类等级' },
            { typeCol: '手部类型', levelCol: '手部类等级' },
            { typeCol: '腰带类型', levelCol: '腰带类等级' },
            { typeCol: '鞋子类型', levelCol: '鞋子类等级' },
            { typeCol: '镯子类型（一）', levelCol: '镯子等级（一）' },
            { typeCol: '镯子类型（二）', levelCol: '镯子（二）等级' },
            { typeCol: '戒指类型（一）', levelCol: '戒指（一）等级' },
            { typeCol: '戒指类型（二）', levelCol: '戒指（二）等级' },
            { typeCol: '项链类型', levelCol: '项链等级' }
        ];

        equipmentColumns.forEach(equip => {
            const type = row[equip.typeCol] || '';
            let level = row[equip.levelCol] || '';

            // 提取等级数字
            const levelMatch = level.toString().match(/(\d+)/);
            const levelNum = levelMatch ? parseInt(levelMatch[1]) : 0;

            // 根据类型和等级计算分数
            let typeMultiplier = 1;
            if (type.includes('独珍')) typeMultiplier = 1.2;
            else if (type.includes('竞技橙')) typeMultiplier = 1.1;
            else if (type.includes('竞技百炼')) typeMultiplier = 1.0;
            else if (type.includes('百炼')) typeMultiplier = 0.9;
            else if (type.includes('副本')) typeMultiplier = 0.8;

            if (levelNum > 0) {
                totalScore += levelNum * typeMultiplier * 10;
                itemCount++;
            }
        });

        // 添加橙武额外加分
        const weaponType = row['武器类型'] || '';
        const weaponLevel = row['武器类等级'] || '';
        if (weaponLevel.includes('橙武')) {
            totalScore += 500; // 橙武额外加分
        }

        return Math.round(totalScore);
    }

    /**
     * 提取内功评分
     * @param {Object} row - CSV数据行
     * @returns {number} 内功评分
     */
    calculateNeigongScore(row) {
        // 内功属性：金、木、水、火、土
        const neigongTypes = ['内功情况（如果有荡江斗按多一属性来算）:金', 
                             '内功情况（如果有荡江斗按多一属性来算）:木',
                             '内功情况（如果有荡江斗按多一属性来算）:水',
                             '内功情况（如果有荡江斗按多一属性来算）:火',
                             '内功情况（如果有荡江斗按多一属性来算）:土'];

        let totalLevel = 0;
        let attributeCount = 0;

        neigongTypes.forEach(typeCol => {
            const value = row[typeCol] || '0';
            const levelMatch = value.toString().match(/(\d+)/);
            const level = levelMatch ? parseInt(levelMatch[1]) : 0;

            if (level > 0) {
                totalLevel += level;
                attributeCount++;
            }
        });

        // 内功评分 = 总等级 * 属性数量 * 系数
        const score = totalLevel * attributeCount * 50;
        return Math.round(score);
    }

    /**
     * 提取打造评分
     * @param {Object} row - CSV数据行
     * @returns {number} 打造评分
     */
    calculateForgingScore(row) {
        const forgingStatus = row['打造情况'] || '';

        // 打造评分标准
        const forgingScores = {
            '当赛季打造': 8000,
            '往期过渡打造': 6000,
            '无': 4000
        };

        // 精确匹配
        if (forgingScores[forgingStatus]) {
            return forgingScores[forgingStatus];
        }

        // 模糊匹配
        if (forgingStatus.includes('当赛季')) return 8000;
        if (forgingStatus.includes('往期')) return 6000;

        return 4000;
    }

    /**
     * 提取其他评分（如技能书、特殊装备等）
     * @param {Object} row - CSV数据行
     * @returns {number} 其他评分
     */
    calculateOtherScore(row) {
        let score = 0;

        // 检查是否有备注中的特殊技能
        const note = row['备注（共cd/范围绝技）'] || '';
        if (note.includes('绝技') || note.includes('九天')) {
            score += 1000;
        }

        // 检查一线牵（有固定搭档加分）
        const yixianqian = row['一线牵（对方id或无）'] || '';
        if (yixianqian && yixianqian !== '无') {
            score += 500;
        }

        // 职业溢出二职（多职业加分）
        const secondProfession = row['职业溢出可选二职'] || '';
        if (secondProfession) {
            score += 300;
        }

        return score;
    }

    /**
     * 提取一线牵配对信息
     * @param {Object} row - CSV数据行
     * @returns {Object} 一线牵信息
     */
    extractYixianqian(row) {
        const partner = row['一线牵（对方id或无）'] || '';
        if (!partner || partner === '无') return null;

        return {
            player: row['游戏名'],
            partner: partner,
            type: this.determinePlayerType(row) // 自动判断玩家类型
        };
    }

    /**
     * 判断玩家类型（击杀型/资源型/辅助型等）
     * @param {Object} row - CSV数据行
     * @returns {string} 玩家类型
     */
    determinePlayerType(row) {
        const profession = row['主职业（主打职业）'] || '';
        const positions = {
            '主/副职业游戏定位:拆塔': row['主/副职业游戏定位:拆塔'] || '0',
            '主/副职业游戏定位:治疗': row['主/副职业游戏定位:治疗'] || '0',
            '主/副职业游戏定位:辅助（针对潮光）': row['主/副职业游戏定位:辅助（针对潮光）'] || '0',
            '主/副职业游戏定位:防守': row['主/副职业游戏定位:防守'] || '0',
            '主/副职业游戏定位:保镖': row['主/副职业游戏定位:保镖'] || '0'
        };

        // 解析定位数值
        const scores = {};
        Object.keys(positions).forEach(key => {
            const value = positions[key];
            const match = value.toString().match(/(\d+)/);
            scores[key] = match ? parseInt(match[1]) : 0;
        });

        // 判断类型
        if (scores['主/副职业游戏定位:拆塔'] >= 2) return '资源型';
        if (scores['主/副职业游戏定位:保镖'] >= 1) return '击杀型';
        if (scores['主/副职业游戏定位:治疗'] >= 2) return '辅助型';
        if (scores['主/副职业游戏定位:防守'] >= 2) return '防守型';

        // 根据职业默认类型
        const dpsProfessions = ['碎梦', '血河', '龙吟', '玄机', '鸿音'];
        if (dpsProfessions.includes(profession)) return '击杀型';

        const supportProfessions = ['素问', '潮光'];
        if (supportProfessions.includes(profession)) return '辅助型';

        return '综合型';
    }

    /**
     * 转换CSV行为自动分团系统格式
     * @param {Array} csvData - CSV数据
     * @returns {Array} 转换后的数据
     */
    convertToAutoTeamFormat(csvData) {
        return csvData.map(row => {
            const playerName = row['游戏名'] || row['填表人'] || row['提交者'];

            return {
                playerName: playerName,
                equipmentScore: this.calculateEquipmentScore(row),
                neigongScore: this.calculateNeigongScore(row),
                forgingScore: this.calculateForgingScore(row),
                otherScore: this.calculateOtherScore(row),
                profession: row['主职业（主打职业）'] || '未知',
                yixianqian: this.extractYixianqian(row),
                rawData: row // 保留原始数据
            };
        }).filter(item => item.playerName); // 过滤空玩家名
    }

    /**
     * 导入CSV文件
     * @param {File} file - CSV文件
     * @param {Function} callback - 回调函数
     */
    importCSVFile(file, callback) {
        const reader = new FileReader();
        const self = this;

        reader.onload = function(e) {
            try {
                const csvText = e.target.result;
                self.csvData = self.parseCSV(csvText);
                self.parsedData = self.convertToAutoTeamFormat(self.csvData);

                if (callback) {
                    callback({
                        success: true,
                        data: self.parsedData,
                        count: self.parsedData.length
                    });
                }
            } catch (error) {
                if (callback) {
                    callback({
                        success: false,
                        error: error.message
                    });
                }
            }
        };

        reader.onerror = function() {
            if (callback) {
                callback({
                    success: false,
                    error: '文件读取失败'
                });
            }
        };

        reader.readAsText(file, 'UTF-8');
    }

    /**
     * 获取统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        if (!this.parsedData || this.parsedData.length === 0) {
            return null;
        }

        const equipmentScores = this.parsedData.map(p => p.equipmentScore);
        const neigongScores = this.parsedData.map(p => p.neigongScore);
        const forgingScores = this.parsedData.map(p => p.forgingScore);
        const totalScores = this.parsedData.map(p => 
            p.equipmentScore + p.neigongScore + p.forgingScore + p.otherScore
        );

        const calculateAvg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;

        return {
            totalPlayers: this.parsedData.length,
            equipment: {
                avg: Math.round(calculateAvg(equipmentScores)),
                max: Math.max(...equipmentScores),
                min: Math.min(...equipmentScores)
            },
            neigong: {
                avg: Math.round(calculateAvg(neigongScores)),
                max: Math.max(...neigongScores),
                min: Math.min(...neigongScores)
            },
            forging: {
                avg: Math.round(calculateAvg(forgingScores)),
                max: Math.max(...forgingScores),
                min: Math.min(...forgingScores)
            },
            total: {
                avg: Math.round(calculateAvg(totalScores)),
                max: Math.max(...totalScores),
                min: Math.min(...totalScores)
            },
            yixianqianPairs: this.parsedData.filter(p => p.yixianqian).length
        };
    }

    /**
     * 自动导入到自动分团系统
     */
    importToAutoTeamSystem() {
        if (!window.autoTeamSystem) {
            throw new Error('自动分团系统未加载');
        }

        if (!this.parsedData || this.parsedData.length === 0) {
            throw new Error('没有可导入的数据');
        }

        // 导入基础战力数据
        window.autoTeamSystem.importBasePowerData(this.parsedData);

        // 导入一线牵配对
        let importedPairs = 0;
        this.parsedData.forEach(player => {
            if (player.yixianqian) {
                const partnerRow = this.csvData.find(row => 
                    (row['游戏名'] || row['填表人']) === player.yixianqian.partner
                );

                if (partnerRow) {
                    const partnerType = this.determinePlayerType(partnerRow);
                    window.autoTeamSystem.addYixianqianPair(
                        player.playerName,
                        player.yixianqian.partner,
                        player.yixianqian.type,
                        partnerType
                    );
                    importedPairs++;
                }
            }
        });

        return {
            players: this.parsedData.length,
            pairs: importedPairs
        };
    }
}

// ==================== UI集成 ====================

/**
 * 创建装备内功打造CSV导入UI
 */
function createEquipmentCSVImportUI() {
    const teamView = document.getElementById('teamView');
    if (!teamView) return;

    // 检查是否已存在
    if (document.getElementById('equipmentCSVImportCard')) return;

    const card = document.createElement('div');
    card.id = 'equipmentCSVImportCard';
    card.className = 'glass-card rounded-2xl p-6 shadow-xl mb-6';
    card.innerHTML = `
        <h3 class="text-lg font-bold mb-4 flex items-center">
            <i class="fas fa-file-csv mr-2 text-green-500"></i>
            装备内功打造CSV导入
            <span class="ml-2 text-xs text-gray-400">(批量导入玩家数据)</span>
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- 文件选择和预览 -->
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">选择CSV文件</label>
                    <div class="flex space-x-2">
                        <input type="file" id="equipmentCSVFile" accept=".csv" class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm">
                        <button onclick="previewEquipmentCSV()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                            <i class="fas fa-eye mr-2"></i>预览
                        </button>
                    </div>
                </div>
                
                <div id="equipmentCSVPreview" class="hidden">
                    <label class="block text-sm font-medium mb-2">数据预览（前5条）</label>
                    <div id="equipmentCSVPreviewContent" class="bg-gray-800 rounded-lg p-3 max-h-48 overflow-y-auto text-xs"></div>
                </div>
            </div>
            
            <!-- 统计信息 -->
            <div class="space-y-4">
                <div id="equipmentCSVStats" class="hidden">
                    <label class="block text-sm font-medium mb-2">导入统计</label>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div class="bg-gray-800 rounded-lg p-3 text-center">
                            <div class="text-xl font-bold text-blue-400" id="csvTotalPlayers">0</div>
                            <div class="text-xs text-gray-400">总玩家数</div>
                        </div>
                        <div class="bg-gray-800 rounded-lg p-3 text-center">
                            <div class="text-xl font-bold text-pink-400" id="csvYixianqianPairs">0</div>
                            <div class="text-xs text-gray-400">一线牵配对</div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-2 mt-3 text-xs">
                        <div class="bg-gray-800 rounded p-2 text-center">
                            <div class="text-blue-400 font-bold" id="csvEquipmentAvg">0</div>
                            <div class="text-gray-400">装备均分</div>
                        </div>
                        <div class="bg-gray-800 rounded p-2 text-center">
                            <div class="text-green-400 font-bold" id="csvNeigongAvg">0</div>
                            <div class="text-gray-400">内功均分</div>
                        </div>
                        <div class="bg-gray-800 rounded p-2 text-center">
                            <div class="text-yellow-400 font-bold" id="csvForgingAvg">0</div>
                            <div class="text-gray-400">打造均分</div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <button onclick="importEquipmentCSV()" id="importEquipmentCSVBtn" class="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium" disabled>
                        <i class="fas fa-upload mr-2"></i>导入到自动分团系统
                    </button>
                </div>
                
                <div class="bg-gray-800 rounded-lg p-3">
                    <div class="text-xs text-gray-400 mb-2">数据映射说明：</div>
                    <div class="text-xs space-y-1">
                        <div class="flex justify-between">
                            <span>游戏名/填表人</span>
                            <span class="text-green-400">→ 玩家名称</span>
                        </div>
                        <div class="flex justify-between">
                            <span>装备等级总和</span>
                            <span class="text-blue-400">→ 装备评分</span>
                        </div>
                        <div class="flex justify-between">
                            <span>内功五行等级</span>
                            <span class="text-purple-400">→ 内功评分</span>
                        </div>
                        <div class="flex justify-between">
                            <span>打造情况</span>
                            <span class="text-yellow-400">→ 打造评分</span>
                        </div>
                        <div class="flex justify-between">
                            <span>一线牵字段</span>
                            <span class="text-pink-400">→ 自动配对</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 插入到基础战力导入卡片之前或之后
    const basePowerCard = document.getElementById('basePowerImportCard');
    if (basePowerCard) {
        basePowerCard.parentNode.insertBefore(card, basePowerCard.nextSibling);
    } else {
        // 如果没有基础战力卡片，插入到团队视图开头
        teamView.insertBefore(card, teamView.firstChild);
    }

    // 添加文件选择监听
    document.getElementById('equipmentCSVFile').addEventListener('change', handleEquipmentCSVFileSelect);
}

// 全局变量存储CSV导入器实例
window.equipmentCSVImporter = new EquipmentCSVImporter();

/**
 * 处理装备CSV文件选择
 */
function handleEquipmentCSVFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 验证文件类型
    if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('请选择CSV格式的文件');
        return;
    }

    // 自动预览
    setTimeout(() => {
        previewEquipmentCSV();
    }, 100);
}

/**
 * 预览装备内功打造CSV
 */
function previewEquipmentCSV() {
    const fileInput = document.getElementById('equipmentCSVFile');
    const file = fileInput.files[0];

    if (!file) {
        alert('请先选择CSV文件');
        return;
    }

    // 显示加载状态
    const previewContent = document.getElementById('equipmentCSVPreviewContent');
    previewContent.innerHTML = '<div class="text-center text-gray-400 py-4"><i class="fas fa-spinner fa-spin mr-2"></i>正在解析...</div>';
    document.getElementById('equipmentCSVPreview').classList.remove('hidden');

    // 解析CSV
    window.equipmentCSVImporter.importCSVFile(file, function(result) {
        if (result.success) {
            // 显示预览数据
            const previewData = result.data.slice(0, 5);
            let html = '<table class="w-full text-xs">';
            
            // 表头
            html += '<thead><tr class="border-b border-gray-600">';
            html += '<th class="text-left p-1">玩家</th>';
            html += '<th class="text-left p-1">职业</th>';
            html += '<th class="text-right p-1">装备分</th>';
            html += '<th class="text-right p-1">内功分</th>';
            html += '<th class="text-right p-1">打造分</th>';
            html += '<th class="text-left p-1">类型</th>';
            html += '</tr></thead>';

            // 数据行
            html += '<tbody>';
            previewData.forEach(player => {
                const totalScore = player.equipmentScore + player.neigongScore + 
                                 player.forgingScore + player.otherScore;
                html += '<tr class="border-b border-gray-700">';
                html += `<td class="p-1 font-medium">${player.playerName}</td>`;
                html += `<td class="p-1 text-gray-400">${player.profession}</td>`;
                html += `<td class="p-1 text-right text-blue-400">${player.equipmentScore}</td>`;
                html += `<td class="p-1 text-right text-green-400">${player.neigongScore}</td>`;
                html += `<td class="p-1 text-right text-yellow-400">${player.forgingScore}</td>`;
                html += `<td class="p-1 text-pink-400">${player.yixianqian ? '一线牵' : ''}</td>`;
                html += '</tr>';
            });
            html += '</tbody></table>';

            previewContent.innerHTML = html;

            // 显示统计
            const stats = window.equipmentCSVImporter.getStats();
            if (stats) {
                document.getElementById('csvTotalPlayers').textContent = stats.totalPlayers;
                document.getElementById('csvYixianqianPairs').textContent = stats.yixianqianPairs;
                document.getElementById('csvEquipmentAvg').textContent = stats.equipment.avg;
                document.getElementById('csvNeigongAvg').textContent = stats.neigong.avg;
                document.getElementById('csvForgingAvg').textContent = stats.forging.avg;

                document.getElementById('equipmentCSVStats').classList.remove('hidden');
                document.getElementById('importEquipmentCSVBtn').disabled = false;
            }

            alert(`CSV预览成功！\n共 ${result.count} 条玩家数据`);
        } else {
            previewContent.innerHTML = `<div class="text-red-400 py-4">解析失败：${result.error}</div>`;
            document.getElementById('importEquipmentCSVBtn').disabled = true;
        }
    });
}

/**
 * 导入装备CSV到自动分团系统
 */
function importEquipmentCSV() {
    const importBtn = document.getElementById('importEquipmentCSVBtn');
    importBtn.disabled = true;
    importBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>导入中...';

    setTimeout(() => {
        try {
            const result = window.equipmentCSVImporter.importToAutoTeamSystem();

            // 重新渲染成员池（如果已初始化）
            if (typeof renderMemberPool === 'function') {
                renderMemberPool();
            }

            alert(`导入成功！\n玩家数据：${result.players} 条\n一线牵配对：${result.pairs} 对`);

            // 恢复按钮状态
            importBtn.disabled = false;
            importBtn.innerHTML = '<i class="fas fa-upload mr-2"></i>导入到自动分团系统';

            // 关闭预览
            document.getElementById('equipmentCSVPreview').classList.add('hidden');
            document.getElementById('equipmentCSVFile').value = '';

        } catch (error) {
            alert('导入失败：' + error.message);
            importBtn.disabled = false;
            importBtn.innerHTML = '<i class="fas fa-upload mr-2"></i>导入到自动分团系统';
        }
    }, 100);
}

/**
 * 初始化装备CSV导入UI
 */
function initializeEquipmentCSVImport() {
    // 延迟执行，等待页面加载完成
    setTimeout(() => {
        createEquipmentCSVImportUI();
        console.log('装备内功打造CSV导入UI已初始化');
    }, 1000);
}

// 页面加载完成后自动初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeEquipmentCSVImport();
});

console.log('装备内功打造CSV导入器已加载');
