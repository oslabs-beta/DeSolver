import { Desolver } from 'desolver';

// const Desolver = require('desolver')

let result = false

const testIt = () => {
  if (Desolver.apply) {
    result = true
  }

  return result
}

testIt()

