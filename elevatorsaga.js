/// <reference path="./elevatorsaga.d.ts" />
/** @type {Game} */
({
    init: function (elevators, floors) {
        elevators.forEach((elevator, index) => {
            elevator._index = index;
        })
    },
    update: function (dt, elevators, floors) {
        // Do nothing for now
    },

})