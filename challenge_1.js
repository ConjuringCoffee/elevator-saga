// Challenge #1: Transport 15 people in 60 seconds or less
// Three floors: 0-2
// One elevator

/// <reference path="./elevatorsaga.d.ts" />
/** @type {Game} */
({
    init: function (elevators, floors) {
        // Let's only use the first elevator for now
        const elevator = elevators[0];

        elevator.on("floor_button_pressed", (floorNumber) => {
            elevator.goToFloor(floorNumber);
        });

        floors.forEach((floor) => {
            floor.on("up_button_pressed", () => {
                elevator.goToFloor(floor.floorNum());
            });
            floor.on("down_button_pressed", () => {
                elevator.goToFloor(floor.floorNum());
            });
        })
    },
    update: function (dt, elevators, floors) {
        // Do nothing for now
    }
})