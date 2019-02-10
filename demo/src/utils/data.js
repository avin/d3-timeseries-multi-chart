export function generateData(seed) {
    const data = [];
    for (let i = 0; i < 1000; i += 1) {
        data.push([+new Date() + i * 100000, Math.cos(i / 10 + seed) * seed + Math.cos(i / 4 + Math.random())]);
    }
    return data;
}
