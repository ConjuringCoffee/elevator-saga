interface MockElevator extends Elevator {
    currentFloorValue: number;
    destinationDirectionValue: "up" | "down" | "stopped";
    pressedFloors: number[];
    handlers: { [K in keyof ElevatorEvents]?: ElevatorEvents[K] };
    goingUpIndicatorValue: boolean;
    goingDownIndicatorValue: boolean;
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
            maxPassengerCount: () => {
                throw new Error("Not implemented yet");
            },
            loadFactor: () => {
                throw new Error("Not implemented yet");
            },
        }
    }

    const createFloor = (floorNumber: number): MockFloor => {
        return {
            _upRequestPending: false,
            _downRequestPending: false,
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

test('All requests on floors are false in the beginning', () => {
    floors.forEach((floor) => {
        expect(floor._upRequestPending).toBe(false);
        expect(floor._downRequestPending).toBe(false);
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
            expect(floor._upRequestPending).toBe(true);
        });

        test('Down button request is remembered', () => {
            floor.trigger('down_button_pressed');
            expect(floor._downRequestPending).toBe(true);
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
        floor._upRequestPending = true;
        floor._downRequestPending = true;
    });

    test("If destination queue is empty, go to that floor", () => {
        elevator.trigger("floor_button_pressed", 2);

        expectDestinationQueueToBe(elevator, [2]);
        expect(elevator.checkDestinationQueue).toHaveBeenCalled();
        expectOnlyUpIndicator(elevator);
    });

    test("If floor pressed is higher, then remove up request", () => {
        elevator.trigger("floor_button_pressed", 2);

        expect(floor._upRequestPending).toBe(false);
        expect(floor._downRequestPending).toBe(true);
    });

    test("If floor pressed is lower, then remove down request", () => {
        elevator.trigger("floor_button_pressed", 0);

        expect(floor._upRequestPending).toBe(true);
        expect(floor._downRequestPending).toBe(false);
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

    beforeEach(() => {
        // The elevator drives to floor 1 and stops there
        elevator = elevators[0];
        elevator.currentFloorValue = 1;
        elevator.goingDownIndicatorValue = true;
        elevator.goingUpIndicatorValue = true;
    });

    test("If floor buttons are already pressed, go to the nearest next", () => {
        elevator.pressedFloors = [3, 2];
        elevator.trigger("stopped_at_floor", elevator.currentFloorValue);

        expectDestinationQueueToBe(elevator, [2]);
        expect(elevator.checkDestinationQueue).toHaveBeenCalled();
        expectOnlyUpIndicator(elevator);
    });

    describe("If no floor button is pressed, turn on up and down indicators and...:", () => {
        test("If there are no requests, simply wait", () => {
            elevator.trigger("stopped_at_floor", elevator.currentFloorValue);
            expectDestinationQueueToBe(elevator, []);
            expectUpAndDownIndicators(elevator);
        });

        test("If there is still a request on the current floor, then wait", () => {
            floors[1]._upRequestPending = true;
            floors[2]._upRequestPending = true;
            floors[3]._upRequestPending = true;

            elevator.trigger("stopped_at_floor", elevator.currentFloorValue);
            expectDestinationQueueToBe(elevator, []);
            expectUpAndDownIndicators(elevator);
        });

        test("If there are requests on other floors, go to the nearest", () => {
            floors[2]._upRequestPending = true;
            floors[3]._upRequestPending = true;

            elevator.trigger("stopped_at_floor", elevator.currentFloorValue);
            expectDestinationQueueToBe(elevator, [2]);
            expect(elevator.checkDestinationQueue).toHaveBeenCalled();
            expectUpAndDownIndicators(elevator);
        })
    })
});

describe("Passing floor:", () => {
    var elevator: MockElevator;

    beforeEach(() => {
        elevator = elevators[0];
    });

    test("If on the way up to pressed floor, then set destination", () => {
        elevator.pressedFloors = [3];
        elevator.destinationQueue = [3];
        elevator.destinationDirectionValue = 'up';

        const floor = floors[1];
        floor._upRequestPending = true;

        elevator.trigger("passing_floor", floor.floorNum(), "up");

        expectDestinationQueueToBe(elevator, [1]);
        expect(elevator.checkDestinationQueue).toHaveBeenCalled();
    });
    // TODO: Test for: If on the way up down pressed floor, then set destination
    // TODO: Test for when both indicators switch to single indicator
});