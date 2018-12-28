import $ from 'jquery';
import * as flowchart from 'flowchart.js';
import {parseCode} from './code-analyzer';
import {makeCFG, buildCFGNodes} from './cfgMaker';
import * as esgraph from 'esgraph';
import {getParamValues} from './flowSelector';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        $('#CFG').empty();
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        let params = parseCode($('#paramsInput').val());
        let paramValues = params.body.length >0? getParamValues(params.body[0].expression, parsedCode.body[0].params): {};
        const cfg = makeCFG(esgraph(parsedCode.body[0].body),paramValues);
        const cfgStr = esgraph.dot(cfg,{counter: 0});
        $('#parsedCode').val(cfgStr);
        drawCFG(cfgStr,cfg[2]);
    });
});

function drawCFG(cfgStr,nodes){
    let cfgData = buildCFGNodes(cfgStr,nodes); let cfg = '';
    for(let node in cfgData[0]){
        cfg += buildNodeStr(cfgData[0][node]);
    }
    cfg += '\n';
    for(let i=0;i<cfgData[1].length;i++){
        let tr = cfgData[1][i];
        cfg += tr.from;
        if(cfgData[0][tr.from].type === 'condition')
            cfg += '(' + tr.cond + ')';
        cfg += '->' + tr.to + '\n';
    }
    let diagram = flowchart.parse(cfg);
    diagram.drawSVG('CFG',{'yes-text': 'T', 'no-text': 'F', 'flowstate' : {
        'request' : { 'fill' : 'green', 'font-color' : 'green'}, 'invalid': {'font-color' : 'white'}, 'approved' : { 'fill' : 'green' }
    }});
}

function buildNodeStr(node){
    let str = node.name + '=>' + node.type + ': ';
    if ('index' in node)
        str += '(' + node.index + ')\n';
    str += node.text;
    if('flowstate' in node)
        str += '|' + node.flowstate;
    str += '\n';
    return str;
}
