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
        const cfg = esgraph(parsedCode.body[0].body);
        const cfgStr = esgraph.dot(makeCFG(cfg));
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
    diagram.drawSVG('CFG');
}
