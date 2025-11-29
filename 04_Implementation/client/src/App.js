import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './App.css';

// ลงทะเบียน Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [records, setRecords] = useState([]);
  const [latestBMI, setLatestBMI] = useState(0);

  // ดึงข้อมูลจาก Backend เมื่อเปิดแอพ
  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/records');
      setRecords(res.data.data);
      if (res.data.data.length > 0) {
        setLatestBMI(res.data.data[0].bmi);
      } else {
        setLatestBMI(0); // ถ้าไม่มีข้อมูลให้เป็น 0
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const handleSave = async () => {
    if (!weight || !height) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    try {
      await axios.post('http://localhost:3001/api/records', {
        weight: parseFloat(weight),
        height: parseFloat(height)
      });
      alert("บันทึกข้อมูลสำเร็จ!");
      setWeight('');
      // setHeight(''); // ส่วนสูงมักจะเท่าเดิม ไม่ต้องลบก็ได้เพื่อความสะดวก
      fetchRecords(); // โหลดข้อมูลใหม่ทันที
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการบันทึก: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("ยืนยันการลบข้อมูล?")) return;
    try {
      await axios.delete(`http://localhost:3001/api/records/${id}`);
      fetchRecords(); // โหลดข้อมูลใหม่หลังจากลบ
    } catch (err) {
      console.error(err);
      alert("ลบข้อมูลไม่สำเร็จ");
    }
  };

  // เตรียมข้อมูลกราฟ
  const chartData = {
    labels: records.slice().reverse().map(r => r.record_date),
    datasets: [
      {
        label: 'BMI Trend',
        data: records.slice().reverse().map(r => r.bmi),
        borderColor: '#4db6ac', // สี Mint เข้ม
        backgroundColor: 'rgba(77, 182, 172, 0.2)',
        tension: 0.3
      },
    ],
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>BMI Tracker</h1>
      </header>

      <div className="content">
        {activeTab === 'home' && (
          <div className="home-view">
            <div className="bmi-circle">
              <span className="bmi-value">{latestBMI}</span>
              <span className="bmi-label">BMI</span>
            </div>
            
            <div className="input-card">
              <h3>บันทึกค่าใหม่</h3>
              <div className="form-group">
                <label>น้ำหนัก (kg)</label>
                <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" />
              </div>
              <div className="form-group">
                <label>ส่วนสูง (cm)</label>
                <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="0" />
              </div>
              <button className="btn-save" onClick={handleSave}>Record New Data</button>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-view">
            <h3>ประวัติการบันทึก</h3>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Weight</th>
                    <th>BMI</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec.record_id}>
                      <td>{rec.record_date}</td>
                      <td>{rec.weight}</td>
                      <td>{rec.bmi}</td>
                      <td><button className="btn-delete" onClick={() => handleDelete(rec.record_id)}>ลบ</button></td>
                    </tr>
                  ))}
                  {records.length === 0 && <tr><td colSpan="4" style={{textAlign:'center'}}>ยังไม่มีข้อมูล</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'graph' && (
          <div className="graph-view">
            <h3>แนวโน้มสุขภาพ</h3>
            <div className="chart-container">
              {records.length > 0 ? (
                <Line data={chartData} />
              ) : (
                <p style={{textAlign:'center', marginTop:'50px', color:'#888'}}>ต้องบันทึกข้อมูลก่อน กราฟถึงจะขึ้นครับ</p>
              )}
            </div>
          </div>
        )}
      </div>

      <nav className="bottom-nav">
        <button className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>Home</button>
        <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>History</button>
        <button className={activeTab === 'graph' ? 'active' : ''} onClick={() => setActiveTab('graph')}>Graph</button>
      </nav>
    </div>
  );
}

export default App;