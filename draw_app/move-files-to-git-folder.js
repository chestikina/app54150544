const
    fs = require('fs'),
    files_to_move = [
        ...
            fs.readdirSync('./build/static')
                .map(dir =>
                    fs.readdirSync(`./build/static/${dir}`).filter(file_name => !file_name.includes('runtime')).map(file => `./build/static/${dir}/${file}`)
                ),
        ['./build/asset-manifest.json'],
        ['./build/precache-manifest.hash.js']
    ]
;

for (let files of files_to_move) {
    if (files[0].includes('media')) {
        console.log(`Remove folder media`);
        const path = '../DrawerApp/auto/static/media/';
        fs.readdirSync(path).forEach(value => {
            fs.unlinkSync(`${path}${value}`);
        });
    }
    for (const file of files) {
        console.log(`Move file from "${file}" to "../DrawerApp/auto/${file.replace('/build', '').substring(2)}"`);
        fs.rename(
            file,
            `../DrawerApp/auto/${file.replace('/build', '').substring(2)}`,
            err => {
                if (err) return console.error('Error renameFile', err);
            }
        )
    }
}