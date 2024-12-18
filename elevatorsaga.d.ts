// API documentation from: https://play.elevatorsaga.com/documentation.html#docs
// Helpful reference for more complex definitions: https://gist.github.com/steinuil/21b49b96eaaac4b792a0c69a7d82a4f9

interface ElevatorEvents {
    /**
     * Triggered when the elevator has completed all its tasks and is not doing anything.
     */
    idle: () => void;
    /**
     * Triggered when a passenger has pressed a button inside the elevator.
     */
    floor_button_pressed: (floorNumber: number) => void;
    /**
     * Triggered slightly before the elevator will pass a floor. 
     * A good time to decide whether to stop at that floor. 
     * Note that this event is not triggered for the destination floor. 
     */
    passing_floor: (floorNumber: number, direction: "up" | "down") => void;
    /**
     * Triggered when the elevator has arrived at a floor.
     */
    stopped_at_floor: (floorNumber: number) => void;
}

interface Elevator {
    /** 
     * Queue the elevator to go to specified floor number. 
     * If you specify true as second argument, the elevator will go to that floor directly, and then go to any other queued floors.
     */
    goToFloor: (targetFloor: number, goDirectly?: boolean) => void;
    /**
     * Clear the destination queue and stop the elevator if it is moving. 
     * Note that you normally don't need to stop elevators - it is intended for advanced solutions with in-transit rescheduling logic. 
     * Also, note that the elevator will probably not stop at a floor, so passengers will not get out.
     */
    stop: () => void;
    /**
     * Gets the floor number that the elevator currently is on.
     * Note that this is a rounded number and does not necessarily mean the elevator is in a stopped state.
     */
    currentFloor: () => number;
    /**
     * Gets or sets the going up indicator, which will affect passenger behaviour when stopping at floors.
     */
    goingUpIndicator: (newIndicatorState: boolean?) => boolean;
    /**
     * Gets or sets the going down indicator, which will affect passenger behaviour when stopping at floors.
     */
    goingDownIndicator: (newIndicatorState: boolean?) => boolean;
    /**
     * Gets the maximum number of passengers that can occupy the elevator at the same time.
     */
    maxPassengerCount: () => number;
    /**
     * Gets the load factor of the elevator. 0 means empty, 1 means full. 
     * Varies with passenger weights, which vary - not an exact measure.
     */
    loadFactor: () => number;
    /**
     * Gets the direction the elevator is currently going to move toward. 
     */
    destinationDirection: () => "up" | "down" | "stopped";
    /**
     * The current destination queue, meaning the floor numbers the elevator is scheduled to go to. 
     * Can be modified and emptied if desired. 
     * Note that you need to call checkDestinationQueue() for the change to take effect immediately.
     */
    destinationQueue: number[];
    /**
     * Checks the destination queue for any new destinations to go to. 
     * Note that you only need to call this if you modify the destination queue explicitly.
     */
    checkDestinationQueue: () => void;
    /**
     * Gets the currently pressed floor numbers as an array.
     */
    getPressedFloors: () => number[];
    on<Event extends keyof ElevatorEvents>(type: Event, handler: ElevatorEvents[Event]): void;
}

interface FloorEvents {
    up_button_pressed: () => void;
    down_button_pressed: () => void;
}

interface Floor {
    /**
     * Gets the floor number of the floor object.
     */
    floorNum: () => number;
    on<Event extends keyof FloorEvents>(type: Event, handler: FloorEvents[Event]): void;

}

interface Game {
    init: (elevators: Elevator[], floors: Floor[]) => void;
    update: (dt: number, elevators: Elevator[], floors: Floor[]) => void;
}