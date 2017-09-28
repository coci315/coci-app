'use strict';
const nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true, // secure:true for port 465, secure:false for port 587
  auth: {
    user: '442393297@qq.com',
    pass: '1386250Wc'
  }
});

// verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log(error);
  } else {
    console.log('Server is ready to take our messages');
  }
});

// setup email data with unicode symbols
// let mailOptions = {
//   from: '<442393297@qq.com>', // sender address
//   to: 'coci315@163.com', // list of receivers
//   subject: 'Hello ', // Subject line
//   text: 'Hello world ?', // plain text body
//   html: '<b>Hello world ?</b>' // html body
// };

// send mail with defined transport object
// transporter.sendMail(mailOptions, (error, info) => {
//   if (error) {
//     return console.log(error);
//   }
//   console.log('Message %s sent: %s', info.messageId, info.response);
// });
const mailReg = /\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/

exports.sendMail = function (opts) {
  if (!mailReg.test(opts.to)) {
    console.log('not valid mail')
    return false
  }
  const from = 'Personal_Portfolio<coci315@qq.com>'
  const to = opts.to
  const subject = opts.subject || ''
  const text = opts.text || 'Hello'
  const html = opts.html || ''
  transporter.sendMail({
    from,
    to,
    subject,
    text,
    html
  })
}