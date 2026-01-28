useEffect(() => {
  axios.get(`${API_BASE}/admin/doctors`, authHeader)
    .then(res => setDoctors(res.data));
}, []);

const verifyDoctor = (id, status) => {
  axios.patch(`${API_BASE}/admin/doctors/${id}/${status}`, {}, authHeader);
};
