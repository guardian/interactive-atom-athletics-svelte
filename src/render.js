import 'svelte/ssr/register'

import rp from 'request-promise-native'
import mainTemplate from './src/templates/main.html!text'
import leaderRowTemplate from './src/templates/leaderRow.html!text'
import resultRowTemplate from './src/templates/resultRow.html!text'

import dayRowTemplate from './src/templates/dayRow.html!text'
import { groupBy } from './js/libs/arrayObjectUtils.js'

import Handlebars from 'handlebars'

import countryCode from 'i18n-iso-countries'

let maxMedal;

export async function render() {
	let data = await loadData();

    var dataObj = {};

    let eventsArr = getEventsData(data)
    dataObj.eventsArr = eventsArr;

    let medalsArr = getMedalsData(data)
    dataObj.medalsArr = medalsArr;

    let daysArr = getDaysArr(data)
    dataObj.daysArr = daysArr;

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
    let output = data.sheets.Sheet1;
   
    let count = 0;

       output.map((obj) => {
            obj.ref = count;
            obj.athEvent = obj.sex+"_"+obj.event.split(" ").join("--")+"_"+obj.stage.split(" ").join("--");
            obj.score = obj.result;
            if(obj.country == "United States"){ obj.country = "United States of America" }
            if(obj.country == "Great Britain"){ obj.country = "United Kingdom" }
            obj.ISO = countryCode.getAlpha3Code(obj.country, 'en'); 
            obj.flag = obj.ISO.toLowerCase();


            count++;
         })   

    return output;
    
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

function getEventsData(data){
    let a = groupBy(data, "athEvent");
        a = sortByKeys(a);

   a.map((obj) => { 
        obj.timeFormat = obj.objArr[0].start_time.split(".").join(":");
        obj.dataDate = obj.objArr[0].date.split(" ").join("_");
        obj.gender = obj.objArr[0].sex;
        obj.gender == "w" ? obj.gender = "Women’s" : obj.gender = "Men’s";
        obj.formatTitle = obj.objArr[0].event+" "+obj.objArr[0].stage;
        obj.objArr[0].result ? obj.result = true : obj.result = false; 

        if(obj.objArr[0].measure == "time" ){
            obj.objArr.sort((a, b) => (a.score - b.score))
        }else{
            obj.objArr.sort((a, b) => (b.score - a.score))
        }
 
        obj.objArr.map((athlete, k) => { 
            athlete.place = k + 1;
        }) 
    }) 

   return a
}



function getDaysArr(data){
    let a = groupBy(data, "date");
        a = sortByKeys(a);

   a.map((obj, k) => { 
        let eventsArr = getEventsData(obj.objArr)
      
        obj.dayEventsArr = eventsArr;
        obj.dayNumber = k+1
        //console.log(obj.dayEventsArr[0])
        // obj.timeFormat = obj.objArr[0].start_time.split(".").join(":");
        // obj.dataDate = obj.objArr[0].date.split(" ").join("_");
        // obj.gender = obj.objArr[0].sex;
        // obj.gender == "w" ? obj.gender = "Women’s" : obj.gender = "Men’s";
        // obj.formatTitle = obj.objArr[0].event+" "+obj.objArr[0].stage;
        // obj.objArr[0].result ? obj.result = true : obj.result = false; 

        // if(obj.objArr[0].measure == "time" ){
        //     obj.objArr.sort((a, b) => (a.score - b.score))
        // }else{
        //     obj.objArr.sort((a, b) => (b.score - a.score))
        // }
 
        // obj.objArr.map((athlete, k) => { 
        //     athlete.place = k + 1;
        // }) 
    }) 


    //console.log(a)

   return a
}



function getMedalsData(data){
    let a = groupBy(data, "ISO");
    a = sortByKeys(a);
    
     a.map((obj) => { 
            obj.medal = {};
            obj.medal.gold = 0;
            obj.medal.silver = 0;
            obj.medal.bronze = 0;
            obj.objArr.map((item) => { 
                if(item.medal === "Gold" ){ obj.medal.gold++ }
                if(item.medal === "Silver" ){ obj.medal.silver++ }
                if(item.medal === "Bronze" ){ obj.medal.bronze++ }
                if(item.medal === "Gold" || item.medal === "Silver" || item.medal === "Bronze" ){  item.medalWin = true  }
            }) 
            obj.medal.total = obj.medal.gold + obj.medal.silver + obj.medal.bronze;

            
       }) 

    maxMedal = getMaxMedal(a)
    

    var pos = 1;

    a.sort((a, b) => (b.medal.gold - a.medal.gold)  || (b.medal.silver - a.medal.silver) || (b.medal.bronze - a.medal.bronze)  || (b.objKey - a.objKey) )

    a.map((obj) => {
        obj.medal.position = pos;
        obj.hidden = pos < 11 ? false : true
        obj.circleSizes = {
                        "bronze": obj.bronze === 0 ? 0 : (obj.medal.bronze/maxMedal)*7 + 3,
                        "silver": obj.silver === 0 ? 0 : (obj.medal.silver/maxMedal)*7 + 3,
                        "gold": obj.gold === 0 ? 0 : (obj.medal.gold/maxMedal)*7 + 3
                    }
        console.log(obj)
        pos ++; 
    })

    return a;
}

function getMaxMedal(a){
    let maxMedalCount = 0;
    let max;

    a.map((row) => { 
        max = Math.max(row.medal.gold, row.medal.silver,row.medal.bronze);
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
        'dayRow' : dayRowTemplate
    });



    var content = Handlebars.compile(
        mainTemplate, {
            compat: true
        }
    );

    var newHTML = content(data);

    return newHTML
}


// data.sort((a, b) => (b.medal.gold - a.medal.gold) 
//                  || (b.medal.silver - a.medal.silver) 
//                  || (b.medal.bronze - a.medal.bronze) )
