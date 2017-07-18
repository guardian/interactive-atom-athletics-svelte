import 'svelte/ssr/register'

import rp from 'request-promise-native'
import mainTemplate from './src/templates/main.html!text'
import leaderRowTemplate from './src/templates/leaderRow.html!text'
import { groupBy } from './js/libs/arrayObjectUtils.js'

import Handlebars from 'handlebars'

import countryCode from 'i18n-iso-countries'

export async function render() {
	let data = await loadData();
    var compiledHTML = compileHTML(data);    
    return compiledHTML;
}

export async function loadData() {
    let data = formatData(await rp({
        uri: 'https://interactive.guim.co.uk/docsdata-test/15MIxf9S4_vA2WL9C15ip-ITo1oQ96A25xpbPSsD8Mck.json',
        json: true
    }));

    var mainObj = {};

    let eventsArr = groupBy(data, "athEvent");
        eventsArr = sortByKeys(eventsArr);
        mainObj.eventsArr = eventsArr;

    data.map((obj) => { 
            if(obj.medal){
                //console.log(obj)
            }
    }) 

    let medalsArr = getMedals(data)

    mainObj.medalsArr = medalsArr;

    return mainObj;
}

function formatData(data) {
    let output = data.sheets.Sheet1;
   
    let count = 0;

       output.map((obj) => {
            obj.ref = count;
            obj.athEvent = obj.event+"_"+obj.status;
            obj.score = obj.result;
            if(obj.country == "United States"){ obj.country = "United States of America" }
            if(obj.country == "Great Britain"){ obj.country = "United Kingdom" }
            obj.ISO = countryCode.getAlpha3Code(obj.country, 'en'); 
  
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
        t.objArr = obj[k]
        a.push(t);
    }

    return a;
}

function getMedals(data){

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
            }) 

            obj.medal.total = obj.medal.gold + obj.medal.silver + obj.medal.bronze;
       }) 

    a.sort((a, b) => (b.medal.gold - a.medal.gold)  || (b.medal.silver - a.medal.silver) || (b.medal.bronze - a.medal.bronze)  || (b.objKey - a.objKey) )

    var pos = 1;
    a.map((obj) => {
        obj.medal.position = pos;
        pos ++; 
    })

    return a;

}



function compileHTML(data) {

    Handlebars.registerHelper('html_decoder', function(text) {
          var str = unescape(text).replace(/&amp;/g, '&');
          return str; 
    });

    Handlebars.registerPartial({
        'leaderRow': leaderRowTemplate //,
        //'detailItem': detailItemTemplate
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
