-- 清空并重建游戏表
DELETE FROM games;
DELETE FROM leaderboards;
DELETE FROM leaderboard_games;

-- 2020年度推荐游戏
INSERT INTO games (id, name, description, rating, release_date, price, developer, publisher, types, languages, image_url) VALUES
(1, '黑帝斯 Hades', '在这款由《堡垒之夜》开发商打造的动作冒险游戏中，你将扮演冥界之神的不朽王子，运用奥林匹斯众神赐予的力量和独特武器，从冥界中杀出一条血路。', 9.8, '2020-09-17', 98, 'Supergiant Games', 'Supergiant Games', '动作,Roguelike,地牢探索,独立游戏', '简体中文,英语,日语', 'https://cdn.akamai.steamstatic.com/steam/apps/1145360/header.jpg'),
(2, '半条命：爱莉克斯 Half-Life: Alyx', 'Half-Life 系列最新作品，Valve 的 VR 回归之作。在 City 17 的街道和建筑之间穿行，通过 VR 进行交互，与标志性的半条命游戏玩法展开生死对抗。', 9.5, '2020-03-23', 198, 'Valve', 'Valve', 'VR,第一人称射击,动作,冒险', '简体中文,英语', 'https://cdn.akamai.steamstatic.com/steam/apps/546560/header.jpg'),
(3, '动物森友会 Animal Crossing: New Horizons', '来到无人岛上开启全新生活！采集材料制作道具、与动物居民互动、打造专属于你的梦想家园。', 9.3, '2020-03-20', 298, 'Nintendo', 'Nintendo', '生活模拟,休闲,社交', '简体中文,英语,日语', 'https://assets.nintendo.com/image/upload/ar_16:9,b_auto:border,c_lpad/b_white/f_auto/q_auto/dpr_auto/c_scale,w_700/v1/ncom/en_US/games/switch/a/animal-crossing-new-horizons-switch/hero');

-- 2021年度推荐游戏
INSERT INTO games (id, name, description, rating, release_date, price, developer, publisher, types, languages, image_url) VALUES
(4, '生化危机8：村庄 Resident Evil Village', '体验生存恐怖的下一个篇章。在这款第一人称动作游戏中，伊森·温特斯为了找回女儿而深入充满危险的村庄，直面恐怖与未知。', 9.4, '2021-05-07', 396, 'CAPCOM', 'CAPCOM', '恐怖,动作,第一人称射击', '简体中文,英语,日语', 'https://cdn.akamai.steamstatic.com/steam/apps/1196590/header.jpg'),
(5, '极限竞速：地平线5 Forza Horizon 5', '探索充满活力的墨西哥开放世界。在这款最新的竞速游戏中，体验无尽的驾驶乐趣和令人惊叹的视觉效果。', 9.6, '2021-11-09', 298, 'Playground Games', 'Xbox Game Studios', '竞速,开放世界,体育', '简体中文,英语', 'https://cdn.akamai.steamstatic.com/steam/apps/1551360/header.jpg'),
(6, '双人成行 It Takes Two', '踏上生命中最疯狂的旅程！在这款专为双人合作打造的平台冒险游戏中，你将体验前所未有的游戏玩法和感人至深的故事。', 9.7, '2021-03-26', 198, 'Hazelight', 'EA', '合作,冒险,动作,平台', '简体中文,英语', 'https://cdn.akamai.steamstatic.com/steam/apps/1426210/header.jpg');

-- 2022年度推荐游戏
INSERT INTO games (id, name, description, rating, release_date, price, developer, publisher, types, languages, image_url) VALUES
(7, '艾尔登法环 Elden Ring', '在广阔的开放世界中探索未知，与强大的敌人展开战斗，揭开交错世界的秘密。这是一款由宫崎英高与乔治·R·R·马丁联手打造的动作角色扮演游戏。', 9.9, '2022-02-25', 298, 'FromSoftware', 'Bandai Namco', '动作角色扮演,开放世界,黑暗奇幻', '简体中文,英语,日语', 'https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg'),
(8, '战神：诸神黄昏 God of War Ragnarök', '克雷托斯和阿特柔斯必须前往九界每一个领域，寻找阻止诸神黄昏的答案。在这趟危险的旅程中，他们将探索令人惊叹的神话景观，招募盟友，与凶猛的北欧怪物和众神展开战斗。', 9.8, '2022-11-09', 398, 'Santa Monica Studio', 'Sony Interactive Entertainment', '动作冒险,角色扮演,北欧神话', '简体中文,英语', 'https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xJ8XB3bi888QTLZYdl7Oi0s.png'),
(9, '瘟疫传说：安魂曲 A Plague Tale: Requiem', '在这个残酷而令人窒息的世界中，雨果和阿米希娅为了生存必须付出一切。在一个新的、令人心碎的冒险中，你将竭尽全力保护所爱之人。', 9.4, '2022-10-18', 248, 'Asobo Studio', 'Focus Entertainment', '动作冒险,叙事,潜行', '简体中文,英语,法语', 'https://cdn.akamai.steamstatic.com/steam/apps/1069690/header.jpg');

-- 创建年度榜单
INSERT INTO leaderboards (id, name, description, theme, is_active) VALUES
(1, '2020年度推荐游戏', '2020年度最值得游玩的精选游戏，涵盖多个类型，让玩家在疫情期间找到欢乐。', 'red', 1),
(2, '2021年度推荐游戏', '2021年度最受欢迎的游戏作品，从恐怖到竞速，从合作到冒险，带来多样化的游戏体验。', 'red', 1),
(3, '2022年度推荐游戏', '2022年度最具影响力的游戏大作，开放世界、动作冒险等类型的巅峰之作。', 'red', 1);

-- 关联游戏到榜单
INSERT INTO leaderboard_games (leaderboard_id, game_id, rank) VALUES
-- 2020年榜单
(1, 1, 1),
(1, 2, 2),
(1, 3, 3),
-- 2021年榜单
(2, 4, 1),
(2, 5, 2),
(2, 6, 3),
-- 2022年榜单
(3, 7, 1),
(3, 8, 2),
(3, 9, 3); 