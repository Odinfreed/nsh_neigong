/**
 * 档案码多轮映射表系统
 * 用于将玩家数据压缩/解压为短档案码
 * @version 1.0.0
 */

(function(global) {
    'use strict';

    // ==================== 第一轮映射：职业映射 ====================
    const ProfessionMap = {
        // 正向映射：职业名 → 代码
        encode: {
            '妙音': 'M', '龙吟': 'L', '碎梦': 'S', '铁衣': 'T',
            '玄机': 'X', '神相': 'A', '素问': 'W', '九灵': 'J',
            '血河': 'H', '荒羽': 'Y', '鸿音': 'O',
            // 英文/缩写兼容
            'MIAOYIN': 'M', 'LONGYIN': 'L', 'SUIMENG': 'S',
            'TIEYI': 'T', 'XUANJI': 'X', 'SHENXIANG': 'A',
            'SUWEN': 'W', 'JIULING': 'J', 'XUEHE': 'H'
        },
        // 反向映射：代码 → 职业名
        decode: {
            'M': '妙音', 'L': '龙吟', 'S': '碎梦', 'T': '铁衣',
            'X': '玄机', 'A': '神相', 'W': '素问', 'J': '九灵',
            'H': '血河', 'Y': '荒羽', 'O': '鸿音'
        }
    };

    // ==================== 第二轮映射：字段名映射 ====================
    const FieldMap = {
        encode: {
            // 基础信息
            '玩家名字': 'N', '职业': 'C', '帮会': 'G', '帮派': 'G2',
            '区服': 'R', '游戏ID': 'I',
            // 核心战斗数据
            '对建筑伤害': 'BD', '对玩家伤害': 'PD', '击败': 'K',
            '破泉': 'PQ', '化羽': 'HY', '清泉': 'QQ',
            '治疗值': 'HE', '助攻': 'AS', '承受伤害': 'TD',
            '人伤卸甲': 'RX', '破塔卸甲': 'BX', '资源': 'ZY',
            '焚骨': 'FG', '重伤': 'ZS', '死亡': 'SW',
            // 其他字段
            '段位': 'DJ', '评分': 'PF', '等级': 'LV',
            '装备': 'ZB', '时间': 'TM', '场次': 'CC'
        },
        decode: null // 动态生成
    };
    // 生成反向映射
    FieldMap.decode = Object.fromEntries(
        Object.entries(FieldMap.encode).map(([k, v]) => [v, k])
    );

    // ==================== 第三轮映射：数值分段映射 ====================
    // 根据数值大小选择不同精度
    const NumberMap = {
        // 区段定义
        ranges: [
            { min: 0, max: 9, prefix: 'A', digits: 1 },      // A0-A9: 0-9
            { min: 10, max: 99, prefix: 'B', digits: 1 },    // B0-B9: 10,20,30...90 (步进10)
            { min: 100, max: 999, prefix: 'C', digits: 2 },  // C00-C99: 100-999 (步进10)
            { min: 1000, max: 9999, prefix: 'D', digits: 2 },// D00-D99: 1000-9999 (步进100)
            { min: 10000, max: 99999, prefix: 'E', digits: 2 },// E00-E99: 1万-10万 (步进1k)
            { min: 100000, max: 999999, prefix: 'F', digits: 2 },// F00-F99: 10万-100万 (步进10k)
            { min: 1000000, max: 9999999, prefix: 'G', digits: 2 },// G00-G99: 100万-1000万 (步进100k)
            { min: 10000000, max: Infinity, prefix: 'H', digits: 3 } // H000+: 1000万+ (步进1m)
        ],
        
        // 编码数值
        encode(num) {
            const n = parseInt(num) || 0;
            if (n === 0) return 'A0';
            
            for (const range of this.ranges) {
                if (n >= range.min && n <= range.max) {
                    if (range.digits === 1) {
                        // 1位精度
                        const step = Math.max(1, Math.floor((range.max - range.min) / 9));
                        const code = Math.min(9, Math.floor((n - range.min) / step));
                        return range.prefix + code;
                    } else if (range.digits === 2) {
                        // 2位精度 (00-99)
                        const ratio = (n - range.min) / (range.max - range.min);
                        const code = Math.min(99, Math.floor(ratio * 99));
                        return range.prefix + code.toString().padStart(2, '0');
                    } else {
                        // 3位精度
                        const step = 1000000; // 1m步进
                        const code = Math.min(999, Math.floor((n - range.min) / step));
                        return range.prefix + code.toString().padStart(3, '0');
                    }
                }
            }
            return 'A0';
        },
        
        // 解码数值（返回区间中值）
        decode(code) {
            if (!code || code.length < 2) return 0;
            
            const prefix = code[0];
            const num = parseInt(code.slice(1));
            
            for (const range of this.ranges) {
                if (range.prefix === prefix) {
                    if (range.digits === 1) {
                        const step = Math.max(1, Math.floor((range.max - range.min) / 9));
                        return range.min + num * step;
                    } else if (range.digits === 2) {
                        const ratio = num / 99;
                        return Math.floor(range.min + ratio * (range.max - range.min));
                    } else {
                        return range.min + num * 1000000;
                    }
                }
            }
            return 0;
        }
    };

    // ==================== 第四轮映射：区服映射 ====================
    const RegionMap = {
        // 热门区服映射
        encode: {
            '东京梦华': 'DJ', '烟雨江南': 'YY', '紫禁之巅': 'ZJ',
            '天下无双': 'TX', '沧海月明': 'CH', '玲珑相思': 'LL',
            '武林萌主': 'WL', '武林天骄': 'WJ', '绝代风华': 'JD',
            '一蓑烟雨': 'YS', '两广豪杰': 'LG', '三阳开泰': 'SY',
            '四季如春': 'SJ', '五福临门': 'WF', '六六大顺': 'LLD',
            '七星高照': 'QX', '八方来财': 'BF', '九天揽月': 'JT',
            '十全十美': 'SQ'
        },
        decode: null
    };
    RegionMap.decode = Object.fromEntries(
        Object.entries(RegionMap.encode).map(([k, v]) => [v, k])
    );

    // ==================== 第五轮映射：字符串压缩 ====================
    const StringCompressor = {
        // 常用字映射（用于压缩玩家名字）
        charMap: {
            '醉': 'ZA', '若': 'ZB', '曦': 'ZC', '梦': 'ZD', '雨': 'ZE',
            '风': 'ZF', '云': 'ZG', '雪': 'ZH', '花': 'ZI', '月': 'ZJ',
            '星': 'ZK', '霜': 'ZL', '寒': 'ZM', '影': 'ZN', '夜': 'ZO',
            '天': 'ZP', '龙': 'ZQ', '神': 'ZR', '魔': 'ZS', '仙': 'ZT',
            '剑': 'ZU', '刀': 'ZV', '枪': 'ZW', '弓': 'ZX', '琴': 'ZY',
            '一': '1A', '二': '1B', '三': '1C', '四': '1D', '五': '1E',
            '六': '1F', '七': '1G', '八': '1H', '九': '1I', '十': '1J',
            '小': 'XA', '大': 'XB', '老': 'XC', '阿': 'XD', '子': 'XE'
        },
        
        // 压缩字符串
        encode(str) {
            if (!str) return '';
            let result = '';
            for (const char of str) {
                if (this.charMap[char]) {
                    result += this.charMap[char];
                } else {
                    // 未映射字符用原字符（但跳过特殊字符）
                    const code = char.charCodeAt(0);
                    if (code < 128) {
                        result += char; // ASCII直接保留
                    }
                }
            }
            return result || str.slice(0, 4); // 保底取前4字符
        },
        
        // 解压（有损，主要用于展示）
        decode(code) {
            // 反向映射
            const reverseMap = Object.fromEntries(
                Object.entries(this.charMap).map(([k, v]) => [v, k])
            );
            
            let result = '';
            let i = 0;
            while (i < code.length) {
                const twoChar = code.slice(i, i + 2);
                if (reverseMap[twoChar]) {
                    result += reverseMap[twoChar];
                    i += 2;
                } else {
                    result += code[i];
                    i += 1;
                }
            }
            return result || code;
        }
    };

    // ==================== 第六轮映射：时间压缩 ====================
    const TimeCompressor = {
        // 将时间压缩为4字符
        encode(date = new Date()) {
            const year = date.getFullYear() % 100; // 取后2位
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const hour = date.getHours();
            
            // 格式: YYMD-HH (年月日-小时)
            const chars = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // 32进制
            const y1 = Math.floor(year / 32);
            const y2 = year % 32;
            const m = month - 1; // 0-11
            const d = day - 1;   // 0-30
            const h = hour;      // 0-23
            
            return chars[y1] + chars[y2] + chars[m] + chars[d] + chars[h];
        },
        
        decode(code) {
            if (!code || code.length < 5) return Date.now();
            const chars = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
            const vals = code.split('').map(c => chars.indexOf(c));
            
            const year = vals[0] * 32 + vals[1] + 2000;
            const month = vals[2] + 1;
            const day = vals[3] + 1;
            const hour = vals[4];
            
            return new Date(year, month - 1, day, hour).getTime();
        }
    };

    // ==================== 主压缩器 ====================
    const CardCodeCompressor = {
        // 压缩完整玩家数据
        compress(playerData, options = {}) {
            const parts = [];
            const settings = options.userSettings || {};
            
            // 1. 压缩基础信息
            const name = playerData['玩家名字'] || playerData.playerName || '';
            const prof = playerData['职业'] || playerData.profession || '';
            
            if (name) parts.push('N' + StringCompressor.encode(name.slice(0, 4)));
            if (prof) parts.push('C' + (ProfessionMap.encode[prof] || prof[0]));
            if (settings.region) {
                const regionCode = RegionMap.encode[settings.region] || settings.region.slice(0, 2);
                parts.push('R' + regionCode);
            }
            if (settings.guildName) parts.push('G' + StringCompressor.encode(settings.guildName.slice(0, 4)));
            if (settings.gameId) parts.push('I' + StringCompressor.encode(settings.gameId.slice(0, 4)));
            
            // 2. 压缩数值数据
            const numFields = {
                'BD': '对建筑伤害', 'PD': '对玩家伤害', 'K': '击败',
                'PQ': '破泉', 'HY': '化羽', 'QQ': '清泉',
                'HE': '治疗值', 'AS': '助攻', 'TD': '承受伤害',
                'RX': '人伤卸甲', 'BX': '破塔卸甲', 'ZY': '资源',
                'FG': '焚骨', 'ZS': '重伤', 'SW': '死亡'
            };
            
            Object.entries(numFields).forEach(([code, field]) => {
                const val = playerData[field];
                if (val && parseInt(val) > 0) {
                    parts.push(code + NumberMap.encode(val));
                }
            });
            
            // 3. 多场数据标记
            if (options.isMultiBattle && playerData.battles && playerData.battles.length > 1) {
                parts.push('M' + Math.min(99, playerData.battles.length));
                // 存储最近一场的差异
                const last = playerData.battles[playerData.battles.length - 1];
                const diff = [];
                ['BD', 'PD', 'K'].forEach(code => {
                    const field = numFields[code];
                    if (last[field]) diff.push(code + NumberMap.encode(last[field]));
                });
                if (diff.length) parts.push('L' + diff.join(''));
            }
            
            // 4. 添加时间戳
            parts.push('T' + TimeCompressor.encode().slice(0, 4));
            
            // 5. 组合并二次压缩
            const raw = parts.join('|');
            return this._toBase64(raw);
        },
        
        // 解压档案码
        decompress(code) {
            try {
                const raw = this._fromBase64(code);
                const parts = raw.split('|');
                
                const result = {
                    '玩家名字': '', '职业': '',
                    playerName: '', profession: ''
                };
                
                let isMulti = false;
                let battleCount = 1;
                
                parts.forEach(part => {
                    if (!part || part.length < 2) return;
                    
                    const prefix = part.slice(0, 1);
                    const val = part.slice(1);
                    
                    switch (prefix) {
                        case 'N':
                            result['玩家名字'] = result.playerName = StringCompressor.decode(val);
                            break;
                        case 'C':
                            result['职业'] = result.profession = ProfessionMap.decode[val] || val;
                            break;
                        case 'R':
                            result.region = RegionMap.decode[val] || val;
                            break;
                        case 'G':
                            result.userGuild = StringCompressor.decode(val);
                            break;
                        case 'I':
                            result.gameId = StringCompressor.decode(val);
                            break;
                        case 'M':
                            isMulti = true;
                            battleCount = parseInt(val) || 1;
                            break;
                        default:
                            // 数值字段
                            const field = FieldMap.decode[prefix + (val[0] || '')] || 
                                         FieldMap.decode[prefix];
                            if (field) {
                                result[field] = NumberMap.decode(val);
                            }
                    }
                });
                
                // 默认值
                if (!result['玩家名字']) result['玩家名字'] = result.playerName = '档案玩家';
                if (!result['职业']) result['职业'] = result.profession = '未知';
                
                result.isMultiBattle = isMulti;
                result.battleCount = battleCount;
                
                return result;
                
            } catch (e) {
                console.error('解压失败:', e);
                return null;
            }
        },
        
        // Base64编码（URL安全）
        _toBase64(str) {
            try {
                return btoa(encodeURIComponent(str))
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=/g, '');
            } catch (e) {
                return str;
            }
        },
        
        // Base64解码
        _fromBase64(str) {
            try {
                str = str.replace(/-/g, '+').replace(/_/g, '/');
                // 补齐padding
                while (str.length % 4) str += '=';
                return decodeURIComponent(atob(str));
            } catch (e) {
                return str;
            }
        }
    };

    // ==================== 暴露到全局 ====================
    global.CardCodeMappings = {
        ProfessionMap,
        FieldMap,
        NumberMap,
        RegionMap,
        StringCompressor,
        TimeCompressor,
        CardCodeCompressor
    };

})(typeof window !== 'undefined' ? window : this);
