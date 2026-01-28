const Appointment = require("../db/models").Appointment;

setInterval(async () => {
  const now = new Date();

  await Appointment.updateMany(
    {
      status: "CONFIRMED",
      callStatus: "NOT_STARTED",
      appointmentDate: { $lte: now }
    },
    { callStatus: "ACTIVE" }
  );
}, 60 * 1000);
