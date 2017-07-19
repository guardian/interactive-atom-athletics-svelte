
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


}



init();