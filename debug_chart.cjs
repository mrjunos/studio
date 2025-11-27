
const { format, subDays } = require('date-fns');

// Mock data
const today = new Date();
const allSales = [
    {
        totalAmount: 10000,
        createdAt: {
            toDate: () => subDays(today, 2) // 2 days ago
        }
    },
    {
        totalAmount: 20000,
        createdAt: {
            toDate: () => subDays(today, 40) // 40 days ago (last month)
        }
    },
    {
        totalAmount: 30000,
        createdAt: {
            toDate: () => subDays(today, 100) // 100 days ago (3 months ago)
        }
    }
];

function testLogic(timeRange) {
    console.log(`Testing timeRange: ${timeRange}`);
    let startDate;
    let map = {};

    if (timeRange === '30d') {
        startDate = subDays(today, 30);
        for (let i = 29; i >= 0; i--) {
            map[format(subDays(today, i), 'yyyy-MM-dd')] = 0;
        }
    } else if (timeRange === '6m') {
        startDate = subDays(today, 180);
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            map[format(d, 'yyyy-MM')] = 0;
        }
    } else if (timeRange === '1y') {
        startDate = subDays(today, 365);
        for (let i = 11; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            map[format(d, 'yyyy-MM')] = 0;
        }
    }

    console.log('Initial Map Keys:', Object.keys(map));

    allSales.forEach(sale => {
        const date = sale.createdAt.toDate();
        if (date >= startDate) {
            const key = format(date, timeRange === '30d' ? 'yyyy-MM-dd' : 'yyyy-MM');
            console.log(`Sale date: ${date.toISOString()}, Key: ${key}`);
            if (map[key] !== undefined) {
                map[key] += (sale.totalAmount || 0);
            } else {
                console.log(`Key ${key} not found in map`);
            }
        } else {
            console.log(`Sale date ${date.toISOString()} before startDate ${startDate.toISOString()}`);
        }
    });

    const formattedData = Object.entries(map).map(([date, total]) => ({
        date,
        total
    })).sort((a, b) => a.date.localeCompare(b.date));

    console.log('Result:', formattedData);

    // Test tickFormatter
    formattedData.forEach(item => {
        const str = item.date;
        try {
            let formatted;
            if (timeRange === '30d') {
                formatted = format(new Date(str), 'dd/MM');
            } else {
                const [y, m] = str.split('-');
                // Note: m is string "06". m-1 converts to number 6-1=5.
                formatted = format(new Date(y, m - 1), 'MMM');
            }
            console.log(`Formatted tick for ${str}: ${formatted}`);
        } catch (e) {
            console.error(`Error formatting tick for ${str}:`, e);
        }
    });
}

testLogic('6m');
