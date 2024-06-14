const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose()

let counter : number = 0;
let ayehTextArray : string[] = []; 
let ayehNumber : (string | number) = '';
let ayehNumberArray : (string | number)[] = [];
let suraNumber : (string | number) = ''
let suraNumberArray : (string | number)[] = [];
let translateEnYusufali : string[]  = []
let translateFaFooladvand : string[]  = []
let translateFaMakarem : string[]  = []
let sql : string = '';
let quranDatabaseRowsAmount : number = 0;
let allowToExecute : boolean = false;
const rawTextAdressArray : string[] = ['./raw/quran_text/quran-simple.txt',
                                  './raw/quran_translations/en.yusufali.txt',
                                  './raw/quran_translations/fa.fooladvand.txt',
                                  './raw/quran_translations/fa.makarem.txt']

//check if database directory has been created
let isDatabaseFolderCreated : boolean = false

//check if database file has been created
let isDatabaseFileCreated : boolean = false


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
        fs.writeFile(path.join(__dirname+'/database', '', 'quran.db'), '', {}, (err : any) => {
            if(err){
                console.log(err)
            } else{
                console.log('quran.db created ...')
            }
        })
    }
}

function createDatabase(createDatabaseDirectory : any, createDatabaseFile : any){
    //check if database directory has been created
    isDatabaseFolderCreated = fs.existsSync(path.join(__dirname, 'database'))

    //check if database file has been created
    isDatabaseFileCreated = fs.existsSync(path.join(__dirname+'/database', 'quran.db'))

    // create directory if it doesn't exist
    createDatabaseDirectory()
    
    // create .db file if it doesn't exist
    createDatabaseFile()
}

// excute creating database
createDatabase(createDatabaseDirectory, createDatabaseFile)

// connect to database
const database  = new sqlite3.Database('./database/quran.db', sqlite3.OPEN_READWRITE, (err : any) =>{
    if (err){
        console.log(err.message)
    }
})

// create a table
sql = `CREATE TABLE IF NOT EXISTS quran 
      (id INTEGER NOT NULL PRIMARY KEY, 
      sura_number,
      ayeh_number,
      text,
      translation_fa_makarem,
      translation_fa_fooladvand,
      translation_en_yusufali)`
database.run(sql)

function ayehProcess(){
    if(allowToExecute){
        for(let i : number = 0; i <rawTextAdressArray.length; i++) {
            //read the file
            let rawText = fs.readFileSync(rawTextAdressArray[i], 'utf-8');

            // get evry line (ayeh)         
            rawText.split(/\r?\n/).forEach((line : any) =>  {    
                // if (rawTextAdressArray[i] === './raw/quran_text/quran-simple.txt'){
                    // this loop is for getting ayeh number and sureh number 
                    for ( let i : any = 0 ; i < line.length ; i++ ) {
                        if(line[i] === '|'){
                            ++counter;
                
                            // remove '|' from ayeh text
                            line = line.replace(line[i], '')
                        }
                        if(counter === 0 && line[i].match(/\d+/)){
                            suraNumber += line[i]
                        }
                        if(counter === 1 && line[i].match(/\d+/)){     
                            if(suraNumber){
                                suraNumberArray.push(suraNumber)
                            }            
                            suraNumber = ''                             
                            ayehNumber += line[i]
                        }
                        if(counter === 2){
                            counter = 0
                            // remove '|' from ayeh text
                            ayehNumberArray.push(ayehNumber)
                            ayehNumber = ''    
                        }
                        
                    }   // end of for loop
                
                    // v remove numbers from ayeh text v
                    let str : any = line;
                    let numbers : any = "0123456789";
                    function check(x : any) {
                        return numbers.includes(x) ? true : false;
                    }
                    let matches = [...str].reduce(
                        (x : any, y : any) => (check(y) ? x + y : x),"");
                    line = line.replace(matches, '')
                    // ^ remove numbers from ayeh text ^
                // }    
                // add each line to related array
                switch (rawTextAdressArray[i]){
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
            });    //end of foeEach
        }
    }
}  // end of ayehProcess function







function addAyehToDatabase() {
    if(allowToExecute){
        for (let i : number = 0 ; i < ayehTextArray.length; i++) {
                sql = `INSERT INTO quran 
                (id, 
                sura_number,
                ayeh_number,
                text,
                translation_fa_makarem,
                translation_fa_fooladvand,
                translation_en_yusufali)
                VALUES(?,?,?,?,?,?,?)`
                database.run(sql,
                    [
                    i,
                    suraNumberArray[i],
                    ayehNumberArray[i],
                    ayehTextArray[i],
                    translateEnYusufali[i],
                    translateFaFooladvand[i],
                    translateFaMakarem[i]
                    ],
                    (err : any) =>{
                        if (err){
                            console.log(err.message)
                        }
                    }) 
            }
    }
}






// v i get quran table row count for excute once v
// این کار را انجام می دهم برای اینکه شرطی ایجاد شود تا عملیات های اصلی فقط یک بار انجام شود
let getTableRowsAmount = (ayehProcess : any, addAyehToDatabase : any) => {
    // let getTableRowsAmount = () => {
        sql = 'SELECT COUNT(*) FROM quran'
        database.all(sql,[],(err : any, result : any) =>{
            if (err){
                console.log(err)
            }
            quranDatabaseRowsAmount = result[0]['COUNT(*)']
            if(quranDatabaseRowsAmount < 6230){
                allowToExecute = true
            }else {
                    allowToExecute = false
            }
            ayehProcess()
            addAyehToDatabase()
            
        })
    }

// excute adding ayeh and traslate to database
getTableRowsAmount(ayehProcess, addAyehToDatabase)

