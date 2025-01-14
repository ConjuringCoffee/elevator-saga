/// <reference path="./elevatorsaga.d.ts" />
/** @type {Game} */
({
    init: function (elevators, floors) {
        const searchAvailableElevator = (
            /** @type {number} */
            floorNumber
        ) => {
            console.debug('\n');
            console.debug(`Searching best elevator to pick up from floor ${floorNumber}`);

            /** @type {Elevator | null} */
            var bestElevator = null;
            var bestDistance = 99999999999;

            const setBestIfCurrentDistanceIsBest = (/** @type {Elevator} */ elevator) => {
                const distance = Math.abs(elevator.currentFloor() - floorNumber);
                if (distance < bestDistance) {
                    bestElevator = elevator;
                    bestDistance = distance;
                };
            }

            const getShortestFutureDistance = (/** @type {Elevator} */ elevator) => {
                var shortestFutureDistance = 99999999999;

                elevator.destinationQueue.forEach((destination) => {
                    const distance = Math.abs(destination - floorNumber);

                    if (distance < shortestFutureDistance) {
                        shortestFutureDistance = distance;
                    };
                })

                return shortestFutureDistance;
            }

            const setBestIfFutureDistanceIsBest = (/** @type {Elevator} */ elevator) => {
                const distance = getShortestFutureDistance(elevator);
                if (distance < bestDistance) {
                    bestElevator = elevator;
                    bestDistance = distance;
                };
            }

            const isElevatorMovingTowardsFloor = (/** @type {Elevator} */ elevator) => {
                // TODO: Handle edge case: Rounded currentFloor() could mean that the floor was already passed
                const distance = elevator.currentFloor() - floorNumber;

                if (distance >= 0 && elevator.destinationDirection() === "down") {
                    return true;
                } else if (distance <= 0 && elevator.destinationDirection() === "up") {
                    return true;
                } else {
                    return false;
                }
            }

            const isElevatorStoppedOnFloor = (/** @type {Elevator} */ elevator) => {
                return elevator.currentFloor() === floorNumber && elevator.destinationDirection() === "stopped";
            }

            const isElevatorIdle = (/** @type {Elevator} */ elevator) => {
                return elevator.destinationQueue.length === 0 && elevator.destinationDirection() === "stopped";
            }

            elevators.forEach((elevator) => {
                if (isElevatorIdle(elevator)) {
                    setBestIfCurrentDistanceIsBest(elevator);
                }
            });

            if (bestElevator === null) {
                elevators.forEach((elevator) => {
                    if (isElevatorStoppedOnFloor(elevator) || isElevatorMovingTowardsFloor(elevator)) {
                        setBestIfCurrentDistanceIsBest(elevator);
                    }
                });
            }

            if (bestElevator === null) {
                console.debug('No elevator moving towards or on the floor');

                elevators.forEach((elevator) => {
                    setBestIfFutureDistanceIsBest(elevator);
                });
            }

            if (bestElevator === null) {
                console.warn('No elevator found, use first elevator as fallback');
                bestElevator = elevators[0];
            }

            console.debug(`E${bestElevator._index}: Chosen as best elevator`);
            // console.debug(`E${bestElevator._index}: Current load factor is ${bestElevator.loadFactor()}`);
            return bestElevator;
        }

        const insertDestination = (
            /** @type {Elevator} */
            elevator,
            /** @type {number} */
            floorNumber
        ) => {
            console.debug('\n');
            console.debug(`E${elevator._index}: Inserting ${floorNumber} as new destination`);
            console.debug(`E${elevator._index}: Current floor ${elevator.currentFloor()}, direction ${elevator.destinationDirection()}`);
            console.debug(`E${elevator._index}: Current destination queue:`, elevator.destinationQueue.toString());

            if (elevator.destinationQueue.includes(floorNumber)) {
                console.debug(`E${elevator._index}: No need to insert anything`);
                return;
            }

            /** @type {number[]} */
            const newDestinationQueue = [];

            // TODO: Handle edge case: Rounded currentFloor() could mean that the floor was already passed
            var lastDestination = elevator.currentFloor();

            elevator.destinationQueue.forEach((destination, index) => {
                const difference = destination - lastDestination;

                const direction = difference >= 0 ? "up" : "down";

                switch (direction) {
                    case "up":
                        if (lastDestination < floorNumber && floorNumber < destination) {
                            newDestinationQueue.push(floorNumber);
                        }
                        break;
                    case "down":
                        if (lastDestination > floorNumber && floorNumber > destination) {
                            newDestinationQueue.push(floorNumber);
                        }
                        break;
                }
                newDestinationQueue.push(destination);
            });

            if (!newDestinationQueue.includes(floorNumber)) {
                newDestinationQueue.push(floorNumber);
            }

            elevator.destinationQueue = newDestinationQueue;
            console.debug(`E${elevator._index}: New destination queue:`, elevator.destinationQueue.toString());
            elevator.checkDestinationQueue();

            setGoingUpDownIndicators(elevator, elevator.destinationQueue[0]);
        }

        const setGoingUpDownIndicators = (/** @type {Elevator} */ elevator, /** @type {number} */nextFloorNumber) => {
            const distance = elevator.currentFloor() - nextFloorNumber;
            if (distance < 0) {
                elevator.goingUpIndicator(true);
                elevator.goingDownIndicator(false);
            } else if (distance > 0) {
                elevator.goingUpIndicator(false);
                elevator.goingDownIndicator(true);
            } else {
                elevator.goingUpIndicator(true);
                elevator.goingDownIndicator(true);
            }
        }

        elevators.forEach((elevator, index) => {
            elevator._index = index;

            elevator.on("floor_button_pressed", (floorNumber) => {
                insertDestination(elevator, floorNumber);
            });

            elevator.on("stopped_at_floor", (floorNumber) => {
                const nextFloorNumber = elevator.destinationQueue[0] ?? floorNumber;
                setGoingUpDownIndicators(elevator, nextFloorNumber);
            })
        });

        floors.forEach((floor) => {
            // TODO: Include up / down button in decision on which elevator to send
            floor.on("up_button_pressed", () => {
                const elevator = searchAvailableElevator(floor.floorNum());
                insertDestination(elevator, floor.floorNum());
            });
            floor.on("down_button_pressed", () => {
                const elevator = searchAvailableElevator(floor.floorNum());
                insertDestination(elevator, floor.floorNum());
            });
        })
    },
    update: function (dt, elevators, floors) {
        // Do nothing for now
    },

})