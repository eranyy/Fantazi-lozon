async function mockSend(title: string, msg: string, id: string) {
    return new Promise(resolve => setTimeout(resolve, 50)); // Mock network/db latency
}

async function runSequential(users: any[]) {
    const start = Date.now();
    for (const u of users) {
        if (u.id === 'admin' || u.id === 'system') continue;
        const lineup = u.lineup || [];
        const startingCount = Array.isArray(lineup) ? lineup.filter((p: any) => p.isStarting).length : 0;

        if (startingCount < 11) {
            await mockSend('T1', 'M1', u.id);
        } else {
            await mockSend('T2', 'M2', u.id);
        }
    }
    return Date.now() - start;
}

async function runConcurrent(users: any[]) {
    const start = Date.now();
    const promises = users.map(async (u) => {
        if (u.id === 'admin' || u.id === 'system') return;
        const lineup = u.lineup || [];
        const startingCount = Array.isArray(lineup) ? lineup.filter((p: any) => p.isStarting).length : 0;

        if (startingCount < 11) {
            await mockSend('T1', 'M1', u.id);
        } else {
            await mockSend('T2', 'M2', u.id);
        }
    });
    await Promise.all(promises);
    return Date.now() - start;
}

async function main() {
    const users = Array.from({ length: 50 }).map((_, i) => ({ id: `u${i}`, lineup: [] }));
    console.log("Benchmarking with 50 users...");
    const seqTime = await runSequential(users);
    console.log(`Sequential time: ${seqTime}ms`);
    const conTime = await runConcurrent(users);
    console.log(`Concurrent time: ${conTime}ms`);
    console.log(`Improvement: ${((seqTime - conTime) / seqTime * 100).toFixed(2)}%`);
}

main().catch(console.error);
