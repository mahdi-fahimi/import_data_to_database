var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var fs = require('fs');
var path = require('path');
var sqlite3 = require('sqlite3').verbose();
var counter = 0;
var ayehTextArray = [];
var ayehNumber = '';
var ayehNumberArray = [];
var suraNumber = '';
var suraNumberArray = [];
var translateEnYusufali = [];
var translateFaFooladvand = [];
var translateFaMakarem = [];
var sql = '';
var quranDatabaseRowsAmount = 0;
var allowToExecute = false;
var rawTextAdressArray = ['./raw/quran_text/quran-simple.txt',
    './raw/quran_translations/en.yusufali.txt',
    './raw/quran_translations/fa.fooladvand.txt',
    './raw/quran_translations/fa.makarem.txt'];
//check if database directory has been created
var isDatabaseFolderCreated = false;
//check if database file has been created
var isDatabaseFileCreated = false;
function createDatabaseDirectory() {
    // create a sqlite database
    // create folder
    if (!isDatabaseFolderCreated) {
        fs.mkdir(path.join(__dirname, 'database'), {}, function (err) {
            if (err) {
                console.log(err);
            }
            else {
                console.log('database folder created ...');
            }
        });
    }
}
function createDatabaseFile() {
    // create .db file
    if (!isDatabaseFileCreated) {
        fs.writeFile(path.join(__dirname + '/database', '', 'quran.db'), '', {}, function (err) {
            if (err) {
                console.log(err);
            }
            else {
                console.log('quran.db created ...');
            }
        });
    }
}
function createDatabase(createDatabaseDirectory, createDatabaseFile) {
    //check if database directory has been created
    isDatabaseFolderCreated = fs.existsSync(path.join(__dirname, 'database'));
    //check if database file has been created
    isDatabaseFileCreated = fs.existsSync(path.join(__dirname + '/database', 'quran.db'));
    // create directory if it doesn't exist
    createDatabaseDirectory();
    // create .db file if it doesn't exist
    createDatabaseFile();
}
// excute creating database
createDatabase(createDatabaseDirectory, createDatabaseFile);
// connect to database
var database = new sqlite3.Database('./database/quran.db', sqlite3.OPEN_READWRITE, function (err) {
    if (err) {
        console.log(err.message);
    }
});
// create a table
sql = "CREATE TABLE IF NOT EXISTS quran \n      (id INTEGER NOT NULL PRIMARY KEY, \n      sura_number,\n      ayeh_number,\n      text,\n      translation_fa_makarem,\n      translation_fa_fooladvand,\n      translation_en_yusufali)";
database.run(sql);
function ayehProcess() {
    if (allowToExecute) {
        var _loop_1 = function (i) {
            //read the file
            var rawText = fs.readFileSync(rawTextAdressArray[i], 'utf-8');
            // get evry line (ayeh)         
            rawText.split(/\r?\n/).forEach(function (line) {
                // if (rawTextAdressArray[i] === './raw/quran_text/quran-simple.txt'){
                // this loop is for getting ayeh number and sureh number 
                for (var i_1 = 0; i_1 < line.length; i_1++) {
                    if (line[i_1] === '|') {
                        ++counter;
                        // remove '|' from ayeh text
                        line = line.replace(line[i_1], '');
                    }
                    if (counter === 0 && line[i_1].match(/\d+/)) {
                        suraNumber += line[i_1];
                    }
                    if (counter === 1 && line[i_1].match(/\d+/)) {
                        if (suraNumber) {
                            suraNumberArray.push(suraNumber);
                        }
                        suraNumber = '';
                        ayehNumber += line[i_1];
                    }
                    if (counter === 2) {
                        counter = 0;
                        // remove '|' from ayeh text
                        ayehNumberArray.push(ayehNumber);
                        ayehNumber = '';
                    }
                } // end of for loop
                // v remove numbers from ayeh text v
                var str = line;
                var numbers = "0123456789";
                function check(x) {
                    return numbers.includes(x) ? true : false;
                }
                var matches = __spreadArray([], str, true).reduce(function (x, y) { return (check(y) ? x + y : x); }, "");
                line = line.replace(matches, '');
                // ^ remove numbers from ayeh text ^
                // }    
                // add each line to related array
                switch (rawTextAdressArray[i]) {
                    case './raw/quran_text/quran-simple.txt':
                        ayehTextArray.push(line);
                        break;
                    case './raw/quran_translations/en.yusufali.txt':
                        translateEnYusufali.push(line);
                        break;
                    case './raw/quran_translations/fa.fooladvand.txt':
                        translateFaFooladvand.push(line);
                        break;
                    case './raw/quran_translations/fa.makarem.txt':
                        translateFaMakarem.push(line);
                        break;
                }
            }); //end of foeEach
        };
        for (var i = 0; i < rawTextAdressArray.length; i++) {
            _loop_1(i);
        }
    }
} // end of ayehProcess function
function addAyehToDatabase() {
    if (allowToExecute) {
        for (var i = 0; i < ayehTextArray.length; i++) {
            sql = "INSERT INTO quran \n                (id, \n                sura_number,\n                ayeh_number,\n                text,\n                translation_fa_makarem,\n                translation_fa_fooladvand,\n                translation_en_yusufali)\n                VALUES(?,?,?,?,?,?,?)";
            database.run(sql, [
                i,
                suraNumberArray[i],
                ayehNumberArray[i],
                ayehTextArray[i],
                translateEnYusufali[i],
                translateFaFooladvand[i],
                translateFaMakarem[i]
            ], function (err) {
                if (err) {
                    console.log(err.message);
                }
            });
        }
    }
}
// v i get quran table row count for excute once v
// این کار را انجام می دهم برای اینکه شرطی ایجاد شود تا عملیات های اصلی فقط یک بار انجام شود
var getTableRowsAmount = function (ayehProcess, addAyehToDatabase) {
    // let getTableRowsAmount = () => {
    sql = 'SELECT COUNT(*) FROM quran';
    database.all(sql, [], function (err, result) {
        if (err) {
            console.log(err);
        }
        quranDatabaseRowsAmount = result[0]['COUNT(*)'];
        if (quranDatabaseRowsAmount < 6230) {
            allowToExecute = true;
        }
        else {
            allowToExecute = false;
        }
        ayehProcess();
        addAyehToDatabase();
    });
};
// excute adding ayeh and traslate to database
getTableRowsAmount(ayehProcess, addAyehToDatabase);
