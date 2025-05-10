import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  IconButton,
  Popover,
  Badge,
  CircularProgress,
  Box as MuiBox,
} from '@mui/material';
import {
  CalendarToday,
  VideoCall,
  AddCircleOutline,
  NotificationsActive,
} from '@mui/icons-material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNowStrict } from 'date-fns';
import axios from 'axios';
import Confetti from 'react-confetti';
import useWindowSize from 'react-use/lib/useWindowSize';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const healthProgressData = [
  { date: '2025-01-01', steps: 3000 },
  { date: '2025-01-02', steps: 4000 },
  { date: '2025-01-03', steps: 3500 },
  { date: '2025-01-04', steps: 5000 },
];

const NotificationPanel = ({ notifications }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box>
      <IconButton onClick={handleClick} aria-label="notifications">
        <Badge badgeContent={notifications.length} color="error">
          <NotificationsActive />
        </Badge>
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Notifications</Typography>
          <Box sx={{ mt: 2 }}>
            {notifications.map((notification, index) => (
              <Typography key={index} variant="body2">
                {notification}
              </Typography>
            ))}
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};

const ProgressChart = () => (
  <ResponsiveContainer width="100%" height={200}>
    <LineChart data={healthProgressData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="steps" stroke="#1E5DA9" />
    </LineChart>
  </ResponsiveContainer>
);

const EnhancedGoalTracker = ({ goal, currentValue }) => {
  const progress = Math.min((currentValue / goal) * 100, 100);
  const getMessage = () => {
    if (progress >= 100) return "Great job! You've met your goal!";
    if (progress >= 75) return "Almost there! Keep going 💪";
    if (progress >= 50) return "You're halfway done!";
    return "Let's get started!";
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      <MuiBox sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          value={progress}
          size={120}
          thickness={5}
          sx={{ color: '#1E5DA9' }}
        />
        <MuiBox
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <FitnessCenterIcon sx={{ color: '#1E5DA9', mb: 1 }} />
          <Typography variant="h6">{`${Math.round(progress)}%`}</Typography>
        </MuiBox>
      </MuiBox>
      <Typography variant="body2" sx={{ mt: 2 }}>
        {currentValue} / {goal} steps
      </Typography>
      <Typography variant="caption" sx={{ color: 'gray' }}>
        {getMessage()}
      </Typography>
    </Box>
  );
};



export default function PatientDashboard() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [confetti, setConfetti] = useState(false);
  const { width, height } = useWindowSize();
  const [notifications] = useState(['New appointment scheduled', 'Medication reminder']);
  const [patientName, setPatientName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [loading, setLoading] = useState(true);

  const profileInitials = 'SP';
  const patientId = 123;

  useEffect(() => {
    const name = localStorage.getItem("patientName");

    if (name) {
      setPatientName(name);
    }

    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      setGreeting("Good Morning");
    } else if (currentHour < 18) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }
  }, []);


  useEffect(() => {
    axios
      .get(`http://localhost:8000/patient/appointments/${patientId}`)
      .then((res) => {
        setAppointments(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const nextAppointment = appointments.length > 0 ? appointments[0] : null;

  useEffect(() => {
    const booked = localStorage.getItem('appointmentBooked');
    if (booked === 'true') {
      setConfetti(true);
      setTimeout(() => {
        setConfetti(false);
        localStorage.removeItem('appointmentBooked');
      }, 4000);
    }
  }, []);

  const AnimatedCard = ({ children, delay = 0.1 }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.03 }}
      style={{ borderRadius: '8px' }}
    >
      {children}
    </motion.div>
  );

  const cardStyles = {
    height: '100%',
    borderLeft: '4px solid #1E5DA9',
    boxShadow: '0 4px 12px rgba(30, 93, 169, 0.2)',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      boxShadow: '0 8px 20px rgba(30, 93, 169, 0.4)',
    },
  };

  return (
    <Box sx={{ p: 3, mt: 8 }}>
      {confetti && <Confetti width={width} height={height} />}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: '#1E5DA9', width: 56, height: 56, fontSize: '20px' }}>{profileInitials}</Avatar>
          <Box>
            <Typography variant="h5" sx={{ color: '#1E5DA9' }}>
              {greeting}, {patientName || "Patient"}!
            </Typography>
            <Typography variant="body1" sx={{ color: 'gray' }}>
            Welcome to your dashboard. Here you can manage your appointments, view medical information, and more.
            </Typography>
          </Box>
        </Box>
        <NotificationPanel notifications={notifications} />
      </Box>

      <Grid container spacing={3}>
        {/* Upcoming Appointments */}
        <Grid item xs={12} md={4}>
          <AnimatedCard delay={0.1}>
            <Card sx={cardStyles}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarToday sx={{ color: '#1E5DA9', mr: 2 }} />
                  <Typography variant="h6">Upcoming Appointments</Typography>
                </Box>
                {loading ? (
                  <CircularProgress />
                ) : (
                  <Typography variant="body1">
                    You have {appointments.length} {appointments.length === 1 ? 'appointment' : 'appointments'}
                  </Typography>
                )}

                {nextAppointment && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      Next: {new Date(nextAppointment.date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'gray' }}>
                      Doctor: {nextAppointment.doctor}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, color: 'green' }}>
                      Your appointment is in {formatDistanceToNowStrict(new Date(nextAppointment.date), { addSuffix: true })}
                    </Typography>
                    <Button
                      variant="outlined"
                      sx={{ mt: 1, color: '#1E5DA9', borderColor: '#1E5DA9' }}
                      onClick={() => navigate('/patient/video-call')}
                    >
                      Join Video Call
                    </Button>
                  </Box>
                )}
                <Button
                  variant="contained"
                  sx={{ bgcolor: '#1E5DA9', mt: 2, '&:hover': { bgcolor: '#154281' }, borderRadius: '20px', px: 3 }}
                  onClick={() => navigate('/patient/appointments')}
                >
                  View All
                </Button>
              </CardContent>
            </Card>
          </AnimatedCard>
        </Grid>

        {/* Book Appointment */}
        <Grid item xs={12} md={4}>
          <AnimatedCard delay={0.2}>
            <Card sx={cardStyles}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AddCircleOutline sx={{ color: '#1E5DA9', mr: 2 }} />
                  <Typography variant="h6">Book Appointment</Typography>
                </Box>
                <Typography variant="body1">Schedule a new consultation</Typography>
                <Button
                  variant="contained"
                  sx={{ bgcolor: '#1E5DA9', mt: 2, '&:hover': { bgcolor: '#154281' }, borderRadius: '20px', px: 3 }}
                  onClick={() => navigate('/patient/book')}
                >
                  Book Now
                </Button>
              </CardContent>
            </Card>
          </AnimatedCard>
        </Grid>

        {/* Video Consultation */}
        <Grid item xs={12} md={4}>
          <AnimatedCard delay={0.35}>
            <Card sx={cardStyles}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <VideoCall sx={{ color: '#1E5DA9', mr: 2 }} />
                  <Typography variant="h6">Video Consultation</Typography>
                </Box>
                <Typography variant="body1">Connect with your doctor online</Typography>
                <Button
                  variant="contained"
                  sx={{ bgcolor: '#1E5DA9', mt: 2, '&:hover': { bgcolor: '#154281' }, borderRadius: '20px', px: 3 }}
                  onClick={() => navigate('/patient/video-call')}
                >
                  Join Now
                </Button>
              </CardContent>
            </Card>
          </AnimatedCard>
        </Grid>

        {/* Health Progress */}
        <Grid item xs={12} md={6}>
          <AnimatedCard delay={0.4}>
            <Card sx={cardStyles}>
              <CardContent>
                <Typography variant="h6">Health Progress</Typography>
                <ProgressChart />
              </CardContent>
            </Card>
          </AnimatedCard>
        </Grid>

        {/* Enhanced Goal Tracker */}
        <Grid item xs={12} md={6}>
          <AnimatedCard delay={0.5}>
            <Card sx={cardStyles}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Exercise Goal</Typography>
                <EnhancedGoalTracker goal={10000} currentValue={4500} />
              </CardContent>
            </Card>
          </AnimatedCard>
        </Grid>
      </Grid>

      {/* Emergency Button */}
      <Grid item xs={12} md={4} width={800} sx={{ mt: 4 }}>
          <AnimatedCard delay={0.2}>
            <Card sx={cardStyles}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <VideoCall sx={{ color: '#1E5DA9', mr: 2 }} />
                  <Typography variant="h6">Emergency Call</Typography>
                </Box>
                <Typography variant="body1">In case of emergency</Typography>
                <Button
                  variant="contained"
                  sx={{ bgcolor: 'darkred', mt: 2, '&:hover': { bgcolor: 'darkred' }, borderRadius: '20px', px: 3 }}
                  onClick={() => navigate('/patient/emergency')}
                >
                  Call Now
                </Button>
              </CardContent>
            </Card>
          </AnimatedCard>
        </Grid>
    </Box>
  );
}