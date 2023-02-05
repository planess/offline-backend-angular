const { stat, copyFile, mkdir, readdir } = require('fs');
const { normalize } = require('path');

function copy(source, destination, callback) {
	stat(source, (err, stats) => {
		if (err) {
			callback(err);
		}

		if (stats.isDirectory()) {
			mkdir(normalize(destination), { recursive: true }, () => {
				readdir(source, { withFileTypes: true }, (err, files) => {
					if (err) {
						callback(err);
					}

					let calls = files.length;

					files.forEach((file) => {
						const sourceFolder = `${source}/${file.name}`;
						const destinationFolder = `${destination}/${file.name}`;

						if (file.isDirectory()) {
							copy(sourceFolder, destinationFolder, () => {
								calls--;

								if (calls <= 0) {
									callback();
								}
							});
						} else if (file.isFile()) {
							copyFile(sourceFolder, destinationFolder, () => {
								calls--;

								if (calls <= 0) {
									callback();
								}
							});
						}
					});
				});
			});
		} else if (stats.isFile()) {
			copyFile(source, destination, () => {
				callback();
			});
		} else {
			callback(new Error(`Attempt to copy unknown file '${source}'.`));
		}
	});
}

module.exports = {
	copy,
};
