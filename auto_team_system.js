/**
 * 智能自动分团系统
 * 实现算法：局部贪心 + 模拟退火 + 遗传算法 + OR-Tools约束规划
 */

class AutoTeamAllocationSystem {
    constructor() {
        this.config = {
            // 团队配置
            teamStructure: {
                mainTeam: { groups: 8, maxPerGroup: 12 },
                defenseTeam: { groups: 2, maxPerGroup: 12 },
                mobileTeam: { groups: 2, maxPerGroup: 12 }
            },
            
            // 职业约束
            professionConstraints: {
                healer: {
                    minPerGroup: 1,
                    maxPerGroup: 3,
                    types: ['抗压型', '辅助型'] // 治疗职业偏向
                },
                tank: { minPerGroup: 0, maxPerGroup: 2 },
                dps: { minPerGroup: 3, maxPerGroup: 8 },
                support: { minPerGroup: 0, maxPerGroup: 2 }
            },
            
            // 一线牵配置
            yixianqian: {
                pairs: [], // [{player1, player2, type1, type2}]
                priority: 0.8 // 一线牵的权重优先级
            },
            
            // 算法参数
            algorithms: {
                greedy: { enabled: true, weight: 0.3 },
                simulatedAnnealing: { enabled: true, weight: 0.3, temperature: 1000, coolingRate: 0.95 },
                genetic: { enabled: true, weight: 0.2, populationSize: 50, generations: 100, mutationRate: 0.1 },
                ortools: { enabled: true, weight: 0.2 }
            },
            
            // 评分权重
            weights: {
                fluctuation: 0.35,    // 波动比
                basePower: 0.25,      // 基础战力
                balance: 0.25,        // 团队平衡
                yixianqian: 0.15      // 一线牵满足度
            }
        };
        
        this.playerData = {}; // 玩家数据缓存
        this.assignment = {}; // 分配结果
        this.scoreHistory = []; // 历史评分
    }
    
    // ==================== 数据导入与处理 ====================
    
    /**
     * 导入玩家基础战力数据
     * @param {Array} equipmentData - 装备数据 [{playerName, equipmentScore, neigongScore, forgingScore, ...}]
     */
    importBasePowerData(equipmentData) {
        equipmentData.forEach(player => {
            if (!this.playerData[player.playerName]) {
                this.playerData[player.playerName] = {};
            }
            
            // 计算基础战力系数 (0-100)
            const basePower = (
                (player.equipmentScore || 0) * 0.4 +
                (player.neigongScore || 0) * 0.3 +
                (player.forgingScore || 0) * 0.2 +
                (player.otherScore || 0) * 0.1
            );
            
            this.playerData[player.playerName].basePower = basePower;
            this.playerData[player.playerName].equipment = player;
        });
        
        console.log(`已导入 ${equipmentData.length} 名玩家的基础战力数据`);
    }
    
    /**
     * 设置一线牵绑定
     * @param {String} player1 - 玩家1
     * @param {String} player2 - 玩家2
     * @param {String} type1 - 玩家1类型 (资源型/击杀型)
     * @param {String} type2 - 玩家2类型
     */
    addYixianqianPair(player1, player2, type1, type2) {
        this.config.yixianqian.pairs.push({
            player1, player2, type1, type2
        });
    }
    
    /**
     * 设置治疗职业偏向
     * @param {String} profession - 职业名称
     * @param {String} bias - 偏向 (抗压型/辅助型)
     */
    setHealerBias(profession, bias) {
        if (!this.config.professionConstraints.healer.bias) {
            this.config.professionConstraints.healer.bias = {};
        }
        this.config.professionConstraints.healer.bias[profession] = bias;
    }
    
    // ==================== 核心分配算法 ====================
    
    /**
     * 主分配函数
     * @param {Array} players - 待分配的玩家列表
     * @param {Object} fluctuations - 波动比数据
     * @returns {Object} 分配结果
     */
    allocateTeams(players, fluctuations) {
        console.log('开始自动分团计算...');
        
        // 1. 数据预处理
        const processedPlayers = this.preprocessPlayers(players, fluctuations);
        
        // 2. 使用多种算法进行分配
        const results = {};
        
        if (this.config.algorithms.greedy.enabled) {
            results.greedy = this.greedyAllocation([...processedPlayers]);
        }
        
        if (this.config.algorithms.simulatedAnnealing.enabled) {
            results.simulatedAnnealing = this.simulatedAnnealingAllocation([...processedPlayers]);
        }
        
        if (this.config.algorithms.genetic.enabled) {
            results.genetic = this.geneticAlgorithmAllocation([...processedPlayers]);
        }
        
        if (this.config.algorithms.ortools.enabled) {
            results.ortools = this.ortoolsAllocation([...processedPlayers]);
        }
        
        // 3. 评估各算法结果并选择最优
        const bestResult = this.selectBestResult(results, processedPlayers);
        
        // 4. 后处理（一线牵优化）
        this.postProcessYixianqian(bestResult);
        
        this.assignment = bestResult;
        console.log('自动分团完成！');
        
        return bestResult;
    }
    
    /**
     * 数据预处理
     */
    preprocessPlayers(players, fluctuations) {
        return players.map(player => {
            const name = player['玩家名字'];
            const playerFluctuations = fluctuations[name] || {};
            const basePower = this.playerData[name]?.basePower || 50; // 默认50
            
            // 计算综合评分
            const compositeScore = this.calculateCompositeScore(player, playerFluctuations, basePower);
            
            return {
                ...player,
                compositeScore,
                basePower,
                fluctuations: playerFluctuations,
                profession: player['玩家职业'] || '未知'
            };
        });
    }
    
    /**
     * 计算综合评分
     */
    calculateCompositeScore(player, fluctuations, basePower) {
        // 波动比得分 (越高越好)
        const fluctuationScore = Object.values(fluctuations).reduce((sum, val) => sum + (val || 0), 0);
        
        // 基础战力得分
        const powerScore = basePower / 100; // 归一化
        
        // 数据侧重得分
        const focusType = this.getPlayerFocusType(player);
        const focusScore = this.getFocusScore(focusType);
        
        // 综合评分
        return (
            fluctuationScore * this.config.weights.fluctuation +
            powerScore * this.config.weights.basePower +
            focusScore * (1 - this.config.weights.fluctuation - this.config.weights.basePower)
        );
    }
    
    /**
     * 获取玩家数据侧重类型
     */
    getPlayerFocusType(player) {
        const zhongshang = parseFloat(player['重伤']) || 0;
        const dmg = parseFloat(player['对玩家伤害']) || 0;
        const building = parseFloat(player['对建筑伤害']) || 0;
        const heal = parseFloat(player['治疗值']) || 0;
        const resource = parseFloat(player['资源']) || 0;
        
        if (zhongshang > 10) return '重伤型';
        if (heal > dmg && heal > building) return '辅助型';
        if (building > dmg) return '塔伤型';
        if (resource > 1000) return '资源型';
        return '人伤型';
    }
    
    /**
     * 获取侧重评分
     */
    getFocusScore(focusType) {
        const scoreMap = {
            '人伤型': 0.8,
            '塔伤型': 0.7,
            '辅助型': 0.6,
            '资源型': 0.5,
            '重伤型': 0.3
        };
        return scoreMap[focusType] || 0.5;
    }
    
    // ==================== 局部贪心算法 ====================
    
    /**
     * 局部贪心分配算法
     * 策略：每次选择最合适的组放入当前玩家
     */
    greedyAllocation(players) {
        console.log('执行局部贪心算法...');
        
        // 初始化团队结构
        const result = this.initializeTeamStructure();
        
        // 按综合评分排序（从高到低）
        players.sort((a, b) => b.compositeScore - a.compositeScore);
        
        players.forEach(player => {
            let bestTeam = null;
            let bestGroup = null;
            let bestScore = -Infinity;
            
            // 遍历所有组和队，找到最佳位置
            Object.keys(result.teams).forEach(teamName => {
                const team = result.teams[teamName];
                
                team.forEach((group, groupIndex) => {
                    if (group.members.length >= group.limit) return; // 已满
                    
                    // 检查职业约束
                    if (!this.checkProfessionConstraints(group.members, player)) return;
                    
                    // 计算放置得分
                    const score = this.calculatePlacementScore(group, player);
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestTeam = teamName;
                        bestGroup = groupIndex;
                    }
                });
            });
            
            // 放置到最佳位置
            if (bestTeam !== null) {
                result.teams[bestTeam][bestGroup].members.push(player);
            }
        });
        
        result.algorithm = 'greedy';
        result.score = this.evaluateAssignment(result);
        
        return result;
    }
    
    // ==================== 模拟退火算法 ====================
    
    /**
     * 模拟退火分配算法
     * 通过随机扰动寻找更优解
     */
    simulatedAnnealingAllocation(players) {
        console.log('执行模拟退火算法...');
        
        // 初始解（使用贪心结果）
        let current = this.greedyAllocation([...players]);
        let best = this.deepClone(current);
        
        const config = this.config.algorithms.simulatedAnnealing;
        let temperature = config.temperature;
        const coolingRate = config.coolingRate;
        
        let iteration = 0;
        while (temperature > 1) {
            // 生成邻居解（随机交换两个玩家）
            const neighbor = this.generateNeighbor(current, players);
            
            // 计算得分差
            const currentScore = current.score;
            const neighborScore = neighbor.score;
            const scoreDiff = neighborScore - currentScore;
            
            // 决定是否接受邻居解
            if (scoreDiff > 0 || Math.random() < Math.exp(scoreDiff / temperature)) {
                current = neighbor;
                
                if (neighborScore > best.score) {
                    best = this.deepClone(neighbor);
                }
            }
            
            // 降温
            temperature *= coolingRate;
            iteration++;
        }
        
        best.algorithm = 'simulatedAnnealing';
        console.log(`模拟退火完成，迭代次数：${iteration}`);
        
        return best;
    }
    
    // ==================== 遗传算法 ====================
    
    /**
     * 遗传算法分配
     * 使用进化策略优化分配方案
     */
    geneticAlgorithmAllocation(players) {
        console.log('执行遗传算法...');
        
        const config = this.config.algorithms.genetic;
        const populationSize = config.populationSize;
        const generations = config.generations;
        const mutationRate = config.mutationRate;
        
        // 初始化种群
        let population = [];
        for (let i = 0; i < populationSize; i++) {
            population.push(this.randomAllocation([...players]));
        }
        
        // 进化过程
        for (let gen = 0; gen < generations; gen++) {
            // 评估适应度
            population.forEach(individual => {
                if (!individual.score) {
                    individual.score = this.evaluateAssignment(individual);
                }
            });
            
            // 选择
            population.sort((a, b) => b.score - a.score);
            const survivors = population.slice(0, populationSize / 2);
            
            // 交叉和变异
            population = [...survivors];
            while (population.length < populationSize) {
                const parent1 = survivors[Math.floor(Math.random() * survivors.length)];
                const parent2 = survivors[Math.floor(Math.random() * survivors.length)];
                
                const child = this.crossover(parent1, parent2, players);
                
                if (Math.random() < mutationRate) {
                    this.mutate(child, players);
                }
                
                population.push(child);
            }
        }
        
        // 返回最优个体
        const best = population.reduce((best, individual) => 
            individual.score > best.score ? individual : best
        );
        
        best.algorithm = 'genetic';
        console.log(`遗传算法完成，进化代数：${generations}`);
        
        return best;
    }
    
    // ==================== OR-Tools约束规划 ====================
    
    /**
     * OR-Tools约束规划分配（简化版）
     * 由于浏览器环境限制，实现简化版约束求解
     */
    ortoolsAllocation(players) {
        console.log('执行OR-Tools约束规划...');
        
        // 简化的约束求解：使用线性规划思想
        const result = this.initializeTeamStructure();
        const unassigned = [...players];
        
        // 约束1：每个组人数限制
        // 约束2：职业平衡
        // 约束3：一线牵约束
        
        // 优先级1：满足一线牵约束
        this.satisfyYixianqianConstraints(result, unassigned);
        
        // 优先级2：职业平衡
        this.satisfyProfessionConstraints(result, unassigned);
        
        // 优先级3：战力均衡
        this.satisfyPowerBalanceConstraints(result, unassigned);
        
        result.algorithm = 'ortools';
        result.score = this.evaluateAssignment(result);
        
        return result;
    }
    
    // ==================== 辅助函数 ====================
    
    /**
     * 初始化团队结构
     */
    initializeTeamStructure() {
        const teams = {};
        
        Object.keys(this.config.teamStructure).forEach(teamName => {
            const config = this.config.teamStructure[teamName];
            teams[teamName] = [];
            
            for (let i = 0; i < config.groups; i++) {
                teams[teamName].push({
                    name: `${teamName}_${i + 1}`,
                    limit: config.maxPerGroup,
                    members: []
                });
            }
        });
        
        return { teams, score: 0 };
    }
    
    /**
     * 检查职业约束
     */
    checkProfessionConstraints(groupMembers, newPlayer) {
        const profession = newPlayer.profession;
        const professionType = this.getProfessionType(profession);
        
        // 统计当前组内各职业数量
        const counts = { healer: 0, tank: 0, dps: 0, support: 0 };
        groupMembers.forEach(member => {
            const type = this.getProfessionType(member.profession);
            counts[type]++;
        });
        
        // 检查添加新玩家后是否超过上限
        const constraints = this.config.professionConstraints[professionType];
        if (counts[professionType] >= constraints.maxPerGroup) {
            return false;
        }
        
        // 检查是否满足最小值（如果是最后一个位置）
        // ...
        
        return true;
    }
    
    /**
     * 获取职业类型
     */
    getProfessionType(profession) {
        const healerProfessions = ['素问', '铁衣', '血河']; // 治疗/坦克职业
        const tankProfessions = ['铁衣', '血河'];
        const supportProfessions = ['九灵', '碎梦'];
        
        if (healerProfessions.includes(profession)) return 'healer';
        if (tankProfessions.includes(profession)) return 'tank';
        if (supportProfessions.includes(profession)) return 'support';
        return 'dps';
    }
    
    /**
     * 计算放置得分
     */
    calculatePlacementScore(group, player) {
        let score = 0;
        
        // 战力平衡：组内平均战力接近整体平均
        const avgGroupPower = group.members.reduce((sum, m) => sum + m.basePower, 0) / Math.max(1, group.members.length);
        const powerDiff = Math.abs(player.basePower - avgGroupPower);
        score -= powerDiff * 0.1; // 差异越小越好
        
        // 职业互补
        const professionType = this.getProfessionType(player.profession);
        const hasSimilar = group.members.some(m => this.getProfessionType(m.profession) === professionType);
        if (!hasSimilar) score += 10; // 职业多样化加分
        
        // 数据侧重平衡
        const focusType = this.getPlayerFocusType(player);
        const similarFocusCount = group.members.filter(m => this.getPlayerFocusType(m) === focusType).length;
        if (similarFocusCount < 2) score += 5; // 避免同类型过多
        
        return score;
    }
    
    /**
     * 评估分配方案
     */
    evaluateAssignment(assignment) {
        let totalScore = 0;
        
        Object.keys(assignment.teams).forEach(teamName => {
            const team = assignment.teams[teamName];
            
            team.forEach(group => {
                // 团队平衡得分
                const balanceScore = this.calculateGroupBalance(group);
                
                // 战力均衡得分
                const powerScore = this.calculateGroupPowerBalance(group);
                
                // 一线牵满足度
                const yixianqianScore = this.calculateYixianqianSatisfaction(group);
                
                totalScore += balanceScore + powerScore + yixianqianScore;
            });
        });
        
        return totalScore;
    }
    
    /**
     * 计算团队平衡得分
     */
    calculateGroupBalance(group) {
        const members = group.members;
        if (members.length === 0) return 0;
        
        // 职业分布
        const professionCounts = { healer: 0, tank: 0, dps: 0, support: 0 };
        members.forEach(m => {
            const type = this.getProfessionType(m.profession);
            professionCounts[type]++;
        });
        
        // 理想分布：1-2治疗，1坦克，3-6输出，0-2辅助
        const ideal = { healer: 1.5, tank: 1, dps: 4, support: 1 };
        let score = 100;
        
        Object.keys(ideal).forEach(type => {
            const diff = Math.abs(professionCounts[type] - ideal[type]);
            score -= diff * 10;
        });
        
        return Math.max(0, score);
    }
    
    /**
     * 计算战力均衡得分
     */
    calculateGroupPowerBalance(group) {
        const members = group.members;
        if (members.length < 2) return 0;
        
        const powers = members.map(m => m.basePower);
        const avg = powers.reduce((a, b) => a + b, 0) / powers.length;
        const variance = powers.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / powers.length;
        
        // 方差越小越好
        return Math.max(0, 100 - variance);
    }
    
    /**
     * 计算一线牵满足度
     */
    calculateYixianqianSatisfaction(group) {
        let satisfied = 0;
        const memberNames = group.members.map(m => m['玩家名字']);
        
        this.config.yixianqian.pairs.forEach(pair => {
            const bothInGroup = memberNames.includes(pair.player1) && memberNames.includes(pair.player2);
            if (bothInGroup) satisfied++;
        });
        
        return satisfied * this.config.weights.yixianqian * 100;
    }
    
    /**
     * 生成邻居解（模拟退火）
     */
    generateNeighbor(current, players) {
        const neighbor = this.deepClone(current);
        
        // 随机选择两个玩家交换位置
        const allMembers = [];
        Object.keys(neighbor.teams).forEach(teamName => {
            neighbor.teams[teamName].forEach((group, groupIndex) => {
                group.members.forEach((member, memberIndex) => {
                    allMembers.push({
                        player: member,
                        team: teamName,
                        group: groupIndex,
                        index: memberIndex
                    });
                });
            });
        });
        
        if (allMembers.length < 2) return neighbor;
        
        // 随机选择两个玩家
        const idx1 = Math.floor(Math.random() * allMembers.length);
        let idx2 = Math.floor(Math.random() * allMembers.length);
        while (idx2 === idx1) {
            idx2 = Math.floor(Math.random() * allMembers.length);
        }
        
        const member1 = allMembers[idx1];
        const member2 = allMembers[idx2];
        
        // 交换位置
        const temp = neighbor.teams[member1.team][member1.group].members[member1.index];
        neighbor.teams[member1.team][member1.group].members[member1.index] = 
            neighbor.teams[member2.team][member2.group].members[member2.index];
        neighbor.teams[member2.team][member2.group].members[member2.index] = temp;
        
        neighbor.score = this.evaluateAssignment(neighbor);
        
        return neighbor;
    }
    
    /**
     * 随机分配（遗传算法初始种群）
     */
    randomAllocation(players) {
        const result = this.initializeTeamStructure();
        const unassigned = [...players];
        
        // 随机打乱
        this.shuffleArray(unassigned);
        
        // 随机分配
        unassigned.forEach(player => {
            const teamNames = Object.keys(result.teams);
            const randomTeam = teamNames[Math.floor(Math.random() * teamNames.length)];
            const groups = result.teams[randomTeam];
            
            const availableGroups = groups.filter(g => g.members.length < g.limit);
            if (availableGroups.length > 0) {
                const randomGroup = availableGroups[Math.floor(Math.random() * availableGroups.length)];
                randomGroup.members.push(player);
            }
        });
        
        result.score = this.evaluateAssignment(result);
        
        return result;
    }
    
    /**
     * 交叉操作（遗传算法）
     */
    crossover(parent1, parent2, players) {
        // 简化的交叉：随机选择父代的组结构
        const child = this.initializeTeamStructure();
        
        Object.keys(child.teams).forEach(teamName => {
            child.teams[teamName].forEach((group, groupIndex) => {
                const useParent1 = Math.random() < 0.5;
                const source = useParent1 ? parent1 : parent2;
                
                group.members = [...source.teams[teamName][groupIndex].members];
            });
        });
        
        // 确保所有玩家都被分配
        const assignedPlayers = new Set();
        Object.keys(child.teams).forEach(teamName => {
            child.teams[teamName].forEach(group => {
                group.members.forEach(m => assignedPlayers.add(m['玩家名字']));
            });
        });
        
        // 添加未分配的玩家
        players.forEach(player => {
            if (!assignedPlayers.has(player['玩家名字'])) {
                const teamNames = Object.keys(child.teams);
                const randomTeam = teamNames[Math.floor(Math.random() * teamNames.length)];
                const groups = child.teams[randomTeam];
                
                const availableGroups = groups.filter(g => g.members.length < g.limit);
                if (availableGroups.length > 0) {
                    const randomGroup = availableGroups[Math.floor(Math.random() * availableGroups.length)];
                    randomGroup.members.push(player);
                }
            }
        });
        
        child.score = this.evaluateAssignment(child);
        
        return child;
    }
    
    /**
     * 变异操作（遗传算法）
     */
    mutate(individual, players) {
        // 随机交换两个玩家
        const neighbor = this.generateNeighbor(individual, players);
        
        // 复制回individual
        Object.keys(individual.teams).forEach(teamName => {
            individual.teams[teamName].forEach((group, groupIndex) => {
                group.members = [...neighbor.teams[teamName][groupIndex].members];
            });
        });
        
        individual.score = neighbor.score;
    }
    
    /**
     * 选择最优结果
     */
    selectBestResult(results, players) {
        let bestAlgorithm = null;
        let bestScore = -Infinity;
        
        Object.keys(results).forEach(algorithm => {
            const result = results[algorithm];
            if (result.score > bestScore) {
                bestScore = result.score;
                bestAlgorithm = algorithm;
            }
        });
        
        console.log(`最优算法：${bestAlgorithm}，得分：${bestScore}`);
        
        return results[bestAlgorithm];
    }
    
    /**
     * 一线牵后处理优化
     */
    postProcessYixianqian(assignment) {
        this.config.yixianqian.pairs.forEach(pair => {
            // 找到两个玩家的位置
            let pos1 = null, pos2 = null;
            
            Object.keys(assignment.teams).forEach(teamName => {
                assignment.teams[teamName].forEach((group, groupIndex) => {
                    group.members.forEach((member, memberIndex) => {
                        if (member['玩家名字'] === pair.player1) {
                            pos1 = { team: teamName, group: groupIndex, index: memberIndex };
                        }
                        if (member['玩家名字'] === pair.player2) {
                            pos2 = { team: teamName, group: groupIndex, index: memberIndex };
                        }
                    });
                });
            });
            
            // 如果两人都在但不在同一组，尝试调整
            if (pos1 && pos2 && (pos1.team !== pos2.team || pos1.group !== pos2.group)) {
                this.movePlayerToGroup(assignment, pair.player2, pos1.team, pos1.group);
            }
        });
    }
    
    /**
     * 移动玩家到指定组
     */
    movePlayerToGroup(assignment, playerName, targetTeam, targetGroup) {
        // 找到玩家当前位置
        let currentPos = null;
        Object.keys(assignment.teams).forEach(teamName => {
            assignment.teams[teamName].forEach((group, groupIndex) => {
                const index = group.members.findIndex(m => m['玩家名字'] === playerName);
                if (index !== -1) {
                    currentPos = { team: teamName, group: groupIndex, index };
                }
            });
        });
        
        if (!currentPos) return;
        
        // 检查目标组是否有空位
        const target = assignment.teams[targetTeam][targetGroup];
        if (target.members.length >= target.limit) return;
        
        // 移动玩家
        const player = assignment.teams[currentPos.team][currentPos.group].members[currentPos.index];
        assignment.teams[currentPos.team][currentPos.group].members.splice(currentPos.index, 1);
        target.members.push(player);
    }
    
    /**
     * 深拷贝对象
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    
    /**
     * 打乱数组
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    // ==================== 配置管理 ====================
    
    /**
     * 保存配置到本地存储
     */
    saveConfig(name) {
        const configData = {
            config: this.config,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem(`teamConfig_${name}`, JSON.stringify(configData));
        console.log(`配置已保存：${name}`);
    }
    
    /**
     * 从本地存储加载配置
     */
    loadConfig(name) {
        const data = localStorage.getItem(`teamConfig_${name}`);
        if (data) {
            const configData = JSON.parse(data);
            this.config = configData.config;
            console.log(`配置已加载：${name}`);
            return true;
        }
        return false;
    }
    
    /**
     * 获取所有保存的配置名称
     */
    getSavedConfigs() {
        const configs = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('teamConfig_')) {
                configs.push(key.replace('teamConfig_', ''));
            }
        }
        return configs;
    }
    
    /**
     * 导出分配结果为JSON
     */
    exportAssignment() {
        return JSON.stringify({
            assignment: this.assignment,
            config: this.config,
            timestamp: new Date().toISOString()
        }, null, 2);
    }
    
    /**
     * 从JSON导入分配结果
     */
    importAssignment(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            this.assignment = data.assignment;
            this.config = data.config;
            return true;
        } catch (e) {
            console.error('导入失败：', e);
            return false;
        }
    }
}

// ==================== 全局实例 ====================

// 创建全局自动分团系统实例
window.autoTeamSystem = new AutoTeamAllocationSystem();

// ==================== UI集成函数 ====================

/**
 * 执行自动分团（UI调用）
 */
function executeAutoTeamAllocation() {
    console.log('开始执行自动分团...');
    
    // 获取当前帮会数据
    const selectedGuild = dataSourceManager.selectedGuild;
    if (!selectedGuild) {
        alert('请先选择帮会');
        return;
    }
    
    // 获取玩家数据
    const playerHistory = dataSourceManager.getGuildPlayerHistory(selectedGuild);
    const players = [];
    
    Object.keys(playerHistory).forEach(playerName => {
        const history = playerHistory[playerName];
        if (history.length > 0) {
            // 使用最新数据
            players.push(history[history.length - 1]);
        }
    });
    
    // 获取波动比数据
    const fluctuations = guildDataBaseline.fluctuations;
    
    if (!fluctuations || Object.keys(fluctuations).length === 0) {
        alert('请先计算波动比数据');
        return;
    }
    
    // 显示加载状态
    showLoadingOverlay('正在执行智能分团计算...');
    
    // 异步执行（避免阻塞UI）
    setTimeout(() => {
        try {
            // 执行自动分团
            const result = window.autoTeamSystem.allocateTeams(players, fluctuations);
            
            // 应用分配结果到UI
            applyAllocationResult(result);
            
            // 显示结果统计
            showAllocationStats(result);
            
            hideLoadingOverlay();
            alert(`自动分团完成！\n最优算法：${result.algorithm}\n总得分：${result.score.toFixed(2)}`);
            
        } catch (error) {
            hideLoadingOverlay();
            console.error('自动分团失败：', error);
            alert('自动分团失败：' + error.message);
        }
    }, 100);
}

/**
 * 应用分配结果到UI
 */
function applyAllocationResult(result) {
    // 清空现有团队
    teams = { 大团: [], 防守团: [], 机动团: [] };
    
    // 应用新分配
    Object.keys(result.teams).forEach(teamName => {
        const teamData = result.teams[teamName];
        
        teamData.forEach(groupData => {
            const group = {
                name: groupData.name,
                limit: groupData.limit,
                members: groupData.members.map(m => m['玩家名字'])
            };
            
            teams[teamName].push(group);
        });
    });
    
    // 重新渲染UI
    renderAllTeams();
    updateTeamAnalysisTable();
    updateTeamRightPanel();
    renderMemberPool();
}

/**
 * 显示分配统计
 */
function showAllocationStats(result) {
    const stats = {
        totalPlayers: 0,
        teamDistribution: {},
        professionDistribution: {},
        focusTypeDistribution: {},
        yixianqianSatisfied: 0
    };
    
    // 计算统计信息
    Object.keys(result.teams).forEach(teamName => {
        stats.teamDistribution[teamName] = 0;
        
        result.teams[teamName].forEach(group => {
            stats.totalPlayers += group.members.length;
            stats.teamDistribution[teamName] += group.members.length;
            
            group.members.forEach(member => {
                const profession = member.profession;
                const focusType = window.autoTeamSystem.getPlayerFocusType(member);
                
                stats.professionDistribution[profession] = (stats.professionDistribution[profession] || 0) + 1;
                stats.focusTypeDistribution[focusType] = (stats.focusTypeDistribution[focusType] || 0) + 1;
            });
        });
    });
    
    // 一线牵满足度
    window.autoTeamSystem.config.yixianqian.pairs.forEach(pair => {
        Object.keys(result.teams).forEach(teamName => {
            result.teams[teamName].forEach(group => {
                const members = group.members.map(m => m['玩家名字']);
                if (members.includes(pair.player1) && members.includes(pair.player2)) {
                    stats.yixianqianSatisfied++;
                }
            });
        });
    });
    
    // 显示统计面板（可以创建一个新的UI组件）
    console.log('分配统计：', stats);
    
    // 更新统计UI
    updateAllocationStatsUI(stats, result);
}

/**
 * 更新分配统计UI
 */
function updateAllocationStatsUI(stats, result) {
    // 创建或更新统计面板
    let statsPanel = document.getElementById('allocationStatsPanel');
    
    if (!statsPanel) {
        statsPanel = document.createElement('div');
        statsPanel.id = 'allocationStatsPanel';
        statsPanel.className = 'glass-card rounded-2xl p-6 shadow-xl mb-6';
        
        const teamSquadBuilderTab = document.getElementById('teamSquadBuilderTab');
        if (teamSquadBuilderTab) {
            teamSquadBuilderTab.insertBefore(statsPanel, teamSquadBuilderTab.firstChild);
        }
    }
    
    const yixianqianTotal = window.autoTeamSystem.config.yixianqian.pairs.length;
    const yixianqianRate = yixianqianTotal > 0 ? (stats.yixianqianSatisfied / yixianqianTotal * 100).toFixed(1) : 100;
    
    statsPanel.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold">
                <i class="fas fa-chart-line mr-2 text-green-500"></i>
                自动分团统计
                <span class="ml-3 text-sm text-gray-400">算法：${result.algorithm}</span>
            </h3>
            <span class="text-2xl font-bold text-green-400">${result.score.toFixed(2)}</span>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div class="text-center">
                <div class="text-2xl font-bold text-blue-400">${stats.totalPlayers}</div>
                <div class="text-sm text-gray-400">分配总数</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-purple-400">${Object.keys(stats.teamDistribution).length}</div>
                <div class="text-sm text-gray-400">团队数量</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-yellow-400">${yixianqianRate}%</div>
                <div class="text-sm text-gray-400">一线牵满足</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-green-400">${result.score.toFixed(0)}</div>
                <div class="text-sm text-gray-400">综合得分</div>
            </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
                <div class="font-semibold mb-2">团队分布</div>
                ${Object.keys(stats.teamDistribution).map(team => 
                    `<div class="flex justify-between">
                        <span>${team}</span>
                        <span class="text-blue-400">${stats.teamDistribution[team]}人</span>
                    </div>`
                ).join('')}
            </div>
            
            <div>
                <div class="font-semibold mb-2">职业分布</div>
                ${Object.keys(stats.professionDistribution).map(prof => 
                    `<div class="flex justify-between">
                        <span>${prof}</span>
                        <span class="text-purple-400">${stats.professionDistribution[prof]}人</span>
                    </div>`
                ).join('')}
            </div>
            
            <div>
                <div class="font-semibold mb-2">数据侧重</div>
                ${Object.keys(stats.focusTypeDistribution).map(type => 
                    `<div class="flex justify-between">
                        <span>${type}</span>
                        <span class="text-green-400">${stats.focusTypeDistribution[type]}人</span>
                    </div>`
                ).join('')}
            </div>
        </div>
    `;
}

/**
 * 显示加载遮罩
 */
function showLoadingOverlay(message) {
    let overlay = document.getElementById('loadingOverlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        overlay.innerHTML = `
            <div class="glass-card rounded-2xl p-8 shadow-2xl text-center">
                <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <div class="text-lg text-white">${message}</div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    overlay.style.display = 'flex';
}

/**
 * 隐藏加载遮罩
 */
function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// ==================== 一线牵管理 ====================

/**
 * 显示一线牵管理界面
 */
function showYixianqianManager() {
    const modal = createModal('一线牵管理', `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-semibold mb-2">添加一线牵配对</label>
                <div class="grid grid-cols-2 gap-2 mb-2">
                    <input type="text" id="yxqPlayer1" placeholder="玩家1" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                    <input type="text" id="yxqPlayer2" placeholder="玩家2" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                </div>
                <div class="grid grid-cols-2 gap-2 mb-2">
                    <select id="yxqType1" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                        <option value="">选择类型1</option>
                        <option value="资源型">资源型</option>
                        <option value="击杀型">击杀型</option>
                    </select>
                    <select id="yxqType2" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                        <option value="">选择类型2</option>
                        <option value="资源型">资源型</option>
                        <option value="击杀型">击杀型</option>
                    </select>
                </div>
                <button onclick="addYixianqianPair()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                    <i class="fas fa-plus mr-2"></i>添加
                </button>
            </div>
            
            <div>
                <label class="block text-sm font-semibold mb-2">已有一线牵配对</label>
                <div id="yixianqianList" class="space-y-2 max-h-48 overflow-y-auto"></div>
            </div>
        </div>
    `);
    
    updateYixianqianList();
}

/**
 * 添加一线牵配对
 */
function addYixianqianPair() {
    const player1 = document.getElementById('yxqPlayer1').value.trim();
    const player2 = document.getElementById('yxqPlayer2').value.trim();
    const type1 = document.getElementById('yxqType1').value;
    const type2 = document.getElementById('yxqType2').value;
    
    if (!player1 || !player2) {
        alert('请输入两个玩家名称');
        return;
    }
    
    if (player1 === player2) {
        alert('不能绑定同一个玩家');
        return;
    }
    
    // 添加到系统
    window.autoTeamSystem.addYixianqianPair(player1, player2, type1, type2);
    
    // 清空输入
    document.getElementById('yxqPlayer1').value = '';
    document.getElementById('yxqPlayer2').value = '';
    document.getElementById('yxqType1').value = '';
    document.getElementById('yxqType2').value = '';
    
    // 更新列表
    updateYixianqianList();
    
    alert('一线牵配对添加成功！');
}

/**
 * 更新一线牵列表
 */
function updateYixianqianList() {
    const list = document.getElementById('yixianqianList');
    if (!list) return;
    
    const pairs = window.autoTeamSystem.config.yixianqian.pairs;
    
    if (pairs.length === 0) {
        list.innerHTML = '<div class="text-gray-400 text-center py-4">暂无配对</div>';
        return;
    }
    
    list.innerHTML = pairs.map((pair, index) => `
        <div class="flex items-center justify-between bg-gray-700 rounded-lg p-3">
            <div class="flex items-center space-x-4">
                <span class="font-medium">${pair.player1}</span>
                <i class="fas fa-link text-blue-400"></i>
                <span class="font-medium">${pair.player2}</span>
                ${pair.type1 || pair.type2 ? 
                    `<span class="text-xs text-gray-400">(${pair.type1 || '未设置'} - ${pair.type2 || '未设置'})</span>` : 
                    ''
                }
            </div>
            <button onclick="removeYixianqianPair(${index})" class="text-red-400 hover:text-red-300">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

/**
 * 删除一线牵配对
 */
function removeYixianqianPair(index) {
    if (confirm('确定删除该一线牵配对？')) {
        window.autoTeamSystem.config.yixianqian.pairs.splice(index, 1);
        updateYixianqianList();
    }
}

// ==================== 配置管理 ====================

/**
 * 显示配置管理器
 */
function showConfigManager() {
    const configs = window.autoTeamSystem.getSavedConfigs();
    
    const modal = createModal('配置管理', `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-semibold mb-2">保存当前配置</label>
                <div class="flex space-x-2">
                    <input type="text" id="configName" placeholder="配置名称" class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                    <button onclick="saveTeamConfig()" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
                        <i class="fas fa-save mr-2"></i>保存
                    </button>
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-semibold mb-2">已保存的配置</label>
                <div id="configList" class="space-y-2 max-h-64 overflow-y-auto">
                    ${configs.length === 0 ? 
                        '<div class="text-gray-400 text-center py-4">暂无配置</div>' :
                        configs.map(config => `
                            <div class="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                                <span class="font-medium">${config}</span>
                                <div class="flex space-x-2">
                                    <button onclick="loadTeamConfig('${config}')" class="text-blue-400 hover:text-blue-300">
                                        <i class="fas fa-upload"></i>
                                    </button>
                                    <button onclick="deleteTeamConfig('${config}')" class="text-red-400 hover:text-red-300">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
            
            <div class="pt-4 border-t border-gray-600">
                <button onclick="exportTeamConfig()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg mr-2">
                    <i class="fas fa-download mr-2"></i>导出配置
                </button>
                <button onclick="importTeamConfig()" class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg">
                    <i class="fas fa-upload mr-2"></i>导入配置
                </button>
            </div>
        </div>
    `);
    
    // 隐藏导入文件输入（如果需要）
    const fileInput = document.getElementById('configFileInput');
    if (fileInput) fileInput.style.display = 'none';
}

/**
 * 保存团队配置
 */
function saveTeamConfig() {
    const name = document.getElementById('configName').value.trim();
    if (!name) {
        alert('请输入配置名称');
        return;
    }
    
    window.autoTeamSystem.saveConfig(name);
    document.getElementById('configName').value = '';
    
    // 刷新列表
    showConfigManager();
}

/**
 * 加载团队配置
 */
function loadTeamConfig(name) {
    if (window.autoTeamSystem.loadConfig(name)) {
        alert('配置加载成功！');
        closeModal();
        
        // 如果当前有分配结果，重新应用
        if (window.autoTeamSystem.assignment) {
            applyAllocationResult(window.autoTeamSystem.assignment);
        }
    } else {
        alert('配置加载失败');
    }
}

/**
 * 删除团队配置
 */
function deleteTeamConfig(name) {
    if (confirm(`确定删除配置 "${name}"？`)) {
        localStorage.removeItem(`teamConfig_${name}`);
        showConfigManager();
    }
}

/**
 * 导出团队配置
 */
function exportTeamConfig() {
    const data = window.autoTeamSystem.exportAssignment();
    
    // 创建下载链接
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team_config_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * 导入团队配置
 */
function importTeamConfig() {
    let fileInput = document.getElementById('configFileInput');
    
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.id = 'configFileInput';
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        fileInput.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    if (window.autoTeamSystem.importAssignment(event.target.result)) {
                        alert('配置导入成功！');
                        closeModal();
                        
                        // 应用分配结果
                        if (window.autoTeamSystem.assignment) {
                            applyAllocationResult(window.autoTeamSystem.assignment);
                        }
                    } else {
                        alert('配置导入失败');
                    }
                } catch (error) {
                    alert('配置文件格式错误：' + error.message);
                }
            };
            reader.readAsText(file);
        };
    }
    
    fileInput.click();
}

// ==================== 工具函数 ====================

/**
 * 创建模态框
 */
function createModal(title, content) {
    // 关闭已存在的模态框
    closeModal();
    
    const modal = document.createElement('div');
    modal.id = 'teamSystemModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="glass-card rounded-2xl p-6 shadow-2xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold">${title}</h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            ${content}
        </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
}

/**
 * 关闭模态框
 */
function closeModal() {
    const modal = document.getElementById('teamSystemModal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

console.log('自动分团系统已加载');
