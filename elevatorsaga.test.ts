interface MockElevator extends Elevator {
    currentFloorValue: number;
    destinationDirectionValue: "up" | "down" | "stopped";
    pressedFloors: number[];
    handlers: { [K in keyof ElevatorEvents]?: ElevatorEvents[K] };
    goingUpIndicatorValue: boolean;
    goingDownIndicatorValue: boolean;
    trigger: <Event extends keyof ElevatorEvents>(type: Event, ...args: Parameters<ElevatorEvents[Event]>) => void;
}

interface MockFloor extends Partial<Floor> {
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
    floors = [createFloor(0), createFloor(1), createFloor(2)];

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

describe("Button requests on floors:", () => {
    var floor: MockFloor;

    beforeEach(() => {
        elevators.forEach((elevator) => {
            elevator.currentFloorValue = 1;
        });
        floor = floors[0];
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
    })


    describe('If an elevator is stopped on the same floor:', () => {
        beforeEach(() => {
            const elevator = elevators[0];
            elevator.currentFloorValue = 0;
            elevator.destinationDirectionValue = 'stopped';
        });

        test('Up button request is remembered', () => {
            floor.trigger('up_button_pressed');
            expect(floor._upRequestPending).toBe(false);
        });

        test('Down button request is remembered', () => {
            floor.trigger('down_button_pressed');
            expect(floor._downRequestPending).toBe(false);
        });
    });
});

describe("Floor button presses:", () => {
    test("If destination queue is empty, go to floor", () => {
        const elevator = elevators[0];
        elevator.trigger("floor_button_pressed", 1);

        expectDestinationQueueToBe(elevator, [1]);
        expect(elevator.checkDestinationQueue).toHaveBeenCalled();
        expectOnlyUpIndicator(elevator);
    });
});

describe("Elevator stops:", () => {
    var elevator: MockElevator;
    beforeEach(() => {
        elevator = elevators[0];
        elevator.goingDownIndicatorValue = true;
        elevator.goingUpIndicatorValue = false;
    })
    test("If one floor button is already pressed, go to there next", () => {
        elevator.pressedFloors = [2];
        elevator.trigger("stopped_at_floor", 0);

        expectDestinationQueueToBe(elevator, [2]);
        expect(elevator.checkDestinationQueue).toHaveBeenCalled();
        expectOnlyUpIndicator(elevator);
    });

    test("If no floor button is pressed, turn on up and down indicators", () => {
        elevator.trigger("stopped_at_floor", 0);
        expectUpAndDownIndicators(elevator);
    });
})