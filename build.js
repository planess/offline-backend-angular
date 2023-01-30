const {stat, copyFile, mkdir, readdir} = require( 'fs');
const { resolve , normalize} = require( 'path');

function copyFolder(source, dest) {
	stat(source,(err, stats) => {
		if (err) {
			// do nothing
			console.error('folder error', err);
		} else	if (stats.isDirectory()) {
			mkdir(normalize(dest), {recursive: true}, () => {
				readdir(source, {withFileTypes: true},(err, files) => {
					if (err) {
						console.log('directory error' , err);

						return;
					}

					files.forEach(file => {
						if (file.isDirectory()) {
							console.log('-nested dir', file.name);
							copyFolder(`${source}/${file.name}`, `${dest}/${file.name}`);
						} else if (file.isFile()) {
							console.log('-nested file', file.name);
							copyFile(`${source}/${file.name}`, `${dest}/${file.name}`, () => {
								console.log(`File ${source}/${file.name} moved to ${dest}/${file.name}`);
							});
						}
					});
				});
			});
		} else if (stats.isFile()) {
			console.log('-nested file', source);
			copyFile(source, dest, () => {
				console.log(`File ${source} moved to ${dest}`);
			});
		}
	} );
}


copyFolder('./projects/offline-network/docs', './dist/offline-network/docs');
