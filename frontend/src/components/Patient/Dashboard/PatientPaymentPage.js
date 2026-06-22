import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Chip, Skeleton, Stack, Avatar,
  Table, TableBody, TableCell, TableHead, TableRow
} from '@mui/material';
import {
  CurrencyRupee, Receipt, CheckCircle, HourglassFull, Cancel
} from '@mui/icons-material';
import axios from 'axios';
import { io } from 'socket.io-client';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const STATUS_CHIP = {
  paid:    { bg: '#dcfce7', color: '#059669', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
  pending: { bg: '#fef3c7', color: '#D97706', icon: <HourglassFull sx={{ fontSize: 14 }} /> },
  fail:    { bg: '#fee2e2', color: '#DC2626', icon: <Cancel sx={{ fontSize: 14 }} /> },
};

const PatientPaymentPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const patientId = localStorage.getItem('patientId');

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${API}/patient/payments/${patientId}`);
      setPayments(res.data);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) fetchPayments();
  }, [patientId]); // eslint-disable-line

  // Real-time: auto-refresh when a new payment comes in
  useEffect(() => {
    const socket = io(API);
    socket.on('payment-updated', () => fetchPayments());
    return () => socket.disconnect();
  }, []); // eslint-disable-line

  const totalPaid = payments
    .filter(p => p.paymentstatus === 'paid')
    .reduce((sum, p) => sum + (p.fees || 0), 0);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f0f4f8', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800} sx={{ color: '#1a1a2e' }}>
          Payment History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track all your consultation payments and receipts.
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        <Paper sx={{
          background: 'linear-gradient(135deg, #065F46, #10B981)',
          borderRadius: '16px', p: 2.5, color: '#fff', flex: 1,
          boxShadow: '0 6px 24px rgba(0,0,0,0.10)'
        }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.25)', width: 38, height: 38, mb: 1 }}>
            <CurrencyRupee sx={{ color: '#fff', fontSize: 20 }} />
          </Avatar>
          <Typography variant="body2" sx={{ opacity: 0.85, fontSize: 12 }}>Total Spent</Typography>
          <Typography variant="h5" fontWeight={800}>₹{totalPaid.toLocaleString()}</Typography>
        </Paper>

        <Paper sx={{
          background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)',
          borderRadius: '16px', p: 2.5, color: '#fff', flex: 1,
          boxShadow: '0 6px 24px rgba(0,0,0,0.10)'
        }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.25)', width: 38, height: 38, mb: 1 }}>
            <Receipt sx={{ color: '#fff', fontSize: 20 }} />
          </Avatar>
          <Typography variant="body2" sx={{ opacity: 0.85, fontSize: 12 }}>Total Transactions</Typography>
          <Typography variant="h5" fontWeight={800}>{payments.length}</Typography>
        </Paper>

        <Paper sx={{
          background: 'linear-gradient(135deg, #0F766E, #14B8A6)',
          borderRadius: '16px', p: 2.5, color: '#fff', flex: 1,
          boxShadow: '0 6px 24px rgba(0,0,0,0.10)'
        }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.25)', width: 38, height: 38, mb: 1 }}>
            <CheckCircle sx={{ color: '#fff', fontSize: 20 }} />
          </Avatar>
          <Typography variant="body2" sx={{ opacity: 0.85, fontSize: 12 }}>Successful Payments</Typography>
          <Typography variant="h5" fontWeight={800}>{payments.filter(p => p.paymentstatus === 'paid').length}</Typography>
        </Paper>
      </Stack>

      {/* Payment Table */}
      <Paper sx={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  {['Doctor', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: '#64748b', borderBottom: '2px solid #f1f5f9' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ color: '#94a3b8', py: 6 }}>
                      No payments yet. Book an appointment to get started!
                    </TableCell>
                  </TableRow>
                )}
                {payments.map(p => {
                  const sc = STATUS_CHIP[p.paymentstatus] || { bg: '#f1f5f9', color: '#475569' };
                  return (
                    <TableRow key={p._id} sx={{ '&:hover': { bgcolor: '#f8fafc' }, '& td': { borderBottom: '1px solid #f1f5f9' } }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: 14 }}>{p.doctorname || '—'}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" gap={0.3}>
                          <CurrencyRupee sx={{ fontSize: 15, color: '#10B981' }} />
                          <Typography fontWeight={700} color="#059669">{(p.fees || 0).toLocaleString()}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip label={p.paymentmethod || '—'} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: '0.72rem', textTransform: 'capitalize' }} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={p.paymentstatus}
                          size="small"
                          icon={sc.icon}
                          sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, fontSize: '0.72rem', textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: '#94a3b8' }}>
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default PatientPaymentPage;
