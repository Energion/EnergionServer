import express from 'express';
import IndexModel from '../models';

import fs from 'fs';
import tabletojson from 'tabletojson';
import moment from 'moment';

const router  = express.Router();

//home
router.get('/', function(req, res) {
    res.render('index', IndexModel());
});

router.get('/get-dataset', function (req, res) {
  fs.readFile('./data/prices.xls', (err, data) => {
    if (err) throw err;
    const datatable = data.toString('utf8');
    const tablesAsJson = tabletojson.convert(datatable);
    const jsonTable = tablesAsJson[1];

    let days = [];
    const newDays = removeUnusedKeys(jsonTable);
    const cleanedHours = cleanHours(newDays);

    for (let i = 0; i < cleanedHours.length; i++) {
      const hour = cleanedHours[i];
      for (let dateKey in hour) {
        const hourVal = hour.hour;
        if (hour.hasOwnProperty(dateKey)) {
          if (!arrayHasObejectWithValue(days, dateKey)) {
            if (dateKey != 'hour') {
              days.push({
                date: dateKey,
                hours: getHours(cleanedHours, dateKey),
              })
            }
          }
        }
      }
    }
    days = convertPricesToNumbers(days);
    days = minifyDataset(days);
    res.json(days);
  });
});

module.exports = router;

function arrayHasObejectWithValue (days, date) {
  let found = false;
  for (let i = 0; i < days.length; i++) {
      if (days[i].date == date) {
          found = true;
          break;
      }
  }
  return found;
}

function removeUnusedKeys (days) {
  let newDays = [];

  days.forEach((day) => {
    if (day['0'] != '' && day['0'] != 'Min' && day['0'] != 'Max' &&
    day['0'] != 'Average' && day['0'] != 'Peak' && day['0'] != 'Off-peak1' &&
    day['0'] != 'Off-peak2') {
      newDays.push(day);
    }
  })

  return newDays;
}

function cleanHours (days) {
  days.forEach((day) => {
    const hour = day['0'];
    const splitHours = hour.split('-');
    day.hour = splitHours[0].trim();
    delete day['0'];
  });
  return days;
}

function getHours (hours, date) {
  let newHours = [];
  for (let i = 0; i < hours.length; i++) {
    newHours.push({
      hour: hours[i].hour,
      price: hours[i][date],
    })
  }
  return newHours;
}

function convertPricesToNumbers (days) {
  days.forEach((day) => {
    day.hours.forEach((hour) => {
      const price = hour.price;
      const replPrice = price.replace(',', '.');
      hour.price = parseFloat(replPrice);
    })
  })
  return days;
}

function minifyDataset (days) {
  let newDays = [];
  days.forEach((day) => {
    const date = day.date;
    if (moment(date, 'DD-MM-YYYY').diff(moment(), 'days') >= 0) {
      newDays.push(day);
    }
  })
  return newDays;
}
