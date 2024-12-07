const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express();
const port = 3001;

// MySQL连接配置
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456', // 替换为你的MySQL密码
    database: 'class_management'
});

// 连接到MySQL数据库
connection.connect(error => {
    if (error) {
        console.error('Database connection error:', error);
        throw error;
    }
    console.log("Successfully connected to the database.");

    // 创建表的SQL语句
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS students (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            score INT DEFAULT 0
        );
    `;

    // 执行创建表的SQL语句
    connection.query(createTableQuery, error => {
        if (error) {
            console.error('Error creating table:', error);
        } else {
            console.log('Table created or already exists.');
        }
    });
});

// 使用bodyParser中间件
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 设置EJS为模板引擎
app.set('view engine', 'ejs');

// 路由设置
app.get('/', (req, res) => {
    connection.query('SELECT * FROM students ORDER BY score DESC', (error, results) => {
        if (error) throw error;
        res.render('index', { students: results });
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
