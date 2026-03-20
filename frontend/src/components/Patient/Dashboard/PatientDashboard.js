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
  Container,
} from '@mui/material';
import {
  CalendarToday,
  VideoCall,
  AddCircleOutline,
  NotificationsActive,
  Insights,
  FitnessCenter,
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

const ProgressChart = () => (
  <ResponsiveContainer width="100%" height={200}>
    <LineChart data={healthProgressData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="steps" stroke="#008cffff" />
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
          sx={{ color: '#008cffff' }}s
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
          <FitnessCenterIcon sx={{ color: '#008cffff', mb: 1 }} />
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

  const cardStyles = {
    height: '100%',
    borderLeft: `6px solid transparent`,
    backgroundImage: cardColors.appointments,
    color: "white",
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    borderRadius: '16px'
  };

  return (
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
            <Card sx={{
                height: "100%",
                backgroundColor: insightColors[3],
                borderRadius: "16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Insights sx={{ color: "#1E5DA9", mr: 2 }} />
                  <Typography variant="h6">Health Progress</Typography>
                </Box>
                <ProgressChart />
              </CardContent>
            </Card>
          </AnimatedCard>
        </Grid>

        {/* Enhanced Goal Tracker */}
        <Grid item xs={12} md={6}>
          <AnimatedCard delay={0.5}>
            <Card sx={{
                height: "100%",
                backgroundColor: insightColors[4],
                borderRadius: "16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FitnessCenter sx={{ color: "#1E5DA9", mr: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>Exercise Goal</Typography>
                </Box>
                <EnhancedGoalTracker goal={10000} currentValue={4500} />
              </CardContent>
            </Card>
          </AnimatedCard>
        </Grid>
      </Grid>

      {/* Emergency Button */}
      <Grid item xs={12} md={4} width={800} sx={{ mt: 4 }}>
          <AnimatedCard delay={0.2}>
            <Card sx={{
                height: "100%",
                backgroundColor: insightColors[5],
                borderRadius: "16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
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
    </Container>
  );
}