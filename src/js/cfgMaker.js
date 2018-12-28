import {getLabel} from './labelGetter';
import {getFlow} from './flowSelector';
export {makeCFG, buildCFGNodes};

function getLabels(cfg){
    cfg[2].forEach(function(node) {
        node.label = getLabel(node.astNode);
    });
    return cfg;
}

function setNext(parent, node, next){
    if('normal' in parent){
        parent.normal = next;
    }
    else if (parent.true.astNode === node.astNode)
        parent.true = next;
    else
        parent.false = next;
    return parent;
}

function deleteNode(node) {
    let next = node.normal;
    for(let i=0;i< node.prev.length;i++){
        node.prev[i] = setNext(node.prev[i],node,next);
    }
    next.prev = node.prev;
}

function trimCFG(cfg){
    cfg[0] = cfg[0].next;
    delete cfg[2][0];
    cfg[2][1].parent = undefined; cfg[2][1].prev = [];
    for(let i=1;i<cfg[2].length;i++) {
        let node = cfg[2][i];
        delete node.exception;
        if (node.label === '') delete cfg[2][i];
        else if (node.label.startsWith('return '))
            delete node.normal;
    }
    cfg[2] = cfg[2].filter(value => Object.keys(value).length !== 0);
    return cfg;
}

// eslint-disable-next-line complexity
function mergeNodes(cfg){
    for(let i=0;i<cfg[2].length;i++){
        let node = cfg[2][i];
        if ('normal' in node){
            let next = node.normal;
            if (next.prev.length === 1 && !('true' in next)){
                next.label = node.label + '\n' + next.label;
                deleteNode(node);
                delete cfg[2][i];
            }
        }
    }
    cfg[2] = cfg[2].filter(value => Object.keys(value).length !== 0);
    for(let i=0;i<cfg[2].length;i++)
        cfg[2][i].xlabel = ''+i;
    return cfg;
}

function makeCFG(cfg,params){
    let newCFG = trimCFG(getLabels(cfg));
    getFlow(newCFG[0][0],params);
    return mergeNodes(newCFG);
}

function getNode(nodeStr){
    let arr = nodeStr.split(' [label="');
    return {name: arr[0], index: parseInt(arr[0].substring(1)), text: arr[1].substring(0,arr[1].lastIndexOf('"'))};
}

function getTransition(trStr){
    let arr = trStr.split(' ');
    let cond = arr[3].substring(arr[3].indexOf('[') +1);
    let condStr = cond.indexOf('"') === -1 ? '': cond.substring(cond.indexOf('"') + 1,cond.lastIndexOf('"'));
    if(condStr !== '')
        condStr = condStr === 'true'? 'yes':'no';
    return {from: arr[0], to: arr[2],cond: condStr};
}

function buildCFGNodes(cfgStr, nodesData){
    let lines = cfgStr.split(']\n'); let nodes = {}; let transitions = [];
    for(let i=0;i<lines.length;i++){
        let line = lines[i]; if(line === '') continue;
        if(line.indexOf('->') === -1){
            let node = getNode(line);
            nodes[node.name] = node;
            nodes[node.name].flowstate = getNodeState(node.text, nodesData);
        } else{
            let transition = getTransition(line);
            if(transition.cond === '')
                nodes[transition.from].type = 'operation';
            else
                nodes[transition.from].type = 'condition';
            transitions.push(transition);
        }
    }
    transitions = addMergingNodesAndEnds(nodes,transitions);
    return [nodes,transitions];
}

function addMergingNodesAndEnds(nodes, transitions){
    let mergeCount = 0;
    let regNodes = Object.keys(nodes).length;
    for (let node in nodes){
        if (nodes[node].type === undefined)
            nodes[node].type = 'operation';
        let inTrs = transitions.filter(tr => tr.to === node);
        if(inTrs.length > 1){
            let nodeName = 'm'+mergeCount;
            nodes[nodeName] = {name: nodeName, text: ' \\\\', type: 'start'};
            transitions = transitions.filter(tr => tr.to !== node);
            nodes[nodeName].flowstate = getMergeFlowState(inTrs, nodes);
            for(let i=0;i<inTrs.length;i++)
                transitions.push({from:inTrs[i].from, to: nodeName, cond: inTrs[i].cond});
            transitions.push({from: nodeName, to: node, cond: ''});
            mergeCount++;
        }
    }
    return sortTransitions(transitions,regNodes);
}

// eslint-disable-next-line complexity
function sortTransitions(transitions,regNodes){
    let sortedTrs = [];
    let index = 0; let prefix = 'n';
    while(sortedTrs.length < transitions.length){
        for(let i=0;i<transitions.length;i++){
            let tr = transitions[i];
            if(tr.from.startsWith(prefix) && parseInt(tr.from.substring(1)) === index)
                sortedTrs.push(tr);
        }
        if(index === regNodes){
            prefix = 'm'; index = 0;
        }
        else
            index++;
    }
    return sortedTrs;
}

function getNodeState(nodeText, nodes) {
    let state = undefined;
    for(let i=0;i<nodes.length;i++){
        if (nodes[i].label === nodeText){
            state = nodes[i].flowstate;
            break;
        }
    }
    return state;

}

function getMergeFlowState(inTrs, nodes) {
    for(let i=0;i<inTrs.length;i++){
        if (nodes[inTrs[i].from].flowstate === 'approved')
            return 'request';
    }
    return 'invalid';

}