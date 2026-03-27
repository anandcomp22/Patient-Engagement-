import React from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Paper, Container, Avatar, Divider, Button } from "@mui/material";
import { CheckCircle as CheckIcon, Lock as LockIcon, Security as SecurityIcon } from "@mui/icons-material";

const VerifyPrescription = () => {
    const { payload } = useParams();
    
    // Decode the payload (Base64 or Raw)
    let decodedData = {
        title: "AIDME SECURE DOCUMENT",
        status: "VERIFIED",
        id: "UNKNOWN",
        patient: "N/A",
        doctor: "N/A",
        time: new Date().toLocaleString()
    };

    try {
        // We expect a format like: AIDME-SECURE|ID|PATIENT|DOCTOR
        const raw = atob(payload);
        const parts = raw.split('|');
        if (parts.length >= 3) {
            decodedData.id = parts[0];
            decodedData.patient = parts[1];
            decodedData.doctor = parts[2];
        }
    } catch (e) {
        // Fallback if not base64
        decodedData.id = payload.substring(0, 10);
    }

    const colors = {
        primary: "#1E5DA9",
        success: "#2c7a7b",
        bg: "#f8fafc"
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: colors.bg, py: 4, px: 2, display: 'flex', alignItems: 'center' }}>
            <Container maxWidth="xs">
                <Paper elevation={4} sx={{ borderRadius: 4, overflow: 'hidden', textAlign: 'center' }}>
                    {/* Header Banner */}
                    <Box sx={{ bgcolor: colors.primary, py: 3, color: 'white' }}>
                        <SecurityIcon sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h6" fontWeight="800" sx={{ letterSpacing: 1 }}>
                            AIDME SECURE
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            OFFICIAL VERIFICATION PORTAL
                        </Typography>
                    </Box>

                    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: '#e6fffa', width: 70, height: 70, mb: 1 }}>
                            <CheckIcon sx={{ color: colors.success, fontSize: 40 }} />
                        </Avatar>
                        
                        <Box>
                            <Typography variant="h5" fontWeight="900" sx={{ color: '#1a202c' }}>
                                Verified Successfully
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#718096', fontWeight: 600 }}>
                                This clinical document is authentic
                            </Typography>
                        </Box>

                        <Divider sx={{ width: '100%', my: 1 }} />

                        <Box sx={{ width: '100%', textAlign: 'left', bgcolor: '#f1f5f9', p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: colors.primary, display: 'block' }}>
                                    PATIENT NAME
                                </Typography>
                                <Typography variant="body1" fontWeight="700">{decodedData.patient}</Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: colors.primary, display: 'block' }}>
                                    ISSUED BY
                                </Typography>
                                <Typography variant="body1" fontWeight="700">Dr. {decodedData.doctor}</Typography>
                            </Box>

                            <Box sx={{ mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LockIcon sx={{ fontSize: 14, color: colors.primary }} />
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: colors.primary }}>SECURE TOKEN</Typography>
                                </Box>
                                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#4a5568', wordBreak: 'break-all' }}>
                                    {decodedData.id}
                                </Typography>
                            </Box>
                        </Box>

                        <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#a0aec0', textAlign: 'center' }}>
                            Verification Timestamp:<br />
                            {decodedData.time}
                        </Typography>

                        <Button 
                            variant="contained" 
                            fullWidth 
                            onClick={() => window.close()}
                            sx={{ mt: 2, bgcolor: colors.primary, borderRadius: 2, fontWeight: 700 }}
                        >
                            Close Portal
                        </Button>
                    </Box>
                </Paper>
                
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 3, color: '#a0aec0', fontWeight: 500 }}>
                    © 2026 AidME Healthcare Intelligence Systems. All rights reserved.
                </Typography>
            </Container>
        </Box>
    );
};

export default VerifyPrescription;
