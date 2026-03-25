import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from "../../../apiConfig";
import { 
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Link, 
  FormControl,
  FormControlLabel,
  OutlinedInput,
  InputAdornment,
  IconButton,
  FormHelperText,
  MenuItem, Snackbar, Alert,
  Select, Chip, Paper, Checkbox, CircularProgress
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff,
  LocalHospital,
} from '@mui/icons-material';

const countries = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia'];
const statesByCountry = {
  'India': ['Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Tamil Nadu', 'Delhi'],
  'United States': ['California', 'Texas', 'New York', 'Florida', 'Illinois'],
};
const districtsByState = {
  'Karnataka': ['Bangalore Urban', 'Mysore', 'Belgaum', 'Mangalore'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik'],
};

const PatientSignUp = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    country: '',
    state: '',
    district: '',
    gender: '',
    bloodgroup: '',
    allergies: '',
    emergencyName: '',
    emergencyContact: '',
    emergencyRelation: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });

  const [errors, setErrors] = useState({});
  const [availableStates, setAvailableStates] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'country') {
      setAvailableStates(statesByCountry[value] || []);
      setFormData(prev => ({ ...prev, state: '', district: '' }));
      setAvailableDistricts([]);
    } else if (name === 'state') {
      setAvailableDistricts(districtsByState[value] || []);
      setFormData(prev => ({ ...prev, district: '' }));
    }

    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

    const inputStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 3,
      backgroundColor: "#ffffff",
      "& fieldset": {
        borderColor: "#dbe7ff",
        borderWidth: 2,
      },
      "&:hover fieldset": {
        borderColor: "#0d6efd",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#0d6efd",
      },
    },

    mb: 1,
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (!["male", "female", "other"].includes(formData.gender)) {
      newErrors.gender = "Invalid gender value";
    }

    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Confirm password is required";


    if (!formData.gender) newErrors.gender = "Gender is required";

    if (!formData.emergencyName)
      newErrors.emergencyName = "Emergency contact name required";

    if (!/^[0-9]{10}$/.test(formData.emergencyContact))
      newErrors.emergencyContact = "Valid emergency number required";


    if (!formData.termsAccepted) {
      newErrors.termsAccepted = "You must accept the terms";
    }
    
    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 1 || age > 120) {
        newErrors.dob = 'Please enter a valid date of birth';
      }
    }

    if (!formData.country) newErrors.country = 'Country is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.district) newErrors.district = 'District is required';
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setSnackbarSeverity("error");
      setSnackbarMessage("Passwords do not match");
      setSnackbarOpen(true);
      return;
    }

    if (validate()) {
      try {
        setIsSubmitting(true);
        const res = await axios.post(`${API_BASE}/patient/signup`, {
          ...formData,
          emergencycontact: {
            ename: formData.emergencyName,
            econtact: formData.emergencyContact,
            relation: formData.emergencyRelation
          }
        });
          
        if (res.status === 201) {
          setSnackbarSeverity("success");
          setSnackbarMessage("Patient registered successfully");
          setSnackbarOpen(true);

          setTimeout(() => navigate("/"), 1500);
        }
      } catch (err) {
        alert("Registration Failed: " + err.response?.data?.message);
      }
    }
  };
  

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 2, md: 10 },
        display: "flex",
        alignItems: "center",
        width: "100%",
        background: "radial-gradient(circle at top, #eef6ff 0%, #ffffff 60%)",
      }}
      >
    <Grid
      container
      spacing={3}
      sx={{ height: "100vh" }} 
      >
    <Grid
        item
        xs={12}
        md={5}
        sx={{
          position: "sticky",
          top: 200,
          height: "fit-content"
        }}
      >
        <Chip
          icon={<LocalHospital />}
          label="Patient Registration"
          sx={{
            mb: 3,
            px: 2,
            py: 1,
            borderRadius: 3,
            bgcolor: "#ffffff",
            fontWeight: 600,
            boxShadow: 2,
          }}
        />

        <Typography variant="h3" fontWeight="800" color="#0b428f" lineHeight={1.2}>
          Easy Access to
          <br />
          Quality Care
        </Typography>

        <Typography
          variant="body1"
          sx={{ mt: 3, color: "#5f6f86", maxWidth: 520, lineHeight: 1.7 }}
        >
          Create your account to book appointments 
          <br />and manage your healthcare online.
        </Typography>
      </Grid>

      <Grid
          item
          xs={12}
          md={6}
          sx={{
            height: "100vh",
            pr: 1 
          }}
        >
        <Paper
            elevation={6}
            sx={{
              p: 2.5,
              borderRadius: 4,
              width: "100%",
              mx: "auto",
              background: "linear-gradient(135deg, #f4f9ff, #ffffff)",
              boxShadow: "0 20px 60px rgba(13,110,253,0.15)",
              mt: 10,
              mb: 10,
            }}
            >
          <form onSubmit={handleSubmit} sx={{ mt: 2, width: "100%" }}>
              <Box sx={{ display: "flex", mb: 4, gap: 2, justifyContent: 'space-between', alignItems: 'center', px: 20}}>
                <Button
                  variant={RegisterType === "patient" ? "contained" : "outlined"}
                  fullWidth
                  sx={{
                    borderRadius: 2,
                  }}
                  onClick={() => navigate("/patient/signup")}
                >
                  Patient Register 
                </Button>
              </Box> 


        <Grid container spacing={1.5}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" fontWeight={600}>First Name</Typography>
            <TextField
              fullWidth
              name="firstName"
              size="small"
              value={formData.firstName}
              onChange={handleChange}
              error={!!errors.firstName}
              helperText={errors.firstName}
              sx={inputStyle}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" fontWeight={600}>Middle Name</Typography>
            <TextField
              fullWidth
              size="small"
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
              error={!!errors.middleName}
              helperText={errors.middleName}
              sx={inputStyle}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" fontWeight={600}>Last Name</Typography>
            <TextField
              fullWidth
              size="small"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              error={!!errors.lastName}
              helperText={errors.lastName}
              sx={inputStyle}
            />
          </Grid>
          </Grid>

        <Grid container spacing={1.5}>
          <Grid item xs={12} md={3.5}>
            <Typography variant="body2" fontWeight={600}>Date of Birth</Typography>
            <TextField
              fullWidth
              type="date"
              size="small"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              error={!!errors.dob}
              helperText={errors.dob}
              sx={inputStyle}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <Typography variant="body2" fontWeight={600}>Email</Typography>
            <TextField
              fullWidth
              name="email"
              size="small"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              sx={inputStyle}
            />
          </Grid>          

          <Grid item xs={12} sm={3.5}>
            <Typography variant="body2" fontWeight={600}>Phone Number</Typography>
            <TextField
              fullWidth
              name="phone"
              size="small"
              value={formData.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone}
              sx={inputStyle}
            />
          </Grid>   
        </Grid>       

        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight={600}>Country</Typography>
            <FormControl fullWidth error={!!errors.country} size="small">
              <Select
                name="country"
                value={formData.country}
                onChange={handleChange}
                sx={{
                  ...inputStyle,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#dbe7ff",
                    borderWidth: 2,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#0d6efd",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#0d6efd",
                  },
                }}
              >
                {countries.map((country) => (
                  <MenuItem key={country} value={country}>
                    {country}
                  </MenuItem>
                ))}
              </Select>
              {errors.country && <FormHelperText>{errors.country}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight={600}>State</Typography>
            <FormControl fullWidth error={!!errors.state} size="small">
              <Select
                name="state"
                value={formData.state}
                onChange={handleChange}
                disabled={!formData.country}
                sx={{
                  ...inputStyle,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#dbe7ff",
                    borderWidth: 2,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#0d6efd",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#0d6efd",
                  },
                }}
              >
                {availableStates.map((state) => (
                  <MenuItem key={state} value={state}>
                    {state}
                  </MenuItem>
                ))}
              </Select>
              {errors.state && <FormHelperText>{errors.state}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight={600}>District</Typography>
            <FormControl fullWidth error={!!errors.district} size="small" >
              <Select
                name="district"
                value={formData.district}
                onChange={handleChange}
                disabled={!formData.state}
                sx={{
                  ...inputStyle,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#dbe7ff",
                    borderWidth: 2,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#0d6efd",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#0d6efd",
                  },
                }}
              >
                {availableDistricts.map((district) => (
                  <MenuItem key={district} value={district}>
                    {district}
                  </MenuItem>
                ))}
              </Select>
              {errors.district && <FormHelperText>{errors.district}</FormHelperText>}
            </FormControl>
          </Grid>
          </Grid>

          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" fontWeight={600}>Gender</Typography>
              <FormControl fullWidth size="small" error={!!errors.gender}>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  sx={inputStyle}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
                {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" fontWeight={600}>Blood Group</Typography>
              <Select
                fullWidth
                size="small"
                name="bloodgroup"
                value={formData.bloodgroup}
                onChange={handleChange}
                sx={inputStyle}
                >
                {bloodGroups.map((group) => (
                  <MenuItem key={group} value={group}>
                    {group}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight={600}>Allergies (if any)</Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={1}
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                sx={inputStyle}
              />
            </Grid>
            </Grid>

        <Grid xs={12}>
          <Typography variant="h6" mt={1} mb={1}>
            Emergency Contact
          </Typography>
         <Grid container spacing={1.5}>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight={600}>Name</Typography>
            <TextField
              fullWidth
              size="small"
              name="emergencyName"
              value={formData.emergencyName}
              onChange={handleChange}
              sx={inputStyle}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight={600}>Contact Number</Typography>
            <TextField
              fullWidth
              size="small"
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleChange}
              sx={inputStyle}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight={600}>Relation</Typography>
            <TextField
              fullWidth
              size="small"
              name="emergencyRelation"
              value={formData.emergencyRelation}
              onChange={handleChange}
              sx={inputStyle}
            />
          </Grid>
        </Grid>
        </Grid>

        <Grid container spacing={1.5}>
          <Grid item xs={12}>
            <Typography variant="body2" fontWeight={600}>Password</Typography>
            <FormControl fullWidth variant="outlined" error={!!errors.password} size="small">
              <OutlinedInput
                name="password"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                  sx={{
                    borderRadius: 3,
                    backgroundColor: "#ffffff",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#dbe7ff",
                      borderWidth: 2,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#0d6efd",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#0d6efd",
                    },
                  }}
                endAdornment={
                  <InputAdornment position="end">
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, mt: 0.8 }}>
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </Box>
                  </InputAdornment>
                }
                />
                {errors.password && <FormHelperText>{errors.password}</FormHelperText>}
              </FormControl>
            </Grid>
  
            <Grid item xs={12} mb={4}>
              <Typography variant="body2" fontWeight={600}>Confirm Password</Typography>
              <FormControl fullWidth variant="outlined" error={!!errors.confirmPassword} size="small">
                <OutlinedInput
                  name="confirmPassword"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                    sx={{
                      borderRadius: 3,
                      backgroundColor: "#ffffff",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#dbe7ff",
                        borderWidth: 2,
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#0d6efd",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#0d6efd",
                      },
                    }}
                  endAdornment={
                    <InputAdornment position="end">
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, mt: 0.8 }}>
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </Box>
                    </InputAdornment>
                  }
                />
                {errors.confirmPassword && <FormHelperText>{errors.confirmPassword}</FormHelperText>}
              </FormControl>
              </Grid>
            </Grid>

      <Grid container spacing={1.5} mt={-4}>
        <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                    name="termsAccepted"
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    I accept the{' '}
                    <Link component={RouterLink} to="/terms" target="_blank" rel="noopener">
                      Terms and Conditions
                    </Link>
                  </Typography>
                }
              />
              {errors.termsAccepted && (
                <Typography variant="caption" color="error">
                  {errors.termsAccepted}
                </Typography>
              )}
            </Grid>
            </Grid>            
        
        <Button
          type="submit"
          fullWidth
          disabled={isSubmitting}
          sx={{
            mt: 1,
            py: 1.5,
            borderRadius: 2,
            background: "linear-gradient(135deg, #bee3fdff, #008cffff)",
            fontWeight: 700,
          }}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={24} sx={{ color: 'inherit', mr: 2 }} />
              Registering...
            </>
          ) : (
            'Sign Up'
          )}
        </Button>
        
        <Grid container justifyContent="flex-end">
          <Grid item>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link href="/" variant="body2" sx={{ color: '#1E5DA9' }}>
                Sign in
              </Link>
            </Typography>
          </Grid>
        </Grid>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity={snackbarSeverity} variant="filled">
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </form>
      </Paper>
      </Grid>
    </Grid>
    </Box>
  );
};

export default PatientSignUp;