const nodemailer = require('nodemailer');

const sendEmail = async options => {
  //1) create transport
  //
  const transporter = nodemailer.createTransport({
    //     service: 'Gmail',
    //if using mailtrap for testing dont use port 25 use port 2525
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    //logger will log all the process or steps easier for debugging process
    logger: false,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
    //activate in gmail "less secue app" option if you are using gmail as service
  });

  //2) Define the email options
  //
  const emailOptions = {
    from: 'Natours CEO <nat@natours.io>',
    to: options.email,
    subject: options.subject,
    text: options.message
    //     html
  };

  //3) actually send the email
  await transporter.sendMail(emailOptions);
};

module.exports = sendEmail;
