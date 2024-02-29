const fs = require('fs');
const qs = require('qs');
const axios = require('axios');
const crypto = require('crypto');
const moment = require('moment');

/**
 * 
 * @param {string} apiUrl
 * @param {string} apiKey 
 * @param {string} apiSecret 
 * @param {string} symbol
 * @param {string} filePath
 * @param {string} startTimestamp
 * @param {string} finishTimestamp
 */
async function BitmexTradesPopulator(apiUrl, apiKey, apiSecret, symbol, filePath, startTimestamp, finishTimestamp) {

  /**
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   * private request
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   */

  /**
   * 
   * @param {string} method 
   * @param {string} path 
   * @param {any} query 
   * @param {any} data 
   * @returns 
   */
  const privateRequest = async (method, path, query, data) => {
    const queryStringified = query ? `?${qs.stringify(query)}` : '';
    const dataStringified = data ? JSON.stringify(data) : '';
    const expires = Math.floor(Date.now() / 1000 + 60);
    const digest = `${method}${path}${queryStringified}${expires}`;
    const signature = crypto.createHmac('sha256', apiSecret).update(digest).digest('hex');

    const response = await axios({
      url: `${apiUrl}${path}${queryStringified}`,
      data: dataStringified,
      method: method,
      headers: {
        'Content-Type': data ? 'application/json' : 'plain/text',
        'api-expires': expires,
        'api-key': apiKey,
        'api-signature': signature,
      },
    });

    return response;
  };

  /**
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   * populate trades
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   */

  let start = 0;
  let lastRequest = 0;
  let startTimestampMoment = moment.utc(startTimestamp);
  let finishTimestampMoment = moment.utc(finishTimestamp);

  while (startTimestampMoment.valueOf() < finishTimestampMoment.valueOf()) {
    console.log(`fetching trades from ${startTimestampMoment.format('YYYY-MM-DD HH:mm:SS')}...`);

    if ((Date.now() - lastRequest) >= 500)
      lastRequest = Date.now();
    else
      await new Promise(resolve => setTimeout(resolve, 500 - (Date.now() - lastRequest)));

    const query = {
      symbol: symbol,
      startTime: startTimestampMoment.format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'),
      start: start,
      count: 1000,
    };

    const response = await privateRequest('GET', '/api/v1/trade', query, null);

    const rateLimitRemaining = response.headers['x-ratelimit-remaining'];

    console.log('rateLimitRemaining', rateLimitRemaining);

    if (+rateLimitRemaining === 0) {
      console.log('rate limit reached, waiting 1 minute...');

      await new Promise(resolve => setTimeout(resolve, 60000));
    }

    if (response.status !== 200) {
      console.error(response.data);

      continue;
    }

    const data = response.data;
    const startTrade = data[0];
    const finishTrade = data[data.length - 1];

    if (startTrade.timestamp !== finishTrade.timestamp)
      start = 0;

    data.forEach(trade => {
      if (trade.timestamp === finishTrade.timestamp)
        start++;

      const fileName = moment.utc(trade.timestamp).startOf('hour').format('YYYY-MM-DDTHH:mm:SS') + '.csv';
      const fileData = `${trade.timestamp},${trade.side},${trade.price}\n`;

      if (!fs.existsSync(`${filePath}/${fileName}`))
        fs.writeFileSync(`${filePath}/${fileName}`, '');

      fs.appendFileSync(`${filePath}/${fileName}`, fileData);
    });

    if (startTrade.timestamp !== finishTrade.timestamp)
      startTimestampMoment = moment.utc(finishTrade.timestamp);
  }

};

module.exports = BitmexTradesPopulator;
