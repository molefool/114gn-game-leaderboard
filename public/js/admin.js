// 检查登录状态
async function checkAuth() {
    try {
        const response = await fetch('/api/check-auth');
        if (!response.ok) {
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login.html';
    }
}

// 游戏管理相关变量
let currentGameId = null;
const gameModal = document.getElementById('gameModal');
const gameForm = document.getElementById('gameForm');
const addGameBtn = document.getElementById('addGameBtn');

// 状态控制函数
function showLoading() {
    document.getElementById('loadingIndicator').classList.add('show');
}

function hideLoading() {
    document.getElementById('loadingIndicator').classList.remove('show');
}

function showError(message) {
    const errorIndicator = document.getElementById('errorIndicator');
    document.getElementById('errorMessage').textContent = message;
    errorIndicator.classList.add('show');
    setTimeout(() => {
        errorIndicator.classList.remove('show');
    }, 3000);
}

// 加载游戏列表
async function loadGames() {
    try {
        showLoading();
        const response = await fetch('/api/games');
        const games = await response.json();
        const gamesList = document.getElementById('gamesList');
        
        if (games.length === 0) {
            const template = document.getElementById('emptyState');
            gamesList.innerHTML = template.innerHTML;
            return;
        }

        gamesList.innerHTML = games.map(game => `
            <div class="data-item">
                <div class="game-list-item">
                    <div class="game-image">
                        ${game.image_url ? 
                            `<img src="${game.image_url}" alt="${game.name}" onerror="this.parentElement.innerHTML='<div class=\'placeholder-image\'><span class=\'material-icons\'>image</span></div>'">` :
                            '<div class="placeholder-image"><span class="material-icons">image</span></div>'
                        }
                    </div>
                    <div class="game-info">
                        <h3>${game.name}</h3>
                        <div class="game-meta-info">
                            <span>
                                <span class="material-icons">star</span>
                                ${game.rating || '暂无评分'}
                            </span>
                            <span>
                                <span class="material-icons">paid</span>
                                ￥${game.price}
                            </span>
                            <span>
                                <span class="material-icons">calendar_today</span>
                                ${new Date(game.release_date).toLocaleDateString('zh-CN')}
                            </span>
                        </div>
                        <p class="description">${game.description || '暂无描述'}</p>
                        <div class="game-meta-info">
                            <span>开发商：${game.developer || '未知'}</span>
                            <span>发行商：${game.publisher || '未知'}</span>
                        </div>
                        <div class="game-tags">
                            ${(game.types || '').split(',').map(type => 
                                `<span class="game-tag">${type.trim()}</span>`
                            ).join('')}
                        </div>
                    </div>
                    <div class="data-item-actions">
                        <button onclick="editGame(${game.id})" class="edit-btn">
                            <span class="material-icons">edit</span>
                            编辑
                        </button>
                        <button onclick="deleteGame(${game.id})" class="delete-btn">
                            <span class="material-icons">delete</span>
                            删除
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('获取游戏列表失败:', error);
        showError('获取游戏列表失败');
    } finally {
        hideLoading();
    }
}

// 加载榜单列表
async function loadLeaderboards() {
    try {
        const response = await fetch('/api/leaderboards');
        const leaderboards = await response.json();
        const leaderboardsList = document.getElementById('leaderboardsList');
        
        leaderboardsList.innerHTML = leaderboards.map(board => `
            <div class="leaderboard-card">
                <div class="leaderboard-header">
                    <div class="leaderboard-info">
                        <h3>${board.name}</h3>
                        <div class="leaderboard-theme ${board.theme}">
                            ${board.theme === 'red' ? '红榜' : '黑榜'}
                        </div>
                    </div>
                    <div class="data-item-actions">
                        <button onclick="editLeaderboard(${board.id})" class="edit-btn">
                            <span class="material-icons">edit</span>
                            编辑
                        </button>
                        <button onclick="deleteLeaderboard(${board.id})" class="delete-btn">
                            <span class="material-icons">delete</span>
                            删除
                        </button>
                    </div>
                </div>
                <div class="leaderboard-description">${board.description || ''}</div>
                <div class="leaderboard-status">
                    <span class="status-indicator ${board.is_active ? '' : 'inactive'}"></span>
                    ${board.is_active ? '已上线' : '已下线'}
                </div>
                <div class="games-list">
                    ${board.games.map(game => `
                        <div class="game-item">
                            <div class="game-rank">#${game.rank}</div>
                            <div class="game-image">
                                ${game.image_url ? 
                                    `<img src="${game.image_url}" alt="${game.name}" onerror="this.parentElement.innerHTML='<div class=\'placeholder-image\'><span class=\'material-icons\'>image</span></div>'">` :
                                    '<div class="placeholder-image"><span class="material-icons">image</span></div>'
                                }
                            </div>
                            <div class="game-info">
                                <h4>${game.name}</h4>
                                <div class="game-description">${game.description || ''}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载榜单列表失败:', error);
        showToast('加载榜单列表失败', 'error');
    }
}

// 加载网站信息
async function loadSiteInfo() {
    try {
        const response = await fetch('/api/site-info');
        const info = await response.json();
        
        // 填充表单
        document.getElementById('headerText').value = info.header_text || '';
        document.getElementById('footerText').value = info.footer_text || '';
    } catch (error) {
        console.error('加载网站信息失败:', error);
    }
}

// 设置标签页切换
function setupTabs() {
    const tabs = document.querySelectorAll('.nav-item');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// 添加登出功能
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('登出失败:', error);
    }
});

// 添加 Toast 提示函数
function showToast(message, type = 'success') {
    // 移除现有的 toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // 创建新的 toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = document.createElement('span');
    icon.className = 'toast-icon material-icons';
    icon.textContent = type === 'success' ? 'check_circle' : 'error';
    
    const text = document.createElement('span');
    text.className = 'toast-text';
    text.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(text);
    document.body.appendChild(toast);

    // 显示动画
    setTimeout(() => toast.classList.add('show'), 10);

    // 自动关闭
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 修改网站信息保存处理
document.getElementById('siteInfoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const headerText = document.getElementById('headerText').value;
    const footerText = document.getElementById('footerText').value;
    
    try {
        const response = await fetch('/api/site-info', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                header_text: headerText,
                footer_text: footerText
            })
        });

        if (response.ok) {
            showToast('网站信息更新成功');
            // 更新页面标题
            document.querySelector('.header-content h1').textContent = headerText;
        } else {
            showToast('更新失败，请重试', 'error');
        }
    } catch (error) {
        console.error('保存网站信息失败:', error);
        showToast('保存失败，请检查网络连接', 'error');
    }
});

// 打开添加游戏模态框
addGameBtn.addEventListener('click', () => {
    currentGameId = null;
    gameForm.reset();
    gameModal.style.display = 'block';
    document.querySelector('#gameModal h2').textContent = '添加游戏';
});

// 关闭模态框
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        if (modal) {
            modal.style.display = 'none';
            // 如果是添加游戏模态框，重置表单
            if (modal.id === 'addGameModal') {
                document.getElementById('addGameForm').reset();
            }
        }
    });
});

// 添加 ESC 键关闭模态框
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
});

// 修改 Chips 输入处理函数
function setupChipsInput(inputId, chipsId, hiddenInputId) {
    const input = document.getElementById(inputId);
    const chipsContainer = document.getElementById(chipsId);
    const hiddenInput = document.getElementById(hiddenInputId);

    function updateHiddenInput() {
        const chips = Array.from(chipsContainer.children)
            .map(chip => {
                // 只获取文本节点的内容，排除 close 按钮的文本
                const textContent = Array.from(chip.childNodes)
                    .filter(node => node.nodeType === Node.TEXT_NODE)
                    .map(node => node.textContent.trim())
                    .join('');
                return textContent;
            })
            .filter(text => text);
        hiddenInput.value = chips.join(',');
    }

    function addChip(text) {
        const chip = document.createElement('div');
        chip.className = 'chip';
        
        // 分开创建文本节点和按钮
        const textNode = document.createTextNode(text);
        const closeButton = document.createElement('span');
        closeButton.className = 'material-icons remove-chip';
        closeButton.textContent = 'close';
        
        chip.appendChild(textNode);
        chip.appendChild(closeButton);
        
        closeButton.addEventListener('click', () => {
            chip.remove();
            updateHiddenInput();
        });
        
        chipsContainer.appendChild(chip);
        updateHiddenInput();
    }

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const text = input.value.trim();
            if (text) {
                addChip(text);
                input.value = '';
            }
        }
    });

    return {
        setChips: (values) => {
            chipsContainer.innerHTML = '';
            if (values) {
                values.split(',').forEach(value => {
                    if (value.trim()) addChip(value.trim());
                });
            }
        }
    };
}

// 初始化 Chips 输入
const typesChips = setupChipsInput('gameTypesInput', 'gameTypesChips', 'gameTypes');
const languagesChips = setupChipsInput('gameLanguagesInput', 'gameLanguagesChips', 'gameLanguages');

// 修改编辑游戏功能
async function editGame(id) {
    try {
        const response = await fetch(`/api/games/${id}`);
        const game = await response.json();
        
        currentGameId = id;
        document.querySelector('#gameModal h2').textContent = '编辑游戏';
        
        // 填充表单
        document.getElementById('gameName').value = game.name || '';
        document.getElementById('gameDescription').value = game.description || '';
        document.getElementById('gameRating').value = game.rating || '';
        document.getElementById('gamePrice').value = game.price || '';
        document.getElementById('gameReleaseDate').value = game.release_date || '';
        document.getElementById('gameDeveloper').value = game.developer || '';
        document.getElementById('gamePublisher').value = game.publisher || '';
        document.getElementById('gameImage').value = game.image_url || '';
        
        // 设置 Chips
        typesChips.setChips(game.types || '');
        languagesChips.setChips(game.languages || '');
        
        gameModal.style.display = 'block';
    } catch (error) {
        console.error('加载游戏信息失败:', error);
        showToast('加载游戏信息失败', 'error');
    }
}

// 删除游戏
async function deleteGame(id) {
    const confirmDialog = document.getElementById('confirmDialog');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    
    // 显示确认对话框
    confirmDialog.style.display = 'block';
    
    // 处理删除确认
    const handleDelete = async () => {
        try {
            const response = await fetch(`/api/games/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showToast('游戏删除成功');
                loadGames();
            } else {
                showToast('删除失败，请重试', 'error');
            }
        } catch (error) {
            console.error('删除游戏失败:', error);
            showToast('删除游戏失败', 'error');
        } finally {
            confirmDialog.style.display = 'none';
            confirmDeleteBtn.removeEventListener('click', handleDelete);
        }
    };
    
    confirmDeleteBtn.addEventListener('click', handleDelete);
}

// 处理游戏表单提交
gameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('gameName').value,
        description: document.getElementById('gameDescription').value,
        rating: parseFloat(document.getElementById('gameRating').value),
        price: parseFloat(document.getElementById('gamePrice').value),
        release_date: document.getElementById('gameReleaseDate').value,
        developer: document.getElementById('gameDeveloper').value,
        publisher: document.getElementById('gamePublisher').value,
        types: document.getElementById('gameTypes').value,
        languages: document.getElementById('gameLanguages').value,
        image_url: document.getElementById('gameImage').value || ''
    };
    
    try {
        const url = currentGameId ? 
            `/api/games/${currentGameId}` : '/api/games';
        const method = currentGameId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showToast(`游戏${currentGameId ? '更新' : '添加'}成功`);
            gameModal.style.display = 'none';
            await loadGames(); // 确保等待游戏列表重新加载
        } else {
            const error = await response.json();
            showToast(error.error || '操作失败，请重试', 'error');
        }
    } catch (error) {
        console.error('保存游戏失败:', error);
        showToast('保存失败，请检查网络连接', 'error');
    }
});

// 榜单管理相关变量
let currentLeaderboardId = null;
let currentLeaderboardGames = [];
const leaderboardModal = document.getElementById('leaderboardModal');
const addGameModal = document.getElementById('addGameModal');
const leaderboardForm = document.getElementById('leaderboardForm');
const addGameForm = document.getElementById('addGameForm');
const addLeaderboardBtn = document.getElementById('addLeaderboardBtn');

// 打开添加榜单模态框
addLeaderboardBtn.addEventListener('click', () => {
    currentLeaderboardId = null;
    currentLeaderboardGames = [];
    leaderboardForm.reset();
    document.querySelector('#leaderboardModal h2').textContent = '添加榜单';
    updateGamesList();
    leaderboardModal.style.display = 'block';
});

// 更新游戏列表显示
function updateGamesList() {
    const gamesList = document.getElementById('leaderboardGames');
    gamesList.innerHTML = currentLeaderboardGames.map(game => `
        <div class="game-item">
            <div class="game-rank">#${game.rank}</div>
            <div class="game-image">
                ${game.image_url ? 
                    `<img src="${game.image_url}" alt="${game.name}">` :
                    '<div class="placeholder-image"><span class="material-icons">image</span></div>'
                }
            </div>
            <div class="game-info">
                <h4>${game.name}</h4>
                <div class="game-description">${game.description || ''}</div>
            </div>
            <button type="button" onclick="removeGameFromLeaderboard(${game.game_id})" class="delete-btn">
                <span class="material-icons">remove_circle</span>
            </button>
        </div>
    `).join('');
}

// 初始化游戏选择下拉框
async function initGameSelect() {
    try {
        const response = await fetch('/api/games');
        const games = await response.json();
        const gameSelect = document.getElementById('selectGame');
        
        gameSelect.innerHTML = games.map(game => 
            `<option value="${game.id}" data-image="${game.image_url || ''}">${game.name}</option>`
        ).join('');
    } catch (error) {
        console.error('加载游戏列表失败:', error);
        showToast('加载游戏列表失败', 'error');
    }
}

// 处理榜单表单提交
leaderboardForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (currentLeaderboardGames.length === 0) {
        showToast('请至少添加一个游戏到榜单', 'error');
        return;
    }
    
    const formData = {
        name: document.getElementById('leaderboardName').value,
        description: document.getElementById('leaderboardDescription').value,
        theme: document.getElementById('leaderboardTheme').value,
        is_active: document.getElementById('leaderboardActive').checked,
        games: currentLeaderboardGames
    };
    
    try {
        const url = currentLeaderboardId ? 
            `/api/leaderboards/${currentLeaderboardId}` : '/api/leaderboards';
        const method = currentLeaderboardId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showToast(`榜单${currentLeaderboardId ? '更新' : '添加'}成功`);
            leaderboardModal.style.display = 'none';
            await loadLeaderboards();
        } else {
            const error = await response.json();
            showToast(error.error || '操作失败，请重试', 'error');
        }
    } catch (error) {
        console.error('保存榜单失败:', error);
        showToast('保存失败，请检查网络连接', 'error');
    }
});

// 编辑榜单
async function editLeaderboard(id) {
    try {
        const response = await fetch(`/api/leaderboards/${id}`);
        const leaderboard = await response.json();
        
        currentLeaderboardId = id;
        currentLeaderboardGames = leaderboard.games;
        
        document.querySelector('#leaderboardModal h2').textContent = '编辑榜单';
        document.getElementById('leaderboardName').value = leaderboard.name;
        document.getElementById('leaderboardDescription').value = leaderboard.description || '';
        document.getElementById('leaderboardTheme').value = leaderboard.theme;
        document.getElementById('leaderboardActive').checked = leaderboard.is_active;
        
        updateGamesList();
        leaderboardModal.style.display = 'block';
    } catch (error) {
        console.error('加载榜单详情失败:', error);
        showToast('加载榜单详情失败', 'error');
    }
}

// 删除榜单
async function deleteLeaderboard(id) {
    const confirmDialog = document.getElementById('confirmDialog');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    
    // 显示确认对话框
    confirmDialog.style.display = 'block';
    
    // 处理删除确认
    const handleDelete = async () => {
        try {
            const response = await fetch(`/api/leaderboards/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showToast('榜单删除成功');
                await loadLeaderboards();
            } else {
                showToast('删除失败，请重试', 'error');
            }
        } catch (error) {
            console.error('删除榜单失败:', error);
            showToast('删除失败，请检查网络连接', 'error');
        } finally {
            confirmDialog.style.display = 'none';
            confirmDeleteBtn.removeEventListener('click', handleDelete);
        }
    };
    
    confirmDeleteBtn.addEventListener('click', handleDelete);
}

// 打开添加游戏模态框
document.getElementById('addGameToLeaderboard').addEventListener('click', () => {
    addGameForm.reset();
    document.getElementById('gameRank').value = currentLeaderboardGames.length + 1;
    addGameModal.style.display = 'block';
});

// 处理添加游戏表单提交
addGameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const gameSelect = document.getElementById('selectGame');
    const selectedOption = gameSelect.options[gameSelect.selectedIndex];
    const gameId = parseInt(gameSelect.value);
    
    // 检查游戏是否已在榜单中
    if (currentLeaderboardGames.some(g => g.game_id === gameId)) {
        showToast('该游戏已在榜单中', 'error');
        return;
    }

    // 获取游戏详细信息
    try {
        const response = await fetch(`/api/games/${gameId}`);
        const gameData = await response.json();
        
        const newGame = {
            game_id: gameId,
            id: gameId,
            name: gameData.name,
            description: gameData.description,
            image_url: gameData.image_url,
            rating: gameData.rating,
            release_date: gameData.release_date,
            price: gameData.price,
            developer: gameData.developer,
            publisher: gameData.publisher,
            types: gameData.types,
            languages: gameData.languages,
            rank: parseInt(document.getElementById('gameRank').value)
        };
        
        // 检查排名是否已存在
        if (currentLeaderboardGames.some(g => g.rank === newGame.rank)) {
            showToast('该排名已被占用', 'error');
            return;
        }
        
        currentLeaderboardGames.push(newGame);
        currentLeaderboardGames.sort((a, b) => a.rank - b.rank);
        updateGamesList();
        addGameModal.style.display = 'none';
    } catch (error) {
        console.error('获取游戏信息失败:', error);
        showToast('获取游戏信息失败', 'error');
    }
});

// 从榜单中移除游戏
function removeGameFromLeaderboard(gameId) {
    currentLeaderboardGames = currentLeaderboardGames.filter(g => g.game_id !== gameId);
    updateGamesList();
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupTabs();
    loadGames();
    loadLeaderboards();
    loadSiteInfo();
    initGameSelect();
}); 