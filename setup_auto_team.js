/**
 * 自动分团系统快速部署脚本
 * 在浏览器控制台中运行，一键集成所有功能
 */

(function() {
    console.log('=== 自动分团系统部署工具 ===');
    
    // 检查当前页面
    const currentPage = window.location.pathname;
    const isMainPage = currentPage.includes('xg_guild_analysis_main.html');
    const isBackupPage = currentPath.includes('xg_guild_analysis_backup.html');
    
    if (!isMainPage && !isBackupPage) {
        console.warn('请在 xg_guild_analysis_main.html 或 backup.html 页面中运行此脚本');
        return;
    }
    
    console.log('正在部署自动分团系统...');
    
    // 步骤1：加载auto_team_system.js
    function loadScript(url, callback) {
        const script = document.createElement('script');
        script.src = url;
        script.onload = callback;
        script.onerror = function() {
            console.error('加载失败：' + url);
        };
        document.head.appendChild(script);
    }
    
    // 步骤2：依次加载脚本
    loadScript('../auto_team_system.js', function() {
        console.log('✓ auto_team_system.js 加载成功');
        
        loadScript('../auto_team_ui.js', function() {
            console.log('✓ auto_team_ui.js 加载成功');
            
            // 步骤3：初始化UI
            setTimeout(() => {
                if (typeof initializeAutoTeamUI === 'function') {
                    initializeAutoTeamUI();
                    console.log('✓ 自动分团UI初始化完成');
                    
                    console.log('\n=== 部署成功！ ===');
                    console.log('可用功能：');
                    console.log('1. 自动分团按钮 - 执行智能分团');
                    console.log('2. 一线牵按钮 - 管理玩家配对');
                    console.log('3. 配置管理按钮 - 保存/加载配置');
                    console.log('4. 基础战力导入 - 导入装备/内功/打造数据');
                    console.log('5. 成员池修复 - 显示所有帮会成员选项');
                    
                    alert('自动分团系统部署成功！\n请查看控制台了解更多信息。');
                } else {
                    console.error('初始化函数未找到');
                }
            }, 500);
        });
    });
    
})();

// 使用说明：
// 1. 打开 xg_guild_analysis_main.html 或 backup.html
// 2. 按 F12 打开开发者工具
// 3. 切换到 Console 标签页
// 4. 复制本文件全部内容并粘贴到控制台
// 5. 按 Enter 键执行
// 6. 等待部署完成

console.log('部署脚本已加载，请在控制台中运行 setup_auto_team() 开始部署');
