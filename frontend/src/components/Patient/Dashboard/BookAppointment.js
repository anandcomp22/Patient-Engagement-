import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./BookAppointment.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

/* ── Tiny SVG Icons (inline, no dependency) ──────────────── */
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const VideoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
);
const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const ArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
);
const ArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
);
const FileTextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
);

/* ── Confetti Dots ───────────────────────────────────────── */
const CONFETTI_COLORS = ['#10b981','#06b6d4','#8b5cf6','#f59e0b','#ec4899','#3b82f6'];
const ConfettiEffect = () => (
  <div className="ba-confetti-wrap">
    {Array.from({ length: 18 }).map((_, i) => (
      <span
        key={i}
        className="ba-confetti-dot"
        style={{
          left: `${8 + Math.random() * 84}%`,
          top: `${Math.random() * 30}%`,
          background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          animationDelay: `${Math.random() * 0.6}s`,
          width: `${4 + Math.random() * 4}px`,
          height: `${4 + Math.random() * 4}px`,
        }}
      />
    ))}
  </div>
);

/* ── Animated Checkmark SVG ──────────────────────────────── */
const AnimatedCheckmark = () => (
  <div className="ba-check-wrap">
    <div className="ba-check-circle">
      <svg className="ba-checkmark" viewBox="0 0 36 36">
        <path className="ba-checkmark-path" d="M8 18 L15 25 L28 11" />
      </svg>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
const BookAppointment = () => {
  // ── Existing State (unchanged) ─────────────────────────────
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
  const [searchParams] = useSearchParams();

  // ── New UI State ───────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [toastHiding, setToastHiding] = useState(false);

  // ── Toast helper ───────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToastHiding(false);
    setToastMsg(msg);
    setTimeout(() => setToastHiding(true), 2000);
    setTimeout(() => { setToastMsg(""); setToastHiding(false); }, 2400);
  }, []);

  // ── 1. Fetch all doctors on mount (unchanged) ─────────────
  useEffect(() => {
    axios
      .get(`${API}/patient/doctors`)
      .then((res) => {
        setDoctors(res.data);
        setFilteredDoctors(res.data);
        const uniqueSpecialties = [...new Set(res.data.map(doc => doc.specialty).filter(Boolean))];
        setSpecialties(uniqueSpecialties);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── 2. Filter doctors when specialty or search changes ────
  useEffect(() => {
    let filtered = doctors;
    if (selectedSpecialty) {
      filtered = filtered.filter(doc => doc.specialty === selectedSpecialty);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        `${doc.firstName} ${doc.lastName}`.toLowerCase().includes(q) ||
        (doc.specialty && doc.specialty.toLowerCase().includes(q))
      );
    }
    setFilteredDoctors(filtered);

    if (selectedDoctor && selectedSpecialty && selectedDoctor.specialty !== selectedSpecialty) {
      setSelectedDoctor(null);
      setTime("");
    }
  }, [selectedSpecialty, searchQuery, doctors, selectedDoctor]);

  // ── 3. Fetch available slots when doctor and date chosen (unchanged) ──
  useEffect(() => {
    if (selectedDoctor && date) {
      setSlotsLoading(true);
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

  // ── 4. Handle Return from Payment (unchanged logic) ───────
  useEffect(() => {
    const isSuccess = searchParams.get("payment_success") === "true";
    const apptId = searchParams.get("appointmentId");
    const sessionId = searchParams.get("session_id");

    if (isSuccess && apptId && sessionId && doctors.length > 0) {
      setPaymentVerified(true);
      setPaidAppointmentId(apptId);

      const saved = localStorage.getItem("pending_booking");
      let restoredDate = date;
      let restoredTime = time;

      if (saved) {
        const data = JSON.parse(saved);
        const doc = doctors.find(d => d.doctorId == data.doctorId);
        if (doc) setSelectedDoctor(doc);
        setDate(data.date);
        setTime(data.time);
        setReason(data.reason);
        restoredDate = data.date;
        restoredTime = data.time;
      }

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
          showToast("Auto-finalize failed: " + (err.response?.data?.message || err.message));
        } finally {
          setIsBooking(false);
        }
      };

      autoFinalize();
    }
  }, [searchParams, doctors]);

  // ── Save to localStorage (unchanged) ──────────────────────
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

  const getPatientId = () => {
    const localId = localStorage.getItem("patientId");
    if (localId && !isNaN(Number(localId))) {
      return Number(localId);
    }
    
    // If not found in localStorage, try to decode from token payload
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payloadBase64 = token.split(".")[1];
        if (payloadBase64) {
          const decoded = JSON.parse(atob(payloadBase64));
          if (decoded.patientId && !isNaN(Number(decoded.patientId))) {
            return Number(decoded.patientId);
          }
        }
      } catch (e) {
        console.error("Error decoding token client-side:", e);
      }
    }
    return null;
  };

  // ── Payment handler (unchanged logic) ─────────────────────
  const handlePaymentStep = async () => {
    if (selectedDoctor && date && time) {
      const pId = getPatientId();
      if (!pId) {
        showToast("Error: Missing patient session. Please log in again.");
        return;
      }

      setIsBooking(true);
      try {
        const res = await axios.post(
          `${API}/appointment/book`,
          {
            doctorId: Number(selectedDoctor.doctorId),
            appointmentDate: date,
            time,
            reason: reason || "General Consultation",
            patientId: pId
          },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          }
        );
        if (res.data.paymentUrl) {
          window.location.href = res.data.paymentUrl;
        }
      } catch (err) {
        showToast(err.response?.data?.message || "Error booking appointment.");
      } finally {
        setIsBooking(false);
      }
    } else {
      showToast("Please fill all fields.");
    }
  };

  // ── Join allowed check (unchanged) ────────────────────────
  const isJoinAllowed = () => {
    const now = new Date();
    const appointmentTime = new Date(appointmentDateTime);
    const diff = Math.abs(now - appointmentTime) / (1000 * 60);
    return diff <= 10;
  };

  // ── Step Navigation Helpers ───────────────────────────────
  const canGoToStep2 = selectedDoctor !== null;
  const canGoToStep3 = selectedDoctor && date && time;

  const goToStep = (step) => {
    if (step === 2 && !canGoToStep2) {
      showToast("Please select a doctor first");
      return;
    }
    if (step === 3 && !canGoToStep3) {
      showToast("Please fill all scheduling details");
      return;
    }
    setCurrentStep(step);
  };

  // ── Decorative star rating (random per doctor) ────────────
  const getStars = (doc) => {
    const seed = (doc.firstName || "").length + (doc.lastName || "").length;
    const rating = 3 + (seed % 3); // 3-5 stars
    return Array.from({ length: 5 }, (_, i) => i < rating);
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="ba-container">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="ba-header">
        <h1>Book an Appointment</h1>
        <p>Schedule a video consultation with our expert physicians</p>
      </div>

      {/* ── Stepper ─────────────────────────────────────────── */}
      <div className="ba-stepper">
        <div className={`ba-step ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : 'inactive'}`}>
          <div className="ba-step-number">{currentStep > 1 ? '✓' : '1'}</div>
          <span className="ba-step-label">Choose Doctor</span>
        </div>
        <div className={`ba-step-connector ${currentStep > 1 ? 'active' : ''}`} />
        <div className={`ba-step ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : 'inactive'}`}>
          <div className="ba-step-number">{currentStep > 2 ? '✓' : '2'}</div>
          <span className="ba-step-label">Schedule</span>
        </div>
        <div className={`ba-step-connector ${currentStep > 2 ? 'active' : ''}`} />
        <div className={`ba-step ${currentStep === 3 ? 'active' : 'inactive'}`}>
          <div className="ba-step-number">3</div>
          <span className="ba-step-label">Confirm & Pay</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          STEP 1 — Choose Doctor
          ═══════════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="ba-step-content">
          <div className="ba-glass-card">
            {/* Search & Header */}
            <div className="ba-doctor-section-header">
              <h2>Choose Your Doctor</h2>
              <div className="ba-search-box">
                <span className="ba-search-icon"><SearchIcon /></span>
                <input
                  type="text"
                  placeholder="Search by name or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Specialty Chips */}
            <div className="ba-specialty-chips">
              <button
                className={`ba-chip ${selectedSpecialty === "" ? "active" : ""}`}
                onClick={() => setSelectedSpecialty("")}
              >
                All
              </button>
              {specialties.map((spec, idx) => (
                <button
                  key={idx}
                  className={`ba-chip ${selectedSpecialty === spec ? "active" : ""}`}
                  onClick={() => setSelectedSpecialty(spec)}
                >
                  {spec}
                </button>
              ))}
            </div>

            {/* Doctor Grid */}
            {loading ? (
              <p className="ba-loading-text">Loading doctors...</p>
            ) : filteredDoctors.length === 0 ? (
              <div className="ba-no-results">
                <SearchIcon />
                <p>No doctors found matching your criteria</p>
              </div>
            ) : (
              <div className="ba-doctor-grid">
                {filteredDoctors.map((doc, index) => (
                  <div
                    key={index}
                    className={`ba-doctor-card ${selectedDoctor?.doctorId === doc.doctorId ? "selected" : ""}`}
                    onClick={() => setSelectedDoctor(doc)}
                  >
                    <div className="ba-doctor-avatar-wrap">
                      <img
                        src={doc.profileImage || doc.image || "https://cdn-icons-png.flaticon.com/512/3774/3774299.png"}
                        alt={`${doc.firstName} ${doc.lastName}`}
                        className="ba-doctor-avatar"
                      />
                      {selectedDoctor?.doctorId === doc.doctorId && (
                        <span className="ba-doctor-check">✓</span>
                      )}
                    </div>
                    <div className="ba-doctor-info">
                      <p className="ba-doctor-name">Dr. {doc.firstName} {doc.lastName}</p>
                      <p className="ba-doctor-specialty">{doc.specialty || "General Physician"}</p>
                      <div className="ba-doctor-rating">
                        {getStars(doc).map((filled, i) => (
                          <span key={i} className={`ba-star ${filled ? '' : 'empty'}`}>★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Next Button */}
            <div className="ba-nav-buttons" style={{ justifyContent: 'flex-end' }}>
              <button
                className="ba-btn-primary"
                disabled={!canGoToStep2}
                onClick={() => goToStep(2)}
                style={{ maxWidth: 260 }}
              >
                Continue <ArrowRight />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          STEP 2 — Schedule Appointment
          ═══════════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="ba-step-content">
          <div className="ba-glass-card">
            {/* Selected Doctor Summary */}
            {selectedDoctor && (
              <div className="ba-selected-doctor-summary">
                <img
                  src={selectedDoctor.profileImage || selectedDoctor.image || "https://cdn-icons-png.flaticon.com/512/3774/3774299.png"}
                  alt={`${selectedDoctor.firstName} ${selectedDoctor.lastName}`}
                />
                <div>
                  <div className="ba-doc-sum-name">Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</div>
                  <div className="ba-doc-sum-spec">{selectedDoctor.specialty || "General Physician"}</div>
                </div>
                <button className="ba-change-btn" onClick={() => setCurrentStep(1)}>Change</button>
              </div>
            )}

            <div className="ba-schedule-layout">
              {/* Left: Form Fields */}
              <div>
                <div className="ba-form-group">
                  <label><FileTextIcon /> Reason for Visit</label>
                  <textarea
                    className="ba-input"
                    placeholder="Describe your symptoms or reason for visit..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                <div className="ba-form-group">
                  <label><CalendarIcon /> Select Date</label>
                  <input
                    type="date"
                    className="ba-input"
                    value={date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Right: Time Slots */}
              <div className="ba-slots-section">
                <h3><ClockIcon /> Available Time Slots</h3>
                {!date ? (
                  <p className="ba-slots-loading" style={{ color: 'var(--ba-text-muted)' }}>Select a date to view available slots</p>
                ) : slotsLoading ? (
                  <p className="ba-slots-loading">Loading availability...</p>
                ) : availableSlots.length === 0 ? (
                  <div className="ba-no-slots">No slots available for this date. Try another date.</div>
                ) : (
                  <div className="ba-time-grid">
                    {availableSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        className={`ba-time-slot ${time === slot ? "selected" : ""}`}
                        onClick={() => setTime(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Nav Buttons */}
            <div className="ba-nav-buttons">
              <button className="ba-btn-secondary" onClick={() => setCurrentStep(1)} style={{ maxWidth: 140 }}>
                <ArrowLeft /> Back
              </button>
              <button
                className="ba-btn-primary"
                disabled={!canGoToStep3}
                onClick={() => goToStep(3)}
              >
                Review & Pay <ArrowRight />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          STEP 3 — Confirm & Pay
          ═══════════════════════════════════════════════════════ */}
      {currentStep === 3 && (
        <div className="ba-step-content">
          <div className="ba-payment-summary">
            <div className="ba-summary-card">
              <h3>Booking Summary</h3>
              <div className="ba-summary-row">
                <span className="ba-summary-label">Doctor</span>
                <span className="ba-summary-value">Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}</span>
              </div>
              <div className="ba-summary-row">
                <span className="ba-summary-label">Specialty</span>
                <span className="ba-summary-value">{selectedDoctor?.specialty || "General"}</span>
              </div>
              <div className="ba-summary-row">
                <span className="ba-summary-label">Date</span>
                <span className="ba-summary-value">{date}</span>
              </div>
              <div className="ba-summary-row">
                <span className="ba-summary-label">Time</span>
                <span className="ba-summary-value">{time}</span>
              </div>
              {reason && (
                <div className="ba-summary-row">
                  <span className="ba-summary-label">Reason</span>
                  <span className="ba-summary-value" style={{ maxWidth: '60%', textAlign: 'right' }}>{reason}</span>
                </div>
              )}
              <div className="ba-summary-row">
                <span className="ba-summary-label">Type</span>
                <span className="ba-summary-value">Video Consultation</span>
              </div>
              <div className="ba-summary-total">
                <span className="ba-summary-label">Total</span>
                <span className="ba-summary-value">₹1,499</span>
              </div>
            </div>

            {/* Security Badges */}
            <div className="ba-security-badges">
              <div className="ba-badge"><ShieldIcon /> Secure Payment</div>
              <div className="ba-badge"><LockIcon /> SSL Encrypted</div>
            </div>

            {/* Action Buttons */}
            <button
              className="ba-btn-primary"
              onClick={handlePaymentStep}
              disabled={isBooking}
            >
              {isBooking ? "Processing..." : "Pay ₹1,499 — Confirm Booking"} <ArrowRight />
            </button>

            <button
              className="ba-btn-secondary"
              onClick={() => setCurrentStep(2)}
              style={{ marginTop: 12 }}
            >
              <ArrowLeft /> Back to Schedule
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          FINALIZING POPUP
          ═══════════════════════════════════════════════════════ */}
      {paymentVerified && (
        <div className="ba-overlay">
          <div className="ba-modal finalizing">
            <div className="ba-spinner-wrap">
              <div className="ba-spinner" />
            </div>
            <h2>Finalizing Your Booking</h2>
            <p className="ba-modal-subtitle">Please wait while we verify your payment and secure your slot.</p>

            <div className="ba-progress-steps">
              <div className="ba-progress-step done">
                <span className="ba-progress-step-icon">✓</span>
                Payment Received
              </div>
              <div className="ba-progress-step active">
                <span className="ba-progress-step-icon"><div className="ba-mini-spinner" /></span>
                Verifying Details
              </div>
              <div className="ba-progress-step pending">
                <span className="ba-progress-step-icon">○</span>
                Securing Your Slot
              </div>
            </div>

            <button className="ba-btn-secondary" onClick={() => navigate("/patient/dashboard")}>
              Close & Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SUCCESS POPUP
          ═══════════════════════════════════════════════════════ */}
      {showSuccessPopup && selectedDoctor && (
        <div className="ba-overlay">
          <div className="ba-modal success">
            <ConfettiEffect />
            <button className="ba-modal-close" onClick={() => setShowSuccessPopup(false)}>✕</button>

            <AnimatedCheckmark />
            <h2>Appointment Confirmed!</h2>
            <p className="ba-modal-subtitle">Your booking has been successfully confirmed</p>

            {/* Appointment Details */}
            <div className="ba-appt-details">
              <div className="ba-detail-row">
                <span className="ba-detail-icon"><UserIcon /></span>
                <span className="ba-detail-label">Doctor</span>
                <span className="ba-detail-value">Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}</span>
              </div>
              <div className="ba-detail-row">
                <span className="ba-detail-icon"><CalendarIcon /></span>
                <span className="ba-detail-label">Date</span>
                <span className="ba-detail-value">{date}</span>
              </div>
              <div className="ba-detail-row">
                <span className="ba-detail-icon"><ClockIcon /></span>
                <span className="ba-detail-label">Time</span>
                <span className="ba-detail-value">{time}</span>
              </div>
            </div>

            {/* Video Call Section */}
            <a
              href={`/patient/video-call?roomId=${roomId}`}
              className={`ba-video-link ${!isJoinAllowed() ? "disabled" : ""}`}
              onClick={(e) => { if (!isJoinAllowed()) e.preventDefault(); }}
            >
              <VideoIcon />
              {isJoinAllowed() ? "Join Video Consultation" : "Available at scheduled time"}
            </a>

            {/* Copy Link */}
            <div className="ba-copy-row">
              <input
                type="text"
                value={`${window.location.origin}/patient/video-call?roomId=${roomId}`}
                readOnly
              />
              <button
                className="ba-copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/patient/video-call?roomId=${roomId}`
                  );
                  showToast("✓ Link copied to clipboard");
                }}
              >
                Copy
              </button>
            </div>

            {/* Actions */}
            <div className="ba-modal-actions">
              <button className="ba-btn-success" onClick={() => navigate("/patient/appointments")}>
                View My Appointments
              </button>
              <button className="ba-btn-secondary" onClick={() => {
                setShowSuccessPopup(false);
                setSelectedDoctor(null);
                setDate("");
                setTime("");
                setReason("");
                setCurrentStep(1);
              }}>
                Book Another Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ───────────────────────────────────────────── */}
      {toastMsg && (
        <div className={`ba-toast ${toastHiding ? 'hiding' : ''}`}>
          <span className="ba-toast-icon">ℹ</span>
          {toastMsg}
        </div>
      )}
    </div>
  );
};

export default BookAppointment;
