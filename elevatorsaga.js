/// <reference path="./elevatorsaga.d.ts" />
/** @type {Game} */
({
    init: function (elevators, floors) {
        const setElevatorDestination = (/** @type {Elevator} */ elevator, /** @type {number} */ floorNumber) => {
            while (elevator.destinationQueue.length > 0) {
                elevator.destinationQueue.pop();
            }

            elevator.destinationQueue.push(floorNumber);
            elevator.checkDestinationQueue();
        }

        elevators.forEach((elevator, index) => {
            const setDestination = (/** @type {number} */ floorNumber) => {
                setElevatorDestination(elevator, floorNumber);
            };

            const setBothUpDownIndicators = () => {
                elevator.goingUpIndicator(true);
                elevator.goingDownIndicator(true);
            };

            const setUpDownIndicatorsForUp = () => {
                elevator.goingUpIndicator(true);
                elevator.goingDownIndicator(false);
            };

            const setUpDownIndicatorsForDown = () => {
                elevator.goingUpIndicator(false);
                elevator.goingDownIndicator(true);
            }

            const setUpDownIndicatorsByDestination = () => {
                const nextDestination = elevator.destinationQueue[0];

                if (nextDestination === undefined) {
                    throw new Error("There is no next destination");
                }

                const distance = nextDestination - elevator.currentFloor();

                if (distance > 0) {
                    setUpDownIndicatorsForUp();
                } else if (distance < 0) {
                    setUpDownIndicatorsForDown();
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

                if (closestFloorNumber == undefined) {
                    throw new Error("Failed to get closest floor");
                }

                return closestFloorNumber;
            }

            const getFloorsWithRequest = () => {
                return floors.filter((floor) => floor._downRequestPending || floor._upRequestPending);
            }

            elevator._index = index;

            elevator.on("stopped_at_floor", (floorNumberStopped) => {
                console.debug(`\nElevator ${elevator._index}: Stopped on floor ${floorNumberStopped}`);

                if (elevator.getPressedFloors().length > 0) {
                    setDestination(getClosestPressedFloor());
                    setUpDownIndicatorsByDestination();
                } else {
                    setBothUpDownIndicators();

                    const floorsWithRequest = getFloorsWithRequest();
                    const floorNumbersWithRequest = floorsWithRequest.map((floor) => floor.floorNum());

                    if (!floorNumbersWithRequest.includes(floorNumberStopped)) {
                        if (floorNumbersWithRequest.length > 0) {
                            const closestFloorNumber = getClosestFloorNumber(floorNumbersWithRequest);
                            setDestination(closestFloorNumber);
                        }
                    }
                }

                if (elevator.destinationQueue.length > 0) {
                    // Clear requests in case the floor button was already pressed by a previous passenger
                    if (elevator.destinationQueue[0] > floorNumberStopped) {
                        floors[floorNumberStopped]._upRequestPending = false;
                    } else if (elevator.destinationQueue[0] < floorNumberStopped) {
                        floors[floorNumberStopped]._downRequestPending = false;
                    } else {
                        throw new Error('The next destination should not be the current floor');
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

                if (elevator.destinationQueue.length === 0
                    || Math.abs(elevator.currentFloor() - floorNumberPressed) < Math.abs(elevator.currentFloor() - elevator.destinationQueue[0])) {
                    setDestination(floorNumberPressed);
                    setUpDownIndicatorsByDestination();
                }
                console.debug('Destination queue at the end:', elevator.destinationQueue.toString());
            });

            elevator.on("passing_floor", (floorNumberPassing, direction) => {
                console.debug(`\nElevator ${elevator._index}: Floor ${floorNumberPassing} is being passed`);

                if (direction === "up" && floors[floorNumberPassing]._upRequestPending) {
                    setDestination(floorNumberPassing);
                    setUpDownIndicatorsForUp();
                } else if (direction === "down" && floors[floorNumberPassing]._downRequestPending) {
                    setDestination(floorNumberPassing);
                    setUpDownIndicatorsForDown();
                }
            });
        });

        floors.forEach((floor) => {
            const getIdleElevators = () => {
                return elevators.filter((elevator) => {
                    const elevatorFloor = floors[elevator.currentFloor()];
                    return elevator.destinationDirection() === 'stopped'
                        && elevator.destinationQueue.length === 0
                        && !elevatorFloor._upRequestPending
                        && !elevatorFloor._downRequestPending
                });
            };

            const getClosestElevator = (/** @type {Elevator[]} */ availableElevators) => {
                var closestElevator;
                var closestDistance = 999999999;

                availableElevators.forEach((availableElevator) => {
                    const distance = Math.abs(availableElevator.currentFloor() - floor.floorNum());
                    if (distance < closestDistance) {
                        closestElevator = availableElevator;
                        closestDistance = distance;
                    }
                });

                if (closestElevator === undefined) {
                    throw new Error("Failed to get closest elevator");
                }

                return closestElevator;
            }

            floor._downRequestPending = false;
            floor._upRequestPending = false;

            floor.on("up_button_pressed", () => {
                console.debug(`\nFloor ${floor.floorNum()}: Up button was pressed`);
                floor._upRequestPending = true;

                const idleElevators = getIdleElevators();

                if (idleElevators.length > 0) {
                    const closestElevator = getClosestElevator(idleElevators);
                    setElevatorDestination(closestElevator, floor.floorNum());
                    // @ts-ignore // TODO
                    closestElevator.goingUpIndicator(true);
                    // @ts-ignore // TODO
                    closestElevator.goingDownIndicator(false);
                }
            });

            floor.on("down_button_pressed", () => {
                console.debug(`\nFloor ${floor.floorNum()}: Down button was pressed`);
                floor._downRequestPending = true;

                const idleElevators = getIdleElevators();

                if (idleElevators.length > 0) {
                    const closestElevator = getClosestElevator(idleElevators);
                    setElevatorDestination(closestElevator, floor.floorNum());
                    // @ts-ignore // TODO
                    closestElevator.goingUpIndicator(false);
                    // @ts-ignore // TODO
                    closestElevator.goingDownIndicator(true);
                }
            });
        });
    },

    update: function (dt, elevators, floors) {
        // console.debug("\nUpdate:");
        // floors.forEach((floor) => {
        //     if (floor._upRequestPending) {
        //         console.debug(`Floor ${floor.floorNum()} has up request`);
        //     }
        //     if (floor._downRequestPending) {
        //         console.debug(`Floor ${floor.floorNum()} has down request`);
        //     }
        // })
    },

})