const { logger } = require('@jobscale/logger');
const { app: cert } = require('./app');
const { list } = require('./app/list');

class App {
  postSlack(data) {
    const url = 'https://jsx.jp/api/slack';
    const options = {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
    return fetch(url, options);
  }

  async post(rowsList) {
    const rows = rowsList.flat();
    if (!rows.length) return;
    logger.info(rows);
    const text = [];
    for (const row of rows) {
      const valid = row.daysRemaining < 30 ? ':warning: Warning :warning:' : ':large_green_circle:';
      const [expires] = row.validTo?.split('T') || [];
      text.push(`${valid} Expires ${row.daysRemaining} in ${expires} https://${row.host}`);
    }
    await this.postSlack({
      channel: 'infra',
      icon_emoji: ':globe_with_meridians:',
      username: 'Certificate',
      text: text.join('\n'),
    });
  }

  fetch(host) {
    return fetch(`https://${host}`)
    .then(res => { if (res.status !== 200) throw new Error('res.statusText'); })
    .then(() => cert.getSSLCertificateInfo(host))
    .catch(e => logger.error({ error: e.massage, status: e.status, host }) || { host });
  }

  async start() {
    const rows = await Promise.all(list.map(host => this.fetch(host)));
    return this.post(rows);
  }
}

new App().start()
.catch(e => { logger.error(e.message, e); });
