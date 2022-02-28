export let progressItems = [
    {quote: 'Justin Beiber at your daughters 16th birthday party',
    cost: 300000, author: '....@DefiGod'},
    {quote: 'Nicky Minaj at your sons barmitzvah',
    cost: 200000, author: '....DefiGod'},
    {quote: 'A house next door to Ellen',
    cost: 5000000, author: '....DefiGod'},
    {quote: 'Join the 100km high club',
    cost: 1000000, author: '....@ElonMusk'},
    {quote: 'Nicky Minaj at your sons barmitzvah',
    cost: 200000, author: '....DefiGod'},
    {quote: 'A house next door to Ellen',
    cost: 5000000, author: '....DefiGod'}


];

export function getRandomItem() {
    let rand = Math.floor(Math.random(0, progressItems.length - 1));
    return progressItems[rand];
}

