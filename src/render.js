import 'svelte/ssr/register'

import rp from 'request-promise-native'
import mainTemplate from './src/templates/main.html!text'
import { groupBy } from './js/libs/arrayObjectUtils.js'

export async function render() {
	let data = await loadData();


    data.map((obj) => {
            

                obj.objArr.sort(function(a, b) {
                    if (a.score < b.score) return -1;
                    if (a.score > b.score) return 1;
                    return 0;
                })

                console.log(obj.objArr)

    })    



    return mainTemplate;
}




function formatData(data) {

    let output = data.sheets.Sheet1;
    // let sectionsCopy = data.sheets.sectionHeads;
    let count = 0;

   output.map((obj) => {
        obj.ref = count;
        obj.athEvent = obj.event+"_"+obj.status;
        obj.score = obj.result;


        // obj.sortName = obj.family_name + obj.formatName;
        
        // !obj.age ? obj.age = "unknown" : obj.age = obj.age.toString();
        // !obj.status ? obj.status = "unknown" : obj.status = obj.status.toString().toLowerCase();
        // !obj.floor ? obj.floor = "unknown" : obj.floor = obj.floor;
        // obj.sortOn = obj.floor;
        // //obj.sortOn = obj.family_name.charAt(0).toUpperCase();
 

        // obj.id = obj.name.replace(/[^0-9a-z]/gi,'');

    //     count++;
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
        t.sortOn = k;
        t.objArr = obj[k]
        a.push(t);
    }

    return a;
}

export async function loadData() {
    let data = formatData(await rp({
        uri: 'https://interactive.guim.co.uk/docsdata-test/15MIxf9S4_vA2WL9C15ip-ITo1oQ96A25xpbPSsD8Mck.json',
        json: true
    }));


    let athArr = groupBy(data, "athEvent");
    athArr = sortByKeys(athArr);


    return athArr;
}
