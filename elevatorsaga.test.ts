interface MockElevator extends Partial<Elevator> {
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

beforeEach(() => {
    const createElevator = (): MockElevator => {
        return {
            handlers: {},
            on(type, handler) {
                this.handlers[type] = handler;
            },
            trigger(type, ...args) {
                if (this.handlers[type]) {
                    (this.handlers[type] as any)(...args);
                }
            }
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
    mockFloors = [createFloor(0), createFloor(1)];
})

test('All elevators get assigned to an index', () => {
    const game = eval(data);
    game.init(mockElevators, mockFloors);

    expect(mockElevators[0]._index).toBe(0);
    expect(mockElevators[1]._index).toBe(1);
});