import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box, Typography, Table, TableRow,
  TableCell, TableHead, TableBody,
  Select, MenuItem, IconButton
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const AdminRoleManagement = () => {
  const [admins, setAdmins] = useState([]);

  const auth = {
    headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` }
  };

  const fetchAdmins = async () => {
    const res = await axios.get(`${API}/admin/admins`, auth);
    setAdmins(res.data);
  };

  const updateRole = async (id, role) => {
    await axios.patch(`${API}/admin/admins/${id}/role`, { role }, auth);
    fetchAdmins();
  };

  const deleteAdmin = async (id) => {
    await axios.delete(`${API}/admin/admins/${id}`, auth);
    fetchAdmins();
  };

  useEffect(() => { fetchAdmins(); }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" mb={3}>Admin Role Management</Typography>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {admins.map(a => (
            <TableRow key={a._id}>
              <TableCell>{a.email}</TableCell>
              <TableCell>
                <Select
                  value={a.role}
                  onChange={e => updateRole(a._id, e.target.value)}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="superadmin">Super Admin</MenuItem>
                </Select>
              </TableCell>
              <TableCell>
                <IconButton color="error" onClick={() => deleteAdmin(a._id)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default AdminRoleManagement;
