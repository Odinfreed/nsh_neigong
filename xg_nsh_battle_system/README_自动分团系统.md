# 智能自动分团系统 - 完整解决方案

## 🎯 系统简介

本系统为《逆水寒》帮会帮战提供智能分团解决方案，集成4种先进算法，支持装备内功打造数据导入、一线牵配对、团队配置管理等功能。

## 📦 文件清单

```
xg_nsh_battle_system/
├── auto_team_system.js          # 核心算法系统（1463行）
├── auto_team_ui.js              # UI集成组件（694行）
├── equipment_csv_importer.js    # CSV导入器（完整功能）
├── setup_auto_team.js           # 控制台部署脚本
├── complete_setup.html          # 可视化部署指南
├── 自动分团系统使用说明.md      # 详细使用文档
├── 装备内功打造.csv             # 示例数据文件
└── README_自动分团系统.md       # 本文件
```

## 🚀 快速部署（3分钟）

### 方式一：手动集成（推荐）

1. **编辑HTML文件**

打开 `xg_guild_analysis_main.html` 或 `xg_guild_analysis_backup.html`，在 `</body>` 前添加：

```html
<!-- 自动分团系统 -->
<script src="../auto_team_system.js"></script>
<script src="../auto_team_ui.js"></script>
<script src="../equipment_csv_importer.js"></script>
```

2. **刷新页面**

保存后刷新浏览器，系统自动初始化。

3. **验证加载**

打开浏览器控制台，应看到：
```
自动分团系统已加载
自动分团UI集成已加载
装备CSV导入器已加载
自动分团UI初始化完成
```

### 方式二：控制台部署

1. 打开分析页面，按 `F12`
2. 切换到 Console 标签
3. 复制 `setup_auto_team.js` 内容并执行
4. 等待部署完成

### 方式三：可视化部署

直接打开 `complete_setup.html`，按照页面指南操作。

## 📖 使用流程

### 1. 导入装备内功打造数据

**准备CSV文件**（格式示例）：
```csv
游戏名,主职业（主打职业）,武器类型,武器类等级,头饰类型,头饰类等级,内功情况（如果有荡江斗按多一属性来算）:金,内功情况（如果有荡江斗按多一属性来算）:木,内功情况（如果有荡江斗按多一属性来算）:水,内功情况（如果有荡江斗按多一属性来算）:火,内功情况（如果有荡江斗按多一属性来算）:土,打造情况,一线牵（对方id或无）
玩家A,碎梦,独珍,155,竞技百炼（PVP）,155,3,1,0,3,0,当赛季打造,玩家B
玩家B,素问,独珍,155,竞技百炼（PVP）,155,0,0,1,0,3,当赛季打造,玩家A
```

**操作步骤**：
1. 进入"智能分团"标签页
2. 找到"装备内功打造CSV导入"卡片
3. 选择CSV文件
4. 点击"预览"查看数据
5. 确认无误后点击"导入"

**自动计算**：
- 装备评分（基于装备类型和等级）
- 内功评分（基于五行属性等级）
- 打造评分（当赛季/往期/无）
- 一线牵配对（自动识别并导入）

### 2. 设置一线牵（可选）

**手动添加**：
1. 点击"一线牵"按钮
2. 输入两个玩家名称
3. 选择类型（资源型/击杀型）
4. 点击"添加"

**CSV自动导入**：CSV文件中"一线牵"列的配对会自动导入

**智能分配逻辑**：
- 击杀型 + 资源型 → 保镖模式（击杀型保护资源型）
- 同类型配对 → 分配到同组

### 3. 配置自动分团参数

在"自动分团配置"面板中调整：

**算法启用**（建议全部启用）：
- ✅ 局部贪心算法
- ✅ 模拟退火算法
- ✅ 遗传算法
- ✅ OR-Tools约束规划

**评分权重**（默认）：
- 波动比：35%
- 基础战力：25%
- 团队平衡：25%
- 一线牵：15%

**团队结构**：
- 大团组数：8组
- 防守团组数：2组
- 机动团组数：2组
- 每组人数上限：12人

### 4. 执行自动分团

1. 点击"自动分团"按钮
2. 等待系统计算（10-30秒）
3. 查看统计面板

**统计信息**：
- 分配总数
- 最优算法名称
- 综合得分
- 一线牵满足率
- 团队/职业/数据侧重分布

### 5. 微调和保存

**手动调整**：
- 拖拽成员到不同组
- 删除组成员
- 添加新组

**保存配置**：
1. 点击"配置管理"按钮
2. 输入配置名称
3. 点击"保存"

**导出配置**：
- 导出JSON文件备份
- 分享给其他管理者

## 🔧 高级配置

### 自定义职业约束

```javascript
// 在浏览器控制台或脚本中执行
window.autoTeamSystem.config.professionConstraints = {
    healer: {
        minPerGroup: 1,      // 每组最少1个治疗
        maxPerGroup: 3,      // 每组最多3个治疗
        types: ['抗压型', '辅助型']
    },
    tank: {
        minPerGroup: 0,
        maxPerGroup: 2
    },
    dps: {
        minPerGroup: 3,
        maxPerGroup: 8
    },
    support: {
        minPerGroup: 0,
        maxPerGroup: 2
    }
};
```

### 设置治疗职业偏向

```javascript
// 设置特定职业的偏向
window.autoTeamSystem.setHealerBias('素问', '辅助型');
window.autoTeamSystem.setHealerBias('铁衣', '抗压型');
window.autoTeamSystem.setHealerBias('血河', '抗压型');
```

### 程序化执行分团

```javascript
// 获取玩家数据
const selectedGuild = dataSourceManager.selectedGuild;
const playerHistory = dataSourceManager.getGuildPlayerHistory(selectedGuild);
const players = [];

Object.keys(playerHistory).forEach(playerName => {
    const history = playerHistory[playerName];
    if (history.length > 0) {
        players.push(history[history.length - 1]);
    }
});

// 获取波动比数据
const fluctuations = guildDataBaseline.fluctuations;

// 执行自动分团
const result = window.autoTeamSystem.allocateTeams(players, fluctuations);

// 应用结果到UI
applyAllocationResult(result);
```

## 🐛 故障排除

### 问题：自动分团按钮没有出现

**解决方案**：
1. 检查浏览器控制台错误信息
2. 确认脚本文件路径正确
3. 确保在 `DOMContentLoaded` 后初始化
4. 查看Network标签确认脚本已加载

### 问题：CSV导入失败

**检查要点**：
1. 必须是标准CSV格式（逗号分隔）
2. 必须包含"游戏名"或"填表人"列
3. 文件编码应为UTF-8
4. 可以使用Excel"另存为CSV"功能

### 问题：成员池搜索不到玩家

**解决方案**：
1. 在成员池右上角勾选"显示所有帮会成员"
2. 确认玩家数据已正确导入
3. 检查是否已在其他组中分配

### 问题：一线牵未满足

**原因分析**：
1. 团队人数已满，无法调整
2. 职业约束限制
3. 战力平衡限制

**解决方案**：
1. 增加团队人数上限
2. 调整职业约束
3. 降低一线牵权重

## 📊 算法说明

### 评分体系

**综合得分** = 
  波动比得分 × 权重 +
  基础战力得分 × 权重 +
  团队平衡得分 × 权重 +
  一线牵满足度 × 权重

**每项范围**：0-100分

### 算法复杂度

| 算法 | 复杂度 | 适用场景 |
|------|--------|----------|
| 贪心算法 | O(n×m) | 快速分配 |
| 模拟退火 | O(k×n×m) | 中等规模 |
| 遗传算法 | O(p×g×n×m) | 大规模优化 |
| OR-Tools | O(n²×m) | 精确约束 |

- n: 玩家数量
- m: 组数量
- k: 迭代次数（约1000）
- p: 种群大小（50）
- g: 代数（100）

## 💾 数据存储

### LocalStorage结构

```javascript
// 配置存储
localStorage.setItem('teamConfig_配置名称', JSON.stringify({
    config: {...},
    timestamp: '2026-03-19T...'
}));

// 全局设置
localStorage.setItem('showAllGuildsInPool', 'true');
```

### 导出文件格式

**团队配置JSON**：
```json
{
  "teams": {
    "大团": [
      {
        "name": "大团_1",
        "limit": 12,
        "members": ["玩家A", "玩家B", ...]
      }
    ],
    "防守团": [...],
    "机动团": [...]
  },
  "timestamp": "2026-03-19T...",
  "totalPlayers": 96
}
```

## 🎮 实战建议

### 大型帮会（100+人）

**配置建议**：
- 大团组数：10-12组
- 启用所有算法
- 团队平衡权重：30%
- 重视职业搭配

### 中小型帮会（50-100人）

**配置建议**：
- 大团组数：6-8组
- 可禁用遗传算法（提升速度）
- 基础战力权重：30%
- 重视核心玩家分配

### 新手帮会（<50人）

**配置建议**：
- 标准组数：4-6组
- 只启用贪心+模拟退火
- 波动比权重：40%
- 手动调整为主

## 📈 更新日志

### v1.0.0 (2026-03-19)

**核心功能**：
- ✅ 4种智能分团算法
- ✅ 基础战力数据导入（装备/内功/打造）
- ✅ CSV批量导入（支持自动解析）
- ✅ 一线牵配对管理
- ✅ 配置管理（保存/加载/导出/导入）
- ✅ 成员池搜索修复
- ✅ 实时统计面板
- ✅ 团队结构自定义

**算法优化**：
- ✅ 多场数据波动比分析
- ✅ 基础战力系数计算
- ✅ 智能算法融合
- ✅ 自动最优选择

**UI集成**：
- ✅ 一键部署方案
- ✅ 可视化配置面板
- ✅ 数据预览功能
- ✅ 拖拽手动调整

## 📞 技术支持

### 快速诊断

1. **打开浏览器控制台**（F12）
2. **查看错误信息**
3. **检查Network标签**确认脚本加载
4. **查看Console标签**确认初始化日志

### 获取帮助

提供以下信息：
- 浏览器类型和版本
- 控制台错误截图
- 复现步骤
- 相关数据文件（脱敏后）

## ⚠️ 注意事项

1. **数据备份**：修改配置前建议导出备份
2. **浏览器兼容**：建议使用Chrome/Edge最新版
3. **文件路径**：确保脚本引用路径正确
4. **数据格式**：CSV文件需符合格式要求
5. **性能考虑**：大规模数据（200+人）可能需要优化参数

## 📄 许可证

本项目仅供个人学习使用，禁止商业用途。

## 🙏 致谢

- Chart.js - 统计图表
- Tailwind CSS - 样式框架
- Font Awesome - 图标
- Google OR-Tools - 约束规划算法参考

---

**版本**：v1.0.0  
**最后更新**：2026-03-19  
**作者**：Odinfreed

<details>
<summary>快速参考</summary>

### 快速命令

```javascript
// 执行自动分团
executeAutoTeamAllocation();

// 添加一线牵
window.autoTeamSystem.addYixianqianPair('玩家A', '玩家B', '击杀型', '资源型');

// 保存配置
window.autoTeamSystem.saveConfig('我的配置');

// 加载配置
window.autoTeamSystem.loadConfig('我的配置');

// 导出配置
const json = window.autoTeamSystem.exportAssignment();
```

### 文件结构

```
auto_team_system.js          - 核心算法
auto_team_ui.js              - UI集成
equipment_csv_importer.js    - CSV导入
setup_auto_team.js           - 部署脚本
complete_setup.html          - 部署指南
```

</details>
