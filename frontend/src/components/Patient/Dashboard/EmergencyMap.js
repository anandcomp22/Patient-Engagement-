import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Box, Typography, CircularProgress, Alert, Card, CardContent, Chip, Select, MenuItem } from '@mui/material';
import { Phone, LocationOn, LocalHospital, LocalPharmacy, MedicalServices, FilterList } from '@mui/icons-material';

const createIcon = (color, IconComp) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
             <span style="font-family: sans-serif; font-weight: bold; font-size: 16px;">${IconComp}</span>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const icons = {
  hospital: createIcon('#d32f2f', 'H'), // Red
  clinic: createIcon('#1976d2', 'C'),   // Blue
  pharmacy: createIcon('#2e7d32', 'P')  // Green
};

// Component to recenter map when selecting a facility
const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (!center || !map) return;
    // Guard against Leaflet race condition where the map pane
    // (_leaflet_pos) may not be ready during zoom transitions
    try {
      if (map.getPane('mapPane')) {
        map.setView(center, 15, { animate: false });
      }
    } catch (e) {
      // Map not ready yet — silently ignore
    }
  }, [center, map]);
  return null;
};

const EmergencyMap = () => {
  const [position, setPosition] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedFacility, setSelectedFacility] = useState(null);

  // New Filters State
  const [radius, setRadius] = useState(5); // in km
  const [activeTypes, setActiveTypes] = useState(['hospital', 'clinic', 'pharmacy']);

  useEffect(() => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        fetchFacilities(latitude, longitude, radius);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setErrorMsg('Could not access your location. Showing default area.');
        const defaultPos = [28.6139, 77.2090]; // New Delhi
        setPosition(defaultPos);
        fetchFacilities(defaultPos[0], defaultPos[1], radius);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, [radius]); // Only run on mount to get location

  // Refetch when radius changes, if position is already known
  useEffect(() => {
    if (position) {
      setLoading(true);
      fetchFacilities(position[0], position[1], radius);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius]);

  const handleTypeToggle = (type) => {
    setActiveTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const fetchFacilities = async (lat, lng, radiusKm) => {
    try {
      const radiusMeters = radiusKm * 1000;
      const overpassQuery = `
        [out:json][timeout:25];
        (
          nwr["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
          nwr["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
          nwr["amenity"="pharmacy"](around:${radiusMeters},${lat},${lng});
        );
        out center;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(overpassQuery)}`
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from Overpass API');
      }

      const data = await response.json();

      const parsedFacilities = data.elements
        .filter(el => el.tags && el.tags.amenity)
        .map(el => {
          // For nodes, lat/lon are on the element itself; for ways/relations, they are in 'center'
          const fLat = el.lat || (el.center && el.center.lat);
          const fLng = el.lon || (el.center && el.center.lon);

          return {
            id: el.id,
            lat: fLat,
            lng: fLng,
            type: el.tags.amenity,
            name: el.tags.name || `Unnamed ${el.tags.amenity}`,
            phone: el.tags.phone || el.tags['contact:phone'] || '',
            address: el.tags['addr:full'] || el.tags['addr:street'] || ''
          };
        })
        .filter(f => f.lat && f.lng); // ensure we have valid coordinates

      setFacilities(parsedFacilities);
    } catch (err) {
      console.error('Error fetching facilities:', err);
      setErrorMsg('Error loading nearby facilities. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column' }}>
        <CircularProgress size={48} sx={{ color: '#1E5DA9', mb: 2 }} />
        <Typography variant="body1" sx={{ color: '#1E5DA9', fontWeight: 500 }}>Locating nearby emergency services...</Typography>
      </Box>
    );
  }

  const getIconStatus = (type) => {
    switch (type) {
      case 'hospital': return { icon: <LocalHospital fontSize="small" />, color: 'error', label: 'Hospital' };
      case 'clinic': return { icon: <MedicalServices fontSize="small" />, color: 'primary', label: 'Clinic' };
      case 'pharmacy': return { icon: <LocalPharmacy fontSize="small" />, color: 'success', label: 'Pharmacy' };
      default: return { icon: <LocalHospital fontSize="small" />, color: 'default', label: 'Medical' };
    }
  };

  const filteredFacilities = facilities.filter(f => activeTypes.includes(f.type));

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>

      {/* Filters Toolbar */}
      <Card sx={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 }, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', gap: 2 }}>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList sx={{ color: '#64748b' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#334155' }}>Filters</Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip
              label="Hospitals"
              icon={<LocalHospital fontSize="small" />}
              color={activeTypes.includes('hospital') ? "error" : "default"}
              variant={activeTypes.includes('hospital') ? "filled" : "outlined"}
              onClick={() => handleTypeToggle('hospital')}
              sx={{ fontWeight: 'bold' }}
            />
            <Chip
              label="Clinics"
              icon={<MedicalServices fontSize="small" />}
              color={activeTypes.includes('clinic') ? "primary" : "default"}
              variant={activeTypes.includes('clinic') ? "filled" : "outlined"}
              onClick={() => handleTypeToggle('clinic')}
              sx={{ fontWeight: 'bold' }}
            />
            <Chip
              label="Pharmacies"
              icon={<LocalPharmacy fontSize="small" />}
              color={activeTypes.includes('pharmacy') ? "success" : "default"}
              variant={activeTypes.includes('pharmacy') ? "filled" : "outlined"}
              onClick={() => handleTypeToggle('pharmacy')}
              sx={{ fontWeight: 'bold' }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 180 }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 'bold', pl: 0.5 }}>Search Radius</Typography>
            <Select
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              size="small"
              sx={{ backgroundColor: '#f8fafc', fontWeight: 'bold', borderRadius: '8px' }}
            >
              <MenuItem value={1}>1 km &nbsp;—&nbsp; Walking</MenuItem>
              <MenuItem value={3}>3 km &nbsp;—&nbsp; Local</MenuItem>
              <MenuItem value={5}>5 km &nbsp;—&nbsp; Nearby</MenuItem>
              <MenuItem value={10}>10 km — Citywide</MenuItem>
              <MenuItem value={20}>20 km — Expanded</MenuItem>
            </Select>
          </Box>

        </CardContent>
      </Card>

      {/* Main Map & List Layout */}
      <Box sx={{ width: '100%', height: { xs: 'auto', md: '500px' }, display: 'flex', flexDirection: { xs: 'column-reverse', md: 'row' }, borderRadius: '16px', overflow: 'hidden', border: '1px solid #e0e0e0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>

        {/* Contact List Sidebar */}
        <Box sx={{ width: { xs: '100%', md: '35%' }, height: { xs: '350px', md: '100%' }, backgroundColor: '#f8fafc', borderRight: { md: '1px solid #e0e0e0' }, borderTop: { xs: '1px solid #e0e0e0', md: 'none' }, overflowY: 'auto' }}>
          <Box sx={{ p: 2, position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#1e293b' }}>
              Nearby Results ({filteredFacilities.length})
            </Typography>
          </Box>

          {filteredFacilities.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No facilities matched your filters.</Typography>
            </Box>
          )}

          {filteredFacilities.map(facility => {
            const statusConfig = getIconStatus(facility.type);
            const isSelected = selectedFacility?.id === facility.id;

            return (
              <Card
                key={facility.id}
                elevation={0}
                sx={{
                  m: 1,
                  mb: 1.5,
                  border: isSelected ? `2px solid #1E5DA9` : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
                }}
                onClick={() => setSelectedFacility(facility)}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0f172a', pr: 1, lineHeight: 1.3 }}>
                      {facility.name}
                    </Typography>
                    <Chip size="small" icon={statusConfig.icon} label={statusConfig.label} color={statusConfig.color} variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                  </Box>

                  {facility.address && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 1, color: '#64748b' }}>
                      <LocationOn sx={{ fontSize: 16, mr: 0.5, mt: 0.2 }} />
                      <Typography variant="caption">{facility.address}</Typography>
                    </Box>
                  )}

                  {/* Brief Contact Info */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5, pt: 1.5, borderTop: '1px dashed #e2e8f0' }}>
                    {facility.phone ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Phone sx={{ fontSize: 16, mr: 0.5, color: '#16a34a' }} />
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#16a34a' }}>{facility.phone}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>No phone available</Typography>
                    )}

                    {facility.phone && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <a href={`tel:${facility.phone}`} style={{ textDecoration: 'none' }}>
                          <Box sx={{
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            Call
                          </Box>
                        </a>
                      </div>
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* Map Section */}
        <Box sx={{ width: { xs: '100%', md: '65%' }, height: { xs: '350px', md: '100%' }, position: 'relative' }}>
          {errorMsg && (
            <Alert severity="warning" sx={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '90%' }}>
              {errorMsg}
            </Alert>
          )}

          {position && (
            <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%', zIndex: 1 }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {selectedFacility && <MapRecenter center={[selectedFacility.lat, selectedFacility.lng]} />}

              {/* User Marker */}
              <Marker
                position={position}
                icon={L.divIcon({
                  className: 'user-location-icon',
                  html: `<div style="background-color: #2563eb; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3), 0 2px 5px rgba(0,0,0,0.4);"></div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
                })}
              >
                <Popup>You are here</Popup>
              </Marker>

              {/* Facility Markers */}
              {filteredFacilities.map(facility => (
                <Marker
                  key={facility.id}
                  position={[facility.lat, facility.lng]}
                  icon={selectedFacility?.id === facility.id
                    ? createIcon(getIconStatus(facility.type).color === 'error' ? '#b91c1c' : '#0369a1', '★')
                    : icons[facility.type] || icons.hospital}
                  eventHandlers={{
                    click: () => {
                      setSelectedFacility(facility);
                    },
                  }}
                >
                  <Popup>
                    <Typography variant="subtitle2" fontWeight="bold">{facility.name}</Typography>
                    <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>{facility.type}</Typography>
                    {facility.phone && (
                      <Box sx={{ mt: 1 }}>
                        <a href={`tel:${facility.phone}`} style={{ fontSize: '12px', fontWeight: 'bold' }}>{facility.phone}</a>
                      </Box>
                    )}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default EmergencyMap;
