import https from 'https';
import fs from 'fs';

const options = {
  hostname: 'sdk.twilio.com',
  port: 443,
  path: '/js/voice/v2.10.1/twilio.min.js',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Referer': 'http://localhost:3005/',
    'Accept-Language': 'en-US,en;q=0.9'
  }
};

const file = fs.createWriteStream('public/twilio.min.js');

https.get(options, (res) => {
  console.log('Status code:', res.statusCode);
  if (res.statusCode !== 200) {
    console.error('Failed to download: Status ' + res.statusCode);
  }
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Download Completed');
  });
}).on('error', (err) => {
  console.error('Error downloading:', err);
});
