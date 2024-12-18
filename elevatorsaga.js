/// <reference path="./elevatorsaga.d.ts" />
/** @type {Game} */
({
    init: function (elevators, floors) {
        const findAvailableElevator = (
            /** @type {number} */
            floorNumber
        ) => {
            /** @type {Elevator | null} */
            var bestElevator = null;
            var bestDistance = 99999999999;

            const setBestBasedOnDistance = (/** @type {Elevator} */ elevator) => {
                const distance = Math.floor(elevator.currentFloor() - floorNumber);
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

            elevators.forEach((elevator) => {
                if (isElevatorMovingTowardsFloor(elevator)) {
                    setBestBasedOnDistance(elevator);
                }
            });

            if (bestElevator === null) {
                // TODO: Improve fallback logic
                console.warn('No available elevator found, choosing the first one as fallback');
                bestElevator = elevators[0];
            }

            return bestElevator;
        }

        const insertDestination = (
            /** @type {Elevator} */
            elevator,
            /** @type {number} */
            floorNumber
        ) => {
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
            floor.on("up_button_pressed", () => {
                const elevator = findAvailableElevator(floor.floorNum());
                insertDestination(elevator, floor.floorNum());
            });
            floor.on("down_button_pressed", () => {
                const elevator = findAvailableElevator(floor.floorNum());
                insertDestination(elevator, floor.floorNum());
            });
        })
    },
    update: function (dt, elevators, floors) {
        // Do nothing for now
    },

})