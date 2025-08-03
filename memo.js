// import { createServer } from 'node:http';
// import { argv } from 'node:process';
// import yargs from 'yargs';
// import { hideBin } from 'yargs/helpers';
// import writeFile from './writeFile.js';
// import axios from 'axios';

// const hostname = "127.0.0.1";
// const port = 3000;

// const command = argv[2];
// console.log(argv);
// if (command === "add") {
//   const argvTemp = yargs(hideBin(process.argv)).parse();
//   //   console.log(yargs(hideBin(argv)).parse());
//   await writeFile(argvTemp.content)
// }

// truyền tham số --ships= và --distance= từ dòng lệnh
// const argvTemp = yargs(hideBin(process.argv)).parse();

// if (argvTemp.ships > 3 && argvTemp.distance < 53.5) {
//   console.log("Plunder more riffiwobbles!");
// } else {
//   console.log("Retreat from the xupptumblers!");
// }
// print process.argv
// argv.forEach((val, index) => {
//   console.log(`${index}: ${val}`);
// });

// axios.get('https://jsonplaceholder.typicode.com/users')
//   .then(response => {
//     console.log(response.data);
//     response.data.forEach(user => {
//       console.log(`User ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
//     });
//   })
//   .catch(error => {
//     console.error('This content does not exist. Please check again!');
//   });
