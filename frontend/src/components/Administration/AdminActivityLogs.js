import React, { useEffect, useState } from "react";
import {
  Box, Paper, Typography, Chip, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, InputAdornment, Select, MenuItem,
  FormControl, InputLabel, Pagination, CircularProgress, Stack, Button
} from "@mui/material";
import { History, Search, FilterList, Download } from "@mui/icons-material";
import axios from "axios";
import { io } from "socket.io-client";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const ACTION_COLOR = {
  DOCTOR_VERIFICATION: { bg:"#dcfce7", color:"#059669" },
  APPROVE:             { bg:"#dcfce7", color:"#059669" },
  REJECT:              { bg:"#fee2e2", color:"#DC2626"  },
  SUSPEND:             { bg:"#fef3c7", color:"#D97706"  },
  LOGIN:               { bg:"#dbeafe", color:"#1E3A8A"  },
  DELETE:              { bg:"#fee2e2", color:"#DC2626"  },
  PAYMENT:             { bg:"#d1fae5", color:"#065F46"  },
  BOOKING:             { bg:"#e0e7ff", color:"#4338CA"  },
};

const getActionStyle = (action="") => {
  const key = Object.keys(ACTION_COLOR).find(k => action.toUpperCase().includes(k));
  return ACTION_COLOR[key] || { bg:"#f1f5f9", color:"#475569" };
};

const AdminActivityLogs = () => {
  const [data,        setData]       = useState({ logs:[], total:0, totalPages:1 });
  const [search,      setSearch]     = useState("");
  const [date,        setDate]       = useState("");
  const [page,        setPage]       = useState(1);
  const [loading,     setLoading]    = useState(false);

  const auth = { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit:25 };
      if (search) params.action = search;
      if (date)   params.date   = date;
      const res = await axios.get(`${API}/admin/logs`, { ...auth, params });
      // Handle both {logs, total} and plain array responses
      if (Array.isArray(res.data)) {
        setData({ logs: res.data, total: res.data.length, totalPages: 1 });
      } else {
        setData(res.data);
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [page, search, date]); // eslint-disable-line

  // Real-time: auto-refresh on any admin action
  useEffect(() => {
    const socket = io(API);
    socket.on("admin-log-updated", () => fetchLogs());
    socket.on("appointment-updated", () => fetchLogs());
    socket.on("payment-updated", () => fetchLogs());
    return () => socket.disconnect();
  }, []); // eslint-disable-line

  const exportCSV = () => {
    const rows = [["Admin","Action","Target","IP","Time"]];
    data.logs.forEach(l => {
      rows.push([
        l.adminId?.email || l.adminId || "—",
        l.action, l.entity||l.target||"—",
        l.ip||"—",
        new Date(l.createdAt).toLocaleString()
      ]);
    });
    const csv = rows.map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="activity_logs.csv"; a.click();
  };

  return (
    <Box sx={{ bgcolor:"#f0f4f8", minHeight:"100vh", p:3 }}>
      {/* Header */}
      <Box sx={{ mb:3, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ color:"#1a1a2e", display:"flex", alignItems:"center", gap:1 }}>
            <History sx={{ color:"#667eea" }} /> Activity Logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total <b>{data.total}</b> events recorded
          </Typography>
        </Box>
        <Button startIcon={<Download />} variant="outlined" onClick={exportCSV}
          sx={{ borderRadius:"12px", textTransform:"none", fontWeight:600, borderColor:"#1E3A8A", color:"#1E3A8A" }}>
          Export CSV
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p:2, borderRadius:"16px", mb:3, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", display:"flex", gap:2, flexWrap:"wrap", alignItems:"center" }}>
        <TextField
          size="small" placeholder="Filter by action…"
          value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
          InputProps={{ startAdornment:<InputAdornment position="start"><FilterList sx={{color:"#94a3b8"}}/></InputAdornment> }}
          sx={{ flex:1, minWidth:200, "& .MuiOutlinedInput-root":{borderRadius:"10px"} }}
        />
        <TextField
          size="small" type="date" label="Date"
          value={date} onChange={e=>{setDate(e.target.value);setPage(1);}}
          InputLabelProps={{ shrink:true }}
          sx={{ minWidth:160, "& .MuiOutlinedInput-root":{borderRadius:"10px"} }}
        />
        <Button variant="text" onClick={()=>{setSearch("");setDate("");setPage(1);}}
          sx={{ textTransform:"none", color:"#94a3b8" }}>Clear</Button>
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
                  {["Admin","Action","Target / Entity","IP Address","Timestamp"].map(h=>(
                    <TableCell key={h} sx={{ fontWeight:700, color:"#64748b", borderBottom:"2px solid #f1f5f9" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.logs.length===0 && (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ color:"#94a3b8", py:6 }}>No logs found</TableCell></TableRow>
                )}
                {data.logs.map((l,i) => {
                  const style = getActionStyle(l.action);
                  return (
                    <TableRow key={l._id||i} sx={{ "&:hover":{ bgcolor:"#f8fafc" }, "& td":{ borderBottom:"1px solid #f1f5f9" } }}>
                      <TableCell>
                        <Stack>
                          <Typography fontSize={13} fontWeight={600}>
                            {l.adminId?.firstName ? `${l.adminId.firstName} ${l.adminId.lastName}` : (l.adminId?.email||"System")}
                          </Typography>
                          <Typography fontSize={11} color="text.secondary">{l.adminId?.email||""}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip label={l.action||"—"} size="small"
                          sx={{ bgcolor:style.bg, color:style.color, fontWeight:700, fontSize:"0.72rem" }} />
                      </TableCell>
                      <TableCell sx={{ fontSize:13, color:"#475569" }}>{l.entity||l.target||"—"}</TableCell>
                      <TableCell sx={{ fontSize:13, fontFamily:"monospace", color:"#64748b" }}>{l.ip||"—"}</TableCell>
                      <TableCell sx={{ fontSize:12, color:"#94a3b8" }}>{new Date(l.createdAt).toLocaleString()}</TableCell>
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
              sx={{ "& .MuiPaginationItem-root.Mui-selected":{ background:"linear-gradient(135deg, #1E3A8A, #3B82F6)", color:"#fff" } }} />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AdminActivityLogs;
