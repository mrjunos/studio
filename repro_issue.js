import { format, subDays } from 'date-fns';

// Mock data from Firestore (based on query results)
const allSales = [
    {
        totalAmount: 20000,
        saleDate: new Date('2025-06-01T05:00:00Z')
    },
    {
        totalAmount: 259000,
        saleDate: new Date('2025-05-31T05:00:00Z')
    },
    {
        totalAmount: 580000,
        saleDate: new Date('2025-05-31T05:00:00Z')
    },
    {
        totalAmount: 40000,
        saleDate: new Date('2025-05-21T05:00:00Z')
    },
    {
        totalAmount: 296000,
        saleDate: new Date('2025-04-30T05:00:00Z')
    }
];

const timeRange = '1y';
const today = new Date(); // This will be Nov 26, 2025

console.log(`Today: ${today.toISOString()}`);

let startDate;
let dateFormat;
let dataMap = {};

if (timeRange === '1y') {
    startDate = subDays(today, 365);
    dateFormat = 'yyyy-MM';

    // Initialize map
    for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = format(d, 'yyyy-MM');
        dataMap[key] = 0;
        console.log(`Initialized key: ${key}`);
    }
}

console.log(`StartDate: ${startDate.toISOString()}`);

allSales.forEach(sale => {
    const saleDate = sale.saleDate;

    if (saleDate && !isNaN(saleDate.getTime())) {
        if (saleDate >= startDate) {
            const key = format(saleDate, dateFormat);
            console.log(`Processing sale: ${saleDate.toISOString()} -> Key: ${key}`);

            if (dataMap[key] !== undefined) {
                dataMap[key] += (sale.totalAmount || 0);
                console.log(`  Added ${sale.totalAmount} to ${key}. New total: ${dataMap[key]}`);
            } else {
                console.log(`  Key ${key} not found in map!`);
            }
        } else {
            console.log(`Skipped sale: ${saleDate.toISOString()} (before startDate)`);
        }
    }
});

const formattedData = Object.entries(dataMap).map(([date, total]) => ({
    date,
    total
})).sort((a, b) => a.date.localeCompare(b.date));

console.log('Final Chart Data:', formattedData);
