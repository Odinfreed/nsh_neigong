/**
 * GitHub Gist 档案码系统 - v1.0.0
 * 基于 Gist 的云端档案存储和 8 位短码分享
 * 
 * 核心功能：
 * 1. 将玩家档案数据上传到 GitHub Gist
 * 2. 生成 8 位 Base62 短码
 * 3. 通过短码解析获取档案数据
 * 4. IndexedDB 本地缓存
 */

const ArchiveGistSystem = (function() {
    'use strict';

    // ==================== 配置 ====================
    const CONFIG = {
        GITHUB_API_BASE: 'https://api.github.com',
        DB_NAME: 'nsh_archive_db',
        DB_VERSION: 1,
        STORE_NAME: 'archives',
        CODE_LENGTH: 8,
        EXPIRE_HOURS: 24,
        BASE62_CHARS: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    };

    // ==================== IndexedDB 管理 ====================
    let db = null;

    async function initDB() {
        if (db) return db;
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                db = request.result;
                resolve(db);
            };
            
            request.onupgradeneeded = (event) => {
                const database = event.target.result;
                if (!database.objectStoreNames.contains(CONFIG.STORE_NAME)) {
                    const store = database.createObjectStore(CONFIG.STORE_NAME, { keyPath: 'shortCode' });
                    store.createIndex('gistId', 'gistId', { unique: true });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    async function saveToCache(shortCode, gistId, data) {
        try {
            const database = await initDB();
            return new Promise((resolve, reject) => {
                const transaction = database.transaction([CONFIG.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(CONFIG.STORE_NAME);
                
                const record = {
                    shortCode,
                    gistId,
                    data,
                    timestamp: Date.now(),
                    expireAt: Date.now() + (CONFIG.EXPIRE_HOURS * 60 * 60 * 1000)
                };
                
                const request = store.put(record);
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error('缓存存档失败:', e);
            return false;
        }
    }

    async function getFromCache(shortCode) {
        try {
            const database = await initDB();
            return new Promise((resolve, reject) => {
                const transaction = database.transaction([CONFIG.STORE_NAME], 'readonly');
                const store = transaction.objectStore(CONFIG.STORE_NAME);
                const request = store.get(shortCode);
                
                request.onsuccess = () => {
                    const result = request.result;
                    if (!result) {
                        resolve(null);
                        return;
                    }
                    
                    // 检查是否过期
                    const isExpired = Date.now() > result.expireAt;
                    resolve({
                        ...result,
                        isExpired
                    });
                };
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error('读取缓存失败:', e);
            return null;
        }
    }

    async function getFromCacheByGistId(gistId) {
        try {
            const database = await initDB();
            return new Promise((resolve, reject) => {
                const transaction = database.transaction([CONFIG.STORE_NAME], 'readonly');
                const store = transaction.objectStore(CONFIG.STORE_NAME);
                const index = store.index('gistId');
                const request = index.get(gistId);
                
                request.onsuccess = () => {
                    const result = request.result;
                    if (!result) {
                        resolve(null);
                        return;
                    }
                    
                    const isExpired = Date.now() > result.expireAt;
                    resolve({
                        ...result,
                        isExpired
                    });
                };
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error('读取缓存失败:', e);
            return null;
        }
    }

    // ==================== Base62 编解码 ====================
    function base62Encode(num) {
        if (num === 0) return CONFIG.BASE62_CHARS[0];
        let result = '';
        let n = BigInt(num);
        const base = BigInt(62);
        
        while (n > 0) {
            result = CONFIG.BASE62_CHARS[Number(n % base)] + result;
            n = n / base;
        }
        
        // 补足到指定长度
        while (result.length < CONFIG.CODE_LENGTH) {
            result = CONFIG.BASE62_CHARS[0] + result;
        }
        
        return result.slice(-CONFIG.CODE_LENGTH);
    }

    // Base62 解码（保留用于未来扩展）
    function base62Decode(str) {
        let result = BigInt(0);
        const base = BigInt(62);
        
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            const value = BigInt(CONFIG.BASE62_CHARS.indexOf(char));
            if (value < 0) return null;
            result = result * base + value;
        }
        
        return result.toString();
    }
    
    // 导出解码函数供外部使用
    window.base62Decode = base62Decode;

    // 生成随机短码（作为备用方案）
    function generateRandomShortCode() {
        let result = '';
        for (let i = 0; i < CONFIG.CODE_LENGTH; i++) {
            result += CONFIG.BASE62_CHARS[Math.floor(Math.random() * 62)];
        }
        return result;
    }

    // ==================== GitHub Gist API ====================
    
    /**
     * 创建 Gist
     * @param {Object} archiveData - 档案数据
     * @param {string} token - 可选的 GitHub Token
     * @returns {Promise<{gistId: string, url: string}>}
     */
    async function createGist(archiveData, token = null) {
        const content = JSON.stringify(archiveData, null, 2);
        
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'NSH-Archive-System'
        };
        
        if (token) {
            headers['Authorization'] = `token ${token}`;
        }
        
        const body = {
            description: `NSH Archive - ${archiveData.playerName || 'Unknown'} - ${new Date().toISOString()}`,
            public: false,
            files: {
                'archive.json': {
                    content: content
                }
            }
        };
        
        const response = await fetch(`${CONFIG.GITHUB_API_BASE}/gists`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`GitHub API 错误: ${error.message || response.statusText}`);
        }
        
        const data = await response.json();
        return {
            gistId: data.id,
            url: data.html_url,
            rawUrl: data.files['archive.json'].raw_url
        };
    }

    /**
     * 获取 Gist 内容
     * @param {string} gistId - Gist ID
     * @returns {Promise<Object>}
     */
    async function getGist(gistId) {
        // 首先检查本地缓存
        const cached = await getFromCacheByGistId(gistId);
        if (cached && !cached.isExpired) {
            console.log('从本地缓存获取档案:', gistId);
            return {
                data: cached.data,
                fromCache: true,
                isExpired: false
            };
        }
        
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'NSH-Archive-System'
        };
        
        const response = await fetch(`${CONFIG.GITHUB_API_BASE}/gists/${gistId}`, {
            method: 'GET',
            headers
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('档案不存在或已被删除');
            }
            if (response.status === 403) {
                throw new Error('API 速率限制已超出，请稍后再试');
            }
            throw new Error(`获取档案失败: ${response.statusText}`);
        }
        
        const gistData = await response.json();
        const content = gistData.files['archive.json']?.content;
        
        if (!content) {
            throw new Error('档案数据格式错误');
        }
        
        try {
            const archiveData = JSON.parse(content);
            return {
                data: archiveData,
                fromCache: false,
                isExpired: false
            };
        } catch (e) {
            throw new Error('档案数据解析失败');
        }
    }

    // ==================== 短码映射管理 ====================
    
    // 由于 Gist ID 是哈希值，无法直接反向解析
    // 我们使用 IndexedDB 存储 shortCode -> gistId 的映射
    // 同时 shortCode 也可以包含编码信息来减少查询
    
    async function generateShortCode(gistId) {
        // 尝试使用 Gist ID 的前 8 位字符进行 Base62 编码
        // 如果冲突，则添加随机后缀
        let shortCode = base62Encode(parseInt(gistId.slice(0, 8), 16)).slice(-CONFIG.CODE_LENGTH);
        
        // 检查是否冲突
        const existing = await getFromCache(shortCode);
        if (existing && existing.gistId !== gistId) {
            // 有冲突，使用随机码
            shortCode = generateRandomShortCode();
        }
        
        return shortCode;
    }

    // ==================== 公共 API ====================
    
    return {
        /**
         * 初始化系统
         */
        async init() {
            await initDB();
            console.log('Archive Gist System 已初始化');
        },

        /**
         * 上传档案并生成短码
         * @param {Object} playerData - 玩家数据
         * @param {Array} multiBattleData - 多场历史数据（可选）
         * @param {string} token - GitHub Token（可选）
         * @returns {Promise<{shortCode: string, gistId: string, url: string}>}
         */
        async uploadArchive(playerData, multiBattleData = [], token = null) {
            try {
                // 构建档案数据
                const archiveData = {
                    version: '1.0',
                    timestamp: Date.now(),
                    playerName: playerData['玩家名字'] || 'Unknown',
                    profession: playerData['职业'] || 'Unknown',
                    playerData: playerData,
                    multiBattleData: multiBattleData,
                    meta: {
                        createdAt: new Date().toISOString(),
                        expireAt: new Date(Date.now() + CONFIG.EXPIRE_HOURS * 60 * 60 * 1000).toISOString()
                    }
                };
                
                // 创建 Gist
                const gist = await createGist(archiveData, token);
                
                // 生成短码
                const shortCode = await generateShortCode(gist.gistId);
                
                // 保存到本地缓存
                await saveToCache(shortCode, gist.gistId, archiveData);
                
                return {
                    shortCode,
                    gistId: gist.gistId,
                    url: gist.url,
                    rawUrl: gist.rawUrl,
                    shareUrl: `${window.location.origin}${window.location.pathname}?card=${shortCode}`
                };
            } catch (e) {
                console.error('上传档案失败:', e);
                throw e;
            }
        },

        /**
         * 通过短码获取档案
         * @param {string} shortCode - 8位短码
         * @returns {Promise<{data: Object, isExpired: boolean, fromCache: boolean}>}
         */
        async getArchiveByShortCode(shortCode) {
            try {
                // 标准化短码（大写）
                const code = shortCode.toUpperCase().trim();
                
                if (code.length !== CONFIG.CODE_LENGTH) {
                    throw new Error(`短码格式错误，应为 ${CONFIG.CODE_LENGTH} 位`);
                }
                
                // 先检查本地缓存
                const cached = await getFromCache(code);
                if (cached) {
                    console.log('从缓存获取档案:', code);
                    return {
                        data: cached.data,
                        gistId: cached.gistId,
                        isExpired: cached.isExpired,
                        fromCache: true
                    };
                }
                
                // 缓存未命中，需要解析 Gist ID
                // 由于短码通过 IndexedDB 映射到 Gist ID，缓存未命中意味着该短码不存在
                // 提示用户输入完整 Gist ID 或 URL
                throw new Error('未找到该短码对应的档案，请确认短码正确或尝试使用完整 Gist URL');
                
            } catch (e) {
                console.error('获取档案失败:', e);
                throw e;
            }
        },

        /**
         * 通过 Gist ID 直接获取档案
         * @param {string} gistId - Gist ID
         * @returns {Promise<{data: Object, isExpired: boolean, fromCache: boolean}>}
         */
        async getArchiveByGistId(gistId) {
            try {
                const result = await getGist(gistId);
                
                // 检查过期时间
                const isExpired = result.data.meta?.expireAt 
                    ? new Date(result.data.meta.expireAt) < new Date()
                    : (Date.now() - result.data.timestamp) > (CONFIG.EXPIRE_HOURS * 60 * 60 * 1000);
                
                return {
                    ...result,
                    isExpired
                };
            } catch (e) {
                console.error('获取档案失败:', e);
                throw e;
            }
        },

        /**
         * 解析 URL 参数中的 card 码
         * @returns {Promise<{data: Object, isExpired: boolean, shortCode: string}|null>}
         */
        async parseUrlCard() {
            const params = new URLSearchParams(window.location.search);
            const cardCode = params.get('card') || params.get('gist');
            
            if (!cardCode) return null;
            
            // 判断是短码还是 Gist ID
            // Gist ID 是 32 位哈希，短码是 8 位 Base62
            if (cardCode.length === 32) {
                // 可能是 Gist ID
                const result = await this.getArchiveByGistId(cardCode);
                return {
                    ...result,
                    shortCode: cardCode
                };
            } else if (cardCode.length === CONFIG.CODE_LENGTH) {
                // 短码
                const result = await this.getArchiveByShortCode(cardCode);
                return {
                    ...result,
                    shortCode: cardCode
                };
            } else {
                throw new Error('无效的档案码格式');
            }
        },

        /**
         * 生成分享链接
         * @param {string} shortCode - 短码
         * @returns {string}
         */
        generateShareLink(shortCode) {
            return `${window.location.origin}${window.location.pathname}?card=${shortCode}`;
        },

        /**
         * 检查档案是否过期
         * @param {Object} archiveData - 档案数据
         * @returns {boolean}
         */
        isArchiveExpired(archiveData) {
            if (!archiveData) return true;
            
            const timestamp = archiveData.timestamp || 0;
            const expireTime = timestamp + (CONFIG.EXPIRE_HOURS * 60 * 60 * 1000);
            return Date.now() > expireTime;
        },

        /**
         * 获取过期时间配置
         * @returns {number} 小时
         */
        getExpireHours() {
            return CONFIG.EXPIRE_HOURS;
        },

        /**
         * 清除过期缓存
         */
        async clearExpiredCache() {
            try {
                const database = await initDB();
                return new Promise((resolve, reject) => {
                    const transaction = database.transaction([CONFIG.STORE_NAME], 'readwrite');
                    const store = transaction.objectStore(CONFIG.STORE_NAME);
                    const index = store.index('timestamp');
                    const request = index.openCursor();
                    let deleted = 0;
                    
                    request.onsuccess = (event) => {
                        const cursor = event.target.result;
                        if (cursor) {
                            const record = cursor.value;
                            if (Date.now() > record.expireAt) {
                                store.delete(record.shortCode);
                                deleted++;
                            }
                            cursor.continue();
                        } else {
                            resolve(deleted);
                        }
                    };
                    request.onerror = () => reject(request.error);
                });
            } catch (e) {
                console.error('清除过期缓存失败:', e);
                return 0;
            }
        }
    };
})();

// 导出到全局
if (typeof window !== 'undefined') {
    window.ArchiveGistSystem = ArchiveGistSystem;
}
