import axios from 'axios';

const FINNHUB_KEY = 'd61qfo1r01qgcobqhjpgd61qfo1r01qgcobqhjq0';

async function testBinance() {
    try {
        const url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=5`;
        console.log('Testing Binance API...');
        const response = await axios.get(url);
        console.log('✅ Binance Success:', response.data.length, 'candles');
        // console.log('Sample:', response.data[0]);
    } catch (error) {
        console.error('❌ Binance Failed:', error.message);
        if (error.response) console.error('Status:', error.response.status);
    }
}

async function testFinnhub() {
    try {
        const symbol = 'AAPL';
        const to = Math.floor(Date.now() / 1000);
        const from = to - (5 * 86400);
        const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${FINNHUB_KEY}`;

        console.log('\nTesting Finnhub API...');
        const response = await axios.get(url);
        if (response.data.s === 'ok') {
            console.log('✅ Finnhub Success:', response.data.c.length, 'candles');
        } else {
            console.log('❌ Finnhub Failed:', response.data);
        }
    } catch (error) {
        console.error('❌ Finnhub Failed:', error.message);
    }
}

function testMockLogic() {
    console.log('\nTesting Mock Logic...');
    const marketData = {
        crypto: [{ symbol: 'BTC', price: 69000 }]
    };
    const allAssets = [...marketData.crypto];
    const symbol = 'BTC';
    const asset = allAssets.find(a => a.symbol.toUpperCase() === symbol.toUpperCase());

    if (asset) {
        console.log('✅ Found Asset:', asset.symbol, 'Price:', asset.price);
    } else {
        console.log('❌ Asset Not Found');
    }
}

(async () => {
    await testBinance();
    await testFinnhub();
    testMockLogic();
})();
