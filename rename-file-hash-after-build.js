const
    fs = require('fs'),
    build_static_folders = fs.readdirSync('./build/static').filter(value => value !== 'media'),
    build_files = fs.readdirSync('./build/').filter(value => value.indexOf('.') > -1),
    h = 'hash'
;

for (const static_dir of build_static_folders) {
    const files = fs.readdirSync(`./build/static/${static_dir}`);
    for (const file_name of files) {
        const new_file_name = file_name.replace(
            file_name.substring(
                file_name.indexOf('.') + 1,
                file_name.includes('runtime') ?
                    file_name.indexOf('.js') : file_name.indexOf('.chunk')
            ),
            h
        );
        console.log(`Rename file ${file_name} to ${new_file_name}`);
        fs.rename(
            `./build/static/${static_dir}/${file_name}`,
            `./build/static/${static_dir}/${new_file_name}`,
            err => {
                if (err) return console.error('Error renameFile', err);
            }
        );
    }
}

for (const file_name of build_files) {
    if (file_name.includes('precache-manifest')) {
        const new_file_name = file_name.replace(
            file_name.substring(
                file_name.indexOf('.') + 1,
                file_name.indexOf('.js')
            ),
            h
        );
        console.log(`Rename file ${file_name} to ${new_file_name}`);
        fs.rename(
            `./build/${file_name}`,
            `./build/${new_file_name}`,
            err => {
                if (err) return console.error('Error renameFile', err);
            }
        );

        break;
    }
}