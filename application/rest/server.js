const express = require('express');
const app = express();
let path = require('path');
let sdk = require('./sdk');

const PORT = 8001;
const HOST = '0.0.0.0';
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.get('/init', function (req, res) {
   let a = req.query.a;
   let aval = req.query.aval;
   let args = [a, aval];

   sdk.send(false, 'Init', args, res);
});

app.get('/query', function (req, res) {
   let name = req.query.name;
   let args = [name];
   sdk.send(true, 'Query', args, res);
});

app.get('/queryAll', function (req, res) {
   sdk.send(false, 'GetAllQuery', [], res);
});


app.get('/invoke', function (req, res) {
   const { A, B, X } = req.query;
   if (!A || !B || X === undefined) {
      return res.status(400).send({ error: 'Missing parameters A, B, or X in query string' });
   }
   let args = [A, B, String(X)];
   sdk.send(false, 'Invoke', args, res);
});


app.get('/delete', function (req, res) {
   let name = req.query.name;
   let args = [name];
   sdk.send(false, 'Delete', args, res);
});


// --- 새로운 라우트: 돈 충전 ---
app.get('/deposit', function (req, res) {
   const { id, amount } = req.query; // 쿼리 파라미터에서 id와 amount 추출

   // 필수 파라미터 검증
   if (!id || amount === undefined || amount === null || amount === '') {
       return res.status(400).send({ error: 'Missing or invalid parameters: id and amount are required.' });
   }

   // 체인코드 함수 'DepositMoney'는 id(string)와 amount(string)을 인자로 받음
   let args = [String(id), String(amount)];
   console.log(`Received /deposit request: id=${id}, amount=${amount}, args=${JSON.stringify(args)}`);

   // DepositMoney는 원장 상태를 변경하므로 isQuery=false
   sdk.send(false, 'DepositMoney', args, res);
});

app.get('/withdraw', function (req, res) {
   const { id, amount } = req.query; // 쿼리 파라미터에서 id와 amount 추출

   // 필수 파라미터 검증
   if (!id || amount === undefined || amount === null || amount === '') {
       return res.status(400).send({ error: 'Missing or invalid parameters: id and amount are required.' });
   }

   // 체인코드 함수 'WithdrawMoney'는 id(string)와 amount(string)을 인자로 받음
   let args = [String(id), String(amount)];
   console.log(`Received /withdraw request: id=${id}, amount=${amount}, args=${JSON.stringify(args)}`);

   // WithdrawMoney는 원장 상태를 변경하므로 isQuery=false
   sdk.send(false, 'WithdrawMoney', args, res);
});

// 여기서 부터 상품

app.get('/items', function (req, res) {
    const { id, name, price, seller } = req.query;

    // 필수 파라미터 검증
    if (!id || !name || price === undefined || !seller) {
        return res.status(400).send({ error: 'Missing parameters: id, name, price, and seller are required.' });
    }

    // 체인코드 함수 'CreateItem'는 id(string), name(string), price(int), seller(string)을 인자로 받음
    // sdk.send는 문자열 배열을 기대하므로 price를 문자열로 변환
    let args = [String(id), String(name), String(price), String(seller)];
    console.log(`Received /items (CreateItem) request: id=${id}, name=${name}, price=${price}, seller=${seller}, args=${JSON.stringify(args)}`);

    // CreateItem은 원장 상태를 변경하므로 isQuery=false
    sdk.send(false, 'CreateItem', args, res);
});


app.get('/items/all', function (req, res) {
    console.log("Received /items/all (QueryAllItems) request.");
    // QueryAllItems는 인자를 받지 않으며, 쿼리이므로 isQuery=true
    sdk.send(true, 'QueryAllItems', [], res);
});


app.get('/escrows/:escrowID/buyer-confirm', function (req, res) {
    const escrowID = req.params.escrowID;
    const { amount } = req.query;

    // 필수 파라미터 검증
    if (!escrowID || amount === undefined || amount === null || amount === '') {
        return res.status(400).send({ error: 'Missing parameters: escrowID (in path) and amount (in query) are required.' });
    }

    // BuyerConfirm 함수는 escrowID(string), amount(float64 -> string) 인자를 받음
    let args = [String(escrowID), String(amount)];
    console.log(`Received /buyer-confirm request: escrowID=${escrowID}, amount=${amount}, args=${JSON.stringify(args)}`);

    // BuyerConfirm은 원장 상태를 변경하므로 isQuery=false
    sdk.send(false, 'BuyerConfirm', args, res);
});

// ✅ 판매자 거래 확인 (SellerConfirm)
// PUT /escrows/:escrowID/seller-confirm?amount=... 도 고려 가능
app.get('/escrows/:escrowID/seller-confirm', function (req, res) {
    const escrowID = req.params.escrowID;
    const { amount } = req.query;

    // 필수 파라미터 검증
    if (!escrowID || amount === undefined || amount === null || amount === '') {
        return res.status(400).send({ error: 'Missing parameters: escrowID (in path) and amount (in query) are required.' });
    }

    // SellerConfirm 함수는 escrowID(string), amount(float64 -> string) 인자를 받음
    let args = [String(escrowID), String(amount)];
    console.log(`Received /seller-confirm request: escrowID=${escrowID}, amount=${amount}, args=${JSON.stringify(args)}`);

    // SellerConfirm은 원장 상태를 변경하므로 isQuery=false
    sdk.send(false, 'SellerConfirm', args, res);
});

// ✅ 거래 최종 완료 (Finalize)
// POST /escrows/:escrowID/finalize 도 고려 가능
app.get('/escrows/:escrowID/finalize', function (req, res) {
    const escrowID = req.params.escrowID;

    // 필수 파라미터 검증
    if (!escrowID) {
        return res.status(400).send({ error: 'Missing parameter: escrowID (in path) is required.' });
    }

    // Finalize 함수는 escrowID(string) 인자를 받음
    let args = [String(escrowID)];
    console.log(`Received /finalize request: escrowID=${escrowID}, args=${JSON.stringify(args)}`);

    // Finalize는 원장 상태를 변경하므로 isQuery=false
    sdk.send(false, 'Finalize', args, res);
});

// ✅ 에스크로 상태 조회 (QueryEscrow)
app.get('/escrows/:escrowID', function (req, res) {
    const escrowID = req.params.escrowID;

    // 필수 파라미터 검증
    if (!escrowID) {
        return res.status(400).send({ error: 'Missing parameter: escrowID (in path) is required.' });
    }

    // QueryEscrow 함수는 escrowID(string) 인자를 받음
    let args = [String(escrowID)];
    console.log(`Received /escrows/:escrowID (QueryEscrow) request: escrowID=${escrowID}, args=${JSON.stringify(args)}`);

    // QueryEscrow는 쿼리이므로 isQuery=true
    sdk.send(true, 'QueryEscrow', args, res);
});


app.use(express.static(path.join(__dirname, '../client')));
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
