interface MockElevator extends Elevator {
    currentFloorValue: number;
    destinationDirectionValue: "up" | "down" | "stopped";
    pressedFloors: number[];
    handlers: { [K in keyof ElevatorEvents]?: ElevatorEvents[K] };
    goingUpIndicatorValue: boolean;
    goingDownIndicatorValue: boolean;
    maxPassengerCountValue: number;
    loadFactorValue: number;
    trigger: <Event extends keyof ElevatorEvents>(type: Event, ...args: Parameters<ElevatorEvents[Event]>) => void;
}

interface MockFloor extends Floor {
    handlers: { [K in keyof FloorEvents]?: FloorEvents[K] };
    trigger: <Event extends keyof FloorEvents>(type: Event, ...args: Parameters<FloorEvents[Event]>) => void;
}

const expectDestinationQueueToBe = (elevator: MockElevator, expectedQueue: number[]) => {
    expect(elevator.destinationQueue.toString()).toBe(expectedQueue.toString());
}

const expectOnlyUpIndicator = (elevator: MockElevator) => {
    expect(elevator.goingUpIndicator(null)).toBe(true);
    expect(elevator.goingDownIndicator(null)).toBe(false);
}

const expectOnlyDownIndicator = (elevator: MockElevator) => {
    expect(elevator.goingUpIndicator(null)).toBe(false);
    expect(elevator.goingDownIndicator(null)).toBe(true);
}

const expectUpAndDownIndicators = (elevator: MockElevator) => {
    expect(elevator.goingUpIndicator(null)).toBe(true);
    expect(elevator.goingDownIndicator(null)).toBe(true);
}

const fs = require('fs');
const data = fs.readFileSync('./elevatorsaga.js', 'utf8');

var elevators: Array<MockElevator> = [];
var floors: Array<MockFloor> = [];
var game: Game;

beforeEach(() => {
    const createElevator = (): MockElevator => {
        return {
            _index: 0,
            _lastUpdatedLoadFactor: 0,
            _estimatedPassengerCount: 0,
            _estimatePassengerCount() {
                throw new Error("No need to implement this ever");
            },
            _currentThought: '',
            _thoughtFromLastUpdate: '',
            maxPassengerCountValue: 4,
            loadFactorValue: 0,
            currentFloorValue: 0,
            destinationDirectionValue: "stopped",
            destinationQueue: [],
            pressedFloors: [],
            handlers: {},
            goingUpIndicatorValue: true,
            goingDownIndicatorValue: true,
            currentFloor() {
                return this.currentFloorValue;
            },
            destinationDirection() {
                return this.destinationDirectionValue;
            },
            on(type, handler) {
                this.handlers[type] = handler;
            },
            trigger(type, ...args) {
                if (this.handlers[type]) {
                    (this.handlers[type] as any)(...args);
                }
            },
            checkDestinationQueue: jest.fn(() => { }),
            getPressedFloors() {
                return this.pressedFloors;
            },
            goingUpIndicator(newIndicatorState) {
                if (newIndicatorState !== null) {
                    this.goingUpIndicatorValue = newIndicatorState;
                }
                return this.goingUpIndicatorValue;
            },
            goingDownIndicator(newIndicatorState) {
                if (newIndicatorState !== null) {
                    this.goingDownIndicatorValue = newIndicatorState;
                }
                return this.goingDownIndicatorValue;
            },
            goToFloor() {
                throw new Error("Not implemented yet");
            },
            stop() {
                throw new Error("Not implemented yet");
            },
            maxPassengerCount() {
                return this.maxPassengerCountValue;
            },
            loadFactor() {
                return this.loadFactorValue;
            },
        }
    }

    const createFloor = (floorNumber: number): MockFloor => {
        return {
            _upRequestStatus: 'inactive',
            _downRequestStatus: 'inactive',
            floorNum: () => floorNumber,
            handlers: {},
            on(type, handler) {
                this.handlers[type] = handler;
            },
            trigger(type, ...args) {
                if (this.handlers[type]) {
                    (this.handlers[type] as any)(...args);
                }
            }
        };
    };

    elevators = [createElevator(), createElevator()];
    floors = [createFloor(0), createFloor(1), createFloor(2), createFloor(3)];

    game = eval(data);
    game.init(elevators as Elevator[], floors as Floor[]);
});

test('All elevators get assigned to an index', () => {
    expect(elevators[0]._index).toBe(0);
    expect(elevators[1]._index).toBe(1);
});

test('All elevators have an initial load factor of zero', () => {
    elevators.forEach((elevator) => {
        expect(elevator._lastUpdatedLoadFactor).toBe(0);
        expect(elevator.loadFactor()).toBe(0);
        expect(elevator._estimatedPassengerCount).toBe(0);
    })
})

test('All requests on floors are false in the beginning', () => {
    floors.forEach((floor) => {
        expect(floor._upRequestStatus).toBe('inactive');
        expect(floor._downRequestStatus).toBe('inactive');
    });
});

describe("Up / down button requests on floors:", () => {
    var floor: MockFloor;

    beforeEach(() => {
        elevators[0].currentFloorValue = 2;
        elevators[1].currentFloorValue = 1;
        floor = floors[1];
    });

    describe('If no elevator is stopped on the same floor:', () => {
        test('Up button request is remembered', () => {
            floor.trigger('up_button_pressed');
            expect(floor._upRequestStatus).toBe('active');
        });

        test('Down button request is remembered', () => {
            floor.trigger('down_button_pressed');
            expect(floor._downRequestStatus).toBe('active');
        });

        test('If an elevator is waiting, move it to the floor', () => {
            floor.trigger('up_button_pressed');
            const elevator = elevators[0];

            expectDestinationQueueToBe(elevator, [floor.floorNum()]);
            expectOnlyUpIndicator(elevator);
        })
    });
});

describe("Floor button presses:", () => {
    var elevator: MockElevator;
    var floor: MockFloor;

    beforeEach(() => {
        elevator = elevators[0];
        elevator.currentFloorValue = 1;

        floor = floors[1];
        floor._upRequestStatus = 'active';
        floor._downRequestStatus = 'active';
    });

    test("If destination queue is empty, go to that floor", () => {
        elevator.trigger("floor_button_pressed", 2);

        expectDestinationQueueToBe(elevator, [2]);
        expect(elevator.checkDestinationQueue).toHaveBeenCalled();
        expectOnlyUpIndicator(elevator);
    });

    test("If floor pressed is higher, then remove up request", () => {
        elevator.trigger("floor_button_pressed", 2);

        expect(floor._upRequestStatus).toBe('inactive');
        expect(floor._downRequestStatus).toBe('active');
    });

    test("If floor pressed is lower, then remove down request", () => {
        elevator.trigger("floor_button_pressed", 0);

        expect(floor._upRequestStatus).toBe('active');
        expect(floor._downRequestStatus).toBe('inactive');
    });

    test("If a floor closer was pressed now, override it", () => {
        elevator.pressedFloors = [3];
        elevator.destinationQueue = [3];
        elevator.trigger("floor_button_pressed", 2);

        expectDestinationQueueToBe(elevator, [2]);
    });

    test("If a floor further away was pressed now, do not override it", () => {
        elevator.pressedFloors = [2];
        elevator.destinationQueue = [2];
        elevator.trigger("floor_button_pressed", 3);

        expectDestinationQueueToBe(elevator, [2]);
    })
});

describe("Elevator stopped:", () => {
    var elevator: MockElevator;
    var stoppedFloor: MockFloor;

    beforeEach(() => {
        // The elevator drives to floor 1 and stops there
        elevator = elevators[0];
        elevator.currentFloorValue = 1;
        elevator.goingDownIndicatorValue = true;
        elevator.goingUpIndicatorValue = true;

        stoppedFloor = floors[elevator.currentFloorValue];
    });

    test("If floor buttons are already pressed, go to the nearest next", () => {
        elevator.pressedFloors = [3, 2];
        elevator.trigger("stopped_at_floor", elevator.currentFloorValue);

        expectDestinationQueueToBe(elevator, [2]);
        expect(elevator.checkDestinationQueue).toHaveBeenCalled();
        expectOnlyUpIndicator(elevator);
    });

    test("If the elevator moves up, clear the up request", () => {
        elevator.destinationQueue = [2];
        elevator.pressedFloors = [2];

        stoppedFloor._upRequestStatus = 'active';
        stoppedFloor._downRequestStatus = 'active';

        elevator.trigger("stopped_at_floor", elevator.currentFloorValue);

        expectDestinationQueueToBe(elevator, [2]);

        const floor = floors[elevator.currentFloorValue];
        expect(floor._upRequestStatus).toBe('inactive');
        expect(floor._downRequestStatus).toBe('active');
    });

    test("If the elevator moves down, clear the down request", () => {
        elevator.destinationQueue = [0];
        elevator.pressedFloors = [0];

        stoppedFloor._upRequestStatus = 'active';
        stoppedFloor._downRequestStatus = 'active';

        elevator.trigger("stopped_at_floor", elevator.currentFloorValue);

        expectDestinationQueueToBe(elevator, [0]);

        expect(stoppedFloor._upRequestStatus).toBe('active');
        expect(stoppedFloor._downRequestStatus).toBe('inactive');
    });

    describe("If no floor button is pressed, turn on up and down indicators and...:", () => {
        test("If there are no requests, simply wait", () => {
            elevator.trigger("stopped_at_floor", elevator.currentFloorValue);
            expectDestinationQueueToBe(elevator, []);
            expectUpAndDownIndicators(elevator);
        });

        test("If there is still a request on the current floor, then wait", () => {
            floors[1]._upRequestStatus = 'active';
            floors[2]._upRequestStatus = 'active';
            floors[3]._upRequestStatus = 'active';

            elevator.trigger("stopped_at_floor", elevator.currentFloorValue);
            expectDestinationQueueToBe(elevator, []);
            expectUpAndDownIndicators(elevator);
        });

        describe("About requests on other floors:", () => {
            test("If there are requests on multiple floors, go to the nearest", () => {
                floors[2]._upRequestStatus = 'active';
                floors[3]._upRequestStatus = 'active';

                elevator.trigger("stopped_at_floor", elevator.currentFloorValue);
                expectDestinationQueueToBe(elevator, [2]);
                expect(elevator.checkDestinationQueue).toHaveBeenCalled();


            });

            test("If it is an up request, then set only up indicator and accept request", () => {
                const floor = floors[2];
                floor._upRequestStatus = 'active';

                elevator.trigger("stopped_at_floor", elevator.currentFloorValue);
                expectOnlyUpIndicator(elevator);
                expect(floor._upRequestStatus).toBe("accepted");
            });

            test("If it is a down request, then set only down indicator and accept request", () => {
                const floor = floors[2];
                floor._downRequestStatus = 'active';

                elevator.trigger("stopped_at_floor", elevator.currentFloorValue);
                expectOnlyDownIndicator(elevator);
                expect(floor._downRequestStatus).toBe("accepted");
            });
        })

    })
});

describe("Passing floor:", () => {
    var elevator: MockElevator;
    var floor: MockFloor;

    beforeEach(() => {
        elevator = elevators[0];
    });

    describe("If up request on the way up to pressed floor", () => {
        beforeEach(() => {
            elevator.pressedFloors = [3];
            elevator.destinationQueue = [3];
            elevator.destinationDirectionValue = 'up';

            floor = floors[1];
            floor._upRequestStatus = 'active';
        });

        test("Set floor as destination if an additional passenger fits", () => {
            elevator._estimatedPassengerCount = elevator.maxPassengerCount() - 1;
            elevator.trigger("passing_floor", floor.floorNum(), "up");

            expectDestinationQueueToBe(elevator, [1]);
            expect(elevator.checkDestinationQueue).toHaveBeenCalled();
        });

        test("Also accept the up request", () => {
            elevator.trigger("passing_floor", floor.floorNum(), "up");
            expect(floor._upRequestStatus).toBe('accepted');
        });

        test("Do not set floor as destination if no additional passenger fits", () => {
            elevator._estimatedPassengerCount = elevator.maxPassengerCount();
            elevator.trigger("passing_floor", floor.floorNum(), "up");

            expectDestinationQueueToBe(elevator, [3]);
            expect(elevator.checkDestinationQueue).toHaveBeenCalledTimes(0);
        });

        test("Do not set floor as destination if load factor is one", () => {
            elevator._estimatedPassengerCount = 2;
            elevator.loadFactorValue = 1;
            elevator.trigger("passing_floor", floor.floorNum(), "up");

            expectDestinationQueueToBe(elevator, [3]);
            expect(elevator.checkDestinationQueue).toHaveBeenCalledTimes(0);
        });

        test("Do not set floor as destination if request direction does not match indicator", () => {
            elevator.goingUpIndicator(false);
            elevator.goingDownIndicator(true);

            elevator.trigger("passing_floor", floor.floorNum(), "up");

            expectDestinationQueueToBe(elevator, [3]);
            expect(elevator.checkDestinationQueue).toHaveBeenCalledTimes(0);
        });
    });

    describe("If on the way up without any pressed floors", () => {
        test("If passing floor has up request, then set destination and accept up request", () => {
            elevator.destinationQueue = [3];
            elevator.destinationDirectionValue = 'up';
            floor = floors[1];
            floor._upRequestStatus = 'active';

            elevator.trigger("passing_floor", 1, "up");

            expectDestinationQueueToBe(elevator, [1]);
            expect(floor._upRequestStatus).toBe("accepted");
        });
        test("If passing floor only has down request, then do not stop", () => {
            elevator.destinationQueue = [3];
            elevator.destinationDirectionValue = 'up';
            floor = floors[1];
            floor._downRequestStatus = 'active';

            elevator.trigger("passing_floor", 1, "up");

            expectDestinationQueueToBe(elevator, [3]);
            expect(floor._downRequestStatus).toBe("active");
        });
    });

    // TODO: Test for: If on the way down to pressed floor
});

test("Increasing load factor increments estimated passenger count", () => {
    const elevator = elevators[0];
    elevator._lastUpdatedLoadFactor = 0.2;
    elevator.loadFactorValue = 0.5;

    game.update(1, elevators, floors);

    expect(elevator._estimatedPassengerCount).toBe(1);
    expect(elevator._lastUpdatedLoadFactor).toBe(0.5);
});

test("Decreasing load factor decrements estimated passenger count", () => {
    const elevator = elevators[0];
    elevator._lastUpdatedLoadFactor = 0.5;
    elevator.loadFactorValue = 0.2;
    elevator._estimatedPassengerCount = 2;

    game.update(1, elevators, floors);

    expect(elevator._estimatedPassengerCount).toBe(1);
    expect(elevator._lastUpdatedLoadFactor).toBe(0.2);
});

test("Estimated passenger count does not exceed maximum passenger count", () => {
    const elevator = elevators[0];
    elevator._lastUpdatedLoadFactor = 0.2;
    elevator.loadFactorValue = 0.5;
    elevator._estimatedPassengerCount = 4;

    game.update(1, elevators, floors);

    expect(elevator._estimatedPassengerCount).toBe(4);
    expect(elevator._lastUpdatedLoadFactor).toBe(0.5);
});

test("Estimated passenger count is over zero if load factor is over zero", () => {
    const elevator = elevators[0];
    elevator._lastUpdatedLoadFactor = 0.2;
    elevator.loadFactorValue = 0.1;
    elevator._estimatedPassengerCount = 1;

    game.update(1, elevators, floors);

    expect(elevator._estimatedPassengerCount).toBe(1);
    expect(elevator._lastUpdatedLoadFactor).toBe(0.1);
});

// TODO: Elevators sometimes reach their destination but another elevator already picked all people up
// TODO: When choosing a destination, check if another elevator has a pressed floor button for that floor (with the correct direction)