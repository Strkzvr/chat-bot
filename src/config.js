require('dotenv').config();

module.exports = {
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN
  },
  bitrix: {
    domain: process.env.BITRIX_DOMAIN,
    clientId: process.env.BITRIX_CLIENT_ID,
    clientSecret: process.env.BITRIX_CLIENT_SECRET,
    accessToken: process.env.BITRIX_ACCESS_TOKEN,
    refreshToken: process.env.BITRIX_REFRESH_TOKEN
  }
};
