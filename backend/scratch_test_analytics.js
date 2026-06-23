const { Appointment, Prescription, FeePay, videocall, Doctor } = require("./db/models");
const mongoose = require("mongoose");
require("dotenv").config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to DB");

    // Fetch any doctor
    const doctor = await Doctor.findOne();
    if (!doctor) {
      console.log("No doctors found in DB");
      await mongoose.disconnect();
      return;
    }
    console.log(`Testing analytics for Doctor ID: ${doctor.doctorId} (${doctor.firstName} ${doctor.lastName})`);

    const doctorId = Number(doctor.doctorId);

    // Run the analytics.js query logic
    const appointments = await Appointment.find({ doctorId }).sort({ appointmentDate: 1 });
    console.log(`Found ${appointments.length} appointments`);

    const payments = await FeePay.find({ doctorId, paymentstatus: "paid" }).sort({ createdAt: 1 });
    console.log(`Found ${payments.length} paid payments`);

    const videocalls = await videocall.find({ doctorId });
    console.log(`Found ${videocalls.length} videocall logs`);

    const completedCalls = videocalls.filter(c => c.callduration);
    const avgDuration = completedCalls.length > 0
      ? Math.round(completedCalls.reduce((acc, c) => acc + c.callduration, 0) / completedCalls.length)
      : 30;
    console.log(`Average duration: ${avgDuration}`);

    const prescriptions = await Prescription.find({ doctorId });
    console.log(`Found ${prescriptions.length} prescriptions`);

    const uniquePatientIds = [...new Set(appointments.map(a => a.patientId))];
    const totalPatients = uniquePatientIds.length;
    const totalAppointments = appointments.length;
    const totalIncome = payments.reduce((acc, p) => acc + p.fees, 0);

    console.log({ totalPatients, totalAppointments, totalIncome });

    const formatDate = (d) => {
      const dateObj = new Date(d);
      const day = String(dateObj.getDate()).padStart(2, "0");
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const year = dateObj.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const dailyAppointmentsMap = {};
    const dailyPatientsMap = {};
    const dailyIncomeMap = {};
    const dailyCallDurationMap = {};
    const dailyCallCountMap = {};

    appointments.forEach(a => {
      const dStr = formatDate(a.appointmentDate);
      dailyAppointmentsMap[dStr] = (dailyAppointmentsMap[dStr] || 0) + 1;
      
      if (!dailyPatientsMap[dStr]) dailyPatientsMap[dStr] = new Set();
      dailyPatientsMap[dStr].add(a.patientId);
    });

    payments.forEach(p => {
      const dStr = formatDate(p.createdAt || new Date());
      dailyIncomeMap[dStr] = (dailyIncomeMap[dStr] || 0) + p.fees;
    });

    completedCalls.forEach(c => {
      const dStr = formatDate(c.createdAt || new Date());
      dailyCallDurationMap[dStr] = (dailyCallDurationMap[dStr] || 0) + c.callduration;
      dailyCallCountMap[dStr] = (dailyCallCountMap[dStr] || 0) + 1;
    });

    let allDates = new Set([
      ...Object.keys(dailyAppointmentsMap),
      ...Object.keys(dailyIncomeMap)
    ]);

    if (allDates.size === 0) {
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        allDates.add(formatDate(d));
      }
    }

    const sortedDates = Array.from(allDates).sort((a, b) => {
      const partsA = a.split("-");
      const partsB = b.split("-");
      return new Date(partsA[2], partsA[1]-1, partsA[0]) - new Date(partsB[2], partsB[1]-1, partsB[0]);
    });

    const appointmentsTrend = sortedDates.map(d => dailyAppointmentsMap[d] || 0);
    const patientsTrend = sortedDates.map(d => dailyPatientsMap[d] ? dailyPatientsMap[d].size : 0);
    const avgTimeTrend = sortedDates.map(d => {
      const sum = dailyCallDurationMap[d] || 0;
      const count = dailyCallCountMap[d] || 0;
      return count > 0 ? Math.round(sum / count) : 30;
    });
    const incomeTrend = sortedDates.map(d => dailyIncomeMap[d] || 0);

    const medicineCounts = {};
    prescriptions.forEach(p => {
      if (p.medicines && Array.isArray(p.medicines)) {
        p.medicines.forEach(m => {
          if (m.name) {
            const nameTrim = m.name.trim();
            medicineCounts[nameTrim] = (medicineCounts[nameTrim] || 0) + 1;
          }
        });
      }
    });

    const topMedicines = Object.entries(medicineCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(m => m.name);

    console.log("Analytics result logic successful!");
    console.log({
      datesCount: sortedDates.length,
      topMedicines,
      appointmentsTrend,
      incomeTrend
    });

  } catch (err) {
    console.error("Error running test:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
