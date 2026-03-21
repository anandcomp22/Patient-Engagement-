import React, { useState } from 'react';
import { Box, Button, Typography, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, Chip, CircularProgress } from '@mui/material';
import { Bluetooth, WatchOutlined, PlayCircleOutline, CheckCircle, ErrorOutline, LinkOff } from '@mui/icons-material';

const statusConfig = {
  disconnected: { label: 'Not Connected', color: '#64748b', bg: '#f1f5f9' },
  connecting:   { label: 'Connecting...', color: '#d97706', bg: '#fef3c7' },
  ble:          { label: 'Bluetooth',     color: '#0369a1', bg: '#e0f2fe' },
  gfit:         { label: 'Google Fit',    color: '#15803d', bg: '#dcfce7' },
  demo:         { label: 'Demo Mode',     color: '#7c3aed', bg: '#ede9fe' },
};

export default function HealthConnect({ connectionStatus, deviceName, error, connectBluetooth, connectGoogleFit, startDemo, disconnect }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const cfg = statusConfig[connectionStatus] || statusConfig.disconnected;
  const isConnected = ['ble', 'gfit', 'demo'].includes(connectionStatus);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Tooltip title={deviceName || cfg.label} arrow>
        <Chip
          size="small"
          icon={
            connectionStatus === 'connecting'
              ? <CircularProgress size={12} sx={{ color: cfg.color }} />
              : isConnected
              ? <CheckCircle sx={{ fontSize: 14, color: cfg.color }} />
              : <WatchOutlined sx={{ fontSize: 14 }} />
          }
          label={cfg.label}
          sx={{ backgroundColor: cfg.bg, color: cfg.color, fontWeight: 'bold', fontSize: '0.7rem' }}
        />
      </Tooltip>

      {error && (
        <Tooltip title={error} arrow>
          <ErrorOutline sx={{ color: '#dc2626', fontSize: 18 }} />
        </Tooltip>
      )}

      {isConnected ? (
        <Tooltip title="Disconnect device" arrow>
          <Button
            size="small"
            variant="outlined"
            startIcon={<LinkOff fontSize="small" />}
            onClick={disconnect}
            sx={{ borderRadius: '20px', textTransform: 'none', fontSize: '0.7rem', py: 0.3, borderColor: '#cbd5e1', color: '#64748b' }}
          >
            Disconnect
          </Button>
        </Tooltip>
      ) : (
        <>
          <Button
            size="small"
            variant="contained"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ borderRadius: '20px', textTransform: 'none', fontSize: '0.75rem', py: 0.4, px: 1.5, backgroundColor: '#1E5DA9', '&:hover': { backgroundColor: '#1a4f91' } }}
          >
            Connect
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{ sx: { borderRadius: '12px', minWidth: 230, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' } }}
          >
            <MenuItem onClick={() => { connectBluetooth(); setAnchorEl(null); }} sx={{ py: 1.5 }}>
              <ListItemIcon><Bluetooth sx={{ color: '#0369a1' }} /></ListItemIcon>
              <ListItemText
                primary={<Typography variant="body2" fontWeight="bold">Bluetooth Device</Typography>}
                secondary={<Typography variant="caption" color="text.secondary">Heart rate monitor, BLE tracker</Typography>}
              />
            </MenuItem>
            <MenuItem onClick={() => { connectGoogleFit(); setAnchorEl(null); }} sx={{ py: 1.5 }}>
              <ListItemIcon>
                <img src="https://www.gstatic.com/images/branding/product/2x/google_fit_48dp.png" alt="Google Fit" width={22} height={22} />
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="body2" fontWeight="bold">Google Fit</Typography>}
                secondary={<Typography variant="caption" color="text.secondary">Wear OS, Fitbit, Garmin, Samsung</Typography>}
              />
            </MenuItem>
            <MenuItem onClick={() => { startDemo(); setAnchorEl(null); }} sx={{ py: 1.5 }}>
              <ListItemIcon><PlayCircleOutline sx={{ color: '#7c3aed' }} /></ListItemIcon>
              <ListItemText
                primary={<Typography variant="body2" fontWeight="bold">Demo Mode</Typography>}
                secondary={<Typography variant="caption" color="text.secondary">Simulate live health data</Typography>}
              />
            </MenuItem>
          </Menu>
        </>
      )}
    </Box>
  );
}
