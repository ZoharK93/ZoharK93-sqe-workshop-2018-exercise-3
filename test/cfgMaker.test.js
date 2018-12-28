import assert from 'assert';
import * as esgraph from 'esgraph';
import {parseCode} from '../src/js/code-analyzer';
import {getParamValues} from '../src/js/flowSelector';
import {buildCFGNodes, makeCFG} from '../src/js/cfgMaker';

describe('The cfg maker', () => {
    it('is making an empty cfg correctly', () => {
        let cfg = makeGraphString('function f(){return 0;}','');
        assert.deepEqual(cfg[0],{n0: {name: 'n0', index: 0, text: 'return 0', flowstate: 'approved', type: 'operation'}}); assert.deepEqual(cfg[1],[]);
    });

    it('is making an simple cfg correctly', () => {
        let cfg = makeGraphString('function f(x){return x;}','1');
        assert.deepEqual(cfg[0],{n0: {name: 'n0', index: 0, text: 'return x', flowstate: 'approved', type: 'operation'}});
        assert.deepEqual(cfg[1],[]);
    });

    it('is making an cfg with assignments and arrays correctly', () => {
        let cfg = makeGraphString('function f(x){let a = x[2] + 1;\n return a + x[0];}','[1,2,3]');
        assert.deepEqual(cfg[0],{n0: {name: 'n0', index: 0, text: 'a = x[2] + 1', flowstate: 'approved', type: 'operation'},
            n1: {name: 'n1', index: 1, text: 'return a + x[0]', flowstate: 'approved', type: 'operation'}});
        assert.deepEqual(cfg[1],[{from: 'n0', to: 'n1', cond: ''}]);
    });
});

describe('The cfg maker', () => {
    it('is making a cfg with one branch correctly', () => {
        let cfg = makeGraphString('function foo(x, y){\nlet a = 5;\nif (a < x){y++;}\nreturn y;\n}','1, 2');
        assert.deepEqual(cfg[0],{n0: {name: 'n0', index: 0, text: 'a = 5', flowstate: 'approved', type: 'operation'},
            n1: {name: 'n1', index: 1, text: 'a < x', flowstate: 'approved', type: 'condition'},
            n2: {name: 'n2', index: 2, text: 'y++', flowstate: undefined, type: 'operation'},
            n3: {name: 'n3', index: 3, text: 'return y', flowstate: 'approved', type: 'operation'},
            m0: {name: 'm0', text: ' \\\\', flowstate: 'request', type: 'start'}});
        assert.deepEqual(cfg[1],[{from: 'n0', to: 'n1', cond: ''},{from: 'n1', to: 'n2', cond: 'yes'},
            {from: 'n1', to: 'm0', cond: 'no'},{from: 'n2', to: 'm0', cond: ''},{from: 'm0', to: 'n3', cond: ''}]); });
    it('is making a cfg with while and several declarations correctly', () => {
        let cfg = makeGraphString('function foo(x, y){\nlet a = -x;\nlet b = [1, 2, 3];\nwhile (a < b[0]) {y = y + 2;\na++;}\nreturn y;\n}','1, 2');
        assert.deepEqual(cfg[0],{n0: {name: 'n0', index: 0, text: 'a = -x\nb = [1, 2, 3]', flowstate: 'approved', type: 'operation'},
            n1: {name: 'n1', index: 1, text: 'a < b[0]', flowstate: 'approved', type: 'condition'},
            n2: {name: 'n2', index: 2, text: 'y = y + 2\na++', flowstate: 'approved', type: 'operation'},
            n3: {name: 'n3', index: 3, text: 'return y', flowstate: 'approved', type: 'operation'},
            m0: {name: 'm0', text: ' \\\\', flowstate: 'request', type: 'start'}});
        assert.deepEqual(cfg[1],[{from: 'n0', to: 'm0', cond: ''},{from: 'n1', to: 'n2', cond: 'yes'},
            {from: 'n1', to: 'n3', cond: 'no'},{from: 'n2', to: 'm0', cond: ''},{from: 'm0', to: 'n1', cond: ''}]);});
});

describe('The cfg maker', () => {
    it('is making a cfg with if-else-if-else correctly', () => {
        let cfg = makeGraphString('function foo(x, y, z){\nlet a = x + 1;\nlet b = a + y;\nlet c = 0;\n' +
            'if (b < --z[0]) {c = c + 5;\n} else if (b < z[1] * 2) {c = c + x + 5;\n} else {c = c + z[2] + 5;}\nreturn y;\n}','1, 2, [1, 2, 3]');
        assert.deepEqual(cfg[0],{n0: {name: 'n0', index: 0, text: 'a = x + 1\nb = a + y\nc = 0', flowstate: 'approved', type: 'operation'},
            n1: {name: 'n1', index: 1, text: 'b < --z[0]', flowstate: 'approved', type: 'condition'},
            n2: {name: 'n2', index: 2, text: 'c = c + 5', flowstate: undefined, type: 'operation'},
            n3: {name: 'n3', index: 3, text: 'return y', flowstate: 'approved', type: 'operation'},
            n4: {name: 'n4', index: 4, text: 'b < z[1] * 2', flowstate: 'approved', type: 'condition'},
            n5: {name: 'n5', index: 5, text: 'c = c + x + 5', flowstate: undefined, type: 'operation'},
            n6: {name: 'n6', index: 6, text: 'c = c + z[2] + 5', flowstate: 'approved', type: 'operation'},
            m0: {name: 'm0', text: ' \\\\', flowstate: 'request', type: 'start'}});
        assert.deepEqual(cfg[1],[{from: 'n0', to: 'n1', cond: ''},{from: 'n1', to: 'n2', cond: 'yes'},{from: 'n1', to: 'n4', cond: 'no'},
            {from: 'n2', to: 'm0', cond: ''},{from: 'n4', to: 'n5', cond: 'yes'},{from: 'n4', to: 'n6', cond: 'no'},
            {from: 'n5', to: 'm0', cond: ''},{from: 'n6', to: 'm0', cond: ''},{from: 'm0', to: 'n3', cond: ''}]); });
});

describe('The cfg maker', () => {
    it('is making a cfg with nested if correctly', () => {
        let cfg = makeGraphString('function foo(x, y, z){\nlet a = x + 1;\nlet b = a + y;\nlet c = [1, 2];\n' +
            'if (b < z) {c[0] = c[1] + 5;\nif(c[0] < x){y++;} else {c[1] = 3;}\nc[1] = c[1] * x;}\nreturn y;\n}','1, 2, 3');
        assert.deepEqual(cfg[0],{n0: {name: 'n0', index: 0, text: 'a = x + 1\nb = a + y\nc = [1, 2]', flowstate: 'approved', type: 'operation'},
            n1: {name: 'n1', index: 1, text: 'b < z', flowstate: 'approved', type: 'condition'},
            n2: {name: 'n2', index: 2, text: 'c[0] = c[1] + 5', flowstate: undefined, type: 'operation'},
            n3: {name: 'n3', index: 3, text: 'c[0] < x', flowstate: undefined, type: 'condition'},
            n4: {name: 'n4', index: 4, text: 'y++', flowstate: undefined, type: 'operation'},
            n5: {name: 'n5', index: 5, text: 'c[1] = c[1] * x', flowstate: undefined, type: 'operation'},
            n6: {name: 'n6', index: 6, text: 'c[1] = 3', flowstate: undefined, type: 'operation'},
            n7: {name: 'n7', index: 7, text: 'return y', flowstate: 'approved', type: 'operation'},
            m0: {name: 'm0', text: ' \\\\', flowstate: 'invalid', type: 'start'},
            m1: {name: 'm1', text: ' \\\\', flowstate: 'request', type: 'start'}});
        assert.deepEqual(cfg[1],[{from: 'n0', to: 'n1', cond: ''},{from: 'n1', to: 'n2', cond: 'yes'},{from: 'n1', to: 'm1', cond: 'no'},
            {from: 'n2', to: 'n3', cond: ''},{from: 'n3', to: 'n4', cond: 'yes'},{from: 'n3', to: 'n6', cond: 'no'},
            {from: 'n4', to: 'm0', cond: ''},{from: 'n5', to: 'm1', cond: ''},{from: 'n6', to: 'm0', cond: ''},
            {from: 'm0', to: 'n5', cond: ''},{from: 'm1', to: 'n7', cond: ''}]); });
});

describe('The cfg maker', () => {
    it('is making a cfg with nested executed if correctly', () => {
        let cfg = makeGraphString('function foo(x, y, z){\nlet a = x + 1;\nlet b = a + y;\nlet c = [1, 2];\n' +
            'if (b > z) {c[0] = c[1] + 5;\nif(c[0] < x){y++;} else {c[1] = 3;}\nc[1] = c[1] * x;}\nreturn y;\n}','1, 2, 3');
        assert.deepEqual(cfg[0],{n0: {name: 'n0', index: 0, text: 'a = x + 1\nb = a + y\nc = [1, 2]', flowstate: 'approved', type: 'operation'},
            n1: {name: 'n1', index: 1, text: 'b > z', flowstate: 'approved', type: 'condition'},
            n2: {name: 'n2', index: 2, text: 'c[0] = c[1] + 5', flowstate: 'approved', type: 'operation'},
            n3: {name: 'n3', index: 3, text: 'c[0] < x', flowstate: 'approved', type: 'condition'},
            n4: {name: 'n4', index: 4, text: 'y++', flowstate: undefined, type: 'operation'},
            n5: {name: 'n5', index: 5, text: 'c[1] = c[1] * x', flowstate: 'approved', type: 'operation'},
            n6: {name: 'n6', index: 6, text: 'c[1] = 3', flowstate: 'approved', type: 'operation'},
            n7: {name: 'n7', index: 7, text: 'return y', flowstate: 'approved', type: 'operation'},
            m0: {name: 'm0', text: ' \\\\', flowstate: 'request', type: 'start'},
            m1: {name: 'm1', text: ' \\\\', flowstate: 'request', type: 'start'}});
        assert.deepEqual(cfg[1],[{from: 'n0', to: 'n1', cond: ''},{from: 'n1', to: 'n2', cond: 'yes'},{from: 'n1', to: 'm1', cond: 'no'},
            {from: 'n2', to: 'n3', cond: ''},{from: 'n3', to: 'n4', cond: 'yes'},{from: 'n3', to: 'n6', cond: 'no'},
            {from: 'n4', to: 'm0', cond: ''},{from: 'n5', to: 'm1', cond: ''},{from: 'n6', to: 'm0', cond: ''},
            {from: 'm0', to: 'n5', cond: ''},{from: 'm1', to: 'n7', cond: ''}]); });
});

describe('The cfg maker', () => {
    it('is making a cfg with several lines in if correctly', () => {
        let cfg = makeGraphString('function foo(x, y, z){\nlet a = x + 1;let b = a + y;let c = 0;\n' +
            'if (b > z) {c = c + 5;y = c - x;a = a * b / 3;}\nreturn y;\n}','1, 2, 3');
        assert.deepEqual(cfg[0],{n0: {name: 'n0', index: 0, text: 'a = x + 1\nb = a + y\nc = 0', flowstate: 'approved', type: 'operation'},
            n1: {name: 'n1', index: 1, text: 'b > z', flowstate: 'approved', type: 'condition'},
            n2: {name: 'n2', index: 2, text: 'c = c + 5\ny = c - x\na = a * b / 3', flowstate: 'approved', type: 'operation'},
            n3: {name: 'n3', index: 3, text: 'return y', flowstate: 'approved', type: 'operation'},
            m0: {name: 'm0', text: ' \\\\', flowstate: 'request', type: 'start'}});
        assert.deepEqual(cfg[1],[{from: 'n0', to: 'n1', cond: ''},{from: 'n1', to: 'n2', cond: 'yes'},{from: 'n1', to: 'm0', cond: 'no'},
            {from: 'n2', to: 'm0', cond: ''},{from: 'm0', to: 'n3', cond: ''}]); });
});

describe('The cfg maker', () => {
    it('is making a cfg with several lines in else correctly', () => {
        let cfg = makeGraphString('function foo(x, y, z){\nlet a = x + 1;let b = a + y;let c = 0;\nif (b < z) {c = c + 5;}\n' +
            'else {c = c + 2;y = c - x;a = a * b / 3;}\nreturn y;\n}','1, 2, 3');
        assert.deepEqual(cfg[0],{n0: {name: 'n0', index: 0, text: 'a = x + 1\nb = a + y\nc = 0', flowstate: 'approved', type: 'operation'},
            n1: {name: 'n1', index: 1, text: 'b < z', flowstate: 'approved', type: 'condition'},
            n2: {name: 'n2', index: 2, text: 'c = c + 5', flowstate: undefined, type: 'operation'},
            n3: {name: 'n3', index: 3, text: 'return y', flowstate: 'approved', type: 'operation'},
            n4: {name: 'n4', index: 4, text: 'c = c + 2\ny = c - x\na = a * b / 3', flowstate: 'approved', type: 'operation'},
            m0: {name: 'm0', text: ' \\\\', flowstate: 'request', type: 'start'}});
        assert.deepEqual(cfg[1],[{from: 'n0', to: 'n1', cond: ''},{from: 'n1', to: 'n2', cond: 'yes'},{from: 'n1', to: 'n4', cond: 'no'},
            {from: 'n2', to: 'm0', cond: ''},{from: 'n4', to: 'm0', cond: ''},{from: 'm0', to: 'n3', cond: ''}]); });
});

function getGraph(func){
    return esgraph(func.body[0].body);
}

function getParams(func,vals){
    let paramVals = parseCode(vals);
    return paramVals.body.length >0? getParamValues(paramVals.body[0].expression, func.body[0].params):{};
}

function makeGraphString(func,vals){
    let parsedFunc = parseCode(func);
    const cfg = makeCFG(getGraph(parsedFunc),getParams(parsedFunc,vals));
    const cfgStr = esgraph.dot(cfg);
    return buildCFGNodes(cfgStr,cfg[2]);
}
