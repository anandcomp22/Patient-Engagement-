import React, { useState } from "react";
import axios from 'axios';
import "./BookAppointment.css";

const doctors = [
  {
    doctorId: 101,
    name: "Dr. Shreyas Sadavate",
    specialty: "Cardiologist",
    image: "/images/sarah.jpg",
  },
  {
    doctorId: 102,
    name: "Dr. Prathmesh Vharkal",
    specialty: "Dermatologist",
    image: "/images/michael.jpg",
  },
  {
    doctorId: 103,
    name: "Dr. Sayyoni Parate",
    specialty: "Pediatrician",
    image: "/images/emily.jpg",
  },
];


const BookAppointment = () => {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

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
                selectedDoctor === doc.name ? "selected" : ""
              }`}
              onClick={() => setSelectedDoctor(doc.name)}
            >
              <img src={doc.image} alt={doc.name} className="doctor-image" />
              <div>
                <p className="doctor-name">{doc.name}</p>
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

          <button
            onClick={async () => {
              if (selectedDoctor && date && time) {
                const selectedDoc = doctors.find(doc => doc.name === selectedDoctor);
                if (!selectedDoc) {
                  alert("Invalid doctor selected.");
                  return;
                }
            
                try {
                  const response = await axios.post("http://localhost:8000/appointment/book", {
                    date: new Date(`${date}T${time}`),
                    patientId: 123, 
                    doctorId: selectedDoc.doctorId
                  });
            
                  alert(`Appointment booked! Room ID: ${response.data.roomId}`);
                } catch (err) {
                  alert("Error booking appointment. Please try again.");
                  console.error(err);
                }
              } else {
                alert("Please fill all fields.");
              }
            }}

            className="book-btn"
          >
            Book Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
