import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Popover,
  Badge,
  CircularProgress,
  Box as MuiBox,
  Container,
  Chip,
  Divider,
} from '@mui/material';
import {
  CalendarToday,
  VideoCall,
  AddCircleOutline,
  NotificationsActive,
  Insights,
  FitnessCenter,
  Favorite,
  LocalFireDepartment,
  DirectionsWalk,
} from '@mui/icons-material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNowStrict } from 'date-fns';
import axios from 'axios';
import Confetti from 'react-confetti';
import useWindowSize from 'react-use/lib/useWindowSize';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import EmergencyMap from './EmergencyMap';
import useHealthData from './useHealthData';
import HealthConnect from './HealthConnect';
import MedicalChatBot from './MedicalChatBot';



const cardColors = {
  appointments: "linear-gradient(135deg, #008CFF 0%, #00E5FF 100%)",
  book: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
  video: "linear-gradient(135deg, #4CAF50 0%, #81C784 100%)",
  health: "linear-gradient(135deg, #FFD93D 0%, #FFB347 100%)",
  goal: "linear-gradient(135deg, #9C27B0 0%, #E040FB 100%)",
  emergency: "linear-gradient(135deg, #B71C1C 0%, #F44336 100%)"
};

const insightColors = [
  "#E3F2FD", 
  "#E8F5E9 ",
  "#FFF3E0",  
  "#EDE7F6",  
  "#E0F2F1 ", 
  "#FFEBEE " 
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

const ProgressChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={200}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
      <YAxis tick={{ fontSize: 11 }} />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="steps" stroke="#008cff" name="Steps" dot={false} strokeWidth={2} />
      <Line type="monotone" dataKey="heartRate" stroke="#ef4444" name="Heart Rate (bpm)" dot={false} strokeWidth={2} />
      <Line type="monotone" dataKey="calories" stroke="#f97316" name="Calories" dot={false} strokeWidth={2} />
    </LineChart>
  </ResponsiveContainer>
);

const EnhancedGoalTracker = ({ goal, currentValue, heartRate, calories, connected }) => {
  const safeValue = currentValue || 0;
  const progress = Math.min((safeValue / goal) * 100, 100);
  const getMessage = () => {
    if (!connected) return 'Connect a device to track live steps';
    if (progress >= 100) return "Great job! You've met your goal! 🎉";
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
          sx={{ color: '#008cff' }}
        />
        <MuiBox sx={{ top:0, left:0, bottom:0, right:0, position:'absolute', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
          <FitnessCenterIcon sx={{ color: '#008cff', mb: 0.5 }} />
          <Typography variant="h6" fontWeight="bold">{`${Math.round(progress)}%`}</Typography>
        </MuiBox>
      </MuiBox>

      <Typography variant="body2" sx={{ mt: 1.5, fontWeight: 'bold' }}>
        {safeValue.toLocaleString()} / {goal.toLocaleString()} steps
      </Typography>
      <Typography variant="caption" sx={{ color: 'gray' }}>{getMessage()}</Typography>

      {/* Live metric chips */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2, flexWrap: 'wrap' }}>
        <Chip
          size="small"
          icon={<Favorite sx={{ fontSize: 14, color: '#ef4444' }} />}
          label={heartRate ? `${heartRate} bpm` : '-- bpm'}
          sx={{ backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 'bold', fontSize: '0.7rem' }}
        />
        <Chip
          size="small"
          icon={<LocalFireDepartment sx={{ fontSize: 14, color: '#f97316' }} />}
          label={calories ? `${calories} kcal` : '-- kcal'}
          sx={{ backgroundColor: '#fff7ed', color: '#c2410c', fontWeight: 'bold', fontSize: '0.7rem' }}
        />
        <Chip
          size="small"
          icon={<DirectionsWalk sx={{ fontSize: 14, color: '#0369a1' }} />}
          label={safeValue ? `${safeValue.toLocaleString()} steps` : '-- steps'}
          sx={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 'bold', fontSize: '0.7rem' }}
        />
      </Box>
    </Box>
  );
};

// ─── AnimatedCard must be outside PatientDashboard to prevent ───────────────
// React from treating it as a new component type on every render,
// which would cause all children to unmount/remount each render cycle.
const AnimatedCard = ({ children, delay = 0.1 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    whileHover={{ scale: 1.03 }}
    style={{ borderRadius: '8px', height: '100%' }}
  >
    {children}
  </motion.div>
);

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [confetti, setConfetti] = useState(false);
  const { width, height } = useWindowSize();

  // ── Health device data ─────────────────────────────────────────────
  const health = useHealthData();
  const isHealthConnected = ['ble', 'gfit', 'demo'].includes(health.connectionStatus);
  const [notifications] = useState(['New appointment scheduled', 'Medication reminder']);
  const [patientName, setPatientName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [loading, setLoading] = useState(true);

  const profileInitials = 'SP';
  const patientId = localStorage.getItem("patientId") || 123;

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
        const now = new Date();
        // Filter out past appointments to properly show upcoming count
        const upcoming = res.data.filter(appt => {
            const apptDate = new Date(appt.appointmentDate || appt.date);
            // Consider the appointment upcoming if its date is today or later
            apptDate.setHours(23, 59, 59, 999);
            return apptDate >= now;
        });
        setAppointments(upcoming);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [patientId]);

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

  return (
    <>
      <Container maxWidth="lg" sx={{ p: { xs: 2, md: 3 }, mt: 3, mb: 4 }}>
      {confetti && <Confetti width={width} height={height} />}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
            <Card sx={{
                height: "100%",
                backgroundColor: insightColors[0],
                borderRadius: "16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
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
                  <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          Next: {new Date(nextAppointment.appointmentDate || nextAppointment.date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'gray' }}>
                          Doctor: {nextAppointment.doctorName || nextAppointment.doctor}
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ color: '#008cffff', borderColor: '#008cffff', textTransform: 'none' }}
                        onClick={() => navigate(`/patient/video-call?roomId=${nextAppointment.roomId || ''}`)}
                      >
                        Join Call
                      </Button>
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1, color: 'green' }}>
                      Your appointment is in {(() => {
                        try {
                           // Attempt to parse date properly to avoid formatDistance errors
                           let dateStr = nextAppointment.appointmentDate || nextAppointment.date;
                           let parsedDate = new Date(dateStr);
                           
                           // Try merging the time if available
                           if (nextAppointment.startTime || nextAppointment.time) {
                             const timeStr = nextAppointment.startTime || nextAppointment.time;
                             const dateOnlyStr = parsedDate.toISOString().split('T')[0];
                             const [timePart, modifier] = timeStr.trim().split(" ");
                             let [hours, minutes] = timePart.split(":");
                             if (hours === '12') hours = '00';
                             if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
                             parsedDate = new Date(`${dateOnlyStr}T${hours}:${minutes}:00`);
                           }
                           return formatDistanceToNowStrict(parsedDate, { addSuffix: true });
                        } catch(e) { 
                           return 'upcoming'; 
                        }
                      })()}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-start' }}>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: '#62b8ffff', mt: 1.5, '&:hover': { bgcolor: '#62b8ffff' }, borderRadius: '20px', px: 3 }}
                    onClick={() => navigate('/patient/appointments')}
                  >
                    View All
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </AnimatedCard>
        </Grid>

        {/* Book Appointment */}
        <Grid item xs={12} md={4}>
          <AnimatedCard delay={0.2}>
            <Card sx={{
                height: "100%",
                backgroundColor: insightColors[1],
                borderRadius: "16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AddCircleOutline sx={{ color: '#1E5DA9', mr: 2 }} />
                  <Typography variant="h6">Book Appointment</Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>Schedule a new consultation</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Browse our network of top specialists, access real-time calendar availability, and lock in your appointment instantly without the wait. Enjoy a seamless booking experience built around your convenience.
                </Typography>
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-start' }}>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: '#62b8ffff', mt: 1.5, '&:hover': { bgcolor: '#62b8ffff' }, borderRadius: '20px', px: 3 }}
                    onClick={() => navigate('/patient/book')}
                  >
                    Book Now
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </AnimatedCard>
        </Grid>

        {/* Video Consultation */}
        <Grid item xs={12} md={4}>
          <AnimatedCard delay={0.35}>
            <Card sx={{
                height: "100%",
                backgroundColor: insightColors[2],
                borderRadius: "16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <VideoCall sx={{ color: '#1E5DA9', mr: 2 }} />
                  <Typography variant="h6">Video Consultation</Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>Connect with your doctor online</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Experience secure, high-quality virtual appointments from the comfort of your home. Get immediate medical advice, follow-ups, and prescriptions without having to step outside.
                </Typography>
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-start' }}>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: '#62b8ffff', mt: 1.5, '&:hover': { bgcolor: '#62b8ffff' }, borderRadius: '20px', px: 3 }}
                    onClick={() => navigate('/patient/video-call')}
                  >
                    Join Now
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </AnimatedCard>
        </Grid>

        {/* Health Progress */}
        <Grid item xs={12} md={6}>
          <AnimatedCard delay={0.4}>
            <Card sx={{ height: '100%', backgroundColor: insightColors[3], borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Insights sx={{ color: '#1E5DA9', mr: 1 }} />
                    <Typography variant="h6">Health Progress</Typography>
                  </Box>
                  <HealthConnect {...health} />
                </Box>
                {!isHealthConnected && (
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
                    Showing demo data — connect a device for live readings
                  </Typography>
                )}
                <ProgressChart data={health.history} />
              </CardContent>
            </Card>
          </AnimatedCard>
        </Grid>

        {/* Exercise Goal */}
        <Grid item xs={12} md={6}>
          <AnimatedCard delay={0.5}>
            <Card sx={{ height: '100%', backgroundColor: insightColors[4], borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FitnessCenter sx={{ color: '#1E5DA9', mr: 1 }} />
                    <Typography variant="h6">Exercise Goal</Typography>
                  </Box>
                  <HealthConnect {...health} />
                </Box>
                <EnhancedGoalTracker
                  goal={10000}
                  currentValue={health.steps}
                  heartRate={health.heartRate}
                  calories={health.calories}
                  connected={isHealthConnected}
                />
              </CardContent>
            </Card>
          </AnimatedCard>
        </Grid>
      </Grid>

      {/* Emergency Map */}
      <Grid item xs={12} sx={{ mt: 2 }}>
        <AnimatedCard delay={0.6}>
          <Card sx={{
              backgroundColor: "#fff",
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#1E5DA9', fontWeight: 'bold' }}>Local Emergency Services</Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Showing nearby hospitals, clinics, and pharmacies based on your location.
              </Typography>
              <EmergencyMap />
            </CardContent>
          </Card>
        </AnimatedCard>
      </Grid>
    </Container>

    {/* Floating Medical Chatbot — fixed overlay, visible on all scroll positions */}
    <MedicalChatBot />
  </>
  );
}