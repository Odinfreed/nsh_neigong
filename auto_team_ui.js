/**
 * 自动分团系统UI集成
 * 与现有xg_guild_analysis_main.html和backup.html集成
 */

// ==================== 自动分团UI组件 ====================

/**
 * 初始化自动分团UI
 * 在页面加载完成后调用
 */
function initializeAutoTeamUI() {
    console.log('初始化自动分团UI...');
    
    // 检查是否已加载auto_team_system.js
    if (!window.autoTeamSystem) {
        console.error('自动分团系统未加载，请先引入auto_team_system.js');
        return;
    }
    
    // 添加自动分团按钮到智能分团标签页
    addAutoTeamButton();
    
    // 添加基础战力数据导入功能
    addBasePowerImportFeature();
    
    // 添加一线牵管理按钮
    addYixianqianButton();
    
    // 添加配置管理按钮
    addConfigManagerButton();
    
    // 添加自动分团配置面板
    addAutoTeamConfigPanel();
    
    console.log('自动分团UI初始化完成');
}

/**
 * 添加自动分团按钮
 */
function addAutoTeamButton() {
    // 查找智能分团标签页的操作区域
    const teamView = document.getElementById('teamView');
    if (!teamView) return;
    
    // 在快速操作区域添加自动分团按钮
    const quickActions = document.querySelector('#teamView .quick-actions');
    if (quickActions) {
        // 检查是否已存在
        if (document.getElementById('autoTeamButton')) return;
        
        const autoTeamBtn = document.createElement('button');
        autoTeamBtn.id = 'autoTeamButton';
        autoTeamBtn.className = 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-medium transition-all';
        autoTeamBtn.innerHTML = '<i class="fas fa-robot mr-2"></i>自动分团';
        autoTeamBtn.onclick = executeAutoTeamAllocation;
        autoTeamBtn.title = '使用智能算法自动分配团队';
        
        quickActions.appendChild(autoTeamBtn);
    }
}

/**
 * 添加基础战力数据导入功能
 */
function addBasePowerImportFeature() {
    // 在数据导入区域添加基础战力导入
    const importSection = document.getElementById('dataImportSection');
    if (!importSection) return;
    
    // 检查是否已存在
    if (document.getElementById('basePowerImportCard')) return;
    
    const card = document.createElement('div');
    card.id = 'basePowerImportCard';
    card.className = 'glass-card rounded-2xl p-6 shadow-xl';
    card.innerHTML = `
        <h3 class="text-lg font-bold mb-4 flex items-center">
            <i class="fas fa-shield-alt mr-2 text-purple-500"></i>
            基础战力数据导入
            <span class="ml-2 text-xs text-gray-400">(装备/内功/打造)</span>
        </h3>
        
        <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">数据格式</label>
                    <select id="basePowerFormat" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                        <option value="json">JSON格式</option>
                        <option value="csv">CSV格式</option>
                        <option value="excel">Excel表格</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">战力系数权重</label>
                    <div class="grid grid-cols-4 gap-1 text-xs text-center">
                        <div>装备</div>
                        <div>内功</div>
                        <div>打造</div>
                        <div>其他</div>
                    </div>
                    <div class="grid grid-cols-4 gap-1">
                        <input type="number" id="weightEquipment" value="40" min="0" max="100" class="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-center text-white">
                        <input type="number" id="weightNeigong" value="30" min="0" max="100" class="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-center text-white">
                        <input type="number" id="weightForging" value="20" min="0" max="100" class="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-center text-white">
                        <input type="number" id="weightOther" value="10" min="0" max="100" class="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-center text-white">
                    </div>
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">导入数据</label>
                <div class="flex space-x-2">
                    <input type="file" id="basePowerFile" accept=".json,.csv,.xlsx" class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                    <button onclick="importBasePowerData()" class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg">
                        <i class="fas fa-upload mr-2"></i>导入
                    </button>
                </div>
            </div>
            
            <div class="bg-gray-800 rounded-lg p-3">
                <div class="text-sm text-gray-400 mb-2">数据格式示例（JSON）：</div>
                <pre class="text-xs bg-black rounded p-2 overflow-x-auto">[
  {
    "playerName": "玩家名称",
    "equipmentScore": 8500,
    "neigongScore": 7200,
    "forgingScore": 6800,
    "otherScore": 5500
  }
]</pre>
            </div>
            
            <div id="basePowerStats" class="hidden">
                <div class="grid grid-cols-4 gap-4 text-center">
                    <div>
                        <div class="text-xl font-bold text-blue-400" id="basePowerCount">0</div>
                        <div class="text-xs text-gray-400">已导入</div>
                    </div>
                    <div>
                        <div class="text-xl font-bold text-green-400" id="basePowerAvg">0</div>
                        <div class="text-xs text-gray-400">平均分</div>
                    </div>
                    <div>
                        <div class="text-xl font-bold text-yellow-400" id="basePowerMax">0</div>
                        <div class="text-xs text-gray-400">最高分</div>
                    </div>
                    <div>
                        <div class="text-xl font-bold text-red-400" id="basePowerMin">0</div>
                        <div class="text-xs text-gray-400">最低分</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    importSection.appendChild(card);
    
    // 监听文件选择
    document.getElementById('basePowerFile').addEventListener('change', handleBasePowerFileSelect);
}

/**
 * 处理基础战力文件选择
 */
function handleBasePowerFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.json')) {
        // JSON格式
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                previewBasePowerData(data);
            } catch (error) {
                alert('JSON文件格式错误：' + error.message);
            }
        };
        reader.readAsText(file);
    } else if (fileName.endsWith('.csv')) {
        // CSV格式
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const csv = e.target.result;
                const data = parseCSV(csv);
                previewBasePowerData(data);
            } catch (error) {
                alert('CSV文件解析错误：' + error.message);
            }
        };
        reader.readAsText(file);
    } else {
        alert('暂不支持该文件格式，请先转换为JSON或CSV格式');
    }
}

/**
 * 解析CSV数据
 */
function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        
        headers.forEach((header, index) => {
            if (values[index] !== undefined) {
                // 转换为数字或保持字符串
                const numValue = parseFloat(values[index]);
                row[header] = isNaN(numValue) ? values[index] : numValue;
            }
        });
        
        data.push(row);
    }
    
    return data;
}

/**
 * 预览基础战力数据
 */
function previewBasePowerData(data) {
    if (!Array.isArray(data) || data.length === 0) {
        alert('数据格式错误');
        return;
    }
    
    // 验证数据结构
    const requiredFields = ['playerName'];
    const validData = data.filter(item => {
        return requiredFields.every(field => item[field] !== undefined);
    });
    
    if (validData.length === 0) {
        alert('数据格式错误，必须包含playerName字段');
        return;
    }
    
    // 显示统计信息
    const scores = validData.map(item => {
        const equipment = item.equipmentScore || 0;
        const neigong = item.neigongScore || 0;
        const forging = item.forgingScore || 0;
        const other = item.otherScore || 0;
        
        // 计算权重
        const weightEquipment = parseFloat(document.getElementById('weightEquipment').value) || 40;
        const weightNeigong = parseFloat(document.getElementById('weightNeigong').value) || 30;
        const weightForging = parseFloat(document.getElementById('weightForging').value) || 20;
        const weightOther = parseFloat(document.getElementById('weightOther').value) || 10;
        
        // 归一化并计算总分
        const totalWeight = weightEquipment + weightNeigong + weightForging + weightOther;
        const normalizedEquipment = (equipment / 10000) * (weightEquipment / totalWeight) * 100;
        const normalizedNeigong = (neigong / 10000) * (weightNeigong / totalWeight) * 100;
        const normalizedForging = (forging / 10000) * (weightForging / totalWeight) * 100;
        const normalizedOther = (other / 10000) * (weightOther / totalWeight) * 100;
        
        return normalizedEquipment + normalizedNeigong + normalizedForging + normalizedOther;
    });
    
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    
    // 显示统计
    document.getElementById('basePowerCount').textContent = validData.length;
    document.getElementById('basePowerAvg').textContent = avgScore.toFixed(1);
    document.getElementById('basePowerMax').textContent = maxScore.toFixed(1);
    document.getElementById('basePowerMin').textContent = minScore.toFixed(1);
    document.getElementById('basePowerStats').classList.remove('hidden');
    
    // 保存到系统
    window.basePowerData = validData;
    
    alert(`数据预览成功！\n共 ${validData.length} 条有效记录\n平均分：${avgScore.toFixed(1)}`);
}

/**
 * 导入基础战力数据
 */
function importBasePowerData() {
    if (!window.basePowerData) {
        alert('请先选择并预览数据文件');
        return;
    }
    
    // 导入到自动分团系统
    window.autoTeamSystem.importBasePowerData(window.basePowerData);
    
    // 清空临时数据
    delete window.basePowerData;
    
    alert('基础战力数据导入成功！');
    
    // 清空文件输入
    document.getElementById('basePowerFile').value = '';
}

/**
 * 添加一线牵管理按钮
 */
function addYixianqianButton() {
    const quickActions = document.querySelector('#teamView .quick-actions');
    if (!quickActions) return;
    
    // 检查是否已存在
    if (document.getElementById('yixianqianButton')) return;
    
    const btn = document.createElement('button');
    btn.id = 'yixianqianButton';
    btn.className = 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-4 py-2 rounded-lg font-medium transition-all';
    btn.innerHTML = '<i class="fas fa-link mr-2"></i>一线牵';
    btn.onclick = showYixianqianManager;
    btn.title = '管理一线牵配对';
    
    quickActions.appendChild(btn);
}

/**
 * 添加配置管理按钮
 */
function addConfigManagerButton() {
    const quickActions = document.querySelector('#teamView .quick-actions');
    if (!quickActions) return;
    
    // 检查是否已存在
    if (document.getElementById('configManagerButton')) return;
    
    const btn = document.createElement('button');
    btn.id = 'configManagerButton';
    btn.className = 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all';
    btn.innerHTML = '<i class="fas fa-cog mr-2"></i>配置管理';
    btn.onclick = showConfigManager;
    btn.title = '保存/加载/导出配置';
    
    quickActions.appendChild(btn);
}

/**
 * 添加自动分团配置面板
 */
function addAutoTeamConfigPanel() {
    const teamView = document.getElementById('teamView');
    if (!teamView) return;
    
    // 检查是否已存在
    if (document.getElementById('autoTeamConfigPanel')) return;
    
    const panel = document.createElement('div');
    panel.id = 'autoTeamConfigPanel';
    panel.className = 'glass-card rounded-2xl p-6 shadow-xl mb-6';
    panel.innerHTML = `
        <h3 class="text-lg font-bold mb-4 flex items-center">
            <i class="fas fa-sliders-h mr-2 text-blue-500"></i>
            自动分团配置
            <span class="ml-2 text-xs text-gray-400">(算法参数与权重)</span>
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- 算法选择 -->
            <div class="space-y-3">
                <div class="font-semibold text-sm text-gray-300">算法启用</div>
                <div class="space-y-2">
                    <label class="flex items-center space-x-2">
                        <input type="checkbox" id="enableGreedy" checked class="rounded">
                        <span class="text-sm">局部贪心算法</span>
                        <span class="text-xs text-gray-400">(快速但可能局部最优)</span>
                    </label>
                    <label class="flex items-center space-x-2">
                        <input type="checkbox" id="enableSimulatedAnnealing" checked class="rounded">
                        <span class="text-sm">模拟退火算法</span>
                        <span class="text-xs text-gray-400">(避免局部最优)</span>
                    </label>
                    <label class="flex items-center space-x-2">
                        <input type="checkbox" id="enableGenetic" checked class="rounded">
                        <span class="text-sm">遗传算法</span>
                        <span class="text-xs text-gray-400">(全局搜索)</span>
                    </label>
                    <label class="flex items-center space-x-2">
                        <input type="checkbox" id="enableOrTools" checked class="rounded">
                        <span class="text-sm">OR-Tools约束规划</span>
                        <span class="text-xs text-gray-400">(精确约束求解)</span>
                    </label>
                </div>
            </div>
            
            <!-- 评分权重 -->
            <div class="space-y-3">
                <div class="font-semibold text-sm text-gray-300">评分权重</div>
                <div class="space-y-2">
                    <div>
                        <label class="block text-xs text-gray-400 mb-1">波动比权重</label>
                        <input type="range" id="weightFluctuation" min="0" max="100" value="35" class="w-full">
                        <div class="text-xs text-center"><span id="weightFluctuationValue">35</span>%</div>
                    </div>
                    <div>
                        <label class="block text-xs text-gray-400 mb-1">基础战力权重</label>
                        <input type="range" id="weightBasePower" min="0" max="100" value="25" class="w-full">
                        <div class="text-xs text-center"><span id="weightBasePowerValue">25</span>%</div>
                    </div>
                    <div>
                        <label class="block text-xs text-gray-400 mb-1">团队平衡权重</label>
                        <input type="range" id="weightBalance" min="0" max="100" value="25" class="w-full">
                        <div class="text-xs text-center"><span id="weightBalanceValue">25</span>%</div>
                    </div>
                    <div>
                        <label class="block text-xs text-gray-400 mb-1">一线牵权重</label>
                        <input type="range" id="weightYixianqian" min="0" max="100" value="15" class="w-full">
                        <div class="text-xs text-center"><span id="weightYixianqianValue">15</span>%</div>
                    </div>
                </div>
            </div>
            
            <!-- 团队结构配置 -->
            <div class="space-y-3">
                <div class="font-semibold text-sm text-gray-300">团队结构</div>
                <div class="space-y-2">
                    <div class="grid grid-cols-3 gap-2">
                        <div>
                            <label class="block text-xs text-gray-400 mb-1">大团组数</label>
                            <input type="number" id="mainTeamGroups" value="8" min="1" max="20" class="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm">
                        </div>
                        <div>
                            <label class="block text-xs text-gray-400 mb-1">防守组数</label>
                            <input type="number" id="defenseTeamGroups" value="2" min="0" max="10" class="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm">
                        </div>
                        <div>
                            <label class="block text-xs text-gray-400 mb-1">机动组数</label>
                            <input type="number" id="mobileTeamGroups" value="2" min="0" max="10" class="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-xs text-gray-400 mb-1">每组人数上限</label>
                        <input type="number" id="maxPerGroup" value="12" min="1" max="15" class="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm">
                    </div>
                    
                    <div class="pt-2">
                        <button onclick="applyAutoTeamConfig()" class="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">
                            <i class="fas fa-check mr-2"></i>应用配置
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    teamView.insertBefore(panel, teamView.firstChild);
    
    // 添加滑块事件监听
    setupConfigSliderListeners();
}

/**
 * 设置配置滑块事件监听
 */
function setupConfigSliderListeners() {
    // 权重滑块
    const sliders = [
        'weightFluctuation',
        'weightBasePower',
        'weightBalance',
        'weightYixianqian'
    ];
    
    sliders.forEach(sliderId => {
        const slider = document.getElementById(sliderId);
        const valueDisplay = document.getElementById(sliderId + 'Value');
        
        if (slider && valueDisplay) {
            slider.addEventListener('input', function() {
                valueDisplay.textContent = this.value;
            });
        }
    });
}

/**
 * 应用自动分团配置
 */
function applyAutoTeamConfig() {
    const config = window.autoTeamSystem.config;
    
    // 更新算法启用状态
    config.algorithms.greedy.enabled = document.getElementById('enableGreedy').checked;
    config.algorithms.simulatedAnnealing.enabled = document.getElementById('enableSimulatedAnnealing').checked;
    config.algorithms.genetic.enabled = document.getElementById('enableGenetic').checked;
    config.algorithms.ortools.enabled = document.getElementById('enableOrTools').checked;
    
    // 更新权重
    config.weights.fluctuation = parseFloat(document.getElementById('weightFluctuation').value) / 100;
    config.weights.basePower = parseFloat(document.getElementById('weightBasePower').value) / 100;
    config.weights.balance = parseFloat(document.getElementById('weightBalance').value) / 100;
    config.weights.yixianqian = parseFloat(document.getElementById('weightYixianqian').value) / 100;
    
    // 更新团队结构
    config.teamStructure.mainTeam.groups = parseInt(document.getElementById('mainTeamGroups').value);
    config.teamStructure.defenseTeam.groups = parseInt(document.getElementById('defenseTeamGroups').value);
    config.teamStructure.mobileTeam.groups = parseInt(document.getElementById('mobileTeamGroups').value);
    
    const maxPerGroup = parseInt(document.getElementById('maxPerGroup').value);
    config.teamStructure.mainTeam.maxPerGroup = maxPerGroup;
    config.teamStructure.defenseTeam.maxPerGroup = maxPerGroup;
    config.teamStructure.mobileTeam.maxPerGroup = maxPerGroup;
    
    alert('自动分团配置已应用！');
}

// ==================== 成员池搜索修复 ====================

/**
 * 修复成员池搜索问题
 * 确保成员池包含所有帮会的成员
 */
function fixMemberPoolSearch() {
    console.log('修复成员池搜索...');
    
    // 重写renderMemberPool函数（如果不存在则添加）
    if (typeof renderMemberPool === 'function') {
        const originalRenderMemberPool = renderMemberPool;
        
        window.renderMemberPool = function() {
            const container = document.getElementById('squadMemberPool');
            if (!container) return;

            const selectedGuild = dataSourceManager.selectedGuild;
            let players = [];

            if (!selectedGuild) {
                container.innerHTML = '<div class="text-center text-gray-400 py-4">请先选择帮会</div>';
                return;
            }

            // 获取所有帮会的成员（修复：包含所有帮会）
            const allGuilds = Object.keys(dataSourceManager.guilds);
            
            // 如果配置中启用了"显示所有帮会成员"，则显示所有
            const showAllGuilds = localStorage.getItem('showAllGuildsInPool') === 'true';
            
            if (showAllGuilds && allGuilds.length > 1) {
                // 显示所有帮会的成员
                allGuilds.forEach(guildName => {
                    const guildPlayers = getGuildPlayers(guildName);
                    players = players.concat(guildPlayers);
                });
                
                // 去重（按玩家名字）
                const uniquePlayers = [];
                const playerNames = new Set();
                
                players.forEach(player => {
                    if (!playerNames.has(player['玩家名字'])) {
                        uniquePlayers.push(player);
                        playerNames.add(player['玩家名字']);
                    }
                });
                
                players = uniquePlayers;
            } else {
                // 只显示当前选中帮会的成员（原逻辑）
                players = getGuildPlayers(selectedGuild);
            }

            // 过滤已分配的成员
            const assignedPlayers = getAllAssignedPlayers();
            players = players.filter(player => !assignedPlayers.includes(player['玩家名字']));

            if (players.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-400 py-4">暂无未分配成员</div>';
                return;
            }

            let html = '';
            players.forEach(player => {
                // 计算数据侧重颜色
                const dataColor = getPlayerDataColor(player);
                html += renderDraggableMember(player, dataColor);
            });

            container.innerHTML = html;
        };
    }
    
    // 添加"显示所有帮会成员"选项
    addShowAllGuildsOption();
}

/**
 * 添加"显示所有帮会成员"选项
 */
function addShowAllGuildsOption() {
    const memberPoolCard = document.getElementById('memberPoolCard');
    if (!memberPoolCard) return;
    
    // 检查是否已存在
    if (document.getElementById('showAllGuildsCheckbox')) return;
    
    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'mt-2 pt-2 border-t border-gray-600';
    checkboxContainer.innerHTML = `
        <label class="flex items-center space-x-2 text-sm text-gray-300">
            <input type="checkbox" id="showAllGuildsCheckbox" class="rounded">
            <span>显示所有帮会成员</span>
        </label>
    `;
    
    const cardHeader = memberPoolCard.querySelector('.card-header');
    if (cardHeader) {
        cardHeader.appendChild(checkboxContainer);
    }
    
    // 添加事件监听
    document.getElementById('showAllGuildsCheckbox').addEventListener('change', function() {
        localStorage.setItem('showAllGuildsInPool', this.checked);
        renderMemberPool(); // 重新渲染
    });
    
    // 恢复上次的选择
    const savedValue = localStorage.getItem('showAllGuildsInPool') === 'true';
    document.getElementById('showAllGuildsCheckbox').checked = savedValue;
}

/**
 * 获取帮会玩家（辅助函数）
 */
function getGuildPlayers(guildName) {
    const playerHistory = dataSourceManager.getGuildPlayerHistory(guildName);
    const players = [];
    
    Object.keys(playerHistory).forEach(playerName => {
        const history = playerHistory[playerName];
        if (history.length > 0) {
            // 使用最新数据
            players.push(history[history.length - 1]);
        }
    });
    
    return players;
}

// ==================== 数据导出 ====================

/**
 * 导出当前团队配置
 */
function exportCurrentTeamConfig() {
    const config = {
        teams: teams,
        timestamp: new Date().toISOString(),
        totalPlayers: getAllAssignedPlayers().length
    };
    
    const dataStr = JSON.stringify(config, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `team_config_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    alert('团队配置已导出！');
}

// ==================== 装备CSV导入集成 ====================

/**
 * 添加装备CSV导入功能
 */
function addEquipmentCSVImportFeature() {
    // 在基础战力导入卡片后添加CSV导入卡片
    const equipmentScript = document.createElement('script');
    equipmentScript.src = '../equipment_csv_importer.js';
    equipmentScript.onload = function() {
        console.log('装备CSV导入器已加载');
        // CSV导入UI会在脚本加载后自动初始化
    };
    document.head.appendChild(equipmentScript);
}

// ==================== 初始化 ====================

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化，等待其他脚本加载
    setTimeout(() => {
        initializeAutoTeamUI();
        fixMemberPoolSearch();
        addEquipmentCSVImportFeature();
    }, 500);
});

console.log('自动分团UI集成已加载');
