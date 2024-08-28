import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
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
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

const Dashboard = () => {
  const [position, setPosition] = useState([-6.34605, 106.69156]); // Posisi awal
  const [geoJsonData, setGeoJsonData] = useState(null); // State untuk menyimpan data GeoJSON

  useEffect(() => {
    // Mendapatkan lokasi pengguna saat ini
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setPosition([latitude, longitude]);
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
      .then(response => response.json())
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
              <Marker position={position} icon={waterIcon}>
                <Popup>
                  Start: Latitude: {position[0]}, Longitude: {position[1]}
                </Popup>
              </Marker>
              <RecenterAutomatically lat={position[0]} lng={position[1]} />

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
