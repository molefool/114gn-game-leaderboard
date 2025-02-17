const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// 创建数据库连接
const db = new sqlite3.Database('database.sqlite');

// 检查数据库是否需要初始化
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='games'", (err, row) => {
    if (err) {
        console.error('检查数据库状态失败:', err);
        return;
    }

    // 只有在数据库表不存在时才执行初始化
    if (!row) {
        console.log('首次运行，初始化数据库...');
        
        // 读取初始化SQL文件
        const initSql = fs.readFileSync(path.join(__dirname, 'init-db.sql'), 'utf-8');

        // 执行数据库初始化
        db.serialize(() => {
            // 创建管理员表
            db.run(`
                CREATE TABLE IF NOT EXISTS admins (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE,
                    password TEXT
                )
            `);

            // 创建游戏表
            db.run(`
                CREATE TABLE IF NOT EXISTS games (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    rating REAL,
                    release_date DATE,
                    price REAL,
                    developer TEXT,
                    publisher TEXT,
                    types TEXT,
                    languages TEXT,
                    image_url TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS leaderboards (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    theme TEXT DEFAULT 'red',
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS leaderboard_games (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    leaderboard_id INTEGER,
                    game_id INTEGER,
                    rank INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (leaderboard_id) REFERENCES leaderboards(id),
                    FOREIGN KEY (game_id) REFERENCES games(id)
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS site_info (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    header_text TEXT,
                    footer_text TEXT,
                    default_leaderboard INTEGER,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (default_leaderboard) REFERENCES leaderboards(id)
                )
            `);

            // 创建默认管理员账号
            bcrypt.hash('root', 10, (err, hash) => {
                if (err) return console.error(err);
                db.run(`INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)`,
                    ['root', hash]);
            });

            // 执行初始化SQL文件中的插入语句
            initSql.split(';').forEach(statement => {
                if (statement.trim()) {
                    db.run(statement);
                }
            });

            // 添加示例游戏数据
            const sampleGames = [
                {
                    name: '恋爱关系',
                    description: '一款情节丰富的校园恋爱游戏，玩家将扮演一名普通学生，在校园生活中邂逅各具特色的女主角。',
                    rating: 9.5,
                    release_date: '2023-12-15',
                    price: 128.00,
                    developer: 'Love Games Studio',
                    publisher: 'Anime Games',
                    types: '恋爱,剧情,校园',
                    languages: '简体中文,日文'
                },
                {
                    name: '梦想咖啡厅',
                    description: '经营类恋爱模拟游戏，玩家将经营一家咖啡厅，同时发展与顾客的情感故事。',
                    rating: 9.2,
                    release_date: '2023-10-20',
                    price: 98.00,
                    developer: 'Dream Studio',
                    publisher: 'Cute Games',
                    types: '经营,恋爱,日常',
                    languages: '简体中文,日文,英文'
                },
                {
                    name: '虚假的承诺',
                    description: '一款宣传与实际内容严重不符的策略角色扮演游戏。',
                    rating: 2.8,
                    release_date: '2023-12-01',
                    price: 198.00,
                    developer: 'Cash Grab Games',
                    publisher: 'Money First Entertainment',
                    types: '策略,角色扮演,氪金',
                    languages: '简体中文,英文'
                },
                {
                    name: '粗制滥造的移植',
                    description: '质量低下的动作角色扮演游戏移植版本。',
                    rating: 3.2,
                    release_date: '2023-11-01',
                    price: 248.00,
                    developer: 'Lazy Port Studio',
                    publisher: 'Quick Cash Games',
                    types: '移植,动作,角色扮演',
                    languages: '简体中文,英文,日文'
                }
            ];

            sampleGames.forEach(game => {
                db.run('INSERT OR IGNORE INTO games (name, description, rating, release_date, price, developer, publisher, types, languages) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [game.name, game.description, game.rating, game.release_date, game.price, game.developer, game.publisher, game.types, game.languages]);
            });

            // 添加示例榜单数据
            const sampleLeaderboards = [
                {
                    name: '2023年度最值得推荐的游戏',
                    description: '2023年最受玩家好评的优秀游戏精选',
                    theme: 'red',
                    games: [
                        { game_id: 1, rank: 1 },
                        { game_id: 2, rank: 2 }
                    ]
                },
                {
                    name: '2023年度不推荐购买的游戏',
                    description: '存在严重问题的游戏，购买前请谨慎考虑',
                    theme: 'black',
                    games: [
                        { game_id: 3, rank: 1 },
                        { game_id: 4, rank: 2 }
                    ]
                }
            ];

            // 插入示例数据
            sampleLeaderboards.forEach(board => {
                db.run(`
                    INSERT INTO leaderboards (name, description, theme)
                    VALUES (?, ?, ?)
                `, [board.name, board.description, board.theme],
                function(err) {
                    if (err) return console.error('插入榜单失败:', err);
                    const leaderboardId = this.lastID;

                    // 插入榜单游戏关联
                    board.games.forEach(game => {
                        db.run(`
                            INSERT INTO leaderboard_games (leaderboard_id, game_id, rank)
                            VALUES (?, ?, ?)
                        `, [leaderboardId, game.game_id, game.rank]);
                    });
                });
            });

            // 确保至少有一条记录
            db.get('SELECT id FROM site_info WHERE id = 1', (err, row) => {
                if (!row) {
                    db.run(`
                        INSERT INTO site_info (id, header_text, footer_text, default_leaderboard)
                        VALUES (1, ?, ?, ?)
                    `, [
                        '欢迎来到游戏榜单系统 - 发现精彩游戏动态',
                        '© 2024 游戏榜单系统 | 联系我们：contact@gameleaderboard.com',
                        1
                    ]);
                }
            });

            console.log('数据库初始化完成');
        });
    } else {
        console.log('数据库已存在，跳过初始化');
    }
});

module.exports = db; 