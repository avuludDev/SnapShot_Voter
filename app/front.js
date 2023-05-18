const snapshot = require('@snapshot-labs/snapshot.js');
const ethers = require('ethers');
const fs = require('fs');


const logs = document.getElementById('logs-text');
const fileInput = document.getElementById("wallet_file");
const fileName = document.querySelector('label[for="wallet_file"]');
const walletCount = document.getElementById('wallet_count');
const linkProposal = document.getElementById('link-proposal');
const walletTimeMin = document.getElementById('wallet-time-min');
const walletTimeMax = document.getElementById('wallet-time-max');
const choice = document.getElementById('choice');
const chain = document.getElementById('chain');
const follow = document.getElementById('follow');
const start = document.getElementById('start');
let KeyGlobal = [];



const rpc = {
    Ethereum: 'https://rpc.ankr.com/eth',
    BSC: 'https://bsc-dataseed.binance.org',
    Polygon: 'https://rpc-mainnet.matic.quiknode.pro',
    Avalanche: 'https://rpc.ankr.com/avalanche',
    Arbitrum: 'https://arb1.arbitrum.io/rpc',
    Optimism: 'https://mainnet.optimism.io',
    Fantom: 'https://rpc3.fantom.network',
    Moonbeam: 'https://rpc.ankr.com/moonbeam',
};

function parseFile() {
    const filePaths = fileInput.files[0].path;
    fs.readFile(filePaths, (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        let keys = data.toString().split('\r\n');
        let filterKeys = keys.filter(key => key.trim() !== '');
        fileName.innerHTML = fileInput.files[0].name;
        walletCount.innerText = filterKeys.length;
        addLogs(`ИНФО | Кошельки |` +
            ` Загружено ${filterKeys.length} кошельков`)
        KeyGlobal = filterKeys;
    });


}

function addLogs(data) {
    logs.innerHTML += `<li> ${data} </li>`;
    logs.scrollTop = logs.scrollHeight - logs.clientHeight;
}

const timeout = ms => new Promise(res => setTimeout(res, ms));

const generateRandomAmount = (min, max, num) => {
    const amount = Number(Math.random() * (parseFloat(max) - parseFloat(min)) + parseFloat(min));
    return Number(parseFloat(amount).toFixed(num));
}

const runVoting = async () => {
    start.disabled = true;
    addLogs('ИНФО | Начало голосования!');
    const hub = 'https://hub.snapshot.org';
    const client = new snapshot.Client712(hub);
    const ether = new ethers.providers.JsonRpcProvider(rpc[chain.value]);

    const privateKey = KeyGlobal;
    if (privateKey.length == 0) {
        start.disabled = false;
        return addLogs('ОШИБКА | Выберите кошельки');
    }
    const proporsal = linkProposal.value.split('/');

    for (let i = 0; i < privateKey.length; i++) {
        const pauseTime = generateRandomAmount(walletTimeMin.value * 1000, walletTimeMax.value * 1000, 0);
        const ethWallet = new ethers.Wallet(privateKey[i], ether);
        const address = await ethWallet.getAddress();
        addLogs(`ИНФО | Кошелек ${i + 1}: ${address}`);

        let isReady;
        let n = 0;
        while (!isReady) {
            try {
                console.log(Number(choice.value));
                await client.vote(ethWallet, address, {
                    space: proporsal[4],
                    proposal: proporsal[6],
                    type: 'single-choice',
                    choice: isNaN(Number(choice.value)) ? generateRandomAmount(1, 2, 0) : Number(choice.value),
                }).then(res => { addLogs(`ИНФО | Голосование ID ${i + 1}: ${res.id}`) })
               
                isReady = true;
            } catch (error) {
                console.error(error);
                n = n + 1;
                addLogs(`ОШИБКА | Ошибка голосования: ${JSON.stringify(error)}`);
                if (n == 2) {
                    n = 0;
                    addLogs('ИНФО | Пропускаем кошелек');
                    break;
                }
                addLogs(`ИНФО | Пробуем ещё раз через ${(pauseTime/1000).toFixed(0)} сек.`);
                await timeout(pauseTime);
            }
        }

        if (follow.checked) {
            await client.follow(ethWallet, address, { space: proporsal[4] })
                .then(res => { addLogs(`ИНФО | Следуем ID ${i + 1}: ${res.id}`) })
                .catch(err => { addLogs(`ОШИБКА | Ошибка следования  : ${JSON.stringify(err)}`) });
        }
        addLogs(`ИНФО | Пауза между кошельками ${(pauseTime/1000).toFixed(0)} сек.`);
        await timeout(pauseTime);
    }
    start.disabled = false;
    return addLogs('ИНФО | Окончание всех процессов');
}

fileInput.addEventListener("change", parseFile);
start.addEventListener('click', runVoting);
