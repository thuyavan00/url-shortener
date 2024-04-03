require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const url = require('url');
const UrlModel = require('.\\models\\urlModel.js');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI);

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

// POST request shorturl
app.post('/api/shorturl', async (req, res) => {
  try {
    const hostFromFrontend = req.body.url;
    const parsedUrl = url.parse(hostFromFrontend);
    if (
      (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') ||
      !parsedUrl.hostname
    ) {
      res.send({ error: 'Invalid url' });
    } else {
      // Perform DNS lookup
      dns.lookup(parsedUrl.hostname, async (err, address) => {
        if (err) {
          res.send({ error: 'Invalid url' });
        } else {
          console.log(parsedUrl.hostname);
          const createdUrl = await UrlModel.createAndIncrementShort(
            hostFromFrontend
          );
          res.send({ original_url: req.body.url, short_url: createdUrl.short });
        }
      });
    }
  } catch (err) {
    res.send({ error: 'Invalid url' });
  }
});

app.get('/api/shorturl/:short', async (req, res) => {
  const { short } = req.params;

  try {
    // Find the URL document with the provided short value
    const url = await UrlModel.findOne({ short });

    if (url) {
      // If the URL document is found, redirect to the original URL
      res.redirect(url.url);
    } else {
      // If the URL document is not found, return a 404 Not Found response
      res.status(404).json({ error: 'Short URL not found' });
    }
  } catch (error) {
    // Handle any errors
    console.error('Error retrieving short URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
