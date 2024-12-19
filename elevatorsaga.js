/// <reference path="./elevatorsaga.d.ts" />
/** @type {Game} */
({
    init: function (elevators, floors) {
        const isAnyElevatorStoppedOnFloor = (/** @type {Floor} */ floor) => {
            return elevators.some((elevator) => {
                return floor.floorNum() === elevator.currentFloor()
                    && elevator.destinationDirection() === 'stopped';
            });
        };

        elevators.forEach((elevator, index) => {
            elevator._index = index;

            elevator.on("stopped_at_floor", (floorNumber) => {
                console.debug(`\nElevator ${elevator._index}: Stopped on floor ${floorNumber}`);
            });
        });

        floors.forEach((floor) => {
            floor._downRequestPending = false;
            floor._upRequestPending = false;

            floor.on("up_button_pressed", () => {
                console.debug(`\nFloor ${floor.floorNum()}: Up button was pressed`);

                if (!isAnyElevatorStoppedOnFloor(floor)) {
                    floor._upRequestPending = true;
                }
            });

            floor.on("down_button_pressed", () => {
                console.debug(`\nFloor ${floor.floorNum()}: Down button was pressed`);

                if (!isAnyElevatorStoppedOnFloor(floor)) {
                    floor._downRequestPending = true;
                }
            });
        });
    },
    update: function (dt, elevators, floors) {
        // Do nothing for now
    },

})