const axios = require('axios');
const config = require('./config');

class BitrixAPI {
  constructor() {
    this.domain = config.bitrix.domain;
    this.accessToken = config.bitrix.accessToken;
    this.refreshToken = config.bitrix.refreshToken;
    this.clientId = config.bitrix.clientId;
    this.clientSecret = config.bitrix.clientSecret;
  }

  async makeRequest(method, params = {}) {
    try {
      const url = `https://${this.domain}/rest/crm.contact.list.json`;
      const response = await axios.post(url, {
        auth: this.accessToken,
        ...params
      });

      if (response.data.error) {
        if (response.data.error === 'expired_token') {
          await this.refreshAccessToken();
          return this.makeRequest(method, params);
        }
        throw new Error(response.data.error_description);
      }

      return response.data;
    } catch (error) {
      console.error('Bitrix API Error:', error.message);
      throw error;
    }
  }

  async refreshAccessToken() {
    try {
      const response = await axios.post(`https://${this.domain}/oauth/token/`, {
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      
      // Здесь нужно обновить токены в .env файле или базе данных
      console.log('Токены обновлены');
    } catch (error) {
      console.error('Ошибка обновления токена:', error.message);
      throw error;
    }
  }

  async searchContactByPhone(phone) {
    try {
      const cleanPhone = phone.replace(/[^\d+]/g, '');
      
      const response = await axios.get(`https://${this.domain}/rest/crm.contact.list`, {
        params: {
          auth: this.accessToken,
          filter: {
            'PHONE': cleanPhone
          },
          select: ['ID', 'NAME', 'LAST_NAME', 'PHONE', 'EMAIL', 'COMPANY_TITLE']
        }
      });

      if (response.data.error) {
        if (response.data.error === 'expired_token') {
          await this.refreshAccessToken();
          return this.searchContactByPhone(phone);
        }
        throw new Error(response.data.error_description);
      }

      return response.data.result;
    } catch (error) {
      console.error('Ошибка поиска по телефону:', error.message);
      throw error;
    }
  }

  async searchContactByLastName(lastName) {
    try {
      const response = await axios.get(`https://${this.domain}/rest/crm.contact.list`, {
        params: {
          auth: this.accessToken,
          filter: {
            'LAST_NAME': lastName
          },
          select: ['ID', 'NAME', 'LAST_NAME', 'PHONE', 'EMAIL', 'COMPANY_TITLE']
        }
      });

      if (response.data.error) {
        if (response.data.error === 'expired_token') {
          await this.refreshAccessToken();
          return this.searchContactByLastName(lastName);
        }
        throw new Error(response.data.error_description);
      }

      return response.data.result;
    } catch (error) {
      console.error('Ошибка поиска по фамилии:', error.message);
      throw error;
    }
  }

  formatContactInfo(contact) {
    let info = `👤 *${contact.NAME || ''} ${contact.LAST_NAME || ''}*\n`;
    info += `🆔 ID: ${contact.ID}\n`;
    
    if (contact.PHONE && contact.PHONE.length > 0) {
      info += `📞 Телефон: ${contact.PHONE[0].VALUE}\n`;
    }
    
    if (contact.EMAIL && contact.EMAIL.length > 0) {
      info += `📧 Email: ${contact.EMAIL[0].VALUE}\n`;
    }
    
    if (contact.COMPANY_TITLE) {
      info += `🏢 Компания: ${contact.COMPANY_TITLE}\n`;
    }

    return info;
  }
}

module.exports = BitrixAPI;
