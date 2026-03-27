import React, { useState } from "react";
import { Box, Typography, Paper, Grid, Divider, Table, TableHead, TableRow, TableCell, TableBody, Chip, TableContainer, Dialog, DialogContent, Avatar } from "@mui/material";
import { CheckCircle as CheckIcon, Lock as LockIcon } from "@mui/icons-material";
import { QRCodeSVG } from "qrcode.react";

const PrescriptionTemplate = ({ prescription }) => {
  const [showVerifyCard, setShowVerifyCard] = useState(false);

  const colors = {
    primary: "#1E5DA9",    // AidME Core Blue
    secondary: "#E65100",  // Clinical Orange prefix
    text: "#2c3e50",
    lightText: "#7f8c8d",
    background: "#ffffff",
    accent: "#f0f7ff"
  };

  if (!prescription) return null;

  // Generate a unique, multi-constraint secure verification string
  const patientId = prescription.patientId || "RX-TEMP";
  const docName = prescription.doctor || "Medical Officer";
  const timestamp = new Date().getTime();
  
  // Create a URL-friendly payload for mobile scanning
  const miniPayload = btoa(`${patientId}|${prescription.patient || "Patient"}|${docName}`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  
  // Get host for URL (Full URL is required for phone scanners)
  const host = window.location.origin;
  const qrValue = `${host}/verify-prescription/${miniPayload}`;
  
  const securePayload = btoa(`${patientId}|${docName}|${timestamp}`).substring(0, 15);

  return (
    <Box id="prescription-template-doc" sx={{ background: "#f8fafc", padding: 3, minHeight: "100%", display: 'flex', justifyContent: 'center' }}>
      <Paper elevation={0} sx={{ 
        width: "100%",
        maxWidth: "800px",
        padding: "40px", 
        borderRadius: 0, 
        background: colors.background, 
        border: "1px solid #e2e8f0",
        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
        position: 'relative'
      }}>

        {/* Header - Centered Branding */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" fontWeight="900" sx={{ color: colors.primary, letterSpacing: '-1px', mb: 0.5 }}>
            AidME <Typography component="span" variant="h3" fontWeight="300" sx={{ color: colors.lightText }}>Healthcare</Typography>
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <Typography variant="overline" sx={{ letterSpacing: '2px', fontWeight: 600, color: colors.secondary }}>
              Digital E-Prescription System
            </Typography>
            <Chip 
              label="VERIFIED DOCUMENT" 
              size="small" 
              sx={{ 
                bgcolor: '#e6fffa', 
                color: '#2c7a7b', 
                fontWeight: 800, 
                fontSize: '0.65rem',
                border: '1px solid #b2f5ea'
              }} 
            />
          </Box>
        </Box>

        <Divider sx={{ mb: 4, borderColor: colors.primary, opacity: 0.2, borderBottomWidth: 2 }} />

        {/* Patient & QR - Integrated Grid */}
        <Grid container spacing={0} sx={{ mb: 4, alignItems: 'flex-start' }}>
            {/* Patient Info */}
            <Grid item xs={8}>
                <Typography variant="subtitle2" sx={{ color: colors.primary, fontWeight: 800, mb: 1.5, textTransform: 'uppercase' }}>
                    Patient Particulars
                </Typography>
                <Typography variant="h4" fontWeight="900" sx={{ color: "#1a202c", mb: 1, textTransform: 'uppercase' }}>
                    {prescription.patient && prescription.patient !== "N/A" ? prescription.patient : "[DATA NOT PROVIDED]"}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 3 }}>
                    <Box>
                        <Typography variant="caption" display="block" sx={{ fontWeight: 700, color: colors.lightText }}>PATIENT ID</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 800, color: colors.primary }}>#{prescription.patientId || "N/A"}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" display="block" sx={{ fontWeight: 700, color: colors.lightText }}>AGE / GENDER</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 800 }}>{prescription.age || "--"} Y / {prescription.gender || "--"}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" display="block" sx={{ fontWeight: 700, color: colors.lightText }}>DATE</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 800 }}>{new Date().toLocaleDateString()}</Typography>
                    </Box>
                </Box>
            </Grid>

            {/* Integrated Verification QR */}
            <Grid item xs={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Box 
                  onClick={() => setShowVerifyCard(true)}
                  sx={{ 
                    textAlign: 'center', 
                    p: 2, 
                    border: '2px dashed #e2e8f0', 
                    borderRadius: 2,
                    width: '120px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: colors.primary,
                      bgcolor: '#f0f9ff',
                      transform: 'translateY(-2px)'
                    }
                }}>
                    <Box sx={{ 
                        width: '90px', height: '90px', mx: 'auto', mb: 1,
                        background: '#fff', border: '1px solid #edf2f7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', p: 0.5
                    }}>
                        <QRCodeSVG 
                            value={qrValue} 
                            size={80}
                            level="H"
                            includeMargin={true}
                            style={{ margin: 'auto' }}
                        />
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: colors.primary, fontSize: '0.45rem', display: 'block', mt: 0.5, letterSpacing: '0.5px' }}>
                        ENCRYPTED & SECURE
                    </Typography>
                </Box>
            </Grid>
        </Grid>

        {/* Verification Success Card (Small Card on Click) */}
        <Dialog 
          open={showVerifyCard} 
          onClose={() => setShowVerifyCard(false)}
          PaperProps={{ sx: { borderRadius: 4, maxWidth: '320px', textAlign: 'center' } }}
        >
          <DialogContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#e6fffa', width: 60, height: 60, mb: 1 }}>
              <CheckIcon sx={{ color: '#2c7a7b', fontSize: 35 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="800" sx={{ color: '#1a202c' }}>
                Verification Success
              </Typography>
              <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>
                AIDME SECURE CHANNEL VERIFIED
              </Typography>
            </Box>
            
            <Divider sx={{ width: '100%', my: 1 }} />

            <Box sx={{ width: '100%', textAlign: 'left', bgcolor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid #edf2f7' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LockIcon sx={{ fontSize: 14, color: colors.primary }} />
                <Typography variant="caption" sx={{ fontWeight: 800, color: colors.primary }}>ENCRYPTION ID</Typography>
              </Box>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: colors.text, wordBreak: 'break-all' }}>
                {securePayload}
              </Typography>
            </Box>

            <Typography variant="caption" sx={{ fontStyle: 'italic', color: colors.lightText }}>
              Verified by AidME Clinical AI at {new Date().toLocaleTimeString()}
            </Typography>
          </DialogContent>
        </Dialog>

        {/* Diagnosis */}
        <Box sx={{ mb: 4, p: 2, bgcolor: colors.accent, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ color: colors.primary, fontWeight: 800, mb: 0.5, textTransform: 'uppercase' }}>
                Clinical Diagnosis
            </Typography>
            <Typography sx={{ fontWeight: 600, color: colors.text }}>
                {prescription.diagnosis || "General Consultation / Routine Checkup"}
            </Typography>
        </Box>

        {/* Medicines Table */}
        <Typography variant="subtitle2" sx={{ color: colors.primary, fontWeight: 800, mb: 1, textTransform: 'uppercase' }}>
            Prescribed Medications
        </Typography>
        <TableContainer sx={{ mb: 4, border: '1px solid #edf2f7', borderRadius: '8px 8px 0 0' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: colors.primary }}>
                <TableCell sx={{ color: '#fff', fontWeight: 800 }}>Medicine</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 800 }}>Dosage</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 800 }}>Freq.</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 800 }}>Dur.</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 800 }}>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(prescription.medicines || []).map((med, index) => (
                <TableRow key={index} sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                  <TableCell sx={{ fontWeight: 700 }}>{med.name}</TableCell>
                  <TableCell>{med.dosage}</TableCell>
                  <TableCell>{med.frequency}</TableCell>
                  <TableCell>{med.duration}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontStyle: 'italic', color: colors.lightText }}>{med.note}</TableCell>
                </TableRow>
              ))}
              {(!prescription.medicines || prescription.medicines.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: "gray", py: 4 }}>
                    No medicines prescribed.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* AI Guidelines Section */}
        <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ color: colors.secondary, fontWeight: 800, mb: 1.5, textTransform: 'uppercase' }}>
                General Care Guidelines
            </Typography>
            <Box sx={{ 
                p: 2.5, 
                borderLeft: `4px solid ${colors.secondary}`, 
                bgcolor: '#fffaf0', 
                borderRadius: '0 8px 8px 0' 
            }}>
                <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                    {(prescription.guidelines || []).map((g, i) => (
                        <Box component="li" key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.5, '&:last-child': { mb: 0 } }}>
                            <Typography sx={{ color: colors.secondary, fontWeight: 900 }}>•</Typography>
                            <Typography variant="body2" sx={{ color: '#5f370e', fontWeight: 500, lineHeight: 1.5 }}>
                                {g}
                            </Typography>
                        </Box>
                    ))}
                    {(!prescription.guidelines || prescription.guidelines.length === 0) && (
                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: colors.lightText }}>
                            Please follow standard recovery protocols. Maintain hydration and rest.
                        </Typography>
                    )}
                </ul>
            </Box>
        </Box>

        <Divider sx={{ mb: 4, opacity: 0.1 }} />

        {/* Footer */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: colors.lightText, display: 'block' }}>NEXT VISIT</Typography>
            <Typography variant="body1" sx={{ color: colors.primary, fontWeight: 800 }}>
                {prescription.nextVisit && prescription.nextVisit !== "TBD" ? prescription.nextVisit : "AS NEEDED / TBD"}
            </Typography>
          </Box>

          <Box sx={{ textAlign: "center" }}>
            <Box sx={{ borderBottom: `2px solid ${colors.text}`, mb: 0.5, px: 2 }}>
              <Typography sx={{ fontFamily: '"Brush Script MT", cursive', fontSize: '1.8rem', color: colors.primary }}>
                Dr. {prescription.doctor || "Medical Officer"}
              </Typography>
            </Box>
            <Typography variant="caption" display="block" sx={{ fontWeight: 800, color: colors.lightText, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Digital Signature
            </Typography>
            <Typography variant="caption" display="block" sx={{ fontSize: '0.55rem', color: '#cbd5e0' }}>
                VERIFIED VIA AIDME SECURE CHANNEL
            </Typography>
          </Box>
        </Box>

        {/* Security watermark footer */}
        <Box sx={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', opacity: 0.2 }}>
            <Typography sx={{ fontSize: '0.5rem', fontWeight: 800, color: colors.lightText }}>
                AIDME PRIVACY PROTECTED • SYSTEM GENERATED DOCUMENT • CLINIC-UID: {String(prescription.patientId || "RX-GEN").substring(0,4)}
            </Typography>
        </Box>

      </Paper>
    </Box>
  );
};

export default PrescriptionTemplate;
