import { logger } from '@jobscale/logger';
import { cert } from './app/index.js';
import { list } from './app/list.js';

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
      const valid = row.daysRemaining > 29 ? ':large_green_circle:' : ':warning: Warning :warning:';
      const [expires] = row.validTo?.split('T') || [];
      const url = `https://${row.host}`;
      const host = row.host.padStart(10, ' ');
      text.push(`${valid} Expires ${row.daysRemaining} in ${expires} <${url}|${host}>`);
    }
    await this.postSlack({
      channel: 'infra',
      icon_emoji: ':globe_with_meridians:',
      username: 'Certificate',
      text: text.join('\n'),
    });
  }

  fetch(input, opts = {}) {
    const { timeout = 6_000, ...init } = opts;
    const ac = new AbortController();
    ac.terminate = () => clearTimeout(ac.terminate.tid);
    ac.terminate.tid = setTimeout(() => ac.abort(), timeout);
    return fetch(input, { ...init, signal: ac.signal })
    .finally(() => ac.terminate());
  }

  fetchSite(host) {
    return this.fetch(`https://${host}`)
    .then(res => { if (res.status !== 200) throw new Error(res.statusText); })
    .then(() => cert.getSSLCertificateInfo(host))
    .catch(e => logger.error({
      cause: e.cause, error: e.massage, status: e.status, host,
    }) || { host });
  }

  async start() {
    const rows = await Promise.all(list.map(host => this.fetchSite(host)));
    return this.post(rows);
  }
}

new App().start()
.catch(e => { logger.error(e.message, e); });
