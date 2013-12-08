#!/usr/bin/env node

var dotenv      = require('dotenv');
dotenv.load();

var e                 = module.exports;
e.ENV                 = process.env.NODE_ENV || 'development';
CONTEXTIO_KEY         = process.env.CONTEXTIO_KEY;
CONTEXTIO_SECRET      = process.env.CONTEXTIO_SECRET;
CONTEXTIO_ACCOUNT_ID  = process.env.CONTEXTIO_ACCOUNT_ID;
LOB_KEY               = process.env.LOB_KEY;
NAME                  = process.env.NAME;
EMAIL                 = process.env.EMAIL;
ADDRESS_LINE1         = process.env.ADDRESS_LINE1;
ADDRESS_LINE2         = process.env.ADDRESS_LINE2;
ADDRESS_CITY          = process.env.ADDRESS_CITY;
ADDRESS_STATE         = process.env.ADDRESS_STATE;
ADDRESS_ZIP           = process.env.ADDRESS_ZIP;
ADDRESS_COUNTRY       = process.env.ADDRESS_COUNTRY;
LIMIT                 = process.env.LIMIT || 100;
SENDGRID_USERNAME     = process.env.SENDGRID_USERNAME;
SENDGRID_PASSWORD     = process.env.SENDGRID_PASSWORD;

var wkhtmltopdf_path  = process.env.PORT ? './bin/wkhtmltopdf-linux-amd64' : 'wkhtmltopdf';

var contextio   = require('contextio');
var exec        = require('child_process').exec;
var fs          = require('fs');
var lob         = require('lob');
lob             = new lob(LOB_KEY);
var moment      = require('moment');
var sendgrid    = require('sendgrid')(SENDGRID_USERNAME, SENDGRID_PASSWORD);

function execute(command, callback){
  exec(command, function(error, stdout, stderr){ 
    callback(stdout);
  });
};

var contextio_client  = new contextio.Client({
  key:      CONTEXTIO_KEY,
  secret:   CONTEXTIO_SECRET
});

var runTask = function () {
  var value = function () {
    var filters = {
      limit:        LIMIT,
      include_body: 1,
      folder:       "\\Inbox"
    }
    var html_paths = [];

    contextio_client.accounts(CONTEXTIO_ACCOUNT_ID).messages().get(filters, function (err, response) {
      if (err) throw err;

      response.body.forEach(function(email) {
        console.log(email);

        var subject           = email.subject;
        var from              = email.addresses.from.email;
        var date              = moment(parseInt(''+email.date+'000')).format("MMM Do");
        var body              = email.body;
        var original_content  = body[0].content;
        var content           = original_content.replace(new RegExp('\r?\n','g'), "<br/>");
        var html_path         = "/tmp/" + email.date + '-' + email.message_id + '.html';
        html_paths.push(html_path);

        var html =  '<!DOCTYPE html>' +
                    '<html>'+
                    '<head>'+
                    '<meta http-equiv="Content-Type" content="text/html;charset=utf-8" />'+
                    '</head>'+
                    '<body>'+
                    'DATE: '    +date+'<br/>'+
                    'FROM: '    +from+'<br/>'+
                    'SUBJECT: ' +subject+'<br/>'+
                    '<br/>'+
                    content +
                    '</body>'+
                    '</html>';

        fs.writeFile(html_path, html, function (err) {
          if (err) throw err;

          // I'd prefer to move to All Mail but not sure how yet. So instead, moving to trash for now.
          //var params = {
          //  dst_folder: "",
          //  move: 1
          //}
          //contextio_client.accounts(CONTEXTIO_ACCOUNT_ID).messages(email.message_id).post(params, function (err, response) {
          //  if (err) throw err;
          //});

          contextio_client.accounts(CONTEXTIO_ACCOUNT_ID).messages(email.message_id).delete(function (err, response) {
            if (err) throw err;
          });
        });
      });
      
      html_paths.sort();
      var html_paths_as_string  = html_paths.join(" ");
      var unix_time             = +new Date(); 
      var output_path           = "/tmp/" + unix_time + ".pdf";

      var command = wkhtmltopdf_path + " --page-size letter --orientation portrait " + html_paths_as_string + " " + output_path;
      execute(command, function(stdout) {
        var email     = new sendgrid.Email();
        email.to      = EMAIL;
        email.from    = EMAIL;
        email.subject = '[retromail] '+unix_time;
        email.text    = 'Attached is your retromail from '+unix_time;
        email.addFile({ path: output_path });

        sendgrid.send(email, function(err, json) {
          if (err) { return console.error(err); }
          console.log(json);
        });

        lob.addresses.create({
          name:             NAME,
          email:            EMAIL,
          address_line1:    ADDRESS_LINE1,
          address_line2:    ADDRESS_LINE2,
          address_city:     ADDRESS_CITY,
          address_state:    ADDRESS_STATE,
          address_zip:      ADDRESS_ZIP,
          address_country:  ADDRESS_COUNTRY 
        }, function(err, res) {
          var lob_address = res;

          lob.objects.create({
            name: output_path,
            file: "@"+output_path,
            setting_id: 100
          }, function(err, res) {
            var lob_object = res;

            lob.jobs.create({
              name:     output_path,
              from:     lob_address.id, 
              to:       lob_address.id,
              object1:  lob_object.id
            }, function(err, res) {
              console.log(err, res);
            });
          });
        });
      });
    });
  };

  return function (name) {
    var result;

    result = value(name);

    return result;
  }
}();

runTask();

