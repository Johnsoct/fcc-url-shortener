require('dotenv').config();
const bodyParser = require('body-parser')
const dns = require('dns')
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const parseURLEncoded = bodyParser.urlencoded({ extended: false })
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));


app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const shortUrlMap = new Map()

app.post('/api/shorturl', parseURLEncoded, async function (req, res) {
  try {
    const url = new URL(req.body.url)
    await dns.lookup(url.host, (err, address) => {
      if (err && url.hostname !== 'localhost') {
        console.log('Website does not exist')
        res.json({ error: 'invalid url' })
      }
      else {
        // First iteration
        if (shortUrlMap.size === 0) {
          shortUrlMap.set(url.href, 1)
          res.json({ 
            original_url: url.href, 
            short_url: 1,
            map: Array.from(shortUrlMap),
          })
        }
        // Check if URL already exists in map
        else if (shortUrlMap.has(url.href)) {
          res.json({
            original_url: url.href, 
            short_url: shortUrlMap.get(url.href), 
            map: Array.from(shortUrlMap),
          })
        }
        // Add new URL to map
        else {
          const nextIterator = shortUrlMap.size + 1
          shortUrlMap.set(url.href, nextIterator)
          res.json({ 
            original_url: url.href, 
            short_url: nextIterator,
            map: Array.from(shortUrlMap),
          })
        }
      }
    })
  }
  catch (error) {
    console.log('Bad URL')
    res.json({ error: 'invalid url' })
  }
})

app.get('/api/shorturl/:url', function (req, res) {
  // redirect to the original_url
  const shortURL = req.params.url
  const originalURL = Array.from(shortUrlMap).find((item) => item[1] === Number(shortURL))[0]

  res.redirect(originalURL)
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
