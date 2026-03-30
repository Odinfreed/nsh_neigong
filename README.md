# 逆水寒 · 战斗分析系统
![逆水寒战斗分析系统](https://img.shields.io/badge/%E9%80%86%E6%B0%B4%E5%AF%92-%E6%88%98%E6%96%97%E5%88%86%E6%9E%90%E7%B3%BB%E7%BB%9F-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-v2.0.0-brightgreen?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-yellow?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Web-blueviolet?style=flat-square)

**专为《逆水寒》帮会打造的战斗数据智能分析与管理平台**
[功能介绍](#🎮-功能模块) • [快速开始](#🚀-快速开始) • [文档中心](#📖-文档中心) • [技术架构](#🛠️-技术架构) • [贡献指南](#🤝-贡献指南)
</div>

---

## 🎯 项目概述
逆水寒战斗分析系统是一个功能完整的Web应用，专为《逆水寒》游戏帮会管理设计。系统集成了**帮战数据分析**、**智能分团算法**、**内功评分计算**三大核心模块，提供从数据导入到智能决策的全流程解决方案。

### ✨ 核心特性
- **🚀 极速处理**：CSV数据秒级导入，多种智能算法快速计算
- **🧠 AI智能**：集成4种先进算法（贪心/模拟退火/遗传/OR-Tools），自动优化队伍配置
- **📊 数据可视化**：交互式图表展示，多维度数据分析
- **🔒 数据安全**：纯前端实现，本地存储，数据不上传
- **🎮 零依赖部署**：无需后端服务，浏览器打开即用
- **📱 响应式设计**：支持PC/平板/手机多端访问

---

## 🎮 功能模块
### 1️⃣ 帮战分析系统
**完整的数据分析平台，洞察战斗表现**
- 📥 **CSV数据导入**：支持帮战数据批量导入
- 📈 **多维度分析**：击败、伤害、治疗、资源等全方位统计
- 📊 **可视化图表**：趋势图、分布图、对比图等多种图表
- 🔍 **数据筛选**：按职业、日期、玩家等多条件筛选
- 💾 **数据持久化**：浏览器本地存储，自动保存历史记录
**👉 [启动帮战分析系统](https://odinfreed.github.io/nsh_tools/xg_nsh_battle_system/xg_data_import/index.html)**

### 2️⃣ 联赛智能分团系统
**AI驱动的智能分团管理，提升团队战力**
#### 🎯 核心功能
- **🤖 多算法融合**：4种智能算法自动选择最优方案
- **📋 接龙名单管理**：文本格式快速导入，智能解析
- **🔗 一线牵配对**：手动选择配对，自动成组分配
- **🏛️ 数据管理中心**：统一管理所有数据源
- **⚖️ 团队平衡**：职业、战力、数据侧重全面均衡

#### 🧮 智能算法
- **局部贪心算法**：快速初始分配，O(n×m)复杂度
- **模拟退火算法**：避免局部最优，全局优化
- **遗传算法**：进化计算，大规模问题求解
- **OR-Tools约束规划**：精确约束求解，满足各种规则

#### 📊 评分体系
```
综合得分 = 波动比得分×35% + 基础战力得分×25% + 
           团队平衡得分×25% + 一线牵满足度×15%
```
**👉 [启动智能分团系统](https://odinfreed.github.io/nsh_tools/xg_nsh_battle_system/xg_guild_analysis/xg_guild_analysis_backup.html)**

### 3️⃣ 内功评分计算器
**专业内功配置优化工具**
- 🧮 **智能计算**：基于五行属性自动计算内功评分
- 🤖 **自动组合**：一键生成最优内功搭配方案
- 🎯 **手动调整**：支持自定义组合，实时查看评分
- 📈 **属性分析**：金木水火土五行属性详细分析
- 💡 **优化建议**：提供内功升级和替换建议
**👉 [启动内功计算器](https://odinfreed.github.io/nsh_tools/xg_nsh_battle_system/sg_calculator/sg_calculator_main.html)**

---

## 🚀 快速开始
### 方式一：直接访问在线版（推荐）
无需下载，浏览器直接打开官方在线地址，开箱即用：
**[https://odinfreed.github.io/nsh_tools/](https://odinfreed.github.io/nsh_tools/)**

### 方式二：本地下载使用
1. 克隆项目到本地
```bash
git clone https://github.com/Odinfreed/nsh_tools.git
```
2. 进入项目根目录，双击 `index.html` 文件
3. 选择需要的系统模块直接使用

### 方式三：本地Web服务器部署
```bash
# 进入项目目录
cd nsh_tools
# 启动本地服务器
python -m http.server 8000
# 或使用node服务
npx http-server -p 8000
# 浏览器访问地址
http://localhost:8000
```

### 方式四：GitHub Pages二次部署
1. Fork本仓库：[https://github.com/Odinfreed/nsh_tools](https://github.com/Odinfreed/nsh_tools)
2. 进入仓库「Settings」→「Pages」
3. Source选择「Deploy from a branch」
4. Branch选择main分支，点击「Save」
5. 等待部署完成，访问个人GitHub Pages地址

---

## 📖 文档中心
### 📘 详细文档
| 文档名称 | 内容简介 | 链接 |
|---------|---------|------|
| 数据管理中心使用说明 | 接龙名单导入、一线牵配对、多数据源管理 | [查看文档](https://odinfreed.github.io/nsh_tools/xg_nsh_battle_system/README_数据管理中心.md) |
| 智能分团系统说明 | 4种算法介绍、CSV导入、配置管理 | [查看文档](https://odinfreed.github.io/nsh_tools/xg_nsh_battle_system/README_自动分团系统.md) |
| 系统部署指南 | 可视化部署步骤和故障排查 | [查看指南](https://odinfreed.github.io/nsh_tools/xg_nsh_battle_system/complete_setup.html) |

### 🎬 快速上手指南
#### 1. 智能分团（推荐新手）
**5分钟完成首次分团：**
```
① 准备CSV文件（装备内功数据）
    ↓
② 打开智能分团系统
    ↓
③ 导入CSV数据
    ↓
④ 配置团队结构（大团/防守团/机动团）
    ↓
⑤ 点击"自动分团"按钮
    ↓
⑥ 查看结果，手动微调
    ↓
⑦ 导出团队配置
```
**CSV文件格式示例：**
```csv
游戏名,主职业（主打职业）,武器类型,武器类等级,内功情况:金,内功情况:木,内功情况:水,内功情况:火,内功情况:土,打造情况,一线牵（对方id或无）
玩家A,碎梦,独珍,155,3,1,0,3,0,当赛季打造,玩家B
玩家B,素问,独珍,155,0,0,1,0,3,当赛季打造,玩家A
```

#### 2. 数据管理中心（进阶）
**完整数据管理流程：**
```
① 导入接龙名单（文本格式）
    ↓
② 一线牵手动配对（点击选择1,2成组）
    ↓
③ 导入帮战数据（CSV）
    ↓
④ 导入装备内功数据（CSV）
    ↓
⑤ 生成ID映射表（识别历史ID变更）
    ↓
⑥ 执行智能分团
    ↓
⑦ 导入手动编辑器继续调整
```
**接龙名单格式：**
```
1. 醉若曦 妙音 一线
2. 醉逍遥 惊鸿 一线
3. 醉清风 铁衣 无一线
```

---

## 🛠️ 技术架构
### 技术栈
- **前端基础**：HTML5 + CSS3 + 原生JavaScript（无框架依赖）
- **样式框架**：TailwindCSS + 自定义CSS
- **图表库**：Chart.js + Chartjs-plugin-datalabels
- **图标库**：Font Awesome 6
- **字体**：Orbitron + Exo 2
- **算法支持**：Google OR-Tools

### 项目结构
```
./
├── index.html                          # 系统主入口（在线版根页面）
├── README.md                           # 项目说明文档
└── xg_nsh_battle_system/               # 核心系统目录
    ├── xg_data_center.js               # 数据管理中心核心
    ├── xg_data_center_ui.js            # 数据中心UI
    ├── xg_data_integration.js          # 数据集成中心
    ├── auto_team_system.js             # 智能分团算法
    ├── auto_team_ui.js                 # 智能分团UI
    ├── equipment_csv_importer.js       # 装备CSV导入器
    ├── setup_auto_team.js              # 部署脚本
    ├── README_数据管理中心.md          # 数据中心文档
    ├── README_自动分团系统.md          # 智能分团文档
    ├── complete_setup.html             # 部署指南页面
    ├── xg_data_import/                 # 帮战数据导入模块
    │   └── index.html
    ├── xg_guild_analysis/              # 联赛分团分析模块
    │   ├── xg_guild_analysis_backup.html
    │   └── xg_guild_analysis_main.html
    ├── sg_calculator/                  # 内功计算器模块
    │   └── sg_calculator_main.html
    └── xg_libs/                        # 第三方库
        ├── chart.umd.min.js
        └── chartjs-plugin-datalabels.min.js
```

### 核心算法
#### 智能分团算法对比
| 算法 | 复杂度 | 适用场景 | 优点 | 缺点 |
|------|--------|----------|------|------|
| 贪心算法 | O(n×m) | 快速分配 | 速度快 | 可能局部最优 |
| 模拟退火 | O(k×n×m) | 中等规模 | 避免局部最优 | 参数敏感 |
| 遗传算法 | O(p×g×n×m) | 大规模优化 | 全局搜索 | 计算量大 |
| OR-Tools | O(n²×m) | 精确约束 | 精确求解 | 规模受限 |

#### 评分计算核心代码
```javascript
// 综合得分计算
const finalScore = 
    (fluctuationScore * 0.35) +      // 波动比权重
    (powerScore * 0.25) +            // 基础战力权重
    (balanceScore * 0.25) +          // 团队平衡权重
    (yixianqianScore * 0.15);        // 一线牵满足权重
```

---

## 📊 性能表现
### 处理速度测试
| 数据规模 | 贪心算法 | 模拟退火 | 遗传算法 | OR-Tools | 总耗时 |
|---------|---------|---------|---------|---------|-------|
| 50人×8组 | 0.2s | 1.5s | 3.2s | 0.8s | 5.7s |
| 100人×10组 | 0.5s | 3.1s | 8.5s | 2.1s | 14.2s |
| 150人×12组 | 0.9s | 5.8s | 16.3s | 4.5s | 27.5s |
**测试环境**：Chrome ≥122, Intel i7-12700H, 16GB RAM

---

## 🎮 实战建议
### 大型帮会（100+人）
**配置建议：**
- 大团组数：10-12组
- 启用所有算法
- 团队平衡权重：30%
- 重视职业搭配
**最佳实践：**
1. 先导入装备内功数据，确保战力数据准确
2. 设置一线牵配对，提升团队凝聚力
3. 运行智能分团，选择最优方案
4. 导出手动微调，根据实际情况调整

### 中小型帮会（50-100人）
**配置建议：**
- 大团组数：6-8组
- 禁用遗传算法（提升速度）
- 基础战力权重：30%
- 重视核心玩家分配
**最佳实践：**
1. 重点培养核心团队
2. 合理配置职业比例
3. 灵活调整团队结构
4. 手动调整为主，智能为辅

### 新手帮会（<50人）
**配置建议：**
- 标准组数：4-6组
- 只启用贪心+模拟退火
- 波动比权重：40%
- 手动调整为主
**最佳实践：**
1. 重视数据积累
2. 逐步完善成员信息
3. 培养核心指挥
4. 从简单配置开始

---

## 🔧 开发指南
### 本地开发
```bash
# 克隆仓库
git clone https://github.com/Odinfreed/nsh_tools.git
cd nsh_tools
# 安装依赖（如需）
npm install -g http-server
# 启动开发服务器
http-server -p 3000 -o
# 浏览器访问地址
http://localhost:3000
```

### 代码规范
- **变量命名**：采用小驼峰式（lowerCamelCase）
- **函数命名**：动词开头，表达清晰意图
- **注释规范**：JSDoc格式注释公共API
- **错误处理**：捕获异常，用户友好提示

### 扩展开发
**可扩展功能：**
1. 队伍配置模板（速攻型/防守型/平衡型）
2. 多帮会协同分团
3. 历史记录对比分析
4. 敌方配置分析
5. 移动端APP封装
**性能优化：**
1. Web Worker异步计算
2. 算法参数自适应调优
3. 增量更新机制
4. 虚拟滚动（大量数据）

---

## 🤝 贡献指南
欢迎提交Issue和Pull Request！

### 提交Issue
请包含以下信息：
- 问题描述（清晰具体）
- 复现步骤
- 期望结果
- 实际结果
- 浏览器环境
- 截图（如有）

### 提交PR
1. Fork本仓库：[https://github.com/Odinfreed/nsh_tools](https://github.com/Odinfreed/nsh_tools)
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

### 开发规范
- 遵循现有代码风格
- 添加必要的注释
- 更新相关文档
- 确保功能完整测试

---

## 📄 许可证
本项目采用 [MIT License](https://github.com/Odinfreed/nsh_tools/blob/main/LICENSE) 开源协议，协议内容详见项目根目录LICENSE文件。

## ⚖️ 版权声明
Copyright (c) 2026 Odinfreed
本项目由Odinfreed独立开发、整合与维护，所有原创代码、项目架构、文档设计及功能整合逻辑均受《中华人民共和国著作权法》保护，享有完整著作权。
本项目基于开源社区优秀资源进行二次开发与整合，第三方开源代码的著作权归原作者所有，本项目严格遵循各开源项目的协议条款进行使用与分发。

---

## 🙏 致谢
### 开源项目
- [Chart.js](https://www.chartjs.org/) - 数据可视化图表库
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的CSS框架
- [Font Awesome](https://fontawesome.com/) - 图标库
- [Google OR-Tools](https://developers.google.com/optimization) - 约束规划算法参考

### 技术参考
- 贪心算法理论
- 模拟退火优化算法
- 遗传算法进化计算
- 约束规划求解技术

感谢所有开源前辈的无私奉献，让站在巨人肩膀上的创作成为可能。

---

## 📞 联系方式
**技术支持和反馈**
- 💬 e-main:3135267085@qq.com
- 🌟 欢迎Star和Fork本项目！

---

<div align="center">
**⭐ 如果这个项目对你有帮助，请给个Star支持一下！**
<a href="https://github.com/Odinfreed/nsh_tools">
  <img src="https://img.shields.io/github/stars/Odinfreed/nsh_tools?style=social" alt="GitHub stars">
</a>
</div>

---

<div align="center">
**⚔️ 逆水寒战斗分析系统**<br>
专为帮会战打造的数据智能平台
<p>
  <a href="https://odinfreed.github.io/nsh_tools/xg_nsh_battle_system/">项目文档</a> •
  <a href="https://odinfreed.github.io/nsh_tools/">在线演示</a>
</p>
</div>
