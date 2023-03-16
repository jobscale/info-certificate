const { logger } = require('@jobscale/logger');
const { app: cert } = require('./app');
const { list } = require('./app/list');

const wait = ms => {
  const prom = {};
  prom.pending = new Promise((...argv) => { [prom.resolve] = argv; });
  setTimeout(prom.resolve, ms);
  return prom.pending;
};

class App {
  postSlack(data) {
    const url = 'https://tanpo.jsx.jp/api/slack';
    const options = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
    return fetch(url, options);
  }

  execute(host) {
    return cert.getSSLCertificateInfo(host)
    .then(item => {
      const text = Object.entries(item).map(v => v.join(': ')).join('\n');
      logger.info(text);
      this.postSlack({
        channel: 'C9LH546RW',
        icon_emoji: ':moneybag:',
        username: 'Certificate',
        text,
      });
    });
  }

  async start() {
    for (let i = 0; i < list.length;) {
      const item = list[i];
      this.execute(item);
      if (++i < list.length) await wait(5000); // eslint-disable-line no-plusplus
    }
  }
}

new App().start()
.catch(e => {
  logger.error(e.message, e);
});
