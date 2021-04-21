import { readFileSync } from "fs";

const numbersFile = readFileSync("numbers").toString();
const numbers = numbersFile.split(",");
let sum = 0;
let count = 0;
for (let i = 0; i < numbers.length; i++) {
  const num = numbers[i];
  sum += parseFloat(num);
  count++;
}
const avg = sum / count;
sum = 0;
count = 0;
for (let i = 0; i < numbers.length; i++) {
  const num = numbers[i];
  sum += Math.pow(parseFloat(num) - avg, 2);
  count++;
}
console.log(`Average is ${avg}`);
console.log(`sigma is ${Math.sqrt(sum / count)}`);

console.log(numbers);
