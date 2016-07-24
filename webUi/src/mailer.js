var nodemailer = require('nodemailer');
var fs = require('fs');

var setup = JSON.parse(fs.readFileSync("./setupfile.json"));
console.info(JSON.stringify(setup.smtpConfig));

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport(setup.smtpConfig);

function sendMail(subject, text) {
  function tohtml(text){
    while(text.indexOf("\n")!==-1) {
      text = text.replace("\n","<br>")
    }
    return "<b>" + text + "</b>";
  }
  var mailOptions = {
      from: 'admin@smarthome.com', // sender address
      to: 'arttu.piipponen@gmail.com', // list of receivers
      subject: subject, // Subject line
      text: text, // plaintext body
      html: tohtml(text) /*'<b>Hello world</b>' // html body*/
  };
  // send mail with defined transport object
  transporter.sendMail(mailOptions, function(error, info){
      if(error){
          return console.log(error);
      }
      console.info(JSON.stringify(mailOptions));
      console.log('Email message sent: ' + info.response);
  });
}


module.exports.sendMail = sendMail;
//("Halytys3","tama\ntesti\n1");
