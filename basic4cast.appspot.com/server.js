// const express = require('express');
require('dotenv').config();
let express = require('express'),
  path = require('path'),
  cors = require('cors'),
  bodyParser = require('body-parser');
const unirest = require('unirest');
// const http = require('http');
const app = express();
app.use(express.static(__dirname + '/basic4cast'));
app.use(cors());

const GOOGLE_API_KEY=process.env.GOOGLE_API_KEY;
const DARKSKY_API_KEY = process.env.DARKSKY_API_KEY;
const GOOGLE_SEARCH_KEY = process.env.GOOGLE_SEARCH_KEY;


// http://localhost:3000/autocomplete?city=los
app.get('/api/autocomplete', (req, res) => {
  input = req.query.city;
  let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&types=(cities)&language=en$limit=5&key=${GOOGLE_API_KEY}`;
  let request = unirest("GET", url);
  request.end(response => {
    if (response.error) res.status(500).end(); // Send an error code to the client if there's an error
    console.log(response.body);
    let suggestions = [];

    if (response.body.status !== 'OK') {
      suggestions.push('No suggestions');
    }
    if (response.body.status == 'OK') {
      response.body.predictions.forEach(function (el) {
        suggestions.push(el.structured_formatting.main_text)
      });
    }
    console.log('response from server: ', JSON.stringify({suggestions}));
    res.status(200).send(
      JSON.stringify({suggestions})
    );
  })
});

app.get('/api/forecast', (req, res) => {
  let url=`https://api.darksky.net/forecast/${DARKSKY_API_KEY}/${req.query.location},${req.query.day}`;
  let request = unirest("GET", url);
  request.end(response => {
    if (response.error) {
      res.status(500).end();
    }
    // console.log(response.body);
    let {time, temperature, summary, icon, precipIntensity, precipProbability, pressure, humidity, windSpeed, visibility} = response.body.currently;
    res.status(200).send(
      JSON.stringify({
        time: time,
        temperature: temperature,
        summary: summary,
        icon: icon,
        precipitation: precipIntensity,
        chanceOfRain: precipProbability,
        humidity: humidity,
        pressure: pressure,
        windspeed: windSpeed,
        visibility: visibility,
      })
    );

  });
});

//Example request: localhost:3000/weather?location=49.844,24.028
//response: {"temperature":31.34,"summary":"Clear","humidity":0.85,"pressure":1018.2,"windspeed":8.62,"visibility":6.189,"cloudcover":0.28,"ozone":291.5,"temp":31.34}
// get hourly (first 24): temperature, pressure, humidity, ozone, visibility, wind speed
//get daily: daily.data[0:7]: time, temperatureLow, temperatureHigh,
app.get('/api/weather', (req, res) => {
  location = req.query.location;
  //console.log(location);
  // const {lon} = req.query.lon;
  let request = unirest("GET", `https://api.darksky.net/forecast/${DARKSKY_API}/${location}`);

  request.end(response => {
    if (response.error) {
      console.log('ERROR');
      console.log(response.error);
      res.status(500).end() // Send an error code to the client if there's an error
    }
    const timezone = response.body.timezone;
    let {time, temperature, summary, humidity, pressure, windSpeed, visibility, cloudCover, ozone} = response.body.currently;
    // const currently = response.body.currently.map(function(data){return {time:data.time, temperature: data.temperature,summary: data.summary,humidity:data.humidity,pressure:data.pressure,wind:data.windSpeed,visibilitly:data.visibility,cloud:data.cloudCover,ozone: data.ozone};});
    let hourly = response.body.hourly.data.slice(0, 24).map(function (data, i) {
      return {
        index: i,
        time: data.time,
        temperature: data.temperature,
        pressure: data.pressure,
        humidity: data.humidity,
        ozone: data.ozone,
        visibility: data.visibility,
        windSpeed: data.windSpeed
      };
    });
    let daily = response.body.daily.data.map(function (data, i) {
      return {index: i, time: data.time, tempLow: data.temperatureLow, tempHigh: data.temperatureHigh};
    });
    res.status(200).send(
      JSON.stringify({
        'currently': {
          timezone: timezone,
          time: time,
          temperature: temperature,
          summary: summary,
          humidity: humidity,
          pressure: pressure,
          windspeed: windSpeed,
          visibility: visibility,
          cloudcover: cloudCover,
          ozone: ozone,
        },
        hourly: hourly,
        weekly: daily
      })
    );
  });
});

app.get('/api/geolocate', (req, res) => {
  // const {lon} = req.query.lon;
  let request = unirest("GET", `https://maps.googleapis.com/maps/api/geocode/json?address=${req.query.address}&key=GOOGLE_API_KEY`);
  console.log('GEOLOCATE', request);
  // let request = unirest("GET", reqURL);
  request.end(response => {
    console.log('GEOLOCATE RESPONSE', response);
    if (response.error) {
      res.status(200).send(
        JSON.stringify({
          lat: '',
          lon: '',
          errorMsg: "500: Server Error"
        })).end();
    }
    if (response.statusType != 2) {
      res.status(200).send(
        JSON.stringify({
          lat: '',
          lon: '',
          errorMsg: "404: Error"
        })).end();
    }
    if (response.body.results === []) {
      res.status(200).send(
        JSON.stringify({
          lat: '',
          lon: '',
          errorMsg: "Invalid Address."
        })).end();
    }
    if (response.body.results.length > 0) {
      let lat = response.body.results[0].geometry.location.lat || '';
      let lon = response.body.results[0].geometry.location.lng || '';
      console.log('geolocate data', response.body.results[0].geometry.location, lat, lon);
      res.status(200).send(
        JSON.stringify({
          lat: lat,
          lon: lon,
        }));
    }
  });

});

app.get('/api/state-seal', (req, res) => {
  let request = unirest("GET", `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_KEY}&q=${req.query.state}%20State%20Seal&imgSize=huge&imgType=news&num=1`);
  request.end(response => {
    if (response.error) res.status(500).end(); // Send an error code to the client if there's an error
    let imgURL = response.body.items[0].pagemap.cse_image[0].src;
    // console.log('imgURL', JSON.stringify(imgURL));
    console.log('imgURL', imgURL);
    res.status(200).send(imgURL);
    // res.status(200).send(JSON.stringify(imgURL));
  });
});


// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
