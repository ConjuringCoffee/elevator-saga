/// <reference path="./elevatorsaga.d.ts" />
/** @type {Game} */
({
    init: function (elevators, floors) {
        elevators.forEach((elevator, index) => {
            const setDestination = (/** @type {number} */ floorNumber) => {
                elevator.destinationQueue.push(floorNumber);
                elevator.checkDestinationQueue();

                const distance = floorNumber - elevator.currentFloor();
                if (distance > 0) {
                    elevator.goingUpIndicator(true);
                    elevator.goingDownIndicator(false);
                } else if (distance < 0) {
                    elevator.goingUpIndicator(false);
                    elevator.goingDownIndicator(true);
                } else {
                    throw new Error('The elevator is already on the destination');
                }
            };

            const getClosestPressedFloor = () => {
                const pressedFloors = elevator.getPressedFloors();

                var closestFloor = 999999999;
                var closestDistance = 999999999;

                pressedFloors.forEach((pressedFloor) => {
                    const distance = Math.abs(elevator.currentFloor() - pressedFloor);
                    if (distance < closestDistance) {
                        closestFloor = pressedFloor;
                        closestDistance = distance;
                    }
                });

                return closestFloor;
            }

            elevator._index = index;

            elevator.on("stopped_at_floor", (floorNumber) => {
                console.debug(`\nElevator ${elevator._index}: Stopped on floor ${floorNumber}`);

                const pressedFloors = elevator.getPressedFloors();
                if (pressedFloors.length > 0) {
                    setDestination(getClosestPressedFloor());
                } else {
                    elevator.goingUpIndicator(true);
                    elevator.goingDownIndicator(true);
                }

                console.debug('Destination queue at the end:', elevator.destinationQueue.toString());
            });

            elevator.on("floor_button_pressed", (floorNumber) => {
                console.debug(`\nElevator ${elevator._index}: Button for floor ${floorNumber} was pressed`);

                if (elevator.destinationQueue.length === 0) {
                    setDestination(floorNumber);
                }

                console.debug('Destination queue at the end:', elevator.destinationQueue.toString());
            });
        });

        floors.forEach((floor) => {
            const isAnyElevatorStoppedOnFloor = () => {
                return elevators.some((elevator) => {
                    return floor.floorNum() === elevator.currentFloor()
                        && elevator.destinationDirection() === 'stopped';
                });
            };

            floor._downRequestPending = false;
            floor._upRequestPending = false;

            floor.on("up_button_pressed", () => {
                console.debug(`\nFloor ${floor.floorNum()}: Up button was pressed`);

                if (!isAnyElevatorStoppedOnFloor()) {
                    floor._upRequestPending = true;
                }
            });

            floor.on("down_button_pressed", () => {
                console.debug(`\nFloor ${floor.floorNum()}: Down button was pressed`);

                if (!isAnyElevatorStoppedOnFloor()) {
                    floor._downRequestPending = true;
                }
            });
        });
    },

    update: function (dt, elevators, floors) {
        // Do nothing for now
    },

})