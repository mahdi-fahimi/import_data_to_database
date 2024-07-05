const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose()

// let counter : number = 0;
let ayaTextArray : string[] = [];
// let ayaNumber : (string | number) = '';
let ayaNumberArray : (string | number)[] = [];
// let surahNumber : (string | number) = ''
let surahNumberArray : (string | number)[] = [];
let translateEnYusufali : string[]  = []
let translateFaFooladvand : string[]  = []
let translateFaMakarem : string[]  = []
let sql : string = '';
let quranDatabaseRowsAmount : number = 0;
let allowToExecute : boolean = false;
const rawTextAddressArray : string[] = ['./raw/quran_text/quran-simple.txt',
                                  './raw/quran_translations/en.yusufali.txt',
                                  './raw/quran_translations/fa.fooladvand.txt',
                                  './raw/quran_translations/fa.makarem.txt']
//check if database directory has been created
let isDatabaseFolderCreated : boolean = false
//check if database file has been created
let isDatabaseFileCreated : boolean = false

// connect to database
const database  = new sqlite3.Database('./database/quran.db', sqlite3.OPEN_READWRITE, (err : any) =>{
    if (err){
        console.log(err.message)
    }
})

function createDatabaseDirectory() {
    // create a sqlite database
    // create folder
    if (!isDatabaseFolderCreated){
        fs.mkdir(path.join(__dirname, 'database'), {}, (err : any) => {
            if(err){
                console.log(err)
            } else{
                console.log('database folder created ...')
            }
        })
    }
}

function createDatabaseFile() {   
    // create .db file
    if (!isDatabaseFileCreated){
        fs.writeFileSync(path.join(__dirname+'/database', '', 'quran.db'), '', {}, (err : any) => {
            if(err){
                console.log(err)
            } else{
                console.log('quran.db created ...')
            }
        })
    }
}

// create quran table
function createQuranTable(){
    // createDatabase()
    sql = `CREATE TABLE IF NOT EXISTS quran 
      (id INTEGER NOT NULL PRIMARY KEY, 
      surah_number,
      aya_number,
      text)`
    database.run(sql)
    console.log('createQuranTable is working ...')
}

function createDatabase(){
    return new Promise((resolve, reject) => {
        //check if database directory has been created
        isDatabaseFolderCreated = fs.existsSync(path.join(__dirname, 'database'))

        //check if database file has been created
        isDatabaseFileCreated = fs.existsSync(path.join(__dirname+'/database', 'quran.db'))

        // create directory if it doesn't exist
        createDatabaseDirectory()

        // create .db file if it doesn't exist
        createDatabaseFile()

        resolve(isDatabaseFileCreated)
    })


}

function ayaProcess(){
    if(allowToExecute){
        for(let i : number = 0; i <rawTextAddressArray.length; i++) {
            //read the file
            let rawText = fs.readFileSync(rawTextAddressArray[i], 'utf-8');

            // get every line (aya)
            rawText.split(/\r?\n/).forEach((line : any) =>  {
                let columns = line.split('|');
                surahNumberArray.push(columns[0])

                ayaNumberArray.push(columns[1])

                // add each line to related array
                switch (rawTextAddressArray[i]){
                    case './raw/quran_text/quran-simple.txt':
                        ayaTextArray.push(columns[2]);
                        break;
                    case './raw/quran_translations/en.yusufali.txt':
                        translateEnYusufali.push(columns[2]);
                        break;
                    case './raw/quran_translations/fa.fooladvand.txt':
                        translateFaFooladvand.push(columns[2]);
                        break;
                    case './raw/quran_translations/fa.makarem.txt':
                        translateFaMakarem.push(columns[2]);
                        break;
                }
            });    //end of foeEach
        }
    }
}  // end of ayaProcess function

function addAyaToDatabase() {
    if(allowToExecute){
        for (let i : number = 0 ; i < ayaTextArray.length; i++) {
                sql = `INSERT INTO quran 
                (id, 
                surah_number,
                aya_number,
                text)
                VALUES(?,?,?,?)`
                database.run(sql,
                    [
                    i,
                    surahNumberArray[i],
                    ayaNumberArray[i],
                    ayaTextArray[i]
                    ],
                    (err : any) =>{
                        if (err){
                            console.log(err.message)
                        }
                    }) 
            }
    }
}

// v i get quran table row count for execute once v
// این کار را انجام می دهم برای اینکه شرطی ایجاد شود تا عملیات های اصلی فقط یک بار انجام شود
function getTableRowsAmount ()  {
        sql = 'SELECT COUNT(*) FROM quran'
        database.all(sql,[],(err : any, result : any) =>{
            if (err){
                console.log(err)
            }
            quranDatabaseRowsAmount = result[0]['COUNT(*)']
            allowToExecute = quranDatabaseRowsAmount < 6230;
            ayaProcess()
            addAyaToDatabase()
            
        })
    }



// execute creating database
createDatabase().then((isDatabaseFileCreated) =>{
    if(isDatabaseFileCreated){
        console.log('quran table has been created!')
        createQuranTable()
    } else {
        createQuranTable()
    }
})


// createQuranTable()

// execute adding aya and translate to database
// getTableRowsAmount()

