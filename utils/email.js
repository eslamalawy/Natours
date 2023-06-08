const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Jonas Schmdtmann <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV.trim() === "production") {
      // sendgrid
      return 1;
    }

    //)development with mailtrap
    // return nodemailer.createTransport({
    //   host: process.env.EMAIL_HOST,
    //   port: process.env.EMAIL_PORT,
    //   auth: {
    //     user: process.env.EMAIL_USERNAME,
    //     pass: process.env.EMAIL_PASSWORD,
    //   },
    // });

    //)development with ELASTIC email service
    return nodemailer.createTransport({
      host: process.env.ELASTIC_EMAIL_HOST,
      port: process.env.ELASTIC_EMAIL_PORT,
      auth: {
        user: process.env.ELASTIC_EMAIL_USERNAME,
        pass: process.env.ELASTIC_EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    //send the actual email
    //1) RENDER html baseed on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    //2) define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html),
    };

    //3) create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to the natours Family!");
  }

  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your password reset token (valid for 10 minutes)"
    );
  }
};

// create a transporter for gmail
//   const transporter = nodemailer.createTransport({
//     service: "Gmail",
//     auth: {
//       user: process.env.EMAIL_USERNAME, // gmail account
//       pass: process.env.EMAIL_PASSWORD, // gmail password
//     },
//     //Activate in gmail "less secure app" option
//   });
