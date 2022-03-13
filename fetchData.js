class FetchData{

    constructor(coin, currency) {
        this.coin = coin;
        this.currency = currency;
    }

    // fetch from coin gecko
    async getCoinData() {
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${this.coin}&order=market_cap_desc&per_page=100&page=1&sparkline=false&no-cors`);
        
        const responseData = await response.json();

        return responseData;
    }
}


