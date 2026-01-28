const Slot = require("../db/models").Slot;

setInterval(async () => {
  await Slot.updateMany(
    {
      status: "LOCKED",
      lockExpiry: { $lt: new Date() }
    },
    {
      status: "AVAILABLE",
      lockExpiry: null
    }
  );
}, 60 * 1000);
