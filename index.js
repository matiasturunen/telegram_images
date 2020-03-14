const Telegraf = require('telegraf')
const Telegram = require('telegraf/telegram')
const download = require('image-downloader')
const path = require('path')

const telegram = new Telegram(process.env.BOT_TOKEN, {
  agent: null,        // https.Agent instance, allows custom proxy, certificate, keep alive, etc.
  webhookReply: true  // Reply via webhook
})

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => ctx.reply('Welcome'))
bot.on('message', (ctx) => {
	if (ctx.update.message) {
		console.log(ctx.update.message);
		if (ctx.update.message.text) {
			console.log('TEXT:', ctx.update.message.text)
		}
		if (ctx.update.message.photo) {
			console.log('PHOTO INFO:', ctx.update.message.photo);
			let p = ctx.update.message.photo[0].file_id;
			telegram.getFile(p)
			.then(file => {
				console.log('FILE:', file);
				console.log('Downloading file...');
				// https://api.telegram.org/file/bot<token>/<file_path>
				const imageoptions = {
					url: `https://api.telegram.org/file/bot${ process.env.BOT_TOKEN }/${ file.file_path }`,
					dest: path.join(__dirname, 'photos')
				}

				download.image(imageoptions)
				  .then(({ filename, image }) => {
				    console.log('Saved to', filename)  // Saved to /path/to/dest/image.jpg
				  })
				  .catch((err) => console.error(err))
			})
			.catch(err => console.error(err))
		}
	}
	console.log("");
})
bot.command('oldschool', (ctx) => ctx.reply('Hello'))
bot.launch()
console.log('START!!')
