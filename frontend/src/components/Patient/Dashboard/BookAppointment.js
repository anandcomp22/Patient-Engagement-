import React, { useState,useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./BookAppointment.css";

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

useEffect(() => {
  axios.get("http://localhost:8000/patient/doctors")
    .then(res => {
      setDoctors(res.data);
      setLoading(false);
    })
    .catch(() => setLoading(false));
}, []);

  const handleBooking = async () => {
    if (selectedDoctor && date && time) {
      try {
        const response = await axios.post(
          "http://localhost:8000/appointment/book",
          {
            doctorId: Number(selectedDoctor.doctorId),
            appointmentDate: date,
            time,
            patientId: Number(localStorage.getItem("patientId"))
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("patientToken")}`
            }
          }
        );

        alert("Appointment booked successfully!");
        localStorage.setItem("appointmentBooked", "true");
        navigate("/patient/dashboard");

      } catch (err) {
        console.error("Booking Error:", err.response?.data || err.message);
        alert("Error booking appointment. Please try again.");
      }
    } else {
      alert("Please fill all fields.");
    }
  };

  return (
    <div className="appointment-container">
      <h1 className="appointment-title">Book an Appointment</h1>

      <div className="appointment-grid">
        <div className="doctor-list">
          <h3>Select a Doctor</h3>
          {doctors.map((doc, index) => (
            <div
              key={index}
              className={`doctor-card ${
                selectedDoctor?.doctorId === doc.doctorId ? "selected" : ""
              }`}
              onClick={() => setSelectedDoctor(doc)}
            >
              <img
                src={doc.image}
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

        <div className="appointment-form">
          <h2>Schedule Appointment</h2>

          <label>Select Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-field"
          />

          <label>Select Time</label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="input-field"
          >
            <option value="">Select a time slot</option>
            <option value="09:00 AM">09:00 AM</option>
            <option value="11:00 AM">11:00 AM</option>
            <option value="01:00 PM">01:00 PM</option>
            <option value="03:00 PM">03:00 PM</option>
          </select>

          <button onClick={handleBooking} className="book-btn">
            Book Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
