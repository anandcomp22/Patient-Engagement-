import React, { useEffect, useState, useCallback } from "react";
import {
  Box, Paper, Typography, TextField, InputAdornment, Table, TableBody,
  TableCell, TableHead, TableRow, Chip, IconButton, Button, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, Pagination,
  CircularProgress, Stack, Tooltip, Divider
} from "@mui/material";
import { Search, Refresh, Delete, Visibility, Person, MedicalServices } from "@mui/icons-material";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const AdminPatients = () => {
  const [data,    setData]    = useState({ patients:[], total:0, totalPages:1 });
  const [search,  setSearch]  = useState("");
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected,setSelected]= useState(null);
  const [confirm, setConfirm] = useState(null);

  const auth = { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } };

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      const res = await axios.get(`${API}/admin/patients`, { ...auth, params });
      setData(res.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search]); // eslint-disable-line

  const fetchDetail = async (id) => {
    try {
      const res = await axios.get(`${API}/admin/patients/${id}`, auth);
      setSelected(res.data);
    } catch(e) { console.error(e); }
  };

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/admin/patients/${id}`, auth);
      fetchPatients();
      setConfirm(null);
    } catch(e) { console.error(e); }
  };

  return (
    <Box sx={{ bgcolor:"#f0f4f8", minHeight:"100vh", p:3 }}>
      <Box sx={{ mb:3, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ color:"#1a1a2e" }}>Patients Management</Typography>
          <Typography variant="body2" color="text.secondary">Total: <b>{data.total}</b> registered patients</Typography>
        </Box>
        <Button variant="contained" startIcon={<Refresh />} onClick={fetchPatients}
          sx={{ borderRadius:"12px", background:"linear-gradient(135deg,#f093fb,#f5576c)", boxShadow:"none", textTransform:"none", fontWeight:600 }}>
          Refresh
        </Button>
      </Box>

      <Paper sx={{ p:2, borderRadius:"16px", mb:3, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", display:"flex", gap:2 }}>
        <TextField
          size="small" placeholder="Search name or email…" fullWidth
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{ color:"#94a3b8" }} /></InputAdornment> }}
          sx={{ "& .MuiOutlinedInput-root":{ borderRadius:"10px" } }}
        />
      </Paper>

      <Paper sx={{ borderRadius:"20px", overflow:"hidden", boxShadow:"0 4px 20px rgba(0,0,0,0.06)" }}>
        {loading ? (
          <Box sx={{ display:"flex", justifyContent:"center", py:6 }}><CircularProgress /></Box>
        ) : (
          <Box sx={{ overflowX:"auto" }}>
            <Table>
              <TableHead sx={{ bgcolor:"#f8fafc" }}>
                <TableRow>
                  {["Patient","Email","Phone","Gender","Blood Grp","Location","Actions"].map(h=>(
                    <TableCell key={h} sx={{ fontWeight:700, color:"#64748b", borderBottom:"2px solid #f1f5f9" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.patients.length===0 && (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ color:"#94a3b8", py:6 }}>No patients found</TableCell></TableRow>
                )}
                {data.patients.map(p => (
                  <TableRow key={p._id} sx={{ "&:hover":{ bgcolor:"#f8fafc" }, "& td":{ borderBottom:"1px solid #f1f5f9" } }}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Avatar sx={{ width:36, height:36, bgcolor:"#f093fb22", color:"#f5576c", fontSize:14, fontWeight:700 }}>
                          {p.firstName?.[0]}{p.lastName?.[0]}
                        </Avatar>
                        <Typography fontWeight={600} fontSize={14}>{p.firstName} {p.lastName}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ fontSize:13, color:"#64748b" }}>{p.email}</TableCell>
                    <TableCell sx={{ fontSize:13 }}>{p.phone||"—"}</TableCell>
                    <TableCell>
                      {p.gender && <Chip label={p.gender} size="small"
                        sx={{ bgcolor:"#f1f5f9", color:"#475569", fontWeight:600, fontSize:"0.72rem", textTransform:"capitalize" }} />}
                    </TableCell>
                    <TableCell sx={{ fontSize:13, fontWeight:600, color:"#ef4444" }}>{p.bloodgroup||"—"}</TableCell>
                    <TableCell sx={{ fontSize:12, color:"#64748b" }}>{[p.district,p.state,p.country].filter(Boolean).join(", ")||"—"}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={()=>fetchDetail(p._id)}
                            sx={{ bgcolor:"#f1f5f9","&:hover":{bgcolor:"#e2e8f0"} }}>
                            <Visibility sx={{ fontSize:16, color:"#475569" }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={()=>setConfirm(p._id)}
                            sx={{ bgcolor:"#fee2e2","&:hover":{bgcolor:"#fecaca"} }}>
                            <Delete sx={{ fontSize:16, color:"#ef4444" }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
        {data.totalPages > 1 && (
          <Box sx={{ display:"flex", justifyContent:"center", p:2 }}>
            <Pagination count={data.totalPages} page={page} onChange={(_,v)=>setPage(v)}
              sx={{ "& .MuiPaginationItem-root.Mui-selected":{ background:"linear-gradient(135deg,#f093fb,#f5576c)", color:"#fff" } }} />
          </Box>
        )}
      </Paper>

      {/* Detail Modal */}
      <Dialog open={!!selected} onClose={()=>setSelected(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx:{ borderRadius:"20px" } }}>
        {selected && (
          <>
            <DialogTitle sx={{ background:"linear-gradient(135deg,#f093fb,#f5576c)", color:"#fff", borderRadius:"20px 20px 0 0" }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor:"rgba(255,255,255,0.3)", width:48, height:48 }}><Person /></Avatar>
                <Box>
                  <Typography fontWeight={800}>{selected.patient?.firstName} {selected.patient?.lastName}</Typography>
                  <Typography variant="body2" sx={{ opacity:0.85 }}>{selected.patient?.email}</Typography>
                </Box>
              </Stack>
            </DialogTitle>
            <DialogContent sx={{ pt:3 }}>
              {[
                ["Patient ID",  selected.patient?.patientId],
                ["Phone",       selected.patient?.phone],
                ["DOB",         selected.patient?.dob ? new Date(selected.patient.dob).toLocaleDateString():"—"],
                ["Gender",      selected.patient?.gender],
                ["Blood Group", selected.patient?.bloodgroup],
                ["Allergies",   selected.patient?.allergies],
                ["Location",    [selected.patient?.district,selected.patient?.state,selected.patient?.country].filter(Boolean).join(", ")],
              ].map(([k,v])=>(
                <Box key={k} sx={{ display:"flex", justifyContent:"space-between", py:1, borderBottom:"1px solid #f1f5f9" }}>
                  <Typography color="text.secondary" fontSize={14}>{k}</Typography>
                  <Typography fontWeight={600} fontSize={14}>{v||"—"}</Typography>
                </Box>
              ))}

              {selected.appointments?.length>0 && (
                <>
                  <Divider sx={{ my:2 }} />
                  <Typography fontWeight={700} mb={1} sx={{ display:"flex", alignItems:"center", gap:1 }}>
                    <MedicalServices sx={{ fontSize:18, color:"#f5576c" }} /> Recent Appointments
                  </Typography>
                  {selected.appointments.slice(0,5).map(a=>(
                    <Box key={a._id} sx={{ p:1.5, mb:1, borderRadius:"10px", bgcolor:"#f8fafc", border:"1px solid #f1f5f9" }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography fontSize={13} fontWeight={600}>{a.doctorName}</Typography>
                        <Chip label={a.appstatus} size="small" sx={{ height:20, fontSize:"0.68rem", fontWeight:700,
                          bgcolor: a.appstatus==="completed"?"#dcfce7":"#fef3c7",
                          color: a.appstatus==="completed"?"#22c55e":"#f59e0b" }} />
                      </Stack>
                      <Typography fontSize={12} color="text.secondary">
                        {a.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString():""}
                      </Typography>
                    </Box>
                  ))}
                </>
              )}
            </DialogContent>
            <DialogActions sx={{ px:3, pb:2 }}>
              <Button onClick={()=>setSelected(null)} sx={{ textTransform:"none", fontWeight:600 }}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!confirm} onClose={()=>setConfirm(null)} PaperProps={{ sx:{ borderRadius:"16px", p:1 } }}>
        <DialogTitle fontWeight={700}>Delete Patient?</DialogTitle>
        <DialogContent><Typography>This action cannot be undone. Are you sure?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={()=>setConfirm(null)} sx={{ textTransform:"none" }}>Cancel</Button>
          <Button variant="contained" onClick={()=>handleDelete(confirm)}
            sx={{ textTransform:"none", fontWeight:700, bgcolor:"#ef4444","&:hover":{bgcolor:"#dc2626"}, borderRadius:"10px" }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPatients;
