export function makeAnimationFunctions() {

    let index = 1;
    let queue = [], tasks = new Map();

    let scheduleTask = task => {

        if (!task)
            return;

        task.descriptor = window.requestAnimationFrame((... args) => {

            tasks.delete(task.id);

            return task.fn.apply(null, args);

        });

    };

    let cancelTask = task => {

        if (!task)
            return;

        if (task.descriptor !== null)
            window.cancelAnimationFrame(task.descriptor);

        tasks.delete(task.id);

    };

    let requestAnimationFrame = fn => {

        if (!tasks)
            return index;

        let task = { id: index++, fn, descriptor: null };
        tasks.set(task.id, task);

        if (!queue) {
            scheduleTask(task);
        } else {
            queue.push(task.id);
        }

        return task.id;

    };

    let cancelAnimationFrame = id => {

        if (!tasks)
            return;

        let task = tasks.get(id);
        cancelTask(task);

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

    return { requestAnimationFrame, cancelAnimationFrame, start, stop };

}
