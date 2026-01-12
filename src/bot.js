const TelegramBot = require('node-telegram-bot-api');
const BitrixAPI = require('./bitrix');
const config = require('./config');

const bot = new TelegramBot(config.telegram.token, { polling: true });
const bitrix = new BitrixAPI();

// Авторизованные пользователи (в реальном проекте используйте базу данных)
const authorizedUsers = new Set();

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🤖 Добро пожаловать в Bitrix24 бот!

Доступные команды:
/auth - Авторизация
/phone <номер> - Поиск по номеру телефона
/lastname <фамилия> - Поиск по фамилии
/help - Помощь

Для начала работы необходимо авторизоваться командой /auth
  `;
  
  bot.sendMessage(chatId, welcomeMessage);
});

// Команда авторизации (упрощенная версия)
bot.onText(/\/auth/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  // В реальном проекте здесь должна быть проверка пароля или другая авторизация
  bot.sendMessage(chatId, 'Введите пароль для доступа к боту:');
  
  bot.once('message', (passwordMsg) => {
    if (passwordMsg.text === 'your_secret_password') { // Замените на ваш пароль
      authorizedUsers.add(userId);
      bot.sendMessage(chatId, '✅ Авторизация успешна! Теперь вы можете использовать бот.');
    } else {
      bot.sendMessage(chatId, '❌ Неверный пароль. Попробуйте еще раз командой /auth');
    }
  });
});

// Проверка авторизации
function checkAuth(userId, chatId) {
  if (!authorizedUsers.has(userId)) {
    bot.sendMessage(chatId, '❌ Вы не авторизованы. Используйте команду /auth');
    return false;
  }
  return true;
}

// Поиск по номеру телефона
bot.onText(/\/phone (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const phone = match[1];

  if (!checkAuth(userId, chatId)) return;

  try {
    bot.sendMessage(chatId, '🔍 Ищу контакт по номеру телефона...');
    
    const contacts = await bitrix.searchContactByPhone(phone);
    
    if (contacts.length === 0) {
      bot.sendMessage(chatId, '❌ Контакт с таким номером телефона не найден');
      return;
    }

    for (const contact of contacts) {
      const contactInfo = bitrix.formatContactInfo(contact);
      bot.sendMessage(chatId, contactInfo, { parse_mode: 'Markdown' });
    }
    
  } catch (error) {
    console.error('Ошибка поиска по телефону:', error);
    bot.sendMessage(chatId, '❌ Произошла ошибка при поиске контакта');
  }
});

// Поиск по фамилии
bot.onText(/\/lastname (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const lastName = match[1];

  if (!checkAuth(userId, chatId)) return;

  try {
    bot.sendMessage(chatId, '🔍 Ищу контакты по фамилии...');
    
    const contacts = await bitrix.searchContactByLastName(lastName);
    
    if (contacts.length === 0) {
      bot.sendMessage(chatId, '❌ Контакты с такой фамилией не найдены');
      return;
    }

    if (contacts.length > 10) {
      bot.sendMessage(chatId, `⚠️ Найдено ${contacts.length} контактов. Показываю первые 10:`);
    }

    const contactsToShow = contacts.slice(0, 10);
    
    for (const contact of contactsToShow) {
      const contactInfo = bitrix.formatContactInfo(contact);
      bot.sendMessage(chatId, contactInfo, { parse_mode: 'Markdown' });
    }
    
  } catch (error) {
    console.error('Ошибка поиска по фамилии:', error);
    bot.sendMessage(chatId, '❌ Произошла ошибка при поиске контактов');
  }
});

// Команда помощи
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
📋 *Доступные команды:*

/start - Начать работу с ботом
/auth - Авторизация в системе
/phone <номер> - Поиск клиента по номеру телефона
/lastname <фамилия> - Поиск клиентов по фамилии
/help - Показать эту справку

*Примеры использования:*
\`/phone +7 900 123 45 67\`
\`/phone 89001234567\`
\`/lastname Иванов\`

⚠️ Для работы с ботом необходима авторизация командой /auth
  `;
  
  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Обработка неизвестных команд
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Игнорируем сообщения, которые уже обработаны
  if (text && text.startsWith('/') && 
      !text.startsWith('/start') && 
      !text.startsWith('/auth') && 
      !text.startsWith('/phone') && 
      !text.startsWith('/lastname') && 
      !text.startsWith('/help')) {
    bot.sendMessage(chatId, '❌ Неизвестная команда. Используйте /help для просмотра доступных команд.');
  }
});

// Обработка ошибок
bot.on('error', (error) => {
  console.error('Telegram Bot Error:', error);
});

console.log('🤖 Telegram бот запущен!');
