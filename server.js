const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const iconv = require('iconv-lite');
const Papa = require('papaparse');

dotenv.config({ path: path.join(__dirname, 'admin.env') });

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (username === adminUsername && password === adminPassword) {
        res.json({ success: true, message: '登入成功' });
    } else {
        res.status(401).json({ success: false, message: '帳號或密碼錯誤' });
    }
});

app.post('/api/upload-csv', upload.single('csvFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: '請選擇檔案' });
    }

    const fileBuffer = req.file.buffer;
    const decodedContent = iconv.decode(fileBuffer, 'Big5');

    Papa.parse(decodedContent, {
        skipEmptyLines: true,
        complete: (results) => {
            if (results.errors.length > 0) {
                return res.status(400).json({ success: false, message: 'CSV 解析錯誤，請檢查檔案格式' });
            }

            const expectedHeaders = ['週次', '節次', '年級', '班級', '教師姓名', '校訂課程名稱', '上課頻率'];
            const headers = results.data[0];
            if (!expectedHeaders.every((header, index) => header === headers[index])) {
                return res.status(400).json({ success: false, message: 'CSV 標頭格式不正確' });
            }

            res.json({ success: true, message: '上傳成功', data: results.data });
        },
        error: (error) => {
            console.error('CSV 解析錯誤:', error);
            res.status(500).json({ success: false, message: '伺服器錯誤' });
        }
    });
});

app.listen(port, () => {
    console.log(`伺服器運行於 http://localhost:${port}`);
});