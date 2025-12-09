const axios = require("axios");

const baseUrl = process.env.MAILER_API;

const sendEmail = async ({
  emailFrom = {
    name: process.env.EMAIL_FROM_NAME,
    address: process.env.EMAIL_FROM,
  },
  emailTo,
  cc,
  text,
  subject,
  html,
  bcc,
}) => {
  try {
    // const envSubject =
    //   process.env.NODE_ENV === "test"
    //     ? "TEST " + subject
    //     : process.env.NODE_ENV === "development"
    //       ? "DEV " + subject
    //       : subject;

    const body = {
      emailFrom,
      emailTo,
      cc: cc || "",
      subject: subject,
      text: text,
      html: html,
      bcc,
    };

    //  if (process.env.ENVIROMENT === "DEVELOPMENT") {
    const resendBody = {
      from: "ghj",
      to: emailTo,
      subject: subject,
      html: html || "<p></p>",
    };

    await axios.post("https://api.resend.com/emails", resendBody, {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    console.log(
      "Email Sent (Development)",
      JSON.stringify({
        from: resendBody.from,
        to: resendBody.to,
        subject: resendBody.subject,
      })
    );
    // } else {
    //   await axios.post(baseUrl, body);

    //   console.log(
    //     "Email Sent (Production)",
    //     JSON.stringify({
    //       emailFrom: emailFrom || "",
    //       emailTo: emailTo || "",
    //       cc: cc || "",
    //       bcc: bcc || "",
    //     })
    //   );
    // }
    return true;
  } catch (error) {
    console.error(
      "Email error",
      JSON.stringify({
        emailFrom: emailFrom || "",
        emailTo: emailTo || "",
        cc: cc || "",
        bcc: bcc || "",
      }),
      JSON.stringify(error?.message || error)
    );
    return false;
  }
};

module.exports = sendEmail;
