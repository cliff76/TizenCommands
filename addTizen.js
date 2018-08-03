fs = require('fs');
const packageJSON = 'package.json';

let errorHandler = (msg, error) => {
    if (error != undefined) {
        console.log(msg);
        console.log('Error caught!', error);
    } else {
        console.log('Error caught!', msg);
    }
    process.exit(1);
};

scripts = {
    "clean": "rimraf dist && tizen clean",
    "build": "webpack",
    "pretizen:package": "npm run build",
    "tizen:package": "tizen package -t wgt --sign $npm_package_config_tizen_profile -- dist -o dist",
    "pretizen:loadtv": "npm run tizen:package",
    "tizen:loadtv": "./twrapper install -n dist/*.wgt -t $npm_package_config_target_device",
    "prestart": "npm run tizen:loadtv",
    "start": "tizen run -p [appIdGoesHere] -t $npm_package_config_target_device"
};
let findPackageId = (next) => {
    fs.readFile('config.xml', (error, data) => {
        let parser = require('xml2js').Parser();
        parser.parseString(data, (err, json) => {
            console.log('package info', json);
            next(json.widget['tizen:application'][0]['$'].id);
        });
    });
};

let processPackage = (pkg) => {
    for(each in scripts) {
        if(! pkg.scripts.hasOwnProperty(each)) {
            pkg.scripts[each] = scripts[each];
        }
    }


    const result = JSON.stringify(pkg, null, 3);
    fs.writeFile(packageJSON, result,() => console.log(packageJSON + ' was saved!'));
};

findPackageId((appId) => {
    scripts['start'] = "tizen run -p " + appId + " -t $npm_package_config_target_device";
    fs.readFile(packageJSON, (error, data) => {
        if (!error) {
            processPackage(JSON.parse(data.toString()));
        } else {
            errorHandler('A "' + packageJSON + '" file should exist in the directory.', error);
        }
    });
});

