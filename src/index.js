const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const customers = [];

const VerifyIfExistAccountCPF = (request, response, next) => {
  const { cpf } = request.headers;

  const customer = customers.find(customer => customer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: 'Customer not found!' });
  }

  request.customer = customer;
  return next();
};

const getBalance = statement => {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
};

app.get('/', (request, response) => {
  return response.json({ message: 'Hello world!' });
});

app.post('/account', (request, response) => {
  const { cpf, name } = request.body;

  const costumerAlreadyExists = customers.some(customer => customer.cpf === cpf);

  if (costumerAlreadyExists) {
    return response.status(400).json({ error: 'Customer already exists!' });
  }

  customers.push({ cpf, name, id: uuidv4(), statement: [] });

  return response.status(201).json({ message: 'Success!' }).send();
});

app.get('/statement', VerifyIfExistAccountCPF, (request, response) => {
  return response.status(200).json({ statement: request.customer.statement });
});

app.post('/deposit', VerifyIfExistAccountCPF, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit',
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.post('/withdraw', VerifyIfExistAccountCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;
  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: 'Insufficient funds!' });
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit',
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.get('/statement/date', VerifyIfExistAccountCPF, (request, response) => {
  const { date } = request.query;
  const { customer } = request;

  const dateFormatted = new Date(date + ' 00:00');

  const statement = customer.statement.filter(
    ({ created_at }) => created_at.toDateString() === dateFormatted.toDateString(),
  );

  return response.status(200).json({ statement: statement });
});

app.put('/account', VerifyIfExistAccountCPF, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(200).json({ message: 'Username update with success!' }).send();
});

app.get('/account/', VerifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;

  return response.status(200).json({ account: customer });
});

app.delete('/account', VerifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(200).json({ customers: customers });
});

app.get('/balance', VerifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.status(200).json({ balance: balance }).send();
});

app.listen(3333, () => {});
