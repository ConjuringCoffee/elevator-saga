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
                return floors.filter((floor) => {
                    return floor.getDownRequestStatus() === "active"
                        || floor.getUpRequestStatus() === "active";
                })
            };


            elevator._index = index;
            elevator._lastUpdatedLoadFactor = 0;
            elevator._estimatedPassengerCount = 0;
            elevator._currentThought = 'Initialized';

            elevator._estimatePassengerCount = () => {
                const loadFactor = elevator.loadFactor();
                if (loadFactor === 0) {
                    // Reset to zero. Nobody is on this elevator
                    elevator._estimatedPassengerCount = 0;
                } else if (elevator._lastUpdatedLoadFactor < loadFactor && elevator._estimatedPassengerCount < elevator.maxPassengerCount()) {
                    elevator._estimatedPassengerCount += 1;
                } else if (elevator._lastUpdatedLoadFactor > loadFactor && elevator._estimatedPassengerCount > 1) {
                    elevator._estimatedPassengerCount -= 1;
                }
                elevator._lastUpdatedLoadFactor = loadFactor;
            }

            elevator.on("idle", () => {
                console.debug(`\nElevator ${elevator._index}: Idle`);

                const currentFloorNumber = elevator.currentFloor();
                const currentFloor = floors[currentFloorNumber];

                const upRequestStatusBeforeReset = currentFloor.getUpRequestStatus();
                const downRequestStatusBeforeReset = currentFloor.getDownRequestStatus();

                if (elevator.goingUpIndicator()) {
                    currentFloor.setUpRequestStatus('inactive');
                }
                if (elevator.goingDownIndicator()) {
                    currentFloor.setDownRequestStatus('inactive');
                }

                if (elevator.getPressedFloors().length > 0) {
                    setDestination(getClosestPressedFloor());
                    setUpDownIndicatorsByDestination();

                    elevator._currentThought = `Was idle, now targeting pressed floor ${elevator.destinationQueue[0]}`;
                    return;
                }

                if (upRequestStatusBeforeReset === "active"
                    || upRequestStatusBeforeReset === "accepted"
                    || downRequestStatusBeforeReset === "active"
                    || downRequestStatusBeforeReset === "accepted") {
                    setBothUpDownIndicators();
                    elevator._currentThought = `Was idle without pressed floor, and there is a request on the current floor. Waiting with both indicators on`;

                    // Workaround: If the destination is not set to the current floor, then people on this floor don't understand they can get onto this elevator
                    setDestination(currentFloorNumber);
                    return;
                }

                const floorsWithRequest = getFloorsWithRequest();
                const floorNumbersWithRequest = floorsWithRequest.map((floor) => floor.floorNum());

                if (floorNumbersWithRequest.length === 0) {
                    setBothUpDownIndicators();
                    elevator._currentThought = `Was idle without pressed floor, and there are no active requests anywhere. Waiting with both indicators on`;
                    return;
                }

                const closestFloorNumber = getClosestFloorNumber(floorNumbersWithRequest);
                setDestination(closestFloorNumber);
                const closestFloor = floors[closestFloorNumber];

                // TODO: Handle case in which up AND down requests are active
                if (closestFloor.getUpRequestStatus() === 'active') {
                    closestFloor.setUpRequestStatus('accepted');
                    setUpDownIndicatorsForUp();
                    elevator._currentThought = `Was idle without pressed floor, targeting floor ${elevator.destinationQueue[0]} to handle up request`;
                } else if (closestFloor.getDownRequestStatus() === 'active') {
                    closestFloor.setDownRequestStatus('accepted');
                    setUpDownIndicatorsForDown();
                    elevator._currentThought = `Was idle without pressed floor, targeting floor ${elevator.destinationQueue[0]} to handle down request`;
                }
            });

            elevator.on("stopped_at_floor", (floorNumberStopped) => {
                console.debug(`\nElevator ${elevator._index}: Stopped at floor ${floorNumberStopped}`);
            });

            elevator.on("floor_button_pressed", (floorNumberPressed) => {
                console.debug(`\nElevator ${elevator._index}: Button for floor ${floorNumberPressed} was pressed`);

                const floor = floors[elevator.currentFloor()];

                if (floorNumberPressed > elevator.currentFloor()) {
                    floor.setUpRequestStatus('inactive');
                } else if (floorNumberPressed < elevator.currentFloor()) {
                    floor.setDownRequestStatus('inactive');
                } else {
                    throw new Error('A button was pressed for the current floor');
                }

                if (elevator.destinationQueue.length === 0
                    || Math.abs(elevator.currentFloor() - floorNumberPressed) < Math.abs(elevator.currentFloor() - elevator.destinationQueue[0])) {
                    setDestination(floorNumberPressed);
                    setUpDownIndicatorsByDestination();

                    // TODO: Do something with the requests on that floor
                    elevator._currentThought = `Targeting pressed floor ${elevator.destinationQueue[0]}`;
                }
            });

            elevator.on("passing_floor", (floorNumberPassing, direction) => {
                const currentDestination = elevator.destinationQueue[0];
                console.debug(`\nElevator ${elevator._index}: Floor ${floorNumberPassing} is being passed`);
                if (elevator._estimatedPassengerCount < elevator.maxPassengerCount() && elevator.loadFactor() < 1) {
                    const floorPassing = floors[floorNumberPassing];

                    if (direction === "up" && elevator.goingUpIndicator() === true && floorPassing.getUpRequestStatus() === "active") {
                        setDestination(floorNumberPassing);
                        setUpDownIndicatorsForUp();
                        floorPassing.setUpRequestStatus('accepted');

                        elevator._currentThought = `Was on the way up to floor ${currentDestination}, but stopping at passing floor ${floorNumberPassing} to handle up request`;
                    } else if (direction === "down" && elevator.goingDownIndicator() === true && floorPassing.getDownRequestStatus() === "active") {
                        setDestination(floorNumberPassing);
                        setUpDownIndicatorsForDown();
                        floorPassing.setDownRequestStatus('accepted');

                        elevator._currentThought = `Was on the way down to floor ${currentDestination}, but stopping at passing floor ${floorNumberPassing} to handle down request`;
                    }
                }
            });
        });

        floors.forEach((floor) => {
            const getIdleElevators = () => {
                return elevators.filter((elevator) => {
                    const elevatorFloor = floors[elevator.currentFloor()];
                    return elevator.destinationDirection() === 'stopped'
                        && elevator.destinationQueue.length === 0
                        && elevator.getPressedFloors().length === 0
                        && elevatorFloor.getUpRequestStatus() === "inactive"
                        && elevatorFloor.getDownRequestStatus() === "inactive"
                });
            };

            const getClosestElevator = (/** @type {Elevator[]} */ availableElevators) => {
                var closestElevator;
                var closestDistance = 999999999;

                availableElevators.forEach((availableElevator) => {
                    const distance = Math.abs(availableElevator.currentFloor() - floor.floorNum());
                    // TODO: If the distance is equal, prefer floors closer to the very bottom or the very top
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

            floor._upRequestStatus = 'inactive';
            floor.setUpRequestStatus = (newStatus) => {
                floor._upRequestStatus = newStatus;
            }
            floor.getUpRequestStatus = () => floor._upRequestStatus;

            floor._downRequestStatus = 'inactive';
            floor.setDownRequestStatus = (newStatus) => {
                floor._downRequestStatus = newStatus
            };
            floor.getDownRequestStatus = () => floor._downRequestStatus;

            floor.on("up_button_pressed", () => {
                console.debug(`\nFloor ${floor.floorNum()}: Up button was pressed`);
                floor.setUpRequestStatus('active');

                const idleElevators = getIdleElevators();

                if (idleElevators.length > 0) {
                    const closestElevator = getClosestElevator(idleElevators);
                    setElevatorDestination(closestElevator, floor.floorNum());
                    // @ts-ignore // TODO
                    closestElevator.goingUpIndicator(true);
                    // @ts-ignore // TODO
                    closestElevator.goingDownIndicator(false);
                    // @ts-ignore // TODO
                    closestElevator._currentThought = `Was idle, now targeting floor ${floor.floorNum()} to handle fresh up request`;
                }
            });

            floor.on("down_button_pressed", () => {
                console.debug(`\nFloor ${floor.floorNum()}: Down button was pressed`);
                floor.setDownRequestStatus('active');

                const idleElevators = getIdleElevators();

                if (idleElevators.length > 0) {
                    const closestElevator = getClosestElevator(idleElevators);
                    setElevatorDestination(closestElevator, floor.floorNum());
                    // @ts-ignore // TODO
                    closestElevator.goingUpIndicator(false);
                    // @ts-ignore // TODO
                    closestElevator.goingDownIndicator(true);
                    // @ts-ignore // TODO
                    closestElevator._currentThought = `Was idle, now targeting floor ${floor.floorNum()} to handle fresh down request`;
                }
            });
        });
    },

    update: function (dt, elevators, floors) {
        // console.debug("\nUpdate:");
        elevators.forEach((elevator) => {
            elevator._estimatePassengerCount();

            if (elevator._currentThought !== elevator._thoughtFromLastUpdate) {
                console.debug(`\nUpdate: Elevator ${elevator._index}: (new) ${elevator._currentThought}`);
                elevator._thoughtFromLastUpdate = elevator._currentThought;
            } else {
                // console.debug(`\nElevator ${elevator._index}: (old) ${elevator._currentThought}`);
            }
        });
    },

})