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
                const distance = Math.floor(elevator.currentFloor() - floorNumber);
                if (distance < bestDistance) {
                    bestElevator = elevator;
                    bestDistance = distance;
                };
            }

            const getShortestFutureDistance = (/** @type {Elevator} */ elevator) => {
                var shortestFutureDistance = 99999999999;

                elevator.destinationQueue.forEach((destination) => {
                    const distance = Math.floor(destination - floorNumber);

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

            const isElevatorMovingTowardsOrStoppedOnFloor = (/** @type {Elevator} */ elevator) => {
                // TODO: Handle edge case: Rounded currentFloor() could mean that the floor was already passed
                const distance = elevator.currentFloor() - floorNumber;

                if (distance >= 0 && elevator.destinationDirection() === "down") {
                    return true;
                } else if (distance <= 0 && elevator.destinationDirection() === "up") {
                    return true;
                } else if (distance === 0 && elevator.destinationDirection() === "stopped") {
                    return true;
                } else {
                    return false;
                }
            }

            elevators.forEach((elevator) => {
                if (isElevatorMovingTowardsOrStoppedOnFloor(elevator)) {
                    setBestIfCurrentDistanceIsBest(elevator);
                }
            });

            if (bestElevator === null) {
                console.debug('No elevator moving towards the floor, so disregard the direction');

                elevators.forEach((elevator) => {
                    setBestIfFutureDistanceIsBest(elevator);
                });
            }

            if (bestElevator === null) {
                console.error('No elevator found, use first elevator as fallback');
                bestElevator = elevators[0];
            }

            console.debug(`E${bestElevator._index}: Chosen as best elevator`);

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
        }

        elevators.forEach((elevator, index) => {
            elevator._index = index;

            elevator.on("floor_button_pressed", (floorNumber) => {
                insertDestination(elevator, floorNumber);
            });
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