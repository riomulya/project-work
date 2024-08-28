import db from './db.js';
import bcrypt from 'bcrypt';

// Function untuk simpan data ke table
export const saveAccelerationData = async (data) => {
  try {
    const { timestamp, acceleration_x, acceleration_y, acceleration_z } = data;

    await db.query('INSERT INTO acceleration SET ?', {
      timestamp: timestamp,
      acceleration_x: acceleration_x,
      acceleration_y: acceleration_y,
      acceleration_z: acceleration_z,
    });
  } catch (error) {
    console.error(error);
    throw new Error('Gagal menyimpan data acceleration');
  }
};

export const saveSensorPHData = async (data) => {
  try {
    const { timestamp, ph_value } = data;

    await db.query('INSERT INTO ph_sensor SET ?', {
      timestamp: timestamp,
      ph_value: ph_value,
    });
  } catch (error) {
    console.error(error);
    throw new Error('Gagal menyimpan data sensor_PH');
  }
};

export const saveTurbidityData = async (data) => {
  try {
    const { timestamp, turbidity_value } = data;

    await db.query('INSERT INTO turbidity SET ?', {
      timestamp: timestamp,
      turbidity_value: turbidity_value,
    });
  } catch (error) {
    console.error(error);
    throw new Error('Gagal menyimpan data turbidity');
  }
};

export const saveTemperatureData = async (data) => {
  try {
    const { timestamp, temperature_value } = data;

    await db.query('INSERT INTO temperature SET ?', {
      timestamp: timestamp,
      temperature_value: temperature_value,
    });
  } catch (error) {
    console.error(error);
    throw new Error('Gagal menyimpan data temperature');
  }
};

export const saveLocationData = async (data) => {
  try {
    const { timestamp, latitude_value, longitude_value } = data;

    await db.query('INSERT INTO lokasi SET ?', {
      timestamp: timestamp,
      latitude_value: latitude_value,
      longitude_value: longitude_value,
    });
  } catch (error) {
    console.error(error);
    throw new Error('Gagal menyimpan data lokasi');
  }
};

export const getAllDataSensor = async (req, res) => {
  try {
    // Query untuk mengambil data dari tabel sensor
    const [rows] = await db.query(`
      SELECT 
        COALESCE(a.timestamp, p.timestamp, t.timestamp, u.timestamp) AS timestamp,
        a.acceleration_x AS accelX,
        a.acceleration_y AS accelY,
        a.acceleration_z AS accelZ,
        t.temperature_value AS temperature,
        u.turbidity_value AS turbidity,
        s.latitude_value AS latitude,
        v.longitude_value AS longitude,
        p.ph_value AS phsensor
      FROM
        (SELECT timestamp, acceleration_x, acceleration_y, acceleration_z
         FROM acceleration) a
      LEFT JOIN
        (SELECT timestamp, ph_value
         FROM ph_sensor) p ON a.timestamp = p.timestamp
      LEFT JOIN
        (SELECT timestamp, temperature_value
         FROM temperature) t ON a.timestamp = t.timestamp
      LEFT JOIN
        (SELECT timestamp, turbidity_value
         FROM turbidity) u ON a.timestamp = u.timestamp
      LEFT JOIN
        (SELECT timestamp, latitude_value
         FROM lokasi) s ON a.timestamp = s.timestamp
      LEFT JOIN
        (SELECT timestamp, longitude_value
         FROM lokasi) v ON a.timestamp = v.timestamp
      ORDER BY timestamp ASC
    `);

    // Mengirimkan hasil query sebagai respons JSON
    res.json(rows);
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const loginController = async (req, res) => {
  const { username, password } = req.body;
  console.log('Username:', username);
  console.log('Password:', password);

  try {
    // Retrieve user from the database by username
    const result = await db.query('SELECT * FROM users WHERE username = ?', [
      username,
    ]);
    console.log('Result from DB:', result[0][0].password); // Log the entire result object

    // Check if result.rows is defined and has a length property
    if (!result[0] || result[0].length === 0) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const hashedPassword = result[0][0].password;
    console.log('Hashed Password from DB:', hashedPassword);

    // Compare the provided password with the hashed password from the database
    const match = await bcrypt.compare(password, hashedPassword);
    console.log('Match:', match);

    if (!match) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    res.status(200).json({ message: 'Login Berhasil' });
  } catch (error) {
    console.error('Error in loginController:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

export default {
  loginController,
  saveAccelerationData,
  saveSensorPHData,
  saveTemperatureData,
  saveTurbidityData,
  saveLocationData,
};
