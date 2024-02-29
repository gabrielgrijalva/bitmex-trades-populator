const fs = require('fs');
const moment = require('moment');

/**
 * 
 * @param {number} candlesInterval 
 * @param {string} tradesFilesPath
 * @param {string} candlesFilePath 
 */
async function BitmexCandlesPopulator(candlesInterval, tradesFilesPath, candlesFilePath) {

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
   * create candles file
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

  fs.writeFileSync(candlesFilePath, 'timestamp,open,high,low,close\n');

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
   * create candles
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

  const candle = {
    timestamp: '',
    open: 0,
    high: 0,
    low: 0,
    close: 0,
  };

  fs.readdirSync(tradesFilesPath).sort().forEach(file => {
    const trades = fs.readFileSync(`${tradesFilesPath}/${file}`, 'utf8').split('\n');
    trades.forEach(t => {
      if (!t) return;
      const trade = t.split(',');
      const timestamp = moment.unix(Math.floor(moment.utc(trade[0]).unix() / candlesInterval) * candlesInterval).utc().format('YYYY-MM-DD HH:mm:SS');
      if (candle.timestamp === '') {
        candle.timestamp = timestamp;
        candle.open = +trade[2];
        candle.high = +trade[2];
        candle.low = +trade[2];
        candle.close = +trade[2];
      } else if (candle.timestamp !== timestamp) {
        console.log(`${candle.timestamp} saved...`);
        fs.appendFileSync(candlesFilePath, `${candle.timestamp},${candle.open},${candle.high},${candle.low},${candle.close}\n`);
        candle.timestamp = timestamp;
        candle.open = +trade[2];
        candle.high = +trade[2];
        candle.low = +trade[2];
        candle.close = +trade[2];
      } else {
        if (+trade[2] > candle.high)
          candle.high = +trade[2];
        if (+trade[2] < candle.low)
          candle.low = +trade[2];
        candle.close = +trade[2];
      }
    });
  });

};

module.exports = BitmexCandlesPopulator;
