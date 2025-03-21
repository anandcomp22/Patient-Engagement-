import React from "react";

const Prescription = () => {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg border border-gray-200">
      <header className="text-center mb-6">
        <h1 className="text-2xl font-bold">Dr. John Doe</h1>
        <p className="text-gray-600">MBBS, MD - General Physician</p>
        <p className="text-gray-600">XYZ Hospital, City</p>
        <p className="text-gray-600">Phone: (123) 456-7890</p>
      </header>

      <section className="border-t border-gray-300 pt-4 mb-4">
        <h2 className="text-xl font-semibold">Patient Details</h2>
        <p><strong>Name:</strong> Jane Smith</p>
        <p><strong>Age:</strong> 35</p>
        <p><strong>Gender:</strong> Female</p>
        <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
      </section>

      <section className="border-t border-gray-300 pt-4 mb-4">
        <h2 className="text-xl font-semibold">Diagnosis</h2>
        <p>Flu and Mild Fever</p>
      </section>

      <section className="border-t border-gray-300 pt-4 mb-4">
        <h2 className="text-xl font-semibold">Prescribed Medicines</h2>
        <ul className="list-disc pl-5">
          <li>Paracetamol 500mg - 1 tablet every 6 hours</li>
          <li>Cough Syrup - 10ml twice a day</li>
          <li>Vitamin C Supplement - Once a day</li>
        </ul>
      </section>

      <section className="border-t border-gray-300 pt-4 mb-4">
        <h2 className="text-xl font-semibold">Additional Notes</h2>
        <p>Drink plenty of fluids and take rest.</p>
      </section>

      <footer className="text-center mt-6 text-gray-500 text-sm">
        <p>Signature: ______________________</p>
        <p>Get well soon!</p>
      </footer>
    </div>
  );
};

export default Prescription;
