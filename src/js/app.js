
function init(){
    addListeners();
}


function addListeners(){
    var expandBtnEl = document.querySelector('#medal-expand-button');
    var collapseButtonEl =  document.querySelector('#medal-collapse-button');

    expandBtnEl.addEventListener('click',function(e){

        [].slice.apply(document.getElementsByClassName('om-table-row hidden-row')).forEach(el => {
            el.classList.remove('hidden-row');
            el.classList.add('showing-row');

        }); 

        collapseButtonEl.classList.remove('hide-el');
        expandBtnEl.classList.add('hide-el');
       
    })


    collapseButtonEl.addEventListener('click',function(e){

        [].slice.apply(document.getElementsByClassName('om-table-row showing-row')).forEach(el => {
            el.classList.remove('showing-row');
            el.classList.add('hidden-row');

        }); 

        collapseButtonEl.classList.add('hide-el');
        expandBtnEl.classList.remove('hide-el');
       
    })


   document.querySelectorAll('.gv-ath-results__list-item').forEach(el => {
           
                el.addEventListener('click',function(e){
                    let ref = this.getAttribute("data-id");

                        document.querySelectorAll('.gv-ath-table').forEach(tableEl => {
                            if(ref === tableEl.getAttribute("data-id")){
                                tableEl.classList.remove("hide-el");
                                tableEl.classList.add("show-el");
                            }
                        })

                    

                })
    }); 



   document.querySelectorAll('.gv-ath-day-event-title').forEach(el => {
           
                el.addEventListener('click',function(e){
                    let ref = this.getAttribute("data-id");
                    this.classList.add("day-expanded")
                        document.querySelectorAll('.gv-ath-day-event-table').forEach(tableEl => {
                            if(ref === tableEl.getAttribute("data-id")){
                                tableEl.classList.remove("hide-el");
                                tableEl.classList.add("show-el");
                            }
                        })

                    

                })
    }); 
    



}



init();