import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  Polyline,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import HookMqtt from '../service/hook';

// Definisikan ikon khusus untuk jalur air
const waterIcon = new L.Icon({
  iconUrl: '/marker-waterways.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Definisikan ikon khusus untuk titik tujuan
const destinationIcon = new L.Icon({
  iconUrl: '/marker-destination.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Definisikan ikon khusus untuk titik awal
const startIcon = new L.Icon({
  iconUrl: '/marker-start.png', // Path ke gambar ikon titik awal
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Definisikan ikon khusus untuk pengguna
const userIcon = new L.Icon({
  iconUrl: '/marker-user.png', // Path ke gambar ikon pengguna
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Kecepatan rata-rata (misalnya: 10 km/h)
const averageSpeedKmh = 10;

const RecenterAutomatically = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng]);
    }
  }, [lat, lng, map]);
  return null;
};

const Dashboard = () => {
  const [userPosition, setUserPosition] = useState([-6.350114, 106.723668]); // Posisi user berdasarkan GPS
  const [startPosition, setStartPosition] = useState([-6.350114, 106.723668]); // Posisi awal
  const [endPosition, setEndPosition] = useState([-6.349545, 106.724455]); // Posisi akhir
  const [geoJsonData, setGeoJsonData] = useState(null); // State untuk menyimpan data GeoJSON
  const [distance, setDistance] = useState(0); // State untuk menyimpan jarak
  const [eta, setEta] = useState(null); // State untuk menyimpan ETA
  const alarmAudioRef = useRef(new Audio('/alarm-sound.mp3')); // Ref untuk audio alarm

  const playAlarm = () => {
    alarmAudioRef.current.play();
  };

  const stopAlarm = () => {
    alarmAudioRef.current.pause();
    alarmAudioRef.current.currentTime = 0; // Reset waktu audio ke awal
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserPosition([latitude, longitude]);
        },
        (error) => {
          console.error("Error fetching geolocation: ", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }

    fetch('/hotosm_idn_waterways_points_geojson.geojson') // Path ke file GeoJSON
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => setGeoJsonData(data))
      .catch(error => console.error('Error loading GeoJSON:', error));

    // Cleanup saat komponen unmount
    return () => {
      stopAlarm(); // Hentikan alarm saat komponen di-unmount
    };
  }, []);

  useEffect(() => {
    const startLatLng = L.latLng(startPosition);
    const endLatLng = L.latLng(endPosition);
    const calculatedDistance = startLatLng.distanceTo(endLatLng); // Distance in meters
    setDistance((calculatedDistance / 1000).toFixed(2)); // Set distance in kilometers with two decimal places

    // Hitung ETA berdasarkan jarak dan kecepatan rata-rata
    const timeInHours = calculatedDistance / 1000 / averageSpeedKmh; // Waktu dalam jam
    const timeInMinutes = timeInHours * 60; // Konversi ke menit
    setEta(Math.ceil(timeInMinutes)); // Pembulatan ke atas ke menit terdekat

    if (calculatedDistance < 200) {
      playAlarm();
    } else {
      stopAlarm();
    }

    // Event listener untuk mengulang alarm jika masih di bawah 200 meter
    alarmAudioRef.current.addEventListener('ended', () => {
      if (calculatedDistance < 200) {
        playAlarm(); // Ulangi alarm jika jarak masih kurang dari 200 meter
      }
    });

    // Cleanup event listener saat komponen atau posisi berubah
    return () => {
      alarmAudioRef.current.removeEventListener('ended', () => {
        if (calculatedDistance < 200) {
          playAlarm();
        }
      });
    };
  }, [startPosition, endPosition, distance]);

  return (
    <div>
      <section>
        <h1><center>Waterway Navigation</center></h1>
        <div className="maps-box" style={{ height: '600px' }}>
          <div className="details" id="map" style={{ height: '580px' }}>
            <MapContainer
              center={userPosition}
              zoom={13}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Marker untuk menunjukkan lokasi pengguna dengan custom icon */}
              <Marker 
                position={userPosition} 
                icon={userIcon} 
                eventHandlers={{
                  click: () => {},
                }}
              >
                <Popup>
                  User Location: Latitude: {userPosition[0]}, Longitude: {userPosition[1]}
                </Popup>
              </Marker>

              <RecenterAutomatically lat={userPosition[0]} lng={userPosition[1]} />

              {/* Marker untuk titik awal */}
              <Marker 
                position={startPosition} 
                icon={startIcon}
                eventHandlers={{
                  click: () => {},
                }}
              >
                <Popup>
                  Start: Latitude: {startPosition[0]}, Longitude: {startPosition[1]}
                </Popup>
              </Marker>

              {/* Marker untuk titik akhir */}
              <Marker 
                position={endPosition} 
                icon={destinationIcon}
                eventHandlers={{
                  click: () => {},
                }}
              >
                <Popup>
                  End: Latitude: {endPosition[0]}, Longitude: {endPosition[1]}<br/>
                  Distance: {distance} km<br/>
                  Estimate Time: {eta} minutes
                </Popup>
              </Marker>

              {/* Menggambar rute dari titik awal ke titik akhir */}
              {startPosition && endPosition && (
                <Polyline positions={[startPosition, endPosition]} color="green" />
              )}

              {/* Menambahkan jalur air menggunakan GeoJSON jika datanya sudah dimuat */}
              {geoJsonData && (
                <GeoJSON 
                  data={geoJsonData} 
                  style={{ color: 'blue', weight: 5 }}
                  pointToLayer={(feature, latlng) => {
                    return L.marker(latlng, { icon: waterIcon })
                      .bindPopup(`Latitude: ${latlng.lat}, Longitude: ${latlng.lng}`)
                  }}
                />
              )}
            </MapContainer>
          </div>
        </div>
        <div className="app">
          <HookMqtt />
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
