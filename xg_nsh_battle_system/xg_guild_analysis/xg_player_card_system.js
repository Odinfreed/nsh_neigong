/**
 * 玩家档案码系统 - 战绩分享与查看
 * 功能：生成8位档案码，打包玩家完整数据（支持多场），支持独立查看和PK对比
 * @version 2.0.0
 */

(function(global) {
    'use strict';

    // ==================== 数据序列化/反序列化（先定义，后面依赖它） ====================
    const DataSerializer = {
        // 字段映射表（缩短键名）- 包含所有可能的字段
        FIELD_MAP: {
            // 基础信息
            'playerName': 'n', 'profession': 'c', 'battles': 'b',
            '玩家名字': 'n', '职业': 'c',
            'region': 're', 'userGuild': 'ug',  // 用户设置的区服和帮会
            // 核心数据
            '对建筑伤害': 'bd', '对玩家伤害': 'pd', '击败': 'k', '破泉': 'pq',
            '化羽': 'hy', '清泉': 'qq', '治疗值': 'h', '助攻': 'a',
            '承受伤害': 'td', '人伤卸甲': 'pa', '破塔卸甲': 'ba',
            '资源': 'r', '焚骨': 'fg', '重伤': 'zs', '死亡': 'd',
            // 其他可能字段
            '帮会': 'g', '帮派': 'gu', '时间': 't', '场次': 'bt',
            '段位': 'r2', '评分': 's', '装备': 'e', '等级': 'l'
        },

        serialize(playerData, options = {}) {
            const map = this.FIELD_MAP;
            
            if (options.isMultiBattle && playerData.battles) {
                // 多场数据序列化
                return {
                    n: playerData.playerName || playerData['玩家名字'],
                    c: playerData.profession || playerData['职业'],
                    re: playerData.region || '',  // 区服
                    ug: playerData.userGuild || '',  // 用户帮会
                    m: true,
                    h: options.includeHistory,
                    bc: playerData.battleCount || playerData.battles.length,
                    b: playerData.battles.map(b => this._serializeSingle(b, map))
                };
            } else {
                // 单场数据序列化 - 包含完整数据
                const serialized = this._serializeSingle(playerData, map);
                // 添加区服和帮会信息
                if (playerData.region) serialized.re = playerData.region;
                if (playerData.userGuild) serialized.ug = playerData.userGuild;
                // 保留原始完整数据用于导入后全屏显示
                serialized._full = this._compressFullData(playerData);
                return serialized;
            }
        },

        _serializeSingle(data, map) {
            const result = {};
            for (const [key, value] of Object.entries(data)) {
                if (key.startsWith('_')) continue; // 跳过内部字段
                if (map[key]) {
                    const numValue = parseFloat(value);
                    result[map[key]] = isNaN(numValue) ? value : numValue;
                } else if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
                    // 保留未映射的数值字段
                    result[key] = parseFloat(value) || value;
                } else if (typeof value === 'string' && value.length < 100) {
                    // 保留短的字符串字段
                    result[key] = value;
                }
            }
            return result;
        },

        // 压缩完整数据用于存储
        _compressFullData(data) {
            const essentialFields = [
                '玩家名字', '职业', '帮会', '帮派',
                '对建筑伤害', '对玩家伤害', '击败', '破泉',
                '化羽', '清泉', '治疗值', '助攻',
                '承受伤害', '人伤卸甲', '破塔卸甲',
                '资源', '焚骨', '重伤', '死亡'
            ];
            const compressed = {};
            essentialFields.forEach(field => {
                if (data[field] !== undefined) {
                    compressed[field] = data[field];
                }
            });
            // 保留其他非内部字段
            Object.keys(data).forEach(key => {
                if (!key.startsWith('_') && !compressed.hasOwnProperty(key)) {
                    compressed[key] = data[key];
                }
            });
            return compressed;
        },

        deserialize(serializedData) {
            const reverseMap = Object.fromEntries(
                Object.entries(this.FIELD_MAP).map(([k, v]) => [v, k])
            );

            if (serializedData.m && Array.isArray(serializedData.b)) {
                // 多场数据反序列化
                const battles = serializedData.b.map(b => this._deserializeSingle(b, reverseMap));
                return {
                    playerName: serializedData.n,
                    profession: serializedData.c,
                    region: serializedData.re,  // 区服
                    userGuild: serializedData.ug,  // 用户帮会
                    isMultiBattle: true,
                    includeHistory: serializedData.h,
                    battleCount: serializedData.bc || battles.length,
                    battles: battles,
                    // 保留完整数据
                    ...this._mergeFullData(battles)
                };
            } else {
                // 单场数据反序列化
                const result = this._deserializeSingle(serializedData, reverseMap);
                // 恢复完整数据
                if (serializedData._full) {
                    Object.assign(result, serializedData._full);
                }
                // 确保playerName和profession字段存在（兼容中文键名）
                if (!result.playerName && result['玩家名字']) {
                    result.playerName = result['玩家名字'];
                }
                if (!result.profession && result['职业']) {
                    result.profession = result['职业'];
                }
                // 同样确保反向兼容
                if (!result['玩家名字'] && result.playerName) {
                    result['玩家名字'] = result.playerName;
                }
                if (!result['职业'] && result.profession) {
                    result['职业'] = result.profession;
                }
                return result;
            }
        },

        _deserializeSingle(data, reverseMap) {
            const result = {};
            for (const [key, value] of Object.entries(data)) {
                if (key === '_full') continue; // 跳过压缩数据标记
                if (reverseMap[key]) {
                    result[reverseMap[key]] = value;
                } else {
                    result[key] = value;
                }
            }
            return result;
        },

        _mergeFullData(battles) {
            // 使用最新一场的数据作为基础
            if (battles.length === 0) return {};
            const latest = battles[battles.length - 1];
            return { ...latest };
        }
    };

    // 暴露DataSerializer供外部使用（URL hash解码等场景）
    global.PlayerCardDataSerializer = DataSerializer;

    // ==================== 档案码池管理（24小时回收机制） ====================
    const CardCodePool = {
        STORAGE_KEY: 'xg_player_card_pool_v2',
        VALIDITY_PERIOD: 24 * 60 * 60 * 1000,
        MAX_POOL_SIZE: 10000,

        getPool() {
            try {
                const pool = localStorage.getItem(this.STORAGE_KEY);
                return pool ? JSON.parse(pool) : {};
            } catch (e) {
                console.error('读取档案码池失败:', e);
                return {};
            }
        },

        savePool(pool) {
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pool));
            } catch (e) {
                console.error('保存档案码池失败:', e);
            }
        },

        cleanupExpired() {
            const pool = this.getPool();
            const now = Date.now();
            let cleaned = 0;

            for (const [code, data] of Object.entries(pool)) {
                if (now - data.timestamp > this.VALIDITY_PERIOD) {
                    delete pool[code];
                    cleaned++;
                }
            }

            if (cleaned > 0) {
                this.savePool(pool);
                console.log(`档案码池清理: 已移除 ${cleaned} 个过期代码`);
            }

            return cleaned;
        },

        store(code, playerData, options = {}) {
            this.cleanupExpired();
            const pool = this.getPool();

            if (Object.keys(pool).length >= this.MAX_POOL_SIZE) {
                const oldestCode = Object.entries(pool)
                    .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
                if (oldestCode) delete pool[oldestCode[0]];
            }

            pool[code] = {
                data: playerData,
                timestamp: Date.now(),
                expiresAt: Date.now() + this.VALIDITY_PERIOD,
                playerName: playerData.playerName || playerData['玩家名字'] || '未知玩家',
                profession: playerData.profession || playerData['职业'] || '未知职业',
                isMultiBattle: options.isMultiBattle || false,
                battleCount: options.battleCount || 1,
                includeHistory: options.includeHistory || false,
                isAnonymous: options.isAnonymous || false,
                isPKMode: options.isPKMode || false
            };

            this.savePool(pool);
            return true;
        },

        retrieve(code) {
            this.cleanupExpired();
            const pool = this.getPool();
            const record = pool[code];

            if (!record) return { valid: false, error: '档案码不存在或已过期' };
            if (Date.now() > record.expiresAt) {
                delete pool[code];
                this.savePool(pool);
                return { valid: false, error: '档案码已过期' };
            }

            return {
                valid: true,
                data: record.data,
                createdAt: record.timestamp,
                expiresAt: record.expiresAt,
                playerName: record.playerName,
                profession: record.profession,
                isMultiBattle: record.isMultiBattle,
                battleCount: record.battleCount,
                includeHistory: record.includeHistory,
                isAnonymous: record.isAnonymous,
                isPKMode: record.isPKMode
            };
        }
    };

    // ==================== 使用外部多轮映射表系统 ====================
    // 映射表定义在 xg_card_code_mappings.js 中
    
    // 简单哈希（用于校验）
    function quickHash(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = ((h << 5) - h) + str.charCodeAt(i);
            h = h & h;
        }
        return Math.abs(h).toString(36).slice(0, 4);
    }

    // 档案码生成器（使用多轮映射表）
    const CardCodeGenerator = {
        CODE_LENGTH: 8,
        
        // 获取映射表（从全局或传入）
        getMappings() {
            return (typeof CardCodeMappings !== 'undefined') ? CardCodeMappings : null;
        },
        
        // 生成压缩档案码（使用多轮映射）
        generateOffline(playerData, options = {}) {
            const mappings = this.getMappings();
            
            if (mappings && mappings.CardCodeCompressor) {
                // 使用新的多轮映射压缩
                const compressed = mappings.CardCodeCompressor.compress(playerData, options);
                const timestamp = Math.floor(Date.now() / 3600000);
                const check = quickHash(compressed + timestamp);
                
                const code = `${compressed}.${check}.${timestamp}`;
                return {
                    code: code,
                    expiresAt: (timestamp + 24) * 3600000,
                    data: playerData
                };
            } else {
                // 降级：简单Base64
                const json = JSON.stringify({
                    n: playerData['玩家名字'] || playerData.playerName,
                    c: playerData['职业'] || playerData.profession,
                    bd: playerData['对建筑伤害'],
                    pd: playerData['对玩家伤害'],
                    k: playerData['击败']
                });
                const encoded = btoa(encodeURIComponent(json)).replace(/=/g, '');
                const timestamp = Math.floor(Date.now() / 3600000);
                const check = quickHash(encoded + timestamp);
                
                return {
                    code: `${encoded}.${check}.${timestamp}`,
                    expiresAt: (timestamp + 24) * 3600000,
                    data: playerData
                };
            }
        },
        
        // 验证并解压档案码
        verifyOffline(code, userSettings = {}) {
            try {
                const parts = code.split('.');
                if (parts.length !== 3) {
                    return { valid: false, error: '档案码格式错误' };
                }
                
                const [encoded, check, tsStr] = parts;
                const timestamp = parseInt(tsStr, 36);
                
                // 1. 校验
                if (quickHash(encoded + timestamp) !== check) {
                    return { valid: false, error: '档案码校验失败' };
                }
                
                // 2. 检查过期（24小时）
                const now = Math.floor(Date.now() / 3600000);
                if (now - timestamp > 24) {
                    return { valid: false, error: '档案码已过期' };
                }
                
                // 3. 使用映射表解压
                const mappings = this.getMappings();
                let result;
                
                if (mappings && mappings.CardCodeCompressor) {
                    result = mappings.CardCodeCompressor.decompress(encoded);
                } else {
                    // 降级解析
                    const json = decodeURIComponent(atob(encoded));
                    const data = JSON.parse(json);
                    result = {
                        '玩家名字': data.n,
                        '职业': data.c,
                        '对建筑伤害': data.bd,
                        '对玩家伤害': data.pd,
                        '击败': data.k,
                        playerName: data.n,
                        profession: data.c
                    };
                }
                
                if (!result) {
                    return { valid: false, error: '档案码解析失败' };
                }
                
                // 填充默认值
                if (!result['玩家名字']) result['玩家名字'] = result.playerName = userSettings.gameId || '档案玩家';
                if (!result['职业']) result['职业'] = result.profession = '未知';
                
                return {
                    valid: true,
                    data: result,
                    timestamp: timestamp * 3600000,
                    expiresAt: (timestamp + 24) * 3600000,
                    region: result.region || userSettings.region || '',
                    guildName: result.userGuild || userSettings.guildName || '',
                    gameId: userSettings.gameId || '',
                    isAnonymous: false
                };
                
            } catch (e) {
                console.error('档案码解析失败:', e);
                return { valid: false, error: '档案码解析失败' };
            }
        },

        generate() {
            const chars = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
            let code = '';
            for (let i = 0; i < this.CODE_LENGTH; i++) {
                code += chars.charAt(Math.floor(Math.random() * 32));
            }
            return code;
        },

        generateUnique() {
            return this.generate();
        },

        validateFormat(code) {
            return code && typeof code === 'string' && code.length >= 8;
        }
    };

    // 主API（仅8位极限压缩版）
    const PlayerCardSystem = {
        /**
         * 导出玩家档案码（8位极限压缩）
         * @param {Object} playerData - 玩家数据
         * @param {Object} options - {userSettings}
         */
        exportCard(playerData, options = {}) {
            try {
                if (!playerData || typeof playerData !== 'object') {
                    return { success: false, error: '无效的玩家数据' };
                }

                const result = CardCodeGenerator.generateOffline(playerData, options);
                
                return {
                    success: true,
                    code: result.code,
                    expiresAt: result.expiresAt
                };

            } catch (e) {
                console.error('导出档案码失败:', e);
                return { success: false, error: '导出失败: ' + e.message };
            }
        },

        /**
         * 通过档案码导入玩家数据（8位验证）
         * @param {string} code - 8位档案码
         * @param {Object} userSettings - 用户设置
         */
        importCard(code, userSettings = {}) {
            try {
                if (!code || typeof code !== 'string' || code.length !== 8) {
                    return { success: false, error: '档案码应为8位字符' };
                }
                
                const result = CardCodeGenerator.verifyOffline(code, userSettings);
                
                if (!result.valid) {
                    return { success: false, error: result.error };
                }
                
                return {
                    success: true,
                    data: result.data,
                    playerName: result.data.playerName,
                    profession: result.profession,
                    createdAt: result.timestamp,
                    expiresAt: result.expiresAt,
                    region: result.region,
                    guildName: result.guildName,
                    gameId: result.gameId
                };

            } catch (e) {
                console.error('导入档案码失败:', e);
                return { success: false, error: '导入失败: ' + e.message };
            }
        },

        /**
         * 格式化过期时间显示
         */
        formatExpiryTime(timestamp) {
            const remaining = timestamp - Date.now();
            if (remaining <= 0) return '已过期';

            const hours = Math.floor(remaining / (60 * 60 * 1000));
            const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

            if (hours > 0) {
                return `${hours}小时${minutes}分钟后过期`;
            } else {
                return `${minutes}分钟后过期`;
            }
        },

        /**
         * 检查档案码是否有效
         */
        checkCode(code) {
            if (!CardCodeGenerator.validateFormat(code)) {
                return { valid: false, error: '格式错误' };
            }
            return CardCodePool.retrieve(code);
        }
    };

    // 暴露到全局
    global.PlayerCardSystem = PlayerCardSystem;

    // 向后兼容：保留PKCodeSystem别名
    global.PKCodeSystem = PlayerCardSystem;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PlayerCardSystem;
    }

})(typeof window !== 'undefined' ? window : this);
