const Telegraf = require('telegraf')
const Telegram = require('telegraf/telegram')
const download = require('image-downloader')
const path = require('path')
const fs = require('fs');
const { google } = require('googleapis');

const config = {
	token: process.env.BOT_TOKEN,
	drive_client_email: process.env.DRIVE_CLIENT_EMAIL,
	drive_private_key: process.env.DRIVE_PRIVATE_KEY.replace(new RegExp("\\\\n", "\g"), "\n"), // Fix key with regexp
	drive_folder: process.env.DRIVE_FOLDER,
};

const telegram = new Telegram(config.token, {
  agent: null,        // https.Agent instance, allows custom proxy, certificate, keep alive, etc.
  webhookReply: true  // Reply via webhook
});

const scopes = [
  'https://www.googleapis.com/auth/drive'
];

const auth = new google.auth.JWT(
  config.drive_client_email,
  null,
  config.drive_private_key,
  scopes
);

const drive = google.drive({
	version: 'v3',
	auth,
});

const bot = new Telegraf(config.token)
bot.start((ctx) => ctx.reply('Welcome, friend'));

bot.on('message', (ctx, next) => {
	const messagePromisesToFIll = [];
	if (ctx.update.message) {
		//console.log(ctx.update.message); // Log full message and all of it's info


		// Log user and chat info
		console.log('From:', ctx.update.message.from.first_name, ctx.update.message.from.last_name);
		if (ctx.update.message.chat.type == 'group') {
			console.log('Chat:', 'group:', ctx.update.message.chat.title);
		} else if (ctx.update.message.chat.type == 'private') {
			console.log('Chat: Private');
		} else {
			console.log('Chat: Unknown chat');
		}
		console.log('Date:', ctx.update.message.date);

		if (ctx.update.message.text) {

			// Put something to promises array
			messagePromisesToFIll.push(new Promise((resolve, reject) => {
				console.log('TEXT:', ctx.update.message.text);
				resolve();
			}));
		}

		if (ctx.update.message.photo) {

			messagePromisesToFIll.push(getLargestPhoto(ctx.update.message.photo, true)
				.then(p => telegram.getFile(p))
				.then(file => downloadFile(file)));
		}

		if (ctx.update.message.document) {
			if (ctx.update.message.document.mime_type.includes('image')) { // Only load image type
				messagePromisesToFIll.push(telegram.getFile(ctx.update.message.document.file_id)
					.then(file => downloadFile(file)));
			}
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
		next();
	}).catch(err => console.error(err));
})

bot.entity('bot_command', (ctx, next) => {
	//console.log('GOT A COMMAND!! It is "' + ctx.update.message.text + '"' );
	ctx.reply('I don\'t accept commands.')
	.then(next());
});

bot.help(ctx => ctx.reply('I can\'t help you.'));
bot.launch()
console.log('Imagetty has started succesfully!')

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

function downloadFile(file) {
	console.log('Downloading file...')
	const end = file.file_path.split('.')[1]; // Just assuming that all photos have file end tag...
	const shortname = file.file_unique_id + '.' + end;

	const fileoptions = {
		url: `https://api.telegram.org/file/bot${ process.env.BOT_TOKEN }/${ file.file_path }`,
		dest: path.join(__dirname, 'photos', shortname) // Save with unique name
	}

	return download.image(fileoptions)
	  .then(({ filename, image }) => {
	  	console.log('File download complete.');
	  	console.log('Saved to', filename);
	  	/* 
	  	 * HERE YOU CAN SAVE THE IMAGE TO ANYWHERE YOU WANT
	  	 */
	  	return uploadFile(filename, shortname)
	  		.then(() => console.log('File uploaded succesfully to drive.'))
	  		.then(() => fs.unlinkSync(filename))
	  });
}

async function uploadFile(fullpath, shortname) {
  const res = await drive.files.create({
    requestBody: {
    	parents: [config.drive_folder],
    	name: shortname,
    },
    media: {
      body: fs.createReadStream(fullpath),
    },
   });
  console.log(res.data);
  return res;
}
