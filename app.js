var GIPHY_KEY     = process.env.GIPHY_KEY; // NOTE this is a public API key
var TELEGRAM_KEY  = process.env.TELEGRAM_KEY;
var SHIBE_POOL    = 100; // cannot be greater than the total page count on 0 offset.

var express = require('express'),
    bodyParser = require('body-parser'),
    giphy = require('giphy-wrapper')(GIPHY_KEY),
    telegram = require('telegram-bot-api')
    ;

var app = express();

var shibes = null;
var selected = null;

var chatId = 0;
var subs = [];

var bot = new telegram({
        token: TELEGRAM_KEY,
        updates: {
            enabled: true
    }
});

var getShibe = function(pool, callback) {
  giphy.search('shiba', pool, 0, function(err, data) {
    if (err || !data) {
      return callback(err, null);
    } else {
      shibes = data;
      selected =  shibes.data[Math.floor(Math.random() * pool)];
      return callback(null, selected);
    };
  });
}

app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.send('Shiba-Loader v1');
});

app.get('/ping', function(req, res) {
  res.send('PONG');
});

app.get('/shiba', function(req, res) {
  getShibe(SHIBE_POOL, function(err, image) {
    if (err) {
      res
        .status(500)
        .send(err);
    } else if (!image) {
      res
        .status(400)
        .send('No shibes available :(');
    } else {
      res.send('<html><body><img src=\''
        + image.images.original.url
        + '\'></body></html>');
    }
  });
});

app.get('*', function(req, res) {
  res
    .status(404)
    .send('404, not found :(')
  ;
});

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Listening on http://%s:%s', host, port);

  bot.on('message', function(message) {
    var cmd = message.text.toLowerCase();
    chatId = message.chat.id;

      switch(cmd) {
        case '/ping':
          bot.sendMessage({
            chat_id: chatId,
            text: 'PONG'
          });
        break;

        case '/about':
          bot.sendMessage({
            chat_id: chatId,
            text: 'I send you a shiba inu gif every hour.\n\n'
              + 'If you want a picture now, text me \'shiba\'\n'
              + 'I was built by Geoff Gardner.'
          });
        break;

        case '/shiba':
          getShibe(SHIBE_POOL, function(err, result) {
            var msg = '';
            if (err) {
              msg = 'Err... uh, something went wrong. Sorry.';
            } else if (!result) {
              msg = 'What? No shibas? Outragous!\n'
                + 'Seems that I failed to find any shibas.';
            } else {
              msg = result.images.original.url;
            }

            bot.sendMessage({
              chat_id: chatId,
              text: msg
            });
          });
        break;

        case '/subscribe':
          subs.push(chatId);
          bot.sendMessage({
            chat_id: chatId,
            text: 'grats. You\'re now part of the elite shiba club. I\'ll send you a picture of a shiba every hour!'
          });
          break;

        case '/unsubscribe':
          subs.splice(subs.indexOf(chatId), 1);
          bot.sendMessage({
            chat_id: chatId,
            text: ':( Alright. You\'ve been removed from the shiba list.'
          });
          break;

        default:
          console.log('Got an unknown message from ' + message.from.username + ': ' + message.text);
      }

  });

  setInterval(function() {
    console.log('Shiba Delivery...');
    getShibe(SHIBE_POOL, function(err, result) {
      var msg = '';
      if (err) {
        msg = 'Err... uh, something went wrong. Sorry.';
      } else if (!result) {
        msg = 'What? No shibas? Outragous!\n'
          + 'Seems that I failed to find any shibas.';
      } else {
        msg = result.images.original.url;
      }

      for (var i = 0; i < subs.length; ++i) {
        bot.sendMessage({
          chat_id: subs[i],
          text: msg
        });
      }
    });
  }, 1000 * 60 * 60);

});
