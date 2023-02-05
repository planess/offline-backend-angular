const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const { copy } = require('./copy');

const { from, to } = yargs(hideBin(process.argv)).argv;

copy(from, to, (err) => {
	if (err) {
		console.error(`Error with copying ${from} to ${to}: ${err.message}`);
	}

	console.info(`Moved ${from} to ${to}`);
});
