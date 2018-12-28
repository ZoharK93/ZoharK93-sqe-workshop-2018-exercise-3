import $ from 'jquery';
import * as flowchart from 'flowchart.js';
import {parseCode} from './code-analyzer';
import {makeCFG, buildCFGNodes} from './cfgMaker';
import * as esgraph from 'esgraph';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        $('#CFG').empty();
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        let params = $('#paramsInput').val().split(', ');
        let paramValues = getParamValues(params, parsedCode.body[0].params);
        const cfg = makeCFG(esgraph(parsedCode.body[0].body));
        const cfgStr = esgraph.dot(cfg);
        $('#parsedCode').val(cfgStr);
        drawCFG(cfgStr);
    });
});

function drawCFG(cfgStr){
    let cfgData = buildCFGNodes(cfgStr);
    let cfg = '';
    for(let node in cfgData[0]){
        cfg += cfgData[0][node].name + '=>' + cfgData[0][node].type + ': ' + cfgData[0][node].text +'\n';
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
    diagram.drawSVG('CFG',{'flowstate' : {
        'request' : { 'font-color' : 'green'}, 'invalid': {'font-color' : 'white'}, 'approved' : { 'fill' : 'green' }
    }});
}

function getParamValues(values, funcParams){
    let paramValues = {};
    for(let i=0;i<funcParams.length;i++){
        let param = funcParams[i];
        let val = values[i];
        paramValues[param.name] = val;
    }
    return paramValues;
}
