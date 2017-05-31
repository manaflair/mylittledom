export function makeAnimationFunctions() {

    let index = 1;
    let queue = [], tasks = new Map();

    let scheduleTask = task => {

        task.descriptor = task.start.call(window, ... task.args);

    };

    let cancelTask = task => {

        task.stop.call(window, task.descriptor);

    };

    let createTask = (start, stop, ... args) => {

        if (!tasks)
            return index;

        let id = index++;
        let descriptor = null;

        let task = { id, descriptor, start, stop, args };
        tasks.set(task.id, task);

        if (!queue) {
            scheduleTask(task, scheduler);
        } else {
            queue.push(task.id);
        }

        return task.id;

    };

    let dropTask = (stop, id) => {

        if (!tasks)
            return;

        let task = tasks.get(id);

        if (task.stop !== stop)
            return;

        cancelTask(task);

    };

    let requestAnimationFrame = (fn) => {

        return createTask(window.requestAnimationFrame, window.cancelAnimationFrame, fn);

    };

    let cancelAnimationFrame = (id) => {

        return dropTask(window.cancelAnimationFrame, id);

    };

    let setTimeout = (fn, delay) => {

        return createTask(window.setTimeout, window.clearTimeout, fn, delay);

    };

    let clearTimeout = (id) => {

        return dropTask(window.clearTimeout, id);

    };

    let setInterval = (fn, delay) => {

        return createTask(window.setInterval, window.clearInterval, fn, delay);

    };

    let clearInterval = (id) => {

        return dropTask(window.clearInterval, id);

    };

    let start = () => {

        for (let id of queue)
            scheduleTask(tasks.get(id));

        queue = null;

    };

    let stop = () => {

        for (let key of tasks.keys())
            cancelTask(tasks.get(key));

        tasks = null;

    };

    return {

        requestAnimationFrame,
        cancelAnimationFrame,

        setTimeout,
        clearTimeout,

        setInterval,
        clearInterval,

        start,
        stop

    };

}
