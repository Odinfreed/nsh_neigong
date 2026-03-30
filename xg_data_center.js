/**
 * XG数据管理中心
 * 统一管理所有数据源，核心为member_uid全局唯一ID
 */

class XGDataCenter {
    constructor() {
        // 数据源存储
        this.dataSources = {
            battle: {},      // 多场帮战数据 xg_bz_
            basic: {},       // 装备内功打造数据 xg_basic_
            relay: [],       // 接龙名单数据 xg_relay_
            yxq: [],         // 一线牵数据 xg_yxq_
            map: {}          // ID映射数据 xg_map_
        };
        
        // member_uid映射表：{member_uid: {relayData, basicData, battleData, yxqGroups}}
        this.memberMap = new Map();
        
        // 一线牵组：{groupId: [member_uid1, member_uid2]}
        this.yxqGroups = new Map();
        
        // 当前选中的接龙名单成员（用于一线牵配对）
        this.selectedRelayMembers = new Set();
        
        // 统计信息
        this.stats = {
            totalMembers: 0,
            relayCount: 0,
            battleCount: 0,
            yxqGroupCount: 0
        };
    }
    
    // ==================== 接龙名单导入 ====================
    
    /**
     * 导入接龙名单（纯文本格式）
     * 格式：
     */
    importRelayList(text) {
        const lines = text.trim().split('\n').filter(line => line.trim());
        const relayData = [];
        let successCount = 0;
        let errorCount = 0;
        
        lines.forEach((line, index) => {
            try {
                // 格式：编号. 游戏ID 游戏职业 是否有一线7牵
                const match = line.trim().match(/^(\d+)\.\s*(\S+)\s+(\S+)(?:\s+(一线|无一线))?$/);
                
                if (!match) {
                    console.warn(`行 ${index + 1} 格式错误: ${line}`);
                    errorCount++;
                    return;
                }
                
                const [, num, gameId, profession, hasYxq] = match;
                
                // 生成member_uid
                const memberUid = this.generateMemberUid(gameId);
                
                const relayItem = {
                    member_uid: memberUid,
                    xg_relay_id: parseInt(num),
                    xg_relay_game_id: gameId,
                    xg_relay_profession: profession,
                    xg_relay_has_yxq: hasYxq === '一线',
                    xg_relay_raw_text: line.trim(),
                    xg_relay_import_time: new Date().toISOString()
                };
                
                relayData.push(relayItem);
                successCount++;
                
            } catch (error) {
                console.error(`处理行 ${index + 1} 失败:`, error);
                errorCount++;
            }
        });
        
        // 存储到数据源
        this.dataSources.relay = relayData;
        
        // 更新memberMap
        this.updateMemberMap();
        
        // 更新统计
        this.updateStats();
        
        return {
            success: true,
            total: lines.length,
            successCount,
            errorCount,
            data: relayData
        };
    }
    
    // ==================== 一线牵配对管理 ====================
    
    /**
     * 切换成员的一线牵选择状态
     * 逻辑：点击第一个成员标记为1，点击第二个标记为2并自动成组，点击第三个开始新组
     */
    toggleYxqSelection(memberUid) {
        const relayItem = this.dataSources.relay.find(item => item.member_uid === memberUid);
        if (!relayItem) return false;
        
        // 如果没有一线牵，不允许选择
        if (!relayItem.xg_relay_has_yxq) return false;
        
        const isSelected = this.selectedRelayMembers.has(memberUid);
        
        if (isSelected) {
            // 取消选择
            this.selectedRelayMembers.delete(memberUid);
            this.removeFromYxqGroup(memberUid);
        } else {
            // 添加到选择
            this.selectedRelayMembers.add(memberUid);
            
            // 检查是否需要创建新组
            if (this.selectedRelayMembers.size % 2 === 0) {
                // 成对，创建新组
                this.createNewYxqGroup();
            }
        }
        
        this.saveToLocalStorage();
        return true;
    }
    
    /**
     * 创建新的一线牵组
     */
    createNewYxqGroup() {
        const selectedArray = Array.from(this.selectedRelayMembers);
        if (selectedArray.length < 2) return null;
        
        // 取最后两个成员
        const member2 = selectedArray[selectedArray.length - 1];
        const member1 = selectedArray[selectedArray.length - 2];
        
        // 检查是否已存在配对
        const exists = Array.from(this.yxqGroups.values()).some(
            group => (group[0] === member1 && group[1] === member2) ||
                     (group[0] === member2 && group[1] === member1)
        );
        
        if (exists) {
            console.log('一线牵配对已存在');
            return null;
        }
        
        // 创建新组
        const groupId = `yxq_${Date.now()}`;
        this.yxqGroups.set(groupId, [member1, member2]);
        
        // 更新到数据源
        this.updateYxqDataSource();
        
        return groupId;
    }
    
    /**
     * 从一线牵组中移除成员
     */
    removeFromYxqGroup(memberUid) {
        // 查找并删除包含该成员的组
        for (const [groupId, members] of this.yxqGroups.entries()) {
            if (members.includes(memberUid)) {
                this.yxqGroups.delete(groupId);
                break;
            }
        }
        
        this.updateYxqDataSource();
    }
    
    /**
     * 更新一线牵数据源
     */
    updateYxqDataSource() {
        const yxqData = [];
        
        this.yxqGroups.forEach((members, groupId) => {
            if (members.length >= 2) {
                const member1Data = this.getRelayDataByUid(members[0]);
                const member2Data = this.getRelayDataByUid(members[1]);
                
                if (member1Data && member2Data) {
                    yxqData.push({
                        member_uid: groupId,
                        xg_yxq_member1_uid: members[0],
                        xg_yxq_member2_uid: members[1],
                        xg_yxq_member1_game_id: member1Data.xg_relay_game_id,
                        xg_yxq_member2_game_id: member2Data.xg_relay_game_id,
                        xg_yxq_member1_profession: member1Data.xg_relay_profession,
                        xg_yxq_member2_profession: member2Data.xg_relay_profession,
                        xg_yxq_create_time: new Date().toISOString(),
                        xg_yxq_is_active: true
                    });
                }
            }
        });
        
        this.dataSources.yxq = yxqData;
        this.updateStats();
    }
    
    // ==================== 帮战数据导入 ====================
    
    /**
     * 导入多场帮战数据
     */
    importBattleData(csvText) {
        const lines = csvText.trim().split('\n').filter(line => line.trim());
        if (lines.length < 2) return { success: false, error: '数据格式错误' };
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        const battleData = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
            const row = {};
            
            headers.forEach((header, index) => {
                if (values[index] !== undefined) {
                    row[header] = values[index];
                }
            });
            
            // 映射为xg_bz_前缀
            const mappedRow = this.mapBattleData(row);
            battleData.push(mappedRow);
        }
        
        // 存储
        const sessionId = `bz_${Date.now()}`;
        this.dataSources.battle[sessionId] = {
            data: battleData,
            importTime: new Date().toISOString(),
            count: battleData.length
        };
        
        this.updateMemberMap();
        this.updateStats();
        
        return {
            success: true,
            sessionId,
            count: battleData.length
        };
    }
    
    /**
     * 映射帮战数据为xg_bz_前缀
     */
    mapBattleData(rawData) {
        const mapped = {
            member_uid: this.generateMemberUid(rawData['玩家名字'] || rawData['游戏ID'])
        };
        
        // 映射所有字段为xg_bz_前缀
        Object.keys(rawData).forEach(key => {
            mapped[`xg_bz_${key}`] = rawData[key];
        });
        
        return mapped;
    }
    
    // ==================== 装备内功数据导入 ====================
    
    /**
     * 导入装备内功打造数据
     */
    importBasicData(csvData) {
        const basicData = csvData.map(row => {
            const mapped = {
                member_uid: this.generateMemberUid(row['游戏名'] || row['填表人'])
            };
            
            // 映射所有字段为xg_basic_前缀
            Object.keys(row).forEach(key => {
                mapped[`xg_basic_${key}`] = row[key];
            });
            
            return mapped;
        });
        
        // 存储
        const sessionId = `basic_${Date.now()}`;
        this.dataSources.basic[sessionId] = {
            data: basicData,
            importTime: new Date().toISOString(),
            count: basicData.length
        };
        
        this.updateMemberMap();
        this.updateStats();
        
        return {
            success: true,
            sessionId,
            count: basicData.length
        };
    }
    
    // ==================== ID映射管理 ====================
    
    /**
     * 创建ID映射表
     */
    createIdMappingTable() {
        const mappingTable = [];
        
        this.dataSources.relay.forEach(relayItem => {
            const gameId = relayItem.xg_relay_game_id;
            
            // 查找该ID在帮战数据中的所有出现
            const battleOccurrences = this.findBattleOccurrences(gameId);
            
            mappingTable.push({
                member_uid: relayItem.member_uid,
                xg_map_current_id: gameId,
                xg_map_historical_ids: battleOccurrences.historicalIds,
                xg_map_profession_variants: battleOccurrences.professions,
                xg_map_last_seen: battleOccurrences.lastSeen,
                xg_map_is_active: battleOccurrences.isActive
            });
        });
        
        this.dataSources.map = mappingTable;
        return mappingTable;
    }
    
    /**
     * 查找ID在所有帮战数据中的出现
     */
    findBattleOccurrences(gameId) {
        const historicalIds = new Set();
        const professions = new Set();
        let lastSeen = null;
        let isActive = false;
        
        Object.values(this.dataSources.battle).forEach(session => {
            session.data.forEach(row => {
                const playerName = row.xg_bz_玩家名字 || row.xg_bz_游戏ID;
                if (playerName && playerName.includes(gameId)) {
                    historicalIds.add(playerName);
                    
                    if (row.xg_bz_职业) {
                        professions.add(row.xg_bz_职业);
                    }
                    
                    lastSeen = session.importTime;
                    isActive = true;
                }
            });
        });
        
        return {
            historicalIds: Array.from(historicalIds),
            professions: Array.from(professions),
            lastSeen,
            isActive
        };
    }
    
    // ==================== 数据查询 ====================
    
    /**
     * 获取用于智能分团的数据（基于接龙名单筛选）
     */
    getDataForAutoAllocation() {
        const allocationData = [];
        
        this.dataSources.relay.forEach(relayItem => {
            const memberUid = relayItem.member_uid;
            
            // 合并所有数据源的数据
            const mergedData = {
                member_uid: memberUid,
                xg_relay_game_id: relayItem.xg_relay_game_id,
                xg_relay_profession: relayItem.xg_relay_profession,
                xg_relay_has_yxq: relayItem.xg_relay_has_yxq
            };
            
            // 添加帮战数据（如果存在）
            const battleData = this.getBattleDataByUid(memberUid);
            if (battleData) {
                Object.assign(mergedData, battleData);
            }
            
            // 添加装备内功数据（如果存在）
            const basicData = this.getBasicDataByUid(memberUid);
            if (basicData) {
                Object.assign(mergedData, basicData);
            }
            
            // 添加一线牵信息
            const yxqGroup = this.getYxqGroupByMember(memberUid);
            if (yxqGroup) {
                mergedData.xg_yxq_group_id = yxqGroup.groupId;
                mergedData.xg_yxq_partner = yxqGroup.partnerUid;
            }
            
            allocationData.push(mergedData);
        });
        
        return allocationData;
    }
    
    /**
     * 通过member_uid获取数据
     */
    getRelayDataByUid(memberUid) {
        return this.dataSources.relay.find(item => item.member_uid === memberUid);
    }
    
    getBattleDataByUid(memberUid) {
        for (const session of Object.values(this.dataSources.battle)) {
            const found = session.data.find(row => row.member_uid === memberUid);
            if (found) return found;
        }
        return null;
    }
    
    getBasicDataByUid(memberUid) {
        for (const session of Object.values(this.dataSources.basic)) {
            const found = session.data.find(row => row.member_uid === memberUid);
            if (found) return found;
        }
        return null;
    }
    
    getYxqGroupByMember(memberUid) {
        for (const [groupId, members] of this.yxqGroups.entries()) {
            if (members.includes(memberUid)) {
                const partnerUid = members[0] === memberUid ? members[1] : members[0];
                return {
                    groupId,
                    partnerUid,
                    members: [...members]
                };
            }
        }
        return null;
    }
    
    // ==================== 工具函数 ====================
    
    /**
     * 生成member_uid
     */
    generateMemberUid(gameId) {
        // 使用简单的哈希函数生成唯一ID
        let hash = 0;
        for (let i = 0; i < gameId.length; i++) {
            const char = gameId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return `uid_${Math.abs(hash)}_${gameId}`;
    }
    
    /**
     * 更新memberMap
     */
    updateMemberMap() {
        this.memberMap.clear();
        
        // 从接龙名单开始
        this.dataSources.relay.forEach(relayItem => {
            const memberUid = relayItem.member_uid;
            
            if (!this.memberMap.has(memberUid)) {
                this.memberMap.set(memberUid, {
                    relayData: relayItem,
                    battleData: null,
                    basicData: null,
                    yxqGroups: []
                });
            }
        });
        
        // 添加帮战数据
        Object.values(this.dataSources.battle).forEach(session => {
            session.data.forEach(row => {
                const memberUid = row.member_uid;
                
                if (this.memberMap.has(memberUid)) {
                    this.memberMap.get(memberUid).battleData = row;
                }
            });
        });
        
        // 添加装备内功数据
        Object.values(this.dataSources.basic).forEach(session => {
            session.data.forEach(row => {
                const memberUid = row.member_uid;
                
                if (this.memberMap.has(memberUid)) {
                    this.memberMap.get(memberUid).basicData = row;
                }
            });
        });
        
        // 添加一线牵组
        this.yxqGroups.forEach((members, groupId) => {
            members.forEach(memberUid => {
                if (this.memberMap.has(memberUid)) {
                    this.memberMap.get(memberUid).yxqGroups.push(groupId);
                }
            });
        });
    }
    
    /**
     * 更新统计信息
     */
    updateStats() {
        this.stats = {
            totalMembers: this.memberMap.size,
            relayCount: this.dataSources.relay.length,
            battleCount: Object.values(this.dataSources.battle).reduce((sum, s) => sum + s.data.length, 0),
            yxqGroupCount: this.yxqGroups.size
        };
    }
    
    // ==================== 本地存储 ====================
    
    /**
     * 保存到本地存储
     */
    saveToLocalStorage() {
        const data = {
            dataSources: this.dataSources,
            yxqGroups: Array.from(this.yxqGroups.entries()),
            selectedRelayMembers: Array.from(this.selectedRelayMembers),
            stats: this.stats,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('xg_data_center', JSON.stringify(data));
    }
    
    /**
     * 从本地存储加载
     */
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('xg_data_center');
            if (!saved) return false;
            
            const data = JSON.parse(saved);
            
            this.dataSources = data.dataSources || this.dataSources;
            this.yxqGroups = new Map(data.yxqGroups || []);
            this.selectedRelayMembers = new Set(data.selectedRelayMembers || []);
            this.stats = data.stats || this.stats;
            
            this.updateMemberMap();
            
            return true;
        } catch (error) {
            console.error('加载本地存储失败:', error);
            return false;
        }
    }
    
    /**
     * 清空所有数据
     */
    clearAllData() {
        this.dataSources = {
            battle: {},
            basic: {},
            relay: [],
            yxq: [],
            map: []
        };
        
        this.memberMap.clear();
        this.yxqGroups.clear();
        this.selectedRelayMembers.clear();
        
        this.updateStats();
        this.saveToLocalStorage();
    }
}

// ==================== 全局实例 ====================

// 创建全局数据管理中心实例
window.xgDataCenter = new XGDataCenter();

// 页面加载时自动加载本地数据
document.addEventListener('DOMContentLoaded', function() {
    window.xgDataCenter.loadFromLocalStorage();
    console.log('XG数据管理中心已加载');
});

console.log('XG数据管理中心初始化完成');