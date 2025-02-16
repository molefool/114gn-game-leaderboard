// 加载网站信息
async function loadSiteInfo() {
    try {
        const response = await fetch('/api/site-info');
        const info = await response.json();
        
        // 更新页面标题和页脚
        document.querySelector('.header-content h1').textContent = info.header_text || '游戏榜单系统';
        document.getElementById('siteInfo').textContent = info.footer_text || '';
    } catch (error) {
        console.error('加载网站信息失败:', error);
    }
}

// 加载榜单数据
async function loadLeaderboards() {
    try {
        const response = await fetch('/api/leaderboards');
        const leaderboards = await response.json();
        
        // 生成标签页
        const tabsContainer = document.getElementById('leaderboardTabs');
        tabsContainer.innerHTML = leaderboards.map((board, index) => `
            <button class="tab ${index === 0 ? 'active' : ''}" 
                    data-tab="board-${board.id}">
                <span>${board.name}</span>
            </button>
        `).join('');

        // 生成内容区域
        const contentsContainer = document.getElementById('leaderboardContents');
        contentsContainer.innerHTML = leaderboards.map((board, index) => `
            <div id="board-${board.id}" class="tab-content ${index === 0 ? 'active' : ''}">
                ${board.games.map(game => `
                    <div class="leaderboard-item" data-theme="${board.theme}">
                        <div class="card-layout">
                            <div class="rank-badge">
                                #${game.rank}
                            </div>
                            <div class="game-image">
                                ${game.image_url ? 
                                    `<img src="${game.image_url}" alt="${game.name}" onerror="this.parentElement.innerHTML='<div class=\'placeholder-image\'><span class=\'material-icons\'>image</span></div>'">` :
                                    '<div class="placeholder-image"><span class="material-icons">image</span></div>'
                                }
                            </div>
                            <div class="card-content">
                                <div class="header">
                                    <div class="title-section">
                                        <h3>${game.name}</h3>
                                        <div class="review-date">发售日期：${new Date(game.release_date).toLocaleDateString('zh-CN')}</div>
                                    </div>
                                    <div class="rating">${game.rating}</div>
                                </div>

                                <div class="game-types">
                                    ${game.types.split(',').map(type => `
                                        <span class="type-tag">${type.trim()}</span>
                                    `).join('')}
                                </div>

                                <div class="content">${game.description}</div>

                                <div class="game-info">
                                    <div class="info-item">
                                        <span class="info-label">开发商：</span>
                                        <span class="info-value">${game.developer}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">发行商：</span>
                                        <span class="info-value">${game.publisher}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">售价：</span>
                                        <span class="info-value">￥${game.price}</span>
                                    </div>
                                </div>

                                <div class="languages">
                                    <span class="info-label">支持语言：</span>
                                    <div class="language-tags">
                                        ${game.languages.split(',').map(lang => `
                                            <span class="language-tag">${lang.trim()}</span>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');

        // 重新绑定标签页事件
        setupTabs();

        // 在生成标签页后添加：
        setTimeout(() => {
            document.querySelectorAll('.tab').forEach(tab => {
                checkOverflow(tab);
            });
        }, 100);  // 给一点时间让DOM完全渲染
    } catch (error) {
        console.error('加载榜单数据失败:', error);
    }
}

// 切换标签页
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 移除所有活动状态
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(content => {
                content.classList.remove('active');
            });

            // 添加新的活动状态
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// 检查文字是否溢出并添加相应类名
function checkOverflow(element) {
    const span = element.querySelector('span');
    if (span && span.scrollWidth > element.clientWidth) {
        element.classList.add('overflow');
    }
}

// 移除 additionalStyles 中的重复样式（因为已经在 style.css 中定义了）
const additionalStyles = ``;

// 添加样式到页面
const styleSheet = document.createElement("style");
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// 检查登录状态并更新按钮
async function checkLoginStatus() {
    try {
        const response = await fetch('/api/check-auth');
        const loginBtn = document.getElementById('adminLoginBtn');
        
        if (response.ok) {
            // 已登录，直接跳转到管理页面
            loginBtn.addEventListener('click', () => {
                window.location.href = '/admin.html';
            });
        } else {
            // 未登录，跳转到登录页面
            loginBtn.addEventListener('click', () => {
                window.location.href = '/login.html';
            });
        }
    } catch (error) {
        console.error('检查登录状态失败:', error);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    loadSiteInfo();
    loadLeaderboards();
    checkLoginStatus();  // 添加登录状态检查
}); 