import express from 'express';
import db from './src/db.js';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import {
  loginController,
  saveAccelerationData,
  saveSensorPHData,
  saveTurbidityData,
  saveTemperatureData,
  saveLocationData,
  getAllDataSensor,
} from './src/controller.js';
const app = express();
import cors from 'cors';

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/sensor-data', getAllDataSensor);
app.get('/api/sensor-data/:timestamp', async (req, res) => {
  let { timestamp } = req.params;
  timestamp = timestamp.replace('%20', ' ');
  try {
    const result = await db.query(
      `
 SELECT 
    timestamp,
    MAX(CASE WHEN type = 'acceleration' THEN value1 END) AS acceleration_x,
    MAX(CASE WHEN type = 'acceleration' THEN value2 END) AS acceleration_y,
    MAX(CASE WHEN type = 'acceleration' THEN value3 END) AS acceleration_z,
    MAX(CASE WHEN type = 'ph' THEN value1 END) AS ph_value,
    MAX(CASE WHEN type = 'temperature' THEN value1 END) AS temperature_value,
    MAX(CASE WHEN type = 'turbidity' THEN value1 END) AS turbidity_value,
    MAX(CASE WHEN type = 'latitude' THEN value1 END) AS latitude_value,
    MAX(CASE WHEN type = 'longitude' THEN value1 END) AS longitude_value
FROM (
    SELECT 'acceleration' as type, id, timestamp, acceleration_x as value1, acceleration_y as value2, acceleration_z as value3
    FROM acceleration
    UNION ALL
    SELECT 'ph' as type, id, timestamp, ph_value as value1, NULL as value2, NULL as value3
    FROM ph_sensor
    UNION ALL
    SELECT 'temperature' as type, id, timestamp, temperature_value as value1, NULL as value2, NULL as value3
    FROM temperature
    UNION ALL
    SELECT 'turbidity' as type, id, timestamp, turbidity_value as value1, NULL as value2, NULL as value3
    FROM turbidity
    UNION ALL
    SELECT 'latitude' as type, id, timestamp, latitude_value as value1, NULL as value2, NULL as value3
    FROM lokasi
    UNION ALL
    SELECT 'longitude' as type, id, timestamp, longitude_value as value1, NULL as value2, NULL as value3
    FROM lokasi
) AS all_data
GROUP BY timestamp
ORDER BY timestamp ASC;

      `,
      [timestamp]
    );

    // Ensure result is in the expected format
    const formattedResult = JSON.stringify(result[0][0]); // Ensure result is JSON serializable

    // Send the JSON response
    console.log(result[0][0]);
    res.json(formattedResult);
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/login', loginController);

app.post('/sensors', async (req, res) => {
  const { date, accelX, accelY, accelZ, turbidity, temperature, ph, latitude, longitude } = req.body;
  try {
    await saveAccelerationData({
      timestamp: date,
      acceleration_x: accelX,
      acceleration_y: accelY,
      acceleration_z: accelZ,
    });
    await saveSensorPHData({ timestamp: date, ph_value: ph });
    await saveTurbidityData({ timestamp: date, turbidity_value: turbidity });
    await saveTemperatureData({
      timestamp: date,
      temperature_value: temperature,
    });
    await saveLocationData({
      timestamp: date,
      latitude_value: latitude,
      longitude_value: longitude,
    });
  } catch (error) {
    console.log(error);
  }
  console.log('Berhasil');
  res.status(200).send('success');
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log('Server berjalan pada port 3000');
});
