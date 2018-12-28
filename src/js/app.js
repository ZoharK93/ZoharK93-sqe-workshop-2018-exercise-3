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
        let paramValues = getParamValues(params.body[0].expression, parsedCode.body[0].params);
        const cfg = makeCFG(esgraph(parsedCode.body[0].body),paramValues);
        const cfgStr = esgraph.dot(cfg);
        $('#parsedCode').val(cfgStr);
        drawCFG(cfgStr,cfg[2]);
    });
});

function drawCFG(cfgStr,nodes){
    let cfgData = buildCFGNodes(cfgStr,nodes);
    let cfg = '';
    for(let node in cfgData[0]){
        cfg += cfgData[0][node].name + '=>' + cfgData[0][node].type + ': ' + cfgData[0][node].text;
        if('flowstate' in cfgData[0][node])
            cfg += '|' + cfgData[0][node].flowstate;
        cfg += '\n';
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
        'request' : { 'fill' : 'green', 'font-color' : 'green'}, 'invalid': {'font-color' : 'white'}, 'approved' : { 'fill' : 'green' }
    }});
}
