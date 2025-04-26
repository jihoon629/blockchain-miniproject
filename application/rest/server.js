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

app.use(express.static(path.join(__dirname, '../client')));
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
