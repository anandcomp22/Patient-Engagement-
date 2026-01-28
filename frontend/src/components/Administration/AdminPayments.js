import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box, Typography, Grid, Paper,
  Table, TableHead, TableRow, TableCell, TableBody, Chip
} from "@mui/material";

const API = process.env.REACT_APP_API_URL;

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({});

  const auth = {
    headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` }
  };

  useEffect(() => {
    axios.get(`${API}/admin/payments`, auth).then(r => setPayments(r.data));
    axios.get(`${API}/admin/payments/summary`, auth).then(r => setSummary(r.data));
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" mb={3}>Payments & Revenue</Typography>

      <Grid container spacing={3} mb={3}>
        {[
          ["Total Revenue", `₹${summary.totalRevenue}`],
          ["Total Payments", summary.totalPayments],
          ["Paid", summary.paidPayments],
          ["Failed", summary.failedPayments]
        ].map((d, i) => (
          <Grid item xs={12} md={3} key={i}>
            <Paper sx={{ p: 2, textAlign: "center", borderRadius: 3 }}>
              <Typography fontWeight="bold">{d[0]}</Typography>
              <Typography variant="h5">{d[1] || 0}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Patient</TableCell>
            <TableCell>Doctor</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payments.map(p => (
            <TableRow key={p._id}>
              <TableCell>{p.patientId?.name}</TableCell>
              <TableCell>{p.doctorId?.name}</TableCell>
              <TableCell>₹{p.fees}</TableCell>
              <TableCell>
                <Chip
                  label={p.paymentstatus}
                  color={p.paymentstatus === "paid" ? "success" : "error"}
                />
              </TableCell>
              <TableCell>{new Date(p.createdAt).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default AdminPayments;
