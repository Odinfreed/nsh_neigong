/**
 * XG数据管理中心UI
 * 提供接龙名单导入、一线牵配对、ID映射管理等界面
 */

class XGDataCenterUI {
    constructor() {
        this.dataCenter = window.xgDataCenter;
        this.currentTab = 'relay';
    }
    
    // ==================== 主界面 ====================
    
    /**
     * 创建数据管理中心主界面
     */
    createMainUI() {
        // 检查是否已存在
        if (document.getElementById('xgDataCenterUI')) return;
        
        const container = document.createElement('div');
        container.id = 'xgDataCenterUI';
        container.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        container.innerHTML = `
            <div class="glass-card rounded-2xl p-6 shadow-2xl max-w-6xl w-full mx-4 max-h-screen overflow-hidden flex flex-col">
                <!-- 头部 -->
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        <i class="fas fa-database mr-2"></i>数据管理中心
                    </h2>
                    <div class="flex items-center space-x-2">
                        <button onclick="xgDataCenterUI.saveAllData()" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                            <i class="fas fa-save mr-1"></i>保存
                        </button>
                        <button onclick="xgDataCenterUI.closeUI()" class="text-gray-400 hover:text-white">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>
                
                <!-- 统计信息 -->
                <div id="dataCenterStats" class="grid grid-cols-5 gap-4 mb-6 p-4 bg-gray-800 rounded-lg">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-400" id="statTotalMembers">0</div>
                        <div class="text-xs text-gray-400">总成员数</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-400" id="statRelayCount">0</div>
                        <div class="text-xs text-gray-400">接龙名单</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-purple-400" id="statBattleCount">0</div>
                        <div class="text-xs text-gray-400">帮战数据</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-pink-400" id="statYxqGroupCount">0</div>
                        <div class="text-xs text-gray-400">一线牵组</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-yellow-400" id="statLastUpdate">-</div>
                        <div class="text-xs text-gray-400">最后更新</div>
                    </div>
                </div>
                
                <!-- 标签页导航 -->
                <div class="flex space-x-2 mb-4 border-b border-gray-700">
                    <button onclick="xgDataCenterUI.switchTab('relay')" id="tab-relay" class="tab-btn px-4 py-2 font-medium border-b-2 border-blue-500">
                        <i class="fas fa-list-ol mr-2"></i>接龙名单
                    </button>
                    <button onclick="xgDataCenterUI.switchTab('yxq')" id="tab-yxq" class="tab-btn px-4 py-2 font-medium text-gray-400 hover:text-white">
                        <i class="fas fa-link mr-2"></i>一线牵
                    </button>
                    <button onclick="xgDataCenterUI.switchTab('mapping')" id="tab-mapping" class="tab-btn px-4 py-2 font-medium text-gray-400 hover:text-white">
                        <i class="fas fa-exchange-alt mr-2"></i>ID映射
                    </button>
                    <button onclick="xgDataCenterUI.switchTab('import')" id="tab-import" class="tab-btn px-4 py-2 font-medium text-gray-400 hover:text-white">
                        <i class="fas fa-file-import mr-2"></i>数据导入
                    </button>
                </div>
                
                <!-- 内容区域 -->
                <div id="tabContent" class="flex-1 overflow-y-auto">
                    <!-- 动态内容 -->
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        
        // 初始化显示
        this.updateStats();
        this.switchTab('relay');
    }
    
    /**
     * 切换标签页
     */
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // 更新标签样式
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('border-blue-500', 'text-white');
            btn.classList.add('text-gray-400');
        });
        
        const activeTab = document.getElementById(`tab-${tabName}`);
        activeTab.classList.remove('text-gray-400');
        activeTab.classList.add('text-white', 'border-blue-500');
        
        // 加载内容
        const contentContainer = document.getElementById('tabContent');
        
        switch (tabName) {
            case 'relay':
                contentContainer.innerHTML = this.createRelayContent();
                break;
            case 'yxq':
                contentContainer.innerHTML = this.createYxqContent();
                break;
            case 'mapping':
                contentContainer.innerHTML = this.createMappingContent();
                break;
            case 'import':
                contentContainer.innerHTML = this.createImportContent();
                break;
        }
    }
    
    // ==================== 接龙名单界面 ====================
    
    createRelayContent() {
        const relayData = this.dataCenter.dataSources.relay;
        
        return `
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-bold">接龙名单管理</h3>
                    <div class="flex space-x-2">
                        <button onclick="xgDataCenterUI.switchToImportTab()" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                            <i class="fas fa-file-text mr-1"></i>去导入
                        </button>
                        <button onclick="xgDataCenterUI.clearRelayData()" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                            <i class="fas fa-trash mr-1"></i>清空
                        </button>
                    </div>
                </div>
                
                <!-- 格式说明 -->
                <div class="bg-blue-900 bg-opacity-30 rounded-lg p-3 text-sm">
                    <div class="font-semibold mb-2 text-blue-400">
                        <i class="fas fa-info-circle mr-1"></i>格式说明
                    </div>
                    <div class="text-gray-300 space-y-1">
                        <div>支持格式：<code class="bg-gray-800 px-1 rounded">1. 醉若曦 妙音 一线</code></div>
                        <div>或：<code class="bg-gray-800 px-1 rounded">2. 醉逍遥 惊鸿 无一线</code></div>
                        <div class="text-xs text-gray-400 mt-2">
                            说明：编号 + 游戏ID + 职业 + 是否有一线牵（"一线"或"无一线"）
                        </div>
                    </div>
                </div>
                
                <!-- 成员列表 -->
                <div class="space-y-2">
                    ${relayData.length === 0 ? 
                        '<div class="text-center text-gray-400 py-8 border border-dashed border-gray-600 rounded-lg">暂无接龙名单数据<br><span class="text-xs">点击"文本导入"添加数据</span></div>' :
                        relayData.map((item, index) => this.createRelayMemberCard(item, index)).join('')
                    }
                </div>
            </div>
        `;
    }
    
    createRelayMemberCard(item, index) {
        const isSelected = this.dataCenter.selectedRelayMembers.has(item.member_uid);
        const hasYxq = item.xg_relay_has_yxq;
        const yxqInfo = this.dataCenter.getYxqGroupByMember(item.member_uid);
        
        return `
            <div class="bg-gray-800 rounded-lg p-3 border ${isSelected ? 'border-pink-500 shadow-lg' : 'border-gray-700'} hover:border-gray-600 transition-all">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="text-2xl font-bold text-gray-600 w-8">${item.xg_relay_id || index + 1}</div>
                        <div>
                            <div class="font-bold text-white">${item.xg_relay_game_id}</div>
                            <div class="text-xs text-gray-400">${item.xg_relay_profession}</div>
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-2">
                        ${hasYxq ? `
                            <span class="px-2 py-1 bg-pink-500 text-white text-xs rounded-full">一线牵</span>
                            ${yxqInfo ? `<span class="text-xs text-pink-400">已配对</span>` : ''}
                        ` : 
                            '<span class="px-2 py-1 bg-gray-600 text-gray-400 text-xs rounded-full">无一线牵</span>'
                        }
                        
                        ${hasYxq ? `
                            <button onclick="xgDataCenterUI.toggleMemberYxqSelection('${item.member_uid}')" 
                                    class="px-3 py-1 rounded text-xs font-medium transition-all ${
                                        isSelected ? 'bg-pink-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }">
                                ${isSelected ? '<i class="fas fa-check mr-1"></i>已选择' : '选择'}
                            </button>
                        ` : ''}
                        
                        <button onclick="xgDataCenterUI.showMemberDetail('${item.member_uid}')" 
                                class="text-blue-400 hover:text-blue-300 text-xs">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ==================== 一线牵界面 ====================
    
    createYxqContent() {
        const yxqData = this.dataCenter.dataSources.yxq;
        
        return `
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-bold">一线牵配对管理</h3>
                    <div class="text-sm text-gray-400">
                        已配对：<span class="text-pink-400 font-bold">${yxqData.length}</span> 组
                    </div>
                </div>
                
                <!-- 说明 -->
                <div class="bg-pink-900 bg-opacity-30 rounded-lg p-3 text-sm">
                    <div class="font-semibold mb-2 text-pink-400">
                        <i class="fas fa-info-circle mr-1"></i>配对说明
                    </div>
                    <div class="text-gray-300 text-xs space-y-1">
                        <div>1. 在"接龙名单"页选择一线牵成员（点击"选择"按钮）</div>
                        <div>2. 第一个成员标记为①，第二个标记为②并自动成组</div>
                        <div>3. 点击第三个成员开始新的配对组</div>
                    </div>
                </div>
                
                <!-- 配对列表 -->
                <div class="space-y-3">
                    ${yxqData.length === 0 ? 
                        '<div class="text-center text-gray-400 py-8 border border-dashed border-gray-600 rounded-lg">暂无一线牵配对<br><span class="text-xs">在"接龙名单"页选择成员进行配对</span></div>' :
                        yxqData.map((item, index) => this.createYxqGroupCard(item, index)).join('')
                    }
                </div>
            </div>
        `;
    }
    
    createYxqGroupCard(item, index) {
        return `
            <div class="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-4 border border-pink-700">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                            ${index + 1}
                        </div>
                        <div class="text-pink-400 font-bold">一线牵配对组</div>
                    </div>
                    <button onclick="xgDataCenterUI.deleteYxqGroup('${item.member_uid}')" 
                            class="text-red-400 hover:text-red-300 text-sm">
                        <i class="fas fa-trash mr-1"></i>删除
                    </button>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <!-- 成员1 -->
                    <div class="bg-gray-900 rounded-lg p-3 border border-gray-700">
                        <div class="flex items-center space-x-2 mb-2">
                            <div class="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">①</div>
                            <div class="text-white font-bold">${item.xg_yxq_member1_game_id}</div>
                        </div>
                        <div class="text-xs text-gray-400">${item.xg_yxq_member1_profession}</div>
                    </div>
                    
                    <!-- 成员2 -->
                    <div class="bg-gray-900 rounded-lg p-3 border border-gray-700">
                        <div class="flex items-center space-x-2 mb-2">
                            <div class="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">②</div>
                            <div class="text-white font-bold">${item.xg_yxq_member2_game_id}</div>
                        </div>
                        <div class="text-xs text-gray-400">${item.xg_yxq_member2_profession}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ==================== ID映射界面 ====================
    
    createMappingContent() {
        const mappingData = this.dataCenter.dataSources.map;
        
        return `
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-bold">ID映射管理</h3>
                    <button onclick="xgDataCenterUI.refreshMappingTable()" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                        <i class="fas fa-sync-alt mr-1"></i>刷新
                    </button>
                </div>
                
                <!-- 说明 -->
                <div class="bg-yellow-900 bg-opacity-30 rounded-lg p-3 text-sm">
                    <div class="font-semibold mb-2 text-yellow-400">
                        <i class="fas fa-info-circle mr-1"></i>映射说明
                    </div>
                    <div class="text-gray-300 text-xs">
                        显示接龙名单成员在所有帮战数据中的历史ID和职业变化，用于识别ID变更
                    </div>
                </div>
                
                <!-- 映射表格 -->
                <div class="overflow-x-auto">
                    ${mappingData.length === 0 ? 
                        '<div class="text-center text-gray-400 py-8 border border-dashed border-gray-600 rounded-lg">暂无ID映射数据<br><span class="text-xs">需要先导入接龙名单和帮战数据</span></div>' :
                        this.createMappingTable(mappingData)
                    }
                </div>
            </div>
        `;
    }
    
    createMappingTable(mappingData) {
        return `
            <table class="w-full text-sm">
                <thead class="bg-gray-800 sticky top-0">
                    <tr>
                        <th class="p-3 text-left">当前ID</th>
                        <th class="p-3 text-left">历史ID</th>
                        <th class="p-3 text-left">职业变化</th>
                        <th class="p-3 text-center">状态</th>
                        <th class="p-3 text-center">操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${mappingData.map(item => this.createMappingRow(item)).join('')}
                </tbody>
            </table>
        `;
    }
    
    createMappingRow(item) {
        const historicalIds = item.xg_map_historical_ids || [];
        const professions = item.xg_map_profession_variants || [];
        const isActive = item.xg_map_is_active;
        
        return `
            <tr class="border-b border-gray-700 hover:bg-gray-800">
                <td class="p-3">
                    <div class="font-bold text-white">${item.xg_map_current_id}</div>
                    <div class="text-xs text-gray-400">${item.member_uid}</div>
                </td>
                <td class="p-3">
                    ${historicalIds.length > 0 ? 
                        `<div class="text-sm text-gray-300">${historicalIds.join('<br>')}</div>` :
                        '<div class="text-xs text-gray-500">无历史数据</div>'
                    }
                </td>
                <td class="p-3">
                    ${professions.length > 0 ? 
                        `<div class="text-sm text-gray-300">${professions.join(', ')}</div>` :
                        '<div class="text-xs text-gray-500">未知</div>'
                    }
                </td>
                <td class="p-3 text-center">
                    ${isActive ? 
                        '<span class="px-2 py-1 bg-green-500 text-white text-xs rounded-full">活跃</span>' :
                        '<span class="px-2 py-1 bg-gray-600 text-gray-400 text-xs rounded-full">未找到</span>'
                    }
                </td>
                <td class="p-3 text-center">
                    <button onclick="xgDataCenterUI.editMapping('${item.member_uid}')" 
                            class="text-blue-400 hover:text-blue-300 text-sm">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `;
    }
    
    // ==================== 数据导入界面 ====================
    
    createImportContent() {
        return `
            <div class="space-y-6">
                <h3 class="text-lg font-bold">数据导入</h3>
                
                <!-- 接龙名单导入 -->
                <div class="glass-card rounded-xl p-4">
                    <h4 class="font-bold mb-3 text-blue-400">
                        <i class="fas fa-list-ol mr-2"></i>接龙名单导入
                    </h4>
                    <div class="text-xs text-gray-400 mb-3">
                        支持纯文本格式，每行：编号. 游戏ID 职业 是否有一线牵
                    </div>
                    <textarea id="relayTextInput" placeholder="示例：\n1. 醉若曦 妙音 一线\n2. 醉逍遥 惊鸿 一线\n3. 醉清风 铁衣 无一线" 
                              class="w-full h-32 bg-gray-800 border border-gray-600 rounded-lg p-3 text-sm text-white mb-3"></textarea>
                    <button onclick="xgDataCenterUI.importRelayText()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                        <i class="fas fa-upload mr-2"></i>导入接龙名单
                    </button>
                </div>
                
                <!-- 帮战数据导入 -->
                <div class="glass-card rounded-xl p-4">
                    <h4 class="font-bold mb-3 text-purple-400">
                        <i class="fas fa-swords mr-2"></i>帮战数据导入
                    </h4>
                    <div class="flex space-x-4">
                        <div>
                            <input type="file" id="battleCSVFile" accept=".csv" class="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                            <button onclick="xgDataCenterUI.importBattleCSV()" class="mt-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm">
                                <i class="fas fa-file-csv mr-2"></i>导入CSV
                            </button>
                        </div>
                        <div class="flex-1 text-xs text-gray-400">
                            <div>支持CSV格式，必须包含：玩家名字、职业等字段</div>
                            <div>数据将被映射为 xg_bz_ 前缀格式</div>
                        </div>
                    </div>
                </div>
                
                <!-- 装备内功数据导入 -->
                <div class="glass-card rounded-xl p-4">
                    <h4 class="font-bold mb-3 text-green-400">
                        <i class="fas fa-shield-alt mr-2"></i>装备内功打造数据导入
                    </h4>
                    <div class="flex space-x-4">
                        <div>
                            <input type="file" id="basicCSVFile" accept=".csv" class="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                            <button onclick="xgDataCenterUI.importBasicCSV()" class="mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm">
                                <i class="fas fa-file-csv mr-2"></i>导入CSV
                            </button>
                        </div>
                        <div class="flex-1 text-xs text-gray-400">
                            <div>需要包含：游戏名、职业、装备信息、内功信息、打造情况等</div>
                            <div>数据将被映射为 xg_basic_ 前缀格式</div>
                        </div>
                    </div>
                </div>
                
                <!-- 批量操作 -->
                <div class="flex space-x-2 pt-4 border-t border-gray-700">
                    <button onclick="xgDataCenterUI.createIdMappingTable()" class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm">
                        <i class="fas fa-table mr-2"></i>生成ID映射表
                    </button>
                    <button onclick="xgDataCenterUI.exportAllData()" class="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded text-sm">
                        <i class="fas fa-download mr-2"></i>导出全部数据
                    </button>
                    <button onclick="xgDataCenterUI.clearAllData()" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm">
                        <i class="fas fa-broom mr-2"></i>清空所有数据
                    </button>
                </div>
            </div>
        `;
    }
    
    // ==================== 交互函数 ====================
    
    /**
     * 切换成员一线牵选择状态
     */
    toggleMemberYxqSelection(memberUid) {
        const success = this.dataCenter.toggleYxqSelection(memberUid);
        if (success) {
            // 刷新当前标签页
            this.switchTab(this.currentTab);
            this.updateStats();
        }
    }
    
    /**
     * 删除一线牵组
     */
    deleteYxqGroup(groupId) {
        if (confirm('确定删除该一线牵配对组吗？')) {
            this.dataCenter.yxqGroups.delete(groupId);
            this.dataCenter.updateYxqDataSource();
            this.dataCenter.saveToLocalStorage();
            this.switchTab('yxq');
            this.updateStats();
        }
    }
    
    /**
     * 切换到导入标签页
     */
    switchToImportTab() {
        this.switchTab('import');
        
        // 高亮文本框
        setTimeout(() => {
            const textarea = document.getElementById('relayTextInput');
            if (textarea) {
                textarea.focus();
                textarea.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.5)';
                setTimeout(() => {
                    textarea.style.boxShadow = '';
                }, 2000);
            }
        }, 100);
    }
    
    /**
     * 从文本导入接龙名单（在数据导入标签页使用）
     */
    importRelayText() {
        const textarea = document.getElementById('relayTextInput');
        const text = textarea.value.trim();
        
        if (!text) {
            alert('请输入接龙名单文本');
            return;
        }
        
        const button = event?.target;
        if (button) {
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>导入中...';
            button.disabled = true;
        }
        
        setTimeout(() => {
            try {
                const result = this.dataCenter.importRelayList(text);
                
                if (result.success) {
                    this.showImportResult(result);
                    textarea.value = '';
                    
                    setTimeout(() => {
                        this.switchTab('relay');
                    }, 1000);
                    
                    this.updateStats();
                } else {
                    alert('导入失败：' + (result.error || '未知错误'));
                }
            } catch (error) {
                alert('导入错误：' + error.message);
                console.error('导入错误:', error);
            } finally {
                if (button) {
                    button.innerHTML = '<i class="fas fa-upload mr-2"></i>导入接龙名单';
                    button.disabled = false;
                }
            }
        }, 500);
    }
    
    /**
     * 显示导入结果
     */
    showImportResult(result) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="glass-card rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4">
                <div class="text-center">
                    <div class="text-6xl mb-4">🎉</div>
                    <h3 class="text-xl font-bold text-green-400 mb-4">导入成功！</h3>
                    <div class="space-y-2 mb-6">
                        <div class="flex justify-between">
                            <span>总记录数：</span>
                            <span class="font-bold">${result.total}</span>
                        </div>
                        <div class="flex justify-between text-green-400">
                            <span>成功：</span>
                            <span class="font-bold">${result.successCount} 条</span>
                        </div>
                        <div class="flex justify-between text-red-400">
                            <span>失败：</span>
                            <span class="font-bold">${result.errorCount} 条</span>
                        </div>
                    </div>
                    <button onclick="this.closest('.fixed').remove()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg">
                        确定
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.remove();
        }, 3000);
    }
    
    /**
     * 导入帮战数据CSV
     */
    importBattleCSV() {
        const fileInput = document.getElementById('battleCSVFile');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('请选择CSV文件');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = this.dataCenter.importBattleData(e.target.result);
                
                if (result.success) {
                    alert(`导入成功！\n会话ID：${result.sessionId}\n数据条数：${result.count}`);
                    fileInput.value = '';
                    this.updateStats();
                } else {
                    alert(`导入失败：${result.error || '未知错误'}`);
                }
            } catch (error) {
                alert(`导入失败：${error.message}`);
                console.error('导入错误:', error);
            }
        };
        
        reader.onerror = () => {
            alert('文件读取失败');
        };
        
        reader.readAsText(file);
    }
    
    /**
     * 导入装备内功数据CSV
     */
    importBasicCSV() {
        const fileInput = document.getElementById('basicCSVFile');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('请选择CSV文件');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const csvData = this.parseCSV(e.target.result);
            const result = this.dataCenter.importBasicData(csvData);
            
            if (result.success) {
                alert(`导入成功！\n会话ID：${result.sessionId}\n数据条数：${result.count}`);
                fileInput.value = '';
                this.updateStats();
            } else {
                alert('导入失败');
            }
        };
        reader.readAsText(file);
    }
    
    /**
     * 解析CSV
     */
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
            const row = {};
            
            headers.forEach((header, index) => {
                if (values[index] !== undefined) {
                    row[header] = values[index];
                }
            });
            
            data.push(row);
        }
        
        return data;
    }
    
    /**
     * 生成ID映射表
     */
    createIdMappingTable() {
        const table = this.dataCenter.createIdMappingTable();
        this.dataCenter.saveToLocalStorage();
        this.switchTab('mapping');
        alert(`ID映射表生成完成！共 ${table.length} 条记录`);
    }
    
    /**
     * 更新统计信息
     */
    updateStats() {
        document.getElementById('statTotalMembers').textContent = this.dataCenter.stats.totalMembers;
        document.getElementById('statRelayCount').textContent = this.dataCenter.stats.relayCount;
        document.getElementById('statBattleCount').textContent = this.dataCenter.stats.battleCount;
        document.getElementById('statYxqGroupCount').textContent = this.dataCenter.stats.yxqGroupCount;
        
        const lastUpdate = this.dataCenter.dataSources.relay.length > 0 ? 
            new Date().toLocaleString() : '-';
        document.getElementById('statLastUpdate').textContent = lastUpdate;
    }
    
    /**
     * 显示成员详情
     */
    showMemberDetail(memberUid) {
        const relayData = this.dataCenter.getRelayDataByUid(memberUid);
        const battleData = this.dataCenter.getBattleDataByUid(memberUid);
        const basicData = this.dataCenter.getBasicDataByUid(memberUid);
        const yxqGroup = this.dataCenter.getYxqGroupByMember(memberUid);
        
        let detailHtml = `
            <div class="space-y-4">
                <div class="text-center">
                    <div class="text-xl font-bold text-white">${relayData.xg_relay_game_id}</div>
                    <div class="text-sm text-gray-400">${relayData.xg_relay_profession}</div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        `;
        
        if (battleData) {
            detailHtml += `
                <div class="bg-gray-800 rounded p-3">
                    <div class="font-semibold text-blue-400 mb-2">帮战数据</div>
                    <div class="space-y-1 text-xs">
                        ${Object.keys(battleData).filter(k => k.startsWith('xg_bz_')).slice(0, 5).map(key => 
                            `<div class="flex justify-between"><span>${key.replace('xg_bz_', '')}</span><span>${battleData[key]}</span></div>`
                        ).join('')}
                    </div>
                </div>
            `;
        }
        
        if (basicData) {
            detailHtml += `
                <div class="bg-gray-800 rounded p-3">
                    <div class="font-semibold text-green-400 mb-2">装备内功数据</div>
                    <div class="space-y-1 text-xs">
                        ${Object.keys(basicData).filter(k => k.startsWith('xg_basic_')).slice(0, 5).map(key => 
                            `<div class="flex justify-between"><span>${key.replace('xg_basic_', '')}</span><span>${basicData[key]}</span></div>`
                        ).join('')}
                    </div>
                </div>
            `;
        }
        
        if (yxqGroup) {
            const partnerData = this.dataCenter.getRelayDataByUid(yxqGroup.partnerUid);
            detailHtml += `
                <div class="bg-gray-800 rounded p-3">
                    <div class="font-semibold text-pink-400 mb-2">一线牵配对</div>
                    <div class="text-sm">
                        <div class="text-white font-bold">${partnerData.xg_relay_game_id}</div>
                        <div class="text-xs text-gray-400">${partnerData.xg_relay_profession}</div>
                    </div>
                </div>
            `;
        }
        
        detailHtml += '</div></div>';
        
        // 创建模态框显示详情
        this.createModal('成员详情', detailHtml);
    }
    
    /**
     * 创建模态框
     */
    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="glass-card rounded-2xl p-6 shadow-2xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold">${title}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                ${content}
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    /**
     * 关闭UI
     */
    closeUI() {
        const ui = document.getElementById('xgDataCenterUI');
        if (ui) {
            ui.remove();
        }
    }
    
    /**
     * 清空接龙数据
     */
    clearRelayData() {
        if (confirm('确定清空所有接龙名单数据吗？此操作不可恢复。')) {
            this.dataCenter.dataSources.relay = [];
            this.dataCenter.selectedRelayMembers.clear();
            this.dataCenter.saveToLocalStorage();
            this.switchTab('relay');
            this.updateStats();
        }
    }
    
    /**
     * 保存所有数据
     */
    saveAllData() {
        this.dataCenter.saveToLocalStorage();
        alert('数据已保存到本地存储！');
    }
    
    /**
     * 导出所有数据
     */
    exportAllData() {
        const data = {
            dataSources: this.dataCenter.dataSources,
            yxqGroups: Array.from(this.dataCenter.yxqGroups.entries()),
            stats: this.dataCenter.stats,
            exportTime: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `xg_data_center_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('数据导出成功！');
    }
    
    /**
     * 清空所有数据
     */
    clearAllData() {
        if (confirm('确定清空所有数据吗？此操作不可恢复！')) {
            this.dataCenter.clearAllData();
            this.switchTab('relay');
            this.updateStats();
            alert('所有数据已清空！');
        }
    }
    
    /**
     * 刷新映射表
     */
    refreshMappingTable() {
        this.dataCenter.createIdMappingTable();
        this.switchTab('mapping');
        alert('ID映射表已刷新！');
    }
}

// ==================== 全局实例 ====================

// 创建UI实例
window.xgDataCenterUI = new XGDataCenterUI();

// 显示/隐藏数据管理中心的函数
function toggleDataCenterUI() {
    const existing = document.getElementById('xgDataCenterUI');
    if (existing) {
        existing.remove();
    } else {
        window.xgDataCenterUI.createMainUI();
    }
}

console.log('XG数据管理中心UI已加载');