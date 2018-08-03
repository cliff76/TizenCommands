#!/usr/bin/env node

var program = require('commander');
fs = require('fs');

program
    .version('0.0.1')
    .usage('[options] <package.json>')
    .option('-f, --file [package.json]', 'File which contains the package.json project description')
    .option('-c, --config [config]', 'Path to the config.xml where the projectId is read from.')
    .option('-p, --projectid [projectid]', 'The project Id to use in the project.')
    .parse(process.argv);

let packageJSON = 'package.json';
let configXML = program.config ? program.config : 'config.xml';
if(!program.args.length) {
    console.log('Updating: package.json in current directory.');
} else {
    packageJSON = program.args[0];
    console.log('Updating: ' + packageJSON);
}

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
    fs.readFile(configXML, (error, data) => {
        let parser = require('xml2js').Parser();
        parser.parseString(data, (err, json) => {
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

let doUpdate = (appId) => {
    scripts['start'] = "tizen run -p " + appId + " -t $npm_package_config_target_device";
    fs.readFile(packageJSON, (error, data) => {
        if (!error) {
            processPackage(JSON.parse(data.toString()));
        } else {
            errorHandler('A "' + packageJSON + '" file should exist in the directory.', error);
        }
    });
};
if(program.projectid) {
    doUpdate(program.projectid);
} else {
    findPackageId(doUpdate);
}

