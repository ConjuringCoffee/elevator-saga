/// <reference path="./elevatorsaga.d.ts" />
/** @type {Game} */
({
    init: function (elevators, floors) {
        elevators.forEach((elevator, index) => {
            const setDestination = (/** @type {number} */ floorNumber) => {
                elevator.destinationQueue.push(floorNumber);
                elevator.checkDestinationQueue();
            };

            const setUpDownIndicatorsByDestination = () => {
                const nextDestination = elevator.destinationQueue[0];

                if (nextDestination === undefined) {
                    throw new Error("There is no next destination");
                }

                const distance = nextDestination - elevator.currentFloor();

                if (distance > 0) {
                    elevator.goingUpIndicator(true);
                    elevator.goingDownIndicator(false);
                } else if (distance < 0) {
                    elevator.goingUpIndicator(false);
                    elevator.goingDownIndicator(true);
                } else {
                    throw new Error('The elevator is already on the destination');
                }
            }

            const getClosestPressedFloor = () => {
                const pressedFloors = elevator.getPressedFloors();
                return getClosestFloorNumber(pressedFloors);
            }

            const getClosestFloorNumber = (/** @type {number[]} */ floorNumbers) => {
                var closestFloorNumber;
                var closestDistance = 999999999;

                const currentFloor = elevator.currentFloor();

                floorNumbers.forEach((floorNumber) => {
                    const distance = Math.abs(currentFloor - floorNumber);
                    if (distance < closestDistance) {
                        closestFloorNumber = floorNumber;
                        closestDistance = distance;
                    }
                });

                if (closestFloorNumber === undefined) {
                    throw new Error("Failed to get closest floor");
                }

                return closestFloorNumber;
            }

            const getFloorsWithRequest = () => {
                return floors.filter((floor) => floor._downRequestPending === true || floor._upRequestPending);
            }

            elevator._index = index;

            elevator.on("stopped_at_floor", (floorNumber) => {
                console.debug(`\nElevator ${elevator._index}: Stopped on floor ${floorNumber}`);

                if (elevator.getPressedFloors().length > 0) {
                    setDestination(getClosestPressedFloor());
                    setUpDownIndicatorsByDestination();
                } else {
                    elevator.goingUpIndicator(true);
                    elevator.goingDownIndicator(true);

                    const floorsWithRequest = getFloorsWithRequest();
                    const floorNumbersWithRequest = floorsWithRequest.map((floor) => floor.floorNum());

                    if (!floorNumbersWithRequest.includes(floorNumber)) {
                        if (floorNumbersWithRequest.length > 0) {
                            const closestFloorNumber = getClosestFloorNumber(floorNumbersWithRequest);
                            setDestination(closestFloorNumber);
                        }
                    }
                }

                console.debug('Destination queue at the end:', elevator.destinationQueue.toString());
            });

            elevator.on("floor_button_pressed", (floorNumberPressed) => {
                console.debug(`\nElevator ${elevator._index}: Button for floor ${floorNumberPressed} was pressed`);

                const floor = floors[elevator.currentFloor()];

                if (floorNumberPressed > elevator.currentFloor()) {
                    floor._upRequestPending = false;
                } else if (floorNumberPressed < elevator.currentFloor()) {
                    floor._downRequestPending = false;
                } else {
                    throw new Error('A button was pressed for the current floor');
                }

                if (elevator.destinationQueue.length === 0) {
                    setDestination(floorNumberPressed);
                    setUpDownIndicatorsByDestination();
                }

                console.debug('Destination queue at the end:', elevator.destinationQueue.toString());
            });
        });

        floors.forEach((floor) => {
            floor._downRequestPending = false;
            floor._upRequestPending = false;

            floor.on("up_button_pressed", () => {
                console.debug(`\nFloor ${floor.floorNum()}: Up button was pressed`);
                floor._upRequestPending = true;
            });

            floor.on("down_button_pressed", () => {
                console.debug(`\nFloor ${floor.floorNum()}: Down button was pressed`);
                floor._downRequestPending = true;
            });
        });
    },

    update: function (dt, elevators, floors) {
        // Do nothing for now
    },

})