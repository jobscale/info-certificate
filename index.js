const { logger } = require('@jobscale/logger');
const { app: cert } = require('./app');
const { list } = require('./app/list');

const wait = ms => new Promise(resolve => { setTimeout(resolve, ms); });

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

  async post(rowsList) {
    const rows = rowsList.flat();
    if (!rows.length) return;
    logger.info(rows);
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < rows.length; ++i && await wait(8000)) {
      await this.postSlack({
        channel: 'C9LH546RW',
        icon_emoji: ':globe_with_meridians:',
        username: 'Certificate',
        text: rows[i],
      });
    }
  }

  fetch(host) {
    return cert.getSSLCertificateInfo(host)
    .catch(e => logger.error({ error: e.massage, status: e.status, host }) || []);
  }

  async start() {
    const rows = await Promise.all(list.map(host => this.fetch(host)));
    return this.post(rows);
  }
}

new App().start()
.catch(e => {
  logger.error(e.message, e);
});
