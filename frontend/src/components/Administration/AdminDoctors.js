import React, { useEffect, useState, useCallback } from "react";
import {
  Box, Paper, Typography, TextField, InputAdornment, Table, TableBody,
  TableCell, TableHead, TableRow, Chip, IconButton, Button, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select,
  FormControl, InputLabel, Pagination, CircularProgress, Stack, Tooltip
} from "@mui/material";
import {
  Search, Refresh, CheckCircle, Cancel, Block,
  VerifiedUser, Delete, Visibility, Person
} from "@mui/icons-material";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const STATUS_CONF = {
  verified: { color:"#22c55e", bg:"#dcfce7", label:"Verified",   icon:<CheckCircle sx={{fontSize:14}}/> },
  pending:  { color:"#f59e0b", bg:"#fef3c7", label:"Pending",    icon:<VerifiedUser sx={{fontSize:14}}/> },
  rejected: { color:"#ef4444", bg:"#fee2e2", label:"Rejected",   icon:<Cancel sx={{fontSize:14}}/> },
  not_uploaded:{ color:"#94a3b8", bg:"#f1f5f9", label:"No Docs", icon:<Block sx={{fontSize:14}}/> },
};

const AdminDoctors = () => {
  const [data,    setData]    = useState({ doctors:[], total:0, totalPages:1 });
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("");
  const [specialty,setSpecialty]=useState("");
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected,setSelected]= useState(null);   // for detail modal
  const [confirm, setConfirm] = useState(null);   // { id, action }

  const auth = { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } };

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit:15 };
      if (search)   params.search   = search;
      if (status)   params.status   = status;
      if (specialty)params.specialty= specialty;
      const res = await axios.get(`${API}/admin/doctors`, { ...auth, params });
      setData(res.data);
    } catch(e){ console.error(e); }
    finally { setLoading(false); }
  }, [page, search, status, specialty]); // eslint-disable-line

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const handleAction = async (id, action) => {
    try {
      await axios.patch(`${API}/admin/doctors/${id}/status`, { action }, auth);
      fetchDoctors();
      setConfirm(null);
    } catch(e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/admin/doctors/${id}`, auth);
      fetchDoctors();
      setConfirm(null);
    } catch(e) { console.error(e); }
  };

  const specialties = ["Cardiologist","Dermatologist","Pediatrician","Orthopedic","Neurologist","General"];

  return (
    <Box sx={{ bgcolor:"#f0f4f8", minHeight:"100vh", p:3 }}>
      {/* Header */}
      <Box sx={{ mb:3, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ color:"#1a1a2e" }}>Doctors Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Total: <b>{data.total}</b> doctors registered
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Refresh />} onClick={fetchDoctors}
          sx={{ borderRadius:"12px", background:"linear-gradient(135deg,#667eea,#764ba2)", boxShadow:"none", textTransform:"none", fontWeight:600 }}>
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p:2, borderRadius:"16px", mb:3, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", display:"flex", gap:2, flexWrap:"wrap", alignItems:"center" }}>
        <TextField
          size="small" placeholder="Search name, email, license…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{ color:"#94a3b8" }} /></InputAdornment> }}
          sx={{ flex:1, minWidth:200, "& .MuiOutlinedInput-root":{ borderRadius:"10px" } }}
        />
        <FormControl size="small" sx={{ minWidth:150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={e=>{ setStatus(e.target.value); setPage(1); }} sx={{ borderRadius:"10px" }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="verified">Verified</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth:150 }}>
          <InputLabel>Specialty</InputLabel>
          <Select value={specialty} label="Specialty" onChange={e=>{ setSpecialty(e.target.value); setPage(1); }} sx={{ borderRadius:"10px" }}>
            <MenuItem value="">All</MenuItem>
            {specialties.map(s=><MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
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
                  {["Doctor","Specialty","License","Experience","Status","Active","Actions"].map(h=>(
                    <TableCell key={h} sx={{ fontWeight:700, color:"#64748b", borderBottom:"2px solid #f1f5f9" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.doctors.length===0 && (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ color:"#94a3b8", py:6 }}>No doctors found</TableCell></TableRow>
                )}
                {data.doctors.map(doc => {
                  const sc = STATUS_CONF[doc.verificationStatus] || STATUS_CONF.not_uploaded;
                  return (
                    <TableRow key={doc._id} sx={{ "&:hover":{ bgcolor:"#f8fafc" }, "& td":{ borderBottom:"1px solid #f1f5f9" } }}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar sx={{ width:36, height:36, bgcolor:"#667eea22", color:"#667eea", fontSize:14, fontWeight:700 }}>
                            {doc.firstName?.[0]}{doc.lastName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography fontWeight={600} fontSize={14}>Dr. {doc.firstName} {doc.lastName}</Typography>
                            <Typography fontSize={12} color="text.secondary">{doc.email}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip label={doc.specialty||"N/A"} size="small" sx={{ bgcolor:"#f1f5f9", color:"#475569", fontWeight:600, fontSize:"0.72rem" }} />
                      </TableCell>
                      <TableCell sx={{ fontSize:13, color:"#64748b" }}>{doc.licenseNumber}</TableCell>
                      <TableCell sx={{ fontSize:13 }}>{doc.experience} yrs</TableCell>
                      <TableCell>
                        <Chip icon={sc.icon} label={sc.label} size="small"
                          sx={{ bgcolor:sc.bg, color:sc.color, fontWeight:700, fontSize:"0.72rem", "& .MuiChip-icon":{ color:sc.color } }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={doc.isActive!==false ? "Active":"Inactive"} size="small"
                          sx={{ bgcolor: doc.isActive!==false ? "#dcfce7":"#fee2e2", color: doc.isActive!==false ? "#22c55e":"#ef4444", fontWeight:700, fontSize:"0.72rem" }} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={()=>setSelected(doc)}
                              sx={{ bgcolor:"#f1f5f9","&:hover":{bgcolor:"#e2e8f0"} }}>
                              <Visibility sx={{ fontSize:16, color:"#475569" }} />
                            </IconButton>
                          </Tooltip>
                          {doc.isActive!==false ? (
                            <Tooltip title="Suspend">
                              <IconButton size="small" onClick={()=>setConfirm({id:doc._id,action:"suspend"})}
                                sx={{ bgcolor:"#fef3c7","&:hover":{bgcolor:"#fde68a"} }}>
                                <Block sx={{ fontSize:16, color:"#f59e0b" }} />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Activate">
                              <IconButton size="small" onClick={()=>setConfirm({id:doc._id,action:"activate"})}
                                sx={{ bgcolor:"#dcfce7","&:hover":{bgcolor:"#bbf7d0"} }}>
                                <CheckCircle sx={{ fontSize:16, color:"#22c55e" }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={()=>setConfirm({id:doc._id,action:"delete"})}
                              sx={{ bgcolor:"#fee2e2","&:hover":{bgcolor:"#fecaca"} }}>
                              <Delete sx={{ fontSize:16, color:"#ef4444" }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
        {data.totalPages > 1 && (
          <Box sx={{ display:"flex", justifyContent:"center", p:2 }}>
            <Pagination count={data.totalPages} page={page} onChange={(_,v)=>setPage(v)}
              sx={{ "& .MuiPaginationItem-root.Mui-selected":{ background:"linear-gradient(135deg,#667eea,#764ba2)", color:"#fff" } }} />
          </Box>
        )}
      </Paper>

      {/* Doctor Detail Modal */}
      <Dialog open={!!selected} onClose={()=>setSelected(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx:{ borderRadius:"20px" } }}>
        {selected && (
          <>
            <DialogTitle sx={{ background:"linear-gradient(135deg,#667eea,#764ba2)", color:"#fff", borderRadius:"20px 20px 0 0" }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor:"rgba(255,255,255,0.3)", width:48, height:48, fontWeight:700 }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography fontWeight={800}>Dr. {selected.firstName} {selected.lastName}</Typography>
                  <Typography variant="body2" sx={{ opacity:0.85 }}>{selected.email}</Typography>
                </Box>
              </Stack>
            </DialogTitle>
            <DialogContent sx={{ pt:3 }}>
              {[
                ["Specialty",    selected.specialty],
                ["License No.",  selected.licenseNumber],
                ["Hospital",     selected.hospital],
                ["Experience",   `${selected.experience} years`],
                ["Phone",        selected.phone],
                ["Location",     `${selected.district||""}, ${selected.state||""}, ${selected.country||""}`],
                ["Status",       selected.verificationStatus],
                ["Active",       selected.isActive!==false ? "Yes" : "No"],
              ].map(([k,v])=>(
                <Box key={k} sx={{ display:"flex", justifyContent:"space-between", py:1, borderBottom:"1px solid #f1f5f9" }}>
                  <Typography color="text.secondary" fontSize={14}>{k}</Typography>
                  <Typography fontWeight={600} fontSize={14}>{v||"—"}</Typography>
                </Box>
              ))}
              {selected.licenseDocument && (
                <Button fullWidth variant="outlined" component="a"
                  href={`${API}/uploads/${selected.licenseDocument}`}
                  target="_blank" rel="noopener noreferrer"
                  sx={{ mt:2, borderRadius:"12px", textTransform:"none", fontWeight:600 }}>
                  View License Document
                </Button>
              )}
            </DialogContent>
            <DialogActions sx={{ px:3, pb:2 }}>
              <Button onClick={()=>setSelected(null)} sx={{ textTransform:"none", fontWeight:600 }}>Close</Button>
              {selected.verificationStatus==="pending" && (
                <Button variant="contained" onClick={()=>{ setSelected(null); setConfirm({id:selected._id,action:"approve"}); }}
                  sx={{ borderRadius:"10px", textTransform:"none", fontWeight:600, bgcolor:"#22c55e","&:hover":{bgcolor:"#16a34a"} }}>
                  Verify Doctor
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={!!confirm} onClose={()=>setConfirm(null)} PaperProps={{ sx:{ borderRadius:"16px", p:1 } }}>
        <DialogTitle fontWeight={700}>Confirm {confirm?.action}</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to <b>{confirm?.action}</b> this doctor?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setConfirm(null)} sx={{ textTransform:"none" }}>Cancel</Button>
          <Button variant="contained"
            onClick={() => confirm?.action==="delete" ? handleDelete(confirm.id) : handleAction(confirm.id, confirm.action)}
            sx={{
              textTransform:"none", fontWeight:700, borderRadius:"10px",
              bgcolor: confirm?.action==="delete" ? "#ef4444" : confirm?.action==="suspend" ? "#f59e0b" : "#22c55e",
              "&:hover":{ opacity:0.85 }
            }}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDoctors;
