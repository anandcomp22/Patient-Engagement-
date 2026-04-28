const { sendEmail } = require("./utils/mailer");
require("dotenv").config();

async function test() {
    console.log("Testing email with user:", process.env.MAIL_USER);
    try {
        await sendEmail(
            process.env.MAIL_USER, // Send to self
            "SMTP Test Connection",
            "<h1>It works!</h1><p>This is a test email from the AidME mailer utility.</p>"
        );
        console.log("Test successful!");
    } catch (e) {
        console.error("Test failed:", e);
    }
}

test();
