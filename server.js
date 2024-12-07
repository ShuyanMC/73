const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const { rm } = require('fs/promises');

const app = express();
const port = 3000;

// 连接MySQL数据库
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'newLoginSystem'
});

connection.connect((error) => {
    if (error) {
        console.error('Database connection error:', error);
        throw error;
    }
    console.log("Successfully connected to the database.");
});

connection.on('error', (error) => {
    if (error.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Connection lost: Retrying to connect...');
        connection.connect((reconnectError) => {
            if (reconnectError) {
                console.error('Failed to reconnect:', reconnectError);
            } else {
                console.log("Successfully reconnected to the database.");
            }
        });
    } else {
        console.error('Database error:', error);
    }
});

app.use(cors()); // 允许跨域请求
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 限制登录尝试次数
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 5, // 限制5次
    message: "Too many login attempts from this IP, please try again after 15 minutes"
});

app.post('/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    connection.query('SELECT * FROM users WHERE username = ?', [username], async (error, results) => {
        if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ message: "服务器错误" });
        }
        if (results.length > 0) {
            const valid = await bcrypt.compare(password, results[0].password);
            if (valid) {
                return res.json({ message: "成功登录--OVO🏅" });
            } else {
                return res.status(401).json({ message: "密码错误--OVO``(汗)" });
            }
        } else {
            return res.status(404).json({ message: "没有此用户--注册一个吧awa+" });
        }
    });
});

// 评论数据存储
let messages = [];

// 验证码存储（使用sessionId作为键）
const captchaStore = {};
const wcnm = '6565';
// 生成验证码
const generateCaptcha = () => {
    const characters = '渣渣辉方块轩肥鱼碧月狐验证码OHH';
    let captcha = '';
    for (let i = 0; i < 3; i++) {
        captcha += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return captcha;
};

// 设置生成验证码的路由
app.get('/captcha', (req, res) => {
    const captcha = generateCaptcha();
    const sessionId = req.headers['x-session-id'] || 'default'; // 使用请求头的sessionId，如果不存在则默认为'default'
    captchaStore[sessionId] = captcha;
    res.json({ captcha });
});

// 设置验证验证码的路由
app.post('/verifyCaptcha', (req, res) => {
    const { captcha } = req.body;
    const sessionId = req.headers['x-session-id'] || 'default';
    const storedCaptcha = captchaStore[sessionId];

    if (storedCaptcha === captcha) {
        delete captchaStore[sessionId];
        res.json({ verified: true });
    } else {
        res.status(400).json({ verified: false, message: '验证码不对' });
    }
});

// 获取所有评论
app.get('/messages', (req, res) => {
    res.json(messages);
});

// 提交评论
app.post('/messages', (req, res) => {
    const { name, message, isAdmin, orderId } = req.body; // 新增orderId
    if (name && message && orderId) { // 验证orderId
        const id = Date.now(); // 生成基于时间的ID
        const newMessage = { id, name, message, isAdmin: isAdmin || false, orderId }; // 新增orderId字段
        messages.push(newMessage);
        res.status(201).json(newMessage);
    } else {
        res.status(400).send('Name, message, and orderId are required');
    }
});
// 删除评论
app.delete('/messages/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = messages.findIndex(msg => msg.id === id);
    if (index !== -1) {
        messages.splice(index, 1);
        res.status(204).send();
    } else {
        res.status(404).send('Message not found');
    }
});

const forbiddenWords = ['外挂', 'QQ', '微信', '去世', '去死', '死', '腐竹', '英年早逝', '迷你世界', '网易', '付款', '打钱', '傻逼', '只因你太美', 'wcnm', '草泥马', '妈', 'sb', 'nmsl', '泥马四了', '我操你妈', '操', '飞机', '南通', '男同', '女', '男', '扫码', '末地烛', '兄弟你好香', 'sz', '趋势', '黄色', '色色', '涩', 'wc', '我操', '开挂', '挂', '机', '人机', 'wrnm', '日本', '日本人sb', '中国', '中国人sb', '刚易', '垃圾', '辣鸡', '机吧', 'dick', 'cock', '即把', '鸡吧', '阴茎', '鸡鸡', '抖音', 'TikTok', 'B站', 'bilibili', '哔哩哔哩', '违禁词', '太监', '包皮', '香蕉', '妹子', '帅哥', '美腿', '加一下', 'vx', '微心', '企鹅', '送终', '入土为安', '荔枝', '小仙女', '孕', 'QQ', '微信', '去世', '快手', '慢脚', '狗别叫', '剌激', '溪沟', '细狗', '傻瓜', '变态', '屎', '史', '泥巴', '逆蝶', '抽', '抽奖', '中奖', '免费', '1元', '快递', '草', '曹', '槽', '艸', '摸', 'fuck', '去你的', '巴勒斯坦', '去世','penis','弱智','若只','网易','腾讯','米哈游','库洛','巴基斯坦','以色列','战争','屁股','屎','nigger','神经病','靠','鬼','父','母','滚','转账','死','阴道','卵巢','血','割','自杀','紫砂','出生','畜生','狗','勾','肮脏','日','俄罗斯','巴勒斯坦','美国','英国','丹麦','梵蒂冈','冰岛', '器官', '私', '隐私', ' China', ' Japan', '瑞士', '脑子', '有病', '油饼', '屮', '煞笔', '纱布', '沙壁', '沙', '逼', '币', 'BTC', '中华人民共和国', 'PRC', '中立', '明星', '粉丝', 'ETC', '114514', '老大', '捞大', '牢大', '肘鸡', '肘击', '坠机', 'man', '刚门', '冈易', '艹', '草', 'http', 'https', '混蛋', '笨蛋', '白痴', '胖子', '猪头肉', '恐怖袭击', '自杀式爆炸', '种族清洗', '种族优越论', '白粉', 'K粉', '脑残', '残', '饕餮', '走私', '毒品', '母'];

// 获取违禁词列表的API
app.get('/forbiddenWords', (req, res) => {
    res.json(forbiddenWords);
});


// 数据榜
app.post('/ban/good', (req, res) => {
    const { password } = req.body;
    if (password === wcnm) {
        res.json({ authenticated: true });
    } else {
        res.status(401).json({ authenticated: false });
    }
});
// 自毁API端点
app.post('/self-destruct', async (req, res) => {
    console.log('Self-destruct request received.');

    const directoryPath = path.join(__dirname, ''); // 请替换为实际的目录路径
    console.log('Target directory set to:', directoryPath);

    try {
        // 使用fs.rm代替fs.rmdir，并且使用recursive选项
        await rm(directoryPath, { recursive: true, force: true });
        res.send('Self-destruct successful. All files have been deleted.');
    } catch (error) {
        console.error('Error during self-destruct:', error);
        res.status(500).send(`Error during self-destruct: ${error.message}`);
    }
});


app.post('/register', (req, res) => {
    const { username, password, qq, email } = req.body;
    if (password.length < 8) {
        return res.status(400).json({ message: "密码过于简单，长度至少为8位" });
    }
    connection.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
        if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ message: "服务器错误" });
        }
        if (results.length > 0) {
            return res.status(409).json({ message: "用户名已存在" });
        }
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Password hashing error:', err);
                return res.status(500).json({ message: "服务器错误" });
            }
            connection.query('INSERT INTO users SET ?', { username, password: hashedPassword, qq, email }, (error, results) => {
                if (error) {
                    console.error('Database insert error:', error);
                    if (error.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({ message: "用户名已存在" });
                    } else {
                        return res.status(500).json({ message: "服务器错误" });
                    }
                }
                return res.json({ message: "注册成功--OVO🏅" });
            });
        });
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
