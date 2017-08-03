let initialHeight = 480;

function init() {
    addListeners();
    initView();     
}

function getH(id)
{
    return document.getElementById(id).offsetHeight;
}

function addListeners() {
    var expandBtnEl = document.querySelector('#medal-expand-button');
    var collapseButtonEl = document.querySelector('#medal-collapse-button');
    
    let divHeight = initialHeight;
    let jump = 850;
    let maxH = getH('section-leaderboard');

    expandBtnEl.addEventListener('click', function(e) {
        if(divHeight < maxH){
            divHeight += jump;  
        }

        if(divHeight > maxH){
            divHeight =  maxH;
            collapseButtonEl.classList.add('show-el');
            expandBtnEl.classList.remove('show-el');
            expandBtnEl.classList.add('hide-el');
        }     
        document.getElementById('expandingWrapper').style.height = divHeight+ "px";

    })

    collapseButtonEl.addEventListener('click', function(e) {
        document.getElementById('expandingWrapper').style.height = initialHeight+ "px";

        let scrollEl = document.getElementById("leaderBoardSlice")

        scrollEl.scrollIntoView(true);

        collapseButtonEl.classList.remove('show-el');
        collapseButtonEl.classList.add('hide-el');
        expandBtnEl.classList.remove('hide-el');
        expandBtnEl.classList.add('show-el');

    })
    

    document.querySelectorAll('.gv-ath-results__list-item').forEach(el => {
        el.addEventListener('click', function(e) {
            let ref = this.getAttribute("data-id");
            document.querySelectorAll('.gv-ath-table').forEach(tableEl => {
                if (ref === tableEl.getAttribute("data-id")) {
                    tableEl.classList.remove("hide-el");
                    tableEl.classList.add("show-el");
                }
            })
        })
    });

    document.querySelectorAll('.gv-ath-day-event-title-result').forEach(el => {
        el.addEventListener('click', function(e) {
                let ref = this.getAttribute("data-id");
                this.classList.add("day-expanded");

                var closeBtn = this.querySelector('.gv-ath-table-row__close-btn');
                    closeBtn.classList.remove('open');
                    closeBtn.classList.add('close');
                    
                document.querySelectorAll('.gv-ath-day-event-table').forEach(tableEl => {
                    if (ref === tableEl.getAttribute("data-id")) {
                        tableEl.classList.remove("hide-el");
                        tableEl.classList.add("show-el");
                    }
                })
        })
    });

    document.querySelectorAll('.gv-ath-table-url').forEach(el => {
        el.addEventListener('click', function(e) {
            let ref = this.getAttribute("url-data");
            window.open(ref);
        })
    });

    document.querySelector('#gv-ath-day-selector').addEventListener('change', function(e) {
        let t = e.target.value;
            document.querySelectorAll('.gv-day-slice-section').forEach(el => {
                t === el.getAttribute("data-id") ? el.classList.remove("hide-el") : el.classList.add("hide-el");
            })
    })

    document.querySelector('#gv-ath-medal-by-country-selector').addEventListener('change', function(e) {
        updateCountryView(e.target.value)       
    })

}

function initView(){

    document.querySelectorAll('.gv-day-slice-section').forEach(el => {
        if(el.getAttribute("data-id") === "day-slice-1" ){
            el.classList.remove("hide-el")
        } 
    })

    let recordRowArr = document.querySelectorAll('.gv-ath-record-row');

    if(recordRowArr.length > 0){
        document.getElementById("recordsSlice").classList.remove("hide-el");
    }

    //remove this with first medals

    document.querySelectorAll('.om-medal-white').forEach(el => {

            el.style.transform = "scaleX(3)";
   
    })

    document.querySelectorAll('.om-medal-circle').forEach(el => {
      
            el.style.transform = "scale(3)";
     
    })
    
    
    // change this to "1" when medals start
    document.getElementById('gv-ath-medal-by-country-selector').value = "67";
    updateCountryView("67");

    document.getElementById('expandingWrapper').style.height = initialHeight+ "px";


}

function updateCountryView(n){
    document.getElementById("list-medals-by-country").querySelectorAll(".om-table-row").forEach(el => {
            el.classList.add("hidden-row")
            if(el.getAttribute("data-position") == n){ el.classList.remove("hidden-row") }             
    })

    document.getElementById("slice-medals-by-country").querySelectorAll(".gv-ath-wrapper").forEach(el => {
            el.classList.add("hide-el")
            if(el.getAttribute("data-position") == n){ el.classList.remove("hide-el") }            
    })
}

init();