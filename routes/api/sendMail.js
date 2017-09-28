var express = require('express');
var router = express.Router();

var sendMail = require('../../utils/mailServer').sendMail;
router.get('/sendmail', function (req, res) {
  console.log(req.query)
  const { name, email, phone, message } = req.query
  if (!name || !email || !message) {
    res.json({
      code: 0
    })
  } else {
    const html = `<h3>如题</h3>
                  <ul>
                    <li>Name: ${name}</li>
                    <li>Email: ${email}</li>
                    ${phone ? '<li>Phone: ' + phone + '</li>' : ''}
                    <li>Message: ${message}</li>
                  </ul>`
    const opts = {
      to: 'coci315@163.com',
      subject: '来自个人主页的留言',
      text: '',
      html: html
    }
    sendMail(opts)
    res.json({
      code: 1
    })
  }
})

module.exports = router;