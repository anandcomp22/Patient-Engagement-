import React, { useEffect, useState } from "react";
import {
  Box, Paper, Typography, Grid, Chip, Button, Avatar,
  Table, TableBody, TableCell, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, TextField,
  Pagination, CircularProgress, Stack, Skeleton
} from "@mui/material";
import {
  CurrencyRupee, TrendingUp, Payment, CheckCircle, Cancel, HourglassFull, Download
} from "@mui/icons-material";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const SUMMARY_CARDS = [
  { key:"totalRevenue",   label:"Total Revenue",   icon:CurrencyRupee, grad:"linear-gradient(135deg,#43e97b,#38f9d7)", prefix:"₹" },
  { key:"totalPayments",  label:"Total Payments",  icon:Payment,       grad:"linear-gradient(135deg,#4facfe,#00f2fe)", prefix:""  },
  { key:"paidPayments",   label:"Paid",            icon:CheckCircle,   grad:"linear-gradient(135deg,#667eea,#764ba2)", prefix:""  },
  { key:"failedPayments", label:"Failed",          icon:Cancel,        grad:"linear-gradient(135deg,#f5576c,#fa709a)", prefix:""  },
  { key:"pendingPayments",label:"Pending",         icon:HourglassFull, grad:"linear-gradient(135deg,#f6d365,#fda085)", prefix:""  },
];

const AdminPayments = () => {
  const [data,    setData]    = useState({ payments:[], total:0, totalPages:1 });
  const [summary, setSummary] = useState({});
  const [status,  setStatus]  = useState("");
  const [from,    setFrom]    = useState("");
  const [to,      setTo]      = useState("");
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [sumLoad, setSumLoad] = useState(true);

  const auth = { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } };

  const fetchSummary = async () => {
    setSumLoad(true);
    try {
      const res = await axios.get(`${API}/admin/payments/summary`, auth);
      setSummary(res.data);
    } catch(e) { console.error(e); }
    finally { setSumLoad(false); }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = { page, limit:15 };
      if (status) params.status = status;
      if (from)   params.from   = from;
      if (to)     params.to     = to;
      const res = await axios.get(`${API}/admin/payments`, { ...auth, params });
      if (Array.isArray(res.data)) {
        setData({ payments: res.data, total: res.data.length, totalPages:1 });
      } else {
        setData(res.data);
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSummary(); }, []); // eslint-disable-line
  useEffect(() => { fetchPayments(); }, [page, status, from, to]); // eslint-disable-line

  const exportCSV = () => {
    const rows = [["Patient","Doctor","Amount","Method","Status","Date"]];
    data.payments.forEach(p => rows.push([
      p.patientname||p.patientId?.name||"—", p.doctorname||p.doctorId?.name||"—",
      p.fees, p.paymentmethod, p.paymentstatus,
      p.createdAt ? new Date(p.createdAt).toLocaleDateString():"—"
    ]));
    const csv = rows.map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="payments.csv"; a.click();
  };

  const STATUS_CHIP = {
    paid:    { bg:"#dcfce7", color:"#22c55e" },
    pending: { bg:"#fef3c7", color:"#f59e0b" },
    fail:    { bg:"#fee2e2", color:"#ef4444"  },
  };

  return (
    <Box sx={{ bgcolor:"#f0f4f8", minHeight:"100vh", p:3 }}>
      <Box sx={{ mb:3, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ color:"#1a1a2e" }}>Payments & Revenue</Typography>
          <Typography variant="body2" color="text.secondary">Financial overview and transaction management</Typography>
        </Box>
        <Button startIcon={<Download />} variant="outlined" onClick={exportCSV}
          sx={{ borderRadius:"12px", textTransform:"none", fontWeight:600, borderColor:"#43e97b", color:"#22c55e" }}>
          Export CSV
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        {SUMMARY_CARDS.map(({ key, label, icon:Icon, grad, prefix }) => (
          <Grid item xs={6} sm={4} md={2.4} key={key}>
            <Paper sx={{ background:grad, borderRadius:"16px", p:2, color:"#fff", boxShadow:"0 6px 24px rgba(0,0,0,0.10)" }}>
              <Avatar sx={{ bgcolor:"rgba(255,255,255,0.25)", width:38, height:38, mb:1 }}>
                <Icon sx={{ color:"#fff", fontSize:20 }} />
              </Avatar>
              <Typography variant="body2" sx={{ opacity:0.85, fontSize:12 }}>{label}</Typography>
              {sumLoad
                ? <Skeleton variant="text" width={60} sx={{ bgcolor:"rgba(255,255,255,0.3)" }} />
                : <Typography variant="h6" fontWeight={800}>
                    {prefix}{key==="totalRevenue" ? (summary[key]||0).toLocaleString() : (summary[key]||0)}
                  </Typography>
              }
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Paper sx={{ p:2, borderRadius:"16px", mb:3, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", display:"flex", gap:2, flexWrap:"wrap", alignItems:"center" }}>
        <FormControl size="small" sx={{ minWidth:140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={e=>{setStatus(e.target.value);setPage(1);}} sx={{ borderRadius:"10px" }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="fail">Failed</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" type="date" label="From" value={from} onChange={e=>{setFrom(e.target.value);setPage(1);}}
          InputLabelProps={{ shrink:true }} sx={{ "& .MuiOutlinedInput-root":{borderRadius:"10px"} }} />
        <TextField size="small" type="date" label="To" value={to} onChange={e=>{setTo(e.target.value);setPage(1);}}
          InputLabelProps={{ shrink:true }} sx={{ "& .MuiOutlinedInput-root":{borderRadius:"10px"} }} />
        <Button variant="text" onClick={()=>{setStatus("");setFrom("");setTo("");setPage(1);}} sx={{ textTransform:"none", color:"#94a3b8" }}>
          Clear
        </Button>
      </Paper>

      {/* Table */}
      <Paper sx={{ borderRadius:"20px", overflow:"hidden", boxShadow:"0 4px 20px rgba(0,0,0,0.06)" }}>
        {loading ? (
          <Box sx={{ display:"flex", justifyContent:"center", py:6 }}><CircularProgress /></Box>
        ) : (
          <Box sx={{ overflowX:"auto" }}>
            <Table>
              <TableHead sx={{ bgcolor:"#f8fafc" }}>
                <TableRow>
                  {["Patient","Doctor","Amount","Method","Status","Date"].map(h=>(
                    <TableCell key={h} sx={{ fontWeight:700, color:"#64748b", borderBottom:"2px solid #f1f5f9" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.payments.length===0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ color:"#94a3b8", py:6 }}>No payments found</TableCell></TableRow>
                )}
                {data.payments.map(p => {
                  const sc = STATUS_CHIP[p.paymentstatus] || { bg:"#f1f5f9", color:"#475569" };
                  return (
                    <TableRow key={p._id} sx={{ "&:hover":{bgcolor:"#f8fafc"}, "& td":{borderBottom:"1px solid #f1f5f9"} }}>
                      <TableCell sx={{ fontWeight:600, fontSize:14 }}>{p.patientname || p.patientId?.name || "—"}</TableCell>
                      <TableCell sx={{ fontSize:13, color:"#64748b" }}>{p.doctorname || p.doctorId?.name || "—"}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" gap={0.3}>
                          <CurrencyRupee sx={{ fontSize:15, color:"#43e97b" }} />
                          <Typography fontWeight={700} color="#22c55e">{(p.fees||0).toLocaleString()}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip label={p.paymentmethod||"—"} size="small" sx={{ bgcolor:"#f1f5f9", color:"#475569", fontWeight:600, fontSize:"0.72rem", textTransform:"capitalize" }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={p.paymentstatus} size="small" sx={{ bgcolor:sc.bg, color:sc.color, fontWeight:700, fontSize:"0.72rem", textTransform:"capitalize" }} />
                      </TableCell>
                      <TableCell sx={{ fontSize:12, color:"#94a3b8" }}>
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
        {data.totalPages>1 && (
          <Box sx={{ display:"flex", justifyContent:"center", p:2 }}>
            <Pagination count={data.totalPages} page={page} onChange={(_,v)=>setPage(v)}
              sx={{ "& .MuiPaginationItem-root.Mui-selected":{ background:"linear-gradient(135deg,#43e97b,#38f9d7)", color:"#fff" } }} />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AdminPayments;
