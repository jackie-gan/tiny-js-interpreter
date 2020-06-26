const acorn = require('acorn');
import { evaluate } from './evaluate'; 

export function execute(code: string) {
  return evaluate(acorn.parse(code, {
    sourceType: 'script'
  }), {});
}