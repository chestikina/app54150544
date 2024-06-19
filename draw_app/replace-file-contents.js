const
    fs = require('fs'),
    need_files_to_replace = ['asset-manifest.json', 'precache-manifest.hash.js'],
    data_to_replace = [
        '{\n' +
        '  "files": {\n' +
        '    "main.css": "./static/css/main.hash.chunk.css",\n' +
        '    "main.js": "./static/js/main.hash.chunk.js",\n' +
        '    "main.js.map": "./static/js/main.hash.chunk.js.map",\n' +
        '    "runtime-main.js": "./static/js/runtime-main.hash.js",\n' +
        '    "runtime-main.js.map": "./static/js/runtime-main.hash.js.map",\n' +
        '    "static/css/2.hash.chunk.css": "./static/css/2.hash.chunk.css",\n' +
        '    "static/js/2.hash.chunk.js": "./static/js/2.hash.chunk.js",\n' +
        '    "static/js/2.hash.chunk.js.map": "./static/js/2.hash.chunk.js.map",\n' +
        '    "static/css/3.hash.chunk.css": "./static/css/3.hash.chunk.css",\n' +
        '    "static/js/3.hash.chunk.js": "./static/js/3.hash.chunk.js",\n' +
        '    "static/js/3.hash.chunk.js.map": "./static/js/3.hash.chunk.js.map",\n' +
        '    "static/css/4.hash.chunk.css": "./static/css/4.hash.chunk.css",\n' +
        '    "static/js/4.hash.chunk.js": "./static/js/4.hash.chunk.js",\n' +
        '    "static/js/4.hash.chunk.js.map": "./static/js/4.hash.chunk.js.map",\n' +
        '    "index.html": "./index.html",\n' +
        '    "precache-manifest.hash.js": "./precache-manifest.hash.js",\n' +
        '    "service-worker.js": "./service-worker.js",\n' +
        '    "static/css/2.hash.chunk.css.map": "./static/css/2.hash.chunk.css.map",\n' +
        '    "static/css/3.hash.chunk.css.map": "./static/css/3.hash.chunk.css.map",\n' +
        '    "static/css/4.hash.chunk.css.map": "./static/css/4.hash.chunk.css.map",\n' +
        '    "static/css/main.hash.chunk.css.map": "./static/css/main.hash.chunk.css.map",'
        ,
        'self.__precacheManifest = (self.__precacheManifest || []).concat([\n' +
        '  {\n' +
        '    "revision": "21266a2a921c46233d162e918bc887f9",\n' +
        '    "url": "./index.html"\n' +
        '  },\n' +
        '  {\n' +
        '    "revision": "376eee95170bd9bc4158",\n' +
        '    "url": "./static/css/2.hash.chunk.css"\n' +
        '  },\n' +
        '  {\n' +
        '    "revision": "f43fe11c2b63d4ae1f9b",\n' +
        '    "url": "./static/css/3.hash.chunk.css"\n' +
        '  },\n' +
        '  {\n' +
        '    "revision": "1000766399590e71f498",\n' +
        '    "url": "./static/css/4.hash.chunk.css"\n' +
        '  },\n' +
        '  {\n' +
        '    "revision": "74c1a3328022eaf108a6",\n' +
        '    "url": "./static/css/main.hash.chunk.css"\n' +
        '  },\n' +
        '  {\n' +
        '    "revision": "376eee95170bd9bc4158",\n' +
        '    "url": "./static/js/2.hash.chunk.js"\n' +
        '  },\n' +
        '  {\n' +
        '    "revision": "f43fe11c2b63d4ae1f9b",\n' +
        '    "url": "./static/js/3.hash.chunk.js"\n' +
        '  },\n' +
        '  {\n' +
        '    "revision": "1000766399590e71f498",\n' +
        '    "url": "./static/js/4.hash.chunk.js"\n' +
        '  },\n' +
        '  {\n' +
        '    "revision": "74c1a3328022eaf108a6",\n' +
        '    "url": "./static/js/main.hash.chunk.js"\n' +
        '  },\n' +
        '  {\n' +
        '    "revision": "2bcc722d89d37d980014",\n' +
        '    "url": "./static/js/runtime-main.hash.js"\n' +
        '  },'
    ]
;

for (const index in need_files_to_replace) {
    const file = need_files_to_replace[index];
    fs.readFile(`./build/${file}`, 'utf8', (err, data) => {
        if (err) return console.error('Error readFile', err);
        const
            data_split = data.split('\n'),
            data_replace = data_to_replace[index].split('\n')
        ;
        data_split.splice(0, data_replace.length, ...data_replace);
        console.log(`Replace file content: ${file}`);
        fs.writeFile(`./build/${file}`, data_split.join('\n'), 'utf8', function (err) {
            if (err) return console.error('Error writeFile', err);
        });
    });
}