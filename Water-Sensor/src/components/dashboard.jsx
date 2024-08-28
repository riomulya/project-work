import React, { useState, useEffect } from 'react';
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

// Definisikan ikon khusus menggunakan L.icon
const waterIcon = new L.Icon({
  iconUrl: '/marker-waterways.png', // Path ke gambar ikon
  iconSize: [32, 32], // Ukuran ikon
  iconAnchor: [16, 16], // Titik di ikon yang akan di posisikan di marker
  popupAnchor: [0, -16] // Titik untuk menampilkan popup relatif terhadap ikon
});

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
  const [position, setPosition] = useState([-6.34605, 106.69156]); // Posisi awal
  const [geoJsonData, setGeoJsonData] = useState(null); // State untuk menyimpan data GeoJSON
  const [routePath, setRoutePath] = useState([]); // State untuk menyimpan rute dari titik GPS ke tujuan

  useEffect(() => {
    // Mendapatkan lokasi pengguna saat ini
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setPosition([latitude, longitude]);

          // Tentukan titik tujuan (misal koordinat tertentu di jalur air)
          const destination = [-6.200000, 106.816666]; // Ganti dengan koordinat tujuan yang diinginkan

          // Setel rute dari posisi saat ini ke tujuan
          setRoutePath([[latitude, longitude], destination]);
        },
        (error) => {
          console.error("Error fetching geolocation: ", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }

    // Memuat file GeoJSON yang diunggah
    fetch('/hotosm_idn_waterways_points_geojson.geojson') // Path ke file GeoJSON
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => setGeoJsonData(data))
      .catch(error => console.error('Error loading GeoJSON:', error));
  }, []);

  return (
    <div>
      <section>
        <h1><center>Waterway Navigation</center></h1>
        <div className="maps-box" style={{ height: '600px' }}>
          <div className="details" id="map" style={{ height: '580px' }}>
            <MapContainer
              center={position}
              zoom={13}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Marker Default untuk Menunjukkan Lokasi Awal */}
              <Marker position={position}>
                <Popup>
                  Start: Latitude: {position[0]}, Longitude: {position[1]}
                </Popup>
              </Marker>

              <RecenterAutomatically lat={position[0]} lng={position[1]} />

              {/* Menggambar rute dari GPS ke tujuan */}
              {routePath.length > 1 && (
                <Polyline positions={routePath} color="red" />
              )}

              {/* Menambahkan jalur air menggunakan GeoJSON jika datanya sudah dimuat */}
              {geoJsonData && (
                <GeoJSON 
                  data={geoJsonData} 
                  style={{ color: 'blue', weight: 5 }}
                  pointToLayer={(feature, latlng) => {
                    return L.marker(latlng, { icon: waterIcon });
                  }}
                />
              )}
            </MapContainer>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
