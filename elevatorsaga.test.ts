interface MockElevator extends Partial<Elevator> {
    currentFloorValue: number;
    destinationDirectionValue: "up" | "down" | "stopped";
    handlers: { [K in keyof ElevatorEvents]?: ElevatorEvents[K] };
    trigger: <Event extends keyof ElevatorEvents>(type: Event, ...args: Parameters<ElevatorEvents[Event]>) => void;
}

interface MockFloor extends Partial<Floor> {
    handlers: { [K in keyof FloorEvents]?: FloorEvents[K] };
    trigger: <Event extends keyof FloorEvents>(type: Event, ...args: Parameters<FloorEvents[Event]>) => void;
}

const fs = require('fs');
const data = fs.readFileSync('./elevatorsaga.js', 'utf8');

var mockElevators: Array<MockElevator> = [];
var mockFloors: Array<MockFloor> = [];
var game: Game;

beforeEach(() => {
    const createElevator = (): MockElevator => {
        return {
            currentFloorValue: 0,
            destinationDirectionValue: "stopped",
            destinationQueue: [],
            handlers: {},
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
            checkDestinationQueue: jest.fn(() => { })
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

    mockElevators = [createElevator(), createElevator()];
    mockFloors = [createFloor(0), createFloor(1), createFloor(2)];

    game = eval(data);
    game.init(mockElevators as Elevator[], mockFloors as Floor[]);
});

test('All elevators get assigned to an index', () => {
    expect(mockElevators[0]._index).toBe(0);
    expect(mockElevators[1]._index).toBe(1);
});

test('All requests on floors are false in the beginning', () => {
    mockFloors.forEach((mockFloor) => {
        expect(mockFloor._upRequestPending).toBe(false);
        expect(mockFloor._downRequestPending).toBe(false);
    });
});

describe("Button requests on floors:", () => {
    var mockFloor: MockFloor;

    beforeEach(() => {
        mockElevators.forEach((mockElevator) => {
            mockElevator.currentFloorValue = 1;
        });
        mockFloor = mockFloors[0];
    });

    describe('If no elevator is stopped on the same floor:', () => {
        test('Up button request is remembered', () => {
            mockFloor.trigger('up_button_pressed');
            expect(mockFloor._upRequestPending).toBe(true);
        });

        test('Down button request is remembered', () => {
            mockFloor.trigger('down_button_pressed');
            expect(mockFloor._downRequestPending).toBe(true);
        });
    })


    describe('If an elevator is stopped on the same floor:', () => {
        beforeEach(() => {
            const mockElevator = mockElevators[0];
            mockElevator.currentFloorValue = 0;
            mockElevator.destinationDirectionValue = 'stopped';
        });

        test('Up button request is remembered', () => {
            mockFloor.trigger('up_button_pressed');
            expect(mockFloor._upRequestPending).toBe(false);
        });

        test('Down button request is remembered', () => {
            mockFloor.trigger('down_button_pressed');
            expect(mockFloor._downRequestPending).toBe(false);
        });
    });
});

describe("Floor button presses:", () => {
    test("If destination queue is empty, go to floor", () => {
        const mockElevator = mockElevators[0];
        mockElevator.trigger("floor_button_pressed", 1);

        expect(mockElevator.destinationQueue?.toString()).toBe([1].toString());
        expect(mockElevator.checkDestinationQueue).toHaveBeenCalled();
    })
});