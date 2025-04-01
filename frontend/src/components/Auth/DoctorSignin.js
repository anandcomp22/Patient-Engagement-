import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Link,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  Avatar,
  LinearProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff,
  Upload,
  Email,
  Lock,
  ArrowBack,
  Badge,
  CloudUpload,
  CheckCircle,
  Cancel,
  Warning,
  Help,
  Description,
  VerifiedUser,
  Error,
  Info
} from '@mui/icons-material';

const DoctorSignIn = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [licenseFile, setLicenseFile] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(() => {
    const savedStatus = localStorage.getItem('doctorVerificationStatus');
    return savedStatus ? JSON.parse(savedStatus) : null;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [verificationStep, setVerificationStep] = useState(1); 

  useEffect(() => {
    if (verificationStatus) {
      localStorage.setItem('doctorVerificationStatus', JSON.stringify(verificationStatus));
    }
  }, [verificationStatus]);

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const handleRememberMe = (e) => {
    setRememberMe(e.target.checked);
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (verificationStatus !== 'verified') {
      newErrors.verification = 'Medical license must be verified';
      showSnackbar('Please complete license verification first', 'error');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        showSnackbar('Sign in successful! Redirecting...', 'success');
        setTimeout(() => navigate('/doctor/dashboard'), 1000);
      }, 1500);
    }
  };

  const handleLicenseUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showSnackbar('File size exceeds 5MB limit', 'error');
      return;
    }

    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      showSnackbar('Invalid file type. Please upload JPG, PNG, or PDF', 'error');
      return;
    }

    setLicenseFile(file);
    setVerificationStatus('pending');
    setVerificationStep(2);
    showSnackbar('Uploading license file...', 'info');
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
    
    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      const isVerified = Math.random() > 0.3;
      setVerificationStatus(isVerified ? 'verified' : 'rejected');
      setVerificationStep(isVerified ? 3 : 2);
      showSnackbar(
        isVerified 
          ? 'License verified successfully!' 
          : 'License verification failed',
        isVerified ? 'success' : 'error'
      );
    }, 2500);
  };

  const handleRetryVerification = () => {
    setLicenseFile(null);
    setVerificationStatus(null);
    setVerificationStep(1);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showSnackbar('Please upload your license again', 'info');
  };

  const handleTriggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleCloseVerificationDialog = () => {
    if (verificationStatus === 'verified') {
      setVerificationDialogOpen(false);
    } else {
      setVerificationDialogOpen(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
          Doctor Sign In
        </Typography>
      </Box>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth variant="outlined" error={!!errors.password}>
              <InputLabel>Password</InputLabel>
              <OutlinedInput
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                startAdornment={
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                }
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label="Password"
              />
              {errors.password && <FormHelperText>{errors.password}</FormHelperText>}
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mt: 1
        }}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={rememberMe} 
                onChange={handleRememberMe} 
                color="primary" 
              />
            }
            label="Remember me"
          />
          <Link 
            href="/doctor/forgot-password" 
            variant="body2" 
            sx={{ color: '#1E5DA9' }}
          >
            Forgot password?
          </Link>
        </Box>

        <Card variant="outlined" sx={{ mt: 3, mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <Badge color="primary" sx={{ mr: 1 }} />
              License Verification
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={
                  verificationStatus === 'verified' ? 'Verified' :
                  verificationStatus === 'pending' ? 'Verification in Progress' :
                  verificationStatus === 'rejected' ? 'Verification Failed' :
                  'Not Verified'
                }
                color={
                  verificationStatus === 'verified' ? 'success' :
                  verificationStatus === 'pending' ? 'warning' :
                  verificationStatus === 'rejected' ? 'error' : 'default'
                }
                avatar={
                  verificationStatus === 'verified' ? (
                    <Avatar sx={{ bgcolor: 'success.main' }}><VerifiedUser /></Avatar>
                  ) : verificationStatus === 'pending' ? (
                    <Avatar sx={{ bgcolor: 'warning.main' }}><CircularProgress size={20} color="inherit" /></Avatar>
                  ) : verificationStatus === 'rejected' ? (
                    <Avatar sx={{ bgcolor: 'error.main' }}><Error /></Avatar>
                  ) : (
                    <Avatar><Badge /></Avatar>
                  )
                }
                sx={{ flexShrink: 0 }}
              />
              
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {verificationStatus === 'verified' ? 'Your license has been verified and approved' :
                   verificationStatus === 'pending' ? 'Verification process in progress' :
                   verificationStatus === 'rejected' ? 'License verification failed. Please try again.' :
                   'Medical license verification required for sign in'}
                </Typography>
              </Box>
              
              <Button 
                variant="outlined"
                startIcon={<CloudUpload />}
                onClick={() => setVerificationDialogOpen(true)}
                sx={{ 
                  color: '#1E5DA9', 
                  borderColor: '#1E5DA9',
                  whiteSpace: 'nowrap'
                }}
              >
                {verificationStatus ? 'Update' : 'Verify'}
              </Button>
            </Box>

            {verificationStatus === 'rejected' && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Verification failed. Please upload a valid license document.
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>

        {errors.verification && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.verification}
          </Alert>
        )}

        <Dialog 
          open={verificationDialogOpen} 
          onClose={handleCloseVerificationDialog} 
          fullWidth 
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 2
            }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: '1px solid #eee', 
            pb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: '#f9f9f9'
          }}>
            <Badge color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" component="div">
              Medical License Verification
            </Typography>
          </DialogTitle>
          
          <DialogContent sx={{ pt: 3 }}>
            {verificationStep === 1 && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CloudUpload sx={{ 
                  fontSize: 60, 
                  color: '#1E5DA9', 
                  mb: 2,
                  opacity: 0.8
                }} />
                
                <Typography variant="h6" gutterBottom>
                  Upload Your Medical License
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Please upload a clear photo or scan of your medical license certificate.
                  Supported formats: JPG, PNG, PDF (Max 5MB)
                </Typography>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleLicenseUpload}
                />
                
                <Button
                  variant="contained"
                  onClick={handleTriggerUpload}
                  startIcon={<Upload />}
                  sx={{ 
                    backgroundColor: '#1E5DA9',
                    '&:hover': {
                      backgroundColor: '#154281'
                    },
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem'
                  }}
                >
                  Select File
                </Button>
                
                <Box sx={{ mt: 4 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    License Requirements:
                  </Typography>
                  <List dense sx={{ textAlign: 'left' }}>
                    <ListItem>
                      <ListItemIcon><Info color="info" /></ListItemIcon>
                      <ListItemText primary="Clear image of your official medical license" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Info color="info" /></ListItemIcon>
                      <ListItemText primary="All text must be readable" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Info color="info" /></ListItemIcon>
                      <ListItemText primary="License number and expiration date visible" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Info color="info" /></ListItemIcon>
                      <ListItemText primary="No password protection on PDF files" />
                    </ListItem>
                  </List>
                </Box>
              </Box>
            )}

            {verificationStep === 2 && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CircularProgress 
                  variant={uploadProgress < 100 ? 'determinate' : 'indeterminate'}
                  value={uploadProgress}
                  size={80}
                  thickness={4}
                  sx={{ 
                    color: '#1E5DA9', 
                    mb: 3,
                    '& circle': {
                      strokeLinecap: 'round'
                    }
                  }}
                />
                
                <Typography variant="h6" gutterBottom>
                  {uploadProgress < 100 ? 'Uploading License' : 'Verifying License'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {uploadProgress < 100 
                    ? 'Please wait while we upload your document...'
                    : 'Verifying with medical board registry...'}
                </Typography>
                
                {uploadProgress < 100 && (
                  <Box sx={{ width: '80%', mx: 'auto', mt: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={uploadProgress} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      {uploadProgress}% uploaded
                    </Typography>
                  </Box>
                )}
                
                {licenseFile && (
                  <Chip
                    label={licenseFile.name}
                    icon={<Description />}
                    sx={{ 
                      mt: 3,
                      maxWidth: '100%',
                      '& .MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }
                    }}
                  />
                )}
              </Box>
            )}

            {verificationStep === 3 && verificationStatus === 'verified' && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CheckCircle sx={{ 
                  fontSize: 80, 
                  color: 'success.main', 
                  mb: 2,
                  '& path': {
                    fillOpacity: 0.9
                  }
                }} />
                
                <Typography variant="h5" gutterBottom sx={{ color: 'success.main' }}>
                  Verification Successful!
                </Typography>
                
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Your medical license has been verified and approved.
                </Typography>
                
                <Card variant="outlined" sx={{ textAlign: 'left', mb: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      License Details:
                    </Typography>
                    <Typography variant="body2">
                      • File: {licenseFile?.name.substring(0, 20)}...
                    </Typography>
                    <Typography variant="body2">
                      • Verified on: {new Date().toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2">
                      • Status: <Chip label="Active" size="small" color="success" sx={{ ml: 1 }} />
                    </Typography>
                  </CardContent>
                </Card>
                
                <Alert severity="success" sx={{ textAlign: 'left' }}>
                  You can now proceed to sign in to your doctor account.
                </Alert>
              </Box>
            )}

            {verificationStep === 2 && verificationStatus === 'rejected' && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Cancel sx={{ 
                  fontSize: 80, 
                  color: 'error.main', 
                  mb: 2,
                  '& path': {
                    fillOpacity: 0.9
                  }
                }} />
                
                <Typography variant="h5" gutterBottom sx={{ color: 'error.main' }}>
                  Verification Failed
                </Typography>
                
                <Alert severity="error" sx={{ textAlign: 'left', mb: 3 }}>
                  We couldn't verify your medical license. Please check:
                </Alert>
                
                <List dense sx={{ textAlign: 'left', mb: 3 }}>
                  <ListItem>
                    <ListItemIcon><Warning color="error" /></ListItemIcon>
                    <ListItemText primary="The document is clear and all text is readable" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Warning color="error" /></ListItemIcon>
                    <ListItemText primary="License number and expiration date are visible" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Warning color="error" /></ListItemIcon>
                    <ListItemText primary="File is not password protected" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Warning color="error" /></ListItemIcon>
                    <ListItemText primary="Document matches your registration details" />
                  </ListItem>
                </List>
                
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={handleRetryVerification}
                    startIcon={<CloudUpload />}
                    sx={{ 
                      backgroundColor: '#1E5DA9',
                      '&:hover': {
                        backgroundColor: '#154281'
                      }
                    }}
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => window.open('/help/license-verification', '_blank')}
                    startIcon={<Help />}
                  >
                    Get Help
                  </Button>
                </Box>
              </Box>
            )}
          </DialogContent>
          
          <DialogActions sx={{ 
            borderTop: '1px solid #eee', 
            p: 2,
            justifyContent: verificationStatus === 'verified' ? 'space-between' : 'flex-end',
            backgroundColor: '#f9f9f9'
          }}>
            {verificationStatus === 'verified' && (
              <Button 
                startIcon={<CheckCircle color="success" />}
                sx={{ 
                  color: 'success.main',
                  '&:hover': {
                    backgroundColor: 'success.light'
                  }
                }}
              >
                Verified
              </Button>
            )}
            <Button 
              onClick={handleCloseVerificationDialog}
              sx={{ color: 'text.secondary' }}
            >
              Close
            </Button>
            {verificationStatus === 'verified' && (
              <Button 
                onClick={() => {
                  setVerificationDialogOpen(false);
                  setTimeout(() => {
                    document.querySelector('button[type="submit"]')?.focus();
                  }, 100);
                }}
                sx={{ 
                  color: '#1E5DA9',
                  fontWeight: 'bold'
                }}
              >
                Continue to Sign In
              </Button>
            )}
          </DialogActions>
        </Dialog>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={verificationStatus !== 'verified' || isSubmitting}
          sx={{ 
            mt: 2,
            mb: 2,
            py: 1.5,
            fontSize: '1rem',
            backgroundColor: verificationStatus !== 'verified' ? 'action.disabledBackground' : '#1E5DA9',
            color: verificationStatus !== 'verified' ? 'text.secondary' : 'white',
            '&:hover': {
              backgroundColor: verificationStatus !== 'verified' ? 'action.disabledBackground' : '#154281'
            },
            '&.Mui-disabled': {
              color: 'text.disabled'
            }
          }}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={24} sx={{ color: 'inherit', mr: 2 }} />
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </Button>

        <Grid container justifyContent="center" sx={{ mt: 1 }}>
          <Grid item>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link href="/doctor/signup" variant="body2" sx={{ color: '#1E5DA9' }}>
                Register as Doctor
              </Link>
            </Typography>
          </Grid>
        </Grid>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          iconMapping={{
            info: <Info fontSize="inherit" />,
            success: <CheckCircle fontSize="inherit" />,
            warning: <Warning fontSize="inherit" />,
            error: <Error fontSize="inherit" />
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DoctorSignIn;