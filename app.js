var port        = parseInt(process.env.PORT) || 3000;
var Hapi        = require('hapi');
server          = new Hapi.Server(+port, '0.0.0.0', { cors: true });

var home = {
  index: {
    handler: function (request) {
      request.reply({success: true, message: "You are using retromail."});
    }
  }
};
server.route({
  method  : 'GET',
  path    : '/',
  config  : home.index
});

server.start(function() {
  console.log('retromail server started at: ' + server.info.uri);
});
