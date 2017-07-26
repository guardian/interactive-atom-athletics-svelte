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

import countryCode from 'i18n-iso-countries'

let maxMedal;

export async function render() {
    let data = await loadData();

    var dataObj = {};

    let eventsArr = getEventsData(data.results)
    dataObj.eventsArr = eventsArr;

    let medalsArr = getMedalsData(data.results)
    dataObj.medalsArr = medalsArr;

    let daysArr = getDaysArr(data)
    dataObj.daysArr = daysArr;

    let worldRecordsArr = getRecordsArr(data, "world")
    dataObj.worldRecordsArr = worldRecordsArr;

    let gamesRecordsArr = getRecordsArr(data, "games")
    dataObj.gamesRecordsArr = gamesRecordsArr;

    var compiledHTML = compileHTML(dataObj);

    return compiledHTML;
}

// broke this out into a function so it could also be used in the gulpfile for the image resizing
export async function loadData() {
    let data = formatData(await rp({
        uri: 'https://interactive.guim.co.uk/docsdata-test/15MIxf9S4_vA2WL9C15ip-ITo1oQ96A25xpbPSsD8Mck.json',
        json: true
    }));

    return data;
}


function formatData(data) {
    var newObj = {};
    let results = data.sheets.results;
    let count = 0;

    results.map((obj) => {
        obj.ref = count;
        obj.event = getShortEvent(obj.event);
        obj.athEvent = obj.sex + "_" + obj.event.split(" ").join("--") + "_" + obj.stage.split(" ").join("--");
        obj.score = obj.result;
        if (obj.country == "United States") { obj.country = "United States of America" }
        if (obj.country == "Great Britain") { obj.country = "United Kingdom" }
        obj.ISO = countryCode.getAlpha3Code(obj.country, 'en');
        obj.flag = obj.ISO.toLowerCase();
        count++;
    })

    let fixtures = data.sheets.fixtures;

    count = 0;

    fixtures.map((obj) => {
        obj.ref = count;
        obj.event = getShortEvent(obj.event);
        obj.athEvent = obj.sex + "_" + obj.event.split(" ").join("--") + "_" + obj.stage.split(" ").join("--");
        count++;
    })


    let records = data.sheets.all_records;

    records = records.filter(function(obj){
      return obj.highlight;
    });

    records.map((obj) => {
        obj.event = getShortEvent(obj.event);
        obj.athEvent = obj.sex + "_" + obj.event.split(" ").join("--");
        obj.formatEvent = getFormatEvent(obj.sex, obj.event);
    })

    newObj.records = records;
    newObj.fixtures = fixtures;
    newObj.results = results;

    return newObj;

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
        obj.dataDate = obj.objArr[0].date.split(" ").join("_");
        obj.gender = obj.objArr[0].sex;
        obj.stage = obj.objArr[0].stage;
        obj.gender == "w" ? obj.gender = "Women’s" : obj.gender = "Men’s";
        obj.formatTitle = obj.objArr[0].event + " " + obj.objArr[0].stage;
        obj.objArr[0].result && obj.stage == "Final" ? obj.result = true : obj.result = false;

        if (obj.objArr[0].measure == "time") {
            obj.objArr.sort((a, b) => (a.score - b.score))
        } else {
            obj.objArr.sort((a, b) => (b.score - a.score))
        }

        obj.objArr.map((athlete, k) => {
            athlete.place = k + 1;
        })
    })

    return a
}

function getItemResults(item, results) {

    let t = item.athEvent.toLowerCase();
    var tempArr = [];
    results.map((obj, k) => {
        if (t === obj.athEvent.toLowerCase()) { tempArr.push(obj) }
    })

    tempArr.sort((a, b) => (a.result - b.date))
    return tempArr;
}


function getRecordsArr(data, series){

    console.log(series)

    let a = groupBy(data.records, "sex");
    a = sortByKeys(a);

    a.map((obj, k) => {
        obj.objKey == "w" ? obj.strTitle = "Women’s "+series+" records" :  obj.strTitle = "Men’s "+series+" records";
        obj.objArr.map((item, k) => {
            item.formatDate = getFormatDate(item.date, "Mmm YYYY");
            
            item.formatEvent = getFormatEvent("null", item.event);

            item.sex == "w" ? item.sexStr = "Women’s " :  item.sexStr = "Men’s ";
            // console.log(item.world_games_record)
            
            

            //if(item.resultTable){ console.log(item.resultTable) }
        })
        
        obj.objArr = obj.objArr.filter(function(obj){

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
        obj.date = new Date(obj.dayEventsArr[0].objArr[0].date);
        obj.objArr.map((item, k) => {
            !item.result ? item.resultTable = null : item.resultTable = getItemResults(item, data.results);
            //if(item.resultTable){ console.log(item.resultTable) }
        })
    })

    a.sort((a, b) => (a.date - b.date))

    a.map((obj, k) => {
        obj.dayNumber = k + 1;
        obj.formatDate = getFormatDate(obj.objKey, "DD Mmm");
    })
    return a
}


function getMedalsData(data) {
    let a = groupBy(data, "ISO");
    a = sortByKeys(a);

    a.map((obj) => {
        obj.medal = {};
        obj.medal.gold = 0;
        obj.medal.silver = 0;
        obj.medal.bronze = 0;

        obj.objArr.map((item) => {
            if (item.medal === "Gold") { obj.medal.gold++ }
            if (item.medal === "Silver") { obj.medal.silver++ }
            if (item.medal === "Bronze") { obj.medal.bronze++ }
            if (item.medal === "Gold" || item.medal === "Silver" || item.medal === "Bronze") { item.medalWin = true }
            item.formatDate = getFormatDate(item.date, "DD Mmm")
        })
        obj.medal.total = obj.medal.gold + obj.medal.silver + obj.medal.bronze;

        obj.country = obj.objArr[0].country;

    })

    maxMedal = getMaxMedal(a)


    var pos = 1;

    a.sort((a, b) => (b.medal.gold - a.medal.gold) || (b.medal.silver - a.medal.silver) || (b.medal.bronze - a.medal.bronze) || (b.objKey - a.objKey))

    a.map((obj) => {
        obj.medal.position = pos;
        obj.hidden = pos < 11 ? false : true
        obj.circleSizes = {
            "bronze": obj.bronze === 0 ? 0 : (obj.medal.bronze / maxMedal) * 7 + 3,
            "silver": obj.silver === 0 ? 0 : (obj.medal.silver / maxMedal) * 7 + 3,
            "gold": obj.gold === 0 ? 0 : (obj.medal.gold / maxMedal) * 7 + 3
        }

        pos++;
    })

    return a;
}

function getShortEvent(s){
    s = s.replace(/ metres/g, 'm');
    return s;
}



function getFormatDate(d, f){
    var Mmm =  d.split(" ")[1].substring(0, 3);
    var str = d.split(" ")[0] + " " + Mmm;
    if(f == "Mmm YYYY")(str = Mmm+" "+d.split(" ")[2])
    return str
}


function getFormatEvent(sex, event){
    let evStr = event.replace(/ throw/g, '');
    sex = sex.toLowerCase().replace(/\s/g, "");
    let str;
        if (sex == "null"){ str = evStr };
        if (sex == "m"){ str = "Men\u2019s "+evStr };
        if (sex == "w"){ str = "Women\u2019s "+evStr };

    



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

    return newHTML
}









