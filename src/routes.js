const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('./database');

// 管理员登录
router.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'root' && password === 'root') {
        req.session.userId = 1;  // 简单起见，直接设置 userId
        res.json({ message: '登录成功' });
    } else {
        res.status(401).json({ error: '用户名或密码错误' });
    }
});

// 检查认证状态
router.get('/api/check-auth', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: '未登录' });
    }
    res.json({ status: 'ok' });
});

// 获取所有游戏
router.get('/api/games', (req, res) => {
    db.all('SELECT * FROM games ORDER BY created_at DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: '服务器错误' });
        res.json(rows);
    });
});

// 获取所有榜单列表（包含游戏信息）
router.get('/api/leaderboards', (req, res) => {
    // 先获取所有榜单
    db.all(`
        SELECT * FROM leaderboards
        WHERE is_active = 1
        ORDER BY created_at DESC
    `, (err, leaderboards) => {
        if (err) {
            console.error('获取榜单列表失败:', err);
            return res.status(500).json({ error: '服务器错误' });
        }

        // 如果没有榜单，直接返回空数组
        if (leaderboards.length === 0) {
            return res.json([]);
        }

        // 为每个榜单获取关联的游戏
        let completed = 0;
        leaderboards.forEach(board => {
            db.all(`
                SELECT lg.rank, 
                       g.id as game_id,
                       g.name,
                       g.description,
                       g.image_url,
                       g.rating,
                       g.release_date,
                       g.price,
                       g.developer,
                       g.publisher,
                       g.types,
                       g.languages
                FROM leaderboard_games lg
                JOIN games g ON lg.game_id = g.id
                WHERE lg.leaderboard_id = ?
                ORDER BY lg.rank ASC
            `, [board.id], (err, games) => {
                if (err) {
                    console.error('获取榜单游戏失败:', err);
                    return res.status(500).json({ error: '服务器错误' });
                }

                // 添加游戏到榜单对象
                board.games = games;
                completed++;
                if (completed === leaderboards.length) {
                    res.json(leaderboards);
                }
            });
        });
    });
});

// 获取单个游戏
router.get('/api/games/:id', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: '未登录' });
    
    db.get('SELECT * FROM games WHERE id = ?', [req.params.id], (err, game) => {
        if (err) return res.status(500).json({ error: '服务器错误' });
        if (!game) return res.status(404).json({ error: '游戏不存在' });
        res.json(game);
    });
});

// 添加游戏
router.post('/api/games', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: '未登录' });
    
    const { name, description, rating, release_date, price, developer, publisher, types, languages, image_url } = req.body;
    db.run(`
        INSERT INTO games (
            name, description, rating, release_date, price, 
            developer, publisher, types, languages, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, description, rating, release_date, price, developer, publisher, types, languages, image_url],
    function(err) {
        if (err) {
            console.error('添加游戏失败:', err);
            return res.status(500).json({ error: '服务器错误' });
        }
        res.json({ id: this.lastID, ...req.body });
    });
});

// 更新游戏
router.put('/api/games/:id', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: '未登录' });
    
    const { name, description, rating, release_date, price, developer, publisher, types, languages, image_url } = req.body;
    db.run(`
        UPDATE games 
        SET name = ?, 
            description = ?, 
            rating = ?, 
            release_date = ?, 
            price = ?, 
            developer = ?, 
            publisher = ?, 
            types = ?, 
            languages = ?,
            image_url = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [name, description, rating, release_date, price, developer, publisher, types, languages, image_url, req.params.id],
    function(err) {
        if (err) {
            console.error('更新游戏失败:', err);
            return res.status(500).json({ error: '服务器错误' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: '游戏不存在' });
        }
        res.json({ id: req.params.id, ...req.body });
    });
});

// 删除游戏
router.delete('/api/games/:id', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: '未登录' });
    
    db.run('DELETE FROM games WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: '服务器错误' });
        res.json({ message: '删除成功' });
    });
});

// 获取单个榜单详情
router.get('/api/leaderboards/:id', (req, res) => {
    // 先获取榜单信息
    db.get('SELECT * FROM leaderboards WHERE id = ?', [req.params.id], (err, leaderboard) => {
        if (err) {
            console.error('获取榜单失败:', err);
            return res.status(500).json({ error: '服务器错误' });
        }
        if (!leaderboard) {
            return res.status(404).json({ error: '榜单不存在' });
        }

        // 获取榜单关联的游戏
        db.all(`
            SELECT lg.*, g.*
            FROM leaderboard_games lg
            JOIN games g ON lg.game_id = g.id
            WHERE lg.leaderboard_id = ?
            ORDER BY lg.rank ASC
        `, [leaderboard.id], (err, games) => {
            if (err) {
                console.error('获取榜单游戏失败:', err);
                return res.status(500).json({ error: '服务器错误' });
            }

            leaderboard.games = games.map(game => ({
                id: game.game_id,
                game_id: game.game_id,
                name: game.name,
                image_url: game.image_url,
                rating: game.rating,
                release_date: game.release_date,
                price: game.price,
                developer: game.developer,
                publisher: game.publisher,
                types: game.types,
                languages: game.languages,
                rank: game.rank,
                comment: game.comment
            }));

            res.json(leaderboard);
        });
    });
});

// 管理接口：添加榜单
router.post('/api/leaderboards', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: '未登录' });
    
    const { name, description, theme, games } = req.body;
    
    db.run(`
        INSERT INTO leaderboards (name, description, theme)
        VALUES (?, ?, ?)
    `, [name, description, theme],
    function(err) {
        if (err) {
            console.error('添加榜单失败:', err);
            return res.status(500).json({ error: '服务器错误' });
        }
        
        const leaderboardId = this.lastID;
        let completed = 0;
        
        // 插入榜单游戏关联
        games.forEach(game => {
            db.run(`
                INSERT INTO leaderboard_games (leaderboard_id, game_id, rank)
                VALUES (?, ?, ?)
            `, [leaderboardId, game.game_id, game.rank],
            (err) => {
                if (err) {
                    console.error('添加榜单游戏关联失败:', err);
                    return res.status(500).json({ error: '服务器错误' });
                }
                completed++;
                if (completed === games.length) {
                    res.json({ id: leaderboardId, ...req.body });
                }
            });
        });
    });
});

// 管理接口：更新榜单
router.put('/api/leaderboards/:id', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: '未登录' });
    
    const { name, description, theme, is_active, games } = req.body;
    
    db.run(`
        UPDATE leaderboards 
        SET name = ?, description = ?, theme = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [name, description, theme, is_active, req.params.id],
    function(err) {
        if (err) {
            console.error('更新榜单失败:', err);
            return res.status(500).json({ error: '服务器错误' });
        }
        
        // 删除原有的游戏关联
        db.run('DELETE FROM leaderboard_games WHERE leaderboard_id = ?', [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: '服务器错误' });
            
            let completed = 0;
            // 插入新的游戏关联
            games.forEach(game => {
                db.run(`
                    INSERT INTO leaderboard_games (leaderboard_id, game_id, rank)
                    VALUES (?, ?, ?)
                `, [req.params.id, game.game_id, game.rank],
                (err) => {
                    if (err) {
                        console.error('更新榜单游戏关联失败:', err);
                        return res.status(500).json({ error: '服务器错误' });
                    }
                    completed++;
                    if (completed === games.length) {
                        res.json({ id: req.params.id, ...req.body });
                    }
                });
            });
        });
    });
});

// 管理接口：删除榜单
router.delete('/api/leaderboards/:id', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: '未登录' });
    
    // 先删除关联的游戏
    db.run('DELETE FROM leaderboard_games WHERE leaderboard_id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: '服务器错误' });
        
        // 再删除榜单
        db.run('DELETE FROM leaderboards WHERE id = ?', [req.params.id], 
        function(err) {
            if (err) {
                console.error('删除榜单失败:', err);
                return res.status(500).json({ error: '服务器错误' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: '榜单不存在' });
            }
            res.json({ message: '删除成功' });
        });
    });
});

// 获取网站信息
router.get('/api/site-info', (req, res) => {
    db.get('SELECT * FROM site_info WHERE id = 1', (err, info) => {
        if (err) {
            console.error('获取网站信息失败:', err);
            return res.status(500).json({ error: '服务器错误' });
        }
        res.json(info || {});
    });
});

// 更新网站信息
router.put('/api/site-info', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: '未登录' });
    }

    const { header_text, footer_text, default_leaderboard } = req.body;

    // 先检查榜单是否存在
    db.get('SELECT id FROM leaderboards WHERE id = ?', [default_leaderboard], (err, row) => {
        if (err) {
            console.error('检查榜单失败:', err);
            return res.status(500).json({ error: '服务器错误' });
        }
        
        if (!row) {
            return res.status(400).json({ error: '选择的榜单不存在' });
        }

        // 更新网站信息
        db.run(`
            UPDATE site_info 
            SET header_text = ?,
                footer_text = ?,
                default_leaderboard = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        `, [header_text, footer_text, default_leaderboard], function(err) {
            if (err) {
                console.error('更新网站信息失败:', err);
                return res.status(500).json({ error: '服务器错误' });
            }

            if (this.changes === 0) {
                // 如果没有更新任何行，说明需要插入
                db.run(`
                    INSERT INTO site_info (id, header_text, footer_text, default_leaderboard)
                    VALUES (1, ?, ?, ?)
                `, [header_text, footer_text, default_leaderboard], function(err) {
                    if (err) {
                        console.error('插入网站信息失败:', err);
                        return res.status(500).json({ error: '服务器错误' });
                    }
                    res.json({
                        id: 1,
                        header_text,
                        footer_text,
                        default_leaderboard
                    });
                });
            } else {
                res.json({
                    id: 1,
                    header_text,
                    footer_text,
                    default_leaderboard
                });
            }
        });
    });
});

// 添加登出路由
router.post('/api/logout', (req, res) => {
    req.session = null;
    res.json({ message: '登出成功' });
});

// 获取所有榜单类型
router.get('/api/leaderboard-types', (req, res) => {
    db.all('SELECT * FROM leaderboard_types ORDER BY sort_order', (err, types) => {
        if (err) return res.status(500).json({ error: '服务器错误' });
        res.json(types);
    });
});

// 获取指定类型的榜单列表
router.get('/api/leaderboards/:code', (req, res) => {
    db.all(`
        SELECT e.*, 
               t.name as type_name,
               t.code as type_code,
               t.color as type_color,
               g.name as game_name,
               g.release_date,
               g.price,
               g.developer,
               g.publisher,
               g.types,
               g.languages,
               g.image_url,
               g.description
        FROM leaderboard_entries e
        JOIN leaderboard_types t ON e.type_id = t.id
        JOIN games g ON e.game_id = g.id 
        WHERE t.code = ?
        ORDER BY e.rank ASC
    `, [req.params.code], (err, entries) => {
        if (err) return res.status(500).json({ error: '服务器错误' });
        res.json(entries);
    });
});

// 管理接口：添加榜单类型
router.post('/api/leaderboard-types', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: '未登录' });
    
    const { name, code, description, color, sort_order } = req.body;
    db.run(`
        INSERT INTO leaderboard_types (name, code, description, color, sort_order)
        VALUES (?, ?, ?, ?, ?)
    `, [name, code, description, color, sort_order],
    function(err) {
        if (err) {
            console.error('添加榜单类型失败:', err);
            return res.status(500).json({ error: '服务器错误' });
        }
        res.json({ id: this.lastID, ...req.body });
    });
});

// 管理接口：更新榜单类型
router.put('/api/leaderboard-types/:id', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: '未登录' });
    
    const { name, description, color, sort_order } = req.body;
    db.run(`
        UPDATE leaderboard_types 
        SET name = ?, description = ?, color = ?, sort_order = ?
        WHERE id = ?
    `, [name, description, color, sort_order, req.params.id],
    function(err) {
        if (err) {
            console.error('更新榜单类型失败:', err);
            return res.status(500).json({ error: '服务器错误' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: '榜单类型不存在' });
        }
        res.json({ id: req.params.id, ...req.body });
    });
});

// 管理接口：添加榜单条目
router.post('/api/leaderboard-entries', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: '未登录' });
    
    const { type_id, game_id, rank, title, content, rating, review_date } = req.body;
    
    // 检查排名是否已存在
    db.get('SELECT id FROM leaderboard_entries WHERE type_id = ? AND rank = ?', 
        [type_id, rank],
        (err, existing) => {
            if (err) return res.status(500).json({ error: '服务器错误' });
            if (existing) return res.status(400).json({ error: '该排名已被占用' });
            
            db.run(`
                INSERT INTO leaderboard_entries 
                (type_id, game_id, rank, title, content, rating, review_date)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [type_id, game_id, rank, title, content, rating, review_date],
            function(err) {
                if (err) {
                    console.error('添加榜单条目失败:', err);
                    return res.status(500).json({ error: '服务器错误' });
                }
                res.json({ id: this.lastID, ...req.body });
            });
        }
    );
});

// 管理接口：更新榜单条目
router.put('/api/leaderboard-entries/:id', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: '未登录' });
    
    const { type_id, game_id, rank, title, content, rating, review_date } = req.body;
    
    // 检查新排名是否与其他条目冲突
    db.get('SELECT id FROM leaderboard_entries WHERE type_id = ? AND rank = ? AND id != ?', 
        [type_id, rank, req.params.id],
        (err, existing) => {
            if (err) return res.status(500).json({ error: '服务器错误' });
            if (existing) return res.status(400).json({ error: '该排名已被占用' });
            
            db.run(`
                UPDATE leaderboard_entries 
                SET type_id = ?, game_id = ?, rank = ?, title = ?, 
                    content = ?, rating = ?, review_date = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [type_id, game_id, rank, title, content, rating, review_date, req.params.id],
            function(err) {
                if (err) {
                    console.error('更新榜单条目失败:', err);
                    return res.status(500).json({ error: '服务器错误' });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ error: '榜单条目不存在' });
                }
                res.json({ id: req.params.id, ...req.body });
            });
        }
    );
});

// 管理接口：删除榜单条目
router.delete('/api/leaderboard-entries/:id', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: '未登录' });
    
    db.run('DELETE FROM leaderboard_entries WHERE id = ?', [req.params.id], 
    function(err) {
        if (err) {
            console.error('删除榜单条目失败:', err);
            return res.status(500).json({ error: '服务器错误' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: '榜单条目不存在' });
        }
        res.json({ message: '删除成功' });
    });
});

// 获取所有榜单条目
router.get('/api/leaderboard-entries', (req, res) => {
    db.all(`
        SELECT e.*, 
               t.name as type_name,
               t.code as type_code,
               t.color as type_color,
               g.name as game_name,
               g.release_date,
               g.price,
               g.developer,
               g.publisher,
               g.types,
               g.languages,
               g.image_url,
               g.description
        FROM leaderboard_entries e
        JOIN leaderboard_types t ON e.type_id = t.id
        JOIN games g ON e.game_id = g.id 
        ORDER BY t.sort_order ASC, e.rank ASC
    `, (err, entries) => {
        if (err) {
            console.error('获取榜单条目失败:', err);
            return res.status(500).json({ error: '服务器错误' });
        }
        res.json(entries);
    });
});

module.exports = router; 