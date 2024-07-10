import * as fs from 'fs';
import * as path from 'path';
import sqlite3 from 'sqlite3';

interface tableColumnsType{
    columnName : string,
    columnType : string
}

let ayaTextArray: string[] = [];
let ayaNumberArray: (string | number)[] = [];
let surahNumberArray: (string | number)[] = [];
let translationArray: string[] = [];
let surahNameArray: string[] = [];
let translatorsNameArray: string[] = [];
let sql: string = '';
let tableRowsAmount: number = 0;
let allowToExecuteQuranTable: boolean = false;
let allowToExecuteTranslationTable: boolean = false;
let allowToExecuteTranslatorTable: boolean = false;
let allowToExecuteSuraTable: boolean = false;
const tablesLimit : number[] = [6230, 18690, 110, 2];
const translatorsId : number[] = []
const rawTextAddressArray: string[] = [
    './raw/quran_text/quran-simple.txt',
    './raw/quran_translations/en.yusufali.txt',
    './raw/quran_translations/fa.fooladvand.txt',
    './raw/quran_translations/fa.makarem.txt',
    './raw/lists/all_sura_list.txt',
    './raw/lists/all_translators_list.txt',

];
let isDatabaseFolderCreated: boolean = false;
let isDatabaseFileCreated: boolean = false;
const databasePath = path.join(__dirname, 'database', 'quran.db');
const quranTableAssets :{tableName : string, tableColumns: tableColumnsType[] } = {
    tableName: 'quran',
    tableColumns :[
        {
            "columnName" : 'id',
            "columnType" : 'INTEGER NOT NULL PRIMARY KEY'
        },
        {
            "columnName" : 'surah_number',
            "columnType" : 'INTEGER'
        },
        {
            "columnName" : 'aya_number',
            "columnType" : 'INTEGER'
        },
        {
            "columnName" : 'text',
            "columnType" : 'TEXT'
        },
    ]
}
const translatorsTableAssets :{tableName : string, tableColumns: tableColumnsType[] } = {
    tableName: 'translators',
    tableColumns :[
        {
            "columnName" : 'id',
            "columnType" : 'INTEGER NOT NULL PRIMARY KEY'
        },
        {
            "columnName" : 'translator',
            "columnType" : 'TEXT'
        },
    ]
}
const translationTableAssets :{tableName : string, tableColumns: tableColumnsType[] } = {
    tableName: 'translation',
    tableColumns :[
        {
            "columnName" : 'id',
            "columnType" : 'INTEGER NOT NULL PRIMARY KEY'
        },
        {
            "columnName" : 'surah_number',
            "columnType" : 'INTEGER'
        },
        {
            "columnName" : 'aya_number',
            "columnType" : 'INTEGER'
        },
        {
            "columnName" : 'translator_id',
            "columnType" : 'INTEGER'
        },
        {
            "columnName" : 'text',
            "columnType" : 'TEXT'
        },
    ]
}
const suraTableAssets :{tableName : string, tableColumns: tableColumnsType[] } = {
    tableName: 'suras',
    tableColumns :[
        {
            "columnName" : 'id',
            "columnType" : 'INTEGER NOT NULL PRIMARY KEY'
        },
        {
            "columnName" : 'sura',
            "columnType" : 'TEXT'
        },
    ]
}

function createDatabase() {
    //check if database directory has been created
    isDatabaseFolderCreated = fs.existsSync(path.join(__dirname, 'database'))

    //check if database file has been created
    isDatabaseFileCreated = fs.existsSync(path.join(__dirname+'/database', 'quran.db'))

    // createDatabaseDirectory
    if (!isDatabaseFolderCreated) {
        fs.mkdir(path.join(__dirname, 'database'), { recursive: true }, (err: any) => {
            if (err) {
                console.log('Error in creating folder')
                console.error(err);
            } else {
                console.log('Database folder created ...');
                isDatabaseFolderCreated = true;
                createDatabaseFile();
            }
        });
    } else {
        createDatabaseFile();
    }
}

function createDatabaseFile() {
    if (!isDatabaseFileCreated) {
        fs.writeFile(databasePath, '', (err: any) => {
            if (err) {
                console.log('Error in creating folder: ')
                console.error(err);
            } else {
                console.log('quran.db created ...');
                isDatabaseFileCreated = true;
                connectToDatabase();
            }
        });
    } else {
        connectToDatabase();
    }
}

function connectToDatabase() {
    const database = new sqlite3.Database(databasePath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err: any) => {
        if (err) {
            console.error('Error in opening database:', err.message);
        } else {
            console.log('Connected to the database.');
            createTable(database, allowToExecuteQuranTable, ayaTextArray, quranTableAssets, tablesLimit[0]);
            createTable(database, allowToExecuteTranslationTable, translationArray, translationTableAssets, tablesLimit[1]);
            createTable(database,  allowToExecuteSuraTable, surahNameArray, suraTableAssets, tablesLimit[2]);
            createTable(database, allowToExecuteTranslatorTable, translatorsNameArray, translatorsTableAssets, tablesLimit[3]);
        }
    });
}

function createTable(database: sqlite3.Database,
                     allowToExecute : boolean,
                     textArray : string[],
                     tableAssets: {tableName : string, tableColumns: tableColumnsType[]},
                     tablesLimit: number
) {
    let firstHalfOfSql: string = `CREATE TABLE IF NOT EXISTS ${tableAssets.tableName}(`;
    let secondHalfOfSql : string = ``;
    for (let i :number = 0; i < tableAssets.tableColumns.length; i++) {
        secondHalfOfSql += `${tableAssets.tableColumns[i].columnName} ${tableAssets.tableColumns[i].columnType}`;
        if (i < tableAssets.tableColumns.length-1) {
            secondHalfOfSql += `,`
        }
    }
    sql = firstHalfOfSql + secondHalfOfSql + ')';
    database.run(sql, (err: any) => {
        if (err) {
            console.error('Error in creating table:', err.message);
        }
        getTableRowsAmount(database, allowToExecute, textArray, tableAssets, tablesLimit);
    });
}

function getTableRowsAmount(database: sqlite3.Database,
                            allowToExecute : boolean,
                            textArray : string[],
                            tableAssets: {tableName : string, tableColumns: tableColumnsType[]},
                            tablesLimit: number) {
    sql = `SELECT COUNT(*) FROM ${tableAssets.tableName}`
    database.all(sql, [], (err: any, result: any) => {
        if (err) {
            console.log(`Error in getting table rows amount of ${tableAssets.tableName} table: `)
            console.error(err);
        } else {
            tableRowsAmount = result[0]['COUNT(*)'];
            allowToExecute = tableRowsAmount < tablesLimit-1;

            if (textArray.length < tablesLimit) {
            ayaProcess(allowToExecute);
            }
            addAyaToDatabase(database, allowToExecute, textArray, tableAssets );
        }
    });
}

function ayaProcess(allowToExecute : boolean) {
    if (allowToExecute) {
        for (let i:number = 0; i < rawTextAddressArray.length; i++) {
            let rawText = fs.readFileSync(rawTextAddressArray[i], 'utf-8');

            rawText.split(/\r?\n/).forEach((line: string) => {
                let columns = line.split('|');

                switch (rawTextAddressArray[i]) {
                    case './raw/quran_text/quran-simple.txt':
                        surahNumberArray.push(columns[0]);
                        ayaNumberArray.push(columns[1]);
                        ayaTextArray.push(columns[2]);
                        break;
                    case './raw/quran_translations/en.yusufali.txt':
                        translationArray.push(columns[0]);
                        translatorsId.push(1)
                        break;
                    case './raw/quran_translations/fa.fooladvand.txt':
                        translationArray.push(columns[0]);
                        translatorsId.push(2)
                        break;
                    case './raw/quran_translations/fa.makarem.txt':
                        translationArray.push(columns[0]);
                        translatorsId.push(3)
                        break;
                    case './raw/lists/all_sura_list.txt':
                        surahNameArray.push(columns[1]);
                        break;
                    case './raw/lists/all_translators_list.txt':
                        translatorsNameArray.push(columns[1]);
                        break;
                }
            });
        }
    }
}

function addAyaToDatabase(database: sqlite3.Database,
                          allowToExecute : boolean,
                          textArray : string[],
                          tableAssets: {tableName : string, tableColumns: tableColumnsType[]}) {
    if (allowToExecute) {
        for (let i :number = 0; i < textArray.length; i++) {
            sql = `INSERT INTO ${tableAssets.tableName} (`
            for (let i :number = 0; i < tableAssets.tableColumns.length; i++) {
                sql += `${tableAssets.tableColumns[i].columnName}`;
                if (i < tableAssets.tableColumns.length-1) {
                    sql += `,`
                }
            }
            sql += ')';
            sql += 'VALUES (';
            for (let i :number = 0; i < tableAssets.tableColumns.length; i++) {
                sql += `?`;
                if (i < tableAssets.tableColumns.length-1) {
                    sql += `,`
                }
            }
            sql += ')';

            let id : number = i + 1;
            switch (tableAssets.tableName){
                case 'quran' :
                    database.run(sql, [id, surahNumberArray[i], ayaNumberArray[i], textArray[i]], (err: any) => {
                        if (err) {
                            console.log('Error in adding to database: ')
                            console.error(err.message);
                        }
                    });
                    break;
                case 'translators' :
                    database.run(sql, [id, textArray[i]], (err: any) => {
                        if (err) {
                            console.log('Error in adding to database: ')
                            console.error(err.message);
                        }
                    });
                    break;
                case 'suras' :
                    database.run(sql, [id, textArray[i]], (err: any) => {
                        if (err) {
                            console.log('Error in adding to database: ')
                            console.error(err.message);
                        }
                    });
                    break;
                case 'translation' :
                    const quranAyas : number = 6236
                    if (i <= quranAyas) {
                        database.run(sql, [id, surahNumberArray[i], ayaNumberArray[i], translatorsId[i], textArray[i]], (err: any) => {
                            if (err) {
                                console.log('Error in adding to database: ')
                                console.error(err.message);
                            }
                        });
                    }
                    else if (i > quranAyas && i <= quranAyas * 2) {
                        database.run(sql, [id, surahNumberArray[i - quranAyas], ayaNumberArray[i - quranAyas], translatorsId[i], textArray[i]], (err: any) => {
                            if (err) {
                                console.log('Error in adding to database: ')
                                console.error(err.message);
                            }
                        });
                    }
                    else  {
                        database.run(sql, [id, surahNumberArray[i - quranAyas * 2], ayaNumberArray[i - quranAyas * 2], translatorsId[i], textArray[i]], (err: any) => {
                            if (err) {
                                console.log('Error in adding to database: ')
                                console.error(err.message);
                            }
                        });
                    }
                    break;
            }
        }
    }
}

createDatabase();
