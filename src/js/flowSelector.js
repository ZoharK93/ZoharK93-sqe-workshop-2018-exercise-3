export {getParamValues, getFlow};

const evalFunc = {
    Literal: evalLiteral,
    Identifier: evalIdentifier,
    ArrayExpression: evalArrayExpression,
    ExpressionStatement: evalExpressionStatement,
    VariableDeclaration: evalVariableDeclaration,
    BinaryExpression: evalBinaryExpression,
    UnaryExpression: evalUnaryExpression,
    UpdateExpression: evalUpdateExpression,
    MemberExpression: evalMemberExpression,
    ReturnStatement: evalReturnStatement,
    AssignmentExpression: evalAssignmentExpression,
};


function evalExpressionStatement(node, vars){
    return evaluate(node.expression,vars);
}

function evalVariableDeclaration(node, vars){
    let arg = node.declarations[0];
    let val = evaluate(arg.init,vars);
    vars[arg.id.name] = val;
    return arg;
}

// eslint-disable-next-line no-unused-vars
function evalLiteral(node, vars){
    return eval(node.raw);
}

function evalIdentifier(node, vars){
    return vars[node.name];
}

function evalArrayExpression(node, vars){
    let arr = [];
    for(let i=0;i<node.elements.length;i++)
        arr.push(evaluate(node.elements[i],vars));
    return arr;
}

function evalMemberExpression(node, vars){
    let name = node.object.name;
    return vars[name][node.property.value];
}

function evalBinaryExpression(node, vars){
    let left = evaluate(node.left, vars);
    let right = evaluate(node.right, vars);
    return eval(left + ' ' + node.operator + ' ' + right);
}

function evalUnaryExpression(node, vars){
    let arg = evaluate(node.argument, vars);
    return node.prefix? eval(node.operator + '' + arg):eval(arg + '' + node.operator);
}

function evalUpdateExpression(node, vars){
    let arg = evaluate(node.argument, vars);
    return node.operator === '++'? eval(arg + ' + 1'): eval(arg + ' - 1');
}

// eslint-disable-next-line no-unused-vars
function evalReturnStatement(node, vars){
    return null;
}

function evalAssignmentExpression(node, vars){
    let val = evaluate(node.right,vars);
    let arg = node.left;
    if (arg.type === 'Identifier')
        vars[arg.name] = val;
    else
        vars[arg.object.name][arg.property.value] = val;
    return arg;
}

function getFlow(cfg, vars){
    if (cfg === null || cfg === undefined) return '';
    if ('flowstate' in cfg){
        getFlow(cfg.false, vars);
        return;
    }

    cfg['flowstate'] = 'approved';
    let res = evaluate(cfg.astNode,vars);
    let nextNode = selectNextNode(cfg, vars, res);
    getFlow(nextNode, vars);
    //return cfg;
}

function evaluate(cfg, vars){
    let func = evalFunc[cfg.type];
    return func(cfg, vars);
}

function selectNextNode(cfg, vars, res){
    if (res === null) return null;
    if('normal' in cfg)
        return cfg.normal;
    else if (res)
        return cfg.true;
    else
        return cfg.false;
}

function getParamValues(values, funcParams){
    let paramValues = {};
    if (values.type !== 'SequenceExpression') {
        paramValues[funcParams[0].name] = evaluate(values,{});
    }
    else{
        for(let i=0;i<funcParams.length;i++){
            let param = funcParams[i];
            paramValues[param.name] = evaluate(values.expressions[i]);
        }
    }
    return paramValues;
}