import 'svelte/ssr/register'

import rp from 'request-promise-native'
import mainTemplate from './src/templates/main.html!text'
import leaderRowTemplate from './src/templates/leaderRow.html!text'
import resultRowTemplate from './src/templates/resultRow.html!text'
import byCountryRowTemplate from './src/templates/byCountryRow.html!text'
import recordTemplate from './src/templates/recordRow.html!text'

import dayRowTemplate from './src/templates/dayRow.html!text'
import { groupBy } from './js/libs/arrayObjectUtils.js'

import Handlebars from 'handlebars'

let maxMedal;

let countries;

let IAAFstem = "http://www.iaafworldchampionships.com/events/";

export async function render() {
    let data = await loadData();

    var dataObj = {};

    let eventsArr = getEventsData(data.results)
    dataObj.eventsArr = eventsArr;

    let medalsArr = getMedalsData(data)
    dataObj.medalsArr = medalsArr;

    let recordsArr = getRecArr(data.records)
    dataObj.recordsArr = recordsArr;

    let countriesArr = getCountriesArr(medalsArr)
    dataObj.countriesArr = countriesArr;

    let daysArr = getDaysArr(data);
    dataObj.daysArr = daysArr;

    var compiledHTML = compileHTML(dataObj);

    return compiledHTML;
}

// broke this out into a function so it could also be used in the gulp file for the image resizing
export async function loadData() {
    let data = formatData(await rp({
        uri: 'https://interactive.guim.co.uk/docsdata-test/15MIxf9S4_vA2WL9C15ip-ITo1oQ96A25xpbPSsD8Mck.json',
        json: true
    }));


    return data;
}


function formatData(data) {
    var newObj = {};

    countries = data.sheets.countries_list;

    countries = getCountryNames(countries);


    let fixtures = data.sheets.fixtures;

    fixtures.map((obj) => {       
        obj.ref = count;
        obj.event = getShortEvent(obj.event);
        obj.athEvent = obj.sex + "_" + obj.event.split(" ").join("--") + "_" + obj.stage.split(" ").join("--");
        obj.sex = obj.sex.toLowerCase();

        count++;
    })

    let results = formatResultsData(data.sheets.results, fixtures);

    let count = 0;

    let records = results.filter(function(obj) {
        return obj.record;
    }); 

    records.map((obj) => {
        obj.event = getShortEvent(obj.event);
        obj.athEventRecord = obj.sex + "_" + obj.event.split(" ").join("--");
        obj.formatEvent = getFormatEvent(obj.sex, obj.event);
    })

    newObj.countries = countries;
    newObj.records = records;
    newObj.fixtures = fixtures;
    newObj.results = results;

    return newObj;

}


function formatResultsData(results, fixtures){

    let count = 0;

    results.map((res) => {

        fixtures.map((item) => {
            if(item.event_id == res.event_id ){
                res.date = item.date;
                res.start_time = item.start_time;              
                res.event = item.event;
                res.stage = item.stage;
                res.measure = item.measure;
            }

            count ++
        })
        
        res.ref = count;
        res.event = getShortEvent(res.event);
        
        res.athEvent = res.sex + "_" + res.event.split(" ").join("--") + "_" + res.stage.split(" ").join("--");
        res.score = res.result;

        count++;
    })

    return results;
}

function getCountryNames(countries){

    countries.map((obj) => {  
        obj.country = obj.Country_Name;
        obj.ISO = obj.iso;
        obj.flag = obj.ISO.toLowerCase(); 
    })

    return countries;
}


function getISO(o){
    let c = o.country;
    countries.map((obj) => {
        if(c === obj.country){
            o.ISO = obj.ISO;
            o.flag = obj.flag;
        }
    })

    return o;

};

function getMedalsData(data) {

    let a = groupBy(data.countries, "ISO");

    a = sortByKeys(a);

    a.map((obj) => {
        

        
        obj.medal = {};
        obj.medal.gold = 0;
        obj.medal.silver = 0;
        obj.medal.bronze = 0;
        obj.medallists = [];

        data.results.map((item) => {

            if (item.medal === "Gold" && item.country === obj.objArr[0].Country_Name) { obj.medal.gold++ }
            if (item.medal === "Silver" && item.country === obj.objArr[0].Country_Name) { obj.medal.silver++ }
            if (item.medal === "Bronze" && item.country === obj.objArr[0].Country_Name) { obj.medal.bronze++ }

            item.formatDate = getFormatDate(item.date, "DD Mmm");
            item.formatEvent = getFormatEvent(item.sex, item.event);
            
            if (item.sex == "w"){item.sexStr = "Women’s "}  
            if (item.sex == "m"){item.sexStr = "Men’s " };

            if (item.medal && item.country === obj.objArr[0].Country_Name) { obj.medallists.push(item) }
        })

        obj.medal.total = obj.medal.gold + obj.medal.silver + obj.medal.bronze;
        obj.country = obj.objArr[0].Country_Name;
    })

    maxMedal = getMaxMedal(a);

    var pos = 1;

    a.sort((a, b) => (b.medal.gold - a.medal.gold) || (b.medal.silver - a.medal.silver) || (b.medal.bronze - a.medal.bronze) || (b.objKey - a.objKey))

    a.map((obj) => {
        obj = getISO(obj);
        obj.medal.position = pos;
        obj.hidden = pos < 11 ? false : true
        obj.circleSizes = {
            "bronze": obj.bronze === 0 ? 0 : (obj.medal.bronze / maxMedal) * 7 + 3,
            "silver": obj.silver === 0 ? 0 : (obj.medal.silver / maxMedal) * 7 + 3,
            "gold": obj.gold === 0 ? 0 : (obj.medal.gold / maxMedal) * 7 + 3
        }

        pos++;
    })


    //a.countryData = getISO(a[0])
  
    return a;
}

function sortByKeys(obj) {
    let keys = Object.keys(obj),
        i, len = keys.length;

    keys.sort();

    var a = []

    for (i = 0; i < len; i++) {
        let k = keys[i];
        let t = {}
        t.objKey = k;
        t.flag = k.toLowerCase();
        t.objArr = obj[k]
        a.push(t);
    }

    return a;
}


function getEventsData(data) {
    let a = groupBy(data, "athEvent");
    a = sortByKeys(a);

    a.map((obj) => {        

        obj.timeFormat = obj.objArr[0].start_time;
        obj.sortTime = obj.timeFormat.split(":").join("");
        obj.dataDate = obj.objArr[0].date.split(" ").join("_");
        obj.gender = obj.objArr[0].sex.toLowerCase();
        obj.stage = obj.objArr[0].stage;
        obj.iaaf_url = IAAFstem+obj.objArr[0].event_id ;
        obj.gender == "w" ? obj.gender = "Women’s" : obj.gender = "Men’s";
        obj.formatTitle = obj.objArr[0].event + " " + obj.objArr[0].stage;


        if (obj.objArr[0].stage == "Final") { obj.highlightEvent = true };
        obj.objArr[0].result && obj.stage == "Final" ? obj.result = true : obj.result = false;

        if (obj.objArr[0].measure == "time") { obj.objArr.sort((a, b) => (a.score - b.score)) } else {
            obj.objArr.sort((a, b) => (a.score - b.score))
        }
        //logs out measure

        obj.objArr.map((athlete, k) => {
            athlete.place = k + 1;
           
        })
    })

    a.sort((a, b) => (a.sortTime - b.sortTime))

    return a
}

function getItemResults(item, results) {
   
    let t = item.athEvent.toLowerCase();
    let s = item.sex.toLowerCase();
    
    var tempArr = [];
    results.map((obj) => {

        obj.sex = s;
        obj.measure = item.measure;
        if( t == obj.athEvent.toLowerCase()){
            tempArr.push(obj);
        }  
    })

    tempArr.sort((a, b) => (a.score - b.score))

    return tempArr;
}


function getRecArr(data) {

    let a = []

    let obj = {};
    obj.objKey = "Records";
    obj.objArr = data;

    obj.objArr.map((item, k) => {
        item.formatDate = getFormatDate(item.date, "Mmm YYYY");
        item.date = new Date(item.date);
        item.formatEvent = getFormatEvent("null", item.event);

        item.sex == "w" ? item.sexStr = "Women’s " : item.sexStr = "Men’s ";

   
        if (item.record == "national") { item.nationalRecord = true }
        if (item.record == "world") { item.worldRecord = true }
        if (item.record == "games") { item.gamesRecord = true }



        if (item.country == "East Germany") { item.ISO = "DDR" }
        if (item.country == "Czechoslovakia") { item.ISO = "TCH" }


        item = getISO(item);

        
    })

    obj.objArr.sort((a, b) => (a.date - b.date))

    a.push(obj)

    return a;
}



function getOneDArr(data, series) {

    let a = []

    let obj = {};
    obj.objKey = "Records";
    obj.objArr = data.records_highlight;
    obj.objArr.map((item, k) => {
        item.formatDate = getFormatDate(item.date, "Mmm YYYY");
        item.date = new Date(item.date);
        item.formatEvent = getFormatEvent("null", item.event);

        item.sex == "w" ? item.sexStr = "Women’s " : item.sexStr = "Men’s ";

        item = getISO(item);


    })
    obj.objArr.sort((a, b) => (a.date - b.date))

    a.push(obj)

    return a;

}


function getRecordsArr(data, series) {

    let a = groupBy(data.records, "sex");
    a = sortByKeys(a);

    a.map((obj, k) => {
        obj.objKey == "w" ? obj.strTitle = "Women’s " + series + " records" : obj.strTitle = "Men’s " + series + " records";
        obj.objArr.map((item, k) => {
            item.formatDate = getFormatDate(item.date, "Mmm YYYY");
            item.formatEvent = getFormatEvent("null", item.event);

            item.sex == "w" ? item.sexStr = "Women’s " : item.sexStr = "Men’s ";


            if (item.country == "East Germany") { item.ISO = "DDR" }
            if (item.country == "Czechoslovakia") { item.ISO = "TCH" }

        })

        obj.objArr = obj.objArr.filter(function(obj) {
            return obj.world_games_record == series;
        });


    })

    return a;

}


function getDaysArr(data) {

    let a = groupBy(data.fixtures, "date");
    a = sortByKeys(a);

    a.map((obj, k) => {
        let eventsArr = getEventsData(obj.objArr);
        obj.dayEventsArr = eventsArr;
        obj.date = new Date(obj.dayEventsArr[0].objArr[0].date + " " + obj.dayEventsArr[0].objArr[0].start_time);

        obj.objArr.map((item, k) => {

            if (item.result) {
                item.resultTable = getItemResults(item, data.results);
                
                item.measure == "time" ? item.resultTable.sort((a, b) => (a.score - b.score)) : item.resultTable.sort((a, b) => (b.score - a.score));

                item.resultTable.map((result, k) => {

                    //result.sex = item.sex.toLowerCase()
                    result.place = k;
                })
            }

            item.date = new Date(item.date + " " + item.start_time);
            item.sortTime = item.start_time.split(":").join("");

        })


    })

    a.sort((a, b) => (a.date - b.date))

    a.map((obj, k) => {
        obj.dayNumber = k + 1;
        obj.formatDate = getFormatDate(obj.objKey, "DD Mmm");
        obj.objArr.sort((a, b) => b.sortTime - a.sortTime)

    })

    return a

}

function getCountriesArr(medalsArr) {

    var a = []

    medalsArr.map((item) => {
        var o = {};
        o.country = item.country;
        o.position = item.medal.position;
        a.push(o)
    })


    //unicode sort
    a.sort(function(a, b) {
        return a.country.localeCompare(b.country);
    });

    return a;
}


function getShortEvent(s) {
    s = s.replace(/ metres/g, 'm');
    return s;
}


function getFormatDate(d, f) {
    var Mmm = d.split(" ")[1].substring(0, 3);
    var str = d.split(" ")[0] + " " + Mmm;
    if (f == "Mmm YYYY")(str = Mmm + " " + d.split(" ")[2])
    return str
}


function getFormatEvent(sex, event) {
    let evStr = event.replace(/ throw/g, '');
    sex = sex.toLowerCase().replace(/\s/g, "");
    let str;
    if (sex == "null") { str = evStr };
    if (sex == "m") { str = "Men\u2019s " + evStr };
    if (sex == "w") { str = "Women\u2019s " + evStr };

    return evStr;

}

function getMaxMedal(a) {
    let maxMedalCount = 0;
    let max;

    a.map((row) => {
        max = Math.max(row.medal.gold, row.medal.silver, row.medal.bronze);
        maxMedalCount = max > maxMedalCount ? max : maxMedalCount;
    })

    max = maxMedalCount;

    return max;
}

function compileHTML(data) {

    Handlebars.registerHelper('html_decoder', function(text) {
        var str = unescape(text).replace(/&amp;/g, '&');
        return str;
    });

    Handlebars.registerPartial({
        'leaderRow': leaderRowTemplate,
        'resultRow': resultRowTemplate,
        'dayRow': dayRowTemplate,
        'byCountryRow': byCountryRowTemplate,
        'recordRow': recordTemplate
    });

    var content = Handlebars.compile(
        mainTemplate, {
            compat: true
        }
    );

    var newHTML = content(data);

    return newHTML;

}





