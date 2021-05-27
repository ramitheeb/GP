var nodemailer = require("nodemailer");

var mail = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "monitorserver48@gmail.com",
    pass: "as1213sad2134",
  },
});

const sendMail = (otp) => {
  var mailOptions = {
    from: "monitorserver48@gmail.com",
    to: "rami.theeb00@gmail.com",
    subject: "OTP SERVER MONITOR",
    html: `you one-time-password is :  ${otp}`,
  };

  mail.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

export default sendMail;
