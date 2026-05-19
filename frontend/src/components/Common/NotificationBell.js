import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  CircularProgress
} from '@mui/material';
import { Notifications, CheckCircleOutline, ClearAll, InfoOutlined } from '@mui/icons-material';
import { io } from 'socket.io-client';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const NotificationBell = ({ role, userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);

  // Derive unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (!userId || !role) return;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${API}/api/notifications/${role}/${userId}`);
        setNotifications(res.data);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();

    // Connect to Socket
    const socket = io(API);
    socket.emit('join-notifications', { role, userId });

    socket.on('new-notification', (notification) => {
      // Add new notification to the top
      setNotifications(prev => [notification, ...prev]);
      
      // Optional: you could trigger a toast/snackbar here
    });

    return () => {
      socket.disconnect();
    };
  }, [role, userId]);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API}/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API}/api/notifications/${role}/${userId}/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const clearAll = async () => {
    try {
      await axios.delete(`${API}/api/notifications/${role}/${userId}`);
      setNotifications([]);
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  return (
    <>
      <IconButton sx={{ color: "gray" }} onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error" overlap="circular">
          <Notifications />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 350,
            maxHeight: 450,
            overflowY: 'auto',
            borderRadius: '16px',
            mt: 1.5,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, bgcolor: 'white', zIndex: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Notifications
          </Typography>
          <Box>
            {unreadCount > 0 && (
              <Button size="small" sx={{ textTransform: 'none', fontSize: '0.75rem' }} onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
          </Box>
        </Box>
        <Divider />

        {loading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'gray' }}>
            <Notifications sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
            <Typography variant="body2">No notifications yet.</Typography>
          </Box>
        ) : (
          notifications.map((notif) => (
            <MenuItem 
              key={notif._id} 
              sx={{ 
                py: 1.5, 
                px: 2, 
                whiteSpace: 'normal',
                bgcolor: notif.isRead ? 'transparent' : '#f0f7ff',
                '&:hover': { bgcolor: '#f8fafc' },
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5
              }}
              onClick={() => {
                if (!notif.isRead) markAsRead(notif._id);
              }}
            >
              <Box sx={{ pt: 0.5 }}>
                {notif.isRead ? (
                  <CheckCircleOutline sx={{ color: 'gray', fontSize: 20 }} />
                ) : (
                  <InfoOutlined sx={{ color: '#3b82f6', fontSize: 20 }} />
                )}
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: notif.isRead ? 'normal' : 'bold', color: '#1e293b' }}>
                  {notif.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem', mt: 0.5 }}>
                  {notif.message}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5, display: 'block' }}>
                  {dayjs(notif.createdAt).fromNow()}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}

        {notifications.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'center', position: 'sticky', bottom: 0, bgcolor: 'white' }}>
              <Button 
                startIcon={<ClearAll />} 
                size="small" 
                color="error" 
                sx={{ textTransform: 'none' }}
                onClick={clearAll}
              >
                Clear All
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
