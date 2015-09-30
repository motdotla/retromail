# retromail

Email as real mail delivered to your doorstep.

## Setup

First, [Create a free account at Context.io](http://context.io) and connect your gmail account to context.io through context.io's interface.

Second, [Create a free account at Lob.com](http://lob.com).

### Production

If running on [Heroku](http://heroku.com), do the following.

```bash
git clone https://github.com/scottmotte/retromail.git
cd retromail
heroku create
heroku addons:add scheduler
heroku addons:add sendgrid
heroku config:set CONTEXTIO_KEY=value
heroku config:set CONTEXTIO_SECRET=value
heroku config:set CONTEXTIO_ACCOUNT_ID=value
heroku config:set LOB_KEY=value
heroku config:set NAME=yourname
heroku config:set EMAIL=youremail
heroku config:set ADDRESS_LINE1="Your address"
heroku config:set ADDRESS_LINE2=value
heroku config:set ADDRESS_CITY="Your City"
heroku config:set ADDRESS_STATE=value
heroku config:set ADDRESS_ZIP=value
heroku config:set ADDRESS_COUNTRY=value
git push heroku master
```

Then setup, heroku to run the task.js once daily. It will look something like this.

![](https://raw.github.com/scottmotte/retromail/master/heroku-scheduler-example.png) 

### Development

If running locally, do the following.

Install wkhtmltopdf.

```bash
brew install wkhtmltopdf
```

```bash
cp .env.example .env
```

Inside that file set your `CONTEXTIO_KEY`, `CONTEXTIO_SECRET`, and `CONTEXTIO_ACCOUNT_ID`. The account id is the id of the gmail account you previously added.

Also, set the values for your name and address. `COUNTRY` must be a 2 letter country short-name code (ISO 3316)

Lastly, run it.

```bash
node task.js
```

## TODO

* Support printing of photo attachments
* Support printing of pdf attachments
* Support printing of other types of attachments

rawr.
