/// <reference path="./elevatorsaga.d.ts" />
/** @type {Game} */
({
    init: function (elevators, floors) {
        elevators.forEach((elevator, index) => {
            elevator._index = index;
        });

        floors.forEach((floor) => {
            floor._downRequestPending = false;
            floor._upRequestPending = false;

            floor.on("up_button_pressed", () => {
                floor._upRequestPending = true;
            });

            floor.on("down_button_pressed", () => {
                floor._downRequestPending = true;
            });
        });
    },
    update: function (dt, elevators, floors) {
        // Do nothing for now
    },

})