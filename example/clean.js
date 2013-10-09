'use strict';

var clean = require('../');
var node_path = require('path');
var node_fs = require('fs');

if ( !node_fs.exists ) {
    console.log('please run this demo with node >= 0.8.0');
    process.exit(1);
}


function remote_check_username (value, callback) {

    // Ha, this is a pointless async method
    process.nextTick(function(){
        callback('Username already taken!!');
    });
}

function md5 (string) {
    return string + 'fake0md50blah00hahahaha=.=';   
}

function print_result (err, results, details) {

    // There are always errors due to our fake `remote_check_username`, hahahaha
    if ( err ) {
        console.log('Error!', err.message || err);
        console.log('\nThe parsed result is', results);
        console.log('\nError details');

        var key;
        var detail;

        for (key in details) {
            detail = details[key];

            if ( detail.error ) {
                console.log('Error option "--' + key + '":', detail.error || '');
            }
        }
    }
}

var c = clean({
    schema: {
        username: {
            required: true,

            // async validator
            validator: function(value){
                var done = this.async();

                remote_check_username(value, function(err){
                    done(err);
                });
            },

            setter: function (value) {
                return md5(value);
            }
        },

        password: {
            setter: function (value) {
                // get the value of another property
                var username = this.get('username');
                var done = this.async();

                // guests are welcome without passwords
                if ( value || username === 'guest' ) {
                    // define a new 
                    done(null, '123456');

                } else {
                    done('Please input your password, or use "guest" account instead.');
                }
            }
        },

        cwd: {
            default: process.cwd(),
            type: node_path,

            // this is a sync validator
            validator: function (value, is_default) {
                var pkg = node_path.resolve(value, 'package.json');

                if ( !node_fs.existsSync(pkg) ) {
                    return false;
                }
            }
        }
    },

    // we will check all errors
    check_all: true
});

c.clean({
    username: 'abc',
    password: ''

}, function(err, results, details){
    console.log('clean a given object:');

    print_result(err, results, details);
});


c.parseArgv(process.argv, function(err, results, details){
    console.log('parse the current argv:');

    print_result(err, results, details);
})


