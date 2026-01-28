import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box, Typography, Table, TableHead, TableRow,
  TableCell, TableBody
} from "@mui/material";

const API = process.env.REACT_APP_API_URL;

const AdminActivityLogs = () => {
  const [logs, setLogs] = useState([]);

  const auth = {
    headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` }
  };

  useEffect(() => {
    axios.get(`${API}/admin/logs`, auth).then(res => setLogs(res.data));
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" mb={3}>Activity Logs</Typography>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Admin</TableCell>
            <TableCell>Action</TableCell>
            <TableCell>Target</TableCell>
            <TableCell>IP</TableCell>
            <TableCell>Time</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map(l => (
            <TableRow key={l._id}>
              <TableCell>{l.adminId?.email}</TableCell>
              <TableCell>{l.action}</TableCell>
              <TableCell>{l.target}</TableCell>
              <TableCell>{l.ip}</TableCell>
              <TableCell>
                {new Date(l.createdAt).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default AdminActivityLogs;
