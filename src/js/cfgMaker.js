import {getLabel} from './labelGetter';
export {makeCFG, buildCFGNodes};

function getLabels(cfg){
    cfg[2].forEach(function(node) {
        node.label = getLabel(node.astNode);
    });
    return cfg;
}

function setNext(parent, node, next){
    if('normal' in parent){
        if(next !== undefined) parent.normal = next;
        else delete parent.normal;
    }
    else if (parent.true === node)
        parent.true = next;
    else
        parent.false = next;
    return parent;
}

function deleteNode(node) {
    let next = 'normal' in node? node.normal: undefined;
    for(let i=0;i< node.prev.length;i++){
        node.prev[i] = setNext(node.prev[i],node,next);
    }
}

function trimCFG(cfg){
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

function mergeNodes(cfg){
    for(let i=0;i<cfg[2].length;i++){
        let node = cfg[2][i];
        if ('normal' in node){
            let next = node.normal;
            if (next.prev.length === 1 && 'normal' in next){
                next.label = node.label + '\n' + next.label;
                deleteNode(node);
                delete cfg[2][i];
            }
        }
    }
    cfg[2] = cfg[2].filter(value => Object.keys(value).length !== 0);
    return cfg;
}

function makeCFG(cfg){
    let newCFG = trimCFG(getLabels(cfg));
    return mergeNodes(newCFG);
}

function getNode(nodeStr){
    let arr = nodeStr.split(' [');
    return {name: arr[0], text: arr[1].substring(arr[1].indexOf('"') + 1,arr[1].lastIndexOf('"'))};
}

function getTransition(trStr){
    let arr = trStr.split(' ');
    let cond = arr[3].substring(arr[3].indexOf('[') +1);
    let condStr = cond.indexOf('"') === -1 ? '': cond.substring(cond.indexOf('"') + 1,cond.lastIndexOf('"'));
    if(condStr !== '')
        condStr = condStr === 'true'? 'yes':'no';
    return {from: arr[0], to: arr[2],cond: condStr};
}

function buildCFGNodes(cfgStr){
    let lines = cfgStr.split(']\n');
    let nodes = {}; let transitions = [];
    for(let i=0;i<lines.length;i++){
        let line = lines[i];
        if(line === '') continue;
        if(line.indexOf('->') === -1){
            let node = getNode(line);
            nodes[node.name] = node;
        } else{
            let transition = getTransition(line);
            if(transition.cond === '')
                nodes[transition.from].type = 'operation';
            else
                nodes[transition.from].type = 'condition';
            transitions.push(transition);
        }
    }
    for (let node in nodes){
        if (nodes[node].type === undefined)
            nodes[node].type = 'operation';
    }
    return [nodes,transitions];
}