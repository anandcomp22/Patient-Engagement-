import React from "react";

const Prescription = () => {
  const containerStyle = {
    maxWidth: "600px",
    margin: "20px auto",
    padding: "20px",
    backgroundColor: "#fff",
    boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
    borderRadius: "10px",
    border: "1px solid #ddd",
    fontFamily: "Arial, sans-serif"
  };

  const headerStyle = {
    textAlign: "center",
    marginBottom: "20px"
  };

  const sectionStyle = {
    borderTop: "1px solid #ccc",
    paddingTop: "10px",
    marginBottom: "10px"
  };

  const footerStyle = {
    textAlign: "center",
    marginTop: "20px",
    fontSize: "12px",
    color: "#666"
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1>Dr. John Doe</h1>
        <p>MBBS, MD - General Physician</p>
        <p>XYZ Hospital, City</p>
        <p>Phone: (123) 456-7890</p>
      </header>

      <section style={sectionStyle}>
        <h2>Patient Details</h2>
        <p><strong>Name:</strong> Jane Smith</p>
        <p><strong>Age:</strong> 35</p>
        <p><strong>Gender:</strong> Female</p>
        <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
      </section>

      <section style={sectionStyle}>
        <h2>Diagnosis</h2>
        <p>Flu and Mild Fever</p>
      </section>

      <section style={sectionStyle}>
        <h2>Prescribed Medicines</h2>
        <ul>
          <li>Paracetamol 500mg - 1 tablet every 6 hours</li>
          <li>Cough Syrup - 10ml twice a day</li>
          <li>Vitamin C Supplement - Once a day</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2>Additional Notes</h2>
        <p>Drink plenty of fluids and take rest.</p>
      </section>

      <footer style={footerStyle}>
        <p>Signature: ______________________</p>
        <p>Get well soon!</p>
      </footer>
    </div>
  );
};

export default Prescription;