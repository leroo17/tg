// Установка апи ТГ в проект
// npm init
// npm i node-telegram-bot-api nodemon

// настраиваем скрипты в package.json
// "dev": "nodemon index.js",
// "start": "node index.js"

// в index.js:



const TelegramApi = require('node-telegram-bot-api');
require('dotenv').config();
const cron = require('node-cron');
const CHANNEL_ID = '@calendar_football';
const pool = require('./bd');
const { numberOptions, fruitOptions, againOptions} = require ('./options');

const token = process.env.TOKEN;
const bot = new TelegramApi(token, {polling:  true});
const chats = {};

const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const fruits = ['🍌', '🍏', '🍐', '🍋', '🍋‍🟩', '🍉', '🍇', '🍓'];
const emojies = [
    '🎲', '🍀', '🦊', '🏰', '🧝‍♀️', '✨', '🌟'
];
const stickers = [
    'CAACAgIAAxkBAAEOfuxoBAU9GifxaGL2sPHsQHphmxF4NQACygcAApb6EgWAD8KJKK3uKTYE'
];

// const startGame = async (chatId) => {
//        await bot.sendMessage(chatId, 'Я загадаю цифру 1-9, а ты угадай!');
//        const randomNumber = Math.floor(Math.random() * 10);
//        chats[chatId] = randomNumber;
//        await bot.sendMessage(chatId, 'Отгадай!', numberOptions);
// }

// const startFruitGame = async (chatId) => {
//         await bot.sendMessage(chatId, 'Угадай фрукт, что я загадал!');
//         const randomFruit = Math.floor(Math.random() * fruits.length);
//         chats[chatId] = randomFruit;
//         await bot.sendMessage(chatId, 'Отгадай!', gameOptions);
// }

function sendPostToChannel(content) {
    bot.sendMessage(CHANNEL_ID, content)
      .then(() => console.log('Пост опубликован!'))
      .catch(err => console.error('Ошибка:', err));
  }
  
  const postContent = 'Фыр-фыр 🦊\n#тест';
  sendPostToChannel(postContent);

const startUniversalGame = async (chatId, greetingGameText, gameType, arrayElements, optionsElements) => {
        await bot.sendMessage(chatId, greetingGameText);
        const randomElement = Math.floor(Math.random() * arrayElements.length);
        chats[chatId] = {
            gameType: gameType,
            answer: randomElement
        };
        await bot.sendMessage(chatId, 'Отгадай!', optionsElements);
    };
    
const start = () => {

    bot.setMyCommands([
        {command: '/start', description: 'Начальное приветствие'},
        {command: '/info', description: 'Получить информацию о пользователе'},
        {command: '/stat', description: 'Посмотреть статистику игр'},
        {command: '/gamenumbers', description: 'Игра Угадай число'},
        {command: '/gamefruits', description: 'Игра Угадай фрукт'}
    ]);

    bot.on('message', async msg => {
        const text = msg.text;
        const chatId = msg.chat.id;

        const greetingOptions = [`Привет, путник, заходи в таверну!`, `${msg.from.first_name}! Наконец-то ты вернулся!`, `${msg.from.first_name}, добро пожаловать!`, `${msg.from.first_name}, рад тебя видеть, дружище!`, `${msg.from.first_name}, рыжая эльфийка, чего ты забыла в наших лесах?!`];
        const randomGreeting = greetingOptions[Math.floor(Math.random() * greetingOptions.length)];
        
        const randomSticker = stickers[Math.floor(Math.random() * stickers.length)];

        if (!text) return;
    
        if (text === '/start') {
            await bot.sendSticker(chatId, randomSticker);
            return bot.sendMessage(chatId, `${randomGreeting}`);
        }
        if (text === '/info') {
            return bot.sendMessage(chatId, `Тебя зовут ${msg.from.first_name}`);
        }
        if (text === '/stat') {
            return bot.sendMessage(chatId, `Щас выкачу твою статистику в играх`);
        }
        if (text === '/gamenumbers') {
            return startUniversalGame(chatId, 'Я загадаю цифру 1-9, а ты угадай!', 'numbers', numbers, numberOptions);
        }
        if (text === '/gamefruits') {
            return startUniversalGame(chatId, 'Угадай фрукт, что я загадал!', 'fruits', fruits, fruitOptions);
        }
    
        return bot.sendMessage(chatId, 'Я тебя не понимаю 🦊');
    });

    bot.on('callback_query', async msg => {
            const data = msg.data;
            const chatId = msg.message.chat.id;
        
            if (data === '/again') {
                if (chats[chatId] && chats[chatId].gameType === 'numbers') {
                    return startUniversalGame(chatId, 'Я загадаю цифру 1-9, а ты угадай!', 'numbers', numbers, numberOptions);
                }
                if (chats[chatId] && chats[chatId].gameType === 'fruits') {
                    return startUniversalGame(chatId, 'Угадай фрукт, что я загадал!', 'fruits', fruits, fruitOptions);
                }
                return startUniversalGame(chatId, 'Давай сыграем в игру!', 'numbers', numbers, numberOptions);
            }
        
            const currentGame = chats[chatId];
            if (!currentGame) {
                return bot.sendMessage(chatId, 'Сначала начни игру через /gamenumbers или /gamefruits!');
            }
            let isWin = false;
            let correctAnswer;

                try {

                    if (currentGame.gameType === 'numbers') {
                        const userChoice = Number(data);
                        isWin = userChoice === currentGame.answer;
                        correctAnswer = currentGame.answer;
                    } else if (currentGame.gameType === 'fruits') {
                        const userChoice = data; // здесь уже текст эмодзи
                        console.log(userChoice);
                        isWin = userChoice === fruits[currentGame.answer]; // сравниваем эмодзи с эмодзи
                        correctAnswer = fruits[currentGame.answer];
                    }

                    await pool.query(`
                        INSERT INTO game_statistic (chat_id, gameType, wins, games_total)
                        VALUES (?, ?, ?, 1)
                        ON DUPLICATE KEY UPDATE 
                        wins = wins + ?,
                        games_total = games_total + 1
                    `, [chatId, currentGame.gameType, isWin ? 1 : 0, isWin ? 1 : 0]);
                    
                    console.log('✅ Результат сохранён в БД');
                } catch (err) {
                    console.error('❌ Ошибка при сохранении в БД:', err);
                }
        
            const answerText = isWin
                ? `Поздравляю! Ты угадал ${correctAnswer}! 🎉`
                : `Увы, я загадал ${correctAnswer} 😜`;

            await bot.sendMessage(chatId, `Ты выбрал ${data}`);
            await bot.sendMessage(chatId, answerText, againOptions);
        });
};

start();

