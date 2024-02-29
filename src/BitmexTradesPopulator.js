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
   * get trades
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
   * @param {moment.Moment} startTime 
   * @param {moment.Moment} finishTime 
   */
  const getTrades = async (startTime, finishTime) => {
    let start = 0;
    let trades = [];

    while (true) {
      const query = {
        symbol: symbol,
        startTime: startTime.format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'),
        start: start,
        count: 1000,
      };

      const response = await privateRequest('GET', '/api/v1/trade', query, null);

      if (response.status !== 200) {
        console.error(response.data);
        continue;
      }

      const data = response.data;

      const startTrade = data[0];
      const finishTrade = data[data.length - 1];

      if (moment.utc(startTrade.timestamp).valueOf() === moment.utc(finishTrade.timestamp).valueOf()) {
        data.forEach(trade => {
          start++;
          trades.push(trade);
        });
      }
      else {
        start = 0;

        data.forEach(trade => {
          if (trade.timestamp === finishTrade.timestamp)
            return;
          if (moment.utc(trade.timestamp).valueOf() >= finishTime.valueOf())
            return;
          trades.push(trade);
        });

        if (moment.utc(finishTrade.timestamp).valueOf() >= finishTime.valueOf())
          break;

        startTime = moment.utc(finishTrade.timestamp);
      }
    }

    return trades;
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

  let startTimestampMoment = moment.utc(startTimestamp);
  let finishTimestampMoment = moment.utc(finishTimestamp);

  while (startTimestampMoment.valueOf() < finishTimestampMoment.valueOf()) {
    console.log(`fetching trades from ${startTimestampMoment.format('YYYY-MM-DD HH:mm:SS')}...`);

    const trades = await getTrades(
      startTimestampMoment.clone(),
      startTimestampMoment.clone().add(1, 'minute')
    );

    const tradesFilePath = `${filePath}/${symbol}/${startTimestampMoment.format('YYYY-MM-DDTHH:mm:SS')}.csv`;
    const tradesStringified = trades.map(trade => `${trade.timestamp},${trade.side},${trade.price}\n`).join('');

    await new Promise((resolve, reject) => {
      fs.writeFile(tradesFilePath, tradesStringified, err => {
        if (err) {
          console.error(err);
          reject(err);
        }
        else {
          console.log(`Trades saved to ${tradesFilePath}`);
          resolve();
        }
      });
    });

    startTimestampMoment = startTimestampMoment.add(1, 'minute');
  }

};

module.exports = BitmexTradesPopulator;
