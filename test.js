import test from 'ava';
import got from 'got';
import cheerio from 'cheerio';

import config from './config';

import IndexModel from './models';

const url = config.host + ':' + config.port;
const errUrl = url + '/random-page';
const dataUrl = url + '/get-dataset';

function getPageAsElement (url) {
  return got(url)
    .then((res) => {
      return cheerio.load(res.body);
    })
    .catch((err) => {
      if (err.statusCode === 404){
        return cheerio.load(err.response.body);
      }
      console.error(err);
    });
}

function isJSON (something) {
    if (typeof something != 'string')
        something = JSON.stringify(something);

    try {
        JSON.parse(something);
        return true;
    } catch (e) {
        return false;
    }
}

// OK pages (200)
test('Page text is correct', async t => {

  const $ = await getPageAsElement(url);

  t.is($('title').text(), IndexModel().title);
  t.is($('h1').text(), IndexModel().header);
  t.is($('p').text(), IndexModel().description);
});

// Error pages (404)
test('404 page has correct text', async t => {

  const $ = await getPageAsElement(errUrl);

  t.is($('title').text(), 'Not Found');
  t.is($('h1').text(), 'Not Found');
});

test('/get-dataset response is correct', async t => {

  const jsonData = await got(dataUrl)
    .then((res) => {
      return res.body;
    })
    .catch((err) => {
      if (err.statusCode === 404){
        return err.response.body;
      }
      console.error(err);
    });

  t.truthy(isJSON(jsonData));
});
