import React, { useState, useEffect } from "react";
import axios from "axios";
<<<<<<< HEAD
import { useNavigate, useLocation } from "react-router-dom";
=======
import { useNavigate, useSearchParams } from "react-router-dom";
>>>>>>> feature/VideoCall-room
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
  const [isBooking, setIsBooking] = useState(false);
  const [reason, setReason] = useState("");

  const [paymentVerified, setPaymentVerified] = useState(false);
  const [paidAppointmentId, setPaidAppointmentId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const navigate = useNavigate();
<<<<<<< HEAD
  const location = useLocation();

  // 0. Parse Stripe redirect success
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("success") === "true") {
      const docName = params.get("docName") || "";
      const urlDate = params.get("date");
      const urlTime = params.get("time");
      const urlRoomId = params.get("roomId");
      const urlAppointmentId = params.get("appointmentId");

      // Mock selected doctor for popup display
      setSelectedDoctor({ firstName: docName.replace('Dr. ', ''), lastName: '' });
      setDate(urlDate);
      setTime(urlTime);
      setRoomId(urlRoomId);
      setAppointmentDateTime(`${urlDate}T${urlTime}`);
      setShowSuccessPopup(true);

      // Confirm payment on backend — triggers notifications to doctor, admin, patient
      if (urlAppointmentId) {
        axios.post(`${API}/appointment/confirm-payment`, 
          { appointmentId: urlAppointmentId },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        ).catch(err => console.error("Payment confirmation error:", err));
      }

      // Clean URL
      window.history.replaceState(null, '', '/patient/book');
    } else if (params.get("canceled") === "true") {
      alert("Payment was canceled. Please try booking again.");
      window.history.replaceState(null, '', '/patient/book');
    }
  }, [location.search]);
=======
  const [searchParams] = useSearchParams();
>>>>>>> feature/VideoCall-room

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
      // Removed setTime("") to prevent clearing restored data
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

  // 4. Handle Return from Payment
  useEffect(() => {
    const isSuccess = searchParams.get("payment_success") === "true";
    const apptId = searchParams.get("appointmentId");
    const sessionId = searchParams.get("session_id");

    if (isSuccess && apptId && sessionId) {
      setPaymentVerified(true);
      setPaidAppointmentId(apptId);

      // Restore from localStorage
      const saved = localStorage.getItem("pending_booking");
      let restoredDate = date;
      let restoredTime = time;

      if (saved) {
        const data = JSON.parse(saved);
        if (doctors.length > 0) {
          const doc = doctors.find(d => d.doctorId == data.doctorId);
          if (doc) setSelectedDoctor(doc);
        }
        setDate(data.date);
        setTime(data.time);
        setReason(data.reason);
        restoredDate = data.date;
        restoredTime = data.time;
      }

<<<<<<< HEAD
      const appointmentId = res.data.appointment?._id || res.data.appointment?.appointmentId;
      const rId = res.data.roomId;

      setPaymentLoading(true);

      // Call internal Stripe handler
      const stripeRes = await axios.post(`${API}/api/stripe/create-checkout-session`, {
        appointmentId,
        doctorId: selectedDoctor.doctorId,
        doctorName: `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
        date,
        time,
        roomId: rId
      });

      if (stripeRes.data.url) {
        window.location.href = stripeRes.data.url;
      } else {
        setPaymentLoading(false);
        alert("Payment gateway error.");
      }

    } catch (err) {
      setPaymentLoading(false);
      alert(err.response?.data?.message || "Error booking appointment.");
=======
      // AUTO-FINALIZE
      const autoFinalize = async () => {
        setIsBooking(true);
        try {
          const res = await axios.post(`${API}/appointment/finalize`, {
            appointmentId: apptId,
            sessionId: sessionId
          }, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          });

          if (res.data.success) {
            console.log("[AutoFinalize] Success!", res.data.appointment);

            // Ensure state is updated for the popup
            setRoomId(res.data.appointment.roomId);
            setAppointmentDateTime(`${restoredDate}T${restoredTime}`);
            setDate(restoredDate);
            setTime(restoredTime);

            setShowSuccessPopup(true);
            localStorage.removeItem("pending_booking");
            navigate("/patient/book", { replace: true });
            setPaymentVerified(false);
          }
        } catch (err) {
          console.error("Auto-finalize failed:", err);
          alert("Auto-finalize failed: " + (err.response?.data?.message || err.message));
        } finally {
          setIsBooking(false);
        }
      };

      autoFinalize();
>>>>>>> feature/VideoCall-room
    }
  }, [searchParams, doctors]);

  // Save to localStorage whenever critical fields change
  useEffect(() => {
    if (selectedDoctor || date || time || reason) {
      localStorage.setItem("pending_booking", JSON.stringify({
        doctorId: selectedDoctor?.doctorId,
        date,
        time,
        reason
      }));
    }
  }, [selectedDoctor, date, time, reason]);

  const handlePaymentStep = async () => {
    if (selectedDoctor && date && time) {
      setIsBooking(true);
      try {
        const res = await axios.post(
          `${API}/appointment/book`,
          {
            doctorId: Number(selectedDoctor.doctorId),
            appointmentDate: date,
            time,
            reason: reason || "General Consultation"
          },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          }
        );

        if (res.data.paymentUrl) {
          window.location.href = res.data.paymentUrl;
        }

      } catch (err) {
        alert(err.response?.data?.message || "Error booking appointment.");
      } finally {
        setIsBooking(false);
      }
    } else {
      alert("Please fill all fields.");
    }
  };

  const isJoinAllowed = () => {
    const now = new Date();
    const appointmentTime = new Date(appointmentDateTime);
    const diff = Math.abs(now - appointmentTime) / (1000 * 60);
    return diff <= 10;
  };

  // Removed finalizeBooking as it is now automated

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
                className={`doctor-card ${selectedDoctor?.doctorId === doc.doctorId ? "selected" : ""
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
              Booking with Dr. {selectedDoctor?.firstName}
            </p>
          ) : (
            <p style={{ color: '#888', marginBottom: '1rem' }}>Please select a doctor first.</p>
          )}

          <label>Reason for Visit</label>
          <textarea
            className="input-field"
            placeholder="Describe your symptoms or reason for visit (e.g. Fever, Routine Checkup)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ minHeight: '80px', paddingTop: '10px', resize: 'vertical' }}
            disabled={!selectedDoctor}
          />

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

<<<<<<< HEAD
          <button 
            onClick={handleBooking} 
            className="book-btn"
            disabled={!selectedDoctor || !date || !time || paymentLoading}
            style={{ opacity: (!selectedDoctor || !date || !time || paymentLoading) ? 0.5 : 1, cursor: (!selectedDoctor || !date || !time || paymentLoading) ? 'not-allowed' : 'pointer' }}
          >
            {paymentLoading ? "Redirecting to Payment..." : "Pay & Book Appointment"}
          </button>
=======
          {paymentVerified ? (
            <div className="popup-overlay">
              <div className="popup-card modern" style={{ borderTop: '6px solid #2563eb' }}>
                <div className="success-icon" style={{ background: '#e0edff', color: '#2563eb' }}>🔄</div>
                <h2>Finalizing Booking</h2>
                <p>Verifying your payment and securing your slot. Please wait...</p>
              </div>
              <button
                onClick={() => navigate("/patient/dashboard")}
                className="secondary-btn"
                style={{ marginTop: '10px' }}
              >
                Close & Go to Dashboard
              </button>
            </div>
          ) : (
            <button
              onClick={handlePaymentStep}
              className="book-btn"
              disabled={isBooking || !selectedDoctor || !date || !time}
              style={{ opacity: (isBooking || !selectedDoctor || !date || !time) ? 0.5 : 1, cursor: (isBooking || !selectedDoctor || !date || !time) ? 'not-allowed' : 'pointer' }}
            >
              {isBooking ? "Processing..." : "Proceed to Payment"}
            </button>
          )}
>>>>>>> feature/VideoCall-room
        </div>

        {showSuccessPopup && selectedDoctor && (
          <div className="popup-overlay">
            <div className="popup-card modern">

              <div className="success-icon">✔</div>

              <h2>Appointment Confirmed</h2>

              <div className="appointment-details">
                <p><strong>Doctor:</strong> Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName} </p>
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

                {/* Dashboard Button */}
                <button
                  onClick={() => navigate("/patient/book")}
                  className="secondary-btn"
                  style={{ background: '#e0edff', color: '#2563eb', border: 'none' }}
                >
                  Back
                </button>

                {/* Close Button */}
                <button
                  onClick={() => navigate("/patient/dashboard")}
                  className="secondary-btn"
                  style={{ marginTop: '10px' }}
                >
                  Close & Go to Dashboard
                </button>

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

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointment;
