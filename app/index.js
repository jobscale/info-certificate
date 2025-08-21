const https = require('https');
const validator = require('validator');

const getDaysBetween = (from, to) => Math.floor(Math.abs(+from - +to) / 8.64e7);
const getDaysRemaining = (validFrom, validTo) => {
  const daysRemaining = getDaysBetween(validFrom, validTo);
  if (validTo < new Date()) return -daysRemaining;
  return daysRemaining;
};

class App {
  async getSSLCertificateInfo(host) {
    if (!validator.isFQDN(host)) throw new Error('Invalid host');
    const options = {
      agent: false,
      method: 'HEAD',
      port: 443,
      rejectUnauthorized: false,
      hostname: host,
    };
    const prom = {};
    prom.pending = new Promise((...args) => { [prom.resolve, prom.reject] = args; });
    const req = https.request(options, res => {
      const crt = res.socket.getPeerCertificate();
      const validFrom = new Date(crt.valid_from);
      const validTo = new Date(crt.valid_to);
      const daysRemaining = getDaysRemaining(new Date(), validTo);
      const valid = res.socket.authorized || false;
      prom.resolve({
        host,
        valid: valid && daysRemaining > 0,
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
        daysRemaining,
      });
    });
    req.on('error', e => prom.reject(e));
    req.end();
    return prom.pending;
  }
}

module.exports = {
  App,
  app: new App(),
};
