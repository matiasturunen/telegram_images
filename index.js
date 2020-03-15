const Telegraf = require('telegraf')
const Telegram = require('telegraf/telegram')
const download = require('image-downloader')
const path = require('path')

const telegram = new Telegram(process.env.BOT_TOKEN, {
  agent: null,        // https.Agent instance, allows custom proxy, certificate, keep alive, etc.
  webhookReply: true  // Reply via webhook
})

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => {
	ctx.reply('Welcome, friend');
	console.log('command: /start')
});
bot.on('message', (ctx) => {
	if (ctx.update.message) {
		console.log(ctx.update.message);
		if (ctx.update.message.text) {
			console.log('TEXT:', ctx.update.message.text)
		}
		if (ctx.update.message.photo) {
			console.log('PHOTO INFO:', ctx.update.message.photo);

			let p = getLargestPhoto(ctx.update.message.photo, true);
			telegram.getFile(p)
			.then(file => {
				console.log('FILE:', file);
				console.log('Downloading file...');

				const end = file.file_path.split('.')[1]; // Just assuming that all photos have file end tag...

				const imageoptions = {
					url: `https://api.telegram.org/file/bot${ process.env.BOT_TOKEN }/${ file.file_path }`,
					dest: path.join(__dirname, 'photos', file.file_unique_id + '.' + end) // Save with unique name
				}

				download.image(imageoptions)
				  .then(({ filename, image }) => {
				    console.log('Saved to', filename)  // Saved to /path/to/dest/image.jpg
				  })
				  .catch((err) => console.error(err))
			})
			.catch(err => console.error(err))
		}
		if (ctx.update.message.caption) {
			console.log('CAPTION:', ctx.update.message.caption);
		}
	}
	console.log("");
})
bot.command('komento', (ctx) => {
	console.log('GOT A COMMAND!!');
	ctx.reply('I don\'t accept commands');
})
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

	return selected;
}