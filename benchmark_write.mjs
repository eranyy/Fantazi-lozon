import { performance } from 'perf_hooks';

// Simulate addDoc which takes 50ms per network request
const addDoc = async () => {
    return new Promise(resolve => setTimeout(resolve, 50));
};

async function sequential(num) {
    for (let i = 0; i < num; i++) {
        await addDoc();
    }
}

async function concurrent(num) {
    const promises = [];
    for (let i = 0; i < num; i++) {
        promises.push(addDoc());
    }
    await Promise.all(promises);
}

async function run() {
    const items = 10;

    let start = performance.now();
    await sequential(items);
    const seqTime = performance.now() - start;

    start = performance.now();
    await concurrent(items);
    const conTime = performance.now() - start;

    console.log(`Sequential (${items} items): ${seqTime.toFixed(2)}ms`);
    console.log(`Concurrent (${items} items): ${conTime.toFixed(2)}ms`);
    console.log(`Improvement: ${((seqTime - conTime) / seqTime * 100).toFixed(2)}%`);
}

run();
