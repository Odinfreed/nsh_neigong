/**
 * XG数据集成中心
 * 打通数据管理中心与手动/智能分团系统的数据流
 */

class XGDataIntegration {
    constructor() {
        this.dataCenter = window.xgDataCenter;
        this.autoTeamSystem = window.autoTeamSystem;
        this.isInitialized = false;
    }
    
    /**
     * 初始化集成
     */
    init() {
        if (this.isInitialized) return;
        
        console.log('初始化XG数据集成中心...');
        
        // 确保依赖已加载
        if (!this.dataCenter) {
            console.error('XG数据管理中心未加载');
            return;
        }
        
        // 添加UI集成
        this.addUIIntegration();
        
        // 添加数据同步按钮
        this.addDataSyncButtons();
        
        // 添加快捷入口
        this.addQuickAccess();
        
        this.isInitialized = true;
        console.log('XG数据集成中心初始化完成');
    }
    
    // ==================== UI集成 ====================
    
    /**
     * 添加UI集成元素
     */
    addUIIntegration() {
        // 在手动分团页面添加数据导入入口
        this.addManualTeamImportButton();
        
        // 在智能分团页面添加数据源选择
        this.addAutoTeamDataSourceSelector();
    }
    
    /**
     * 添加手动分团数据导入按钮
     */
    addManualTeamImportButton() {
        const teamView = document.getElementById('teamView');
        if (!teamView) return;
        
        // 检查是否已存在
        if (document.getElementById('dataCenterImportBtn')) return;
        
        // 在quick-actions区域添加按钮
        const quickActions = document.querySelector('#teamView .quick-actions');
        if (!quickActions) return;
        
        const btn = document.createElement('button');
        btn.id = 'dataCenterImportBtn';
        btn.className = 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-all';
        btn.innerHTML = '<i class="fas fa-database mr-2"></i>数据中心';
        btn.onclick = () => this.showImportDialog();
        btn.title = '从数据管理中心导入成员数据';
        
        quickActions.appendChild(btn);
    }
    
    /**
     * 添加智能分团数据源选择器
     */
    addAutoTeamDataSourceSelector() {
        const configPanel = document.getElementById('autoTeamConfigPanel');
        if (!configPanel) return;
        
        // 检查是否已存在
        if (document.getElementById('dataSourceSelector')) return;
        
        const selectorDiv = document.createElement('div');
        selectorDiv.id = 'dataSourceSelector';
        selectorDiv.className = 'glass-card rounded-2xl p-4 shadow-xl mb-4';
        selectorDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <h4 class="font-bold flex items-center">
                    <i class="fas fa-database mr-2 text-indigo-500"></i>
                    分团数据源
                </h4>
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-400">当前数据源：</span>
                    <span id="currentDataSource" class="text-sm font-bold text-indigo-400">未选择</span>
                </div>
            </div>
            
            <div class="mt-3 space-y-2">
                <label class="flex items-center space-x-2">
                    <input type="radio" name="allocationDataSource" value="relay" class="text-indigo-500" checked>
                    <span class="text-sm">接龙名单（仅导入名单成员）</span>
                </label>
                <label class="flex items-center space-x-2">
                    <input type="radio" name="allocationDataSource" value="battle" class="text-indigo-500">
                    <span class="text-sm">帮战数据（全部成员）</span>
                </label>
                <label class="flex items-center space-x-2">
                    <input type="radio" name="allocationDataSource" value="merged" class="text-indigo-500">
                    <span class="text-sm">合并数据（接龙名单 + 补充数据）</span>
                </label>
            </div>
            
            <div class="mt-3 text-xs text-gray-400">
                <div>接龙名单成员：<span id="relayMemberCount">0</span> 人</div>
                <div>帮战数据成员：<span id="battleMemberCount">0</span> 人</div>
            </div>
        `;
        
        configPanel.parentNode.insertBefore(selectorDiv, configPanel.nextSibling);
        
        // 更新计数
        this.updateDataSourceCounts();
        
        // 添加事件监听
        document.querySelectorAll('input[name="allocationDataSource"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateCurrentDataSource();
            });
        });
    }
    
    /**
     * 更新数据源计数
     */
    updateDataSourceCounts() {
        const relayCount = this.dataCenter.dataSources.relay.length;
        const battleCount = Object.values(this.dataCenter.dataSources.battle).reduce(
            (sum, session) => sum + session.data.length, 0
        );
        
        const relayCountEl = document.getElementById('relayMemberCount');
        const battleCountEl = document.getElementById('battleMemberCount');
        
        if (relayCountEl) relayCountEl.textContent = relayCount;
        if (battleCountEl) battleCountEl.textContent = battleCount;
    }
    
    /**
     * 更新当前数据源显示
     */
    updateCurrentDataSource() {
        const selected = document.querySelector('input[name="allocationDataSource"]:checked');
        const currentDataSourceEl = document.getElementById('currentDataSource');
        
        if (selected && currentDataSourceEl) {
            const sourceName = {
                'relay': '接龙名单',
                'battle': '帮战数据',
                'merged': '合并数据'
            }[selected.value];
            
            currentDataSourceEl.textContent = sourceName;
        }
    }
    
    /**
     * 添加数据同步按钮
     */
    addDataSyncButtons() {
        // 在自动分团结果页面添加导入按钮
        this.addImportToManualButton();
    }
    
    /**
     * 添加导入到手动分团的按钮
     */
    addImportToManualButton() {
        // 延迟执行，等待页面加载
        setTimeout(() => {
            const statsPanel = document.getElementById('allocationStatsPanel');
            if (!statsPanel) return;
            
            // 检查是否已存在
            if (document.getElementById('importToManualBtn')) return;
            
            const btn = document.createElement('button');
            btn.id = 'importToManualBtn';
            btn.className = 'w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-4 py-3 rounded-lg font-medium mt-4 transition-all';
            btn.innerHTML = '<i class="fas fa-download mr-2"></i>导入到手动编辑器继续调整';
            btn.onclick = () => this.importToManualEditor();
            
            statsPanel.appendChild(btn);
        }, 2000);
    }
    
    /**
     * 添加快捷访问入口
     */
    addQuickAccess() {
        // 在导航栏添加数据管理中心入口
        this.addDataCenterNavItem();
    }
    
    /**
     * 添加导航栏项目
     */
    addDataCenterNavItem() {
        // 查找导航栏
        const navContainer = document.querySelector('.nav-container') || document.querySelector('.tab-container');
        if (!navContainer) return;
        
        // 检查是否已存在
        if (document.getElementById('navDataCenter')) return;
        
        const navItem = document.createElement('button');
        navItem.id = 'navDataCenter';
        navItem.className = 'tab-btn px-4 py-2 font-medium text-gray-300 hover:text-white';
        navItem.innerHTML = '<i class="fas fa-database mr-2"></i>数据中心';
        navItem.onclick = () => toggleDataCenterUI();
        
        navContainer.appendChild(navItem);
    }
    
    // ==================== 数据导入功能 ====================
    
    /**
     * 显示数据导入对话框
     */
    showImportDialog() {
        const dialog = document.createElement('div');
        dialog.id = 'dataImportDialog';
        dialog.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        dialog.innerHTML = `
            <div class="glass-card rounded-2xl p-6 shadow-2xl max-w-2xl w-full mx-4">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold">从数据中心导入</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div class="bg-blue-900 bg-opacity-30 rounded-lg p-3 text-sm">
                        <div class="font-semibold mb-2 text-blue-400">
                            <i class="fas fa-info-circle mr-1"></i>导入说明
                        </div>
                        <div class="text-gray-300 text-xs space-y-1">
                            <div>• 从接龙名单中导入成员到手动分团编辑器</div>
                            <div>• 只导入有接龙名单的成员，按职业分类显示</div>
                            <div>• 导入后可在成员池中进行拖拽分配</div>
                        </div>
                    </div>
                    
                    <div class="space-y-2">
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" id="importWithYxq" checked class="rounded text-pink-500">
                            <span class="text-sm">保留一线牵配对关系（自动将配对成员放在相邻位置）</span>
                        </label>
                        
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" id="importWithStats" checked class="rounded text-blue-500">
                            <span class="text-sm">导入历史统计数据（如战力、职业偏好等）</span>
                        </label>
                    </div>
                    
                    <div class="flex space-x-2 pt-4">
                        <button onclick="xgDataIntegration.importFromDataCenter()" class="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-4 py-3 rounded-lg font-medium">
                            <i class="fas fa-download mr-2"></i>开始导入
                        </button>
                        <button onclick="this.closest('.fixed').remove()" class="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
                            取消
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
    }
    
    /**
     * 从数据中心导入数据
     */
    importFromDataCenter() {
        try {
            const importWithYxq = document.getElementById('importWithYxq')?.checked || false;
            const importWithStats = document.getElementById('importWithStats')?.checked || false;
            
            // 获取分配数据
            const allocationData = this.dataCenter.getDataForAutoAllocation();
            
            if (!allocationData || allocationData.length === 0) {
                alert('数据中心暂无接龙名单数据，请先导入接龙名单');
                return;
            }
            
            console.log(`准备导入 ${allocationData.length} 名成员到手动编辑器`);
            
            // 转换数据格式
            const players = this.convertToManualFormat(allocationData, importWithStats);
            
            // 导入到手动分团系统
            this.importToManualSystem(players, importWithYxq);
            
            // 关闭对话框
            document.getElementById('dataImportDialog')?.remove();
            
            alert(`成功导入 ${players.length} 名成员！\n请在成员池中查看并进行拖拽分配`);
            
        } catch (error) {
            console.error('导入失败:', error);
            alert('导入失败: ' + error.message);
        }
    }
    
    /**
     * 将数据中心数据转换为手动分团格式
     */
    convertToManualFormat(allocationData, includeStats = false) {
        return allocationData.map(item => {
            const player = {
                '玩家名字': item.xg_relay_game_id,
                '职业': item.xg_relay_profession || '未知',
                'member_uid': item.member_uid
            };
            
            if (includeStats) {
                // 添加统计数据
                if (item.xg_bz_击败) player['击败'] = item.xg_bz_击败;
                if (item.xg_bz_资源) player['资源'] = item.xg_bz_资源;
                if (item.xg_bz_对玩家伤害) player['对玩家伤害'] = item.xg_bz_对玩家伤害;
                if (item.xg_bz_对建筑伤害) player['对建筑伤害'] = item.xg_bz_对建筑伤害;
                if (item.xg_bz_治疗值) player['治疗值'] = item.xg_bz_治疗值;
                
                // 添加一线牵信息
                if (item.xg_yxq_partner) {
                    player['一线牵搭档'] = this.dataCenter.getRelayDataByUid(item.xg_yxq_partner)?.xg_relay_game_id;
                }
            }
            
            return player;
        });
    }
    
    /**
     * 导入到手动分团系统
     */
    importToManualSystem(players, preserveYxq = false) {
        // 将玩家添加到数据源管理器
        if (window.dataSourceManager) {
            // 创建临时帮会存储
            const guildName = `接龙名单_${new Date().toLocaleDateString()}`;
            const sessionId = `relay_${Date.now()}`;
            
            window.dataSourceManager.addGuildData(guildName, sessionId, players);
            window.dataSourceManager.selectedGuild = guildName;
            window.dataSourceManager.updateGuildSelector();
        }
        
        // 刷新成员池
        if (window.renderMemberPool) {
            window.renderMemberPool();
        }
        
        // 处理一线牵配对
        if (preserveYxq) {
            this.processYxqPairs(players);
        }
        
        // 重新渲染团队视图
        if (window.renderAllTeams) {
            window.renderAllTeams();
        }
    }
    
    /**
     * 处理一线牵配对
     */
    processYxqPairs(players) {
        const yxqPairs = [];
        
        players.forEach(player => {
            if (player['一线牵搭档']) {
                const pair = [player['玩家名字'], player['一线牵搭档']].sort();
                const pairKey = pair.join('|');
                
                // 避免重复添加
                if (!yxqPairs.includes(pairKey)) {
                    yxqPairs.push(pairKey);
                    
                    // 添加到一线牵管理
                    if (window.autoTeamSystem) {
                        window.autoTeamSystem.addYixianqianPair(
                            player['玩家名字'],
                            player['一线牵搭档'],
                            '自动检测',
                            '自动检测'
                        );
                    }
                }
            }
        });
        
        console.log(`处理了 ${yxqPairs.length} 对一线牵关系`);
    }
    
    /**
     * 导入智能分团结果到手动编辑器
     */
    importToManualEditor() {
        try {
            if (!this.autoTeamSystem || !this.autoTeamSystem.assignment) {
                alert('请先执行智能分团');
                return;
            }
            
            const assignment = this.autoTeamSystem.assignment;
            
            // 转换团队结构
            const teamStructure = {};
            
            Object.keys(assignment.teams).forEach(teamName => {
                teamStructure[teamName] = [];
                
                assignment.teams[teamName].forEach((group, index) => {
                    teamStructure[teamName].push({
                        name: group.name || `${teamName}_${index + 1}`,
                        limit: group.limit || 12,
                        members: group.members.map(m => m['玩家名字'] || m.xg_relay_game_id)
                    });
                });
            });
            
            // 导入到手动分团系统
            if (window.teamStructure !== undefined) {
                window.teamStructure = teamStructure;
                
                // 重新渲染
                if (window.renderAllTeams) {
                    window.renderAllTeams();
                }
                if (window.updateTeamAnalysisTable) {
                    window.updateTeamAnalysisTable();
                }
                if (window.updateTeamRightPanel) {
                    window.updateTeamRightPanel();
                }
                
                alert('智能分团方案已导入到手动编辑器！\n您可以继续手动调整分配');
            } else {
                alert('手动分团系统未加载');
            }
            
        } catch (error) {
            console.error('导入失败:', error);
            alert('导入失败: ' + error.message);
        }
    }
    
    // ==================== 智能分团集成 ====================
    
    /**
     * 执行智能分团（使用数据中心作为数据源）
     */
    executeAutoAllocation() {
        try {
            if (!this.autoTeamSystem) {
                alert('自动分团系统未加载');
                return;
            }
            
            // 获取数据源类型
            const dataSourceType = this.getSelectedDataSource();
            
            let players = [];
            let fluctuations = {};
            
            if (dataSourceType === 'relay') {
                // 使用接龙名单数据
                const allocationData = this.dataCenter.getDataForAutoAllocation();
                players = this.convertForAutoTeam(allocationData);
                
                // 计算波动比（简化版）
                fluctuations = this.calculateFluctuations(allocationData);
                
            } else if (dataSourceType === 'battle') {
                // 使用帮战数据
                alert('帮战数据模式开发中，暂使用接龙名单');
                return;
            } else {
                // 合并模式
                alert('合并模式开发中，暂使用接龙名单');
                return;
            }
            
            if (players.length === 0) {
                alert('数据源为空，请先导入数据');
                return;
            }
            
            // 显示加载状态
            if (window.showLoadingOverlay) {
                window.showLoadingOverlay('正在执行智能分团计算...');
            }
            
            // 异步执行分团
            setTimeout(() => {
                try {
                    // 导入一线牵配对到自动分团系统
                    this.importYxqPairsToAutoTeam();
                    
                    // 执行分团
                    const result = this.autoTeamSystem.allocateTeams(players, fluctuations);
                    
                    // 应用结果
                    if (window.applyAllocationResult) {
                        window.applyAllocationResult(result);
                    }
                    if (window.showAllocationStats) {
                        window.showAllocationStats(result);
                    }
                    
                    if (window.hideLoadingOverlay) {
                        window.hideLoadingOverlay();
                    }
                    
                    alert(`智能分团完成！\n算法：${result.algorithm}\n得分：${result.score.toFixed(2)}`);
                    
                } catch (error) {
                    if (window.hideLoadingOverlay) {
                        window.hideLoadingOverlay();
                    }
                    console.error('分团失败:', error);
                    alert('分团失败: ' + error.message);
                }
            }, 100);
            
        } catch (error) {
            console.error('执行失败:', error);
            alert('执行失败: ' + error.message);
        }
    }
    
    /**
     * 获取选中的数据源类型
     */
    getSelectedDataSource() {
        const selected = document.querySelector('input[name="allocationDataSource"]:checked');
        return selected ? selected.value : 'relay';
    }
    
    /**
     * 转换为自动分团系统格式
     */
    convertForAutoTeam(allocationData) {
        return allocationData.map(item => {
            return {
                '玩家名字': item.xg_relay_game_id,
                '职业': item.xg_relay_profession || '未知',
                'member_uid': item.member_uid,
                ...item // 包含所有其他字段
            };
        });
    }
    
    /**
     * 计算波动比（简化版）
     */
    calculateFluctuations(allocationData) {
        const fluctuations = {};
        
        allocationData.forEach(item => {
            const gameId = item.xg_relay_game_id;
            
            // 简化的波动比计算
            fluctuations[gameId] = {
                '对玩家伤害': parseFloat(item.xg_bz_对玩家伤害 || 0) / 1000000,
                '对建筑伤害': parseFloat(item.xg_bz_对建筑伤害 || 0) / 1000000,
                '治疗值': parseFloat(item.xg_bz_治疗值 || 0) / 1000000,
                '资源': parseFloat(item.xg_bz_资源 || 0) / 1000
            };
        });
        
        return fluctuations;
    }
    
    /**
     * 导入一线牵配对到自动分团系统
     */
    importYxqPairsToAutoTeam() {
        if (!this.autoTeamSystem) return;
        
        // 清空现有配对
        this.autoTeamSystem.config.yixianqian.pairs = [];
        
        // 导入数据中心的一线牵
        this.dataCenter.dataSources.yxq.forEach(yxqItem => {
            const member1Name = yxqItem.xg_yxq_member1_game_id;
            const member2Name = yxqItem.xg_yxq_member2_game_id;
            
            this.autoTeamSystem.addYixianqianPair(
                member1Name,
                member2Name,
                '数据中心导入',
                '数据中心导入'
            );
        });
        
        console.log(`已导入 ${this.dataCenter.dataSources.yxq.length} 对一线牵关系到自动分团系统`);
    }
    
    // ==================== 工具函数 ====================
    
    /**
     * 显示加载状态
     */
    showLoading(message) {
        if (window.showLoadingOverlay) {
            window.showLoadingOverlay(message);
        }
    }
    
    /**
     * 隐藏加载状态
     */
    hideLoading() {
        if (window.hideLoadingOverlay) {
            window.hideLoadingOverlay();
        }
    }
    
    /**
     * 显示成功消息
     */
    showSuccess(message) {
        alert(message);
    }
    
    /**
     * 显示错误消息
     */
    showError(message) {
        alert('错误: ' + message);
    }
}

// ==================== 全局实例 ====================

// 创建全局数据集成中心实例
window.xgDataIntegration = new XGDataIntegration();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化，等待依赖加载
    setTimeout(() => {
        window.xgDataIntegration.init();
        console.log('XG数据集成中心已初始化');
    }, 1000);
});

// 重写自动分团函数，集成数据源选择
const originalExecuteAutoTeamAllocation = window.executeAutoTeamAllocation;
if (originalExecuteAutoTeamAllocation) {
    window.executeAutoTeamAllocation = function() {
        // 使用数据集成中心执行
        if (window.xgDataIntegration) {
            window.xgDataIntegration.executeAutoAllocation();
        } else {
            // 回退到原始函数
            originalExecuteAutoTeamAllocation();
        }
    };
}

// 重写导入函数
const originalImportToManualEditor = window.importToManualEditor;
if (originalImportToManualEditor) {
    window.importToManualEditor = function() {
        // 使用数据集成中心导入
        if (window.xgDataIntegration) {
            window.xgDataIntegration.importToManualEditor();
        } else if (originalImportToManualEditor) {
            originalImportToManualEditor();
        }
    };
}

console.log('XG数据集成中心脚本已加载');