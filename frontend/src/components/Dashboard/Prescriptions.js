import React, { useState } from "react";

const Prescriptions = () => {
  const [formData, setFormData] = useState({
    patientName: "",
    age: "",
    gender: "",
    doctorName: "",
    diagnosis: "",
    medication: "",
    dosage: "",
    instructions: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePrint = () => {
    window.print();
  };

  // The prescriptions array is defined but not used in the component
  const prescriptions = [
    { id: 1, patient: "Shreyas Sadavarte", date: "2025-03-15", email: "shreyas.sadavarte_comp22@pccoer.in" },
    { id: 2, patient: "Prathmesh Vharkal", date: "2025-03-17", email: "prathmesh.vharkal_comp22@pccoer.in" },
    { id: 3, patient: "Sayyoni Parate", date: "2025-03-20", email: "sayyoni.parate_comp22@pccoer.in" },
    { id: 4, patient: " Sujal Shahare", date: "2025-03-28", email: "sujal.shahare_comp22@pccoer.in" },
  ];

  return (
    <div className="max-w-lg mx-auto p-4 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">Prescription Form</h2>
      <div className="space-y-3">
        <input
          type="text"
          name="patientName"
          placeholder="Patient Name"
          value={formData.patientName}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          name="age"
          placeholder="Age"
          value={formData.age}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <input
          type="text"
          name="doctorName"
          placeholder="Doctor's Name"
          value={formData.doctorName}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="diagnosis"
          placeholder="Diagnosis"
          value={formData.diagnosis}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="medication"
          placeholder="Medication Name"
          value={formData.medication}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="dosage"
          placeholder="Dosage"
          value={formData.dosage}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <textarea
          name="instructions"
          placeholder="Instructions"
          value={formData.instructions}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        ></textarea>
      </div>
      <button
        onClick={handlePrint}
        className="mt-4 bg-blue-500 text-white p-2 rounded w-full"
      >
        Print Prescription
      </button>
    </div>
  );
};

export default Prescriptions;