import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./BookAppointment.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [roomId, setRoomId] = useState("");
  const [appointmentDateTime, setAppointmentDateTime] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const navigate = useNavigate();

  // 1. Fetch all doctors on mount
  useEffect(() => {
    axios
      .get(`${API}/patient/doctors`)
      .then((res) => {
        setDoctors(res.data);
        setFilteredDoctors(res.data);
        
        // Extract unique specialties
        const uniqueSpecialties = [...new Set(res.data.map(doc => doc.specialty).filter(Boolean))];
        setSpecialties(uniqueSpecialties);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 2. Filter doctors when specialty changes
  useEffect(() => {
    if (selectedSpecialty) {
      setFilteredDoctors(doctors.filter(doc => doc.specialty === selectedSpecialty));
    } else {
      setFilteredDoctors(doctors);
    }
    // Reset selection if the current selected doctor is filtered out
    if (selectedDoctor && selectedSpecialty && selectedDoctor.specialty !== selectedSpecialty) {
      setSelectedDoctor(null);
      setTime("");
    }
  }, [selectedSpecialty, doctors, selectedDoctor]);

  // 3. Fetch available slots when a doctor and date are chosen
  useEffect(() => {
    if (selectedDoctor && date) {
      setSlotsLoading(true);
      setTime(""); // Reset selected time when date/doctor changes
      axios
        .get(`${API}/patient/available-slots?doctorId=${selectedDoctor.doctorId}&date=${date}`)
        .then(res => {
          setAvailableSlots(res.data.availableSlots || []);
          setSlotsLoading(false);
        })
        .catch(err => {
          console.error("Error fetching slots:", err);
          setAvailableSlots([]);
          setSlotsLoading(false);
        });
    } else {
      setAvailableSlots([]);
      setTime("");
    }
  }, [selectedDoctor, date]);

  const handleBooking = async () => {
  if (selectedDoctor && date && time) {
    try {
      const res = await axios.post(
        `${API}/appointment/book`,
        {
          doctorId: Number(selectedDoctor.doctorId),
          appointmentDate: date,
          time,
          patientId: Number(localStorage.getItem("patientId"))
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      setRoomId(res.data.roomId);
      setAppointmentDateTime(`${date}T${time}`);
      setShowSuccessPopup(true);

    } catch (err) {
      alert(err.response?.data?.message || "Error booking appointment.");
    }
  } else {
      alert("Please fill all fields.");
    }
};

const isJoinAllowed = () => {
  const now = new Date();
  const appointmentTime = new Date(appointmentDateTime);

  // allow join within ±10 minutes
  const diff = Math.abs(now - appointmentTime) / (1000 * 60);
  return diff <= 10;
};

  return (
    <div className="appointment-container">
      <h1 className="appointment-title">Book an Appointment</h1>

      <div className="appointment-grid">
        <div className="doctor-list">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Select a Doctor</h3>
            {/* Specialty Filter */}
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="input-field"
              style={{ width: '150px', margin: 0, padding: '5px' }}
            >
              <option value="">All Specialties</option>
              {specialties.map((spec, idx) => (
                <option key={idx} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {loading ? <p>Loading doctors...</p> : filteredDoctors.length === 0 ? <p>No doctors found.</p> : null}
          
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {filteredDoctors.map((doc, index) => (
              <div
                key={index}
                className={`doctor-card ${
                  selectedDoctor?.doctorId === doc.doctorId ? "selected" : ""
                }`}
                onClick={() => setSelectedDoctor(doc)}
              >
                <img
                  src={doc.profileImage || doc.image || "https://cdn-icons-png.flaticon.com/512/3774/3774299.png"}
                  alt={`${doc.firstName} ${doc.lastName}`}
                  className="doctor-image"
                />
                <div>
                  <p className="doctor-name">
                    Dr. {doc.firstName} {doc.lastName}
                  </p>
                  <p className="doctor-specialty">{doc.specialty}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="appointment-form">
          <h2>Schedule Appointment</h2>

          {selectedDoctor ? (
            <p style={{ color: '#4CAF50', fontWeight: 'bold', marginBottom: '1rem' }}>
              Booking with Dr. {selectedDoctor.firstName}
            </p>
          ) : (
            <p style={{ color: '#888', marginBottom: '1rem' }}>Please select a doctor first.</p>
          )}

          <label>Select Date</label>
          <input
            type="date"
            value={date}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
            className="input-field"
            disabled={!selectedDoctor}
          />

          <label>Select Time</label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="input-field"
            disabled={!selectedDoctor || !date || slotsLoading}
          >
            <option value="">{slotsLoading ? "Loading availability..." : "Select an available time"}</option>
            {availableSlots.map((slot, idx) => (
              <option key={idx} value={slot}>
                {slot}
              </option>
            ))}
          </select>
          
          {selectedDoctor && date && !slotsLoading && availableSlots.length === 0 && (
            <p style={{ color: 'red', fontSize: '14px', marginTop: '-10px', marginBottom: '15px' }}>
              No slots available for this date.
            </p>
          )}

          <button 
            onClick={handleBooking} 
            className="book-btn"
            disabled={!selectedDoctor || !date || !time}
            style={{ opacity: (!selectedDoctor || !date || !time) ? 0.5 : 1, cursor: (!selectedDoctor || !date || !time) ? 'not-allowed' : 'pointer' }}
          >
            Book Appointment
          </button>
        </div>

        {showSuccessPopup && (
          <div className="popup-overlay">
            <div className="popup-card modern">

              <div className="success-icon">✔</div>

              <h2>Appointment Confirmed</h2>

              <div className="appointment-details">
                <p><strong>Doctor:</strong> Dr. {selectedDoctor.firstName} {selectedDoctor.lastName} </p>
                <p><strong>Date:</strong> {date}</p>
                <p><strong>Time:</strong> {time}</p>
              </div>

              <div className="video-section">
                <p className="video-label">Video Consultation</p>

                {/* Clickable Link */}
                <a
                  href={`/patient/video-call?roomId=${roomId}`}
                  className={`video-link ${!isJoinAllowed() ? "disabled" : ""}`}
                  onClick={(e) => {
                    if (!isJoinAllowed()) e.preventDefault();
                  }}
                >
                  {isJoinAllowed() ? "🔵 Join Consultation" : "⏳ Available at scheduled time"}
                </a>

                {/* Copy Link */}
                <div className="copy-link">
                  <input
                    type="text"
                    value={`${window.location.origin}/patient/video-call?roomId=${roomId}`}
                    readOnly
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/patient/video-call?roomId=${roomId}`
                      );
                      alert("Link copied!");
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <button
                className="secondary-btn"
                onClick={() => {
                  setShowSuccessPopup(false);
                  navigate("/patient/dashboard");
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointment;
