const Telegraf = require('telegraf')
const Telegram = require('telegraf/telegram')
const download = require('image-downloader')
const path = require('path')

const telegram = new Telegram(process.env.BOT_TOKEN, {
  agent: null,        // https.Agent instance, allows custom proxy, certificate, keep alive, etc.
  webhookReply: true  // Reply via webhook
})

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => ctx.reply('Welcome, friend'));

bot.on('message', (ctx, next) => {
const messagePromisesToFIll = [];
	if (ctx.update.message) {
		console.log(ctx.update.message);
		if (ctx.update.message.text) {

			// Put something to promises array
			messagePromisesToFIll.push(new Promise((resolve, reject) => {
				console.log('TEXT:', ctx.update.message.text);
				resolve();
			}));
		}

		if (ctx.update.message.photo) {

			messagePromisesToFIll.push( getLargestPhoto(ctx.update.message.photo, true)
			.then(p => telegram.getFile(p))
			.then(file => {
				console.log('FILE:', file);
				console.log('Downloading file...');

				const end = file.file_path.split('.')[1]; // Just assuming that all photos have file end tag...

				const imageoptions = {
					url: `https://api.telegram.org/file/bot${ process.env.BOT_TOKEN }/${ file.file_path }`,
					dest: path.join(__dirname, 'photos', file.file_unique_id + '.' + end) // Save with unique name
				}

				return download.image(imageoptions)
				  .then(({ filename, image }) => console.log('Saved to', filename));
			}))
		}

		if (ctx.update.message.caption) {
			messagePromisesToFIll.push(new Promise((resolve, reject) => {
				console.log('CAPTION:', ctx.update.message.caption);
				resolve();
			}));
		}
	}
	Promise.all(messagePromisesToFIll).then(() => {
		console.log(""); // Empty space between messages
		console.log('NEXT!');
		next();
	})
})
bot.entity('bot_command', (ctx, next) => {
	//console.log('GOT A COMMAND!! It is "' + ctx.update.message.text + '"' );
	ctx.reply('I don\'t accept commands.')
	.then(next());
});
bot.help(ctx => ctx.reply('I can\'t help you.'));
bot.launch()
console.log('START!!')

// Get largest photo from list. If dimensions=true, compares dimensions and total pixel area. If false, compares by file size
function getLargestPhoto(photos, dimensions=true) {
	let largest = 0;
	let selected = photos[0].file_id;
	photos.forEach(photo => {
		if (dimensions) {
			const area = photo.width * photo.height;
			if (area > largest) {
				largest = area;
				selected = photo.file_id;
			}
		} else {
			if (photo.size > largest) {
				largest = photo.size;
				selected = photo.file_id;
			}
		}
	});

	return Promise.resolve(selected);
}