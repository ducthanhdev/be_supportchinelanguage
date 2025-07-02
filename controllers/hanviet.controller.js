const fs = require('fs');
const path = require('path');
const hanvietPath = path.join(__dirname, '../libs/hanviet.js');

exports.updateHanViet = (req, res) => {
    const { char, hanviet } = req.body;
    if (!char || !hanviet) return res.status(400).json({ error: 'Thiếu dữ liệu' });

    // Đọc file hanviet.js
    const hanvietLib = require('../libs/hanviet');
    hanvietLib.data[char] = hanviet;

    // Ghi lại file hanviet.js
    const newData = `var HanViet = ${JSON.stringify(hanvietLib, null, 2)};\n\nmodule.exports = HanViet;\n`;
    fs.writeFileSync(hanvietPath, newData, 'utf8');

    res.json({ message: 'Cập nhật thành công', char, hanviet });
}; 