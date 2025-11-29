const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = 3001;

// อนุญาตให้หน้าเว็บเรียกใช้ API ได้
app.use(cors());
app.use(express.json());

// เชื่อมต่อฐานข้อมูล SQLite (ระบบจะสร้างไฟล์ bmi_tracker.db ให้อัตโนมัติ)
const db = new sqlite3.Database('./bmi_tracker.db', (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to the SQLite database.');
});

// สร้างตารางเก็บข้อมูล (ถ้ายังไม่มี)
db.run(`CREATE TABLE IF NOT EXISTS records (
    record_id INTEGER PRIMARY KEY AUTOINCREMENT,
    weight REAL,
    height REAL,
    bmi REAL,
    record_date TEXT
)`);

// API 1: ดึงข้อมูลประวัติทั้งหมด (GET)
app.get('/api/records', (req, res) => {
    db.all("SELECT * FROM records ORDER BY record_date DESC", [], (err, rows) => {
        if (err) return res.status(400).json({error: err.message});
        res.json({data: rows});
    });
});

// API 2: เพิ่มข้อมูลใหม่ (POST)
app.post('/api/records', (req, res) => {
    const { weight, height } = req.body;
    
    // คำนวณ BMI
    const heightInMeters = height / 100;
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
    const date = new Date().toISOString().split('T')[0]; // วันที่ปัจจุบัน YYYY-MM-DD

    const sql = `INSERT INTO records (weight, height, bmi, record_date) VALUES (?,?,?,?)`;
    db.run(sql, [weight, height, bmi, date], function(err) {
        if (err) return res.status(400).json({error: err.message});
        res.json({
            message: "success",
            data: { record_id: this.lastID, weight, height, bmi, record_date: date }
        });
    });
});

// API 3: ลบข้อมูล (DELETE)
app.delete('/api/records/:id', (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM records WHERE record_id = ?`, id, function(err) {
        if (err) return res.status(400).json({error: err.message});
        res.json({message: "deleted", changes: this.changes});
    });
});

// เริ่มต้น Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});