// import { Desolver } from 'desolver';
import { Desolver } from '../lib'
// const Desolver = require('desolver')

let result = false

const testIt = () => {
  if (Desolver.apply) {
    result = true
  }

  return console.log(result)
}

testIt()

